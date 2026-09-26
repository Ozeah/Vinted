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

    document.querySelectorAll('.feature-card, .step, .pricing-card, .faq-item').forEach(el => {
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

// Nav user state
function initNavUser() {
    const area = document.getElementById('user-area');
    if (!area) return;

    const saved = localStorage.getItem('ozeah_user');
    if (!saved) return;
    const user = JSON.parse(saved);

    let avatarHtml, displayName;

    if (user.type === 'discord') {
        const discord = JSON.parse(localStorage.getItem('discord_user') || 'null');
        if (!discord) return;
        const avatarUrl = discord.avatar
            ? `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png?size=64`
            : `https://cdn.discordapp.com/embed/avatars/0.png`;
        avatarHtml = `<img src="${avatarUrl}" alt="" class="user-avatar">`;
        displayName = discord.global_name || discord.username;
    } else if (user.type === 'email') {
        const accounts = JSON.parse(localStorage.getItem('ozeah_accounts') || '{}');
        const acct = accounts[user.email];
        const discord = acct ? acct.discord : null;
        if (discord && discord.avatar) {
            const avatarUrl = `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png?size=64`;
            avatarHtml = `<img src="${avatarUrl}" alt="" class="user-avatar">`;
        } else if (discord) {
            avatarHtml = `<img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="" class="user-avatar">`;
        } else {
            avatarHtml = `<div class="user-avatar-letter">${user.username.charAt(0).toUpperCase()}</div>`;
        }
        displayName = user.username;
    } else {
        return;
    }

    area.innerHTML = `
        <div class="user-dropdown">
            <div class="user-logged">
                ${avatarHtml}
                <span class="user-name">${displayName}</span>
            </div>
            <div class="user-dropdown-menu">
                <a href="profile.html">Profil</a>
                <a href="#" onclick="logout(); return false;">Déconnexion</a>
            </div>
        </div>
    `;
}

// Discord login redirect (used on signup/login pages)
function loginDiscord() {
    const DISCORD_CLIENT_ID = '1107624523479650345';
    const REDIRECT_URI = 'https://ozeah.github.io/Vinted/';
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify`;
}

// Handle Discord OAuth callback on main page (login OR link)
function handleDiscordLogin() {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get('access_token');
    if (!accessToken) return;

    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1552985949515030619/8SWWQCCR5iV0s9FjMRMS_LfEs-t3hcWT3wDy6jEaNChpzIIOeztQWsx3HD_UVbw6ht6D';
    const isLinking = localStorage.getItem('ozeah_discord_link') === 'pending';

    fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    .then(r => r.json())
    .then(discordUser => {
        localStorage.setItem('discord_user', JSON.stringify(discordUser));
        window.history.replaceState(null, '', window.location.pathname);

        if (isLinking) {
            localStorage.removeItem('ozeah_discord_link');
            const ozeahUser = JSON.parse(localStorage.getItem('ozeah_user') || 'null');
            if (ozeahUser && ozeahUser.type === 'email') {
                const accounts = JSON.parse(localStorage.getItem('ozeah_accounts') || '{}');
                if (accounts[ozeahUser.email]) {
                    accounts[ozeahUser.email].discord = {
                        id: discordUser.id,
                        username: discordUser.username,
                        global_name: discordUser.global_name,
                        avatar: discordUser.avatar
                    };
                    localStorage.setItem('ozeah_accounts', JSON.stringify(accounts));
                }

                fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        embeds: [{
                            title: 'Discord lie a un compte OzeaH',
                            color: 0x5865F2,
                            fields: [
                                { name: 'Pseudo OzeaH', value: ozeahUser.username, inline: true },
                                { name: 'Email', value: ozeahUser.email, inline: true },
                                { name: 'Discord', value: `${discordUser.global_name || discordUser.username} (${discordUser.id})`, inline: false }
                            ],
                            footer: { text: 'OzeaH — Liaison Discord' }
                        }]
                    })
                });
            }
            window.location.href = 'account.html';
        } else {
            localStorage.setItem('ozeah_user', JSON.stringify({ type: 'discord', username: discordUser.global_name || discordUser.username, id: discordUser.id }));
            initNavUser();
        }
    });
}

// Logout
function logout() {
    localStorage.removeItem('ozeah_user');
    localStorage.removeItem('discord_user');
    window.location.reload();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    initFAQ();
    initScrollAnimations();
    initHeader();
    initSmoothScroll();
    initMascotTilt();
    handleDiscordLogin();
    initNavUser();
});
