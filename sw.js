/**
 * sw.js - Service Worker for AMOLED Deep Space Wallpaper Studio
 * Provides 100% offline functionality for the app shell, engine, and pre-bundled assets.
 */

const CACHE_NAME = 'amoled-studio-v8';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/style.css',
  './src/default_assets.js',
  './src/camera_engine.js',
  './src/grading_engine.js',
  './src/mp4-muxer.js',
  './src/exporter.js',
  './src/wallpaper.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png',
  './images/thumbnails/carina.webp',
  './images/thumbnails/pillars.webp',
  './images/thumbnails/tarantula.webp',
  './images/thumbnails/quintet.webp',
  './images/thumbnails/southern_ring.webp',
  './images/thumbnails/phantom_galaxy.webp',
  './images/thumbnails/deep_field.webp',
  './images/thumbnails/jupiter.webp',
  './images/thumbnails/cartwheel.webp',
  './images/graded/carina_cosmic_cliffs_amoled_5k.webp',
  './images/graded/pillars_of_creation_amoled_5k.webp',
  './images/graded/phantom_galaxy_master.webp',
  './images/graded/tarantula_master.webp',
  './images/graded/jupiter_master.webp',
  './images/graded/quintet_master.webp',
  './images/graded/southern_ring_master.webp',
  './images/graded/deep_field_master.webp',
  './images/graded/cartwheel_master.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline app shell');
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Cleaning old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For external images (e.g. NASA API or ESA Webb images), use Network-First, then Cache
  if (url.origin !== self.location.origin) {
    if (event.request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|webp)$/i)) {
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => caches.match(event.request))
      );
      return;
    }
    return;
  }

  // Same-origin assets: Cache-First, fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
