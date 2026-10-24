import { api, hasToken, ApiError } from './api.js';
import { SPECIES, SPECIES_ORDER, dayPlan, stageFor, turnHours } from './species.js';
import { dayOf, startForDay, hatchDate, eventsBetween, kvSet } from './schedule.js';
import { CandleEgg, visual } from './egg3d.js';

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const fmtHour = (h) => `${pad(Math.floor(h))}:${h % 1 ? '30' : '00'}`;

const st = {
  user: null, incs: [], slot: Number(localStorage.getItem('foregg.slot')) || 1,
  preview: null, candle: true, eggs: [],
};

/* ---------- small svg kit ---------- */
const EGG_PATH = 'M20 2C30.5 2 38 11 38 23C38 37 30 50 20 50C10 50 2 37 2 23C2 11 9.5 2 20 2Z';
let uid = 0;
function eggSVG({ w = 26, shell = '#d9b48a', candled = false, day = 1, total = 21, empty = false } = {}) {
  const h = w * 1.3, id = 'e' + (++uid);
  if (empty) return `<svg width="${w}" height="${h}" viewBox="0 0 40 52" aria-hidden="true"><path d="${EGG_PATH}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 3"/></svg>`;
  if (!candled) return `<svg width="${w}" height="${h}" viewBox="0 0 40 52" aria-hidden="true"><defs><radialGradient id="${id}" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="${shell}"/><stop offset="1" stop-color="${shell}" stop-opacity=".75"/></radialGradient></defs><path d="${EGG_PATH}" fill="url(#${id})" stroke="rgba(22,16,11,.35)" stroke-width="1"/></svg>`;
  const v = visual(Math.min(21, day * 21 / total));
  const airH = 52 * v.air;
  return `<svg width="${w}" height="${h}" viewBox="0 0 40 52" aria-hidden="true"><defs>
    <radialGradient id="${id}" cx=".5" cy=".62" r=".7"><stop offset="0" stop-color="#ffd27a"/><stop offset=".6" stop-color="#ff7a1c"/><stop offset="1" stop-color="#7a1606"/></radialGradient>
    <clipPath id="${id}c"><path d="${EGG_PATH}"/></clipPath></defs>
    <path d="${EGG_PATH}" fill="url(#${id})"/>
    <g clip-path="url(#${id}c)">
      ${v.reach > 0 ? `<circle cx="17" cy="26" r="${2 + v.reach * 30}" fill="none" stroke="#8a1208" stroke-width="${0.6 + v.veinA}" opacity="${v.veinA * 0.8}"/>
      <path d="M17 26l-${v.reach * 22} -${v.reach * 9}M17 26l${v.reach * 20} -${v.reach * 12}M17 26l${v.reach * 14} ${v.reach * 20}M17 26l-${v.reach * 12} ${v.reach * 22}" stroke="#8a1208" stroke-width=".8" opacity="${v.veinA * 0.7}"/>` : ''}
      ${v.emb > 0 ? `<circle cx="17" cy="26" r="${1 + v.emb * 60}" fill="#2a0904" opacity=".75"/>` : ''}
      <rect x="0" y="${airH}" width="40" height="52" fill="#120502" opacity="${v.mass * 0.92}"/>
      <rect x="0" y="0" width="40" height="${airH}" fill="#ffe3a8" opacity=".55"/>
    </g></svg>`;
}
const ICONS = {
  lamp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z"/></svg>',
  drag: '<svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 2L1 6l4 4M17 2l4 4-4 4M1 6h20"/></svg>',
  dl: '<svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 1v10M2 7l5 5 5-5M1 15h12"/></svg>',
  out: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/></svg>',
  gear: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  ledger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v16H4zM4 9h16M4 14h16M9 4v16"/></svg>',
  x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5l14 14M19 5L5 19"/></svg>',
  lock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  bell: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4"/></svg>',
  hand: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M22 34V14a4 4 0 0 1 8 0v16M30 28V10a4 4 0 0 1 8 0v18M38 28V14a4 4 0 0 1 8 0v22c0 12-7 20-17 20-8 0-12-5-16-11l-6-10a4 4 0 0 1 6-5l7 7"/></svg>',
  motor: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="32" cy="32" r="10"/><path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M15 49l6-6M43 21l6-6"/></svg>',
  task: { setup: '◐', rest: '∥', turn: '↻', candle: '◉', mist: '≋', lock: '■', hatch: '✶' },
};
const rockEgg = '<svg class="rot" width="34" height="44" viewBox="0 0 40 52"><path d="' + EGG_PATH + '" fill="var(--yolk)" stroke="var(--ink)" stroke-width="2"/></svg>';

/* ---------- utils ---------- */
function toast(msg) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
function disposeEggs() { st.eggs.forEach((e) => e.dispose()); st.eggs = []; }
let lastTap = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener('pointerdown', (e) => { lastTap = { x: e.clientX, y: e.clientY }; }, true);
addEventListener('pointermove', (e) => {
  document.body.style.setProperty('--mx', e.clientX + 'px');
  document.body.style.setProperty('--my', e.clientY + 'px');
}, { passive: true });

