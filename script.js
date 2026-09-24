/* =========================================================
   Robin Thomas — UI & interaction layer (vanilla, no deps)
   The Three.js scene lives in scene.js (ES module).
   ========================================================= */
(() => {
    'use strict';

    const root = document.documentElement;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const supportsViewTimeline = CSS.supports('animation-timeline: view()');
    const supportsScrollTimeline = CSS.supports('animation-timeline: scroll()');
    const lerp = (a, b, t) => a + (b - a) * t;

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- Stagger indices for grouped reveals ---------- */
    const staggerGroups = [
        ['.bento', 2],
        ['.matrix', 2],
        ['.apps-grid', 3],
        ['.timeline', 1],
    ];
    staggerGroups.forEach(([sel, cols]) => {
        const group = document.querySelector(sel);
        if (!group) return;
        [...group.children].forEach((child, i) => child.style.setProperty('--i', cols > 1 ? i % cols : 0));
    });

    /* ---------- Reveal fallback (IntersectionObserver) ---------- */
    if (!supportsViewTimeline && !reduceMotion.matches && 'IntersectionObserver' in window) {
        root.classList.add('io');
        const revealIO = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                revealIO.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
        document.querySelectorAll('.reveal, .reveal-title').forEach((el) => revealIO.observe(el));
    }

    /* ---------- Rolling role ("Your next ___") ---------- */
    const roleRoll = document.getElementById('roleRoll');
    if (roleRoll) {
        const HOLD = 2800;
        const windowEl = roleRoll.querySelector('.role-window');
        const track = roleRoll.querySelector('.role-track');
        const fill = roleRoll.querySelector('.role-meter-fill');
        // Clone the first role onto the end so the roll wraps forward instead of rewinding
        track.append(track.firstElementChild.cloneNode(true));
        const words = [...track.children];
        let index = 0;
        let meter = null;
        let paused = false;

        roleRoll.classList.add('is-live');

        const place = () => {
            const word = words[index];
            const text = word.firstElementChild.getBoundingClientRect();
            roleRoll.style.setProperty('--role-y', `${-word.offsetTop}px`);
            roleRoll.style.setProperty('--role-h', `${word.offsetHeight}px`);
            roleRoll.style.setProperty('--role-w', `${Math.ceil(text.width)}px`);
            words.forEach((w, i) => w.classList.toggle('is-current', i === index));
        };

        const placeInstantly = () => {
            track.classList.add('no-anim');
            windowEl.classList.add('no-anim');
            place();
            void track.offsetHeight;
            track.classList.remove('no-anim');
            windowEl.classList.remove('no-anim');
        };

        const run = () => {
            meter?.cancel();
            // The meter doubles as the clock: when it fills, the next role rolls in
            meter = fill.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
                duration: HOLD,
                easing: 'linear',
                fill: 'forwards',
            });
            if (paused) meter.pause();
            meter.onfinish = advance;
        };

        const advance = () => {
            index += 1;
            place();
            if (index === words.length - 1) {
                // Landed on the clone: once the roll settles, snap back to the real first role
                setTimeout(() => {
                    index = 0;
                    placeInstantly();
                }, reduceMotion.matches ? 0 : 750);
            }
            run();
        };

        const setPaused = (value) => {
            paused = value;
            if (!meter) return;
            if (paused) meter.pause();
            else meter.play();
        };

        place();
        run();

        // Roll only while the hero is on screen and the tab is visible; hold while hovered
        let heroVisible = true;
        const sync = () => setPaused(!heroVisible || document.hidden || roleRoll.matches(':hover'));
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                heroVisible = entry.isIntersecting;
                sync();
            }).observe(roleRoll);
        }
        document.addEventListener('visibilitychange', sync);
        roleRoll.addEventListener('pointerenter', sync);
        roleRoll.addEventListener('pointerleave', sync);
        window.addEventListener('resize', placeInstantly);
        document.fonts?.ready.then(placeInstantly);
    }

    /* ---------- Mobile menu ---------- */
    const menuBtn = document.querySelector('.menu-btn');
    const nav = document.getElementById('primary-nav');
    const setMenu = (open) => {
        if (!menuBtn || !nav) return;
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.querySelector('.menu-btn-label').textContent = open ? 'Close' : 'Menu';
        nav.classList.toggle('is-open', open);
        document.body.classList.toggle('nav-open', open);
        if (open) nav.querySelector('a')?.focus({ preventScroll: true });
    };
    menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    nav?.addEventListener('click', (e) => {
        if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuBtn?.getAttribute('aria-expanded') === 'true') {
            setMenu(false);
            menuBtn.focus();
        }
    });
    matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
        if (e.matches) setMenu(false);
    });

    /* ---------- Active nav link ---------- */
    const navLinks = new Map(
        [...document.querySelectorAll('.nav-pill')].map((a) => [a.getAttribute('href').slice(1), a])
    );
    if ('IntersectionObserver' in window) {
        const navIO = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                navLinks.forEach((a, id) => {
                    const on = id === entry.target.id;
                    a.classList.toggle('is-active', on);
                    if (on) a.setAttribute('aria-current', 'true');
                    else a.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        document.querySelectorAll('main section[id]').forEach((s) => navIO.observe(s));
    }

    /* ---------- Scroll-linked vars (one rAF per scroll frame) ---------- */
    const hero = document.querySelector('.hero');
    const progress = document.querySelector('.progress');
    let scrollQueued = false;

    const onScrollFrame = () => {
        scrollQueued = false;
        const y = window.scrollY;
        if (hero && !reduceMotion.matches && y < window.innerHeight * 1.3) {
            hero.style.setProperty('--sy', y.toFixed(1));
        }
        if (progress && !supportsScrollTimeline) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
        }
    };
    window.addEventListener('scroll', () => {
        if (scrollQueued) return;
        scrollQueued = true;
        requestAnimationFrame(onScrollFrame);
    }, { passive: true });
    onScrollFrame();

    /* ---------- Count-up on the spec sheet ---------- */
    const counts = document.querySelectorAll('.count[data-count]');
    if (counts.length && !reduceMotion.matches && 'IntersectionObserver' in window) {
        const countIO = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                countIO.unobserve(entry.target);
                const el = entry.target;
                const end = Number(el.dataset.count);
                const decimals = Number(el.dataset.decimals || 0);
                const start = performance.now();
                const dur = 1400;
                const step = (now) => {
                    const t = Math.min((now - start) / dur, 1);
                    const v = end * (1 - Math.pow(1 - t, 4));
                    el.textContent = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-AU');
                    if (t < 1) requestAnimationFrame(step);
                };
                el.textContent = (0).toFixed(decimals);
                requestAnimationFrame(step);
            });
        }, { threshold: 0.6 });
        counts.forEach((el) => countIO.observe(el));
    }

    /* ---------- Skill matrix filter ---------- */
    const matrix = document.querySelector('.matrix');
    const filterBtns = matrix ? document.querySelectorAll('.filter-btn[data-filter]') : [];
    filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.filter;
            filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
            matrix.dataset.active = key;
            matrix.querySelectorAll('.matrix-group').forEach((g) => {
                g.classList.toggle('is-focus', g.dataset.group === key);
            });
            if (key !== 'all') {
                const focus = matrix.querySelector(`[data-group="${key}"]`);
                const r = focus.getBoundingClientRect();
                if (r.top < 0 || r.bottom > window.innerHeight) {
                    focus.scrollIntoView({ block: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
                }
            }
        });
    });

    /* ---------- Apps directory filter (apps/index.html) ---------- */
    const appFilterBtns = document.querySelectorAll('[data-app-filter]');
    if (appFilterBtns.length) {
        const cards = [...document.querySelectorAll('.app-card[data-cat]')];
        const countEl = document.getElementById('apps-count');
        appFilterBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.appFilter;
                appFilterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
                let shown = 0;
                cards.forEach((card) => {
                    const match = key === 'all' || card.dataset.cat === key;
                    card.hidden = !match;
                    if (match) {
                        card.classList.add('is-in');
                        shown += 1;
                    }
                });
                if (countEl) countEl.textContent = `${shown} ${shown === 1 ? 'app' : 'apps'}`;
            });
        });
    }

    /* ---------- Contact cards (from contact-config.js) ---------- */
    const contactList = document.getElementById('contact-info-container');
    const contacts = typeof CONTACT_CONFIG !== 'undefined' ? CONTACT_CONFIG.contacts : [];

    if (contactList && contacts.length) {
        contactList.textContent = '';
        contacts.forEach((ct) => {
            const li = document.createElement('li');
            li.className = 'reveal';
            const a = document.createElement('a');
            a.className = 'contact-card';
            a.href = ct.href;
            if (/^https?:/.test(ct.href)) {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }
            a.setAttribute('aria-label', `${ct.label}: ${ct.title}`);

            const icon = document.createElement('i');
            icon.className = `${ct.icon} contact-icon`;
            icon.setAttribute('aria-hidden', 'true');
            const title = document.createElement('span');
            title.className = 'contact-title';
            title.textContent = ct.title;
            const value = document.createElement('span');
            value.className = 'contact-value';
            // Only the action is shown; the address/number lives in the href alone
            value.textContent = ct.label;

            a.append(icon, title, value);
            li.append(a);
            contactList.append(li);
        });
        [...contactList.children].forEach((li, i) => li.style.setProperty('--i', i % 2));
        if (root.classList.contains('io') && 'IntersectionObserver' in window) {
            // Fallback reveal for cards created after the observer was set up
            const lateIO = new IntersectionObserver((entries) => entries.forEach((en) => {
                if (en.isIntersecting) { en.target.classList.add('is-in'); lateIO.unobserve(en.target); }
            }), { rootMargin: '0px 0px -12% 0px' });
            contactList.querySelectorAll('.reveal').forEach((el) => lateIO.observe(el));
        }
    }

    /* ---------- Smooth scrolling ----------
       Eases wheel and in-page anchor scrolling with a single rAF lerp on the real
       document scroll, so sticky headers, scroll-driven CSS and the 3D scene all
       stay in sync. Touch, keyboard and scrollbar input stay native. */
    if (!reduceMotion.matches) {
        root.classList.add('has-smooth');
        let target = window.scrollY;
        let current = window.scrollY;
        let raf = 0;
        let lastT = 0;

        const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
        const clamp = (v) => Math.max(0, Math.min(v, maxScroll()));

        const step = (now) => {
            const dt = Math.min((now - lastT) / 1000, 0.05);
            lastT = now;
            current += (target - current) * (1 - Math.exp(-dt * 10));
            if (Math.abs(target - current) < 0.5) current = target;
            window.scrollTo(0, current);
            raf = current === target ? 0 : requestAnimationFrame(step);
        };
        const run = () => {
            if (raf) return;
            current = window.scrollY;
            lastT = performance.now();
            raf = requestAnimationFrame(step);
        };
        const cancel = () => {
            cancelAnimationFrame(raf);
            raf = 0;
            target = current = window.scrollY;
        };

        window.addEventListener('wheel', (e) => {
            if (e.ctrlKey || document.body.classList.contains('nav-open')) return;
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
            e.preventDefault();
            const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
            target = clamp((raf ? target : window.scrollY) + e.deltaY * unit);
            run();
        }, { passive: false });

        // Any native input takes over immediately
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) cancel();
        });
        window.addEventListener('touchstart', cancel, { passive: true });
        window.addEventListener('mousedown', (e) => { if (e.clientX >= document.documentElement.clientWidth) cancel(); });
        window.addEventListener('resize', () => { target = clamp(target); });

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
            const hash = link.getAttribute('href');
            const dest = hash.length > 1 && document.getElementById(hash.slice(1));
            if (!dest) return;
            e.preventDefault();
            const pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
            target = clamp(hash === '#top' ? 0 : dest.getBoundingClientRect().top + window.scrollY - pad);
            run();
            history.pushState(null, '', hash);
            // Move keyboard focus with the view
            if (!dest.hasAttribute('tabindex')) dest.setAttribute('tabindex', '-1');
            dest.focus({ preventScroll: true });
        });
    }

    /* ---------- Hero name lens (hover near the cursor only) ---------- */
    const heroName = document.querySelector('.hero-name');
    // Built for every device; it only reacts to real mouse events, so touch never sees it.
    // With reduced motion the lens still appears (it's a static highlight that follows the
    // user's own pointer) but letters don't lift.
    if (heroName) {
        // Split each line into letters so they can react individually
        heroName.querySelectorAll('.hero-line > span').forEach((line) => {
            const text = line.textContent;
            line.textContent = '';
            [...text].forEach((c) => {
                const ch = document.createElement('span');
                ch.className = 'ch';
                ch.textContent = c;
                line.append(ch);
            });
        });

        const wrap = document.createElement('div');
        wrap.className = 'hero-name-wrap';
        heroName.before(wrap);
        wrap.append(heroName);

        const lens = heroName.cloneNode(true);
        lens.removeAttribute('id');
        lens.removeAttribute('aria-label');
        lens.setAttribute('aria-hidden', 'true');
        lens.classList.add('hero-name--lens');
        // The copy doesn't need the load reveal; it's invisible until hovered
        lens.querySelectorAll('.hero-line > span').forEach((el) => { el.style.animation = 'none'; el.style.translate = '0 0'; });
        wrap.append(lens);

        // Letters may overhang their line once the load reveal is done
        const settle = () => wrap.classList.add('is-settled');
        heroName.querySelector('.hero-line--offset > span')?.addEventListener('animationend', settle, { once: true });
        setTimeout(settle, 2000);

        const baseChars = [...heroName.querySelectorAll('.ch')];
        const lensChars = [...lens.querySelectorAll('.ch')];
        const state = baseChars.map(() => ({ p: 0, t: 0, x: 0, y: 0 }));
        const lensState = { r: 0, tr: 0, x: -999, y: -999 };
        let radius = 160;
        let raf = 0;

        const measure = () => {
            const w = wrap.getBoundingClientRect();
            radius = Math.max(110, Math.min(w.width * 0.14, 190));
            baseChars.forEach((ch, i) => {
                const r = ch.getBoundingClientRect();
                state[i].x = r.left - w.left + r.width / 2;
                state[i].y = r.top - w.top + r.height / 2;
            });
        };

        const frame = () => {
            let active = false;
            lensState.r += (lensState.tr - lensState.r) * (reduceMotion.matches ? 1 : 0.16);
            if (Math.abs(lensState.tr - lensState.r) > 0.5) active = true;
            wrap.style.setProperty('--lr', `${lensState.r.toFixed(1)}px`);
            wrap.style.setProperty('--lx', `${lensState.x.toFixed(1)}px`);
            wrap.style.setProperty('--ly', `${lensState.y.toFixed(1)}px`);

            state.forEach((st, i) => {
                st.p += (st.t - st.p) * 0.14;
                if (Math.abs(st.t - st.p) > 0.002) active = true;
                const v = st.p.toFixed(3);
                baseChars[i].style.setProperty('--p', v);
                lensChars[i].style.setProperty('--p', v);
            });

            if (!active && lensState.tr === 0) wrap.classList.remove('is-lensing');
            raf = active ? requestAnimationFrame(frame) : 0;
        };
        const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

        wrap.addEventListener('pointerenter', (e) => {
            if (e.pointerType !== 'mouse') return;
            measure();
            wrap.classList.add('is-lensing');
            lensState.tr = radius;
        });
        wrap.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return;
            const w = wrap.getBoundingClientRect();
            lensState.x = e.clientX - w.left;
            lensState.y = e.clientY - w.top;
            state.forEach((st) => {
                const d = Math.hypot(st.x - lensState.x, st.y - lensState.y);
                const f = Math.max(0, 1 - d / (radius * 1.1));
                st.t = reduceMotion.matches ? 0 : f * f;
            });
            kick();
        });
        wrap.addEventListener('pointerleave', () => {
            lensState.tr = 0;
            state.forEach((st) => { st.t = 0; });
            kick();
        });
        // Letter positions shift with the scroll parallax and on resize
        window.addEventListener('scroll', () => { if (lensState.tr) measure(); }, { passive: true });
        window.addEventListener('resize', measure);
    }

    /* =====================================================
       Pointer-driven micro-interactions (fine pointers only)
       ===================================================== */
    if (!finePointer.matches) return;

    /* ---------- Dual cursor ---------- */
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    const pointer = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let cursorRaf = 0;

    const cursorLoop = () => {
        const k = reduceMotion.matches ? 1 : 0.18;
        ringPos.x = lerp(ringPos.x, pointer.x, k);
        ringPos.y = lerp(ringPos.y, pointer.y, k);
        ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
        if (Math.abs(ringPos.x - pointer.x) + Math.abs(ringPos.y - pointer.y) > 0.1) {
            cursorRaf = requestAnimationFrame(cursorLoop);
        } else {
            cursorRaf = 0;
        }
    };

    if (dot && ring) {
        const hoverSel = 'a, button, summary, input, label, .chips li, .filter-btn';

        window.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return;
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
            if (!root.classList.contains('has-cursor')) {
                // First real mouse move: snap the ring here instead of sweeping in from a corner
                ringPos.x = pointer.x;
                ringPos.y = pointer.y;
                root.classList.add('has-cursor');
            }
            root.classList.remove('cursor-out');
            if (!cursorRaf) cursorRaf = requestAnimationFrame(cursorLoop);
        }, { passive: true });

        document.addEventListener('pointerover', (e) => {
            root.classList.toggle('cursor-hover', !!e.target.closest?.(hoverSel));
        });
        document.documentElement.addEventListener('pointerleave', () => root.classList.add('cursor-out'));
    }

    /* ---------- Magnetic elements ---------- */
    const magnets = [...document.querySelectorAll('.magnetic')].map((el) => ({
        el,
        strength: el.classList.contains('nav-pill') ? 0.3 : 0.4,
        cur: { x: 0, y: 0 },
        target: { x: 0, y: 0 },
    }));
    let magnetRaf = 0;

    const magnetLoop = () => {
        let moving = false;
        const k = reduceMotion.matches ? 1 : 0.16;
        magnets.forEach((m) => {
            m.cur.x = lerp(m.cur.x, m.target.x, k);
            m.cur.y = lerp(m.cur.y, m.target.y, k);
            if (Math.abs(m.cur.x - m.target.x) + Math.abs(m.cur.y - m.target.y) > 0.05) moving = true;
            const pulled = Math.abs(m.cur.x) + Math.abs(m.cur.y) > 0.05;
            m.el.classList.toggle('is-pulled', pulled);
            m.el.style.transform = pulled ? `translate3d(${m.cur.x.toFixed(2)}px, ${m.cur.y.toFixed(2)}px, 0)` : '';
        });
        magnetRaf = moving ? requestAnimationFrame(magnetLoop) : 0;
    };

    if (!reduceMotion.matches) {
        window.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return;
            magnets.forEach((m) => {
                const r = m.el.getBoundingClientRect();
                // Remove the offset we applied ourselves so the pull doesn't feed back
                const cx = r.left + r.width / 2 - m.cur.x;
                const cy = r.top + r.height / 2 - m.cur.y;
                const dx = e.clientX - cx;
                const dy = e.clientY - cy;
                const reach = Math.max(r.width, r.height) * 0.5 + 36;
                const inside = Math.hypot(dx, dy) < reach;
                m.target.x = inside ? dx * m.strength : 0;
                m.target.y = inside ? dy * m.strength : 0;
            });
            if (!magnetRaf) magnetRaf = requestAnimationFrame(magnetLoop);
        }, { passive: true });
    }

    /* ---------- 3D tilt on project cards ---------- */
    if (!reduceMotion.matches) {
        const MAX_TILT = 9;
        document.querySelectorAll('.app-card').forEach((card) => {
            let raf = 0;
            let last = null;
            card.addEventListener('pointermove', (e) => {
                if (e.pointerType !== 'mouse') return;
                last = e;
                if (raf) return;
                raf = requestAnimationFrame(() => {
                    raf = 0;
                    const r = card.getBoundingClientRect();
                    const px = (last.clientX - r.left) / r.width;
                    const py = (last.clientY - r.top) / r.height;
                    card.classList.add('is-tilting');
                    card.style.setProperty('--ry', `${((px - 0.5) * MAX_TILT * 2).toFixed(2)}deg`);
                    card.style.setProperty('--rx', `${((0.5 - py) * MAX_TILT * 2).toFixed(2)}deg`);
                    card.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
                    card.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
                });
            });
            card.addEventListener('pointerleave', () => {
                cancelAnimationFrame(raf);
                raf = 0;
                card.classList.remove('is-tilting');
                card.style.setProperty('--rx', '0deg');
                card.style.setProperty('--ry', '0deg');
            });
        });
    }
})();
