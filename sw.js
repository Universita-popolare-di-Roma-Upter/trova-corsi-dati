// Web app «Upter · Trova corsi»: funziona anche senza rete con gli ultimi dati scaricati.
// Quando si cambia l'app (non i dati), aumentare VERSIONE.
const VERSIONE = "trova-corsi-v1";
const GUSCIO = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-64.png",
  "fonts/AtkinsonHyperlegible-400-latin-ext.woff2",
  "fonts/AtkinsonHyperlegible-400-latin.woff2",
  "fonts/AtkinsonHyperlegible-400i-latin-ext.woff2",
  "fonts/AtkinsonHyperlegible-400i-latin.woff2",
  "fonts/AtkinsonHyperlegible-700-latin-ext.woff2",
  "fonts/AtkinsonHyperlegible-700-latin.woff2",
  "fonts/Spectral-600-latin-ext.woff2",
  "fonts/Spectral-600-latin.woff2",
  "fonts/Spectral-700-latin-ext.woff2",
  "fonts/Spectral-700-latin.woff2"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(GUSCIO)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n.startsWith("trova-corsi-") && n !== VERSIONE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Pagina e dati: prima la rete (per avere i corsi del giorno), poi la copia salvata.
// Icone e caratteri: prima la copia salvata.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const dinamico = req.mode === "navigate" || url.pathname.endsWith("/corsi.json") || url.pathname.endsWith("/index.html");
  if (dinamico) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copia = res.clone(); caches.open(VERSIONE).then((c) => c.put(req.mode === "navigate" ? "./" : req, copia)); }
        return res;
      }).catch(() => caches.match(req.mode === "navigate" ? "./" : req, { ignoreSearch: true }).then((r) => r || caches.match("./")))
    );
  } else {
    e.respondWith(caches.match(req).then((r) => r || fetch(req)));
  }
});
