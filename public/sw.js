/*
 * کاراینشو — سرویس‌ورکر اپلیکیشن کارشناس میدانی
 * هدف: امکان نصب اپلیکیشن روی گوشی کارشناس و باز شدن آن در محل حادثه
 * حتی در شرایط ضعف یا قطعی موقت شبکه.
 *
 * راهبرد: network-first برای پوسته برنامه (تا همیشه آخرین نسخه اجرا شود)
 * با پشتیبان cache در زمان قطعی اینترنت.
 */

const CACHE_NAME = 'karinsho-shell-v1';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // فقط درخواست‌های GET هم‌مبدأ کش می‌شوند
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => undefined);
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
