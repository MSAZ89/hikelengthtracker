// static/service-worker.js
self.addEventListener('install', (event) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(clients.claim());
});

// Keep the service worker alive
self.addEventListener('fetch', (event) => {
	event.respondWith(fetch(event.request));
});
