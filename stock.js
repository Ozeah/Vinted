// ============================================================
// OzeaH Stock Manager — Full CRUD + localStorage
// ============================================================

const STATUS_CONFIG = {
    ordered:   { label: 'Commande',  emoji: '🟠', class: 'status-ordered'   },
    in_stock:  { label: 'En stock',  emoji: '🔵', class: 'status-in_stock'  },
    sold:      { label: 'Vendu',     emoji: '🟣', class: 'status-sold'      },
    shipped:   { label: 'Expedie',   emoji: '🔵', class: 'status-shipped'   },
    finalized: { label: 'Finalise',  emoji: '🟢', class: 'status-finalized' },
    archived:  { label: 'Archive',   emoji: '⚪',       class: 'status-archived'  },
};

const STATUS_ORDER = ['ordered', 'in_stock', 'sold', 'shipped', 'finalized', 'archived'];

const POPULAR_BRANDS = [
    'Nike', 'Adidas', 'Lacoste', 'Ralph Lauren', 'Tommy Hilfiger', 'The North Face',
    'Carhartt', 'Stone Island', 'CP Company', 'Moncler', 'Canada Goose', 'Arc\'teryx',
    'Patagonia', 'Columbia', 'Napapijri', 'Timberland', 'New Balance', 'Puma', 'Reebok',
    'Asics', 'Vans', 'Converse', 'Jordan', 'Yeezy', 'Balenciaga', 'Gucci', 'Louis Vuitton',
    'Dior', 'Prada', 'Burberry', 'Versace', 'Fendi', 'Givenchy', 'Off-White', 'Palm Angels',
    'Essentials', 'Fear of God', 'Stussy', 'Supreme', 'Bape', 'Kenzo', 'Hugo Boss',
    'Calvin Klein', 'Armani', 'Diesel', 'Levi\'s', 'Wrangler', 'Lee', 'G-Star Raw',
    'Zara', 'H&M', 'Uniqlo', 'Pull & Bear', 'Bershka', 'Massimo Dutti',
    'Fred Perry', 'Ben Sherman', 'Barbour', 'Fjallraven', 'Salomon', 'Hoka',
    'Under Armour', 'Fila', 'Ellesse', 'Sergio Tacchini', 'Kappa', 'Umbro',
    'Champion', 'Russell Athletic', 'Dickies', 'Obey', 'Volcom', 'Quiksilver',
    'Billabong', 'Rip Curl', 'Element', 'DC Shoes', 'Supra',
    'Comme des Garcons', 'Acne Studios', 'AMI Paris', 'Maison Margiela', 'Rick Owens',
    'Yves Saint Laurent', 'Celine', 'Bottega Veneta', 'Loewe', 'Hermes',
    'Chanel', 'Valentino', 'Alexander McQueen', 'Balmain', 'Dsquared2',
    'Trapstar', 'Corteiz', 'Represent', 'Amiri', 'Gallery Dept',
    'Vlone', 'Chrome Hearts', 'Rhude', 'Casablanca', 'Jacquemus',
];

function getUserKey() {
    const user = JSON.parse(localStorage.getItem('ozeah_user') || 'null');
    if (!user) return null;
    if (user.type === 'discord') return 'stock_d_' + user.id;
    if (user.type === 'email') return 'stock_e_' + user.email;
    return null;
}

function loadArticles() {
    const key = getUserKey();
    if (!key) return [];
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveArticles(articles) {
    const key = getUserKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(articles));
}

function generateRef() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let ref = 'V';
    for (let i = 0; i < 6; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
    return ref;
}

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

function formatPrice(val) {
    if (val === null || val === undefined || val === '') return '-';
    return parseFloat(val).toFixed(2).replace('.', ',') + ' €';
}

