require('dotenv').config(); 

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000; // Già corretto per Elastic Beanstalk
const SUGGESTIONS_FILE_PATH = path.join(__dirname, 'suggestions.json');

let emailCounter = 346; // Considera di rendere persistente anche questo se necessario

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
// ATTENZIONE: Questa scrittura su file non sarà persistente su Elastic Beanstalk
// a causa del filesystem effimero. Dovrai passare a un database.
function writeSuggestions(suggestions) {
  try {
    fs.writeFileSync(SUGGESTIONS_FILE_PATH, JSON.stringify(suggestions, null, 2), 'utf8');
  } catch (error) {
    console.error('Errore durante la scrittura di suggestions.json:', error);
  }
}

// Configurazione del transporter di Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // USA VARIABILE D'AMBIENTE (es. email-smtp.us-east-1.amazonaws.com per SES)
  port: parseInt(process.env.SMTP_PORT || "587"), // USA VARIABILE D'AMBIENTE (es. 587 per SES con STARTTLS)
  secure: process.env.SMTP_SECURE === 'true', // USA VARIABILE D'AMBIENTE (es. false per SES con STARTTLS sulla porta 587)
  auth: {
    user: process.env.EMAIL_USER, // Già corretto
    pass: process.env.EMAIL_PASS  // Già corretto
  }
  // La sezione tls: { rejectUnauthorized: false } è stata rimossa,
  // non dovrebbe essere necessaria con un provider affidabile come SES.
});

// Funzione per inviare l'email di ringraziamento
async function sendThankYouEmail(userEmail, suggestion) {
  // USA VARIABILE D'AMBIENTE per l'URL del logo, con un fallback se non definita
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

  // Seleziona una variazione testuale casuale
  const selectedText = emailTextVariations[Math.floor(Math.random() * emailTextVariations.length)];

  const mailOptions = {
    from: `"Squeeze Calendar" <${process.env.EMAIL_FROM}>`, // Già corretto (assicurati che EMAIL_FROM sia impostata)
    to: userEmail,
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
    let info = await transporter.sendMail(mailOptions);
    console.log('Email di ringraziamento inviata: %s', info.messageId);
    // La riga seguente è utile principalmente con ethereal.email o simili, potrebbe non essere necessaria con SES
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); 
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
  
  socket.on('newEmail', async (data) => { 
    const { email, suggestion } = data;
    if (!email || !suggestion) {
      console.error('Dati email o suggerimento mancanti:', data);
      return; 
    }
    console.log('Nuova email ricevuta:', email, 'con suggerimento:', suggestion);
    
    const suggestions = readSuggestions();
    suggestions.push({ email, suggestion, timestamp: new Date().toISOString() });
    writeSuggestions(suggestions); // Ricorda: non persistente su EB

    emailCounter++;
    io.emit('updateCounter', emailCounter);

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
  // Rimosso il log di localhost qui perché su EB non è rilevante
  // console.log(`Apri http://localhost:${PORT} nel tuo browser.`);
  console.log("Variabili d'ambiente per l'email dovrebbero essere configurate sulla piattaforma di hosting (es. Elastic Beanstalk).");
});