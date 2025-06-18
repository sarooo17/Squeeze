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
  (logoUrl, userEmail, suggestion) => `
    <!DOCTYPE html>
    <html lang="en">
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
          <div class="title">You're in 🎉</div>
          <div class="subtitle">Welcome to the <span class="highlight">Squeeze Calendar</span> waitlist</div>
        </div>
        <div class="section">
          <p>Hi there,</p>
          <p>We're thrilled to have you among the first to discover <b>Squeeze</b>, the intelligent calendar designed to help you stay organized and reduce stress using <span class="highlight">Artificial Intelligence</span>.</p>
          <div class="features">
            <b>What you’ll get first:</b>
            <ul>
              <li>📆 <b>Smart calendar</b> that understands and organizes your events</li>
              <li>💬 <b>Chat-like interface</b> to add tasks and plans naturally</li>
              <li>🤖 <b>AI support</b> to simplify daily planning</li>
            </ul>
            <p style="margin-top:12px;">
              ...and there's more coming soon: intelligent suggestions, advanced scheduling, personalized reminders, and a smoother way to manage your time.
            </p>
          </div>
          <div class="privilege">
            You're one of our <b>early insiders</b>! You’ll receive exclusive updates and get to try Squeeze before anyone else.
          </div>
          <p>Your suggestion to us:</p>
          <div class="suggestion">
            ${suggestion}
          </div>
          <p>
            <b>Thank you!</b> Your feedback means a lot to us. Every idea, thought, or wish is carefully reviewed by our team.<br><br>
            <span style="color:#ff8c00;font-weight:600;">Squeeze was born to help people plan better, stress less, and make the most of their time—with a little help from AI.</span>  
            With your input, we’ll build something truly helpful for real people.
          </p>
          <p>Stay tuned—we’ll keep you updated as we get closer to launch!</p>
          <p>Warm regards,<br><b>The Squeeze Team</b></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Squeeze. You received this email because you signed up at <a href="https://www.squeeze-it.com/">squeeze-it.com</a>.
        </div>
      </div>
    </body>
    </html>
  `,
  (logoUrl, userEmail, suggestion) => `
    <!DOCTYPE html>
    <html lang="en">
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
          <div class="title">Welcome aboard! 🚀</div>
          <div class="subtitle">You're now on the <span class="highlight">Squeeze Calendar</span> waitlist</div>
        </div>
        <div class="section">
          <p>Hello!</p>
          <p>Thanks for joining the Squeeze Calendar waitlist. We're building a smarter, friendlier way to organize your life with a touch of AI magic.</p>
          <div class="features">
            <b>Why you'll love Squeeze:</b>
            <ul>
              <li>🧠 <b>AI-powered suggestions</b> for your daily plans</li>
              <li>📅 <b>Easy event management</b> with a modern calendar</li>
              <li>💬 <b>Chat with your calendar</b> just like a friend</li>
            </ul>
          </div>
          <div class="privilege">
            As an early subscriber, you'll get exclusive previews and the chance to shape Squeeze with your feedback!
          </div>
          <p>Your suggestion:</p>
          <div class="suggestion">
            ${suggestion}
          </div>
          <p>
            <b>We appreciate your input!</b> Every suggestion helps us make Squeeze better for everyone.<br>
            Stay tuned for updates and sneak peeks.
          </p>
          <p>Cheers,<br><b>The Squeeze Team</b></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Squeeze. You received this email because you signed up at <a href="https://www.squeeze-it.com/">squeeze-it.com</a>.
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
  const html = templateFn(logoUrl, userEmail, suggestion);

  const msg = {
    to: userEmail,
    from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: 'Squeeze',
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