function formatDate(d) {
    if (!d) return '-';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function formatDateLong(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Dashboard ──

let currentDashPeriod = 'all';
let isUrssafEnabled = localStorage.getItem('ozeah_urssaf') === 'true';

function getPeriodCutoff(period) {
    if (period === 'all') return null;
    const now = new Date();
    switch (period) {
        case '1m': now.setMonth(now.getMonth() - 1); break;
        case '3m': now.setMonth(now.getMonth() - 3); break;
        case '6m': now.setMonth(now.getMonth() - 6); break;
        case '1y': now.setFullYear(now.getFullYear() - 1); break;
    }
    return now.toISOString().split('T')[0];
}

function computeDashStats(articles, period) {
    const cutoff = getPeriodCutoff(period);

    const total = articles.length;
    const inStock = articles.filter(a => a.status === 'in_stock').length;

    const stockValue = articles
        .filter(a => a.status === 'in_stock')
        .reduce((sum, a) => sum + (parseFloat(a.buy_price) || 0), 0);

    const allSold = articles.filter(a =>
        ['sold', 'shipped', 'finalized', 'archived'].includes(a.status) && a.sell_price
    );

    const soldInPeriod = cutoff
        ? allSold.filter(a => (a.date_sale || '') >= cutoff)
        : allSold;

    const soldCount = soldInPeriod.length;
    const revenue = soldInPeriod.reduce((sum, a) => sum + (parseFloat(a.sell_price) || 0), 0);

    const totalBenefit = soldInPeriod.reduce((sum, a) => {
        return sum + ((parseFloat(a.sell_price) || 0) - (parseFloat(a.buy_price) || 0));
    }, 0);

    const avgMargin = soldCount > 0
        ? soldInPeriod.reduce((sum, a) => {
            const bp = parseFloat(a.buy_price) || 0;
            if (bp === 0) return sum;
            return sum + (((parseFloat(a.sell_price) || 0) - bp) / bp * 100);
        }, 0) / soldCount
        : 0;

    const urssaf = revenue * 0.134;

    return { total, inStock, stockValue, soldCount, revenue, totalBenefit, avgMargin, urssaf };
}

function toggleUrssaf() {
    isUrssafEnabled = document.getElementById('urssaf-checkbox').checked;
    localStorage.setItem('ozeah_urssaf', isUrssafEnabled);
    renderArticles();
}

function renderDashboard(articles) {
    const container = document.getElementById('dashboard-grid');
    const s = computeDashStats(articles, currentDashPeriod);

    const netBenefit = isUrssafEnabled ? s.totalBenefit - s.urssaf : s.totalBenefit;
    const displayMargin = isUrssafEnabled && s.revenue > 0
        ? ((s.totalBenefit - s.urssaf) / (s.revenue - s.totalBenefit) * 100)
        : s.avgMargin;

    let html = `
        <div class="dash-card"><div class="dash-emoji">👕</div><div class="dash-value">${s.total}</div><div class="dash-label">Articles</div></div>
        <div class="dash-card"><div class="dash-emoji">📦</div><div class="dash-value">${s.inStock}</div><div class="dash-label">En stock</div></div>
        <div class="dash-card"><div class="dash-emoji">💰</div><div class="dash-value">${formatPrice(s.stockValue)}</div><div class="dash-label">Valeur stock</div></div>
        <div class="dash-card"><div class="dash-emoji">🛒</div><div class="dash-value">${s.soldCount}</div><div class="dash-label">Ventes</div></div>
        <div class="dash-card"><div class="dash-emoji">💵</div><div class="dash-value">${formatPrice(s.revenue)}</div><div class="dash-label">CA</div></div>
        <div class="dash-card"><div class="dash-emoji">📈</div><div class="dash-value">${formatPrice(netBenefit)}</div><div class="dash-label">Benefice${isUrssafEnabled ? ' net' : ''}</div></div>
        <div class="dash-card"><div class="dash-emoji">📊</div><div class="dash-value">${displayMargin > 0 ? displayMargin.toFixed(1) + ' %' : '-'}</div><div class="dash-label">Marge moy.</div></div>
    `;

    if (isUrssafEnabled) {
        html += `<div class="dash-card dash-card-urssaf"><div class="dash-emoji">🏛️</div><div class="dash-value">${formatPrice(s.urssaf)}</div><div class="dash-label">URSSAF (13,4%)</div></div>`;
    }

    container.innerHTML = html;
}

function movePeriodSlider() {
    const active = document.querySelector('.dash-period-btn.active');
    const slider = document.getElementById('dash-period-slider');
    const tabs = document.getElementById('dash-period-tabs');
    if (!active || !slider || !tabs) return;
    const tabsRect = tabs.getBoundingClientRect();
    const btnRect = active.getBoundingClientRect();
    slider.style.width = btnRect.width + 'px';
    slider.style.transform = 'translateX(' + (btnRect.left - tabsRect.left - 3) + 'px)';
}

function initDashPeriodTabs() {
    document.querySelectorAll('.dash-period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.dash-period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDashPeriod = btn.dataset.period;
            movePeriodSlider();
            renderArticles();
        });
    });
    requestAnimationFrame(movePeriodSlider);
}

