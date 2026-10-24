// بيضة ثلاثية الأبعاد تحت ضوء الفحص — كل شي يترسم بالكود (بدون صور جاهزة)
import * as THREE from '../vendor/three.module.min.js';
import { SPECIES, chickenDay } from './species.js';

const lerpTable = (pts, x) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const t = (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t * t * (3 - 2 * t);
    }
  }
  return pts[pts.length - 1][1];
};

// معاملات المرحلة على مقياس يوم الدجاج
export function visual(cd) {
  return {
    reach: lerpTable([[1, 0], [2.6, 0], [3, 0.035], [4, 0.085], [5, 0.15], [6, 0.21], [7, 0.3], [9, 0.42], [11, 0.54], [14, 0.64], [21, 0.68]], cd),
    ring: lerpTable([[2.5, 0], [3, 0.9], [7, 0.75], [10, 0]], cd),
    veinA: lerpTable([[2.6, 0], [3, 0.55], [5, 0.85], [7, 1], [13, 0.95], [17, 0.7], [20, 0.5]], cd),
    emb: lerpTable([[1, 0], [1.7, 0], [2, 0.014], [3, 0.018], [4, 0.024], [5, 0.032], [7, 0.048], [9, 0.075], [11, 0.105], [13, 0.15], [16, 0.22]], cd),
    eye: lerpTable([[4.4, 0], [5, 1], [11, 1], [13.5, 0]], cd),
    mass: lerpTable([[1, 0], [8, 0], [10, 0.28], [12, 0.52], [14, 0.72], [16, 0.86], [18, 0.93], [21, 0.96]], cd),
    air: lerpTable([[1, 0.1], [7, 0.13], [14, 0.18], [18, 0.25], [19, 0.31], [21, 0.34]], cd),
    tilt: lerpTable([[17, 0], [18.5, 0.32], [21, 0.42]], cd),
    pip: lerpTable([[18.6, 0], [19.4, 1]], cd),
    yolk: lerpTable([[1, 0.16], [3, 0.22], [8, 0.1], [10, 0]], cd),
    beat: lerpTable([[2.8, 0], [3, 1.6], [10, 3.2], [21, 3.8]], cd),
  };
}

function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const W = 1024, H = 512;
const EMB = { u: 0.06, v: 0.58 };

// شجرة الأوعية تنحسب مرة وحدة، وبعدين نرسم منها على قد ما وصل الجنين
function buildTree(seed) {
  const r = rng(seed), segs = [];
  const cx = EMB.u * W, cy = (1 - EMB.v) * H;
  const grow = (x, y, ang, w, life, depth, d) => {
    const step = 5;
    for (let i = 0; i < life; i++) {
      const radial = Math.atan2(y - cy, x - cx);
      let diff = radial - ang; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      ang += diff * 0.06 + (r() - 0.5) * 0.42;
      const nx = x + Math.cos(ang) * step, ny = y + Math.sin(ang) * step;
      d += step;
      segs.push([x, y, nx, ny, w, d, depth]);
      x = nx; y = ny; w *= 0.993;
      if (ny < 4 || ny > H - 4) break;
      if (depth < 5 && r() < 0.05 + depth * 0.012) {
        const side = r() < 0.5 ? -1 : 1;
        grow(x, y, ang + side * (0.45 + r() * 0.6), w * 0.62, life * (0.45 + r() * 0.3), depth + 1, d);
      }
    }
  };
  const trunks = 6;
  for (let k = 0; k < trunks; k++) {
    const a = (k / trunks) * Math.PI * 2 + r() * 0.6;
    grow(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, a, 4.2 + r() * 2, 70 + r() * 30, 0, 0);
  }
  return segs;
}

