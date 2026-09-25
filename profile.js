// ============================================================
// OzeaH Profile — Data Layer + Rendering
// ============================================================
// Architecture: UI ← DATA ← API
// Toutes les fonctions get*() sont le point de branchement.
// Pour connecter le backend, remplacer leur contenu par des
// fetch() vers l'API du bot. L'UI ne change pas.
// ============================================================

// ── Configuration XP (modifiable) ──
const XP_CONFIG = {
    legit_checks:    10,
    descriptions:     5,
    estimations:      5,
    deals_viewed:     2,
};

// XP nécessaire par niveau: level n = XP_BASE * n^XP_EXPONENT
const XP_BASE = 100;
const XP_EXPONENT = 1.5;

function xpForLevel(level) {
    return Math.floor(XP_BASE * Math.pow(level, XP_EXPONENT));
}

function computeLevel(totalXp) {
    let level = 0;
    let xpNeeded = xpForLevel(1);
    let accumulated = 0;
    while (accumulated + xpNeeded <= totalXp) {
        accumulated += xpNeeded;
        level++;
        xpNeeded = xpForLevel(level + 1);
    }
    return {
        level,
        currentXp: totalXp - accumulated,
        nextLevelXp: xpNeeded,
        totalXp,
    };
}

function computeTotalXp(stats) {
    return (stats.legit_checks || 0) * XP_CONFIG.legit_checks
         + (stats.descriptions || 0) * XP_CONFIG.descriptions
         + (stats.estimations || 0) * XP_CONFIG.estimations
         + (stats.deals_viewed || 0) * XP_CONFIG.deals_viewed;
}

// ── Badges (centralisé, facile à modifier) ──
const BADGES = [
    { id: 'first_check',   icon: '\u{1F6E1}', name: 'Premier Check',       desc: 'Effectue ton premier Legit Check',          stat: 'legit_checks',    threshold: 1   },
    { id: 'authenticator',  icon: '\u{1F6E1}', name: 'Authentificateur',    desc: 'Effectue 10 Legit Checks',                  stat: 'legit_checks',    threshold: 10  },
    { id: 'expert_legit',   icon: '\u{1F6E1}', name: 'Expert Legit',        desc: 'Effectue 50 Legit Checks',                  stat: 'legit_checks',    threshold: 50  },
    { id: 'first_desc',     icon: '\u{1F4DD}', name: 'Premiere Description', desc: 'Genere ta premiere description',            stat: 'descriptions',    threshold: 1   },
    { id: 'copywriter',     icon: '\u{1F4DD}', name: 'Copywriter',          desc: 'Genere 25 descriptions',                    stat: 'descriptions',    threshold: 25  },
    { id: 'first_estimate', icon: '\u{1F4B0}', name: 'Premiere Estimation', desc: 'Effectue ta premiere estimation de prix',    stat: 'estimations',     threshold: 1   },
    { id: 'estimator',      icon: '\u{1F4B0}', name: 'Estimateur',          desc: 'Effectue 25 estimations',                   stat: 'estimations',     threshold: 25  },
    { id: 'deal_hunter',    icon: '\u{1F525}', name: 'Chasseur de Deals',   desc: 'Consulte 50 deals',                         stat: 'deals_viewed',    threshold: 50  },
    { id: 'active',         icon: '⚡',    name: 'Actif',               desc: 'Activite reguliere sur OzeaH',              stat: '_active_days',    threshold: 7   },
    { id: 'og',             icon: '\u{1F451}', name: 'OG OzeaH',            desc: 'Membre depuis plus de 90 jours',            stat: '_member_days',    threshold: 90  },
];

// ── Data Layer ──
// Source actuelle: user_stats.json poussé par le bot sur GitHub Pages.
// Quand le backend sera prêt, remplacer par: GET /api/user/:discordId/stats

function getDiscordIdentity() {
    const user = JSON.parse(localStorage.getItem('ozeah_user') || 'null');
    if (!user) return null;

    if (user.type === 'discord') {
        const discord = JSON.parse(localStorage.getItem('discord_user') || 'null');
        if (!discord) return null;
        return {
            discordId: discord.id,
            username: discord.global_name || discord.username,
            avatarUrl: discord.avatar
                ? `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png?size=256`
                : `https://cdn.discordapp.com/embed/avatars/0.png`,
            type: 'discord',
        };
    }

    if (user.type === 'email') {
        const accounts = JSON.parse(localStorage.getItem('ozeah_accounts') || '{}');
        const acct = accounts[user.email];
        const discord = acct ? acct.discord : null;
        return {
            discordId: discord ? discord.id : null,
            username: user.username,
            email: user.email,
            avatarUrl: discord && discord.avatar
                ? `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png?size=256`
                : null,
            type: 'email',
        };
    }
    return null;
}

