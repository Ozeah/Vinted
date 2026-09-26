// Render the account/profile page
function renderAccountPage() {
    const container = document.getElementById('account-content');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('ozeah_user') || 'null');
    if (!user || user.type !== 'discord') {
        window.location.href = 'index.html';
        return;
    }

    const discord = JSON.parse(localStorage.getItem('discord_user') || 'null');
    if (!discord) {
        window.location.href = 'index.html';
        return;
    }

    const username = discord.global_name || discord.username;
    const discordId = discord.id;
    const avatarUrl = discord.avatar
        ? `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png?size=128`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;

    container.innerHTML = `
        <div class="account-info">
            <img src="${avatarUrl}" class="profile-avatar-img">
            <div>
                <h2 class="account-name">${username}</h2>
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
            <div class="discord-linked">
                <img src="${avatarUrl}" alt="">
                <span>${username} — Connecte via Discord</span>
            </div>
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
            <a href="index.html#vip" class="btn-become-vip">Devenir VIP</a>
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
