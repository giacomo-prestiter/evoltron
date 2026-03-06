# 04 — Personalizzazione

> Obiettivo: popolare i contenuti su DatoCMS e personalizzare il codice del frontend per adattarlo al progetto specifico.

---

## 1. Inserimento contenuti in DatoCMS

### Ordine consigliato

Conviene popolare i contenuti in quest'ordine, partendo dai modelli senza dipendenze:

1. **Site Settings** — logo, nome sito, testo footer, link social
2. **Navigation** — voci del menu principale
3. **Author** — autori per il blog
4. **Category** — categorie per il blog
5. **Homepage** — contenuto hero + composizione delle sezioni modulari
6. **Page** — pagine generiche (Chi siamo, Servizi, Contatti, ecc.)
7. **Blog Post** — articoli del blog

### Buone pratiche per i contenuti

- **Immagini**: caricare nella Media Library di DatoCMS con dimensioni adeguate (almeno 1200px di larghezza per hero/cover). DatoCMS + Imgix ridimensionano automaticamente, ma partire da immagini troppo piccole produce risultati scadenti.
- **SEO**: compilare sempre il campo SEO di ogni pagina/articolo (title, description, immagine OG). Questo è critico per l'indicizzazione.
- **Slug**: verificare che gli slug generati siano corretti e leggibili. DatoCMS li genera dal titolo, ma a volte servono correzioni manuali (es. evitare caratteri speciali, mantenere brevità).
- **Structured Text**: usare la gerarchia corretta degli heading (H2, H3, H4 — non H1, che è riservato al titolo della pagina gestito a livello di template).

---

## 2. Composizione pagine con Modular Content

### Come funziona per l'editor

Nella dashboard DatoCMS, l'editor che modifica una pagina con un campo Modular Content vedrà un'interfaccia per aggiungere e riordinare blocchi:

1. Clicca "+" sul campo sections
2. Sceglie il tipo di blocco (HeroBlock, TextImageBlock, CtaBlock, ecc.)
3. Compila i campi del blocco
4. Trascina i blocchi per riordinarli
5. Può aggiungere più blocchi dello stesso tipo

Il frontend renderizza i blocchi in ordine grazie al `SectionRenderer` (vedi `03-template-grafico.md`).

### Query GraphQL per i blocchi modulari

Per leggere le sezioni modulari, la query deve usare inline fragments per ogni tipo di blocco:

```graphql
query Homepage {
  homepage {
    title
    sections {
      ... on HeroBlockRecord {
        __typename
        id
        title
        subtitle
        image { responsiveImage { src srcSet width height alt base64 } }
        ctaText
        ctaLink
      }
      ... on TextImageBlockRecord {
        __typename
        id
        title
        text { value }
        image { responsiveImage { src srcSet width height alt base64 } }
        imagePosition
      }
      ... on CtaBlockRecord {
        __typename
        id
        title
        description
        buttonText
        buttonLink
      }
      # ... altri blocchi
    }
    seo: _seoMetaTags { tag content attributes }
  }
}
```

---

## 3. Personalizzazione delle pagine

### Homepage

La homepage è tipicamente la pagina più personalizzata. Modifiche comuni:

- **Adattare la query GraphQL** in `app/page.tsx` per leggere tutti i campi del modello Homepage definito nello schema
- **Configurare il SectionRenderer** per includere tutti i tipi di blocco usati
- **Aggiungere sezioni fisse** (non da Modular Content) se alcune sezioni devono essere sempre presenti — es. la sezione "Ultimi articoli" che legge da Blog Post

### Pagine dinamiche (`app/[slug]/page.tsx`)

Questo file gestisce tutte le pagine con slug dinamico. Adattamenti:

- Assicurarsi che la query legga il modello `Page` dallo schema
- Implementare `generateStaticParams()` per la generazione statica
- Gestire il caso 404 (slug non trovato) con `notFound()` di Next.js
- Configurare `generateMetadata()` per i meta tag SEO dinamici:

```tsx
import { toNextMetadata } from 'react-datocms';

export async function generateMetadata({ params }) {
  const { page } = await performRequest(QUERY, { slug: params.slug });
  if (!page) return {};
  return toNextMetadata(page.seo);
}
```

### Blog

La sezione blog richiede due pagine:

**Lista articoli** (`app/blog/page.tsx`):
- Query per tutti i post ordinati per data discendente
- Paginazione se ci sono molti articoli (DatoCMS supporta `first` e `skip` nelle query)
- Card di preview per ogni articolo (titolo, excerpt, immagine, data, autore)

**Articolo singolo** (`app/blog/[slug]/page.tsx`):
- Query per il singolo post tramite slug
- Rendering del Structured Text con eventuali blocchi inline
- Metadati SEO dinamici
- Navigazione prev/next (opzionale)
- Informazioni autore

---

