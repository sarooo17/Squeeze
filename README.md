# Squeeze Calendar - Coming Soon Page

Questa è la pagina "Coming Soon" e il backend di base per Squeeze Calendar, un nuovo modo di organizzare i tuoi eventi. Questo progetto include una landing page statica per raccogliere l'interesse degli utenti e un backend Node.js per gestire le iscrizioni alla lista d'attesa e inviare email di ringraziamento.

## ✨ Caratteristiche

**Frontend (Landing Page):**
*   Design moderno e responsive con animazioni.
*   Loader animato all'avvio della pagina.
*   Slogan dinamici che cambiano periodicamente.
*   Contatore animato degli utenti iscritti alla lista d'attesa.
*   Modulo multi-step per raccogliere suggerimenti e indirizzi email.
*   Integrazione con Google Analytics.
*   Ottimizzato per SEO e condivisione sui social media (meta tag Open Graph e Twitter Card).
*   Pagina 404 personalizzata.

**Backend (Node.js):**
*   Server Express.
*   Integrazione con Socket.IO per la comunicazione in tempo reale (aggiornamento del contatore).
*   Salvataggio dei suggerimenti e delle email su MongoDB Atlas.
*   Invio di email di ringraziamento personalizzate tramite SendGrid.
*   Gestione delle variabili d'ambiente con `dotenv`.
*   Logica per il conteggio degli iscritti (base + utenti dal DB).

## 🛠️ Tech Stack

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
*   **Backend:** Node.js, Express.js
*   **Real-time Communication:** Socket.IO
*   **Database:** MongoDB (con Mongoose ODM)
*   **Email Service:** SendGrid
*   **Deployment Frontend:** GitHub Pages
*   **Deployment Backend:** Google Cloud Run
*   **Font:** Google Fonts (Outfit)
*   **Analytics:** Google Analytics

## 🚀 Setup e Installazione (Backend)

1.  **Clona il repository (se non l'hai già fatto):**
    ```bash
    git clone https://github.com/sarooo17/Squeeze.git
    cd Squeeze
    ```

2.  **Installa le dipendenze:**
    ```bash
    npm install
    ```

3.  **Crea un file `.env`** nella root del progetto e aggiungi le seguenti variabili d'ambiente (vedi [`.env`](.env) per un esempio):
    ```env
    SENDGRID_API_KEY="LA_TUA_API_KEY_SENDGRID"
    MONGODB_URI="LA_TUA_CONNECTION_STRING_MONGODB_ATLAS"
    EMAIL_FROM="tua_email_mittente@example.com"
    LOGO_URL="https://www.squeeze-it.com/assets/images/logo.png" # o il tuo URL del logo
    PORT=8080 # o la porta che preferisci per lo sviluppo locale
    ```

4.  **Avvia il server di sviluppo:**
    ```bash
    npm start
    ```
    Il backend sarà in ascolto su `http://localhost:8080` (o la porta specificata).

## 🌐 Deployment

*   **Frontend:** La cartella [`docs`](docs) è configurata per essere servita tramite GitHub Pages su `https://www.squeeze-it.com`. Il file [`docs/CNAME`](docs/CNAME) gestisce il dominio personalizzato.
*   **Backend:** Il backend ([`server.js`](server.js)) è progettato per essere deployato su una piattaforma di hosting Node.js come Google Cloud Run, Heroku, Vercel, ecc. Assicurati di configurare le variabili d'ambiente necessarie sulla piattaforma di hosting.

## 📄 Licenza

Copyright (c) 2025 Squeeze. All Rights Reserved.

Questo progetto è software proprietario. Non è consentito l'uso, la copia, la modifica, la distribuzione o la sublicenza senza espressa autorizzazione scritta.