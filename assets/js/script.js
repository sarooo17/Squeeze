// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const header = document.querySelector('.header');
const typingDemo = document.getElementById('typingDemo');
const timeSlots = document.getElementById('timeSlots');
const restartDemo = document.getElementById('restartDemo');
const waitlistForm = document.getElementById('waitlistForm');
const successMessage = document.getElementById('successMessage');
const faqItems = document.querySelectorAll('.faq-item');

// Mobile menu toggle
hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Header scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'none';
    }
});

// Demo typing animation
const demoTexts = [
    "Domani mattina vorrei andare a correre",
    "Devo comprare un regalo per mamma",
    "Vorrei iniziare a leggere un libro ogni sera",
    "Ho un appuntamento dal dentista giovedì"
];

const demoSlots = [
    [
        { text: "🏃‍♂️ Corsa al parco • 07:00-07:45", delay: 0 },
        { text: "🚿 Doccia • 08:00-08:15", delay: 200 },
        { text: "☕ Colazione • 08:30-09:00", delay: 400 }
    ],
    [
        { text: "🛍️ Shopping centro • 15:00-16:30", delay: 0 },
        { text: "🎁 Negozio regali • 16:45-17:30", delay: 200 },
        { text: "🚗 Ritorno a casa • 17:30-18:00", delay: 400 }
    ],
    [
        { text: "📚 Lettura • 21:00-21:30", delay: 0 },
        { text: "🛏️ Preparazione notte • 21:30-22:00", delay: 200 },
        { text: "😴 Sonno • 22:00", delay: 400 }
    ],
    [
        { text: "🦷 Dentista • 14:30-15:30", delay: 0 },
        { text: "🚗 Viaggio ritorno • 15:30-16:00", delay: 200 },
        { text: "☕ Pausa relax • 16:15-16:45", delay: 400 }
    ]
];

let currentDemoIndex = 0;
let typingTimeout;
let slotsTimeout = [];

function typeText(text, element, callback) {
    element.textContent = '';
    let i = 0;
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            typingTimeout = setTimeout(type, 50);
        } else if (callback) {
            setTimeout(callback, 500);
        }
    }
    
    type();
}

function showSlots(slots) {
    timeSlots.innerHTML = '';
    
    slots.forEach((slot, index) => {
        slotsTimeout.push(setTimeout(() => {
            const slotElement = document.createElement('div');
            slotElement.className = 'calendar-slot';
            slotElement.textContent = slot.text;
            slotElement.style.opacity = '0';
            slotElement.style.transform = 'translateY(20px)';
            timeSlots.appendChild(slotElement);
            
            // Animate in
            setTimeout(() => {
                slotElement.style.transition = 'all 0.5s ease';
                slotElement.style.opacity = '1';
                slotElement.style.transform = 'translateY(0)';
            }, 50);
        }, slot.delay));
    });
}

function runDemo() {
    const currentText = demoTexts[currentDemoIndex];
    const currentSlots = demoSlots[currentDemoIndex];
    
    typeText(currentText, typingDemo, () => {
        showSlots(currentSlots);
        
        // Next demo after 3 seconds
        setTimeout(() => {
            currentDemoIndex = (currentDemoIndex + 1) % demoTexts.length;
            runDemo();
        }, 3000);
    });
}

// Start demo when page loads
window.addEventListener('load', () => {
    setTimeout(runDemo, 1000);
});

// Restart demo button
restartDemo?.addEventListener('click', () => {
    // Clear existing timeouts
    clearTimeout(typingTimeout);
    slotsTimeout.forEach(timeout => clearTimeout(timeout));
    slotsTimeout = [];
    
    currentDemoIndex = 0;
    runDemo();
});

// Button interactions
document.getElementById('previewBtn')?.addEventListener('click', () => {
    alert('Anteprima in arrivo! Unisciti alla lista d\'attesa per essere tra i primi a provarla.');
});

document.getElementById('waitlistBtn')?.addEventListener('click', () => {
    document.querySelector('.final-cta').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('headerCTA')?.addEventListener('click', () => {
    document.querySelector('.final-cta').scrollIntoView({ behavior: 'smooth' });
});

// Waitlist form
waitlistForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('emailInput').value;
    const friendReferral = document.getElementById('friendReferral').checked;
    
    // Simulate form submission
    const submitButton = waitlistForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    submitButton.textContent = 'Invio in corso...';
    submitButton.disabled = true;
    
    setTimeout(() => {
        waitlistForm.style.display = 'none';
        successMessage.classList.add('show');
        
        // Store in localStorage (in a real app, send to server)
        localStorage.setItem('squeeze_waitlist', JSON.stringify({
            email,
            friendReferral,
            timestamp: new Date().toISOString()
        }));
        
        console.log('Waitlist signup:', { email, friendReferral });
    }, 2000);
});

// FAQ interactions
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other FAQ items
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });
        
        // Toggle current item
        item.classList.toggle('active', !isActive);
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .step-card, .problem-point, .solution-step').forEach(el => {
    observer.observe(el);
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Feature card hover effects
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Step card hover effects
document.querySelectorAll('.step-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    });
});

// Console welcome message
console.log('%c🗜️ Benvenuto in Squeeze Calendar!', 'color: #3B82F6; font-size: 18px; font-weight: bold;');
console.log('%cStiamo rivoluzionando il modo di gestire il tempo con l\'AI', 'color: #F59E0B; font-size: 14px;');
console.log('%cVuoi unirti al team? Scrivici!', 'color: #10B981; font-size: 14px;');

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Add some Easter eggs
let clickCount = 0;
document.querySelector('.logo')?.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 5) {
        alert('🎉 Hai scoperto un Easter egg! Sei davvero curioso... perfetto per Squeeze Calendar!');
        clickCount = 0;
    }
});

// Track user engagement (in a real app, send to analytics)
const engagementData = {
    pageViews: 1,
    timeOnPage: Date.now(),
    sectionsViewed: new Set(),
    buttonsClicked: []
};

// Track section views
const sections = document.querySelectorAll('section');
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.id || entry.target.className.split(' ')[0];
            engagementData.sectionsViewed.add(sectionId);
        }
    });
}, { threshold: 0.5 });

sections.forEach(section => sectionObserver.observe(section));

// Track button clicks
document.querySelectorAll('button, .btn-primary, .btn-secondary').forEach(button => {
    button.addEventListener('click', (e) => {
        engagementData.buttonsClicked.push({
            button: e.target.textContent.trim(),
            timestamp: Date.now()
        });
    });
});

// Send engagement data before page unload (in a real app)
window.addEventListener('beforeunload', () => {
    engagementData.timeOnPage = Date.now() - engagementData.timeOnPage;
    console.log('Engagement data:', engagementData);
    // In a real app: sendAnalytics(engagementData);
});