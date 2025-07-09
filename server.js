
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://www.squeeze-it.com",
    methods: ["GET", "POST"],
    credentials: true
  }
});


console.log(`Socket.IO server inizializzato. CORS origin: ${io.opts.cors.origin}`);

const PORT = process.env.PORT || 8080;
const BASE_COUNTER = 346;


const mongoUri = process.env.MONGODB_URI;
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

const inviteSchema = new mongoose.Schema({
  referrer: String,      // email di chi invita
  referred: String,      // email dell'amico invitato
  date: { type: Date, default: Date.now }
});
const Invite = mongoose.model('Invite', inviteSchema);


function extractNameFromEmail(email) {
  if (!email) return 'Insider';
  const name = email.split('@')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const emailTemplates = [
  (logoUrl, userEmail, suggestion, emailCounter) => {
    const userName = extractNameFromEmail(userEmail);
    const inviteLink = `https://www.squeeze-it.com/invite?ref=${encodeURIComponent(userEmail)}`;
    return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>
        body { font-family: 'Outfit', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.07); overflow: hidden; }
        .header { text-align: center; padding: 36px 24px 16px; }
        .header img { max-width: 64px; }
        .title { font-size: 2rem; font-weight: 700; color: #ff8c00; margin: 16px 0 6px; }
        .subtitle { font-size: 1.2rem; color: #333; }
        .section { padding: 0 32px 32px; }
        .suggestion-box { background: #fff3e6; border-left: 4px solid #ff8c00; border-radius: 8px; padding: 14px 18px; margin: 18px 0 24px; font-style: italic; color: #ff8c00; }
        .cta-button { display: inline-block; background: #ff8c00; color: #fff; padding: 12px 24px; border-radius: 30px; text-decoration: none; font-weight: 600; margin-top: 18px; }
        .invite-section { background: #eaf1f5; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center; }
        .invite-link { color: #ff8c00; word-break: break-all; }
        .footer { font-size: 12px; color: #777; text-align: center; padding: 20px; background: #f9fafb; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Squeeze Calendar" />
          <div class="title">Benvenuto a bordo, ${userName}! 🎉</div>
          <div class="subtitle">Sei l’Insider #${emailCounter || '0001'}</div>
        </div>
        <div class="section">
          <p>Ciao <b>${userName}</b>,</p>
          <p>Grazie per esserti iscritto alla lista d’attesa di <b>Squeeze Calendar</b>! 🎈</p>
          <p>Abbiamo ricevuto il tuo suggerimento su come un calendario davvero smart potrebbe aiutarti:</p>
          <div class="suggestion-box">
            “${suggestion}”
          </div>
          <p>Il tuo contributo è prezioso: stiamo costruendo Squeeze proprio insieme a chi, come te, vuole un calendario che <b>si adatti davvero alla vita reale</b>.</p>
          <p>
            <b>Cosa rende Squeeze unico?</b><br>
            🤖 Impara le tue abitudini e ti aiuta a respirare<br>
            📆 Interfaccia moderna, semplice e zero ansia<br>
            💬 Puoi parlare con il calendario come con un amico
          </p>
          <div class="invite-section">
            <b>Vuoi Squeeze ancora prima?</b><br>
            Invita 3 amici con il tuo link personale e avrai <b>3 mesi gratis</b> sul piano Pro al lancio!<br>
            <a class="invite-link" href="${inviteLink}">${inviteLink}</a>
          </div>
          <p style="margin-top:18px;">🚀 <i>Presto riceverai anteprime esclusive e l’accesso alla beta privata.</i></p>
          <p>Per qualsiasi domanda o idea, rispondi a questa mail o scrivici su <a href="mailto:info@squeeze-it.com">info@squeeze-it.com</a>.</p>
          <p>Grazie di cuore per essere parte di questa avventura!<br>
          <b>Il Team Squeeze</b></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Squeeze. Sei iscritto come <a href="mailto:${userEmail}">${userEmail}</a>.<br>
          <a href="https://www.squeeze-it.com">squeeze-it.com</a>
        </div>
      </div>
    </body>
    </html>
    `;
  }
];

async function sendThankYouEmail(userEmail, suggestion) {
  const logoUrl = process.env.LOGO_URL || 'https://www.squeeze-it.com/assets/images/logo.png';
  const templateFn = emailTemplates[0];
  const html = templateFn(logoUrl, userEmail, suggestion, emailCounter);

  const msg = {
    to: userEmail,
    from: process.env.EMAIL_FROM,
    subject: `You’re in! 🎉 Get ready to reshape your time with Squeeze`,
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

async function sendRewardEmail(referrerEmail) {
  const userName = extractNameFromEmail(referrerEmail);
  const msg = {
    to: referrerEmail,
    from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: 'Squeeze',
        },
    subject: `🎁 Complimenti ${userName}! Hai sbloccato 3 mesi gratis su Squeeze Pro`,
    html: `
      <div style="font-family:Outfit,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:16px;padding:32px;">
        <h2 style="color:#ff8c00;">Hai invitato 3 amici! 🎉</h2>
        <p>Ciao <b>${userName}</b>,</p>
        <p>Grazie per aver condiviso Squeeze! Hai sbloccato <b>3 mesi gratis</b> sul piano Pro che riceverai al lancio ufficiale.</p>
        <p>Continua a invitare amici per altri vantaggi e resta sintonizzato per le prossime novità!</p>
        <p style="margin-top:24px;">Con gratitudine,<br><b>Il Team Squeeze</b></p>
      </div>
    `
  };
  try {
    await sgMail.send(msg);
    console.log('Email premio inviata a:', referrerEmail);
  } catch (error) {
    console.error('Errore invio email premio:', error);
    if (error.response) console.error(error.response.body);
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

let emailCounter = BASE_COUNTER;



async function updateCounterAndBroadcast() {
  const count = await Suggestion.countDocuments();
  emailCounter = BASE_COUNTER + count;
  io.emit('updateCounter', emailCounter);
}


io.on('connection', (socket) => {
  socket.on('joinRoom', (room) => {
    socket.join(room);
    socket.room = room;
  });

  socket.on('candidate', (data) => {
    socket.to(socket.room).emit('candidate', { 
      candidate: data,
      id: socket.id 
    });
  });

  socket.on('offer', (data) => {
    socket.to(socket.room).emit('offer', {
      offer: data,
      id: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(socket.room).emit('answer', {
      answer: data,
      id: socket.id
    });
  });

  socket.on('disconnect', () => {
    socket.to(socket.room).emit('userDisconnected', { id: socket.id });
  });

  socket.on('error', (err) => {
    console.error(`Errore socket per client ${socket.id}:`, err);
  });

  socket.on('newEmail', async ({ email, suggestion, ref }) => {
    try {
      await Suggestion.create({ email, suggestion });
      if (ref && ref !== email) {
        const alreadyInvited = await Invite.findOne({ referrer: ref, referred: email });
        if (!alreadyInvited) {
          await Invite.create({ referrer: ref, referred: email });
        }
      }
      await updateCounterAndBroadcast();
      await sendThankYouEmail(email, suggestion);
      if (ref && ref !== email) {
        const inviteCount = await Invite.countDocuments({ referrer: ref });
        if (inviteCount === 3) {
          await sendRewardEmail(ref);
        }
      }
    } catch (err) {
      console.error('Errore durante salvataggio/invio email:', err);
    }
  });

  socket.on('getInitialCounter', async () => {
    await updateCounterAndBroadcast();
    socket.emit('updateCounter', emailCounter);
  });
});


io.engine.on("connection_error", (err) => {
  console.error("Socket.IO Engine Connection Error:");
  console.error("Codice errore:", err.code);
  console.error("Messaggio:", err.message);
  console.error("Contesto:", err.context);
});


const compression = require('compression');
app.use(compression());


server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});