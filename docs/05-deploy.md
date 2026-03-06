# 05 — Deploy

> Obiettivo: mettere online il sito su Vercel, collegare GitHub per il deploy continuo e configurare i webhook DatoCMS per l'aggiornamento automatico dei contenuti.

---

## 1. Preparazione del repository GitHub

### Verifiche pre-push

Prima di pushare su GitHub:

- Assicurarsi che `.env.local` sia nel `.gitignore` (lo starter lo include già, ma verificare)
- Verificare che il build funzioni localmente: `npm run build`
- Controllare che non ci siano token o segreti hardcoded nel codice
- Fare un commit pulito con tutto il progetto

### Inizializzare Git nella cartella corretta

**Attenzione**: se la cartella del progetto è contenuta in una cartella padre che è già un repository Git (es. `VsCode/`), bisogna inizializzare un repository Git separato **dentro** la cartella del progetto:

```bash
cd nome-progetto
git init
```

Non eseguire `git init` nella cartella padre, altrimenti il commit includerà file di altri progetti.

### Configurazione identità Git (se non già configurata)

```bash
git config --global user.name "Nome Cognome"
git config --global user.email "email@esempio.com"
```

### Push su GitHub

```bash
git add .
git commit -m "Initial project setup"
git push -u origin main
```

Il modo più rapido per creare il repo GitHub e pushare in un solo comando (richiede GitHub CLI):

```bash
gh repo create nome-progetto --public --source=. --remote=origin --push
```

Se il repository GitHub non esiste ancora, crearlo prima su github.com (vuoto, senza README) e poi pushare.

> **Nota GitHub CLI**: se si usa `gh` CLI con la variabile d'ambiente `GITHUB_TOKEN` configurata nel sistema, potrebbe interferire. In caso di errore di autenticazione, provare con `GITHUB_TOKEN="" gh repo create ...` per ignorare la variabile di sistema.

---

## 2. Deploy su Vercel

### Collegamento progetto

