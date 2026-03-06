# 02 — Setup Next.js

> Obiettivo: clonare lo starter kit DatoCMS per Next.js, configurare le variabili ambiente e capire la struttura del progetto.

---

## 1. Scelta dello starter

### Opzione A — `datocms/nextjs-starter-kit` (minimalista)

Repository: [github.com/datocms/nextjs-starter-kit](https://github.com/datocms/nextjs-starter-kit)

Starter ufficiale e più aggiornato. Caratteristiche:

- **Next.js 16** con App Router
- **100% TypeScript** con `gql.tada` per query GraphQL completamente tipizzate
- Boilerplate minimo — zero CSS preimpostato
- Supporto completo per **Draft Mode**, webhook di invalidazione cache, Web Previews
- Ideale quando si porta un design personalizzato (da Figma o AI grafica)

### Opzione B — `datocms/next-landing-page-demo` (completo con design)

Repository: [github.com/datocms/next-landing-page-demo](https://github.com/datocms/next-landing-page-demo)

Starter completo che include un design system funzionante. Caratteristiche:

- **Next.js 16** con App Router + **Tailwind CSS v3**
- Schema DatoCMS ricco (pagine, blog, pricing, testimonial, documentazione, changelog)
- **Routing i18n** integrato (`app/[locale]/`) con supporto multilingua
- Componenti già costruiti per tutte le sezioni (Hero, Feature List, Pricing, Reviews, ecc.)
- `@graphql-codegen/cli` per la generazione dei tipi TypeScript
- Ideale per partire subito con un sito funzionante da personalizzare

```bash
git clone https://github.com/datocms/next-landing-page-demo nome-progetto
```

### Opzione C — partire da zero

Creare un progetto Next.js con `npx create-next-app@latest` e installare manualmente `@datocms/cda-client` e `react-datocms`. Sconsigliato per chi non ha esperienza con DatoCMS.

---

## 2. Setup iniziale

### Deploy con un click (metodo consigliato)

Il modo più rapido è usare il bottone "Deploy to Vercel" presente nel README dello starter. Questo:

1. Crea automaticamente un progetto DatoCMS con schema di esempio
2. Crea il repo GitHub
3. Deploya su Vercel
4. Collega tutto automaticamente

**Attenzione**: se hai già creato il progetto DatoCMS manualmente (come descritto in `01-setup-datocms.md`), questo metodo creerebbe un secondo progetto. In quel caso, segui il setup manuale sotto.

### Setup manuale

```bash
# Clone del repo
git clone https://github.com/datocms/nextjs-starter-kit.git nome-progetto
cd nome-progetto

# Rimuovere l'origin del template e impostare il proprio repo
git remote remove origin
git remote add origin https://github.com/tuouser/nome-progetto.git

# Installare dipendenze
npm install
```

### Configurazione variabili ambiente

Copiare il file di esempio e inserire i token generati nella fase 01:

```bash
cp .env.example .env.local   # next-landing-page-demo
# oppure
cp .env.local.example .env.local   # nextjs-starter-kit
```

**Con `nextjs-starter-kit`**, compilare `.env.local` con:

```
DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN=<token CDA published da DatoCMS>
DATOCMS_DRAFT_CONTENT_CDA_TOKEN=<token CDA draft da DatoCMS>
SECRET_API_TOKEN=<stringa generata con openssl rand -hex 32>
```

**Con `next-landing-page-demo`**, compilare `.env.local` con:

```
URL=http://localhost:3000
DATOCMS_READONLY_API_TOKEN=<token da DatoCMS Settings → API Tokens>
SEO_SECRET_TOKEN=<stringa casuale>
DRAFT_SECRET_TOKEN=<stringa casuale>
CACHE_INVALIDATION_SECRET_TOKEN=<stringa casuale>
DATOCMS_BASE_EDITING_URL=https://<nome-progetto>.admin.datocms.com
```

### Configurazione identità Git

Prima del primo commit, configurare l'identità Git (necessario se non è già configurata globalmente):

```bash
git config --global user.name "Nome Cognome"
git config --global user.email "email@esempio.com"
```

### Verifica funzionamento

```bash
npm run dev
```

Il sito dovrebbe essere raggiungibile su `http://localhost:3000`.

**Nota per `next-landing-page-demo`**: il routing è basato su `[locale]`, quindi visitare direttamente `http://localhost:3000` restituisce un errore. Il sito usa `app/[locale]/` per tutte le pagine. È necessario aggiungere un file `app/page.tsx` che esegue il redirect automatico alla locale di default:

```tsx
// app/page.tsx
import { getFallbackLocale } from '@/app/i18n/settings';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const locale = await getFallbackLocale();
  redirect(`/${locale}`);
}
```

Dopo questo, visitare `http://localhost:3000` reindirizza automaticamente a `http://localhost:3000/en` (o la lingua configurata nel progetto DatoCMS).

Se lo schema DatoCMS è ancora vuoto (nessun contenuto), è normale vedere pagine vuote o errori GraphQL — vanno aggiunti contenuti di prova nel CMS.

---

## 3. Struttura del progetto

La struttura dello starter kit segue le convenzioni di Next.js App Router. Ecco i file e le cartelle principali da conoscere:

```
nome-progetto/
├── app/                        # App Router di Next.js
│   ├── layout.tsx              # Layout globale (wrappa tutte le pagine)
│   ├── page.tsx                # Homepage
│   ├── [slug]/                 # Pagine dinamiche
│   │   └── page.tsx
│   ├── blog/                   # Sezione blog
│   │   ├── page.tsx            # Lista articoli
│   │   └── [slug]/
│   │       └── page.tsx        # Singolo articolo
│   └── api/                    # Route API
│       ├── draft-mode/         # Attivazione/disattivazione draft mode
│       └── invalidate-cache/   # Webhook per invalidazione cache
├── components/                 # Componenti React riutilizzabili
├── lib/
│   └── datocms.ts              # Funzione performRequest e configurazione client
├── graphql/                    # Query GraphQL (o definite inline nei componenti)
├── .env.local                  # Variabili ambiente (non committare!)
├── .env.local.example          # Template delle variabili
├── next.config.js              # Configurazione Next.js
├── tsconfig.json               # Configurazione TypeScript
└── package.json
```

### File chiave da capire

#### `lib/datocms.ts`

Questo è il cuore del collegamento DatoCMS ↔ Next.js. Contiene:

- La funzione `performRequest()` che esegue query GraphQL verso la CDA di DatoCMS
- La gestione automatica del token published vs draft in base al Draft Mode attivo
- La configurazione del client `@datocms/cda-client`

Ogni pagina che deve leggere contenuti da DatoCMS importa `performRequest` da qui.

#### `app/api/invalidate-cache/route.ts`

Questa route riceve webhook da DatoCMS quando un contenuto viene pubblicato/modificato. Invalida la cache di Next.js per rigenerare le pagine aggiornate senza un full redeploy. È protetta dal `SECRET_API_TOKEN`.

#### `app/api/draft-mode/route.ts`

Permette agli editor di entrare in Draft Mode per vedere contenuti in bozza direttamente sul sito. Si integra con il plugin Web Previews di DatoCMS.

---

## 4. Type safety e generazione dei tipi GraphQL

Entrambi gli starter generano tipi TypeScript dallo schema DatoCMS, ma con strumenti diversi:

### Con `nextjs-starter-kit` (usa `gql.tada`)

```bash
npm run generate:datocms
```

### Con `next-landing-page-demo` (usa `@graphql-codegen/cli`)

```bash
npm run generate-ts-types
```

In entrambi i casi, questo comando aggiorna i tipi TypeScript basandosi sullo schema DatoCMS corrente. **Va eseguito ogni volta che si aggiungono o modificano modelli/campi in DatoCMS**, altrimenti TypeScript non vedrà i nuovi campi.

---

## 5. Pacchetti DatoCMS essenziali

Lo starter include già questi pacchetti, ma è utile sapere a cosa servono:

- **`@datocms/cda-client`** — Client leggero per query GraphQL alla Content Delivery API. Gestisce autenticazione, ambienti e caching.
- **`react-datocms`** — Componenti React per: immagini responsive (`<Image />`), video, Structured Text rendering, real-time updates, SEO metadata.
- **`gql.tada`** — Type safety automatica per le query GraphQL basata sullo schema DatoCMS.

---

## 6. Configurazione immagini Next.js

Per usare le immagini servite dal CDN DatoCMS (via Imgix), assicurarsi che `next.config.js` includa il dominio nelle immagini permesse:

```js
// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.datocms-assets.com',
      },
    ],
  },
};
```

Lo starter dovrebbe averlo già configurato. Verificare comunque.

---

## 7. Struttura delle pagine e routing

### Come funziona il data fetching

Con App Router, ogni `page.tsx` è un **Server Component** di default. Questo significa che le query GraphQL vengono eseguite lato server, senza esporre i token al client:

```tsx
// app/page.tsx (esempio concettuale)
import { performRequest } from '@/lib/datocms';

const QUERY = `
  query {
    homepage {
      heroTitle
      heroSubtitle
    }
  }
`;

export default async function HomePage() {
  const { homepage } = await performRequest(QUERY);
  return (
    <main>
      <h1>{homepage.heroTitle}</h1>
      <p>{homepage.heroSubtitle}</p>
    </main>
  );
}
```

### Route dinamiche

Per le pagine con slug dinamici (es. `/chi-siamo`, `/servizi`):

```
app/[slug]/page.tsx        → genera la pagina leggendo lo slug dall'URL
app/blog/[slug]/page.tsx   → singolo articolo blog
```

Usare `generateStaticParams()` per la generazione statica delle pagine al build time:

```tsx
export async function generateStaticParams() {
  const { allPages } = await performRequest(`
    query { allPages { slug } }
  `);
  return allPages.map((page) => ({ slug: page.slug }));
}
```

---

## 8. Draft Mode

Il Draft Mode di Next.js permette di vedere bozze non pubblicate sul sito. Lo starter lo preconfigura:

1. L'editor clicca "Preview" in DatoCMS (grazie al plugin Web Previews)
2. DatoCMS chiama l'endpoint `/api/draft-mode/enable` del sito
3. Next.js attiva il Draft Mode per quella sessione
4. Le query usano il token CDA Draft invece di quello Published
5. L'editor vede i contenuti in bozza sul sito

Per configurare Web Previews in DatoCMS, andare su Settings → Plugins → Web Previews e impostare l'URL del frontend (es. `https://tuosito.vercel.app`).

---

## Checklist

- [ ] Repository clonato e rinominato
- [ ] `npm install` completato senza errori
- [ ] `.env.local` configurato con i token corretti
- [ ] `npm run dev` avviato e sito raggiungibile su localhost:3000
- [ ] Tipi GraphQL generati (`npm run generate:datocms`)
- [ ] Remote Git impostato sul proprio repository
- [ ] Struttura del progetto compresa (lib/datocms.ts, route API, componenti)

→ Prossimo passo: **03-template-grafico.md**