let _statsCache = null;

async function fetchAllStats() {
    if (_statsCache) return _statsCache;
    try {
        const res = await fetch('user_stats.json?t=' + Date.now());
        if (!res.ok) throw new Error();
        _statsCache = await res.json();
        return _statsCache;
    } catch (e) {
        return { users: {} };
    }
}

async function getUserStats(discordId) {
    if (!discordId) return emptyStats();
    const all = await fetchAllStats();
    return all.users && all.users[discordId] ? all.users[discordId] : emptyStats();
}

function emptyStats() {
    return {
        first_seen: null,
        legit_checks: 0,
        descriptions: 0,
        estimations: 0,
        deals_viewed: 0,
        weekly: { legit_checks: 0, descriptions: 0, estimations: 0, deals_viewed: 0 },
        monthly: { legit_checks: 0, descriptions: 0, estimations: 0, deals_viewed: 0 },
        recent_activity: [],
        activity_heatmap: {},
        active_days_30: 0,
    };
}

function getUserBadges(stats, firstSeen) {
    const now = Date.now();
    const memberDays = firstSeen ? Math.floor((now - new Date(firstSeen).getTime()) / 86400000) : 0;
    const virtualStats = {
        ...stats,
        _active_days: stats.active_days_30 || 0,
        _member_days: memberDays,
    };

    return BADGES.map(b => {
        const current = virtualStats[b.stat] || 0;
        const unlocked = current >= b.threshold;
        return {
            ...b,
            current,
            unlocked,
            progress: Math.min(1, current / b.threshold),
        };
    });
}

async function getVipStatus(discordId) {
    if (!discordId) return null;
    try {
        const res = await fetch('vip_data.json?t=' + Date.now());
        if (!res.ok) return null;
        const data = await res.json();
        return data.subscribers && data.subscribers[discordId] ? data.subscribers[discordId] : null;
    } catch (e) {
        return null;
    }
}

// ── Rendering ──

const ACTIVITY_ICONS = {
    legit_check: '\u{1F6E1}',
    description: '\u{1F4DD}',
    estimation: '\u{1F4B0}',
    deal_viewed: '\u{1F525}',
};

const ACTIVITY_LABELS = {
    legit_check: 'Legit Check effectue',
    description: 'Description generee',
    estimation: 'Estimation effectuee',
    deal_viewed: 'Deal consulte',
};

