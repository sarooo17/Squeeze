require('dotenv').config(); // AGGIUNGI QUESTA RIGA ALL'INIZIO DEL FILE

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer'); // AGGIUNTO: Nodemailer

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const SUGGESTIONS_FILE_PATH = path.join(__dirname, 'suggestions.json');

let emailCounter = 346;

// Funzione per leggere i suggerimenti (invariata)
function readSuggestions() {
  try {
    if (fs.existsSync(SUGGESTIONS_FILE_PATH)) {
      const data = fs.readFileSync(SUGGESTIONS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Errore durante la lettura di suggestions.json:', error);
  }
  return [];
}

// Funzione per scrivere i suggerimenti (invariata)
function writeSuggestions(suggestions) {
  try {
    fs.writeFileSync(SUGGESTIONS_FILE_PATH, JSON.stringify(suggestions, null, 2), 'utf8');
  } catch (error) {
    console.error('Errore durante la scrittura di suggestions.json:', error);
  }
}

// AGGIUNTO: Configurazione del transporter di Nodemailer
// SOSTITUISCI QUESTO CON LA CONFIGURAZIONE DEL TUO SERVIZIO EMAIL REALE
// Per esempio, usando un account Gmail (per test, meno sicuro per produzione):
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'TUA_EMAIL_GMAIL@gmail.com', // La tua email Gmail
//     pass: 'TUA_PASSWORD_GMAIL_O_PASSWORD_PER_APP' // La tua password Gmail o una password per app
//   }
// });
// Per servizi come SendGrid, Mailgun, etc., la configurazione sarà diversa.
// Consulta la documentazione di Nodemailer e del tuo provider.
// È FONDAMENTALE USARE VARIABILI D'AMBIENTE PER LE CREDENZIALI IN PRODUZIONE!
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Sostituisci con l'host SMTP del tuo provider
  port: 587, // O 465 per SSL
  secure: false, // true per la porta 465, false per altre
  auth: {
    user: process.env.EMAIL_USER, // USA VARIABILI D'AMBIENTE
    pass: process.env.EMAIL_PASS  // USA VARIABILI D'AMBIENTE
  },
  tls: {
    // Non fallire su certificati self-signed (per alcuni server di test locali)
    // Rimuovi in produzione se usi un provider affidabile
    // rejectUnauthorized: false 
  }
});

// AGGIUNTO: Funzione per inviare l'email di ringraziamento
async function sendThankYouEmail(userEmail, suggestion) {
  const logoUrl = 'https://www.squeeze-it.com/assets/images/logo.png'; // MODIFICA QUI con l'URL pubblico del tuo logo

  // AGGIUNTO: Array di variazioni testuali
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

  // Seleziona una variazione testuale casuale
  const selectedText = emailTextVariations[Math.floor(Math.random() * emailTextVariations.length)];

  const mailOptions = {
    from: `"Squeeze Calendar" <${process.env.EMAIL_FROM || 'rickysaro17@gmail.com'}>`,
    to: userEmail,
    subject: 'Welcome to the Squeeze Calendar Waitlist! ✨', // L'oggetto può anche essere variato se lo desideri
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
    let info = await transporter.sendMail(mailOptions);
    console.log('Email di ringraziamento inviata: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Utile con ethereal.email
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email di ringraziamento:', error);
  }
}


app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Un client si è connesso');

  socket.on('getInitialCounter', () => {
    socket.emit('updateCounter', emailCounter);
  });
  
  socket.on('newEmail', async (data) => { // MODIFICATO: reso async
    const { email, suggestion } = data;
    if (!email || !suggestion) {
      console.error('Dati email o suggerimento mancanti:', data);
      return; 
    }
    console.log('Nuova email ricevuta:', email, 'con suggerimento:', suggestion);
    
    const suggestions = readSuggestions();
    suggestions.push({ email, suggestion, timestamp: new Date().toISOString() });
    writeSuggestions(suggestions);

    emailCounter++;
    io.emit('updateCounter', emailCounter);

    // INVIA L'EMAIL DI RINGRAZIAMENTO
    await sendThankYouEmail(email, suggestion).catch(err => {
        console.error("Fallimento nell'invio dell'email in background:", err);
    });
  });

  socket.on('disconnect', () => {
    console.log('Un client si è disconnesso');
  });
});

server.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
  console.log(`Apri http://localhost:${PORT} nel tuo browser.`);
  // Esempio di come potresti impostare le variabili d'ambiente per il test (NON PER PRODUZIONE)
  // process.env.EMAIL_USER = 'tua_email@provider.com';
  // process.env.EMAIL_PASS = 'tua_password';
  // process.env.EMAIL_FROM = 'nome_app@provider.com';
  // console.log("Ricorda di configurare le variabili d'ambiente EMAIL_USER, EMAIL_PASS, EMAIL_FROM per l'invio email.");
});