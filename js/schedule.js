// حساب الأيام والتنبيهات — مشترك بين الصفحة و service worker
import { SPECIES, dayPlan, turnHours } from './species.js';

const DAY = 86400000;

export function parseDate(s) {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function isoDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function today0(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
export function dayOf(inc, now = new Date()) {
  return Math.round((today0(now) - parseDate(inc.start_date)) / DAY) + 1;
}
export function startForDay(day, now = new Date()) {
  return isoDate(new Date(today0(now).getTime() - (day - 1) * DAY));
}
export function hatchDate(inc) {
  const S = SPECIES[inc.species] || SPECIES.chicken;
  return new Date(parseDate(inc.start_date).getTime() + (S.days - 1) * DAY);
}

// كل التنبيهات بين from و to (ms) لكل الفقاسات
export function eventsBetween(incs, from, to) {
  const out = [];
  for (const inc of incs) {
    if (!inc.notify) continue;
    const S = SPECIES[inc.species] || SPECIES.chicken;
    const start = parseDate(inc.start_date).getTime();
    for (let t0 = today0(new Date(from)).getTime() - DAY; t0 <= to; t0 += DAY) {
      const day = Math.round((t0 - start) / DAY) + 1;
      if (day < 1 || day > S.days + 1) continue;
      const plan = dayPlan(inc.species, inc, day);
      const push = (h, title, body, tag) => {
        const at = t0 + h * 3600000;
        if (at > from && at <= to) out.push({ at, title, body, tag: `${inc.slot}-${day}-${tag}` });
      };
      const label = `${inc.name} · اليوم ${day}`;
      push(7, label, `الحرارة ${plan.temp}° · الرطوبة ${plan.rh[0]}–${plan.rh[1]}%` +
        (plan.tasks.length ? ` — ${plan.tasks[0][1]}` : ''), 'morning');
      if (inc.mode === 'manual' && plan.turn) {
        const done = (inc.log && inc.log[day]) || [];
        turnHours(inc).forEach((h, i) => {
          if (!done.includes(i)) push(h, `قلّب البيض — ${inc.name}`, `التقليبة ${i + 1} من ${inc.turns_per_day} لليوم ${day}`, 'turn' + i);
        });
      }
      if (day === S.days - (inc.rest_end ?? 3) + 1) {
        push(19, `${inc.name}: بدأ الإغلاق`, inc.mode === 'auto' ? 'طفّي محرك التقليب وارفع الرطوبة.' : 'وقّف التقليب وارفع الرطوبة.', 'lock');
      }
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

// تخزين بسيط IndexedDB حتى يقرأه service worker
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('foregg', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export async function kvSet(k, v) {
  const d = await db();
  return new Promise((res) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = res; });
}
export async function kvGet(k) {
  const d = await db();
  return new Promise((res) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); });
}
