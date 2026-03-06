# 03 — Template Grafico

> Obiettivo: integrare un design esterno (creato in Figma, da un designer, o generato con AI) nel progetto Next.js + DatoCMS.

---

## 1. Approccio generale

Lo starter kit DatoCMS parte volutamente **senza CSS** (zero styling). Questo è un vantaggio: permette di inserire qualsiasi sistema grafico senza dover prima smontare stili preesistenti.

Il flusso consigliato è:

1. **Definire il design** — con Figma, un designer, o un'AI specializzata nella grafica
2. **Tradurre il design in componenti** — convertire le schermate in componenti React
3. **Collegare i componenti ai dati DatoCMS** — sostituire i contenuti statici con le query GraphQL

### Cosa deve produrre il design

Il design dovrebbe coprire almeno queste schermate/elementi:

- Homepage (con le sezioni modulari: hero, text+image, CTA, gallery, testimonials)
- Pagina generica (layout per "Chi siamo", "Servizi", ecc.)
- Lista articoli blog
- Singolo articolo blog
- Header con navigazione
- Footer
- Componenti UI base: bottoni, card, form di contatto

---

## 2. Scelta del framework CSS

Prima di tradurre il design in codice, scegliere il framework CSS. Opzioni principali:

### Tailwind CSS (consigliato)

Il miglior compromesso tra velocità di sviluppo, personalizzazione e compatibilità con AI/Claude Code.

Perché: le classi utility sono dichiarative e facili da generare per un'AI. La configurazione tramite `tailwind.config.js` permette di mappare colori, font e spaziature del design in modo centralizzato.

```bash
npm install -D tailwindcss @tailwindcss/postcss postcss
```

### CSS Modules

Già supportato nativamente da Next.js. Ogni componente ha il suo file `.module.css`. Buono per team che preferiscono CSS tradizionale.

### Styled Components / Emotion

Alternativa CSS-in-JS. Sconsigliato con App Router e Server Components perché richiede configurazioni extra per il rendering server-side.

---

## 3. Setup Tailwind (se scelto)

### Installazione

```bash
npm install -D tailwindcss @tailwindcss/postcss postcss
```

### Configurazione PostCSS

Creare `postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### Import globale

In `app/globals.css` (o il file CSS globale dello starter):

```css
@import "tailwindcss";
```

### Configurazione del tema dal design

Il file `tailwind.config.js` è dove si traducono i token grafici del design (colori, font, spaziature) in variabili Tailwind:

```js
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mappare i colori dal design Figma
        primary: '#1a365d',    // colore primario del brand
        secondary: '#e2e8f0',  // colore secondario
        accent: '#ed8936',     // colore accento/CTA
        // aggiungere altri colori dal design
      },
      fontFamily: {
        // Mappare i font dal design
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      // Spaziature, border-radius, ecc. come da design
    },
  },
};
```

---

## 4. Tradurre il design in componenti

### Workflow con AI specializzata nella grafica

Se si usa un'AI per generare il design (es. v0 di Vercel, Bolt, o simili), il flusso è:

1. Generare le schermate / il codice dei componenti con l'AI grafica
2. Estrarre i componenti React generati
3. Adattarli alla struttura del progetto DatoCMS
4. Sostituire i contenuti hardcoded con props collegate alle query GraphQL

### Workflow con design Figma

Se si parte da un Figma:

1. Analizzare il design e identificare i componenti riutilizzabili
2. Estrarre i design token (colori, tipografia, spaziature) → `tailwind.config.js`
3. Costruire i componenti dal più piccolo al più grande (atomic design)
4. Usare Claude Code per convertire le specifiche visive in codice React/Tailwind

### Struttura componenti consigliata

```
components/
├── ui/                         # Componenti UI atomici
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   └── Container.tsx
├── layout/                     # Struttura della pagina
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Navigation.tsx
│   └── PageLayout.tsx
├── sections/                   # Sezioni di pagina (mappano ai Block models)
│   ├── HeroSection.tsx         # → HeroBlock di DatoCMS
│   ├── TextImageSection.tsx    # → TextImageBlock
│   ├── CtaSection.tsx          # → CtaBlock
│   ├── GallerySection.tsx      # → GalleryBlock
│   └── TestimonialsSection.tsx # → TestimonialsBlock
├── blog/                       # Componenti specifici blog
│   ├── PostCard.tsx
│   ├── PostList.tsx
│   └── PostContent.tsx
└── datocms/                    # Wrapper componenti DatoCMS
    ├── DatoCmsImage.tsx        # Wrapper per <Image /> di react-datocms
    ├── StructuredText.tsx      # Wrapper per rendering Structured Text
    └── SectionRenderer.tsx     # Renderizza i blocchi modulari
```

---

## 5. Il SectionRenderer — collegare blocchi grafici e DatoCMS

Il componente più importante è il **SectionRenderer**: riceve i blocchi modulari da DatoCMS e renderizza il componente grafico corretto per ciascuno.

### Concetto

```tsx
// components/datocms/SectionRenderer.tsx

