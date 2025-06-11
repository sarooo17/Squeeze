// DOM Elements
const navbar = document.getElementById('navbar');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const waitlistForm = document.getElementById('waitlistForm');
const successMessage = document.getElementById('successMessage');
const waitlistCounter = document.getElementById('waitlistCounter');
const faqItems = document.querySelectorAll('.faq-item');

// Mobile Menu Toggle
mobileMenuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('show');
    mobileMenuToggle.classList.toggle('active');
});

// Close mobile menu when clicking on links
document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('show');
        mobileMenuToggle.classList.remove('active');
    });
});

// Navbar scroll effect
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 100) {
        navbar.style.transform = 'translateX(-50%) translateY(-10px)';
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    } else {
        navbar.style.transform = 'translateX(-50%) translateY(0)';
        navbar.style.background = 'rgba(255, 255, 255, 0.8)';
    }
    
    lastScrollY = currentScrollY;
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 100;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Hero CTA button
document.getElementById('heroCTA').addEventListener('click', () => {
    document.getElementById('waitlist').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
});

// Waitlist counter animation
function animateCounter() {
    const counter = waitlistCounter;
    const target = 5247;
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        counter.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            
            // Trigger counter animation when hero is visible
            if (entry.target.classList.contains('hero')) {
                setTimeout(animateCounter, 500);
            }
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .testimonial-card, .step, .faq-item').forEach(el => {
    observer.observe(el);
});

// Observe hero section for counter animation
observer.observe(document.querySelector('.hero'));

// FAQ functionality
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

// Waitlist form submission
waitlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(waitlistForm);
    const email = formData.get('email');
    const name = formData.get('name');
    const submitBtn = document.getElementById('submitBtn');
    
    // Validate email
    if (!isValidEmail(email)) {
        showNotification('Per favore inserisci un indirizzo email valido', 'error');
        return;
    }
    
    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Invio in corso...</span>';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Store in localStorage (in production, send to server)
        const waitlistData = {
            email,
            name,
            timestamp: new Date().toISOString(),
            source: 'website'
        };
        
        localStorage.setItem('squeeze_waitlist', JSON.stringify(waitlistData));
        
        // Show success message
        waitlistForm.style.display = 'none';
        successMessage.classList.add('show');
        
        // Update counter
        const currentCount = parseInt(waitlistCounter.textContent.replace(/,/g, ''));
        waitlistCounter.textContent = (currentCount + 1).toLocaleString();
        
        // Track conversion (in production, send to analytics)
        trackEvent('waitlist_signup', {
            email,
            name,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error submitting form:', error);
        showNotification('Si è verificato un errore. Riprova più tardi.', 'error');
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'error' ? '❌' : '✅'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? '#FEE2E2' : '#D1FAE5'};
        color: ${type === 'error' ? '#DC2626' : '#059669'};
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        border: 1px solid ${type === 'error' ? '#FECACA' : '#A7F3D0'};
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Feature card hover effects
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-12px)';
        this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
    });
});

// Testimonial card hover effects
document.querySelectorAll('.testimonial-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Phone mockup animation
function animatePhoneInterface() {
    const events = document.querySelectorAll('.event');
    events.forEach((event, index) => {
        event.style.opacity = '0';
        event.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            event.style.transition = 'all 0.6s ease';
            event.style.opacity = '1';
            event.style.transform = 'translateY(0)';
        }, (index + 1) * 300);
    });
}

// Start phone animation when hero is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            setTimeout(animatePhoneInterface, 1000);
            heroObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

heroObserver.observe(document.querySelector('.hero'));

// Analytics tracking (placeholder)
function trackEvent(eventName, properties = {}) {
    // In production, integrate with your analytics service
    console.log('Event tracked:', eventName, properties);
    
    // Example: Google Analytics 4
    // gtag('event', eventName, properties);
    
    // Example: Mixpanel
    // mixpanel.track(eventName, properties);
}

// Performance monitoring
function measurePerformance() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            
            trackEvent('page_performance', {
                load_time: loadTime,
                dom_content_loaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                first_paint: performance.getEntriesByType('paint')[0]?.startTime || 0
            });
        });
    }
}

// Initialize performance monitoring
measurePerformance();

// Keyboard navigation for accessibility
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close mobile menu
        mobileMenu.classList.remove('show');
        mobileMenuToggle.classList.remove('active');
        
        // Close any open FAQ items
        faqItems.forEach(item => {
            item.classList.remove('active');
        });
    }
});

// Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Dark mode detection and handling
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // User prefers dark mode
    document.body.classList.add('dark-mode-preferred');
}

// Listen for changes in color scheme preference
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (e.matches) {
        document.body.classList.add('dark-mode-preferred');
    } else {
        document.body.classList.remove('dark-mode-preferred');
    }
});

// Console welcome message
console.log('%c🗜️ Benvenuto in Squeeze Calendar!', 'color: #FF8C00; font-size: 20px; font-weight: bold;');
console.log('%cStiamo rivoluzionando la pianificazione con l\'AI', 'color: #FFC300; font-size: 14px;');
console.log('%cInteressato a unirti al team? Contattaci!', 'color: #333; font-size: 14px;');

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add loaded class to body for CSS animations
    document.body.classList.add('loaded');
    
    // Track page view
    trackEvent('page_view', {
        page: 'landing',
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`
    });
});

// Handle form input focus states
document.querySelectorAll('.form-group input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
        if (this.value) {
            this.parentElement.classList.add('filled');
        } else {
            this.parentElement.classList.remove('filled');
        }
    });
});

// Preload critical resources
function preloadResources() {
    const criticalResources = [
        '/placeholder.svg?height=48&width=48',
        // Add other critical resources here
    ];
    
    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = 'image';
        document.head.appendChild(link);
    });
}

// Initialize preloading
preloadResources();

// Error handling for uncaught errors
window.addEventListener('error', (e) => {
    console.error('Uncaught error:', e.error);
    trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack
    });
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    trackEvent('promise_rejection', {
        reason: e.reason?.toString(),
        stack: e.reason?.stack
    });
});