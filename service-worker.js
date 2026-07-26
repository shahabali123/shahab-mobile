const CACHE_NAME = 'shahab-mobile-cache-v5'; // Version update for instant refresh
const urlsToCache = [
    './',
    './index.html',
    './product.html', // Added for single product page
    './offers.html',
    './guide.html',
    './installments.html',
    './manifest.json',
    './app.js',
    './products.js',
    './hero.js',
    './images/logo.png',
    './images/tecno-spark-go-3.webp',
    'https://cdn.tailwindcss.com'
    // Add other critical assets here (e.g., main CSS, common images)
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Naye worker ko foran active karo
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});