// ── Article list ──

let currentSort = 'date_purchase';
let currentSortDir = 'desc';

function getFilteredArticles() {
    let articles = loadArticles();
    const search = (document.getElementById('stock-search').value || '').toLowerCase().trim();
    const statusFilter = document.querySelector('.status-filter-btn.active')?.dataset.status || 'all';

    if (search) {
        articles = articles.filter(a =>
            (a.name || '').toLowerCase().includes(search) ||
            (a.brand || '').toLowerCase().includes(search) ||
            (a.reference || '').toLowerCase().includes(search) ||
            (a.size || '').toLowerCase().includes(search)
        );
    }

    if (statusFilter !== 'all') {
        articles = articles.filter(a => a.status === statusFilter);
    }

    const dir = currentSortDir === 'desc' ? -1 : 1;
    articles.sort((a, b) => {
        let va, vb;
        switch (currentSort) {
            case 'date_purchase':
                return dir * (a.date_purchase || '').localeCompare(b.date_purchase || '');
            case 'buy_price':
                va = parseFloat(a.buy_price) || 0;
                vb = parseFloat(b.buy_price) || 0;
                return dir * (va - vb);
            case 'sell_price':
                va = parseFloat(a.sell_price) || 0;
                vb = parseFloat(b.sell_price) || 0;
                return dir * (va - vb);
            case 'benefit':
                va = (parseFloat(a.sell_price) || 0) - (parseFloat(a.buy_price) || 0);
                vb = (parseFloat(b.sell_price) || 0) - (parseFloat(b.buy_price) || 0);
                return dir * (va - vb);
            case 'margin':
                va = (parseFloat(a.buy_price) || 0) > 0 ? ((parseFloat(a.sell_price) || 0) - (parseFloat(a.buy_price) || 0)) / (parseFloat(a.buy_price) || 1) : 0;
                vb = (parseFloat(b.buy_price) || 0) > 0 ? ((parseFloat(b.sell_price) || 0) - (parseFloat(b.buy_price) || 0)) / (parseFloat(b.buy_price) || 1) : 0;
                return dir * (va - vb);
            default: return 0;
        }
    });

    return articles;
}

