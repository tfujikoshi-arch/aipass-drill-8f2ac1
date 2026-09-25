/* =====================================================================
   Service Worker ─ オフライン動作とホーム画面アプリ化のための部品

   ★ 問題やデザインを修正したら、必ず下の CACHE_VERSION の数字を1つ上げること。
     これを上げないと、すでにホーム画面に追加した端末に古い版が残り続けます。
   ===================================================================== */

const CACHE_VERSION = "aipass-drill-v7";

const ASSETS = [
  "./",
  "./index.html",
  "./questions.js",
  "./questions_full.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

/* インストール時に、必要なファイルを全部キャッシュへ */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* 有効化時に、古い版のキャッシュを削除 */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* 取得は「キャッシュ優先、無ければネットワーク」。
   ネットワークから取れたものは次回のために保存しておく。 */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") { return; }
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) { return hit; }
      return fetch(e.request).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
