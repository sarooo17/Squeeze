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

// Array di template email (puoi aggiungerne altri)
const emailTemplates = [
  (logoUrl, userEmail, suggestion, userCode) => `
    <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>
          body { font-family: 'Outfit', sans-serif; background: linear-gradient(135deg, #f4f6f8, #eaf1f5); margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.05); overflow: hidden; }
          .header { text-align: center; padding: 36px 24px 16px; }
          .header img { max-width: 64px; }
          .title { font-size: 2rem; font-weight: 700; color: #ff8c00; margin: 16px 0 6px; }
          .subtitle { font-size: 1.2rem; color: #333; }
          .section { padding: 0 32px 32px; }
          .features { background: #fff3e6; border-radius: 12px; padding: 18px; margin: 20px 0; }
          .features li { margin-bottom: 10px; font-size: 1rem; }
          .cta-button { display: inline-block; background: #ff8c00; color: #fff; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: 600; margin-top: 18px; }
          .footer { font-size: 12px; color: #777; text-align: center; padding: 20px; background: #f9fafb; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Squeeze Calendar" />
            <div class="title">Welcome to Squeeze 🎉</div>
            <div class="subtitle">You’re Insider #${userCode || '0001'}</div>
          </div>
          <div class="section">
            <p>Hi ${userEmail || 'there'},</p>
            <p>Thank you for joining the <b>Squeeze Calendar</b> journey! You’re part of an early community helping us create a calendar that works for <i>you</i>.</p>
            <div class="features">
              <b>What makes Squeeze special:</b>
              <ul>
                <li>🤖 AI that learns your rhythm</li>
                <li>📆 A clean, modern calendar interface</li>
                <li>💬 Natural, chat-like task creation</li>
              </ul>
            </div>
            <a href="https://www.squeeze-it.com/community" class="cta-button">Join Our Community</a>
            <p style="margin-top:18px;">💡 <i>Tip: Invite friends and unlock early access perks!</i></p>
            <p>Stay tuned — we’ll send you sneak peeks and early beta invites soon.</p>
            <p>With gratitude,<br><b>The Squeeze Team</b></p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Squeeze. You signed up at <a href="https://www.squeeze-it.com">squeeze-it.com</a>.
          </div>
        </div>
      </body>
      </html>
  `
  // Puoi aggiungere altri template qui!
];

// Funzione per inviare l'email di ringraziamento
async function sendThankYouEmail(userEmail, suggestion) {
  const logoUrl = process.env.LOGO_URL || 'https://www.squeeze-it.com/assets/images/logo.png';
  // Scegli un template casuale
  const templateFn = emailTemplates[Math.floor(Math.random() * emailTemplates.length)];
  const html = templateFn(logoUrl, userEmail, suggestion, emailCounter);

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

const compression = require('compression');
app.use(compression());

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});