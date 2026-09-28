// ============================================================
// OzeaH Admin Panel — Ysheazo only (939598583924150314)
// ============================================================

const ADMIN_ID = '939598583924150314';

const STATUS_CONFIG = {
    ordered:   { label: 'Commande',  emoji: '🟠' },
    in_stock:  { label: 'En stock',  emoji: '🔵' },
    sold:      { label: 'Vendu',     emoji: '🟣' },
    shipped:   { label: 'Expédié',   emoji: '🔵' },
    finalized: { label: 'Finalisé',  emoji: '🟢' },
    archived:  { label: 'Archivé',   emoji: '⚪' },
};

let allUsers = [];
let vipData = {};
let statsData = {};
let usersRegistry = {};

function getAdminDiscordId() {
    const user = JSON.parse(localStorage.getItem('ozeah_user') || 'null');
    if (!user) return null;
    if (user.type === 'discord') return user.id;
    if (user.type === 'email') {
        const accounts = JSON.parse(localStorage.getItem('ozeah_accounts') || '{}');
        if (accounts[user.email] && accounts[user.email].discord) {
            return accounts[user.email].discord.id;
        }
    }
    return null;
}

function formatPrice(val) {
    if (val === null || val === undefined || val === '') return '-';
    return parseFloat(val).toFixed(2).replace('.', ',') + ' €';
}

