'use client';

/**
 * Paying by hand, in two steps.
 *
 * The first version of this put everything on screen at once: the accounts, the
 * reference, and a four-field proof form — before the agent had sent a metical.
 * That reads as a form to fill in rather than a payment to make, and three of
 * those four fields were optional, so the work looked several times bigger than
 * it is.
 *
 * It is really two moments with a trip to M-Pesa in between, so it is two
 * steps:
 *
 *   1 · PAY      one account, one reference, one button.
 *   2 · CONFIRM  one field.
 *
 * Everything that is not needed to finish the current step is either on the
 * other step or behind a disclosure. The extras still exist — a second account,
 * the sending number, a note — because the awkward cases need them; they are
 * just not in the way of the ordinary one.
 */

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import type { PaymentInstructions } from '@/lib/payment-instructions';

export interface OpenPaymentView {
  id: string;
  orderRef: string;
  amountMinor: number;
  currency: string;
  planType: string;
  planName: string | null;
  status: string;
  payerReference: string | null;
  payerMsisdn: string | null;
  proofUrl: string | null;
  proofNote: string | null;
  submittedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

/** Matches MAX_PROOF_BYTES on the route. */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function money(minor: number, currency: string, pt: boolean) {
  const major = minor / 100;
  return `${new Intl.NumberFormat(pt ? 'pt-PT' : 'en-GB', {
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major)} ${currency}`;
}

/** Copy, and say so on the control itself rather than in a toast. */
function Copy({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`copy-btn${copied ? ' is-done' : ''}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Blocked on insecure origins and in some in-app browsers. The value
          // is on screen regardless, so this stays silent.
        }
      }}
    >
      <Icon name={copied ? 'check' : 'content_copy'} size={14} />
      {copied ? label.split('|')[1] : label.split('|')[0]}
    </button>
  );
}

interface Destination {
  icon: string;
  label: string;
  value: string;
}

export default function PaymentProofPanel({
  payment, instructions, destinationConfigured, pt,
}: {
  payment: OpenPaymentView;
  instructions: PaymentInstructions;
  destinationConfigured: boolean;
  pt: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  /*
   * Rejected goes straight to step 2: they have already paid, and the only
   * thing left is to send a code that matches. Starting them at "here is where
   * to pay" would read as an instruction to pay twice.
   */
  const [onConfirm, setOnConfirm] = useState(payment.status === 'REJECTED');
  const [showOther, setShowOther] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  const [reference, setReference] = useState(payment.payerReference ?? '');
  const [msisdn, setMsisdn] = useState(payment.payerMsisdn ?? '');
  const [note, setNote] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const amount = money(payment.amountMinor, payment.currency, pt);
  const planLabel = payment.planName ?? payment.planType;

  const all: Destination[] = [
    instructions.mpesaNumber && { icon: 'smartphone', label: 'M-Pesa', value: instructions.mpesaNumber },
    instructions.emolaNumber && { icon: 'smartphone', label: 'e-Mola', value: instructions.emolaNumber },
    instructions.bankAccount && {
      icon: 'account_balance',
      label: instructions.bankName || (pt ? 'Banco' : 'Bank'),
      value: instructions.bankAccount,
    },
    instructions.bankIban && { icon: 'account_balance', label: 'IBAN', value: instructions.bankIban },
  ].filter(Boolean) as Destination[];

  /* One account leads. The rest are real but rarely the answer, so they sit
     behind a line of text instead of a list of four equal options. */
  const [primary, ...others] = all;

  function pickFile(file: File | null) {
    setError(null);
    if (!file) {
      setImageData(null);
      setImageName(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError(pt ? 'Escolha uma imagem.' : 'Choose an image.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(pt ? 'Imagem grande demais — até 4 MB.' : 'That image is too large — up to 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(typeof reader.result === 'string' ? reader.result : null);
      setImageName(file.name);
    };
    reader.onerror = () => setError(pt ? 'Não foi possível ler o ficheiro.' : 'That file could not be read.');
    reader.readAsDataURL(file);
  }

  function clearFile() {
    setImageData(null);
    setImageName(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit() {
    const ref = reference.trim();
    if (!ref && !imageData) {
      setError(pt
        ? 'Escreva o código ou anexe um print.'
        : 'Enter the code or attach a screenshot.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/payments/${payment.id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerReference: ref,
          payerMsisdn: msisdn.trim(),
          proofNote: note.trim(),
          proofBase64: imageData ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send that.');
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send that.');
    } finally {
      setBusy(false);
    }
  }

  /* ── Submitted: three facts and a reassurance ─────────────────────────── */
  if (payment.status === 'SUBMITTED' || done) {
    return (
      <div className="card pay-card">
        <div className="pay-done">
          <span className="pay-done-ico"><Icon name="check" size={18} /></span>
          <div>
            <h3>{pt ? 'Recebemos o seu comprovativo' : 'We have your proof'}</h3>
            <p>
              {pt
                ? <>Confirmamos <strong>{amount}</strong> contra o extrato e o plano fica activo a seguir. Não envie o dinheiro outra vez.</>
                : <>We check <strong>{amount}</strong> against the statement and your plan goes live straight after. Do not send the money again.</>}
            </p>
            <p className="pay-done-ref">
              {payment.orderRef}
              {payment.payerReference ? ` · ${payment.payerReference}` : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 2 · Confirm ─────────────────────────────────────────────────── */
  if (onConfirm) {
    return (
      <div className="card pay-card">
        <div className="pay-head">
          <div>
            <p className="pay-step">{pt ? 'Passo 2 de 2' : 'Step 2 of 2'}</p>
            <h3>{pt ? 'Confirme o pagamento' : 'Confirm your payment'}</h3>
          </div>
          <span className="pay-plan">{amount}</span>
        </div>

        <div className="pay-body">
          {payment.status === 'REJECTED' && payment.reviewNote && (
            <div className="pay-note pay-note--bad">
              <Icon name="error" size={16} />
              <div>
                <strong>{pt ? 'Não conseguimos confirmar o último envio' : 'We could not confirm the last one'}</strong>
                <span>{payment.reviewNote}</span>
              </div>
            </div>
          )}

          <label className="pay-field">
            <span className="pay-label">{pt ? 'Código de confirmação do SMS' : 'Confirmation code from the SMS'}</span>
            <input
              value={reference}
              onChange={(e) => { setReference(e.target.value); setError(null); }}
              placeholder="CI250922.1430.A12345"
              maxLength={64}
              autoComplete="off"
              autoFocus
            />
          </label>

          {/* The alternative, stated as one. Two equally weighted upload and
              text controls made it look as though both were required. */}
          {imageName ? (
            <div className="pay-file">
              <Icon name="image" size={16} />
              <span>{imageName}</span>
              <button type="button" onClick={clearFile} aria-label={pt ? 'Remover' : 'Remove'}>
                <Icon name="close" size={14} />
              </button>
            </div>
          ) : (
            <button type="button" className="pay-alt" onClick={() => fileRef.current?.click()}>
              <Icon name="photo_camera" size={15} />
              {pt ? 'ou anexe um print do SMS' : 'or attach a screenshot of the SMS'}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />

          {showExtras ? (
            <div className="pay-extras">
              <label className="pay-field">
                <span className="pay-label">{pt ? 'Número de onde enviou' : 'Number you sent from'}</span>
                <input value={msisdn} onChange={(e) => setMsisdn(e.target.value)} placeholder="8X XXX XXXX" maxLength={32} inputMode="tel" />
              </label>
              <label className="pay-field">
                <span className="pay-label">{pt ? 'Nota' : 'Note'}</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                  placeholder={pt ? 'ex. paguei em duas partes' : 'e.g. I paid in two parts'}
                />
              </label>
            </div>
          ) : (
            <button type="button" className="pay-more" onClick={() => setShowExtras(true)}>
              {pt ? 'Paguei pelo telefone de outra pessoa' : 'I paid from someone else’s phone'}
              <Icon name="expand_more" size={14} />
            </button>
          )}

          {error && <p className="pay-err"><Icon name="error" size={15} />{error}</p>}

          <div className="pay-actions">
            <button className="btn primary" disabled={busy} onClick={submit}>
              {busy ? (pt ? 'A enviar…' : 'Sending…') : (pt ? 'Enviar' : 'Send')}
            </button>
            {payment.status !== 'REJECTED' && (
              <button className="btn" disabled={busy} onClick={() => setOnConfirm(false)}>
                {pt ? 'Ver os dados de pagamento' : 'Back to payment details'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 1 · Pay ─────────────────────────────────────────────────────── */
  return (
    <div className="card pay-card">
      <div className="pay-head">
        <div>
          <p className="pay-step">{pt ? 'Passo 1 de 2' : 'Step 1 of 2'}</p>
          <h3>{pt ? `Pague ${amount}` : `Pay ${amount}`}</h3>
        </div>
        <span className="pay-plan">{planLabel}</span>
      </div>

      <div className="pay-body">
        {!destinationConfigured ? (
          <>
            <p className="pay-lead">
              {pt
                ? <>A sua reserva de <strong>{amount}</strong> está criada. Falta só indicarmos-lhe para onde enviar — a equipa envia os dados de pagamento e confirmamos assim que chegar.</>
                : <>Your <strong>{amount}</strong> is reserved. All that is missing is where to send it — the team will send you the payment details and confirm it as soon as it arrives.</>}
            </p>

            <div className="pay-rows">
              <div className="pay-row">
                <span className="pay-row-k">{pt ? 'A sua referência' : 'Your reference'}</span>
                <span className="pay-row-v">
                  <strong className="pay-ref">{payment.orderRef}</strong>
                  <em>{pt ? 'guarde-a' : 'keep it'}</em>
                </span>
                <Copy value={payment.orderRef} label={pt ? 'Copiar|Copiado' : 'Copy|Copied'} />
              </div>
            </div>
          </>
        ) : (
          <div className="pay-rows">
            <div className="pay-row">
              <span className="pay-row-k">{pt ? 'Enviar para' : 'Send to'}</span>
              <span className="pay-row-v">
                <Icon name={primary.icon} size={15} />
                <strong>{primary.value}</strong>
                <em>{primary.label}</em>
              </span>
              <Copy value={primary.value} label={pt ? 'Copiar|Copiado' : 'Copy|Copied'} />
            </div>

            <div className="pay-row">
              <span className="pay-row-k">{pt ? 'Referência' : 'Reference'}</span>
              <span className="pay-row-v">
                <strong className="pay-ref">{payment.orderRef}</strong>
                <em>{pt ? 'escreva na descrição' : 'write it in the description'}</em>
              </span>
              <Copy value={payment.orderRef} label={pt ? 'Copiar|Copiado' : 'Copy|Copied'} />
            </div>

            {instructions.accountName && (
              <div className="pay-row">
                <span className="pay-row-k">{pt ? 'Nome da conta' : 'Account name'}</span>
                <span className="pay-row-v"><strong>{instructions.accountName}</strong></span>
              </div>
            )}
          </div>
        )}

        {others.length > 0 && (
          showOther ? (
            <div className="pay-rows pay-rows--alt">
              {others.map((d) => (
                <div key={d.value} className="pay-row">
                  <span className="pay-row-k">{d.label}</span>
                  <span className="pay-row-v"><strong>{d.value}</strong></span>
                  <Copy value={d.value} label={pt ? 'Copiar|Copiado' : 'Copy|Copied'} />
                </div>
              ))}
            </div>
          ) : (
            <button type="button" className="pay-more" onClick={() => setShowOther(true)}>
              {pt ? `Outras formas de pagar (${others.length})` : `Other ways to pay (${others.length})`}
              <Icon name="expand_more" size={14} />
            </button>
          )
        )}

        {instructions.notes && <p className="pay-hint">{instructions.notes}</p>}

        {destinationConfigured ? (
          <div className="pay-actions">
            <button className="btn primary" onClick={() => setOnConfirm(true)}>
              {pt ? 'Já enviei o dinheiro' : 'I have sent the money'}
              <Icon name="arrow_forward" size={15} />
            </button>
          </div>
        ) : (
          <div className="pay-actions">
            <a className="btn primary" href={`/contact?ref=${encodeURIComponent(payment.orderRef)}`}>
              <Icon name="mail" size={15} />
              {pt ? 'Pedir os dados de pagamento' : 'Ask for the payment details'}
            </a>
            <button className="btn" onClick={() => setOnConfirm(true)}>
              {pt ? 'Já paguei' : 'I have already paid'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
