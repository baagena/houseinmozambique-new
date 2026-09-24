# App Store listing — House in Mozambique (iOS)

Everything App Store Connect asks for, ready to paste. Character limits are
Apple's; every text below is already within them.

Screenshots: `screenshots/iphone-6.9/` — six PNGs at 1320 × 2868 (iPhone 6.9"),
RGB, no transparency. Upload them in this order under **iPhone 6.9" Display**.
Apple scales them down for smaller iPhones, so no other size is needed. The app
is set to **iPhone only**, so no iPad screenshots are required.
`screenshots/raw/` has the unframed captures (sign-up, delete account, etc.)
if you want to attach them to the review notes.

---

## App information

| Field | Value |
|---|---|
| Name (30) | `House in Mozambique` |
| Subtitle (30) | `Casas e terrenos em Moçambique` |
| Bundle ID | `com.houseinmozambique.mobile` |
| SKU | `houseinmozambique-ios` |
| Primary language | Portuguese (Portugal) |
| Primary category | Lifestyle |
| Secondary category | Business |
| Content rights | Does not contain third-party content that requires rights (listings are posted by agents who own or represent the properties) |
| Price | Free |
| Availability | All countries (or at least Mozambique, Portugal, South Africa) |

## Version 1.2.1 — Portuguese (Portugal)

**Promotional text (170)**

```
Encontre casas, apartamentos e terrenos à venda e para arrendar em todo Moçambique. Agentes: anuncie o seu imóvel em minutos — o anúncio escreve-se sozinho.
```

**Description (4000)**

```
House in Mozambique é a forma mais simples de encontrar ou anunciar um imóvel em Moçambique.

PARA QUEM PROCURA CASA
• Casas, apartamentos, terrenos, espaços comerciais e casas de praia
• Comprar, arrendar ou estadias curtas — em Maputo, Matola, Beira, Inhambane, Vilanculos, Pemba, Nampula e em todo o país
• Fotos, preço, áreas, quartos e casas de banho de cada imóvel
• Contacte o agente directamente por telefone, WhatsApp ou e-mail
• Guarde os seus favoritos e acompanhe-os em todos os dispositivos

PARA AGENTES E PROPRIETÁRIOS
• Anuncie um imóvel em 7 passos simples, pensados para o mercado moçambicano: bairro, números, estado, mobília, DUAT, acesso ao terreno e muito mais
• O título e a descrição são escritos automaticamente a partir das suas respostas, em português e em inglês
• Uma pontuação de qualidade mostra o que falta antes de publicar
• Receba os contactos dos interessados no seu painel
• Todos os anúncios são revistos pela nossa equipa antes de serem publicados

SEGURANÇA E PRIVACIDADE
• Pode eliminar a sua conta a qualquer momento, directamente na app
• Qualquer anúncio pode ser denunciado à nossa equipa

House in Mozambique — encontre o seu lugar em Moçambique.
```

**Keywords (100)**

```
casas,imóveis,arrendar,comprar,terrenos,apartamento,moradia,Maputo,Matola,Beira,imobiliária,aluguer
```

**What's new in this version (4000)**

```
• Novo assistente para anunciar imóveis: responda às perguntas e o anúncio escreve-se sozinho
• Aceitação dos Termos de Serviço e da Política de Privacidade no registo
• Eliminar conta directamente no perfil
• Denunciar anúncios
• Toda a app em português
```

## Optional — English (U.K.) localisation

Add it under *App Information → Localizable Information* if you want English
buyers to see an English page.

- Subtitle: `Homes and land in Mozambique`
- Promotional text: `Find houses, apartments and land for sale and rent across Mozambique. Agents: list a property in minutes — the listing writes itself.`
- Keywords: `houses,property,rent,buy,land,apartment,real estate,Maputo,Matola,Beira,villa,home,expat`

## URLs

| Field | Value |
|---|---|
| Support URL | `https://www.houseinmozambique.com/contact` |
| Marketing URL | `https://www.houseinmozambique.com` |
| Privacy Policy URL | `https://www.houseinmozambique.com/privacy` |
| Terms (put in the description or EULA field if asked) | `https://www.houseinmozambique.com/terms` |
| Account deletion info (web) | `https://www.houseinmozambique.com/delete-account` |

Copyright: `2026 House in Mozambique, Lda`

## Age rating

Answer **None / No** to every content question (violence, sexual content,
gambling, medical, alcohol, etc.). For:

- *Unrestricted web access*: **No** (the app only opens its own Terms and
  Privacy pages and agents' WhatsApp/phone/e-mail).
- *User-generated content*: **Yes** — agents post listings. They are
  moderated (admin approval before publishing) and can be reported from the
  listing's ⋮ menu.
- *Messaging / chat between users*: **No** (contact goes out through phone,
  WhatsApp or e-mail, not an in-app chat).

Expected result: **4+** (Apple may show 12+ because of user-generated content;
either is fine).

## App Privacy ("nutrition label")

*Do you or your third-party partners collect data from this app?* → **Yes**

| Data type | Collected | Linked to user | Used for tracking | Purpose |
|---|---|---|---|---|
| Name | Yes | Yes | No | App functionality |
| Email address | Yes | Yes | No | App functionality |
| Phone number | Yes | Yes | No | App functionality |
| Photos or videos | Yes (listing photos agents upload) | Yes | No | App functionality |
| Other user content (listings, contact messages) | Yes | Yes | No | App functionality |
| User ID | Yes | Yes | No | App functionality |

Not collected: location, contacts, browsing history, search history,
purchases, financial info, health, diagnostics, advertising data.
**No tracking** (no third-party analytics or ad SDKs in the app).

## Export compliance

Already answered in the build (`ITSAppUsesNonExemptEncryption = NO` in
Info.plist): the app only uses standard HTTPS. App Store Connect will not ask.

## App Review information

**Sign-in required**: Yes. The review account already exists on the live
site and is hidden from the public agent directory:

- User name: `app.review@houseinmozambique.com`
- Password: kept out of this repository — it was handed over separately. To
  reset it: `REVIEW_EMAIL=app.review@houseinmozambique.com REVIEW_PASSWORD='…' node scripts/create-review-account.mjs`

**Contact**: your name, phone number and e-mail.

**Notes** (paste, in English — reviewers read English):

```
House in Mozambique is a real-estate marketplace for Mozambique. Anyone can browse listings without an account. Agents and property owners sign in to post listings.

Demo account (agent): app.review@houseinmozambique.com / <PASSWORD>

- Sign-up: Profile > "Criar conta". The account cannot be created until the Terms of Service and Privacy Policy checkbox is ticked; both are linked and open in the app.
- Account deletion: Profile > "Eliminar conta" (asks for the password, then permanently deletes the account, its favourites and its listings).
- Posting a listing: tap "Anunciar" in the tab bar. The agent answers seven steps of questions and the title and description are generated from the answers. Every listing is reviewed by our team before it is published.
- Reporting content: on any listing, the ⋮ menu > "Denunciar este anúncio" sends a report to our team.
- There are no purchases, subscriptions or payments in the iOS app. Posting on iOS is free.
- The app is in Portuguese (the language of Mozambique); English can be selected in Profile > Definições.
```

## Before you press "Submit for Review"

1. Done 2026-09-24: the live site runs this code (master, deployed by Vercel)
   and the production database has `Agent.termsAcceptedAt`.
2. Done: the review account above signs in on the live site.
3. The TestFlight build has been installed on a real iPhone and you have:
   created an account, posted a listing, reported a listing, deleted an account.
