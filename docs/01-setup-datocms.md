# 01 — Setup DatoCMS

> Obiettivo: creare il progetto DatoCMS, definire lo schema dei modelli e generare i token API necessari.

---

## 1. Creazione del progetto

### Opzione A — Progetto vuoto (consigliato per produzione)

1. Accedere a [datocms.com](https://www.datocms.com) e creare un account (o usare uno esistente).
2. Creare un **nuovo progetto vuoto** (blank project) — non scegliere template predefiniti, dato che lo schema va costruito ad hoc.
3. Assegnare un nome progetto descrittivo (es. `nomeazienda-website`).

Partire da un progetto vuoto garantisce il pieno controllo sullo schema. Meglio costruire solo quello che serve.

### Opzione B — Progetto Demo (consigliato per imparare / prototipare)

DatoCMS offre progetti demo preconfigurati con schema e contenuti di esempio. Uno dei più completi è il **Marketing Website Demo**, che include:

- Schema completo (Posts, Authors, Tags, Pages, PricingTiers, Testimonials, DocumentationPages, LegalPages, ChangeLogs)
- Contenuti di esempio già presenti
- Schema multilingua (IT, EN, DE, FR, ES)

Per usarlo: dalla dashboard DatoCMS, scegliere "Start from a template" e selezionare il template desiderato. In alternativa, clonare il progetto tramite il Marketplace DatoCMS ([datocms.com/marketplace/starters](https://www.datocms.com/marketplace/starters)).

**Attenzione**: i modelli e i nomi dei campi del progetto demo differiscono dallo schema consigliato in questo documento. Le query GraphQL e i componenti del frontend vanno adattati di conseguenza (usare l'introspezione GraphQL per scoprire i campi reali, vedi sezione "Verificare lo schema via API" più avanti).

### Verificare lo schema via API

Per scoprire i modelli e i campi disponibili in un progetto DatoCMS (utile soprattutto con i template demo), usare l'introspezione GraphQL direttamente dalla pagina Next.js durante lo sviluppo:

```tsx
// In app/page.tsx durante l'esplorazione
const data = await fetchDatoCMS(`
  query {
    __schema {
      queryType {
        fields { name description }
      }
    }
  }
`);
```

Per i campi di un modello specifico:

```tsx
const data = await fetchDatoCMS(`
  query {
    __type(name: "PostRecord") {
      fields { name }
    }
  }
`);
```

Questo evita errori GraphQL per campi inesistenti o con nomi diversi da quelli attesi.

---

## 2. Schema dei modelli

Lo schema DatoCMS è la struttura dei contenuti. Per un sito vetrina/corporate con blog, servono almeno i modelli elencati di seguito. Lo schema va adattato al progetto specifico, ma questa è una base solida.

### Modelli consigliati

#### Homepage (single instance)

Modello di tipo **single instance** (una sola pagina, non ripetibile).

Campi suggeriti:

- `hero_title` — Testo singolo (Single-line string)
- `hero_subtitle` — Testo singolo
- `hero_image` — Asset (immagine singola)
- `hero_cta_text` — Testo singolo (testo del bottone CTA)
- `hero_cta_link` — Testo singolo (URL o path interno)
- `sections` — Modular Content (blocchi modulari, vedi sotto)
- `seo` — Campo SEO (campo speciale DatoCMS per meta title, description, immagine OG)

#### Page (pagine generiche)

Modello ripetibile per pagine come "Chi siamo", "Servizi", "Contatti".

Campi suggeriti:

- `title` — Testo singolo
- `slug` — Slug (generato automaticamente dal title)
- `content` — Structured Text (il formato ricco di DatoCMS, supporta blocchi inline)
- `sections` — Modular Content
- `seo` — Campo SEO

#### Blog Post

Modello ripetibile per gli articoli del blog.

Campi suggeriti:

- `title` — Testo singolo
- `slug` — Slug
- `excerpt` — Testo multi-riga (textarea)
- `cover_image` — Asset
- `content` — Structured Text
- `date` — Data
- `author` — Link a modello Author
- `categories` — Link multiplo a modello Category
- `seo` — Campo SEO

#### Author

Modello ripetibile per gli autori degli articoli.

- `name` — Testo singolo
- `bio` — Testo multi-riga
- `avatar` — Asset

#### Category

Modello ripetibile per le categorie del blog.

- `name` — Testo singolo
- `slug` — Slug

#### Navigation (single instance)

Modello per gestire il menu di navigazione dal CMS.

- `links` — JSON oppure Modular Content con un blocco "NavItem" (label + url)

#### Site Settings (single instance)

Impostazioni globali del sito.

- `site_name` — Testo singolo
- `logo` — Asset
- `footer_text` — Testo multi-riga
- `social_links` — JSON o Modular Content (blocco con platform + url)

### Blocchi Modulari (per Modular Content)

I campi `sections` usano Modular Content, che permette di comporre pagine con blocchi riutilizzabili. Definire questi come **Block models** in DatoCMS:

- **HeroBlock** — title, subtitle, image, cta_text, cta_link
- **TextImageBlock** — title, text (Structured Text), image, image_position (enum: left/right)
- **CtaBlock** — title, description, button_text, button_link
- **GalleryBlock** — title, images (gallery di asset)
- **TestimonialsBlock** — titolo, lista di testimonial (blocco annidato con nome, ruolo, testo, avatar)

### Come creare lo schema

Nella dashboard DatoCMS:

1. Andare su **Settings → Models**
2. Per ogni modello, cliccare **"+ New model"**
3. Per i single instance, attivare il toggle "Singleton" nella creazione
4. Per i Block models, scegliere il tipo "Block" invece di "Model"
5. Aggiungere i campi uno per uno, scegliendo il tipo appropriato dal pannello
6. Per il campo SEO, usare il tipo di campo "SEO meta tags" integrato in DatoCMS

### Nota su Structured Text vs Modular Content

- **Structured Text**: è il formato "editor ricco" di DatoCMS. Supporta testo formattato, heading, liste, link e può includere blocchi inline (es. un'immagine nel mezzo del testo). Usare per il body degli articoli e il contenuto testuale delle pagine.
- **Modular Content**: è un campo che permette di scegliere e ordinare blocchi a piacere. Usare per comporre layout di pagina con sezioni diverse (hero, gallery, CTA, ecc.).

---

## 3. API Token

DatoCMS usa token separati per scopi diversi. Dal 2025, i nuovi progetti non hanno più un token full-access di default — bisogna crearli manualmente.

### Token necessari

Andare su **Settings → API Tokens** e creare:

#### Token CDA (Content Delivery API) — Published

- Nome: `CDA Published` (o simile)
- Permessi: solo lettura contenuti pubblicati
- Uso: il frontend in produzione legge i contenuti da questo token
- Variabile env: `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN`

#### Token CDA — Draft (opzionale ma consigliato)

- Nome: `CDA Draft`
- Permessi: lettura contenuti pubblicati + draft
- Uso: la modalità preview/draft del sito (permette di vedere bozze prima della pubblicazione)
- Variabile env: `DATOCMS_DRAFT_CONTENT_CDA_TOKEN`

#### Token CMA (Content Management API) — Opzionale

- Necessario solo se il sito deve scrivere contenuti (es. form che salva su DatoCMS)
- Normalmente non serve per un sito vetrina/blog
- Variabile env: `DATOCMS_CMA_TOKEN`

### Come generare i token

1. In DatoCMS, andare su **Settings → API Tokens**
2. Cliccare **"+ New API token"**
3. Assegnare un nome descrittivo
4. Selezionare i permessi (CDA published, CDA preview, CMA)
5. Associare un ruolo se necessario
6. Copiare il token subito — non sarà più visibile in seguito

### SECRET_API_TOKEN

Serve un token segreto per proteggere le route API di Next.js (webhook, draft mode, ecc.). Non è un token DatoCMS — è una stringa casuale generata localmente:

```bash
openssl rand -hex 32
```

Salvare come variabile `SECRET_API_TOKEN`.

---

## 4. Riepilogo variabili ambiente

Al termine di questa fase, si avranno queste variabili (da usare nel file `.env.local` di Next.js):

```
DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN=xxx
DATOCMS_DRAFT_CONTENT_CDA_TOKEN=xxx
SECRET_API_TOKEN=xxx
```

Se serve anche il CMA:

```
DATOCMS_CMA_TOKEN=xxx
```

> **Nota**: i nomi delle variabili dipendono dallo starter usato. Con `next-landing-page-demo` le variabili hanno nomi diversi (vedi `05-deploy.md`). Verificare sempre il file `.env.example` dello starter clonato.

---

## 5. Plugin consigliati

Installare dalla sezione **Settings → Plugins** di DatoCMS:

- **Web Previews** — permette agli editor di vedere l'anteprima live delle pagine direttamente da DatoCMS
- **SEO/Readability Analysis** — analisi SEO integrata nei campi Structured Text

---

## Checklist

- [ ] Progetto DatoCMS creato (vuoto)
- [ ] Modelli creati: Homepage, Page, Blog Post, Author, Category, Navigation, Site Settings
- [ ] Block models creati: HeroBlock, TextImageBlock, CtaBlock, GalleryBlock, TestimonialsBlock
- [ ] Token CDA Published generato e salvato
- [ ] Token CDA Draft generato e salvato
- [ ] SECRET_API_TOKEN generato
- [ ] Plugin Web Previews e SEO Analysis installati
- [ ] Tutte le variabili ambiente annotate in modo sicuro

→ Prossimo passo: **02-setup-nextjs.md**
