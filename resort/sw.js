/* リゾートソート サービスワーカー
 *
 * 目的：新着求人を「端末の中だけ」で判定して通知する。
 *
 * 設計の前提（ここを外すと違法になる）
 *   厚生労働省「令和4年改正職業安定法Q&A」問1-6
 *     ・検索ワードの入力やチェックボックスでの絞り込みは
 *       「労働者になろうとする者に関する情報の収集」に該当しない
 *     ・利用者“全体”の傾向で表示順を決めるのは特定募集情報等提供に該当しないが、
 *       “特定の利用者個人”の閲覧履歴を踏まえて表示順を決めるのは該当する
 *
 *   したがって、次の3つを絶対に守る。
 *     1. 検索条件は端末（IndexedDB）にだけ置く。サーバーへ送らない。
 *     2. プッシュの購読情報（endpoint）をこちらのサーバーに保存しない。
 *        ＝ 一般的なWebプッシュ（サーバーから送る方式）は使わない。
 *     3. 通知はこのワーカーが端末内で組み立てて出す。
 *
 *   この形なら、こちらは利用者について何も受け取らないので、
 *   特定募集情報等提供に当たらず、届出も不要。
 */
const DB = "rs-alert";
const STORE = "kv";

function idb() {
  return new Promise((ok, ng) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ng(r.error);
  });
}
function get(key) {
  return idb().then(db => new Promise((ok) => {
    const r = db.transaction(STORE).objectStore(STORE).get(key);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ok(undefined);
  }));
}
function put(key, val) {
  return idb().then(db => new Promise((ok) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put(val, key);
    t.oncomplete = () => ok(true);
    t.onerror = () => ok(false);
  }));
}

/* 端末に保存した条件と、新着求人を突き合わせる。
   画面側の passesWith() と同じ考え方だが、new_jobs.json に入れている
   項目だけを見る簡易版。ここで扱う条件は利用者が自分で入れたもので、
   その場で捨てる（どこにも送らない）。 */
function matches(job, c) {
  if (!c) return false;
  if (c.pref && (job.prefecture || "") !== c.pref) return false;
  if (c.region && (job.region || "") !== c.region) return false;
  if (c.wage && (job.wage_min || 0) < c.wage) return false;
  if (c.dorm === "完全個室" && job.dorm_type !== "完全個室") return false;
  if (c.dorm === "個室以上" &&
      ["完全個室", "個室（相部屋の可能性あり）"].indexOf(job.dorm_type) < 0) return false;
  if (c.meals && (job.meals_per_day || 0) < +c.meals) return false;
  if (c.dormfree && job.dorm_cost !== 0) return false;
  if (c.q) {
    const hay = [job.prefecture, job.region, job.city, job.job_category, job.agency]
      .join(" ").toLowerCase();
    const words = String(c.q).toLowerCase().split(/\s+/).filter(Boolean);
    for (let i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
  }
  return true;
}

async function checkNewJobs() {
  const cond = await get("conditions");
  if (!cond) return 0;
  let data;
  try {
    const res = await fetch("new_jobs.json", { cache: "no-store" });
    if (!res.ok) return 0;
    data = await res.json();
  } catch (e) { return 0; }

  const seen = (await get("seen")) || [];
  const seenSet = new Set(seen);
  const hit = (data.jobs || []).filter(j => !seenSet.has(String(j.id)) && matches(j, cond));
  if (!hit.length) return 0;

  // 同じ求人を二度知らせない。増えすぎないよう直近1,000件だけ覚える。
  const next = seen.concat(hit.map(j => String(j.id))).slice(-1000);
  await put("seen", next);
  await put("pending", hit.slice(0, 20));

  const top = hit[0];
  const where = [top.prefecture, top.city].filter(Boolean).join(" ");
  const wage = top.wage_min ? `時給${top.wage_min.toLocaleString()}円 ` : "";
  await self.registration.showNotification(
    `条件に合う新着が${hit.length}件あります`,
    {
      body: `${wage}${where} ${top.job_category || ""}`.trim(),
      icon: "/apple-touch-icon.png",
      badge: "/favicon.svg",
      tag: "rs-new-jobs",
      data: { url: "./?from=notify" },
      requireInteraction: false
    });
  return hit.length;
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// 背面での定期チェック。Chrome / Android などが対応。
// iOS は対応していないので、その場合は画面を開いたときに判定する（下の message）。
self.addEventListener("periodicsync", (e) => {
  if (e.tag === "rs-new-jobs") e.waitUntil(checkNewJobs());
});

// 画面から「今すぐ確認して」と言われたとき
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "check") {
    e.waitUntil(checkNewJobs().then(n => {
      if (e.source) e.source.postMessage({ type: "checked", count: n });
    }));
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true })
    .then(list => {
      for (const c of list) {
        if (c.url.indexOf("/resort/") >= 0 && "focus" in c) return c.focus();
      }
      return clients.openWindow(url);
    }));
});