function renderArticles() {
    const articles = loadArticles();
    renderDashboard(articles);

    const filtered = getFilteredArticles();
    const container = document.getElementById('stock-list');

    if (filtered.length === 0) {
        const hasAny = articles.length > 0;
        container.innerHTML = `
            <div class="stock-empty">
                <div class="stock-empty-icon">📦</div>
                <div class="stock-empty-text">${hasAny ? 'Aucun resultat' : 'Aucun article'}</div>
                <div class="stock-empty-sub">${hasAny ? 'Essaie de modifier tes filtres.' : 'Clique sur "+ Nouvel article" pour commencer.'}</div>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(a => renderArticleCard(a)).join('');
}

function renderArticleCard(a) {
    const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.ordered;
    const bp = parseFloat(a.buy_price) || 0;
    const sp = parseFloat(a.sell_price) || 0;
    const ep = parseFloat(a.expected_price) || 0;

    const hasSale = a.sell_price !== null && a.sell_price !== undefined && a.sell_price !== '';
    const rawBenefit = hasSale ? sp - bp : null;
    const urssaf = hasSale ? sp * 0.134 : null;
    const benefit = (hasSale && isUrssafEnabled) ? rawBenefit - urssaf : rawBenefit;
    const margin = hasSale && bp > 0 ? (benefit / bp * 100) : null;

    const photoHtml = a.photo
        ? `<img src="${a.photo}" alt="">`
        : `<span class="article-photo-empty">📦</span>`;

    let metaParts = [];
    if (a.brand) metaParts.push(a.brand);
    if (a.size) metaParts.push(a.size);
    if (a.condition) metaParts.push(a.condition);

    let actionHtml = '';
    switch (a.status) {
        case 'ordered':
            actionHtml = `<button class="btn-action btn-action-primary" onclick="actionInStock('${a.id}')">Mettre en stock</button>`;
            break;
        case 'in_stock':
            actionHtml = `<button class="btn-action btn-action-primary" onclick="openSellModal('${a.id}')">Enregistrer la vente</button>`;
            break;
        case 'sold':
            actionHtml = `<button class="btn-action btn-action-primary" onclick="actionShipped('${a.id}')">Marquer comme expedie</button>`;
            break;
        case 'shipped':
            actionHtml = `<button class="btn-action btn-action-primary" onclick="actionFinalized('${a.id}')">Finaliser</button>`;
            break;
        case 'finalized':
            actionHtml = `<button class="btn-action btn-action-secondary" onclick="actionArchived('${a.id}')">Archiver</button>`;
            break;
        case 'archived':
            actionHtml = `<button class="btn-action btn-action-secondary" onclick="actionUnarchive('${a.id}')">Desarchiver</button>`;
            break;
    }

    return `
    <div class="article-card">
        <div class="article-photo">${photoHtml}</div>
        <div class="article-info">
            <div class="article-top-row">
                <span class="article-name" title="${escapeHtml(a.name)}">${escapeHtml(a.name)}</span>
                <span class="article-ref">${escapeHtml(a.reference)}</span>
                <span class="status-badge ${sc.class}">${sc.emoji} ${sc.label}</span>
            </div>
            <div class="article-meta">
                ${metaParts.map(m => `<span>${escapeHtml(m)}</span>`).join('<span>·</span>')}
                ${a.date_purchase ? `<span>📅 ${formatDate(a.date_purchase)}</span>` : ''}
            </div>
            <div class="article-prices">
                <div class="price-item">
                    <span class="price-label">Achat</span>
                    <span class="price-value">${formatPrice(bp)}</span>
                </div>
                <div class="price-item">
                    <span class="price-label">Prevu</span>
                    <span class="price-value ${ep ? '' : 'neutral'}">${ep ? formatPrice(ep) : '-'}</span>
                </div>
                <div class="price-item">
                    <span class="price-label">Vente</span>
                    <span class="price-value ${hasSale ? '' : 'neutral'}">${hasSale ? formatPrice(sp) : '-'}</span>
                </div>
                <div class="price-item">
                    <span class="price-label">Benefice</span>
                    <span class="price-value ${benefit !== null ? (benefit >= 0 ? 'positive' : 'negative') : 'neutral'}">${benefit !== null ? formatPrice(benefit) : '-'}</span>
                </div>
                <div class="price-item">
                    <span class="price-label">Marge</span>
                    <span class="price-value ${margin !== null ? (margin >= 0 ? 'positive' : 'negative') : 'neutral'}">${margin !== null ? margin.toFixed(1) + ' %' : '-'}</span>
                </div>
                ${isUrssafEnabled ? `<div class="price-item">
                    <span class="price-label">URSSAF</span>
                    <span class="price-value ${urssaf !== null ? 'negative' : 'neutral'}">${urssaf !== null ? formatPrice(urssaf) : '-'}</span>
                </div>` : ''}
            </div>
        </div>
        <div class="article-actions">
            ${actionHtml}
            <div class="article-secondary-actions">
                <button class="btn-icon" title="Historique" onclick="openHistory('${a.id}')">📋</button>
                <button class="btn-icon" title="Modifier" onclick="openEditModal('${a.id}')">✏️</button>
                <button class="btn-icon danger" title="Supprimer" onclick="openDeleteModal('${a.id}')">🗑️</button>
            </div>
        </div>
    </div>`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Add / Edit ──

function openAddModal() {
    document.getElementById('modal-add-title').textContent = 'Nouvel article';
    document.getElementById('btn-article-submit').textContent = 'Ajouter';
    document.getElementById('edit-id').value = '';
    document.getElementById('form-article').reset();
    document.getElementById('f-date').value = '';
    document.getElementById('f-sell-price-group').style.display = 'none';
    document.getElementById('f-sell-price').value = '';
    document.getElementById('photo-placeholder').style.display = '';
    document.getElementById('photo-preview-wrap').style.display = 'none';
    closeBrandSuggestions();
    openModal('modal-add');
}

function openEditModal(id) {
    const articles = loadArticles();
    const a = articles.find(x => x.id === id);
    if (!a) return;

    document.getElementById('modal-add-title').textContent = 'Modifier l\'article';
    document.getElementById('btn-article-submit').textContent = 'Enregistrer';
    document.getElementById('edit-id').value = id;

    document.getElementById('f-name').value = a.name || '';
    document.getElementById('f-reference').value = a.reference || '';
    document.getElementById('f-brand').value = a.brand || '';
    document.getElementById('f-size').value = a.size || '';
    document.getElementById('f-condition').value = a.condition || '';
    document.getElementById('f-buy-price').value = a.buy_price || '';
    document.getElementById('f-payment').value = a.payment || '';
    document.getElementById('f-expected-price').value = a.expected_price || '';
    document.getElementById('f-date').value = a.date_purchase || '';
    document.getElementById('f-url').value = a.url || '';
    document.getElementById('f-notes').value = a.notes || '';

    const sellGroup = document.getElementById('f-sell-price-group');
    const sellInput = document.getElementById('f-sell-price');
    if (a.sell_price !== '' && a.sell_price !== null && a.sell_price !== undefined) {
        sellGroup.style.display = '';
        sellInput.value = a.sell_price;
    } else {
        sellGroup.style.display = 'none';
        sellInput.value = '';
    }

    if (a.photo) {
        document.getElementById('photo-placeholder').style.display = 'none';
        document.getElementById('photo-preview-wrap').style.display = '';
        document.getElementById('photo-preview-img').src = a.photo;
    } else {
        document.getElementById('photo-placeholder').style.display = '';
        document.getElementById('photo-preview-wrap').style.display = 'none';
    }

    openModal('modal-add');
}

function handleArticleSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-id').value;
    const articles = loadArticles();

    const name = document.getElementById('f-name').value.trim();
    let reference = document.getElementById('f-reference').value.trim();
    const brand = document.getElementById('f-brand').value.trim();
    const size = document.getElementById('f-size').value.trim();
    const condition = document.getElementById('f-condition').value;
    const buy_price = document.getElementById('f-buy-price').value;
    const payment = document.getElementById('f-payment').value;
    const expected_price = document.getElementById('f-expected-price').value;
    const date_purchase = document.getElementById('f-date').value;
    const url = document.getElementById('f-url').value.trim();
    const notes = document.getElementById('f-notes').value.trim();

    const photoPreview = document.getElementById('photo-preview-img');
    const photo = photoPreview.src && document.getElementById('photo-preview-wrap').style.display !== 'none'
        ? photoPreview.src
        : '';

    if (editId) {
        const idx = articles.findIndex(a => a.id === editId);
        if (idx === -1) return;
        articles[idx].name = name;
        if (reference) articles[idx].reference = reference;
        articles[idx].brand = brand;
        articles[idx].size = size;
        articles[idx].condition = condition;
        articles[idx].buy_price = buy_price;
        articles[idx].payment = payment;
        articles[idx].expected_price = expected_price;
        articles[idx].date_purchase = date_purchase;
        articles[idx].url = url;
        articles[idx].notes = notes;
        articles[idx].photo = photo;
        const editSellPrice = document.getElementById('f-sell-price').value;
        if (document.getElementById('f-sell-price-group').style.display !== 'none' && editSellPrice !== '') {
            articles[idx].sell_price = editSellPrice;
        }
        addHistory(articles[idx], 'Article modifie');
    } else {
        if (!reference) reference = generateRef();
        const article = {
            id: 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name,
            reference,
            brand,
            size,
            condition,
            buy_price,
            payment,
            expected_price,
            date_purchase,
            url,
            notes,
            photo,
            sell_price: '',
            sell_platform: '',
            date_sale: '',
            date_stock: todayStr(),
            date_shipped: '',
            date_finalized: '',
            status: 'in_stock',
            history: [],
            created_at: new Date().toISOString(),
        };
        addHistory(article, 'Article achete', buy_price ? formatPrice(buy_price) : null, date_purchase);
        addHistory(article, 'Mis en stock', null, date_purchase || todayStr());
        articles.push(article);
    }

    saveArticles(articles);
    closeModal('modal-add');
    renderArticles();
}

// ── Photo ──

function handlePhotoPreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (ev) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const MAX = 400;
            let w = img.width, h = img.height;
            if (w > MAX || h > MAX) {
                if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                else { w = Math.round(w * MAX / h); h = MAX; }
            }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

            document.getElementById('photo-placeholder').style.display = 'none';
            document.getElementById('photo-preview-wrap').style.display = '';
            document.getElementById('photo-preview-img').src = dataUrl;
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}

function removePhoto() {
    document.getElementById('photo-placeholder').style.display = '';
    document.getElementById('photo-preview-wrap').style.display = 'none';
    document.getElementById('photo-preview-img').src = '';
    document.getElementById('f-photo').value = '';
}

// ── Status actions ──

function actionInStock(id) {
    const articles = loadArticles();
    const a = articles.find(x => x.id === id);
    if (!a) return;
    a.status = 'in_stock';
    a.date_stock = todayStr();
    addHistory(a, 'Mis en stock', null, todayStr());
    saveArticles(articles);
    renderArticles();
}

function actionShipped(id) {
    const articles = loadArticles();
    const a = articles.find(x => x.id === id);
    if (!a) return;
    a.status = 'shipped';
    a.date_shipped = todayStr();
    addHistory(a, 'Expedie', null, todayStr());
    saveArticles(articles);
    renderArticles();
}

function actionFinalized(id) {
    const articles = loadArticles();
    const a = articles.find(x => x.id === id);
    if (!a) return;
    a.status = 'finalized';
    a.date_finalized = todayStr();
    addHistory(a, 'Vente finalisee', null, todayStr());
    saveArticles(articles);
    renderArticles();
}

function actionArchived(id) {
    const articles = loadArticles();
    const a = articles.find(x => x.id === id);
    if (!a) return;
    a.status = 'archived';
    addHistory(a, 'Archive', null, todayStr());
    saveArticles(articles);
    renderArticles();
}

function actionUnarchive(id) {
    const articles = loadArticles();
    const a = articles.find(x => x.id === id);
    if (!a) return;
    a.status = 'finalized';
    addHistory(a, 'Desarchive', null, todayStr());
    saveArticles(articles);
    renderArticles();
}

// ── Sell modal ──

function openSellModal(id) {
    const articles = loadArticles();
    const a = articles.find(x => x.id === id);
    if (!a) return;
    document.getElementById('sell-id').value = id;
    document.getElementById('sell-article-name').textContent = a.name + (a.reference ? ' (' + a.reference + ')' : '');
    document.getElementById('s-sell-price').value = '';
    document.getElementById('s-platform').value = 'Vinted';
    document.getElementById('s-date').value = todayStr();
    openModal('modal-sell');
}

function handleSellSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('sell-id').value;
    const articles = loadArticles();
    const a = articles.find(x => x.id === id);
    if (!a) return;

    a.sell_price = document.getElementById('s-sell-price').value;
    a.sell_platform = document.getElementById('s-platform').value;
    a.date_sale = document.getElementById('s-date').value || todayStr();
    a.status = 'sold';
    addHistory(a, 'Vente enregistree', formatPrice(a.sell_price), a.date_sale);
    saveArticles(articles);
    closeModal('modal-sell');
    renderArticles();
}

// ── Delete ──

function openDeleteModal(id) {
    document.getElementById('delete-id').value = id;
    openModal('modal-delete');
}

function confirmDelete() {
    const id = document.getElementById('delete-id').value;
    let articles = loadArticles();
    articles = articles.filter(a => a.id !== id);
    saveArticles(articles);
    closeModal('modal-delete');
    renderArticles();
}

// ── History ──

function addHistory(article, label, price, dateOverride) {
    if (!article.history) article.history = [];
    let date;
    if (dateOverride) {
        date = dateOverride.includes('T') ? dateOverride : dateOverride + 'T12:00:00.000Z';
    } else {
        date = new Date().toISOString();
    }
    article.history.push({ date, label, price: price || null });
}

function openHistory(id) {
    const articles = loadArticles();
    const a = articles.find(x => x.id === id);
    if (!a) return;

    document.getElementById('history-article-name').textContent = a.name + (a.reference ? ' (' + a.reference + ')' : '');

    const timeline = document.getElementById('history-timeline');
    const history = a.history || [];

    if (history.length === 0) {
        timeline.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:1rem;font-size:0.85rem;">Aucun historique</div>';
    } else {
        timeline.innerHTML = history.map(h => `
            <div class="history-item">
                <div class="history-dot"></div>
                <div class="history-text">
                    <div class="history-label">${escapeHtml(h.label)}${h.price ? ' — <span class="hl-price">' + escapeHtml(h.price) + '</span>' : ''}</div>
                    <div class="history-date">${formatDateLong(h.date)}</div>
                </div>
            </div>
        `).join('');
    }

    openModal('modal-history');
}

// ── Modals ──

function openModal(id) {
    document.getElementById(id).classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
    document.body.style.overflow = '';
}

function closeModalOverlay(e) {
    if (e.target === e.currentTarget) {
        e.target.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ── Brand autocomplete ──

function positionBrandDropdown() {
    const input = document.getElementById('f-brand');
    const container = document.getElementById('brand-suggestions');
    if (!input || !container) return;
    const rect = input.getBoundingClientRect();
    container.style.top = rect.bottom + 2 + 'px';
    container.style.left = rect.left + 'px';
    container.style.width = rect.width + 'px';
}

function onBrandInput(val) {
    const container = document.getElementById('brand-suggestions');
    if (!val || val.length < 1) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    const query = val.toLowerCase();
    const matches = POPULAR_BRANDS.filter(b => b.toLowerCase().includes(query)).slice(0, 6);
    if (matches.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    positionBrandDropdown();
    container.style.display = 'block';
    container.innerHTML = matches.map(b =>
        `<div class="brand-suggestion-item" onmousedown="selectBrand('${b.replace(/'/g, "\\'")}')">${highlightMatch(b, query)}</div>`
    ).join('');
}