function show(html, { iris = true } = {}) {
  disposeEggs();
  const v = document.createElement('div');
  v.className = 'view';
  v.innerHTML = html;
  if (iris && app.firstChild && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    v.classList.add('iris-in');
    v.style.setProperty('--ox', lastTap.x + 'px');
    v.style.setProperty('--oy', lastTap.y + 'px');
    app.appendChild(v);
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      [...app.children].forEach((c) => c !== v && c.remove());
      v.classList.remove('iris-in');
      scrollTo(0, 0);
    };
    v.addEventListener('animationend', settle, { once: true });
    setTimeout(settle, 1100); // احتياط إذا المتصفح وقّف الأنيميشن
  } else {
    app.replaceChildren(v);
  }
  return v;
}
function mountEgg(host, opts = {}) {
  try {
    const e = new CandleEgg(host, opts);
    st.eggs.push(e);
    return e;
  } catch (err) {
    host.innerHTML = `<div style="display:grid;place-items:center;height:100%">${eggSVG({ w: 120, candled: true, day: 7 })}</div>`;
    return null;
  }
}
const incBySlot = (s) => st.incs.find((i) => i.slot === s);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;

/* ---------- install ---------- */
let deferredPrompt = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
addEventListener('appinstalled', () => { deferredPrompt = null; toast('تم تثبيت فقّاسة على جهازك'); });
async function install() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    return;
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  modal(`<h3>ثبّت التطبيق</h3>
    <p>${ios ? 'على الآيفون من Safari:' : 'على الأندرويد من Chrome:'}</p>
    <ol>${ios
      ? '<li>اضغط زر المشاركة أسفل الشاشة</li><li>اختار «إضافة إلى الشاشة الرئيسية»</li>'
      : '<li>اضغط النقاط الثلاث ⋮ فوق</li><li>اختار «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»</li><li>يطلع لك أيقونة فقّاسة مثل أي تطبيق</li>'}
    </ol><button class="btn" data-close><span>تمام</span><span class="arrow">←</span></button>`);
}
function modal(inner) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="card" role="dialog" aria-modal="true"><button class="icon-btn close" data-close aria-label="إغلاق">${ICONS.x}</button>${inner}</div>`;
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); });
  document.body.appendChild(m);
  return m;
}

const BRAND = `<span class="brand"><svg class="mark" viewBox="0 0 40 52" aria-hidden="true"><defs><radialGradient id="bm" cx=".5" cy=".6" r=".7"><stop offset="0" stop-color="#ffe0a0"/><stop offset=".55" stop-color="#ff8a1e"/><stop offset="1" stop-color="#8a2208"/></radialGradient></defs><path d="${EGG_PATH}" fill="url(#bm)"/><circle cx="17" cy="27" r="6" fill="none" stroke="#7a1206" stroke-width="1.6" opacity=".8"/><circle cx="17" cy="27" r="2" fill="#3a0804"/></svg><b>فقّاسة</b></span>`;

/* ---------- AUTH ---------- */
function dialSVG() {
  let ticks = '';
  for (let i = 0; i < 84; i++) {
    const a = (i / 84) * Math.PI * 2, big = i % 4 === 0;
    const r1 = 49, r2 = big ? 45 : 47;
    ticks += `<line x1="${50 + Math.cos(a) * r1}" y1="${50 + Math.sin(a) * r1}" x2="${50 + Math.cos(a) * r2}" y2="${50 + Math.sin(a) * r2}" stroke="currentColor" stroke-width="${big ? .5 : .25}"/>`;
  }
  return `<svg class="dial" viewBox="0 0 100 100" aria-hidden="true">${ticks}
    <path id="dp" d="M50 50m-41 0a41 41 0 1 1 82 0a41 41 0 1 1-82 0" fill="none"/>
    <text font-size="3.4" letter-spacing=".9" fill="currentColor" font-family="Readex Pro"><textPath href="#dp">37.7° · 55% · ثلاث تقليبات باليوم · واحد وعشرين يوم · 37.7° · 55% · افحص بالضوء ·</textPath></text></svg>`;
}

function viewAuth() {
  const v = show(`
  <main class="auth">
    <div class="topstrip">
      ${BRAND}
      ${isStandalone() ? '' : `<button class="dl-chip" data-install>${ICONS.dl}<span>حمّل للأندرويد</span></button>`}
    </div>
    <div class="auth-body">
      <section class="auth-hero">
        <span class="badge"><i></i>نظام خاص للفقاسات</span>
        <h1 class="headline"><span>تابع فقاستك يوم بيوم</span><span>حرارة، رطوبة، وتقليب بوقته</span><span class="hl">وشوف الجنين تحت الضوء</span></h1>
        <p class="sub">14 نوع بيض، 3 فقاسات بنفس الوقت، وتذكير بكل تقليبة.</p>
        <div class="chips"><span class="neon pink">${ICONS.task.candle} فحص بالضوء ثلاثي الأبعاد</span><span class="neon violet">${ICONS.bell} إشعارات التقليب</span></div>
        <div class="porthole-wrap">${dialSVG()}<div class="porthole"><div class="egg-host"></div></div><i class="orb o1"></i><i class="orb o2"></i></div>
      </section>
      <section class="auth-form">
        <h2 class="enter-title">شنو اسمك؟</h2>
        <form novalidate autocomplete="on">
          <label class="field reveal"><span class="label">اكتب اسمك وادخل مباشرة</span><input name="u" autocomplete="nickname" required minlength="2" maxlength="24" dir="auto" enterkeyhint="go"></label>
          <label class="field code-field" hidden><span class="label">هذا الاسم محمي برمز · اكتب الرمز</span><input name="c" type="password" autocomplete="current-password" enterkeyhint="go"></label>
          <p class="err" role="alert"></p>
          <button class="btn reveal" type="submit"><span>ادخل</span><span class="arrow">←</span></button>
          <p class="form-note">أول مرة؟ ينسوّى حسابك تلقائياً. بعدين اكتب نفس الاسم وترجع لفقاساتك.</p>
        </form>
      </section>
    </div>
  </main>`, { iris: false });

  const dl = $('[data-install]', v); if (dl) dl.onclick = install;

  const egg = mountEgg($('.porthole .egg-host', v), { seed: 11 });
  if (egg) {
    let d = 1;
    egg.setDay(d, 21, true);
    const tick = setInterval(() => { if (!egg.renderer.domElement.isConnected) return clearInterval(tick); d = d % 21 + 1; egg.setDay(d, 21); }, 1600);
  }

  $('form', v).onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target, btn = $('button[type=submit]', f), err = $('.err', f);
    err.textContent = '';
    const u = f.u.value.trim().replace(/s+/g, ' ');
    if (u.length < 2) return (err.textContent = 'الاسم حرفين على الأقل');
    btn.disabled = true;
    try {
      st.user = await api.enter(u, f.c.value);
      await boot(true);
    } catch (x) {
      err.textContent = x instanceof ApiError ? x.message : 'صار خطأ';
      btn.disabled = false;
      if (x.code === 'code_required' || x.code === 'bad_code') {
        const cf = $('.code-field', f);
        cf.hidden = false;
        cf.classList.add('reveal');
        f.c.select();
        f.c.focus();
      }
    }
  };
  // تغيير الاسم يرجّع حقل الرمز مخفي
  $('form', v).u.addEventListener('input', (e) => {
    const f = e.target.form;
    $('.code-field', f).hidden = true;
    f.c.value = '';
    $('.err', f).textContent = '';
  });
}

/* ---------- HOME ---------- */
function slotsBar() {
  return `<div class="slots">${[1, 2, 3].map((s) => {
    const inc = incBySlot(s);
    if (!inc) return `<button class="slot empty" data-slot="${s}" ${st.slot === s ? 'aria-current="true"' : ''}><span class="num">${s}</span>${eggSVG({ w: 22, empty: true })}<span class="meta"><strong>فاضية</strong><span class="label">+ أضف</span></span></button>`;
    const S = SPECIES[inc.species], d = dayOf(inc);
    return `<button class="slot" data-slot="${s}" ${st.slot === s ? 'aria-current="true"' : ''}><span class="num">${s}</span>${eggSVG({ w: 22, candled: true, day: Math.max(1, d), total: S.days })}<span class="meta"><strong>${esc(inc.name)}</strong><span class="led">${Math.max(1, d)}<span style="opacity:.5">/${S.days}</span></span></span></button>`;
  }).join('')}</div>`;
}

function viewHome(opts = {}) {
  const inc = incBySlot(st.slot);
  const head = `<header class="bar-top">
      ${BRAND}
      <nav>
        <span class="who">${esc(st.user.display_name || st.user.username)}</span>
        ${st.user.is_admin ? `<button class="icon-btn" data-go="admin" title="لوحة المدير" aria-label="لوحة المدير">${ICONS.ledger}</button>` : ''}
        ${isStandalone() ? '' : `<button class="icon-btn" data-install title="تثبيت التطبيق" aria-label="تثبيت التطبيق">${ICONS.dl}</button>`}
        <button class="icon-btn acct ${st.user.has_code ? '' : 'open'}" data-account title="الحساب والرمز" aria-label="الحساب والرمز">${ICONS.lock}</button>
      </nav></header>`;
  if (!inc) {
    const v = show(`<main class="home">${head}${slotsBar()}
      <section class="empty-dash">
        <span class="label">فقاسة رقم ${st.slot}</span>
        <h2>فاضية.<br>نبدي؟</h2>
        <p>اختار نوع البيض وطريقة التقليب، ونبدي وياك من اليوم الأول. كل يوم نطلع لك الحرارة والرطوبة ووقت التقليب وشكل البيضة تحت الضوء.</p>
        <button class="btn" data-new style="max-width:360px"><span>فقاسة جديدة</span><span class="arrow">←</span></button>
      </section></main>`, { iris: !opts.soft });
    bindHome(v);
    return;
  }
  const S = SPECIES[inc.species] || SPECIES.chicken;
  const today = dayOf(inc);
  const day = st.preview ?? Math.max(1, Math.min(today, S.days));
  const plan = dayPlan(inc.species, inc, day);
  const stage = stageFor(day, S.days);
  const hd = hatchDate(inc), left = S.days - today;
  const hours = turnHours(inc), done = (inc.log && inc.log[day]) || [];
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const isToday = day === today;
  const tempPos = ((plan.temp - 35.5) / 3) * 100;
  const rhA = plan.rh[0], rhB = plan.rh[1];

  let turnBlock;
  if (!plan.turn) {
    turnBlock = `<div class="turn-state off"><span class="led">لا تقلّب</span></div>
      <p style="font-size:14px;color:var(--ink-2);margin-top:6px">${plan.lock ? 'مرحلة الإغلاق: الفقاسة مسكّرة والرطوبة عالية.' : `أيام الراحة الأولى (${inc.rest_start} أيام).`}${inc.mode === 'auto' ? ' تأكد إن محرك التقليب طافي.' : ''}</p>`;
  } else if (inc.mode === 'auto') {
    turnBlock = `<div class="turn-state">${rockEgg}<span class="led">أوتوماتيك</span></div>
      <p style="font-size:14px;color:var(--ink-2);margin-top:6px">المحرك يقلب البيض. تأكد مرة باليوم إنه شغال وإن الصواني تتحرك.</p>`;
  } else {
    turnBlock = `<div class="turn-state"><span class="led">${done.length}/${hours.length}</span><span style="font-size:14px;color:var(--ink-2)">تقليبات ${isToday ? 'اليوم' : 'هذا اليوم'}<br>اضغط الوقت بعد ما تقلب</span></div>
      <div class="turn-times">${hours.map((h, i) => `<button class="tt ${isToday && !done.includes(i) && nowH >= h && nowH < h + 24 / hours.length ? 'due' : ''}" data-turn="${i}" aria-pressed="${done.includes(i)}"><span class="box">${done.includes(i) ? '✓' : ''}</span>${fmtHour(h)}</button>`).join('')}</div>`;
  }

  const total = S.days;
  const track = Array.from({ length: total }, (_, i) => {
    const d = i + 1, p = dayPlan(inc.species, inc, d);
    const flag = p.tasks.some((t) => t[0] === 'candle') ? '<i class="flag c"></i>' : p.tasks.some((t) => t[0] === 'lock') && d === total - inc.rest_end + 1 ? '<i class="flag"></i>' : '';
    return `<button class="dz ${d < today ? 'past' : ''} ${d === today ? 'today' : ''} ${d === day ? 'sel' : ''}" data-day="${d}" style="--i:${i}" aria-label="اليوم ${d}">${flag}${eggSVG({ w: 26, candled: true, day: d, total })}<span class="n">${d}</span></button>`;
  }).join('');

  const dateFmt = new Intl.DateTimeFormat('ar-IQ', { weekday: 'long', day: 'numeric', month: 'long' });
  const v = show(`<main class="home">${head}${slotsBar()}
    <div class="dash">
      <section class="chamber ${isToday ? '' : 'previewing'}">
        <div class="glow"></div>
        <div class="egg-host" aria-label="بيضة ثلاثية الأبعاد، اسحب لتدويرها"></div>
        <div class="scan"></div>
        <div class="dayno"><span class="label">${isToday ? 'اليوم' : 'معاينة'}</span><div class="big ignite">${pad(day)}</div><span class="of">من ${total}</span></div>
        <div class="chamber-meta"><span class="label" style="color:rgba(255,228,190,.5)">${esc(inc.name)}</span><div class="led">${S.name}</div><div class="led" style="font-size:16px;opacity:.6">${inc.mode === 'auto' ? 'تقليب أوتوماتيك' : 'تقليب يدوي'}${inc.egg_count ? ` · ${inc.egg_count} بيضة` : ''}</div></div>
        <div class="chamber-ctrl">
          <button class="lamp-btn" data-lamp aria-pressed="${st.candle}">${ICONS.lamp}<span>ضوء الفحص</span></button>
          <button class="back-today" data-day="${today}">رجوع لليوم ${today}</button>
          <span class="hint">${ICONS.drag} اسحب</span>
        </div>
      </section>
      <div>
        <section class="panel stage">
          <span class="label">تحت الضوء · <b>يوم ${day}</b></span>
          <h2>${stage.title}</h2>
          <p>${stage.text}</p>
        </section>
        <section class="instruments">
          <div class="inst"><span class="label">الحرارة</span><div class="val">${plan.temp.toFixed(1)}<small>°م</small></div>
            <div class="ruler"><div class="ticks"></div><div class="mark" style="left:${tempPos}%"></div><div class="ends"><span>35.5</span><span>38.5</span></div></div></div>
          <div class="inst"><span class="label">الرطوبة</span><div class="val"><span dir="ltr">${rhA}–${rhB}</span><small>%</small></div>
            <div class="ruler"><div class="ticks"></div><div class="band" style="left:${rhA}%;width:${rhB - rhA}%"></div><div class="mark" style="left:${(rhA + rhB) / 2}%"></div><div class="ends"><span>0</span><span>100</span></div></div></div>
          <div class="inst wide"><span class="label">التقليب</span>${turnBlock}</div>
        </section>
        <section class="panel">
          <span class="label">مهام يوم ${day}</span>
          <ul class="tasks" style="margin-top:8px">${(plan.tasks.length ? plan.tasks : [['turn', plan.turn ? 'حافظ على الحرارة والرطوبة، وقلّب حسب الجدول.' : 'حافظ على الحرارة والرطوبة.']]).map(([k, t]) => `<li class="${k}"><span class="ic">${ICONS.task[k] || '·'}</span><span>${t}</span></li>`).join('')}</ul>
        </section>
        <section class="timeline">
          <div class="head"><span class="label">كل الأيام · اضغط يوم حتى تشوف البيضة</span><span class="label">${S.name} · ${total} يوم</span></div>
          <div class="track">${track}</div>
        </section>
        <section class="panel countdown">
          <div><span class="label">${left > 0 ? 'باقي على الفقس' : left === 0 ? 'الفقس' : 'تجاوز الفقس'}</span><div class="led">${left > 0 ? left : left === 0 ? 'اليوم' : Math.abs(left)}</div></div>
          <p>${left >= 0 ? 'الموعد المتوقع' : 'بأيام، الموعد كان'}<br><strong>${dateFmt.format(hd)}</strong></p>
        </section>
        <section class="panel actions-row">
          <button class="btn ghost" data-settings><span>إعدادات الفقاسة</span><span class="arrow">←</span></button>
        </section>
      </div>
    </div></main>`, { iris: !opts.soft });

  let egg = opts.keep;
  if (egg) {
    $('.chamber .egg-host', v).replaceWith(egg.host);
    st.eggs.push(egg);
    egg.setDay(day, total);
    egg.resize();
  } else {
    egg = mountEgg($('.chamber .egg-host', v), { seed: 100 + st.slot * 17 });
    if (egg) { egg.setSpecies(inc.species); egg.setDay(day, total, true); }
  }
  st.homeEgg = egg;
  if (egg) egg.setCandle(st.candle);
  const sel = $('.dz.sel', v), trackEl = $('.track', v);
  if (sel && !opts.soft) requestAnimationFrame(() => { trackEl.scrollLeft = sel.offsetLeft - trackEl.clientWidth / 2 + sel.offsetWidth / 2; });
  bindHome(v, inc);
}

function bindHome(v, inc) {
  v.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.slot) {
      st.slot = Number(t.dataset.slot); st.preview = null;
      localStorage.setItem('foregg.slot', st.slot);
      return viewHome();
    }
    if ('new' in t.dataset) return viewWizard(st.slot);
    if ('logout' in t.dataset) { await api.logout(); st.user = null; st.incs = []; await kvSet('incs', []); return viewAuth(); }
    if ('install' in t.dataset) return install();
    if ('account' in t.dataset) return viewAccount();
    if (t.dataset.go === 'admin') return viewAdmin();
    if ('settings' in t.dataset) return viewSettings(inc);
    if ('lamp' in t.dataset) {
      st.candle = !st.candle; t.setAttribute('aria-pressed', st.candle);
      st.homeEgg && st.homeEgg.setCandle(st.candle);
      return;
    }
    if (t.dataset.day) {
      const d = Number(t.dataset.day), today = dayOf(inc);
      st.preview = d === today ? null : d;
      return softDay(d);
    }
    if (t.dataset.turn) {
      const i = Number(t.dataset.turn), day = st.preview ?? dayOf(inc);
      const log = { ...(inc.log || {}) }, cur = new Set(log[day] || []);
      cur.has(i) ? cur.delete(i) : cur.add(i);
      log[day] = [...cur].sort();
      inc.log = log;
      viewHomeSoft();
      try { await api.save(inc.slot, { log }); persistLocal(); } catch (x) { toast(x.message); }
    }
  });
}

// تبديل اليوم بدون ما نعيد بناء البيضة من الصفر (تتحول بنعومة لليوم الجديد)
function softDay() {
  const keep = st.homeEgg, y = scrollY, tx = $('.track')?.scrollLeft;
  st.eggs = st.eggs.filter((e) => e !== keep);
  viewHome({ keep, soft: true });
  scrollTo(0, y);
  if (tx != null && $('.track')) $('.track').scrollLeft = tx;
}
const viewHomeSoft = softDay;

/* ---------- WIZARD ---------- */
function viewWizard(slot) {
  const w = { step: 1, species: null, mode: null, day: 1, name: `فقاسة ${slot}`, egg_count: '', turns_per_day: 3 };
  const render = () => {
    const S = w.species && SPECIES[w.species];
    let body = '';
    if (w.step === 1) {
      body = `<h2>شنو نوع البيض؟</h2><p>كل نوع إله حرارة ورطوبة ومدة فقس خاصة. نجيبها لك تلقائياً يوم بيوم.</p>
        <div class="species-grid">${SPECIES_ORDER.map((k, i) => {
          const s = SPECIES[k], w2 = Math.round(22 + 14 * Math.min(2.4, s.size) / 2.4 * 1.6);
          return `<button class="sp" data-sp="${k}" aria-pressed="${w.species === k}" style="--i:${i}"><span class="eggbox">${eggSVG({ w: Math.min(46, w2), shell: s.shell })}</span><span><strong>${s.name}</strong><small>${s.sub || '&nbsp;'}</small><span class="led">${s.days} يوم · ${s.temp}°</span></span></button>`;
        }).join('')}</div>`;
    } else if (w.step === 2) {
      body = `<h2>شلون تقلّب؟</h2><p>الفقاسة رقم ${slot}. كل فقاسة إلها إعدادها الخاص.</p>
        <div class="modes">
          <button class="mode" data-mode="manual" aria-pressed="${w.mode === 'manual'}">${ICONS.hand}<strong>يدوي</strong><p>أنت تقلب بإيدك. نذكّرك بأوقات التقليب وتأشر كل مرة تقلب.</p></button>
          <button class="mode" data-mode="auto" aria-pressed="${w.mode === 'auto'}">${ICONS.motor}<strong>أوتوماتيك</strong><p>الفقاسة تقلب بالمحرك. نذكّرك متى تشغله ومتى تطفيه قبل الفقس.</p></button>
        </div>`;
    } else {
      body = `<h2>وين وصلت؟</h2><p>إذا هسه حاطّ البيض خلّيه على اليوم 1. إذا البيض من قبل، اختار اليوم اللي وصلت له.</p>
        <div class="daypick"><button class="step-btn" data-d="1">+</button><div class="led">${w.day}<small>/${S.days}</small></div><button class="step-btn" data-d="-1">−</button></div>
        <input type="range" min="1" max="${S.days}" value="${w.day}" data-range aria-label="اليوم">
        <label class="field"><span class="label">اسم الفقاسة</span><input data-f="name" value="${esc(w.name)}" maxlength="40"></label>
        <div class="row2">
          <label class="field"><span class="label">عدد البيض</span><input data-f="egg_count" inputmode="numeric" value="${esc(w.egg_count)}" placeholder="مثلاً 48"></label>
          ${w.mode === 'manual' ? `<div class="field"><span class="label">تقليبات باليوم</span><div class="mini-step"><button data-t="1" type="button">+</button><span class="led">${w.turns_per_day}</span><button data-t="-1" type="button">−</button></div></div>` : ''}
        </div>`;
    }
    const ok = (w.step === 1 && w.species) || (w.step === 2 && w.mode) || w.step === 3;
    return `<main class="sheet">
      <div class="sheet-head"><button class="icon-btn" data-cancel aria-label="رجوع">${ICONS.x}</button><div class="steps">${[1, 2, 3].map((i) => `<i class="${i <= w.step ? 'on' : ''}"></i>`).join('')}</div><span class="label">خطوة ${w.step} من 3</span></div>
      <div class="sheet-body">${body}</div>
      <div class="sheet-foot">${w.step > 1 ? '<button class="btn ghost" data-back style="flex:0 0 auto;width:auto"><span>→</span></button>' : ''}<button class="btn" data-next ${ok ? '' : 'disabled'}><span>${w.step === 3 ? 'ابدأ التفقيس' : 'التالي'}</span><span class="arrow">←</span></button></div>
    </main>`;
  };
  const v = show(render());
  const rerender = () => { v.innerHTML = render(); };
  v.addEventListener('input', (e) => {
    if (e.target.dataset.f) w[e.target.dataset.f] = e.target.value;
    if ('range' in e.target.dataset) { w.day = Number(e.target.value); $('.daypick .led', v).innerHTML = `${w.day}<small>/${SPECIES[w.species].days}</small>`; }
  });
  v.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if ('cancel' in t.dataset) return viewHome();
    if (t.dataset.sp) { w.species = t.dataset.sp; return rerender(); }
    if (t.dataset.mode) { w.mode = t.dataset.mode; return rerender(); }
    if ('back' in t.dataset) { w.step--; return rerender(); }
    if (t.dataset.d) { w.day = Math.max(1, Math.min(SPECIES[w.species].days, w.day + Number(t.dataset.d))); return rerender(); }
    if (t.dataset.t) { w.turns_per_day = Math.max(1, Math.min(12, w.turns_per_day + Number(t.dataset.t))); return rerender(); }
    if ('next' in t.dataset) {
      if (w.step < 3) { w.step++; return rerender(); }
      t.disabled = true;
      try {
        const n = parseInt(w.egg_count, 10);
        const saved = await api.save(slot, {
          name: w.name.trim() || `فقاسة ${slot}`, species: w.species, mode: w.mode,
          start_date: startForDay(w.day), egg_count: Number.isFinite(n) ? n : null,
          turns_per_day: w.turns_per_day, rest_start: 3, rest_end: 3, notify: true,
        });
        st.incs = st.incs.filter((i) => i.slot !== slot).concat(saved);
        st.preview = null;
        persistLocal();
        viewHome();
        askNotify();
      } catch (x) { toast(x.message); t.disabled = false; }
    }
  });
}

/* ---------- SETTINGS ---------- */
function viewSettings(inc) {
  const S = SPECIES[inc.species];
  const f = { ...inc, day: Math.max(1, dayOf(inc)) };
  const stepper = (key, label, min, max) => `<div class="field"><span class="label">${label}</span><div class="mini-step"><button data-k="${key}" data-v="1" type="button">+</button><span class="led" data-show="${key}">${f[key]}</span><button data-k="${key}" data-v="-1" data-min="${min}" type="button">−</button></div></div>`;
  const v = show(`<main class="sheet">
    <div class="sheet-head"><button class="icon-btn" data-cancel aria-label="رجوع">${ICONS.x}</button><span class="label">إعدادات · ${esc(inc.name)}</span><span></span></div>
    <div class="sheet-body">
      <h2>الإعدادات</h2><p>${S.name} · ${S.days} يوم. غيّر اليوم إذا البيض متقدم أو متأخر.</p>
      <div class="field"><span class="label">اليوم الحالي</span></div>
      <div class="daypick"><button class="step-btn" data-k="day" data-v="1" type="button">+</button><div class="led" data-show="day">${f.day}</div><button class="step-btn" data-k="day" data-v="-1" type="button">−</button></div>
      <label class="field"><span class="label">اسم الفقاسة</span><input data-f="name" value="${esc(f.name)}" maxlength="40"></label>
      <div class="row2">
        <label class="field"><span class="label">نوع البيض</span><select data-f="species">${SPECIES_ORDER.map((k) => `<option value="${k}" ${k === f.species ? 'selected' : ''}>${SPECIES[k].name} · ${SPECIES[k].days} يوم</option>`).join('')}</select></label>
        <label class="field"><span class="label">التقليب</span><select data-f="mode"><option value="manual" ${f.mode === 'manual' ? 'selected' : ''}>يدوي</option><option value="auto" ${f.mode === 'auto' ? 'selected' : ''}>أوتوماتيك</option></select></label>
      </div>
      <div class="row2">
        <label class="field"><span class="label">عدد البيض</span><input data-f="egg_count" inputmode="numeric" value="${f.egg_count ?? ''}"></label>
        ${stepper('turns_per_day', 'تقليبات باليوم', 1, 12)}
      </div>
      <div class="row2">
        ${stepper('rest_start', 'أيام بلا تقليب بالبداية', 0, 10)}
        ${stepper('rest_end', 'أيام الإغلاق بالنهاية', 0, 10)}
      </div>
      <div class="row2">${stepper('first_turn_hour', 'ساعة أول تقليبة', 0, 23)}<span></span></div>
      <button class="switch" data-notify role="switch" aria-checked="${f.notify}"><span>${ICONS.bell} &nbsp;إشعارات هاي الفقاسة</span><span class="tg"></span></button>
      <button class="danger" data-del>حذف الفقاسة وبدء من جديد</button>
    </div>
    <div class="sheet-foot"><button class="btn" data-save><span>احفظ</span><span class="arrow">←</span></button></div>
  </main>`);
  const limits = { day: [1, 60], turns_per_day: [1, 12], rest_start: [0, 10], rest_end: [0, 10], first_turn_hour: [0, 23] };
  v.addEventListener('input', (e) => { const k = e.target.dataset.f; if (k) f[k] = e.target.value; });
  v.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if ('cancel' in t.dataset) return viewHome();
    if (t.dataset.k) {
      const k = t.dataset.k, [lo, hi] = limits[k];
      f[k] = Math.max(lo, Math.min(hi, Number(f[k]) + Number(t.dataset.v)));
      $(`[data-show="${k}"]`, v).textContent = f[k];
      return;
    }
    if ('notify' in t.dataset) { f.notify = !f.notify; t.setAttribute('aria-checked', f.notify); if (f.notify) askNotify(); return; }
    if ('del' in t.dataset) {
      if (!confirm('تحذف هاي الفقاسة؟ ما ترجع.')) return;
      try { await api.remove(inc.slot); st.incs = st.incs.filter((i) => i.slot !== inc.slot); persistLocal(); viewHome(); } catch (x) { toast(x.message); }
      return;
    }
    if ('save' in t.dataset) {
      t.disabled = true;
      const n = parseInt(f.egg_count, 10);
      try {
        const saved = await api.save(inc.slot, {
          name: String(f.name).trim() || inc.name, species: f.species, mode: f.mode, start_date: startForDay(f.day),
          egg_count: Number.isFinite(n) ? n : null, turns_per_day: f.turns_per_day, rest_start: f.rest_start,
          rest_end: f.rest_end, first_turn_hour: f.first_turn_hour, notify: f.notify,
        });
        st.incs = st.incs.filter((i) => i.slot !== inc.slot).concat(saved);
        st.preview = null; persistLocal(); viewHome(); toast('انحفظت الإعدادات');
      } catch (x) { toast(x.message); t.disabled = false; }
    }
  });
}

/* ---------- ACCOUNT ---------- */
function viewAccount() {
  const u = st.user, has = u.has_code;
  const v = show(`<main class="sheet">
    <div class="sheet-head"><button class="icon-btn" data-cancel aria-label="رجوع">${ICONS.x}</button><span class="label">الحساب</span><span></span></div>
    <div class="sheet-body">
      <h2>${esc(u.username)}</h2>
      <div class="lock-state ${has ? 'on' : ''}">${ICONS.lock}<div>
        <strong>${has ? 'محمي برمز' : 'مفتوح بالاسم'}</strong>
        <p>${has ? 'ما أحد يقدر يدخل هذا الحساب إلا إذا كتب الرمز الصحيح.' : 'هسه أي واحد يكتب هذا الاسم يدخل لفقاساتك. حط رمز حتى يصير الاسم إلك بس.'}</p>
      </div></div>
      <form data-code novalidate>
        <label class="field"><span class="label">${has ? 'الرمز الجديد' : 'الرمز'} (4 أحرف أو أرقام على الأقل)</span><input name="a" type="password" autocomplete="new-password" minlength="4"></label>
        <label class="field"><span class="label">اكتب الرمز مرة ثانية</span><input name="b" type="password" autocomplete="new-password"></label>
        <p class="err" role="alert"></p>
        <button class="btn" type="submit"><span>${has ? 'غيّر الرمز' : 'احفظ الرمز'}</span><span class="arrow">←</span></button>
      </form>
      <p class="form-note">بعد ما تحفظ الرمز، أي جهاز ثاني داخل على حسابك يطلع تلقائياً.</p>
      ${has ? '<button class="danger" data-clear>شيل الرمز وخلّي الدخول بالاسم بس</button>' : ''}
      <div style="margin-top:28px"><button class="btn ghost" data-logout><span>تسجيل خروج</span><span class="arrow">${ICONS.out}</span></button></div>
    </div>
  </main>`);
  const done = (profile, msg) => { st.user = { ...st.user, ...profile }; persistLocal(); toast(msg); viewAccount(); };
  $('[data-code]', v).onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target, err = $('.err', f), btn = $('button[type=submit]', f);
    if (f.a.value.length < 4) return (err.textContent = 'الرمز 4 أحرف أو أرقام على الأقل');
    if (f.a.value !== f.b.value) return (err.textContent = 'الرمزين مو نفس الشي');
    btn.disabled = true;
    try { done(await api.setCode(f.a.value), 'انحفظ الرمز. الاسم صار إلك بس'); }
    catch (x) { err.textContent = x.message; btn.disabled = false; }
  };
  v.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if ('cancel' in t.dataset) return viewHome();
    if ('logout' in t.dataset) { await api.logout(); st.user = null; st.incs = []; await kvSet('incs', []); return viewAuth(); }
    if ('clear' in t.dataset) {
      if (!confirm('تشيل الرمز؟ بعدها أي واحد يكتب اسمك يدخل.')) return;
      try { done(await api.setCode(''), 'انشال الرمز'); } catch (x) { toast(x.message); }
    }
  });
}

/* ---------- ADMIN ---------- */
async function viewAdmin() {
  let rows;
  try { rows = await api.admin(); } catch (x) { return toast(x.message); }
  const activeIncs = rows.flatMap((u) => u.incubators);
  const soon = activeIncs.filter((i) => { const S = SPECIES[i.species]; return S && i.day >= S.days - 3 && i.day <= S.days; }).length;
  const rel = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
  const ago = (s) => { const m = (new Date(s) - Date.now()) / 60000; return Math.abs(m) < 60 ? rel.format(Math.round(m), 'minute') : Math.abs(m) < 1440 ? rel.format(Math.round(m / 60), 'hour') : rel.format(Math.round(m / 1440), 'day'); };
  const list = (q = '') => rows.filter((u) => !q || u.username.toLowerCase().includes(q) || (u.display_name || '').includes(q)).map((u, i) => `
    <li style="--i:${i}"><div class="u"><strong>${esc(u.display_name || u.username)} <span>@${esc(u.username)}${u.is_admin ? ' · مدير' : ''}</span></strong><span>آخر دخول ${ago(u.last_seen)}</span></div>
      <div class="incs">${u.incubators.length ? u.incubators.map((c) => {
        const S = SPECIES[c.species] || SPECIES.chicken, pct = Math.max(0, Math.min(100, c.day / S.days * 100));
        return `<div class="inc"><span>${c.slot}. ${esc(c.name)} · ${S.name} · ${c.mode === 'auto' ? 'أوتوماتيك' : 'يدوي'}${c.egg_count ? ` · ${c.egg_count} بيضة` : ''}</span><span class="led">${c.day}/${S.days}</span><span class="bar"><i class="${c.day >= S.days - 3 ? 'hot' : ''}" style="width:${pct}%"></i></span></div>`;
      }).join('') : '<span class="label">ما عنده فقاسات بعد</span>'}</div></li>`).join('');
  const v = show(`<main class="home">
    <header class="bar-top"><span class="wordmark">السجل</span><nav><button class="icon-btn" data-back aria-label="رجوع">${ICONS.x}</button></nav></header>
    <div class="stats"><div><span class="label">مستخدمين</span><span class="led">${rows.length}</span></div><div><span class="label">فقاسات شغالة</span><span class="led">${activeIncs.length}</span></div><div><span class="label">قريبة للفقس</span><span class="led" style="color:var(--amber)">${soon}</span></div></div>
    <div class="search"><input placeholder="ابحث باسم المستخدم" data-q></div>
    <ul class="ledger">${list()}</ul>
    </main>`);
  $('[data-back]', v).onclick = () => viewHome();
  $('[data-q]', v).oninput = (e) => { $('.ledger', v).innerHTML = list(e.target.value.trim().toLowerCase()); };
}

/* ---------- notifications ---------- */
async function askNotify() {
  if (!('Notification' in window) || Notification.permission !== 'default') return;
  const m = modal(`<h3>نذكّرك؟</h3><p style="color:var(--ink-2);margin-bottom:16px">نطلع لك إشعار وقت التقليب، وكل صباح بالحرارة والرطوبة، ويوم الإغلاق. للفقاسات الثلاث.</p>
    <button class="btn" data-yes><span>شغّل الإشعارات</span><span class="arrow">←</span></button>`);
  $('[data-yes]', m).onclick = async () => { m.remove(); const p = await Notification.requestPermission(); if (p === 'granted') { scheduleLocal(); registerPeriodic(); toast('الإشعارات شغالة'); } };
}
let timers = [];
async function scheduleLocal() {
  timers.forEach(clearTimeout); timers = [];
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = Date.now();
  const evs = eventsBetween(st.incs, now, now + 36 * 3600000).slice(0, 30);
  const reg = await navigator.serviceWorker?.ready;
  for (const ev of evs) {
    timers.push(setTimeout(() => {
      reg ? reg.showNotification(ev.title, { body: ev.body, tag: ev.tag, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', dir: 'rtl', lang: 'ar' })
        : new Notification(ev.title, { body: ev.body, tag: ev.tag });
    }, ev.at - now));
  }
}
async function registerPeriodic() {
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('periodicSync' in reg) await reg.periodicSync.register('foregg-tick', { minInterval: 60 * 60 * 1000 });
  } catch { /* المتصفح ما يدعم */ }
}
function persistLocal() {
  localStorage.setItem('foregg.cache', JSON.stringify({ user: st.user, incs: st.incs }));
  kvSet('incs', st.incs).catch(() => {});
  scheduleLocal();
}

/* ---------- boot ---------- */
async function boot(fromLogin = false) {
  if (!hasToken()) return viewAuth();
  try {
    const s = await api.state();
    st.user = s.user; st.incs = s.incubators;
    persistLocal();
  } catch (x) {
    if (x.code === 'not_authenticated') { await api.logout(); return viewAuth(); }
    const c = JSON.parse(localStorage.getItem('foregg.cache') || 'null');
    if (!c) return viewAuth();
    st.user = c.user; st.incs = c.incs;
    toast('بدون إنترنت — نعرض آخر بيانات محفوظة');
  }
  if (!incBySlot(st.slot) && st.incs.length) st.slot = st.incs[0].slot;
  viewHome();
  registerPeriodic();
  if (fromLogin && !isStandalone() && !localStorage.getItem('foregg.installAsked')) {
    localStorage.setItem('foregg.installAsked', '1');
    setTimeout(() => {
      const m = modal(`<h3>نزّل فقّاسة على موبايلك</h3><p style="color:var(--ink-2);margin-bottom:16px">يشتغل مثل تطبيق عادي على الأندرويد، بأيقونة على الشاشة وإشعارات.</p>
        <button class="btn" data-go-install><span>حمّل التطبيق</span><span class="arrow">${ICONS.dl}</span></button>`);
      $('[data-go-install]', m).onclick = () => { m.remove(); install(); };
    }, 900);
  }
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', { type: 'module' }).catch(() => {});
document.addEventListener('visibilitychange', () => { if (!document.hidden && st.user) { scheduleLocal(); } });

// سماء نجوم خفيفة خلف التطبيق
(function stars() {
  const sky = document.createElement('div');
  sky.className = 'sky';
  sky.setAttribute('aria-hidden', 'true');
  for (let layer = 0; layer < 3; layer++) {
    const i = document.createElement('i'), dots = [];
    for (let k = 0; k < 45; k++) {
      const hue = Math.random() < 0.25 ? '255,170,70' : '190,255,225';
      dots.push(`${(Math.random() * 100).toFixed(2)}vw ${(Math.random() * 200).toFixed(2)}vh 0 ${layer ? 0 : .4}px rgba(${hue},${(0.25 + Math.random() * 0.6).toFixed(2)})`);
    }
    i.style.boxShadow = dots.join(',');
    sky.appendChild(i);
  }
  document.body.prepend(sky);
})();

app.innerHTML = `<div class="loading">${BRAND}</div>`;
boot();