function paint(ctx, tree, v, seed) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'multiply';
  const cx = EMB.u * W, cy = (1 - EMB.v) * H;
  const reach = v.reach * H * 1.1;
  for (const off of [0, W]) {
    ctx.save();
    ctx.translate(off, 0);
    if (v.yolk > 0) {
      const g = ctx.createRadialGradient(cx, cy + 40, 10, cx, cy + 40, 220);
      g.addColorStop(0, `rgba(205,120,60,${v.yolk})`);
      g.addColorStop(1, 'rgba(205,120,60,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 240, cy - 200, 480, 480);
    }
    if (reach > 1) {
      // هالة دم خفيفة داخل منطقة الأوعية
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach);
      halo.addColorStop(0, `rgba(200,70,40,${0.28 * v.veinA})`);
      halo.addColorStop(1, 'rgba(200,70,40,0)');
      ctx.fillStyle = halo; ctx.fillRect(cx - reach, cy - reach, reach * 2, reach * 2);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'darken';
      for (const s of tree) {
        if (s[5] > reach) continue;
        const front = 1 - Math.max(0, (s[5] - reach * 0.75) / (reach * 0.25));
        const a = v.veinA * (0.55 + 0.45 * front) * (1 - s[6] * 0.09);
        const mixw = (c) => Math.round(255 - (255 - c) * a);
        ctx.strokeStyle = `rgb(${mixw(150 + s[6] * 12)},${mixw(30 + s[6] * 10)},${mixw(14)})`;
        ctx.lineWidth = Math.max(0.7, s[4] * 0.7 * (0.45 + 0.55 * Math.min(1, v.reach / 0.3)));
        ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'multiply';
      if (v.ring > 0) {
        const r = rng(seed + 7);
        ctx.strokeStyle = `rgba(150,20,8,${v.ring})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let i = 0; i <= 64; i++) {
          const a = i / 64 * Math.PI * 2, rr = reach * (1 + (r() - 0.5) * 0.06);
          const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.92;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

const vert = /* glsl */`
  varying vec3 vN; varying vec3 vV; varying vec3 vObj; varying vec3 vWorld; varying vec2 vUv;
  uniform float uLong;
  void main(){
    vUv = uv;
    vObj = vec3(position.x, position.y / uLong, position.z);
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vec4 mv = viewMatrix * w;
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const frag = /* glsl */`
  uniform sampler2D uMap; uniform float uCandle, uAir, uTilt, uMass, uTime, uEmb, uEye, uPip, uBeat, uSpeck, uFlick;
  uniform vec3 uShell, uCore, uRim; uniform vec2 uEmbPos;
  varying vec3 vN; varying vec3 vV; varying vec3 vObj; varying vec3 vWorld; varying vec2 vUv;
  float h3(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
    return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
  float ss(float a, float b, float x){ return a < b ? smoothstep(a, b, x) : 1. - smoothstep(b, a, x); }
  void main(){
    vec3 N = normalize(vN), V = normalize(vV);
    float facing = clamp(dot(N, V), 0., 1.);
    float grain = n3(vObj*38.) * .6 + n3(vObj*90.) * .4;
    float speck = uSpeck * ss(.62, .78, n3(vObj*9. + 3.) * .7 + n3(vObj*24.) * .3);

    // ---- تحت الضوء ----
    float core = pow(facing, .75);
    float lamp = ss(.4, -1.3, vWorld.y);
    vec3 glow = mix(uRim, uCore, core) * (.32 + .95 * pow(facing, .55) + .45 * lamp) * uFlick;
    vec3 tex = texture(uMap, vUv).rgb;
    vec3 back = texture(uMap, vec2(vUv.x + .5, vUv.y), 2.5).rgb;
    vec3 inside = glow * tex * mix(vec3(1.), back, .35);

    float h = vObj.y + vObj.x * uTilt;
    float airY = 1. - uAir * 2.;
    // الجنين (يتحرك ويه نبض القلب)
    vec2 ep = uEmbPos + vec2(sin(uTime*.6)*.004, sin(uTime*.9)*.003) * step(.0001, uEmb);
    vec2 dd = vec2(abs(fract(vUv.x - ep.x + .5) - .5) * 1.9, vUv.y - ep.y);
    float hb = pow(.5 + .5 * sin(uTime * uBeat * 3.14159), 8.);
    float dEmb = length(dd * vec2(1., 1.25));
    float emb = ss(uEmb, uEmb * .3, dEmb) * step(.0001, uEmb);
    inside *= 1. - emb * vec3(.72, .86, .9);
    float heart = ss(uEmb * .32, 0., length(dd - vec2(-uEmb * .2, -uEmb * .15))) * step(.0001, uEmb);
    inside = mix(inside, inside + vec3(.55, .05, .0) * glow, heart * (.35 + .65 * hb) * (1. - uMass));
    float eye = ss(uEmb * .26, uEmb * .12, length(dd - vec2(uEmb * .38, uEmb * .28)));
    inside *= 1. - eye * uEye * .9;

    float m = uMass * (.82 + .18 * ss(airY, -1., vObj.y)) * ss(airY + .02, airY - .3, h);
    inside *= 1. - m * .94;
    inside *= .93 + .1 * grain;

    vec3 airc = glow * vec3(1.12, 1.06, .92) * (.95 + .08 * grain);
    float pipB = uPip * ss(.16, .05, length(vec2(vObj.x - .12, (h - airY) * 1.7 - .05)));
    airc *= 1. - pipB * .8;
    float air = ss(airY - .012, airY + .012, h);
    vec3 cand = mix(inside, airc, air);
    cand *= 1. - .6 * exp(-pow((h - airY) * 70., 2.));
    cand *= 1. - speck * .55;

    // ---- بدون ضوء ----
    vec3 L = normalize(vec3(-.45, .65, .65));
    float dif = max(dot(N, L), 0.);
    float spec = pow(max(dot(reflect(-L, N), V), 0.), 28.) * .18;
    vec3 shell = uShell * (.92 + .1 * grain);
    shell = mix(shell, shell * vec3(.38, .3, .24), speck);
    vec3 lit = shell * (.2 + .9 * dif) + spec + uRim * .05 * (1. - facing);

    gl_FragColor = vec4(mix(lit, cand, uCandle), 1.);
  }`;

const GLOWS = {
  brown: { core: [1.0, 0.6, 0.22], rim: [0.42, 0.05, 0.01] },
  cream: { core: [1.0, 0.74, 0.36], rim: [0.55, 0.1, 0.02] },
  white: { core: [1.0, 0.86, 0.55], rim: [0.66, 0.2, 0.04] },
};

function eggGeometry(long) {
  const pts = [];
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const t = Math.PI - (i / N) * Math.PI; // من الطرف المدبب (تحت) إلى العريض (فوق)
    const y = Math.cos(t);
    const r = Math.sin(t) * 0.74 * (1 + 0.12 * y);
    pts.push(new THREE.Vector2(Math.max(r, 0.0001), y * long));
  }
  const g = new THREE.LatheGeometry(pts, 96);
  g.computeVertexNormals();
  return g;
}

export class CandleEgg {
  constructor(host, { seed = 7, interactive = true } = {}) {
    this.host = host;
    this.seed = seed;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    Object.assign(this.renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    host.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
    this.camera.position.set(0, 0.15, 7.4);
    this.camera.lookAt(0, 0, 0);

    this.canvas = document.createElement('canvas');
    this.canvas.width = W; this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.wrapS = THREE.RepeatWrapping;
    this.tex.anisotropy = 4;
    this.tree = buildTree(seed);

    this.u = {
      uMap: { value: this.tex }, uCandle: { value: 1 }, uAir: { value: 0.1 }, uTilt: { value: 0 }, uMass: { value: 0 },
      uTime: { value: 0 }, uEmb: { value: 0 }, uEye: { value: 0 }, uPip: { value: 0 }, uBeat: { value: 0 },
      uSpeck: { value: 0 }, uFlick: { value: 1 }, uLong: { value: 1 },
      uShell: { value: new THREE.Color('#d9b48a') }, uCore: { value: new THREE.Vector3(...GLOWS.brown.core) },
      uRim: { value: new THREE.Vector3(...GLOWS.brown.rim) }, uEmbPos: { value: new THREE.Vector2(EMB.u, EMB.v) },
    };
    this.mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: vert, fragmentShader: frag });
    this.group = new THREE.Group();
    this.group.rotation.set(0.12, -0.5, 0.06);
    this.scene.add(this.group);
    this.target = null; this.cur = null; this.candleTarget = 1;
    this.vel = { x: 0, y: 0.0025 };
    this.setSpecies('chicken');

    if (interactive) this.bindDrag();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.visible = true;
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    this.io.observe(host);
    this.clock = new THREE.Clock();
    const loop = () => { this.raf = requestAnimationFrame(loop); if (this.visible && !document.hidden) this.frame(); };
    loop();
  }

  setSpecies(key) {
    const S = SPECIES[key] || SPECIES.chicken;
    if (this.species === key) return;
    this.species = key;
    const long = 1.0 * S.long;
    if (this.mesh) { this.group.remove(this.mesh); this.mesh.geometry.dispose(); }
    this.mesh = new THREE.Mesh(eggGeometry(long), this.mat);
    const s = Math.min(1.12, Math.max(0.8, 0.94 + 0.2 * Math.log(S.size)));
    this.mesh.scale.setScalar(s);
    this.group.add(this.mesh);
    this.u.uLong.value = long;
    this.u.uShell.value.set(S.shell);
    const g = GLOWS[S.glow] || GLOWS.cream;
    this.u.uCore.value.set(...g.core); this.u.uRim.value.set(...g.rim);
    this.u.uSpeck.value = S.speck || 0;
  }

  setDay(day, total, instant = false) {
    this.target = visual(chickenDay(day, total));
    if (!this.cur || instant) { this.cur = { ...this.target }; this.repaint(); }
  }

  setCandle(on) { this.candleTarget = on ? 1 : 0; }

  repaint() {
    paint(this.ctx, this.tree, this.cur, this.seed);
    this.tex.needsUpdate = true;
  }

  bindDrag() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'pan-y';
    let last = null;
    el.addEventListener('pointerdown', (e) => { last = { x: e.clientX, y: e.clientY, t: performance.now() }; el.setPointerCapture(e.pointerId); this.dragging = true; });
    el.addEventListener('pointermove', (e) => {
      if (!last) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      this.group.rotation.y += dx * 0.012;
      this.group.rotation.x = Math.max(-0.7, Math.min(0.7, this.group.rotation.x + dy * 0.006));
      this.vel.y = dx * 0.012; this.vel.x = dy * 0.006;
      last = { x: e.clientX, y: e.clientY };
    });
    const end = () => { last = null; this.dragging = false; };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }

  resize() {
    const r = this.host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.renderer.setSize(r.width, r.height, false);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
  }

  frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = (this.u.uTime.value += dt);
    if (this.target && this.cur) {
      let moved = false;
      for (const k in this.target) {
        const d = this.target[k] - this.cur[k];
        if (Math.abs(d) > 0.0005) { this.cur[k] += d * Math.min(1, dt * 4); moved = true; }
        else this.cur[k] = this.target[k];
      }
      if (moved) this.repaint();
      const c = this.cur;
      this.u.uAir.value = c.air; this.u.uTilt.value = c.tilt; this.u.uMass.value = c.mass;
      this.u.uEmb.value = c.emb; this.u.uEye.value = c.eye; this.u.uPip.value = c.pip; this.u.uBeat.value = c.beat;
    }
    this.u.uCandle.value += (this.candleTarget - this.u.uCandle.value) * Math.min(1, dt * 5);
    this.u.uFlick.value = 0.97 + 0.03 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
    if (!this.dragging) {
      this.vel.y += (0.0028 - this.vel.y) * 0.02;
      this.vel.x *= 0.92;
      this.group.rotation.y += this.vel.y;
      this.group.rotation.x += this.vel.x + (0.12 - this.group.rotation.x) * 0.01;
    }
    this.group.position.y = Math.sin(t * 0.8) * 0.03;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect(); this.io.disconnect();
    this.mesh.geometry.dispose(); this.mat.dispose(); this.tex.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
