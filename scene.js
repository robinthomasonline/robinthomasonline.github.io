/* =========================================================
   Background scene: a network topology around a morphing core.
   Nodes + links share one GPU displacement function, so the
   graph breathes as a whole without any per-frame CPU work.
   ========================================================= */
import * as THREE from 'three';

const canvas = document.getElementById('scene');
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

const hasWebGL = () => {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
        return false;
    }
};

if (canvas && hasWebGL()) init();

function init() {
    const mobile = window.innerWidth < 768;
    const CYAN = new THREE.Color('#00f0ff');
    const BONE = new THREE.Color('#e9e9f0');

    /* ---------- Renderer / camera ---------- */
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !mobile && (window.devicePixelRatio || 1) < 1.5,
        alpha: true,
        powerPreference: 'high-performance',
    });
    // 1.5x is visually indistinguishable for thin lines/soft points and ~45% fewer pixels than 2x
    const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 60);
    camera.position.set(0, 0, 8);

    const world = new THREE.Group();
    scene.add(world);

    /* ---------- Shared GLSL ---------- */
    const DISPLACE = /* glsl */ `
        uniform float uTime;
        vec3 displace(vec3 p, float amp) {
            float n = sin(p.x * 1.7 + uTime * 0.7) * cos(p.y * 1.3 - uTime * 0.5)
                    + sin(p.z * 1.9 + uTime * 0.6) * 0.5;
            return p + normalize(p) * n * amp;
        }
    `;
    const uTime = { value: 0 };
    const uPixelRatio = { value: renderer.getPixelRatio() };

    /* ---------- Core: morphing wireframe icosahedron ---------- */
    const coreGeo = new THREE.IcosahedronGeometry(1.35, mobile ? 4 : 7);
    const coreMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime,
            uAmp: { value: 0.28 },
            uColor: { value: CYAN },
            uOpacity: { value: 0.85 },
        },
        vertexShader: /* glsl */ `
            ${DISPLACE}
            uniform float uAmp;
            varying float vLift;
            void main() {
                vec3 p = displace(position, uAmp);
                vLift = length(p) - length(position);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vLift;
            void main() {
                float a = uOpacity * (0.18 + smoothstep(-0.25, 0.35, vLift) * 0.82);
                gl_FragColor = vec4(uColor, a);
            }
        `,
        wireframe: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    world.add(core);

    /* ---------- Constellation: nodes ---------- */
    const NODE_COUNT = mobile ? 150 : 380;
    const LINK_DIST = mobile ? 1.35 : 1.1;
    const MAX_LINKS = 3;
    const NODE_AMP = 0.22;

    const nodePos = new Float32Array(NODE_COUNT * 3);
    const nodeSize = new Float32Array(NODE_COUNT);
    const v = new THREE.Vector3();
    for (let i = 0; i < NODE_COUNT; i++) {
        // Random direction, radius biased toward an inner shell
        v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        const r = 2.1 + Math.pow(Math.random(), 1.6) * 2.8;
        v.multiplyScalar(r);
        nodePos.set([v.x, v.y * 0.85, v.z], i * 3);
        nodeSize[i] = Math.random() < 0.06 ? 2.4 : 0.6 + Math.random() * 1.0;
    }

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(nodeSize, 1));

    const nodeMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime,
            uPixelRatio,
            uColor: { value: BONE },
            uAccent: { value: CYAN },
            uOpacity: { value: 1 },
            uSize: { value: mobile ? 26 : 22 },
        },
        vertexShader: /* glsl */ `
            ${DISPLACE}
            attribute float aSize;
            uniform float uPixelRatio;
            uniform float uSize;
            varying float vAlpha;
            varying float vHub;
            void main() {
                vec3 p = displace(position, ${NODE_AMP.toFixed(2)});
                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                float depth = -mv.z;
                gl_PointSize = uSize * aSize * uPixelRatio / depth;
                gl_Position = projectionMatrix * mv;
                vAlpha = smoothstep(16.0, 4.0, depth) * smoothstep(0.4, 1.8, depth);
                vHub = step(2.0, aSize);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            uniform vec3 uAccent;
            uniform float uOpacity;
            varying float vAlpha;
            varying float vHub;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                float a = pow(smoothstep(0.5, 0.0, d), 1.8);
                vec3 col = mix(uColor, uAccent, vHub);
                gl_FragColor = vec4(col, a * vAlpha * uOpacity);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    world.add(nodes);

    /* ---------- Constellation: links (built once) ---------- */
    const linkPos = [];
    const linkAlpha = [];
    const degree = new Uint8Array(NODE_COUNT);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    for (let i = 0; i < NODE_COUNT; i++) {
        if (degree[i] >= MAX_LINKS) continue;
        a.fromArray(nodePos, i * 3);
        for (let j = i + 1; j < NODE_COUNT && degree[i] < MAX_LINKS; j++) {
            if (degree[j] >= MAX_LINKS) continue;
            b.fromArray(nodePos, j * 3);
            const d = a.distanceTo(b);
            if (d > LINK_DIST) continue;
            linkPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
            const fade = 1 - d / LINK_DIST;
            linkAlpha.push(fade, fade);
            degree[i]++;
            degree[j]++;
        }
    }

    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPos, 3));
    linkGeo.setAttribute('aAlpha', new THREE.Float32BufferAttribute(linkAlpha, 1));

    const linkMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime,
            uColor: { value: CYAN },
            uOpacity: { value: 0.9 },
        },
        vertexShader: /* glsl */ `
            ${DISPLACE}
            attribute float aAlpha;
            varying float vAlpha;
            void main() {
                vec3 p = displace(position, ${NODE_AMP.toFixed(2)});
                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                float depth = -mv.z;
                vAlpha = aAlpha * smoothstep(16.0, 4.0, depth) * smoothstep(0.4, 1.8, depth);
                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vAlpha;
            void main() {
                gl_FragColor = vec4(uColor, vAlpha * uOpacity * 0.55);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const links = new THREE.LineSegments(linkGeo, linkMat);
    world.add(links);

    /* ---------- Input state ---------- */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const scroll = { p: 0, hero: 0, tp: 0, thero: 0, vel: 0 };
    let isDesktop = window.innerWidth >= 1024;
    let isNarrow = window.innerWidth < 768;

    const quiet = root.dataset.scene === 'quiet';
    const readScroll = () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scroll.tp = max > 0 ? Math.min(y / max, 1) : 0;
        // Pages without a full-screen hero (data-scene="quiet") start in the dimmed, centred state
        scroll.thero = quiet ? 1 : Math.min(y / window.innerHeight, 1);
    };
    readScroll();
    scroll.p = scroll.tp;
    scroll.hero = scroll.thero;

    window.addEventListener('pointermove', (e) => {
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    /* ---------- Resize ---------- */
    let resizeQueued = false;
    const onResize = () => {
        resizeQueued = false;
        const w = window.innerWidth;
        const h = window.innerHeight;
        isDesktop = w >= 1024;
        isNarrow = w < 768;
        renderer.setPixelRatio(pixelRatio());
        renderer.setSize(w, h, false);
        uPixelRatio.value = renderer.getPixelRatio();
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        readScroll();
        if (!running) renderFrame(0);
    };
    window.addEventListener('resize', () => {
        if (resizeQueued) return;
        resizeQueued = true;
        requestAnimationFrame(onResize);
    });

    /* ---------- Frame ---------- */
    let t = 0;
    const renderFrame = (dt) => {
        const still = reduceMotion.matches;
        t += still ? 0 : dt;
        uTime.value = t;

        // Soft physics: frame-rate independent lerp
        const kp = still ? 1 : 1 - Math.exp(-dt * 3.2);
        const ks = still ? 1 : 1 - Math.exp(-dt * 5);
        pointer.x += (pointer.tx - pointer.x) * kp;
        pointer.y += (pointer.ty - pointer.y) * kp;

        const prevP = scroll.p;
        scroll.p += (scroll.tp - scroll.p) * ks;
        scroll.hero += (scroll.thero - scroll.hero) * ks;
        const speed = dt > 0 ? Math.abs(scroll.p - prevP) / dt : 0;
        scroll.vel += (Math.min(speed * 6, 0.3) - scroll.vel) * (still ? 1 : 0.08);

        const p = scroll.p;
        const h = scroll.hero;

        // Scroll → camera depth: dive from outside the network into it
        camera.position.z = 8 - p * 5.2;
        camera.position.x = pointer.x * 0.55;
        camera.position.y = -pointer.y * 0.4;
        camera.lookAt(0, 0, 0);

        // Hero composition: object sits right of the name on desktop, above it on phones
        world.position.x = isDesktop ? 2.3 * (1 - h) : 0;
        world.position.y = isNarrow ? 2.1 * (1 - h) : 0;

        // Scroll → rotation
        world.rotation.y = t * 0.045 + p * Math.PI * 1.4 + pointer.x * 0.25;
        world.rotation.x = p * 0.7 + pointer.y * 0.18;
        core.rotation.y = t * 0.14 + p * 3.2;
        core.rotation.z = p * 1.6;

        // Scroll → opacity: loud in the hero, quiet behind reading content
        coreMat.uniforms.uOpacity.value = Math.max(0.85 - h * 0.8, 0.05);
        coreMat.uniforms.uAmp.value = 0.26 + scroll.vel;
        nodeMat.uniforms.uOpacity.value = 1 - h * 0.5;
        linkMat.uniforms.uOpacity.value = 0.95 - h * 0.6;

        renderer.render(scene, camera);
    };

    /* ---------- Loop control ---------- */
    let raf = 0;
    let running = false;
    let last = 0;

    const loop = (now) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        renderFrame(dt);
        raf = requestAnimationFrame(loop);
    };
    const start = () => {
        if (running || reduceMotion.matches || document.hidden) return;
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
    };
    const stop = () => {
        running = false;
        cancelAnimationFrame(raf);
    };

    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    reduceMotion.addEventListener('change', () => {
        if (reduceMotion.matches) {
            stop();
            renderFrame(0);
        } else {
            start();
        }
    });
    // One scroll listener: update targets; when the loop is idle (reduced motion), re-render once
    window.addEventListener('scroll', () => {
        readScroll();
        if (!running) requestAnimationFrame(() => renderFrame(0));
    }, { passive: true });

    /* ---------- Context loss & cleanup ---------- */
    canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        stop();
        canvas.classList.remove('is-ready');
        root.classList.add('no-webgl');
    });

    const dispose = () => {
        stop();
        [coreGeo, nodeGeo, linkGeo].forEach((g) => g.dispose());
        [coreMat, nodeMat, linkMat].forEach((m) => m.dispose());
        renderer.dispose();
    };
    window.addEventListener('pagehide', (e) => {
        if (!e.persisted) dispose();
        else stop();
    });
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) start();
    });

    /* ---------- Go ---------- */
    renderFrame(0);
    canvas.classList.add('is-ready');
    root.classList.remove('no-webgl');
    start();
}
