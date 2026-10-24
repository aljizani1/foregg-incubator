// قاعدة بيانات البيض — قيم الفقاسات ذات المروحة (forced-air).
// المصادر: Mississippi State Univ. Extension (Important Incubation Factors / Hatchery Management Guide),
// Oklahoma State Univ. (Artificial Incubation), NC State Poultry 4-H egg chart.
// الفقاسة الساكنة (بدون مروحة) تحتاج +1 إلى +1.5 درجة.

export const SPECIES = {
  chicken: {
    name: 'دجاج', sub: 'بياض / لاحم', days: 21,
    temp: 37.7, tempLock: 37.2, rh: [50, 55], rhLock: [65, 70],
    shell: '#d9b48a', glow: 'brown', size: 1, long: 1,
  },
  arab: {
    name: 'دجاج عربي', sub: 'بلدي', days: 21,
    temp: 37.7, tempLock: 37.2, rh: [50, 55], rhLock: [65, 70],
    shell: '#ead7bd', glow: 'cream', size: 0.92, long: 1.02,
  },
  bantam: {
    name: 'دجاج زينة', sub: 'بنتام / قزم', days: 20,
    temp: 37.7, tempLock: 37.2, rh: [50, 55], rhLock: [65, 70],
    shell: '#efe2cf', glow: 'cream', size: 0.72, long: 1,
  },
  duck: {
    name: 'بط', sub: 'بكيني / محلي', days: 28,
    temp: 37.5, tempLock: 37.2, rh: [55, 60], rhLock: [70, 75],
    shell: '#dfe6d6', glow: 'white', size: 1.18, long: 1.06, mist: 10,
  },
  muscovy: {
    name: 'بط مسكوفي', sub: 'بط فرنسي', days: 35,
    temp: 37.5, tempLock: 37.2, rh: [55, 60], rhLock: [70, 75],
    shell: '#eef0e4', glow: 'white', size: 1.22, long: 1.08, mist: 12,
  },
  goose: {
    name: 'وز', sub: 'إوز', days: 30,
    temp: 37.4, tempLock: 37.0, rh: [50, 55], rhLock: [75, 80],
    shell: '#f3efe6', glow: 'white', size: 1.65, long: 1.08, mist: 10,
  },
  turkey: {
    name: 'ديك رومي', sub: 'علوع', days: 28,
    temp: 37.5, tempLock: 37.2, rh: [55, 60], rhLock: [65, 75],
    shell: '#e8d6bd', glow: 'cream', size: 1.3, long: 1.05, speck: 0.45,
  },
  peafowl: {
    name: 'طاووس', sub: '', days: 28,
    temp: 37.5, tempLock: 37.2, rh: [55, 60], rhLock: [65, 70],
    shell: '#e4cfae', glow: 'cream', size: 1.4, long: 1.04,
  },
  guinea: {
    name: 'دجاج حبشي', sub: 'غرغر', days: 27,
    temp: 37.5, tempLock: 37.2, rh: [50, 55], rhLock: [65, 70],
    shell: '#d6b28c', glow: 'brown', size: 0.8, long: 0.97, speck: 0.35,
  },
  pheasant: {
    name: 'دراج', sub: 'تدرج', days: 24,
    temp: 37.6, tempLock: 37.2, rh: [50, 55], rhLock: [65, 70],
    shell: '#b9a07a', glow: 'brown', size: 0.68, long: 1.02,
  },
  partridge: {
    name: 'حجل', sub: 'شوكار', days: 24,
    temp: 37.6, tempLock: 37.2, rh: [45, 50], rhLock: [65, 70],
    shell: '#e6d7bf', glow: 'cream', size: 0.62, long: 1.03, speck: 0.3,
  },
  quail: {
    name: 'سمان', sub: 'فري / كوترنكس', days: 17,
    temp: 37.7, tempLock: 37.2, rh: [45, 50], rhLock: [65, 70],
    shell: '#d8c7a6', glow: 'cream', size: 0.42, long: 1.04, speck: 1,
  },
  pigeon: {
    name: 'حمام', sub: '', days: 18,
    temp: 37.5, tempLock: 37.2, rh: [55, 60], rhLock: [65, 70],
    shell: '#f6f3ec', glow: 'white', size: 0.52, long: 1.1,
  },
  ostrich: {
    name: 'نعام', sub: '', days: 42,
    temp: 36.2, tempLock: 36.0, rh: [25, 30], rhLock: [35, 40],
    shell: '#efe6d2', glow: 'cream', size: 2.4, long: 0.92,
  },
};

export const SPECIES_ORDER = ['chicken', 'arab', 'bantam', 'duck', 'muscovy', 'goose', 'turkey',
  'peafowl', 'guinea', 'pheasant', 'partridge', 'quail', 'pigeon', 'ostrich'];

