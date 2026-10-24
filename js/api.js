// اتصال بقاعدة البيانات (Supabase RPC). كل الوصول يمر عبر دوال محمية، ما أكو قراءة مباشرة للجداول.
const BASE = 'https://vxwuokycpmfbdqtxjlfd.supabase.co/rest/v1/rpc/';
const KEY = 'sb_publishable__uJ-YNqB9URuK4XDo6czFA_T_S8iGUj';

const MESSAGES = {
  username_taken: 'هذا الاسم مستخدم، جرّب اسم ثاني',
  bad_credentials: 'الاسم أو كلمة المرور غلط',
  weak_password: 'كلمة المرور لازم 6 أحرف على الأقل',
  bad_username: 'الاسم من 3 إلى 24 حرف وبدون مسافات',
  not_authenticated: 'انتهت الجلسة، سجّل دخول مرة ثانية',
  forbidden: 'هاي الصفحة للمدير بس',
};

export class ApiError extends Error {
  constructor(code) { super(MESSAGES[code] || 'صار خطأ بالاتصال، حاول بعد شوية'); this.code = code; }
}

async function rpc(fn, args) {
  let res;
  try {
    res = await fetch(BASE + fn, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
  } catch {
    throw new ApiError('offline');
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(data && data.message);
  return data;
}

let token = localStorage.getItem('foregg.token');
export const hasToken = () => !!token;
function keep(r) { token = r.token; localStorage.setItem('foregg.token', token); return r.user; }

export const api = {
  register: (u, p, d) => rpc('foregg_register', { p_username: u, p_password: p, p_display: d || null }).then(keep),
  login: (u, p) => rpc('foregg_login', { p_username: u, p_password: p }).then(keep),
  logout: async () => {
    const t = token; token = null; localStorage.removeItem('foregg.token');
    if (t) rpc('foregg_logout', { p_token: t }).catch(() => {});
  },
  state: () => rpc('foregg_state', { p_token: token }),
  save: (slot, data) => rpc('foregg_save', { p_token: token, p_slot: slot, p_data: data }),
  remove: (slot) => rpc('foregg_remove', { p_token: token, p_slot: slot }),
  admin: () => rpc('foregg_admin', { p_token: token }),
};
