document.addEventListener("DOMContentLoaded", () => {
  const loaderOverlay = document.getElementById("loader-overlay");
  const loaderLogoContainer = document.querySelector("#loader-overlay .loader-logo-container");
  const finalLogoSvg = document.getElementById("final-logo-svg");

  const socket = io('https://squeeze-ap53mjpqwq-ew.a.run.app');
  const dynamicSlogan = document.getElementById("dynamic-slogan");
  const counterElement = document.getElementById("counter");
  const formFlowContainer = document.getElementById("form-flow-container");
  const inputStep = document.getElementById("input-step");
  const feedbackStep = document.getElementById("feedback-step");
  const emailStep = document.getElementById("email-step");
  const thankyouStep = document.getElementById("thankyou-step");
  const userForm = document.getElementById("user-form");
  const userInputElement = document.getElementById("user-input");
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
  const originalPlaceholder = "How could a truly smart calendar help you?";
  const mobilePlaceholder = "What would help you?";

  // --- INIZIO LOGICA LOADER ---
  if (loaderOverlay && loaderLogoContainer && finalLogoSvg) {
    setTimeout(() => {
      loaderOverlay.classList.add("paths-animated");
    }, 100);

    const loaderAnimationPathDuration = 800 + 300; // 1100ms
    const loaderMinDisplayTime = 1800; // Tempo che il loader resta visibile dopo l'animazione dei path

    const timeUntilFlight = Math.max(loaderAnimationPathDuration, loaderMinDisplayTime); // Es: 1800ms

    setTimeout(() => { // Timeout per iniziare il "volo"
      const loaderRect = loaderLogoContainer.getBoundingClientRect();
      const targetRect = finalLogoSvg.getBoundingClientRect();

      const dx = targetRect.left + (targetRect.width / 2) - (loaderRect.left + (loaderRect.width / 2));
      const dy = targetRect.top + (targetRect.height / 2) - (loaderRect.top + (loaderRect.height / 2));
      const scaleX = targetRect.width / loaderRect.width;
      const scaleY = targetRect.height / loaderRect.height;
      const scale = Math.min(scaleX, scaleY);

      loaderLogoContainer.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
      loaderLogoContainer.classList.add("flying"); // Durata transizione "flying" è 0.8s (800ms)

      // Timeout per far apparire il logo finale e nascondere l'overlay
      // Questo avviene alla fine dell'animazione di "volo"
      setTimeout(() => {
        finalLogoSvg.classList.add("visible");
        loaderOverlay.classList.add("hidden"); // Durata transizione "hidden" è 0.4s (400ms)

        // --- PUNTO CHIAVE: FINE ANIMAZIONE LOADER ---
        // Ora che l'overlay è nascosto e il logo finale è visibile,
        // possiamo far partire il resto delle inizializzazioni della pagina.
        
        // Imposta lo step iniziale del form e il placeholder
        setInputPlaceholder();
        window.addEventListener('resize', setInputPlaceholder);
        setActiveStep(inputStep);
        
        // Inizializza il testo del contatore a 0
        counterElement.textContent = 0;
        
        // Richiedi il valore iniziale del contatore al server
        // Questo triggererà l'animazione del contatore.
        socket.emit('getInitialCounter');

      }, 800); // Corrisponde alla durata dell'animazione "flying"

    }, timeUntilFlight);
  } else {
    // Fallback se il loader non esiste: inizializza subito la pagina
    setInputPlaceholder();
    window.addEventListener('resize', setInputPlaceholder);
    setActiveStep(inputStep);
    counterElement.textContent = 0;
    socket.emit('getInitialCounter');
  }
  // --- FINE LOGICA LOADER ---


  function setInputPlaceholder() {
    if (window.innerWidth <= 767) {
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

  function setActiveStep(activeStepElement) {
    [inputStep, feedbackStep, emailStep, thankyouStep].forEach(step => {
      step.classList.remove("active-step");
    });
    if (activeStepElement) {
      activeStepElement.classList.add("active-step");
    }
  }

  userForm.addEventListener("submit", (e) => {
    e.preventDefault();
    userSuggestion = userInputElement.value;
    if (userSuggestion.trim() !== "") {
      setActiveStep(null);
      setTimeout(() => {
        feedbackMessageElement.textContent = getRandomMessage(feedbackMessages);
        setActiveStep(feedbackStep);
      }, 400);
      setTimeout(() => {
        setActiveStep(null);
        setTimeout(() => {
            setActiveStep(emailStep);
        }, 400);
      }, 2500 + 400);
    }
  });

  function getRefFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref');
  }
  const referrerFromUrl = getRefFromUrl();

  emailForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailInput = emailInputElement.value;
    if (emailInput.trim() !== "" && userSuggestion.trim() !== "") {
      // --- MODIFICA QUI: INVIA ANCHE IL REF SE PRESENTE ---
      socket.emit('newEmail', { 
        email: emailInput, 
        suggestion: userSuggestion, 
        ref: referrerFromUrl // aggiungi il referrer se presente
      });
      setActiveStep(null);
      setTimeout(() => {
        dynamicThankYouMessageElement.textContent = getRandomMessage(thankYouMessages);
        setActiveStep(thankyouStep);
      }, 400);
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
});