function formatDate(iso) {
    if (!iso) return 'Inconnue';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysAgo(iso) {
    if (!iso) return 0;
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

async function renderProfile() {
    const page = document.getElementById('profile-page');
    const identity = getDiscordIdentity();

    if (!identity) {
        window.location.href = 'login.html';
        return;
    }

    const [stats, vip] = await Promise.all([
        getUserStats(identity.discordId),
        getVipStatus(identity.discordId),
    ]);

    const badges = getUserBadges(stats, stats.first_seen);
    const totalXp = computeTotalXp(stats);
    const levelInfo = computeLevel(totalXp);

    page.innerHTML = '';

    // Header
    page.innerHTML += renderHeader(identity, stats, vip);

    // XP
    page.innerHTML += renderXpSection(levelInfo);

    // Stats
    page.innerHTML += renderStatsSection(stats);

    // Two-col: Badges + Heatmap/Activity
    page.innerHTML += `<div class="p-two-col">
        <div>${renderBadgesSection(badges)}</div>
        <div>
            ${renderHeatmapSection(stats)}
            ${renderActivitySection(stats)}
        </div>
    </div>`;

    initPeriodTabs(stats);
}

function renderHeader(identity, stats, vip) {
    const avatarHtml = identity.avatarUrl
        ? `<img src="${identity.avatarUrl}" class="p-avatar" alt="">`
        : `<div class="p-avatar-letter">${identity.username.charAt(0).toUpperCase()}</div>`;

    const memberSince = stats.first_seen ? formatDate(stats.first_seen) : 'Aujourd\'hui';
    const days = stats.first_seen ? daysAgo(stats.first_seen) : 0;
    const daysText = days === 0 ? 'Premier jour' : days === 1 ? '1 jour avec OzeaH' : `${days} jours avec OzeaH`;

    const isVip = vip && (vip.status === 'active' || vip.status === 'trialing');
    const vipHtml = isVip ? `<span class="p-vip-tag">\u{1F451} VIP</span>` : '';

    return `
    <div class="p-header">
        ${avatarHtml}
        <div class="p-header-info">
            <h1 class="p-username">${identity.username} ${vipHtml}</h1>
            <div class="p-meta">
                <span class="p-meta-item">Membre depuis le ${memberSince}</span>
                <span class="p-meta-item">${daysText}</span>
            </div>
        </div>
    </div>`;
}

function renderXpSection(levelInfo) {
    const pct = levelInfo.nextLevelXp > 0
        ? Math.floor((levelInfo.currentXp / levelInfo.nextLevelXp) * 100)
        : 0;

    return `
    <div class="p-section">
        <div class="p-section-head">
            <div class="p-section-icon">⚡</div>
            <span class="p-section-title">Progression</span>
        </div>
        <div class="p-xp-card">
            <div class="p-level-circle">
                <span class="p-level-label">Niv.</span>
                <span class="p-level-num">${levelInfo.level}</span>
            </div>
            <div class="p-xp-info">
                <div class="p-xp-text"><span>${levelInfo.currentXp}</span> / ${levelInfo.nextLevelXp} XP</div>
                <div class="p-xp-bar"><div class="p-xp-fill" style="width:${pct}%"></div></div>
                <div class="p-xp-detail">${levelInfo.totalXp} XP au total</div>
            </div>
        </div>
    </div>`;
}

function renderStatCards(s) {
    return `
        <div class="p-stat-card"><div class="p-stat-emoji">\u{1F6E1}</div><div class="p-stat-value">${s.legit_checks || 0}</div><div class="p-stat-label">Legit Checks</div></div>
        <div class="p-stat-card"><div class="p-stat-emoji">\u{1F4DD}</div><div class="p-stat-value">${s.descriptions || 0}</div><div class="p-stat-label">Descriptions</div></div>
        <div class="p-stat-card"><div class="p-stat-emoji">\u{1F4B0}</div><div class="p-stat-value">${s.estimations || 0}</div><div class="p-stat-label">Estimations</div></div>
        <div class="p-stat-card"><div class="p-stat-emoji">\u{1F525}</div><div class="p-stat-value">${s.deals_viewed || 0}</div><div class="p-stat-label">Deals consultes</div></div>
    `;
}

function renderStatsSection(stats) {
    return `
    <div class="p-section">
        <div class="p-section-head">
            <div class="p-section-icon">\u{1F4CA}</div>
            <span class="p-section-title">Mon activite</span>
        </div>
        <div class="p-period-tabs">
            <button class="p-period-tab active" data-period="total">Total</button>
            <button class="p-period-tab" data-period="monthly">Ce mois</button>
            <button class="p-period-tab" data-period="weekly">Cette semaine</button>
        </div>
        <div class="p-stats-grid" id="stats-grid">
            ${renderStatCards(stats)}
        </div>
    </div>`;
}

function initPeriodTabs(stats) {
    document.querySelectorAll('.p-period-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.p-period-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const period = tab.dataset.period;
            const grid = document.getElementById('stats-grid');
            if (period === 'weekly') {
                grid.innerHTML = renderStatCards(stats.weekly || emptyStats());
            } else if (period === 'monthly') {
                grid.innerHTML = renderStatCards(stats.monthly || emptyStats());
            } else {
                grid.innerHTML = renderStatCards(stats);
            }
        });
    });
}

