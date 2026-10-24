// فقّاسة service worker: يشتغل بدون إنترنت + تذكيرات بالخلفية
import { eventsBetween, kvGet, kvSet } from './js/schedule.js';

const CACHE = 'foregg-v2';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/api.js', 'js/species.js', 'js/schedule.js',
  'js/egg3d.js', 'vendor/three.module.min.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/badge-96.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname.endsWith('supabase.co')) return;
  if (url.origin === location.origin) {
    // الشبكة أولاً حتى توصل التحديثات، والكاش إذا ما أكو إنترنت
    e.respondWith(fetch(e.request).then((r) => {
      const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
  } else if (url.hostname.includes('fonts.')) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r;
    })));
  }
});

async function tick() {
  const incs = (await kvGet('incs')) || [];
  const now = Date.now();
  const last = (await kvGet('lastTick')) || now - 3600000;
  const evs = eventsBetween(incs, Math.max(last, now - 6 * 3600000), now).slice(-3);
  for (const ev of evs) {
    await self.registration.showNotification(ev.title, { body: ev.body, tag: ev.tag, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', dir: 'rtl', lang: 'ar' });
  }
  await kvSet('lastTick', now);
}
self.addEventListener('periodicsync', (e) => { if (e.tag === 'foregg-tick') e.waitUntil(tick()); });

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => 'focus' in x);
    return c ? c.focus() : self.clients.openWindow('./');
  }));
});