import { HeroSection } from '@/components/sections/HeroSection';
import { TextImageSection } from '@/components/sections/TextImageSection';
import { CtaSection } from '@/components/sections/CtaSection';
import { GallerySection } from '@/components/sections/GallerySection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';

// Mappa tra il __typename DatoCMS e il componente React
const SECTION_MAP: Record<string, React.ComponentType<any>> = {
  HeroBlockRecord: HeroSection,
  TextImageBlockRecord: TextImageSection,
  CtaBlockRecord: CtaSection,
  GalleryBlockRecord: GallerySection,
  TestimonialsBlockRecord: TestimonialsSection,
};

interface SectionRendererProps {
  sections: Array<{ __typename: string; id: string; [key: string]: any }>;
}

export function SectionRenderer({ sections }: SectionRendererProps) {
  return (
    <>
      {sections.map((section) => {
        const Component = SECTION_MAP[section.__typename];
        if (!Component) {
          console.warn(`Unknown section type: ${section.__typename}`);
          return null;
        }
        return <Component key={section.id} {...section} />;
      })}
    </>
  );
}
```

### Perché è importante

Questo pattern è il ponte tra il CMS e il frontend grafico. L'editor in DatoCMS compone la pagina aggiungendo e ordinando blocchi. Il SectionRenderer traduce quella composizione in componenti React. Quando il designer aggiunge un nuovo tipo di sezione, basta creare il componente e aggiungerlo alla mappa.

---

## 6. Componenti per le immagini DatoCMS

DatoCMS serve le immagini tramite Imgix CDN con supporto per responsive images. Il pacchetto `react-datocms` fornisce un componente `<Image />` ottimizzato:

```tsx
// components/datocms/DatoCmsImage.tsx

import { Image as DatoCmsImage } from 'react-datocms';

// Il componente accetta i dati responsiveImage restituiti dalle query GraphQL
// Gestisce automaticamente: srcset, sizes, lazy loading, blur-up placeholder

export { DatoCmsImage };
```

Nella query GraphQL, richiedere sempre il fragment `responsiveImage`:

```graphql
query {
  homepage {
    heroImage {
      responsiveImage(imgixParams: { fit: crop, w: 1200, h: 600 }) {
        src
        srcSet
        width
        height
        alt
        base64  # placeholder blur-up
      }
    }
  }
}
```

---

## 7. Rendering di Structured Text

Il contenuto ricco (articoli, pagine) usa il formato Structured Text di DatoCMS. Per renderizzarlo in React, usare il componente di `react-datocms`:

```tsx
import { StructuredText } from 'react-datocms';

// Nel componente della pagina/articolo:
<StructuredText
  data={page.content}
  renderBlock={({ record }) => {
    // Renderizza eventuali blocchi inline (es. immagini nel testo)
    switch (record.__typename) {
      case 'ImageBlockRecord':
        return <DatoCmsImage data={record.image.responsiveImage} />;
      default:
        return null;
    }
  }}
/>
```

---

## 8. Font personalizzati

Se il design richiede font specifici (es. Google Fonts), usare `next/font` per il caricamento ottimizzato:

```tsx
// app/layout.tsx
import { Inter, Montserrat } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-heading' });

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Poi nel `tailwind.config.js`:

```js
fontFamily: {
  heading: ['var(--font-heading)', 'sans-serif'],
  body: ['var(--font-body)', 'sans-serif'],
},
```

---

## 9. Prompt per AI grafica

Se si usa un'AI per generare il template grafico, ecco un prompt di partenza da adattare:

```
Crea un template per un sito web [vetrina/corporate] con queste caratteristiche:

- Framework: React con Tailwind CSS
- Pagine: Homepage, pagina generica, lista blog, articolo blog
- Sezioni homepage: Hero con CTA, sezione testo + immagine, call-to-action,
  galleria immagini, testimonial
- Stile: [descrizione dello stile desiderato: moderno, minimal, corporate, ecc.]
- Colori: [palette colori del brand]
- Font: [font preferiti]

Output richiesto: componenti React separati per ogni sezione,
con Tailwind CSS per lo styling. I contenuti devono essere
passati come props (non hardcoded nel componente).

Ogni componente deve accettare props tipizzate con TypeScript.
```

L'output dell'AI va poi integrato nella struttura componenti del progetto e collegato ai dati DatoCMS come descritto sopra.

---

## Checklist

- [ ] Framework CSS scelto e installato (Tailwind consigliato)
- [ ] Design token estratti e configurati in `tailwind.config.js`
- [ ] Font personalizzati configurati con `next/font`
- [ ] Componenti UI base creati (`Button`, `Card`, `Container`, ecc.)
- [ ] Componenti sezione creati (Hero, TextImage, CTA, Gallery, Testimonials)
- [ ] `SectionRenderer` implementato e mappato ai block models DatoCMS
- [ ] Componente wrapper per immagini DatoCMS configurato
- [ ] Rendering Structured Text configurato
- [ ] Layout Header/Footer creati e collegati ai dati Navigation/Site Settings

→ Prossimo passo: **04-personalizzazione.md**
