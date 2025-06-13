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
  email: String,
  suggestion: String,
  date: { type: Date, default: Date.now }
});
const Suggestion = mongoose.model('Suggestion', suggestionSchema);

// Funzione per inviare l'email di ringraziamento
async function sendThankYouEmail(userEmail, suggestion) {
  const logoUrl = process.env.LOGO_URL || 'https://www.squeeze-it.com/assets/images/logo.png';

  const msg = {
    to: userEmail,
    from: process.env.EMAIL_FROM,
    subject: 'Benvenuto nella lista d’attesa di Squeeze Calendar! 🎉',
    html: `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', Arial, sans-serif; background: #f4f6f8; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 14px; box-shadow: 0 6px 20px rgba(0,0,0,0.07); overflow: hidden; }
          .header { text-align: center; padding: 32px 20px 18px 20px; }
          .header img { max-width: 48px; }
          .title { color: #ff8c00; font-size: 2rem; font-weight: 700; margin: 18px 0 8px 0; }
          .subtitle { color: #333; font-size: 1.1rem; margin-bottom: 18px; }
          .section { padding: 0 32px 24px 32px; }
          .features { background: #fff9e6; border-radius: 10px; padding: 18px 20px; margin: 18px 0; }
          .features ul { padding-left: 18px; }
          .features li { margin-bottom: 8px; }
          .highlight { color: #ff8c00; font-weight: 600; }
          .suggestion { margin: 18px 0; font-style: italic; color: #555; background: #f8f9fa; border-left: 4px solid #ff8c00; padding: 10px 18px; border-radius: 6px; }
          .privilege { background: #eafbe7; color: #1b7f3a; border-radius: 8px; padding: 14px 18px; margin: 18px 0; font-weight: 600; }
          .footer { text-align: center; font-size: 12px; color: #888; padding: 18px 20px; background: #f8f9fa; border-top: 1px solid #eee; }
          @media (max-width: 600px) { .container, .section { padding: 10px !important; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Squeeze Calendar Logo">
            <div class="title">Ci sei anche tu 🎉</div>
            <div class="subtitle">Benvenuto tra i pionieri di <span class="highlight">Squeeze Calendar</span></div>
          </div>
          <div class="section">
            <p>Ciao,</p>
            <p>Siamo entusiasti di averti tra i primi a scoprire <b>Squeeze</b>, il calendario intelligente che sfrutta l’<span class="highlight">Intelligenza Artificiale</span> per aiutarti a organizzare meglio il tuo tempo e ridurre lo stress.</p>
            <div class="features">
              <b>Le funzionalità principali di Squeeze:</b>
              <ul>
                <li>✨ <b>Organizzazione automatica</b> degli eventi e delle priorità</li>
                <li>🤖 <b>Suggerimenti smart</b> per ottimizzare la tua giornata</li>
                <li>🔔 <b>Promemoria intelligenti</b> e personalizzati</li>
                <li>📊 <b>Statistiche</b> e consigli per migliorare la tua produttività</li>
                <li>🌙 <b>Modalità relax</b> per trovare il giusto equilibrio</li>
              </ul>
            </div>
            <div class="privilege">
              Sei tra i <b>primi iscritti</b>! Riceverai aggiornamenti esclusivi e potrai provare Squeeze in anteprima.
            </div>
            <p>Il tuo suggerimento:</p>
            <div class="suggestion">
              ${suggestion}
            </div>
            <p>Il tuo feedback è prezioso per noi: ci aiuterà a costruire un prodotto davvero utile e su misura per te.</p>
            <p>Resta sintonizzato, ti aggiorneremo appena Squeeze sarà pronto per il lancio!</p>
            <p>Un caro saluto,<br><b>Il team di Squeeze</b></p>
          </div>
          <div class="section">
            <h3 style="font-size: 1.1rem; margin-bottom: 12px; color: #ff8c00;">Chi c’è dietro Squeeze?</h3>
            <p>
              Siamo un piccolo team italiano con un grande obiettivo: aiutare le persone a organizzare meglio il proprio tempo, con l’aiuto dell’AI, ma senza complicazioni.  
              Abbiamo creato Squeeze perché anche noi ci siamo sentiti sopraffatti da calendari, notifiche e to-do sparsi ovunque.
            </p>
            <p>
              Crediamo in strumenti semplici, intelligenti e umani.  
              E vogliamo costruirli insieme a chi li userà davvero: <b>tu</b>.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Squeeze. Ricevi questa email perché ti sei iscritto su <a href="https://www.squeeze-it.com/">squeeze-it.com</a>.
          </div>
        </div>
      </body>
      </html>
    `
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


const path = require('path');
app.use('/assets', express.static(path.join(__dirname, 'assets')));
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
  console.log(`Nuovo client connesso: ${socket.id} da ${socket.handshake.address}`);
  
  socket.on('joinRoom', (room) => {
    socket.join(room);
    socket.room = room;
    console.log(`Client ${socket.id} si è unito alla stanza ${room}`);
  });

  socket.on('candidate', (data) => {
    socket.to(socket.room).emit('candidate', { 
      candidate: data,
      id: socket.id 
    });
    // console.log(`Candidato ICE ricevuto da ${socket.id} per la stanza ${socket.room}:`, data); // Potrebbe essere troppo verboso
  });

  socket.on('offer', (data) => {
    socket.to(socket.room).emit('offer', {
      offer: data,
      id: socket.id
    });
    // console.log(`Offerta ricevuta da ${socket.id} per la stanza ${socket.room}:`, data); // Potrebbe essere troppo verboso
  });

  socket.on('answer', (data) => {
    socket.to(socket.room).emit('answer', {
      answer: data,
      id: socket.id
    });
    // console.log(`Risposta ricevuta da ${socket.id} per la stanza ${socket.room}:`, data); // Potrebbe essere troppo verboso
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnesso: ${socket.id}`);
    // Invia un messaggio agli altri client nella stanza
    socket.to(socket.room).emit('userDisconnected', { id: socket.id });
  });

  socket.on('error', (err) => {
    console.error(`Errore socket per client ${socket.id}:`, err);
  });

  socket.on('newEmail', async ({ email, suggestion }) => {
    try {
      // Salva nel DB
      await Suggestion.create({ email, suggestion });
      // Aggiorna il counter e notifica tutti i client
      await updateCounterAndBroadcast();
      // Invia l'email di ringraziamento
      await sendThankYouEmail(email, suggestion);
    } catch (err) {
      console.error('Errore durante salvataggio/invio email:', err);
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});