## 4. Header e Footer dinamici

Header e Footer leggono i dati dai modelli Navigation e Site Settings. Vanno implementati nel layout globale:

```tsx
// app/layout.tsx

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { performRequest } from '@/lib/datocms';

const LAYOUT_QUERY = `
  query {
    navigation { links }
    siteSettings {
      siteName
      logo { url alt }
      footerText
      socialLinks
    }
  }
`;

export default async function RootLayout({ children }) {
  const data = await performRequest(LAYOUT_QUERY);
  
  return (
    <html>
      <body>
        <Header navigation={data.navigation} settings={data.siteSettings} />
        <main>{children}</main>
        <Footer settings={data.siteSettings} />
      </body>
    </html>
  );
}
```

---

## 5. SEO

### Meta tag globali

DatoCMS fornisce un campo `_seoMetaTags` su ogni record con SEO configurato. Il componente `toNextMetadata` di `react-datocms` li converte nel formato Next.js:

```tsx
import { toNextMetadata } from 'react-datocms';

export async function generateMetadata() {
  const { page } = await performRequest(QUERY);
  return toNextMetadata(page._seoMetaTags);
}
```

### Sitemap

Generare una sitemap dinamica in `app/sitemap.ts`:

```tsx
import { performRequest } from '@/lib/datocms';

export default async function sitemap() {
  const { allPages, allBlogPosts } = await performRequest(`
    query {
      allPages { slug, _updatedAt }
      allBlogPosts { slug, _updatedAt }
    }
  `);

  const baseUrl = 'https://tuosito.com';

  return [
    { url: baseUrl, lastModified: new Date() },
    ...allPages.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page._updatedAt,
    })),
    ...allBlogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post._updatedAt,
    })),
  ];
}
```

### robots.txt

Creare `app/robots.ts`:

```tsx
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://tuosito.com/sitemap.xml',
  };
}
```

---

## 6. Pagina contatti (se necessaria)

Per un form di contatto, le opzioni sono:

- **Servizio esterno** (consigliato): Formspree, Getform, o simili — gestiscono invio email senza backend
- **Route API Next.js**: creare una API route `/api/contact` che riceve i dati e li invia via email (richiede un servizio SMTP tipo Resend, SendGrid, ecc.)
- **DatoCMS come storage**: usare il CMA per salvare le submissions come record in DatoCMS (utile per averle centralizzate, ma richiede il token CMA)

---

## 7. Personalizzazioni comuni del codice

### Aggiungere un nuovo tipo di blocco

1. In DatoCMS: creare il nuovo Block model con i campi necessari
2. Aggiungerlo come opzione nel campo Modular Content dei modelli che lo useranno
3. Rigenerare i tipi: `npm run generate:datocms`
4. Creare il componente React in `components/sections/`
5. Aggiungere il mapping nel `SectionRenderer`
6. Aggiornare la query GraphQL con il nuovo inline fragment

### Aggiungere un nuovo modello (es. una pagina "Team")

1. In DatoCMS: creare il modello con i campi necessari
2. Rigenerare i tipi
3. Creare la route in `app/team/page.tsx`
4. Scrivere la query GraphQL
5. Implementare il componente con il rendering dei dati
6. Aggiungere alla navigation se necessario

### Modificare un componente esistente

1. Individuare il componente in `components/`
2. Modificare il layout/stile (Tailwind classes o CSS)
3. Se servono nuovi dati, aggiornare la query GraphQL nella pagina che lo usa
4. Se servono nuovi campi, aggiungerli prima su DatoCMS e rigenerare i tipi

---

## 8. Testing locale

Prima di procedere al deploy, verificare:

- **Tutte le pagine** si caricano senza errori (`npm run dev`)
- **I contenuti** da DatoCMS appaiono correttamente
- **Le immagini** si caricano (verificare la configurazione next.config.js)
- **Il Draft Mode** funziona (accedere alla URL di preview e verificare che i contenuti in bozza appaiano)
- **Il build statico** funziona: `npm run build` → non deve dare errori
- **SEO**: controllare che i meta tag siano corretti ispezionando il sorgente HTML
- **Responsive**: verificare il layout su mobile, tablet e desktop

---

## Checklist

- [ ] Contenuti base inseriti in DatoCMS (Site Settings, Navigation, Homepage, almeno 1 Page, almeno 1 Blog Post)
- [ ] Homepage renderizza correttamente con le sezioni modulari
- [ ] Pagine dinamiche funzionanti con slug corretti
- [ ] Blog: lista e singolo articolo funzionanti
- [ ] Header e Footer dinamici collegati a DatoCMS
- [ ] SEO: meta tag, sitemap, robots.txt configurati
- [ ] Build (`npm run build`) completato senza errori
- [ ] Layout responsive verificato

→ Prossimo passo: **05-deploy.md**
