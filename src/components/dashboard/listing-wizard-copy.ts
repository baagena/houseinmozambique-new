/**
 * Every word the guided-listing wizard says, in both languages.
 *
 * The wizard shipped English-only, on the reasoning that it is a tool for the
 * agent rather than a page for a buyer. That reasoning does not survive contact
 * with the people using it: the site defaults to Portuguese, the agents are in
 * Maputo, and the form that decides how a property is described is exactly the
 * place where a half-understood question produces a bad listing.
 *
 * It lives in its own module rather than in translations.ts because these
 * strings are one screen's vocabulary — field labels, the reason behind each
 * question, the warnings — and interleaving them with the public site's copy
 * would bury both. `translations.ts` is what a visitor reads; this is what an
 * agent works in.
 *
 * The Portuguese is European Portuguese as used in Mozambique, matching the
 * rest of the site: "casa de banho", "arrendar", "anúncio".
 */

export type WizardLang = 'pt' | 'en';

const en = {
  /** Which language this is, so callers never have to infer it from a string. */
  isPt: false,
  eyebrow: 'Guided listing',
  heading: 'New listing',
  intro:
    'Answer the questions and the page writes itself — title, address, description, and everything search engines read.',
  quality: 'Quality',

  steps: ['What & where', 'The numbers', 'Details', 'Features', 'The place', 'Photos', 'Contact'],

  // Shell
  back: 'Back',
  continue: 'Continue',
  submit: 'Submit for review',
  submitting: 'Submitting…',
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  couldNotSubmit: 'Could not submit',

  verifyTitle: 'Verify your email before you publish',
  verifyBody: (where: string) =>
    `We sent a link to ${where}. You can fill this in now, but the listing cannot be submitted until the address is confirmed.`,
  yourAddress: 'your address',

  quotaUsedTitle: (quota: number, plan: string) =>
    `You have used all ${quota} listing${quota === 1 ? '' : 's'} on ${plan}`,
  quotaUsedBody:
    'Carry on and build this listing — when you submit, you can upgrade, pay for this one listing, or take an old one down to free a slot.',
  lastListingTitle: (plan: string) => `This is your last listing on ${plan}`,
  lastListingBody: 'After this one you will need a larger plan, or a single listing, to publish more.',
  /* Said up front, every time — not only when they are down to one. An agent
     who knows where they stand before filling in seven steps does not need a
     paywall to explain it to them afterwards. */
  allowanceTitle: (left: number, plan: string) =>
    `You have ${left} listing${left === 1 ? '' : 's'} left in your ${plan} plan`,
  allowanceBody: 'This one will use one of them. No extra charge.',
  allowanceUnlimited: (plan: string) => `Your ${plan} plan has no listing limit`,
  includedBadge: 'Included in your subscription',
  includedNote: 'No extra charge for this listing.',
  yourPlan: 'your plan',
  paymentStarted:
    'Payment started. Once it is confirmed your plan is active and you can submit this listing.',

  // Step 1
  whereQ: 'What are you listing, and where exactly?',
  whereWhy:
    'The bairro matters more than the street. Buyers search “Costa do Sol”, not an address — and it is what the page gets named after.',
  listingType: 'Listing type',
  propertyType: 'Property type',
  city: 'City',
  bairro: 'Bairro / neighbourhood',
  bairroPlaceholder: 'e.g. Costa do Sol',
  intentSale: 'For sale',
  intentRent: 'To rent',
  intentStay: 'Short stay',

  // Step 2
  numbersQ: 'The numbers buyers filter on',
  numbersWhy:
    'These become the filters, the schema and the headline — if a field is empty the property disappears from that search entirely.',
  price: 'Price',
  currency: 'Currency',
  num: {
    beds: 'Bedrooms',
    baths: 'Bathrooms',
    suites: 'Of those, en-suite',
    suitesHint: 'Bedrooms with their own bathroom — "T4 com 2 suítes".',
    storeys: 'Floors in the property',
    storeysHint: 'A triplex is not a flat T4, and buyers search for the difference.',
    floor: 'Which floor',
    floorHint: '0 for the ground floor. Leave blank if it does not apply.',
    parking: 'Parking spaces',
    buildingSize: 'Building size (m²)',
    landSize: 'Plot size (m²)',
    frontage: 'Frontage (m)',
    frontageHint: 'The width along the road.',
    depth: 'Depth (m)',
  },
  buildingSizeLabel: 'Building size',
  plotSizeLabel: 'Plot size',
  tooBig: (what: string, type: string) =>
    `${what} looks unusually large for ${type}. Worth checking before you publish — it goes into the headline and the search listing as well as the page.`,
  areaMismatch: (f: number, d: number, area: number, stated: number) =>
    `${f} m × ${d} m is ${area} m², but the plot size says ${stated} m². One of the three is wrong — both numbers go on the page.`,
  suitesOverBeds: 'More en-suite bedrooms than bedrooms.',
  priceNote:
    'Never type the price into the description as well — it goes stale the moment it changes, and two formats on one page reads as careless.',

  // Step 3
  plotQ: 'About the plot itself',
  buildingQ: 'About the building',
  plotWhy:
    'Zoning, the DUAT and the road are the first three things a plot buyer asks. Your agents were typing them into the listing title because this form never asked.',
  buildingWhy:
    'Condition and furnishing are what separate two otherwise identical listings — and what a buyer decides on.',
  select: 'Select…',
  question: {
    condition: 'Condition',
    furnishing: 'Furnishing',
    zoning: 'Zoned for',
    duat: 'DUAT status',
    roadSurface: 'Road to the plot',
    structures: 'Anything standing on it',
    commercialUse: 'Set up for',
  },
  choice: {
    new: 'Newly built',
    renovated: 'Recently renovated',
    good: 'Good condition',
    'needs work': 'Needs work',
    unfurnished: 'Unfurnished',
    semi: 'Semi-furnished',
    full: 'Fully furnished',
    residential: 'Residential',
    commercial: 'Commercial',
    industrial: 'Industrial',
    agricultural: 'Agricultural',
    mixed: 'Mixed use',
    'in order': 'DUAT in order',
    'in progress': 'DUAT in progress',
    none: 'None',
    unknown: 'Not confirmed',
    tarred: 'Tarred',
    gravel: 'Gravel',
    dirt: 'Dirt',
    ruin: 'A ruin',
    foundation: 'Foundations laid',
    'unfinished building': 'An unfinished building',
    office: 'Offices',
    retail: 'Retail',
    warehouse: 'Warehousing',
    restaurant: 'Restaurant',
  } as Record<string, string>,

  // Step 4
  featuresBuiltQ: 'What does it have?',
  featuresLandQ: 'What does the plot have?',
  featuresWhy:
    'Every one you tick becomes a filter the property shows up in. A pool that is only mentioned in the text is invisible to anyone filtering for a pool.',

  // Step 5
  nearQ: 'What is actually nearby?',
  nearWhy:
    'Name real places — a school, a beach, a supermarket. “A prestigious area” ranks for nothing and tells a buyer nothing.',
  landmark: (n: number) => `Landmark ${n}`,
  landmarkPlaceholder: 'e.g. Escola Portuguesa',
  mapQ: 'Where is it on the map?',
  mapWhy:
    'Without a pin the listing page shows a grey box where the map should be. Buyers filter by area and judge a property on how far it is from work and school — a listing that cannot answer that gets skipped.',
  pasteLink: 'Paste a Google Maps link',
  pastePlaceholder: 'https://maps.google.com/…  or  -25.9692, 32.5732',
  pasteHint: 'On Google Maps: long-press the spot, then Share → Copy link. Or click the map below.',
  shortLinkError:
    'Short Google links hide the coordinates. Open it in your browser first, then paste the full link from the address bar.',
  noCoordsError: 'No coordinates in that. Paste a Google Maps link, or type "-25.9692, 32.5732".',
  pinSet: 'Pin set at',
  clear: 'Clear',
  outsideMozambique: ' — that point is outside Mozambique. Worth checking.',
  noPin: 'No pin yet. The listing still publishes, but its map stays empty.',

  // Step 6
  photosQ: 'Photos',
  photosWhy:
    'Six minimum, at least two interior. Filenames are generated from the listing — no more IMG_8293.jpg.',
  addPhotos: 'Add photos',
  interior: 'Interior',
  photosEnough: (n: number) => `${n} photos — meets the minimum`,
  photosShort: (n: number) => `${n} photos — six are required before this can publish`,
  interiorEnough: (n: number) => `${n} interior shots`,
  interiorShort: 'Needs two interior shots',
  filenamesGenerated: 'Filenames and alt text generated:',

  // Step 7
  contactQ: 'How should buyers reach you about this listing?',
  contactWhy:
    'These become the buttons on the listing page, not lines in the description — which is what lets the dashboard tell you how many people pressed WhatsApp versus how many called.',
  whatsappNumber: 'WhatsApp number',
  phoneNumber: 'Phone number',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  waOn: 'WhatsApp button will show on the listing',
  waOff: 'No WhatsApp button — most buyers here message before they call',
  callOn: 'Call button will show on the listing',
  callOff: 'No call button',
  mailOn: 'Email button will show on the listing',
  mailOff: 'No email button',
  contactFallback:
    'Leave these blank and the listing falls back to the phone and email on your agent profile. Every press is still counted — it is just counted against your profile details rather than ones you set for this property.',

  // Preview panel
  previewTitle: 'How your listing will look',
  previewLanguage: 'Preview language',
  seoSummary: 'What search engines will see',
  seoNotePt: 'This is the version search indexes — the site is served in Portuguese.',
  seoNoteEn: 'Shown to English readers. Search indexes the Portuguese version.',
  urlSlug: 'URL slug',
  chars: (n: number) => `${n} chars`,
  titleTag: 'Title tag',
  titleTooLong:
    'Search may drop the “| House in Mozambique” suffix — the part before it still reads on its own.',
  metaDescription: 'Meta description',
  portuguesePair: 'Portuguese pair',
  parentPage: 'Parent landing page',
  structuredData: 'Structured data',
  generatedNote: 'Generated from your answers — nothing typed twice',
  previewContactFallback:
    'Falls back to the phone on your agent profile — set numbers in step 6 to control this.',

  /* Why Submit is disabled. Each one names the step it lives on, because
     "Say where the DUAT stands" is no help to someone standing on step 7. */
  blocker: {
    bairro: (step: string) => `Name the bairro — step 1, ${step}`,
    price: (step: string) => `Set a price — step 2, ${step}`,
    photos: (n: number) => `Six photos are required — ${n} uploaded, step 6`,
    landSize: (step: string) => `Set the plot size — step 2, ${step}`,
    duat: (step: string) => `Say where the DUAT stands — step 3, ${step}`,
    beds: (step: string) => `Set the number of bedrooms — step 2, ${step}`,
    interior: (step: string) => `At least two interior shots are required — step 6, ${step}`,
    verifyEmail: 'Confirm your email address to publish',
  },
};

