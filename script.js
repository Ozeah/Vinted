// Mobile menu toggle
function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        menu.classList.toggle('active');
    });

    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            btn.classList.remove('active');
            menu.classList.remove('active');
        });
    });
}

// FAQ - details elements auto-close others
function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    items.forEach(item => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                items.forEach(other => {
                    if (other !== item && other.open) other.open = false;
                });
            }
        });
    });
}

// Scroll animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '-40px' });

    const selectors = [
        '.pain-card',
        '.role-card',
        '.timeline-step',
        '.qualification-item',
        '.faq-item',
        '.pricing-card-free',
        '.pricing-card-vip',
        '.trust-item'
    ];

    document.querySelectorAll(selectors.join(', ')).forEach((el, i) => {
        el.classList.add('animate-on-scroll');
        el.style.transitionDelay = `${(i % 4) * 0.08}s`;
        observer.observe(el);
    });
}

// Header scroll effect
function initHeader() {
    const header = document.querySelector('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.style.background = window.scrollY > 50
            ? 'rgba(10, 10, 15, 0.95)'
            : 'rgba(10, 10, 15, 0.75)';
    }, { passive: true });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = document.querySelector('header')?.offsetHeight || 60;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

// Card mouse glow effect
function initCardGlow() {
    document.querySelectorAll('.role-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });
}

// Init all
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initFAQ();
    initScrollAnimations();
    initHeader();
    initSmoothScroll();
    initCardGlow();
});
