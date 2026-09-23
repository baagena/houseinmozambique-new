'use client';

/**
 * "Tell us what you are looking for."
 *
 * The other direction of the whole platform. Everything else here asks an
 * agent to describe a property; this asks a buyer to describe a requirement,
 * and then takes it to the agents rather than leaving them to find it.
 *
 * Kept deliberately short. Every field beyond the four that are required is a
 * reason to close the tab, and an agent can ask the rest on the phone — which
 * is the point of the exercise.
 */

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useLanguage } from '@/components/i18n/LanguageContext';

const CITIES = ['Maputo', 'Matola', 'Beira', 'Nampula', 'Tete', 'Quelimane', 'Pemba', 'Inhambane', 'Xai-Xai', 'Chimoio'];
const TYPES = ['House', 'Apartment', 'Land', 'Studio', 'Villa', 'Commercial'];

export default function PropertyRequestForm() {
  const { lang } = useLanguage();
  const pt = lang === 'pt';

  const [form, setForm] = useState({
    intent: 'rent',
    city: 'Maputo',
    propertyType: '',
    areas: '',
    budgetMin: '',
    budgetMax: '',
    currency: 'MZN',
    minBeds: '',
    moveBy: '',
    notes: '',
    name: '',
    email: '',
    phone: '',
    anonymous: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/property-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send that.');
      setRef(data.ref);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that.');
    } finally {
      setBusy(false);
    }
  }

  if (ref) {
    return (
      <div className="prq prq--done">
        <span className="prq-tick"><Icon name="check" size={22} /></span>
        <h2>{pt ? 'Pedido recebido' : 'Request received'}</h2>
        <p>
          {pt
            ? <>A sua referência é <strong>{ref}</strong>. Verificamos cada pedido à mão antes de o enviar aos agentes — normalmente em poucas horas.</>
            : <>Your reference is <strong>{ref}</strong>. We check every request by hand before it goes out to agents — usually within a few hours.</>}
        </p>
        <p className="prq-quiet">
          {pt
            ? 'Depois disso, os agentes com imóveis compatíveis contactam-no directamente. Não precisa de fazer mais nada.'
            : 'After that, agents with matching properties contact you directly. You do not need to do anything else.'}
        </p>
      </div>
    );
  }

  return (
    <form className="prq" onSubmit={submit}>
      <fieldset>
        <legend>{pt ? 'O que procura' : 'What you are looking for'}</legend>

        <div className="prq-row">
          <label className="prq-field">
            <span>{pt ? 'Quero' : 'I want to'}</span>
            <select value={form.intent} onChange={(e) => set('intent', e.target.value)}>
              <option value="rent">{pt ? 'Arrendar' : 'Rent'}</option>
              <option value="sale">{pt ? 'Comprar' : 'Buy'}</option>
              <option value="short stay">{pt ? 'Estadia curta' : 'Book a short stay'}</option>
            </select>
          </label>

          <label className="prq-field">
            <span>{pt ? 'Cidade' : 'City'}</span>
            <select value={form.city} onChange={(e) => set('city', e.target.value)}>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label className="prq-field">
            <span>{pt ? 'Tipo de imóvel' : 'Property type'}</span>
            <select value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
              <option value="">{pt ? 'Qualquer' : 'Any'}</option>
              {TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          </label>
        </div>

        <label className="prq-field">
          <span>{pt ? 'Bairros que lhe servem' : 'Areas that would suit you'}</span>
          <input
            value={form.areas}
            onChange={(e) => set('areas', e.target.value)}
            placeholder={pt ? 'ex. Costa do Sol, Sommerschield, Polana' : 'e.g. Costa do Sol, Sommerschield, Polana'}
            maxLength={200}
          />
          {/* Free text on purpose: a buyer knows the two or three bairros that
              work for them far better than a dropdown we would have to keep. */}
        </label>

        <div className="prq-row">
          <label className="prq-field">
            <span>{pt ? 'Orçamento mínimo' : 'Budget from'}</span>
            <input value={form.budgetMin} onChange={(e) => set('budgetMin', e.target.value)} inputMode="decimal" placeholder="0" />
          </label>
          <label className="prq-field">
            <span>{pt ? 'Orçamento máximo' : 'Budget up to'}</span>
            <input value={form.budgetMax} onChange={(e) => set('budgetMax', e.target.value)} inputMode="decimal" placeholder="50 000" />
          </label>
          <label className="prq-field">
            <span>{pt ? 'Moeda' : 'Currency'}</span>
            <select value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              <option value="MZN">MZN</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className="prq-field">
            <span>{pt ? 'Quartos (mínimo)' : 'Bedrooms (min)'}</span>
            <input value={form.minBeds} onChange={(e) => set('minBeds', e.target.value)} inputMode="numeric" placeholder="2" />
          </label>
        </div>

        <div className="prq-row">
          <label className="prq-field">
            <span>{pt ? 'Precisa de entrar até' : 'Need to move in by'}</span>
            <input type="date" value={form.moveBy} onChange={(e) => set('moveBy', e.target.value)} />
          </label>
        </div>

        <label className="prq-field">
          <span>{pt ? 'Mais alguma coisa?' : 'Anything else?'}</span>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            maxLength={1200}
            placeholder={pt
              ? 'ex. mobilado, com estacionamento, perto da Escola Portuguesa'
              : 'e.g. furnished, with parking, near the Escola Portuguesa'}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>{pt ? 'Como o contactam' : 'How they reach you'}</legend>

        <div className="prq-row">
          <label className="prq-field">
            <span>{pt ? 'Nome' : 'Name'}</span>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} autoComplete="name" />
          </label>
          <label className="prq-field">
            <span>{pt ? 'E-mail' : 'Email'}</span>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required maxLength={200} autoComplete="email" />
          </label>
          <label className="prq-field">
            <span>{pt ? 'Telefone (opcional)' : 'Phone (optional)'}</span>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} maxLength={40} inputMode="tel" autoComplete="tel" />
          </label>
        </div>

        {/* The buyer's defence against handing a phone number to every agent
            on the platform at once. */}
        <label className="prq-check">
          <input type="checkbox" checked={form.anonymous} onChange={(e) => set('anonymous', e.target.checked)} />
          <span>
            <strong>{pt ? 'Não mostrar os meus contactos à partida' : 'Keep my contact details hidden at first'}</strong>
            <small>
              {pt
                ? 'Os agentes vêem o que procura e só recebem os seus contactos quando respondem ao pedido.'
                : 'Agents see what you are looking for, and only get your details once they respond to it.'}
            </small>
          </span>
        </label>
      </fieldset>

      {error && <p className="prq-err"><Icon name="error" size={15} />{error}</p>}

      <div className="prq-actions">
        <button className="btn btn--dark" disabled={busy}>
          {busy ? (pt ? 'A enviar…' : 'Sending…') : (pt ? 'Enviar pedido' : 'Send my request')}
        </button>
        <span className="prq-quiet">
          {pt ? 'Gratuito. Sem compromisso.' : 'Free. No obligation.'}
        </span>
      </div>
    </form>
  );
}