function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return escapeHtml(text);
    return escapeHtml(text.slice(0, idx)) + '<strong>' + escapeHtml(text.slice(idx, idx + query.length)) + '</strong>' + escapeHtml(text.slice(idx + query.length));
}

function selectBrand(brand) {
    document.getElementById('f-brand').value = brand;
    closeBrandSuggestions();
}

function closeBrandSuggestions() {
    const c = document.getElementById('brand-suggestions');
    if (c) { c.innerHTML = ''; c.style.display = 'none'; }
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.form-brand-wrap') && !e.target.closest('.brand-suggestions')) closeBrandSuggestions();
});

document.addEventListener('scroll', function() { closeBrandSuggestions(); }, true);

// ── Filter / Sort events ──

function initFilters() {
    document.getElementById('stock-search').addEventListener('input', renderArticles);

    document.querySelectorAll('.status-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.status-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderArticles();
        });
    });

    document.querySelectorAll('.sort-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const sort = chip.dataset.sort;
            if (currentSort === sort) {
                currentSortDir = currentSortDir === 'desc' ? 'asc' : 'desc';
            } else {
                currentSort = sort;
                currentSortDir = 'desc';
            }
            document.querySelectorAll('.sort-chip').forEach(c => {
                c.classList.remove('active');
                c.querySelector('.sort-arrow').textContent = '▼';
            });
            chip.classList.add('active');
            chip.dataset.dir = currentSortDir;
            chip.querySelector('.sort-arrow').textContent = currentSortDir === 'desc' ? '▼' : '▲';
            renderArticles();
        });
    });
}

