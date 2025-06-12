require('dotenv').config(); 

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose'); // <--- aggiunto
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//sgMail.setDataResidency('EU');

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

  const emailTextVariations = [
    {
      greeting: "Hello there,",
      intro: "We're genuinely excited to have you on the waitlist for Squeeze Calendar. Your input is incredibly valuable as we craft a calendar experience designed to help you <span class=\"squeeze-emphasis\">breathe</span>.",
      acknowledgement: "You suggested:",
      postSuggestion: "We're pouring our energy into making Squeeze a reality, and your feedback is a key ingredient.",
      closing: "Stay organized, stay inspired!",
      signOff: "Warmly,"
    },
    {
      greeting: "Hi!",
      intro: "A big thank you for joining the Squeeze Calendar waitlist! We're thrilled to have your support and especially appreciate you sharing your thoughts. It helps us build a calendar that truly makes a difference.",
      acknowledgement: "Your idea was:",
      postSuggestion: "We're hard at work on Squeeze, and insights like yours are lighting the way.",
      closing: "Looking forward to launching soon!",
      signOff: "Best,"
    },
    {
      greeting: "Hey there,",
      intro: "Welcome to the Squeeze community! Thanks for signing up and for taking the time to send us your suggestion. We're building Squeeze to help you find more <span class=\"squeeze-emphasis\">calm</span> in your schedule.",
      acknowledgement: "We've noted your suggestion:",
      postSuggestion: "Every piece of feedback, like yours, helps us get closer to that goal.",
      closing: "Keep an eye out for updates!",
      signOff: "Cheers,"
    },
    {
      greeting: "Greetings!",
      intro: "It's great to have you on the Squeeze Calendar waitlist! We're so grateful you've shared your perspective with us – it's vital for creating a tool that genuinely helps people <span class=\"squeeze-emphasis\">focus</span> on what matters.",
      acknowledgement: "Regarding your suggestion:",
      postSuggestion: "Your input is now part of our development journey as we build Squeeze.",
      closing: "We're excited for what's to come!",
      signOff: "Sincerely,"
    }
  ];

  const selectedText = emailTextVariations[Math.floor(Math.random() * emailTextVariations.length)];

  const msg = {
    to: userEmail,
    from: process.env.EMAIL_FROM, // <-- solo stringa!
    subject: 'Welcome to the Squeeze Calendar Waitlist! ✨',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Outfit', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f6f8; 
            color: #4a4a4a;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .email-wrapper {
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff; 
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 6px 20px rgba(0,0,0,0.07);
          }
          .email-logo-section {
            padding: 30px 20px 20px 20px;
            text-align: center;
          }
          .email-logo-section img {
            max-width: 45px; 
            height: auto;
          }
          .email-body {
            padding: 0px 35px 30px 35px;
            line-height: 1.65;
            font-size: 16px;
          }
          .email-title {
            color: #ff8c00; 
            font-size: 26px;
            font-weight: 700;
            text-align: center;
            margin-top: 0;
            margin-bottom: 25px;
          }
          .email-body p {
            margin-bottom: 18px;
          }
          .suggestion-quote {
            background-color: #fff9e6; 
            border-left: 4px solid #ffc300; 
            padding: 15px 20px;
            margin: 25px 0;
            font-style: italic;
            color: #5c5c5c;
          }
          .highlight-text {
            color: #ff8c00; 
            font-weight: 600;
          }
          .email-footer {
            text-align: center;
            padding: 25px 20px;
            background-color: #f8f9fa; 
            font-size: 12px;
            color: #777777;
            border-top: 1px solid #eeeeee;
          }
          .email-footer a {
            color: #ff8c00; 
            text-decoration: none;
            font-weight: 500;
          }
          .brand-font {
             font-family: 'Outfit', Arial, sans-serif;
          }
          .squeeze-emphasis {
            color: #ff8c00; 
            font-weight: 700; 
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-logo-section">
              <img src="${logoUrl}" alt="Squeeze Calendar Logo">
            </div>
            <div class="email-body">
              <h1 class="email-title brand-font">Thanks for joining Squeeze!</h1>
              <p class="brand-font">${selectedText.greeting}</p>
              <p class="brand-font">${selectedText.intro}</p>
              <p class="brand-font">${selectedText.acknowledgement}</p>
              <div class="suggestion-quote brand-font">
                ${suggestion}
              </div>
              <p class="brand-font">${selectedText.postSuggestion}</p>
              <p class="brand-font">We'll reach out to you at <strong class="highlight-text">${userEmail}</strong> the moment we're ready to launch.</p>
              <p class="brand-font">${selectedText.closing}</p>
              <p class="brand-font">${selectedText.signOff}<br><strong class="brand-font">The Squeeze Team</strong></p>
            </div>
            <div class="email-footer brand-font">
              <p>&copy; ${new Date().getFullYear()} Squeeze. All rights reserved.</p>
              <p>You're receiving this because you signed up on <a href="https://www.squeeze-it.com/">squeeze-it.com</a>.</p>
            </div>
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