self.addEventListener('install', (e) => {
    e.waitUntil(
      caches.open('/').then((cache) => cache.addAll([
        'index.html',
        'read.html',
        'images/icon_256.png',
        'style.css',
        'script.js',
      ])),
    );
  });
  
  self.addEventListener('fetch', (e) => {
    console.log(e.request.url);
    e.respondWith(
      caches.match(e.request).then((response) => response || fetch(e.request)),
    );
  });
  