function renderBadgesSection(badges) {
    const unlocked = badges.filter(b => b.unlocked);
    const locked = badges.filter(b => !b.unlocked);
    const sorted = [...unlocked, ...locked];

    const html = sorted.map(b => {
        if (b.unlocked) {
            return `
            <div class="p-badge unlocked">
                <div class="p-badge-icon">${b.icon}</div>
                <div class="p-badge-info">
                    <div class="p-badge-name">${b.name}</div>
                    <div class="p-badge-desc">${b.desc}</div>
                </div>
            </div>`;
        }
        const remaining = b.threshold - b.current;
        const pct = Math.floor(b.progress * 100);
        return `
        <div class="p-badge locked" title="Encore ${remaining} pour debloquer">
            <div class="p-badge-icon">${b.icon}</div>
            <div class="p-badge-info">
                <div class="p-badge-name">${b.name}</div>
                <div class="p-badge-desc">${b.desc}</div>
                <div class="p-badge-progress">
                    <div class="p-badge-progress-bar"><div class="p-badge-progress-fill" style="width:${pct}%"></div></div>
                    <div class="p-badge-progress-text">${b.current} / ${b.threshold}</div>
                </div>
            </div>
            <span class="p-badge-lock">\u{1F512}</span>
        </div>`;
    }).join('');

    return `
    <div class="p-section">
        <div class="p-section-head">
            <div class="p-section-icon">\u{1F3C6}</div>
            <span class="p-section-title">Mes badges</span>
        </div>
        <div class="p-badges-grid">${html}</div>
    </div>`;
}

function renderHeatmapSection(stats) {
    const heatmap = stats.activity_heatmap || {};
    const totalActions = stats.active_days_30 || Object.keys(heatmap).length;

    const today = new Date();
    const weeks = 13;
    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    let colsHtml = '';
    for (let w = weeks - 1; w >= 0; w--) {
        let col = '';
        for (let d = 0; d < 7; d++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (w * 7 + (6 - d)));
            const key = date.toISOString().split('T')[0];
            const count = heatmap[key] || 0;
            let lvl = '';
            if (count >= 8) lvl = 'l4';
            else if (count >= 5) lvl = 'l3';
            else if (count >= 2) lvl = 'l2';
            else if (count >= 1) lvl = 'l1';
            col += `<div class="p-heatmap-cell ${lvl}" title="${key}: ${count} actions"></div>`;
        }
        colsHtml += `<div class="p-heatmap-col">${col}</div>`;
    }

    const daysHtml = days.map(d => `<div class="p-heatmap-day">${d}</div>`).join('');
    const actionCount = Object.values(heatmap).reduce((a, b) => a + b, 0);

    return `
    <div class="p-section">
        <div class="p-section-head">
            <div class="p-section-icon">\u{1F4C5}</div>
            <span class="p-section-title">Activite</span>
        </div>
        <div class="p-heatmap-card">
            <div class="p-heatmap-summary"><span>${actionCount}</span> actions ces 90 derniers jours</div>
            <div style="display:flex">
                <div class="p-heatmap-days">${daysHtml}</div>
                <div class="p-heatmap-grid">${colsHtml}</div>
            </div>
        </div>
    </div>`;
}

function renderActivitySection(stats) {
    const activity = stats.recent_activity || [];

    if (activity.length === 0) {
        return `
        <div class="p-section">
            <div class="p-section-head">
                <div class="p-section-icon">\u{1F559}</div>
                <span class="p-section-title">Activite recente</span>
            </div>
            <div class="p-feed-card">
                <div class="p-feed-empty">Aucune activite recente</div>
            </div>
        </div>`;
    }

    const grouped = {};
    activity.forEach(a => {
        const d = new Date(a.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let label;
        if (d.toDateString() === today.toDateString()) label = 'Aujourd\'hui';
        else if (d.toDateString() === yesterday.toDateString()) label = 'Hier';
        else label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(a);
    });

    let feedHtml = '';
    for (const [label, items] of Object.entries(grouped)) {
        feedHtml += `<div class="p-feed-group-title">${label}</div>`;
        items.forEach(item => {
            const icon = ACTIVITY_ICONS[item.type] || '⚡';
            const text = ACTIVITY_LABELS[item.type] || item.type;
            const time = new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            feedHtml += `
            <div class="p-feed-item">
                <span class="p-feed-dot"></span>
                <span class="p-feed-icon">${icon}</span>
                <span class="p-feed-text">${text}</span>
                <span class="p-feed-time">${time}</span>
            </div>`;
        });
    }

    return `
    <div class="p-section">
        <div class="p-section-head">
            <div class="p-section-icon">\u{1F559}</div>
            <span class="p-section-title">Activite recente</span>
        </div>
        <div class="p-feed-card">${feedHtml}</div>
    </div>`;
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    renderProfile();
});
