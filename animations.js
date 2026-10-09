// ============================================================
// OzeaH — animations de la page d'accueil
// ============================================================
(function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('fx');
    if (reduce) document.documentElement.classList.add('fx-reduce');

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    // ---------- Apparition au scroll (avec décalage par élément) ----------
    function initReveal() {
        var groups = [
            ['.section-header', 0],
            ['.features-main .feature-card', 110],
            ['.features-grid .feature-card', 70],
            ['.steps .step', 160],
            ['.pricing-wrap > *', 140],
            ['.faq-item', 70],
            ['.footer-content', 0],
        ];
        var els = [];
        groups.forEach(function (g) {
            document.querySelectorAll(g[0]).forEach(function (el, i) {
                el.setAttribute('data-reveal', '');
                el.style.setProperty('--d', (i * g[1]) + 'ms');
                els.push(el);
            });
        });
        if (reduce || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('in');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        els.forEach(function (el) { io.observe(el); });

        // Démos dans les cartes + ligne des étapes : se jouent quand visibles
        var io2 = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('play');
                    if (e.target.classList.contains('demo-legit')) countUp(e.target.querySelector('.legit-score'), 92, '%', 1400);
                    io2.unobserve(e.target);
                }
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('.feature-demo, .steps').forEach(function (el) { io2.observe(el); });
    }

    // ---------- Compteurs ----------
    function countUp(el, target, suffix, duration) {
        if (!el) return;
        if (reduce) { el.textContent = target + suffix; return; }
        var start = null;
        function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function initStats() {
        var stats = document.querySelectorAll('.hero-stats .stat-number');
        stats.forEach(function (el) {
            var m = el.textContent.trim().match(/^(\d+)(.*)$/);
            if (!m || el.textContent.indexOf('/') !== -1) return;   // on ne compte pas "24/7"
            var target = parseInt(m[1], 10), suffix = m[2];
            el.textContent = '0' + suffix;
            setTimeout(function () { countUp(el, target, suffix, 1600); }, 600);
        });
    }

    // ---------- Fil d'alertes "en direct" dans le hero ----------
    var ITEMS = [
        { t: 'Ralph Lauren — pull col rond', p: '14,00 €', s: 'M', e: { fr: 'Très bon', en: 'Very good' }, k: 'knit' },
        { t: "Levi's 501 — brut", p: '19,00 €', s: 'W32', e: { fr: 'Bon', en: 'Good' }, k: 'jean' },
        { t: 'Stone Island — sweat', p: '48,00 €', s: 'L', e: { fr: 'Très bon', en: 'Very good' }, k: 'knit' },
        { t: 'Jordan 4 Retro', p: '95,00 €', s: '43', e: { fr: 'Bon', en: 'Good' }, k: 'shoe' },
        { t: 'Carhartt Detroit Jacket — brun', p: '24,00 €', s: 'L', e: { fr: 'Très bon', en: 'Very good' }, k: 'jacket' },
        { t: 'The North Face Nuptse 700', p: '89,00 €', s: 'M', e: { fr: 'Neuf', en: 'New' }, k: 'jacket' },
        { t: "Nike Air Force 1 '07", p: '35,00 €', s: '42', e: { fr: 'Neuf', en: 'New' }, k: 'shoe' },
        { t: 'Lacoste — polo vintage', p: '12,00 €', s: 'S', e: { fr: 'Bon', en: 'Good' }, k: 'knit' },
    ];
    var SVG = {
        jacket: '<svg viewBox="0 0 64 64"><path d="M22 10l10 5 10-5 12 7 4 16-8 3v20H14V36l-8-3 4-16z" fill="currentColor"/><path d="M32 15v41" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/></svg>',
        shoe: '<svg viewBox="0 0 64 64"><path d="M6 40c0-6 4-12 9-14l7-2c3 4 9 6 14 6 6 0 10 4 16 5 4 1 7 3 7 7v4H6z" fill="currentColor" stroke="#9ca3b5" stroke-width="1.5"/><path d="M6 46h52v5H6z" fill="#fff" opacity=".85"/></svg>',
        knit: '<svg viewBox="0 0 64 64"><path d="M20 10h24l14 10-6 10-6-3v29H18V27l-6 3-6-10z" fill="currentColor"/><path d="M26 10c1 4 3 6 6 6s5-2 6-6" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/></svg>',
        jean: '<svg viewBox="0 0 64 64"><path d="M16 8h32l4 50H38l-6-30-6 30H12z" fill="currentColor"/><path d="M16 14h32" stroke="rgba(0,0,0,.25)" stroke-width="2"/></svg>',
    };
    var THUMB = { jacket: 'dc-thumb-jacket', shoe: 'dc-thumb-shoe', knit: 'dc-thumb-knit', jean: 'dc-thumb-jean' };

    function lang() { return document.documentElement.lang === 'en' ? 'en' : 'fr'; }
    function L(fr, en) { return lang() === 'en' ? en : fr; }

    function buildMsg(item) {
        var el = document.createElement('div');
        el.className = 'dc-msg dc-msg-new';
        el.innerHTML =
            '<div class="dc-avatar"><img src="bot-avatar.png" alt=""></div>' +
            '<div class="dc-body">' +
                '<div class="dc-head"><span class="dc-name">OzeaH</span><span class="dc-bot">BOT</span>' +
                '<span class="dc-time">' + L("à l'instant", 'just now') + '</span><span class="dc-new">' + L('NOUVEAU', 'NEW') + '</span></div>' +
                '<div class="dc-embed"><div class="dc-embed-main">' +
                    '<div class="dc-embed-title"></div>' +
                    '<div class="dc-fields">' +
                        '<div><span>' + L('Prix', 'Price') + '</span><strong class="price"></strong></div>' +
                        '<div><span>' + L('Taille', 'Size') + '</span><strong class="sz"></strong></div>' +
                        '<div><span>' + L('État', 'Condition') + '</span><strong class="st"></strong></div>' +
                    '</div></div>' +
                    '<div class="dc-thumb ' + THUMB[item.k] + '" aria-hidden="true">' + SVG[item.k] + '</div>' +
                '</div>' +
                '<div class="dc-buttons"><span class="dc-btn dc-btn-link">' + L('Voir sur Vinted', 'View on Vinted') + '</span><span class="dc-btn">' + L('Profil vendeur', 'Seller profile') + '</span></div>' +
            '</div>';
        el.querySelector('.dc-embed-title').textContent = item.t;
        el.querySelector('.price').textContent = item.p;
        el.querySelector('.sz').textContent = item.s;
        el.querySelector('.st').textContent = item.e[lang()];
        return el;
    }

    function initFeed() {
        var feed = document.querySelector('.alert-feed');
        if (!feed || reduce) return;
        var i = 0;
        var timer = null;

        function tick() {
            if (document.hidden) return;
            var msgs = feed.querySelectorAll('.dc-msg');
            // l'ancien message du haut devient "il y a quelques s", on retire le badge NOUVEAU
            msgs.forEach(function (m) {
                var b = m.querySelector('.dc-new'); if (b) b.remove();
                var t = m.querySelector('.dc-time'); if (t) t.textContent = L('il y a 6 s', '6 s ago');
                m.querySelectorAll('.dc-buttons').forEach(function (bt) { bt.remove(); });
            });
            // le dernier sort
            var last = msgs[msgs.length - 1];
            if (last) {
                last.classList.add('dc-msg-out');
                setTimeout(function () { last.remove(); }, 450);
            }
            var msg = buildMsg(ITEMS[i % ITEMS.length]);
            i++;
            feed.insertBefore(msg, feed.firstChild);
            // petit "ping" sur la mascotte
            var mascot = document.querySelector('.hero-mascot');
            if (mascot) { mascot.classList.remove('ping'); void mascot.offsetWidth; mascot.classList.add('ping'); }
        }

        // les 2 cartes statiques sont remplacées au fil de l'eau
        setTimeout(function () {
            feed.querySelectorAll('.dc-msg').forEach(function (m) { m.classList.remove('dc-msg-1', 'dc-msg-2'); });
            tick();
            timer = setInterval(tick, 3800);
        }, 3200);
    }

    // ---------- Halo qui suit la souris sur les cartes ----------
    function initSpotlight() {
        if (reduce || window.matchMedia('(hover: none)').matches) return;
        document.querySelectorAll('.feature-card, .pricing-card, .pricing-free').forEach(function (card) {
            card.addEventListener('pointermove', function (e) {
                var r = card.getBoundingClientRect();
                card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                card.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });
    }

    // ---------- Boutons magnétiques ----------
    function initMagnet() {
        if (reduce || window.matchMedia('(hover: none)').matches) return;
        document.querySelectorAll('.hero-cta .btn, .pricing-cta .btn').forEach(function (btn) {
            btn.addEventListener('pointermove', function (e) {
                var r = btn.getBoundingClientRect();
                var x = (e.clientX - r.left - r.width / 2) * 0.18;
                var y = (e.clientY - r.top - r.height / 2) * 0.25;
                btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
            });
            btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
        });
    }

    // ---------- Parallaxe légère du fond ----------
    function initParallax() {
        if (reduce) return;
        var orbs = document.querySelectorAll('.bg-orb');
        var visual = document.querySelector('.hero-visual');
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                var y = window.scrollY;
                orbs.forEach(function (o, i) { o.style.translate = '0 ' + (y * (i ? -0.08 : 0.12)) + 'px'; });
                if (visual && y < 900) visual.style.translate = '0 ' + (y * -0.06) + 'px';
                ticking = false;
            });
        }, { passive: true });
    }

    // ---------- Barre de progression de lecture ----------
    function initProgress() {
        var bar = document.createElement('div');
        bar.className = 'scroll-progress';
        document.body.appendChild(bar);
        window.addEventListener('scroll', function () {
            var h = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
        }, { passive: true });
    }

    ready(function () {
        initReveal();
        initStats();
        initSpotlight();
        initMagnet();
        initParallax();
        initProgress();
    });
})();