// ── Auth + VIP guard ──

function getDiscordIdForStock() {
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

async function checkVipAccess() {
    const user = JSON.parse(localStorage.getItem('ozeah_user') || 'null');
    if (!user) {
        window.location.href = 'index.html';
        return false;
    }

    const discordId = getDiscordIdForStock();
    if (!discordId) {
        showVipWall('Lie ton compte Discord pour acceder a la gestion de stock.');
        return false;
    }

    try {
        const res = await fetch('vip_data.json?t=' + Date.now());
        if (!res.ok) {
            showVipWall('Impossible de verifier ton statut VIP.');
            return false;
        }
        const data = await res.json();
        const sub = data.subscribers ? data.subscribers[discordId] : null;
        if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
            return true;
        }
    } catch (e) {}

    showVipWall(null);
    return false;
}

function showVipWall(customMsg) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.style.zIndex = '3000';
    overlay.onclick = function(e) { if (e.target === overlay) window.location.href = 'profile.html'; };
    overlay.innerHTML = `
        <div class="modal-content modal-small" style="text-align:center;">
            <div style="font-size:2.5rem;margin-bottom:1rem;">👑</div>
            <h2 class="modal-title">Fonctionnalite VIP</h2>
            <p class="delete-warn" style="margin-bottom:1.5rem;">
                ${customMsg || 'La gestion de stock est reservee aux membres VIP. Abonne-toi pour debloquer cette fonctionnalite.'}
            </p>
            <div class="form-actions" style="justify-content:center;gap:0.75rem;">
                <a href="profile.html" class="btn-modal-cancel" style="text-decoration:none;">Retour</a>
                <a href="index.html#vip" class="btn-modal-confirm" style="text-decoration:none;">Devenir VIP — 9.59€/mois</a>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ── Init ──

document.addEventListener('DOMContentLoaded', async () => {
    const hasAccess = await checkVipAccess();
    if (!hasAccess) return;
    const cb = document.getElementById('urssaf-checkbox');
    if (cb) cb.checked = isUrssafEnabled;
    initFilters();
    initDashPeriodTabs();
    renderArticles();
    window.addEventListener('resize', movePeriodSlider);
});