// مراحل الجنين على مقياس الدجاج (21 يوم). باقي الأنواع تتحجّم نسبةً لمدتها.
const STAGES = [
  [1, 'البيضة صافية', 'ما يبين شي تحت الضوء غير ظل خفيف للصفار. طبيعي.'],
  [2, 'القرص الجنيني', 'بقعة باهتة فوق الصفار، أول خلايا الجنين.'],
  [3, 'أول نبضة', 'القلب يبدأ ينبض وتطلع حلقة دم صغيرة حول نقطة الجنين.'],
  [4, 'شكل العنكبوت', 'نقطة غامقة وحولها شعيرات دموية رفيعة تتفرع مثل أرجل العنكبوت.'],
  [5, 'العين تبان', 'الشعيرات تتوسع، والعين تبين نقطة سودة قرب الجنين.'],
  [6, 'الجنين يتحرك', 'الأوعية تغطي ربع البيضة. إذا هزّيت الضوء تشوف الجنين يتحرك.'],
  [7, 'شبكة الأوعية', 'الشعيرات واضحة كلش وتغطي ثلث البيضة. هذا يوم الفحص الأول: استبعد البيض الصافي.'],
  [9, 'الكتلة تكبر', 'الجنين صار كتلة غامقة والأوعية تمتد للأطراف.'],
  [11, 'الأوعية تغطي البيضة', 'الشبكة تغطي أغلب القشرة، والمنقار والأظافر تبدأ تتصلب.'],
  [13, 'الضوء يقل', 'الجنين يملأ نص البيضة، ونصها الثاني بعده يضوي.'],
  [14, 'الفحص الثاني', 'البيضة غامقة بأغلبها. استبعد اللي بيها حلقة دم أو بدون أوعية.'],
  [16, 'تملأ البيضة', 'الجنين يملأ البيضة، يبقى بس الكيس الهوائي فاتح.'],
  [18, 'ميلان الكيس الهوائي', 'الكيس الهوائي يكبر ويميل. الجنين يدور لوضعية الفقس.'],
  [19, 'النقر الداخلي', 'المنقار دخل الكيس الهوائي وتشوف ظله يتحرك فوق.'],
  [20, 'النقر الخارجي', 'ثقب صغير بالقشرة. لا تفتح الفقاسة ولا تساعد الفرخ.'],
  [21, 'الفقس', 'الفراخ تطلع. خليها تنشف جوه 12 إلى 24 ساعة قبل ما تطلعها.'],
];

export function chickenDay(day, total) {
  return Math.max(1, Math.min(21, day * 21 / total));
}

export function stageFor(day, total) {
  const cd = chickenDay(day, total);
  let s = STAGES[0];
  for (const st of STAGES) if (st[0] <= cd + 0.01) s = st;
  return { title: s[1], text: s[2], cd };
}

// خطة يوم واحد: حرارة، رطوبة، تقليب، مهام
export function dayPlan(sp, inc, day) {
  const S = SPECIES[sp] || SPECIES.chicken;
  const total = S.days;
  const restEnd = inc.rest_end ?? 3, restStart = inc.rest_start ?? 3;
  const lock = day > total - restEnd;
  const third = total / 3;
  let temp = S.temp;
  if (lock) temp = S.tempLock;
  else if (day <= third) temp = S.temp + 0.1;
  else if (day > total - restEnd - Math.round(total / 7)) temp = S.temp - 0.1;
  const rh = lock ? S.rhLock : S.rh;
  const turn = !lock && day > restStart;
  const tasks = [];
  const candle1 = Math.round(total / 3), candle2 = Math.round(total * 2 / 3);
  if (day === 1) tasks.push(['setup', 'شغّل الفقاسة قبل 24 ساعة حتى تثبت الحرارة، وحط البيض والطرف العريض للأعلى.']);
  if (day <= restStart) tasks.push(['rest', `أيام راحة: لا تقلب البيض (أول ${restStart} أيام).`]);
  if (day === restStart + 1 && !lock) tasks.push(['turn', inc.mode === 'auto' ? 'اليوم شغّل محرك التقليب.' : 'اليوم تبدي التقليب اليدوي.']);
  if (day === candle1) tasks.push(['candle', 'الفحص الأول بالضوء: استبعد البيض الصافي (غير المخصب).']);
  if (day === candle2) tasks.push(['candle', 'الفحص الثاني: استبعد البيض اللي بيه حلقة دم أو ما بيه حركة.']);
  if (S.mist && day >= S.mist && !lock) tasks.push(['mist', 'رش البيض بماي فاتر وخلّيه يبرد 10 إلى 15 دقيقة.']);
  if (day === total - restEnd + 1) tasks.push(['lock', inc.mode === 'auto'
    ? 'بداية الإغلاق: طفّي محرك التقليب، ارفع الرطوبة، وسكّر الفقاسة.'
    : 'بداية الإغلاق: وقّف التقليب، ارفع الرطوبة، وسكّر الفقاسة.']);
  else if (lock && day < total) tasks.push(['lock', 'إغلاق: لا تفتح الفقاسة ولا تقلب.']);
  if (day === total) tasks.push(['hatch', 'يوم الفقس المتوقع. لا تفتح الباب حتى تنشف الفراخ.']);
  if (day > total) tasks.push(['hatch', 'تجاوزت يوم الفقس. البيض المتأخر انطيه يوم أو يومين بعد.']);
  return { day, total, temp: Math.round(temp * 10) / 10, rh, turn, lock, tasks };
}

// أوقات التقليب لليوم (ساعات بالـ 24)
export function turnHours(inc) {
  const n = Math.max(1, inc.turns_per_day || 3), h0 = inc.first_turn_hour ?? 8;
  const step = 24 / n;
  return Array.from({ length: n }, (_, i) => (h0 + Math.round(i * step * 2) / 2) % 24);
}