/** Same keys, Portuguese. */
const pt: typeof en = {
  isPt: true,
  eyebrow: 'Anúncio guiado',
  heading: 'Novo anúncio',
  intro:
    'Responda às perguntas e a página escreve-se sozinha — título, endereço, descrição e tudo o que os motores de busca leem.',
  quality: 'Qualidade',

  steps: ['O quê e onde', 'Os números', 'Detalhes', 'Características', 'O local', 'Fotos', 'Contacto'],

  back: 'Voltar',
  continue: 'Continuar',
  submit: 'Enviar para revisão',
  submitting: 'A enviar…',
  stepOf: (n, total) => `Passo ${n} de ${total}`,
  couldNotSubmit: 'Não foi possível enviar',

  verifyTitle: 'Confirme o seu e-mail antes de publicar',
  verifyBody: (where) =>
    `Enviámos um link para ${where}. Pode preencher isto agora, mas o anúncio só pode ser enviado depois de o endereço estar confirmado.`,
  yourAddress: 'o seu endereço',

  quotaUsedTitle: (quota, plan) =>
    `Já usou ${quota === 1 ? 'o único anúncio' : `todos os ${quota} anúncios`} do plano ${plan}`,
  quotaUsedBody:
    'Continue a preparar este anúncio — ao enviar, pode mudar de plano, pagar só este anúncio, ou retirar um antigo para libertar espaço.',
  lastListingTitle: (plan) => `Este é o seu último anúncio no plano ${plan}`,
  lastListingBody: 'Depois deste, precisa de um plano maior, ou de um anúncio avulso, para publicar mais.',
  allowanceTitle: (left, plan) =>
    `Tem ${left} anúncio${left === 1 ? '' : 's'} disponíve${left === 1 ? 'l' : 'is'} no plano ${plan}`,
  allowanceBody: 'Este usa um deles. Sem custo adicional.',
  allowanceUnlimited: (plan) => `O plano ${plan} não tem limite de anúncios`,
  includedBadge: 'Incluído na sua subscrição',
  includedNote: 'Este anúncio não tem custo adicional.',
  yourPlan: 'o seu plano',
  paymentStarted:
    'Pagamento iniciado. Assim que for confirmado, o plano fica activo e pode enviar este anúncio.',

  whereQ: 'O que está a anunciar, e onde exactamente?',
  whereWhy:
    'O bairro importa mais do que a rua. Os compradores procuram “Costa do Sol”, não um endereço — e é isso que dá nome à página.',
  listingType: 'Tipo de anúncio',
  propertyType: 'Tipo de imóvel',
  city: 'Cidade',
  bairro: 'Bairro',
  bairroPlaceholder: 'ex. Costa do Sol',
  intentSale: 'À venda',
  intentRent: 'Para arrendar',
  intentStay: 'Estadia curta',

  numbersQ: 'Os números pelos quais os compradores filtram',
  numbersWhy:
    'Estes tornam-se os filtros, os dados estruturados e o título — se um campo ficar vazio, o imóvel desaparece dessa pesquisa por completo.',
  price: 'Preço',
  currency: 'Moeda',
  num: {
    beds: 'Quartos',
    baths: 'Casas de banho',
    suites: 'Desses, suítes',
    suitesHint: 'Quartos com casa de banho própria — "T4 com 2 suítes".',
    storeys: 'Pisos do imóvel',
    storeysHint: 'Um triplex não é um T4 num só piso, e os compradores procuram essa diferença.',
    floor: 'Em que piso fica',
    floorHint: '0 para o rés-do-chão. Deixe em branco se não se aplicar.',
    parking: 'Lugares de estacionamento',
    buildingSize: 'Área de construção (m²)',
    landSize: 'Área do terreno (m²)',
    frontage: 'Frente (m)',
    frontageHint: 'A largura ao longo da estrada.',
    depth: 'Profundidade (m)',
  },
  buildingSizeLabel: 'A área de construção',
  plotSizeLabel: 'A área do terreno',
  tooBig: (what, type) =>
    `${what} parece invulgarmente grande para ${type}. Vale a pena confirmar antes de publicar — este número vai para o título e para os resultados de pesquisa, além da página.`,
  areaMismatch: (f, d, area, stated) =>
    `${f} m × ${d} m dá ${area} m², mas a área do terreno diz ${stated} m². Um dos três está errado — ambos os números vão para a página.`,
  suitesOverBeds: 'Mais suítes do que quartos.',
  priceNote:
    'Nunca escreva o preço também na descrição — fica desactualizado assim que mudar, e dois formatos na mesma página passam uma ideia de desleixo.',

  plotQ: 'Sobre o terreno',
  buildingQ: 'Sobre a construção',
  plotWhy:
    'O uso permitido, o DUAT e o acesso são as três primeiras coisas que um comprador de terreno pergunta. Os agentes escreviam isto no título do anúncio porque este formulário nunca perguntava.',
  buildingWhy:
    'O estado e a mobília são o que distingue dois anúncios de resto iguais — e o que decide a compra.',
  select: 'Seleccione…',
  question: {
    condition: 'Estado',
    furnishing: 'Mobília',
    zoning: 'Uso permitido',
    duat: 'Situação do DUAT',
    roadSurface: 'Acesso ao terreno',
    structures: 'O que já lá está',
    commercialUse: 'Preparado para',
  },
  choice: {
    new: 'Construção nova',
    renovated: 'Renovado recentemente',
    good: 'Bom estado',
    'needs work': 'Precisa de obras',
    unfurnished: 'Sem mobília',
    semi: 'Semimobilado',
    full: 'Totalmente mobilado',
    residential: 'Residencial',
    commercial: 'Comercial',
    industrial: 'Industrial',
    agricultural: 'Agrícola',
    mixed: 'Uso misto',
    'in order': 'DUAT em ordem',
    'in progress': 'DUAT em curso',
    none: 'Nada',
    unknown: 'Por confirmar',
    tarred: 'Asfaltado',
    gravel: 'Saibro',
    dirt: 'Terra batida',
    ruin: 'Uma ruína',
    foundation: 'Fundações feitas',
    'unfinished building': 'Uma construção inacabada',
    office: 'Escritórios',
    retail: 'Comércio',
    warehouse: 'Armazém',
    restaurant: 'Restaurante',
  },

  featuresBuiltQ: 'O que é que tem?',
  featuresLandQ: 'O que é que o terreno tem?',
  featuresWhy:
    'Cada uma que marcar torna-se um filtro em que o imóvel aparece. Uma piscina que só é referida no texto é invisível para quem filtra por piscina.',

  nearQ: 'O que há mesmo por perto?',
  nearWhy:
    'Indique lugares reais — uma escola, uma praia, um supermercado. “Zona nobre” não aparece em nenhuma pesquisa e não diz nada a um comprador.',
  landmark: (n) => `Referência ${n}`,
  landmarkPlaceholder: 'ex. Escola Portuguesa',
  mapQ: 'Onde fica no mapa?',
  mapWhy:
    'Sem um ponto no mapa, a página do anúncio mostra um rectângulo cinzento onde devia estar o mapa. Os compradores filtram por zona e avaliam um imóvel pela distância ao trabalho e à escola — um anúncio que não responde a isso é ignorado.',
  pasteLink: 'Cole um link do Google Maps',
  pastePlaceholder: 'https://maps.google.com/…  ou  -25.9692, 32.5732',
  pasteHint:
    'No Google Maps: toque sem largar no local, depois Partilhar → Copiar link. Ou clique no mapa abaixo.',
  shortLinkError:
    'Os links curtos do Google escondem as coordenadas. Abra-o primeiro no navegador e cole o link completo da barra de endereço.',
  noCoordsError: 'Não há coordenadas aí. Cole um link do Google Maps, ou escreva "-25.9692, 32.5732".',
  pinSet: 'Ponto marcado em',
  clear: 'Limpar',
  outsideMozambique: ' — esse ponto fica fora de Moçambique. Vale a pena confirmar.',
  noPin: 'Ainda sem ponto. O anúncio publica na mesma, mas o mapa fica vazio.',

  photosQ: 'Fotos',
  photosWhy:
    'Seis no mínimo, pelo menos duas de interior. Os nomes dos ficheiros são gerados a partir do anúncio — acabaram-se os IMG_8293.jpg.',
  addPhotos: 'Adicionar fotos',
  interior: 'Interior',
  photosEnough: (n) => `${n} fotos — cumpre o mínimo`,
  photosShort: (n) => `${n} fotos — são precisas seis para poder publicar`,
  interiorEnough: (n) => `${n} fotos de interior`,
  interiorShort: 'Faltam duas fotos de interior',
  filenamesGenerated: 'Nomes de ficheiro e texto alternativo gerados:',

  contactQ: 'Como devem os compradores falar consigo sobre este anúncio?',
  contactWhy:
    'Estes tornam-se os botões da página do anúncio, e não linhas na descrição — é isso que permite ao painel dizer-lhe quantas pessoas carregaram no WhatsApp e quantas ligaram.',
  whatsappNumber: 'Número de WhatsApp',
  phoneNumber: 'Número de telefone',
  emailLabel: 'E-mail',
  emailPlaceholder: 'o.seu@email.com',
  waOn: 'O botão de WhatsApp vai aparecer no anúncio',
  waOff: 'Sem botão de WhatsApp — aqui a maioria escreve antes de ligar',
  callOn: 'O botão de chamada vai aparecer no anúncio',
  callOff: 'Sem botão de chamada',
  mailOn: 'O botão de e-mail vai aparecer no anúncio',
  mailOff: 'Sem botão de e-mail',
  contactFallback:
    'Se deixar em branco, o anúncio usa o telefone e o e-mail do seu perfil de agente. Cada clique continua a ser contado — apenas fica associado aos dados do perfil em vez dos que definir para este imóvel.',

  previewTitle: 'Como vai ficar o seu anúncio',
  previewLanguage: 'Idioma da pré-visualização',
  seoSummary: 'O que os motores de busca vão ver',
  seoNotePt: 'Esta é a versão que a pesquisa indexa — o site é servido em português.',
  seoNoteEn: 'Mostrada a leitores em inglês. A pesquisa indexa a versão portuguesa.',
  urlSlug: 'Endereço da página',
  chars: (n) => `${n} caracteres`,
  titleTag: 'Título da página',
  titleTooLong:
    'A pesquisa pode cortar o sufixo “| House in Mozambique” — a parte antes dele continua a ler-se sozinha.',
  metaDescription: 'Meta descrição',
  portuguesePair: 'Par em português',
  parentPage: 'Página principal',
  structuredData: 'Dados estruturados',
  generatedNote: 'Gerado a partir das suas respostas — nada escrito duas vezes',
  previewContactFallback:
    'Usa o telefone do seu perfil de agente — defina números no passo 6 para controlar isto.',

  blocker: {
    bairro: (step) => `Indique o bairro — passo 1, ${step}`,
    price: (step) => `Defina um preço — passo 2, ${step}`,
    photos: (n) => `São precisas seis fotos — ${n} carregada(s), passo 6`,
    landSize: (step) => `Indique a área do terreno — passo 2, ${step}`,
    duat: (step) => `Diga em que situação está o DUAT — passo 3, ${step}`,
    beds: (step) => `Indique o número de quartos — passo 2, ${step}`,
    interior: (step) => `São precisas pelo menos duas fotos de interior — passo 6, ${step}`,
    verifyEmail: 'Confirme o seu endereço de e-mail para publicar',
  },
};

export type WizardCopy = typeof en;

const COPY: Record<WizardLang, WizardCopy> = { en, pt };

export function wizardCopy(lang: string): WizardCopy {
  return COPY[lang === 'pt' ? 'pt' : 'en'];
}