function formatDate(iso) {
    if (!iso) return 'Inconnue';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function initAdmin() {
    const page = document.getElementById('admin-page');
    const discordId = getAdminDiscordId();

    if (discordId !== ADMIN_ID) {
        page.innerHTML = `
            <div class="admin-denied">
                <div class="admin-denied-icon">🔒</div>
                <div class="admin-denied-title">Accès refusé</div>
                <div class="admin-denied-text">Cette page est réservée à l'administrateur.</div>
                <a href="index.html" style="color: var(--purple-light); text-decoration: none; font-weight: 600;">Retour à l'accueil</a>
            </div>`;
        return;
    }

    try {
        const [vipRes, statsRes] = await Promise.all([
            fetch('vip_data.json?t=' + Date.now()),
            fetch('user_stats.json?t=' + Date.now()),
        ]);
        vipData = vipRes.ok ? await vipRes.json() : { subscribers: {} };
        statsData = statsRes.ok ? await statsRes.json() : { users: {} };
    } catch (e) {
        vipData = { subscribers: {} };
        statsData = { users: {} };
    }

    usersRegistry = {};

    if (typeof dbGetAllUsers === 'function') {
        var fbUsers = await dbGetAllUsers();
        fbUsers.forEach(function(u) {
            usersRegistry[u.discordId] = {
                username: u.username,
                global_name: u.global_name,
                avatar: u.avatar,
                last_seen: u.last_seen,
                first_seen: u.first_seen,
            };
        });
    }

    buildUserList();
    renderAdminPage();
}

function buildUserList() {
    const userMap = {};

    for (const id in usersRegistry) {
        if (!userMap[id]) userMap[id] = { discordId: id };
        const reg = usersRegistry[id];
        userMap[id].username = reg.global_name || reg.username || null;
        userMap[id].avatar = reg.avatar || null;
        userMap[id].first_seen = reg.first_seen || null;
        userMap[id].last_seen = reg.last_seen || null;
    }

    const subs = vipData.subscribers || {};
    for (const id in subs) {
        if (!userMap[id]) userMap[id] = { discordId: id };
        userMap[id].vip = subs[id];
    }

    const users = statsData.users || {};
    for (const id in users) {
        if (!userMap[id]) userMap[id] = { discordId: id };
        userMap[id].stats = users[id];
    }

    for (const id in userMap) {
        if (!userMap[id].username) {
            const reg = usersRegistry[id];
            if (reg) {
                userMap[id].username = reg.global_name || reg.username || null;
                userMap[id].avatar = reg.avatar || null;
            }
        }
    }

    allUsers = Object.values(userMap);

    allUsers.sort((a, b) => {
        const aVip = a.vip ? 1 : 0;
        const bVip = b.vip ? 1 : 0;
        if (aVip !== bVip) return bVip - aVip;
        const aDate = a.last_seen || a.first_seen || '';
        const bDate = b.last_seen || b.first_seen || '';
        return bDate.localeCompare(aDate);
    });
}

var _adminStockCache = {};

async function getStockForUserAsync(discordId) {
    if (_adminStockCache[discordId]) return _adminStockCache[discordId];
    if (typeof dbLoadUserArticles === 'function') {
        var articles = await dbLoadUserArticles(discordId);
        _adminStockCache[discordId] = articles;
        return articles;
    }
    var raw = localStorage.getItem('stock_d_' + discordId);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
}

function getStockForUser(discordId) {
    if (_adminStockCache[discordId]) return _adminStockCache[discordId];
    var raw = localStorage.getItem('stock_d_' + discordId);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
}

function renderAdminPage() {
    const page = document.getElementById('admin-page');
    const totalUsers = allUsers.length;
    const vipCount = allUsers.filter(u => u.vip && (u.vip.status === 'active' || u.vip.status === 'trialing')).length;
    const stockCount = allUsers.filter(u => u.hasStock || getStockForUser(u.discordId).length > 0).length;

    page.innerHTML = `
        <div class="admin-header">
            <h1 class="admin-title">Panel Admin <span class="admin-badge">Admin</span></h1>
        </div>

        <div class="admin-stats-bar">
            <div class="admin-stat">
                <div class="admin-stat-value">${totalUsers}</div>
                <div class="admin-stat-label">Utilisateurs</div>
            </div>
            <div class="admin-stat">
                <div class="admin-stat-value">${vipCount}</div>
                <div class="admin-stat-label">VIP actifs</div>
            </div>
            <div class="admin-stat">
                <div class="admin-stat-value">${stockCount}</div>
                <div class="admin-stat-label">Avec stock</div>
            </div>
        </div>

        <div class="admin-search-wrap">
            <svg class="admin-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="admin-search" id="admin-search" placeholder="Rechercher par ID, pseudo...">
        </div>

        <div class="admin-users-list" id="admin-users-list"></div>

        <div class="admin-detail-overlay" id="admin-detail-overlay" onclick="if(event.target===this)closeDetail()">
            <div class="admin-detail-panel" id="admin-detail-panel"></div>
        </div>
    `;

    renderUserList(allUsers);

    document.getElementById('admin-search').addEventListener('input', function () {
        const q = this.value.toLowerCase().trim();
        if (!q) {
            renderUserList(allUsers);
            return;
        }
        const filtered = allUsers.filter(u => {
            if (u.discordId.includes(q)) return true;
            const name = u.username || u.discordId;
            if (name.toLowerCase().includes(q)) return true;
            return false;
        });
        renderUserList(filtered);
    });
}

function renderUserList(users) {
    const container = document.getElementById('admin-users-list');
    if (users.length === 0) {
        container.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">🔍</div>
                <div class="admin-empty-text">Aucun utilisateur trouvé</div>
            </div>`;
        return;
    }

    container.innerHTML = users.map(u => {
        const displayName = u.username || u.discordId;
        const isVip = u.vip && (u.vip.status === 'active' || u.vip.status === 'trialing');
        const isLifetime = u.vip && u.vip.lifetime;
        const stats = u.stats || {};
        const totalActions = (stats.legit_checks || 0) + (stats.descriptions || 0) + (stats.estimations || 0) + (stats.deals_viewed || 0);

        let tagsHtml = '';
        if (isVip) tagsHtml += `<span class="admin-tag admin-tag-vip">VIP</span>`;
        if (isLifetime) tagsHtml += `<span class="admin-tag admin-tag-lifetime">Lifetime</span>`;

        const avatarHtml = u.avatar
            ? `<img src="https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png?size=64" class="admin-user-avatar" alt="">`
            : `<div class="admin-user-avatar-letter">${displayName.charAt(0).toUpperCase()}</div>`;

        return `
        <div class="admin-user-card" onclick="openDetail('${u.discordId}')">
            ${avatarHtml}
            <div class="admin-user-info">
                <div class="admin-user-name">${escapeHtml(displayName)}</div>
                <div class="admin-user-id">${u.discordId}</div>
                ${tagsHtml ? `<div class="admin-user-tags">${tagsHtml}</div>` : ''}
            </div>
            <div class="admin-user-meta">
                <div class="admin-user-stat-mini">
                    <div class="admin-user-stat-mini-value">${totalActions}</div>
                    <div class="admin-user-stat-mini-label">Actions</div>
                </div>
                <div class="admin-user-stat-mini">
                    <div class="admin-user-stat-mini-value">${stats.first_seen ? formatDate(stats.first_seen).split(' ')[0] : '-'}</div>
                    <div class="admin-user-stat-mini-label">Inscrit</div>
                </div>
            </div>
            <div class="admin-user-arrow">→</div>
        </div>`;
    }).join('');
}

async function openDetail(discordId) {
    const u = allUsers.find(x => x.discordId === discordId);
    if (!u) return;

    const panel = document.getElementById('admin-detail-panel');
    const stats = u.stats || {};
    const vip = u.vip;
    const stock = await getStockForUserAsync(discordId);
    const isVip = vip && (vip.status === 'active' || vip.status === 'trialing');

    let vipHtml = '';
    if (isVip) {
        let detail;
        if (vip.lifetime) {
            detail = 'Valable à vie';
        } else {
            const end = new Date(vip.current_period_end * 1000);
            detail = 'Expire le ' + end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' à ' + end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
        vipHtml = `
        <div class="admin-vip-info">
            <div class="admin-vip-info-icon">👑</div>
            <div>
                <div class="admin-vip-info-text">VIP ${vip.lifetime ? '— Lifetime' : '— Abonnement'}</div>
                <div class="admin-vip-info-detail">${detail}</div>
            </div>
        </div>`;
    }

    const totalXp = (stats.legit_checks || 0) * 10 + (stats.descriptions || 0) * 5 + (stats.estimations || 0) * 5 + (stats.deals_viewed || 0) * 2;

    // Stock stats
    const inStock = stock.filter(a => a.status === 'in_stock').length;
    const sold = stock.filter(a => ['sold', 'shipped', 'finalized', 'archived'].includes(a.status) && a.sell_price).length;
    const revenue = stock.filter(a => a.sell_price).reduce((s, a) => s + (parseFloat(a.sell_price) || 0), 0);
    const benefit = stock.filter(a => a.sell_price).reduce((s, a) => s + ((parseFloat(a.sell_price) || 0) - (parseFloat(a.buy_price) || 0)), 0);
    const stockValue = stock.filter(a => a.status === 'in_stock').reduce((s, a) => s + (parseFloat(a.buy_price) || 0), 0);

    panel.innerHTML = `
        <button class="admin-detail-close" onclick="closeDetail()">&times;</button>

        <div class="admin-detail-header">
            ${u.avatar
                ? `<img src="https://cdn.discordapp.com/avatars/${discordId}/${u.avatar}.png?size=128" class="admin-detail-avatar" alt="">`
                : `<div class="admin-detail-avatar-letter">${(u.username || discordId).charAt(0).toUpperCase()}</div>`}
            <div>
                <div class="admin-detail-name">${escapeHtml(u.username || discordId)} ${isVip ? '<span class="admin-tag admin-tag-vip" style="font-size:0.7rem;padding:0.15rem 0.6rem;">VIP</span>' : ''}</div>
                <div class="admin-detail-id">${discordId}</div>
                <div class="admin-detail-first-seen">Membre depuis le ${formatDate(stats.first_seen)}</div>
            </div>
        </div>

        ${vipHtml}

        <div class="admin-tabs" id="admin-tabs">
            <button class="admin-tab active" data-tab="profil">Profil</button>
            <button class="admin-tab" data-tab="stock">Stock (${stock.length})</button>
        </div>

        <div class="admin-tab-content active" id="tab-profil">
            <div class="admin-profile-stats">
                <div class="admin-profile-stat">
                    <div class="admin-profile-stat-value">${stats.legit_checks || 0}</div>
                    <div class="admin-profile-stat-label">Legit Checks</div>
                </div>
                <div class="admin-profile-stat">
                    <div class="admin-profile-stat-value">${stats.descriptions || 0}</div>
                    <div class="admin-profile-stat-label">Descriptions</div>
                </div>
                <div class="admin-profile-stat">
                    <div class="admin-profile-stat-value">${stats.estimations || 0}</div>
                    <div class="admin-profile-stat-label">Estimations</div>
                </div>
                <div class="admin-profile-stat">
                    <div class="admin-profile-stat-value">${stats.deals_viewed || 0}</div>
                    <div class="admin-profile-stat-label">Deals</div>
                </div>
            </div>
            <div class="admin-profile-stats" style="grid-template-columns: repeat(2, 1fr);">
                <div class="admin-profile-stat">
                    <div class="admin-profile-stat-value">${totalXp}</div>
                    <div class="admin-profile-stat-label">XP Total</div>
                </div>
                <div class="admin-profile-stat">
                    <div class="admin-profile-stat-value">${stats.active_days_30 || 0}</div>
                    <div class="admin-profile-stat-label">Jours actifs (30j)</div>
                </div>
            </div>
        </div>

        <div class="admin-tab-content" id="tab-stock">
            ${stock.length > 0 ? `
                <div class="admin-stock-summary">
                    <div class="admin-stock-stat">
                        <div class="admin-stock-stat-emoji">👕</div>
                        <div class="admin-stock-stat-value">${stock.length}</div>
                        <div class="admin-stock-stat-label">Articles</div>
                    </div>
                    <div class="admin-stock-stat">
                        <div class="admin-stock-stat-emoji">📦</div>
                        <div class="admin-stock-stat-value">${inStock}</div>
                        <div class="admin-stock-stat-label">En stock</div>
                    </div>
                    <div class="admin-stock-stat">
                        <div class="admin-stock-stat-emoji">🛒</div>
                        <div class="admin-stock-stat-value">${sold}</div>
                        <div class="admin-stock-stat-label">Vendus</div>
                    </div>
                    <div class="admin-stock-stat">
                        <div class="admin-stock-stat-emoji">💰</div>
                        <div class="admin-stock-stat-value">${formatPrice(stockValue)}</div>
                        <div class="admin-stock-stat-label">Valeur stock</div>
                    </div>
                    <div class="admin-stock-stat">
                        <div class="admin-stock-stat-emoji">💵</div>
                        <div class="admin-stock-stat-value">${formatPrice(revenue)}</div>
                        <div class="admin-stock-stat-label">CA</div>
                    </div>
                    <div class="admin-stock-stat">
                        <div class="admin-stock-stat-emoji">📈</div>
                        <div class="admin-stock-stat-value ${benefit >= 0 ? 'positive' : 'negative'}">${formatPrice(benefit)}</div>
                        <div class="admin-stock-stat-label">Bénéfice</div>
                    </div>
                </div>
                <div class="admin-stock-list">
                    ${stock.map(a => renderStockItem(a)).join('')}
                </div>
            ` : `
                <div class="admin-empty">
                    <div class="admin-empty-icon">📦</div>
                    <div class="admin-empty-text">Aucun article en stock</div>
                    <div class="admin-empty-sub">Cet utilisateur n'a pas encore créé d'articles</div>
                </div>
            `}
        </div>
    `;

    // Tab switching
    panel.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            panel.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            panel.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });

    document.getElementById('admin-detail-overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function renderStockItem(a) {
    const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.ordered;
    const bp = parseFloat(a.buy_price) || 0;
    const sp = parseFloat(a.sell_price) || 0;
    const hasSale = a.sell_price !== null && a.sell_price !== undefined && a.sell_price !== '';
    const benefit = hasSale ? sp - bp : null;

    const photoHtml = a.photo
        ? `<img src="${a.photo}" alt="">`
        : `<span>📦</span>`;

    let metaParts = [];
    if (a.brand) metaParts.push(a.brand);
    if (a.size) metaParts.push(a.size);
    if (a.date_purchase) metaParts.push(a.date_purchase.split('-').reverse().join('/'));

    return `
    <div class="admin-stock-item">
        <div class="admin-stock-item-photo">${photoHtml}</div>
        <div class="admin-stock-item-info">
            <div class="admin-stock-item-name">${escapeHtml(a.name)} <span class="admin-status-badge admin-status-${a.status}">${sc.emoji} ${sc.label}</span></div>
            <div class="admin-stock-item-meta">${metaParts.join(' · ')}</div>
        </div>
        <div class="admin-stock-item-prices">
            <div class="admin-stock-price-col">
                <div class="admin-stock-price-label">Achat</div>
                <div class="admin-stock-price-value">${formatPrice(bp)}</div>
            </div>
            <div class="admin-stock-price-col">
                <div class="admin-stock-price-label">Vente</div>
                <div class="admin-stock-price-value">${hasSale ? formatPrice(sp) : '-'}</div>
            </div>
            <div class="admin-stock-price-col">
                <div class="admin-stock-price-label">Benef</div>
                <div class="admin-stock-price-value ${benefit !== null ? (benefit >= 0 ? 'positive' : 'negative') : ''}">${benefit !== null ? formatPrice(benefit) : '-'}</div>
            </div>
        </div>
    </div>`;
}

function closeDetail() {
    document.getElementById('admin-detail-overlay').classList.remove('show');
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', initAdmin);
