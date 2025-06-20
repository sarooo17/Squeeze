require('dotenv').config(); 

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose'); // <--- aggiunto
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const server = http.createServer(app);
// MODIFICA QUI: Aggiungi la configurazione CORS
const io = socketIo(server, {
  cors: {
    origin: "https://www.squeeze-it.com", // Assicurati che sia questo l'URL del client
    methods: ["GET", "POST"],
    credentials: true
  }
});

console.log(`Socket.IO server inizializzato. CORS origin: ${io.opts.cors.origin}`);

const PORT = process.env.PORT || 8080;
const BASE_COUNTER = 346;

// --- MONGODB SETUP ---
const mongoUri = process.env.MONGODB_URI; // Imposta questa variabile su Cloud Run!
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connesso a MongoDB Atlas!'))
  .catch(err => {
    console.error('Errore di connessione a MongoDB:', err);
    process.exit(1);
  });

const suggestionSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  suggestion: String,
  date: { type: Date, default: Date.now },
  referralCode: String, // codice personale dell'utente
  referredBy: String    // codice referral dell'amico che lo ha invitato
});
const Suggestion = mongoose.model('Suggestion', suggestionSchema);

// Array di template email (puoi aggiungerne altri)
const emailTemplates = [
  (logoUrl, userEmail, suggestion, userCode, referralLink, referredCount, hasDiscount) => `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>
        body { font-family: 'Outfit', sans-serif; background: #fffbe6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); overflow: hidden; }
        .header { text-align: center; padding: 36px 24px 16px; background: linear-gradient(90deg,#ffc300 60%,#ff8c00 100%); }
        .header img { max-width: 64px; }
        .title { font-size: 2rem; font-weight: 700; color: #fff; margin: 16px 0 6px; }
        .subtitle { font-size: 1.2rem; color: #fff; }
        .section { padding: 0 32px 32px; }
        .features { background: #fff3e6; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .features li { margin-bottom: 10px; font-size: 1rem; }
        .cta-button { display: inline-block; background: #ff8c00; color: #fff; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: 600; margin-top: 18px; }
        .referral { background: #eaf1f5; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center; }
        .referral-link { font-size: 1.1rem; color: #ff8c00; word-break: break-all; }
        .discount { color: #27ae60; font-weight: bold; }
        .footer { font-size: 12px; color: #777; text-align: center; padding: 20px; background: #f9fafb; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Squeeze Calendar" />
          <div class="title">Benvenuto in Squeeze 🎉</div>
          <div class="subtitle">Sei Insider #${userCode || '0001'}</div>
        </div>
        <div class="section">
          <p>Ciao ${userEmail || 'amico'},</p>
          <p>Grazie per esserti iscritto a <b>Squeeze Calendar</b>! Sei tra i primi a provare il calendario che si adatta davvero a te.</p>
          <div class="features">
            <b>Cosa rende Squeeze speciale:</b>
            <ul>
              <li>🤖 Intelligenza artificiale che impara da te</li>
              <li>📆 Interfaccia moderna e pulita</li>
              <li>💬 Creazione eventi in stile chat</li>
            </ul>
          </div>
          <div class="referral">
            <b>Invita i tuoi amici e ottieni uno <span class="discount">sconto esclusivo!</span></b><br>
            <span>Condividi questo link:</span>
            <div class="referral-link">${referralLink}</div>
            <div style="margin-top:10px;">
              <span>Amici iscritti tramite te: <b>${referredCount}</b> / 3</span><br>
              ${hasDiscount ? '<span class="discount">🎁 Hai sbloccato lo sconto!</span>' : '<span>Invita almeno 3 amici per ottenere lo sconto</span>'}
            </div>
          </div>
          <a href="https://www.squeeze-it.com/community" class="cta-button">Unisciti alla Community</a>
          <p style="margin-top:18px;">💡 <i>Invita amici e sblocca vantaggi esclusivi!</i></p>
          <p>Resta sintonizzato — ti invieremo anteprime e inviti alla beta.</p>
          <p>Con gratitudine,<br><b>Il Team Squeeze</b></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Squeeze. Ti sei iscritto su <a href="https://www.squeeze-it.com">squeeze-it.com</a>.
        </div>
      </div>
    </body>
    </html>
  `
  // Puoi aggiungere altri template qui!
];

// Funzione per inviare l'email di ringraziamento
async function sendThankYouEmail(userEmail, suggestion, referralLink, referredCount, hasDiscount) {
  const logoUrl = process.env.LOGO_URL || 'https://www.squeeze-it.com/assets/images/logo.png';
  // Scegli un template casuale
  const templateFn = emailTemplates[Math.floor(Math.random() * emailTemplates.length)];
  const html = templateFn(logoUrl, userEmail, suggestion, emailCounter, referralLink, referredCount, hasDiscount);

  const msg = {
    to: userEmail,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'Squeeze'
    },
    subject: 'Benvenuto nella lista d’attesa di Squeeze Calendar! 🎉',
    html
  };

  try {
    await sgMail.send(msg);
    console.log('Email di ringraziamento inviata a:', userEmail);
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email di ringraziamento:', error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
}

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 10);
}

const path = require('path');
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  maxAge: '1y',
  immutable: true
}));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- SOCKET.IO ---
let emailCounter = BASE_COUNTER;

async function updateCounterAndBroadcast() {
  const count = await Suggestion.countDocuments();
  emailCounter = BASE_COUNTER + count;
  io.emit('updateCounter', emailCounter);
}

io.on('connection', (socket) => {
  console.log('Nuova connessione socket:', socket.id);

  socket.on('newEmail', async ({ email, suggestion, referredBy }) => {
    console.log('Ricevuta richiesta newEmail:', email, suggestion, referredBy);
    try {
      // Non accettare email duplicate
      const existing = await Suggestion.findOne({ email });
      if (existing) {
        socket.emit('registrationError', { message: 'Email già registrata.' });
        return;
      }

      // Genera referralCode personale
      const referralCode = generateReferralCode();

      // Salva nel DB
      await Suggestion.create({ email, suggestion, referralCode, referredBy });

      // Conta quanti amici ha invitato
      const referredCount = await Suggestion.countDocuments({ referredBy: referralCode });

      // Sblocco sconto
      const hasDiscount = referredCount >= 3;

      // Aggiorna il counter e notifica tutti i client
      await updateCounterAndBroadcast();

      // Crea il referral link
      const referralLink = `https://www.squeeze-it.com/?ref=${referralCode}`;

      // Invia l'email di ringraziamento
      await sendThankYouEmail(email, suggestion, referralLink, referredCount, hasDiscount);

    } catch (err) {
      console.error('Errore durante salvataggio/invio email:', err);
      socket.emit('registrationError', { message: 'Errore durante la registrazione.' });
    }
  });

  // Invia il counter iniziale al client che si connette
  socket.on('getInitialCounter', async () => {
    await updateCounterAndBroadcast();
    socket.emit('updateCounter', emailCounter);
  });
});

io.engine.on("connection_error", (err) => {
  console.error("Socket.IO Engine Connection Error:");
  // console.error("Richiesta:", err.req); // L'oggetto richiesta può essere grande
  console.error("Codice errore:", err.code);
  console.error("Messaggio:", err.message);
  console.error("Contesto:", err.context);
});

const compression = require('compression');
app.use(compression());

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});