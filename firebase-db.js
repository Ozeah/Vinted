// ============================================================
// OzeaH — Firebase Firestore Database Layer
// ============================================================

var firebaseConfig = {
    apiKey: "AIzaSyDpjL7T0aYxiRqGsfE_oldyhg7ZTYR618I",
    authDomain: "ozeah-vinted.firebaseapp.com",
    projectId: "ozeah-vinted",
    storageBucket: "ozeah-vinted.firebasestorage.app",
    messagingSenderId: "436941369887",
    appId: "1:436941369887:web:ae1d7a62eddff3c7d2db2a",
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

// ── User profiles ──

async function dbSaveUser(discordUser) {
    var ref = db.collection('users').doc(discordUser.id);
    var doc = await ref.get();
    var data = {
        discordId: discordUser.id,
        username: discordUser.username,
        global_name: discordUser.global_name || null,
        avatar: discordUser.avatar || null,
        last_seen: new Date().toISOString(),
    };
    if (!doc.exists) {
        data.first_seen = new Date().toISOString();
    }
    await ref.set(data, { merge: true });
}

async function dbGetAllUsers() {
    var snapshot = await db.collection('users').get();
    return snapshot.docs.map(function(doc) { return doc.data(); });
}

// ── Stock articles ──

var _stockCache = [];
var _stockCacheIds = new Set();

async function dbInitStock(discordId) {
    var snapshot = await db.collection('users').doc(discordId).collection('articles').get();
    _stockCache = snapshot.docs.map(function(doc) { return doc.data(); });
    _stockCacheIds = new Set(_stockCache.map(function(a) { return a.id; }));
    return _stockCache;
}

function dbGetCachedArticles() {
    return _stockCache.slice();
}

function dbSyncArticles(discordId, articles) {
    _stockCache = articles.slice();
    var newIds = new Set(articles.map(function(a) { return a.id; }));

    _stockCacheIds.forEach(function(oldId) {
        if (!newIds.has(oldId)) {
            db.collection('users').doc(discordId).collection('articles').doc(oldId).delete();
        }
    });

    articles.forEach(function(article) {
        db.collection('users').doc(discordId).collection('articles').doc(article.id).set(article);
    });

    _stockCacheIds = newIds;
}

async function dbLoadUserArticles(discordId) {
    var snapshot = await db.collection('users').doc(discordId).collection('articles').get();
    return snapshot.docs.map(function(doc) { return doc.data(); });
}

// ── Migration: localStorage → Firestore (one-time) ──

async function dbMigrateLocalStock(discordId) {
    var key = 'stock_d_' + discordId;
    var raw = localStorage.getItem(key);
    if (!raw) return;
    var localArticles = JSON.parse(raw);
    if (!localArticles || localArticles.length === 0) return;

    var promises = localArticles.map(function(article) {
        return db.collection('users').doc(discordId).collection('articles').doc(article.id).set(article);
    });
    await Promise.all(promises);
    localStorage.removeItem(key);
}
