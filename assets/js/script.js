document.addEventListener("DOMContentLoaded", () => {
  const socket = io('https://squeeze-833522296941.europe-west1.run.app'); 

  const dynamicSlogan = document.getElementById("dynamic-slogan");
  const counterElement = document.getElementById("counter");
  
  const formFlowContainer = document.getElementById("form-flow-container");
  const inputStep = document.getElementById("input-step");
  const feedbackStep = document.getElementById("feedback-step");
  const emailStep = document.getElementById("email-step");
  const thankyouStep = document.getElementById("thankyou-step");

  const userForm = document.getElementById("user-form");
  const userInputElement = document.getElementById("user-input"); // Già presente
  const feedbackMessageElement = document.getElementById("feedback-message");

  const emailForm = document.getElementById("email-form");
  const emailInputElement = document.getElementById("email-input");
  
  const dynamicThankYouMessageElement = document.getElementById("dynamic-thank-you-message");

  const slogans = [
    'The calendar that knows you. And lets you <span class="highlight">breathe</span>.',
    'An extra mind to organize <span class="highlight">yours</span>.',
    'Every hour in its <span class="highlight">right</span> place.',
    'Organized without <span class="highlight">anxiety</span>.',
  ];

  const feedbackMessages = [
    "Great idea! We're on it 💪", "Thanks for the input! We're working hard 🚀", "Awesome suggestion! Let's build it ✨",
    "Noted! We're making Squeeze better for you 👍", "Love it! We're cooking something special 🧑‍🍳"
  ];

  const thankYouMessages = [
    "Thank you! We'll notify you at launch 🚀", "You're all set! We'll be in touch soon ✨", "Thanks for joining! Get ready for Squeeze 👍",
    "Awesome! We'll send you an update when we launch 📧", "Got it! We'll let you know when Squeeze is live 🎉"
  ];

  let currentSloganIndex = 0;
  let initialAnimationDone = false; 
  let userSuggestion = ""; 

  // Placeholder originali e per mobile
  const originalPlaceholder = "How could a truly smart calendar help you?";
  const mobilePlaceholder = "What would help you?"; // O un'altra versione breve

  function setInputPlaceholder() {
    if (window.innerWidth <= 767) { // Puoi usare 480 se vuoi il cambio solo su schermi molto piccoli
      userInputElement.placeholder = mobilePlaceholder;
    } else {
      userInputElement.placeholder = originalPlaceholder;
    }
  }

  function getRandomMessage(messagesArray) {
    return messagesArray[Math.floor(Math.random() * messagesArray.length)];
  }

  function rotateSlogans() {
    dynamicSlogan.style.opacity = 0;
    setTimeout(() => {
      currentSloganIndex = (currentSloganIndex + 1) % slogans.length;
      dynamicSlogan.innerHTML = slogans[currentSloganIndex];
      dynamicSlogan.style.opacity = 1;
    }, 500);
  }
  setInterval(rotateSlogans, 5000);

  function animateCounterTo(targetCount) {
    let currentAnimatedValue = 0;
    counterElement.textContent = currentAnimatedValue; 
    const animationDuration = 1500; 
    let startTime = null;

    function animationStep(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const increment = Math.max(1, Math.floor((progress / animationDuration) * targetCount));
      const value = Math.min(targetCount, increment);

      if (currentAnimatedValue < value) {
        currentAnimatedValue = value;
        counterElement.textContent = currentAnimatedValue;
      } else if (currentAnimatedValue > targetCount) { 
        currentAnimatedValue = targetCount;
        counterElement.textContent = currentAnimatedValue;
      }

      if (currentAnimatedValue < targetCount) {
        requestAnimationFrame(animationStep);
      } else {
        counterElement.textContent = targetCount; 
        initialAnimationDone = true; 
      }
    }
    requestAnimationFrame(animationStep);
  }

  // Funzione per cambiare lo step attivo
  function setActiveStep(activeStepElement) {
    // Nasconde tutti gli step
    [inputStep, feedbackStep, emailStep, thankyouStep].forEach(step => {
      step.classList.remove("active-step");
    });
    // Mostra lo step desiderato
    if (activeStepElement) {
      activeStepElement.classList.add("active-step");
    }
  }

  userForm.addEventListener("submit", (e) => {
    e.preventDefault();
    userSuggestion = userInputElement.value; 
    if (userSuggestion.trim() !== "") {
      setActiveStep(null); // Nasconde lo step corrente (input-form)
      
      setTimeout(() => { // Permette alla transizione di uscita di completarsi
        feedbackMessageElement.textContent = getRandomMessage(feedbackMessages);
        setActiveStep(feedbackStep); // Mostra lo step del feedback
      }, 400); // Durata della transizione CSS (opacity)

      setTimeout(() => {
        setActiveStep(null); // Nasconde lo step del feedback
        setTimeout(() => { // Permette alla transizione di uscita di completarsi
            setActiveStep(emailStep); // Mostra lo step dell'email form
        }, 400);
      }, 2500 + 400); // Durata del feedback (2.5s) + durata transizione
    }
  });

  emailForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailInput = emailInputElement.value;
    if (emailInput.trim() !== "" && userSuggestion.trim() !== "") { 
      socket.emit('newEmail', { email: emailInput, suggestion: userSuggestion }); 
      
      setActiveStep(null); // Nasconde lo step corrente (email-form)

      setTimeout(() => { // Permette alla transizione di uscita di completarsi
        dynamicThankYouMessageElement.textContent = getRandomMessage(thankYouMessages);
        setActiveStep(thankyouStep); // Mostra lo step del thank you
        // emailInputElement.value = ""; // Opzionale
      }, 400); // Durata della transizione CSS
    } else if (emailInput.trim() === "") {
        alert("Please enter your email."); 
    } else { 
        alert("It seems the suggestion was not provided. Please go back and enter your suggestion.");
    }
  });

  socket.on('updateCounter', (newCount) => {
    if (!initialAnimationDone) {
      animateCounterTo(newCount);
    } else {
      counterElement.textContent = newCount;
      counterElement.style.transform = "scale(1.1)";
      setTimeout(() => {
        counterElement.style.transform = "scale(1)";
      }, 300);
    }
  });

  // Imposta lo step iniziale e il placeholder
  setInputPlaceholder(); // Chiama la funzione per impostare il placeholder iniziale
  window.addEventListener('resize', setInputPlaceholder); // Aggiorna il placeholder al resize

  setActiveStep(inputStep); 
  counterElement.textContent = 0; 
  socket.emit('getInitialCounter');
});