1. Accedere a [vercel.com](https://vercel.com) e fare login (consigliato con l'account GitHub)
2. Cliccare **"Add New → Project"**
3. Selezionare il repository GitHub del progetto
4. Vercel rileverà automaticamente che è un progetto Next.js

### Configurazione variabili ambiente

Prima di lanciare il deploy, configurare le variabili ambiente su Vercel:

Nella schermata di setup del progetto, sotto **"Environment Variables"**, aggiungere:

**Con `nextjs-starter-kit`:**

| Variabile | Valore | Ambienti |
|-----------|--------|----------|
| `DATOCMS_PUBLISHED_CONTENT_CDA_TOKEN` | Token CDA Published | Production, Preview |
| `DATOCMS_DRAFT_CONTENT_CDA_TOKEN` | Token CDA Draft | Production, Preview |
| `SECRET_API_TOKEN` | Stringa generata | Production, Preview |

**Con `next-landing-page-demo`:**

| Variabile | Valore | Ambienti |
|-----------|--------|----------|
| `DATOCMS_READONLY_API_TOKEN` | Token da DatoCMS | Production, Preview |
| `SEO_SECRET_TOKEN` | Stringa generata | Production, Preview |
| `DRAFT_SECRET_TOKEN` | Stringa generata | Production, Preview |
| `CACHE_INVALIDATION_SECRET_TOKEN` | Stringa generata | Production, Preview |
| `URL` | URL definitivo del sito (es. `https://tuosito.vercel.app`) | Production |

> Verificare sempre il file `.env.example` dello starter per i nomi esatti delle variabili.

### Nota sugli ambienti Vercel

Vercel distingue tra tre ambienti:

- **Production**: il sito live, raggiungibile dal dominio principale
- **Preview**: deploy automatici per ogni branch/PR su GitHub — utili per test e review
- **Development**: variabili per `vercel dev` (locale)

Impostare i token DatoCMS sia su Production che su Preview. L'ambiente Development non è necessario se si usa `.env.local` in locale.

### Lancio del primo deploy

Cliccare **"Deploy"**. Vercel farà il build e pubblicherà il sito su un URL `.vercel.app`.

---

## 3. Webhook DatoCMS → Vercel

### Perché servono

Quando un editor pubblica o modifica un contenuto su DatoCMS, il sito deve aggiornarsi. Ci sono due meccanismi:

1. **Cache invalidation (ISR)** — invalida la cache delle pagine senza rifare il build completo. È il metodo preferito: veloce (secondi) e senza downtime.
2. **Rebuild completo** — rifà il build dell'intero sito. Più lento ma garantisce la coerenza totale. Utile come fallback.

Lo starter kit è predisposto per la cache invalidation tramite la route `/api/invalidate-cache`.

### Configurazione webhook di invalidazione cache

In DatoCMS, andare su **Settings → Webhooks** e creare un nuovo webhook:

- **Name**: `Cache Invalidation` (o simile)
- **URL**: `https://tuosito.vercel.app/api/invalidate-cache`
- **Headers personalizzati**: aggiungere `Authorization: Bearer <SECRET_API_TOKEN>` (lo stesso valore configurato nelle env di Vercel)
- **Events**: selezionare gli eventi di pubblicazione/modifica/cancellazione dei record (tipicamente "Record published", "Record updated", "Record deleted")

### Configurazione Build Trigger (opzionale)

Per un rebuild completo come fallback, si può configurare un Build Trigger:

1. Su Vercel, andare su **Settings → Git → Deploy Hooks**
2. Creare un deploy hook (es. `DatoCMS Publish`) — Vercel genera un URL
3. Su DatoCMS, andare su **Settings → Build Triggers**
4. Creare un nuovo trigger con l'URL del deploy hook di Vercel
5. L'editor potrà lanciare un rebuild manuale dalla dashboard DatoCMS

### Quale usare?

- **Cache invalidation**: per la maggior parte dei casi. Aggiorna le singole pagine in pochi secondi.
- **Build trigger**: per cambiamenti strutturali (nuove pagine, modifica navigazione) o come azione manuale di sicurezza.

In pratica, con Next.js App Router e la cache invalidation ben configurata, il build trigger serve raramente.

---

## 4. Dominio personalizzato

### Configurazione su Vercel

1. Su Vercel, andare su **Settings → Domains**
2. Aggiungere il dominio (es. `tuosito.com`)
3. Vercel mostrerà i record DNS da configurare

### Configurazione DNS

Presso il registrar del dominio (es. Cloudflare, GoDaddy, Aruba, ecc.):

- **Per il dominio root** (tuosito.com): aggiungere un record `A` che punta a `76.76.21.21`
- **Per il www**: aggiungere un record `CNAME` che punta a `cname.vercel-dns.com`

La propagazione DNS può richiedere da pochi minuti a 48 ore.

### SSL

Vercel configura automaticamente il certificato SSL (HTTPS) per il dominio personalizzato. Non serve fare nulla.

---

## 5. Aggiornamento URL nei servizi

Dopo aver configurato il dominio definitivo, aggiornare:

### DatoCMS

- **Web Previews plugin**: aggiornare l'URL del frontend con il dominio definitivo
- **Webhook**: aggiornare l'URL di invalidazione cache con il dominio definitivo
- **Build Trigger** (se configurato): l'URL del deploy hook Vercel non cambia, ma verificare

### Vercel

- Verificare che il dominio sia attivo e il certificato SSL funzionante
- Controllare che i redirect da `www` a non-www (o viceversa) siano configurati correttamente

### Codice

- Aggiornare la `baseUrl` nella sitemap (`app/sitemap.ts`)
- Aggiornare la `baseUrl` nel robots.txt se hardcoded
- Aggiornare eventuali URL assoluti nei meta tag o canonical

---

## 6. Deploy continuo

Con GitHub + Vercel, il deploy continuo è automatico:

- **Push su `main`** → Vercel fa il build e deploya in produzione
- **Push su altri branch** → Vercel crea un deploy di preview con URL temporanea
- **Pull Request** → Vercel genera una preview e aggiunge il link nella PR su GitHub

### Workflow consigliato

1. Sviluppare su un branch (`git checkout -b feature/nome-feature`)
2. Pushare il branch → Vercel crea una preview
3. Testare sulla preview
4. Aprire una PR verso `main`
5. Merge → deploy automatico in produzione

---

## 7. Monitoraggio e manutenzione

### Vercel

- **Analytics** (se abilitato): dati su performance, Web Vitals, traffico
- **Logs**: consultabili dalla dashboard Vercel per debug
- **Speed Insights**: monitoraggio performance delle pagine

### DatoCMS

- **Activity Log**: ogni modifica ai contenuti è tracciata
- **Media Library**: tenere pulita — rimuovere asset non utilizzati
- **API Token usage**: verificare periodicamente che i token siano usati e rimuovere quelli inattivi

### Aggiornamenti periodici

- Aggiornare le dipendenze npm periodicamente (`npm outdated`, poi `npm update`)
- Verificare aggiornamenti dello starter kit per nuove best practice
- Controllare le release notes di Next.js per breaking changes

---

## 8. Troubleshooting comuni

### Il sito non si aggiorna dopo una modifica su DatoCMS

1. Verificare che il webhook di invalidazione cache sia configurato correttamente
2. Controllare i log del webhook su DatoCMS (Settings → Webhooks → ultimo delivery)
3. Verificare che il `SECRET_API_TOKEN` nel webhook corrisponda a quello nelle env di Vercel
4. Come fallback, lanciare un rebuild manuale da Vercel o dal Build Trigger

### Errore di build su Vercel

1. Controllare i log di build su Vercel
2. Verificare che le variabili ambiente siano configurate
3. Testare il build in locale (`npm run build`)
4. Errore comune: tipi GraphQL non aggiornati → rigenerare con `npm run generate:datocms`

### Immagini non caricate

1. Verificare che `www.datocms-assets.com` sia nei `remotePatterns` di `next.config.js`
2. Controllare che le immagini siano caricate nella Media Library di DatoCMS
3. Verificare la query GraphQL: il fragment `responsiveImage` deve essere presente

### Draft Mode non funziona

1. Verificare che il plugin Web Previews sia configurato con l'URL corretto del frontend
2. Controllare che il token CDA Draft sia nelle variabili ambiente
3. Verificare che la route `/api/draft-mode` sia implementata e protetta dal `SECRET_API_TOKEN`

---

## Checklist finale

- [ ] Repository pushato su GitHub
- [ ] Progetto Vercel creato e collegato al repo
- [ ] Variabili ambiente configurate su Vercel (Production + Preview)
- [ ] Primo deploy completato con successo
- [ ] Webhook cache invalidation configurato su DatoCMS
- [ ] Build Trigger configurato (opzionale)
- [ ] Dominio personalizzato configurato con DNS e SSL
- [ ] URL aggiornati in DatoCMS (Web Previews, webhook)
- [ ] URL aggiornati nel codice (sitemap, robots)
- [ ] Deploy continuo verificato (push → deploy automatico)
- [ ] Sito live e accessibile dal dominio definitivo

---

## Riepilogo del flusso completo

```
1. Editor modifica contenuto su DatoCMS
2. Editor clicca "Publish"
3. DatoCMS invia webhook a /api/invalidate-cache
4. Next.js invalida la cache delle pagine interessate
5. Il prossimo visitatore vede il contenuto aggiornato (in pochi secondi)

Per modifiche al codice:
1. Sviluppatore modifica il codice localmente
2. Push su branch → Vercel crea preview
3. Test sulla preview
4. Merge su main → Vercel deploya in produzione
```
