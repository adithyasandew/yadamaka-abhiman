/* ══════════════════════════════════════
   FIRE PARTICLE SYSTEM
══════════════════════════════════════ */
(function () {
    const cv = document.getElementById('c'), cx = cv.getContext('2d');
    let W, H;
    const resize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    function noise(t) { return Math.sin(t * .7) * .5 + Math.sin(t * 1.3 + 1.2) * .3 + Math.sin(t * 2.9 + 2.4) * .15 + Math.sin(t * .2 + .8) * .05; }
    let time = 0;
    class Spark {
        constructor(boot) { this.init(boot); }
        init(boot) {
            this.x = Math.random() * W; this.y = H + 2 + Math.random() * 8;
            const sp = Math.random() * 4.5 + 1.8, ag = -Math.PI / 2 + (Math.random() - .5) * .8;
            this.vx = Math.cos(ag) * sp; this.vy = Math.sin(ag) * sp;
            this.mass = Math.random() * .6 + .2; this.drag = .988 + this.mass * .006;
            this.buoyancy = (1 - this.mass) * .04; this.life = 0;
            this.maxLife = Math.random() * 180 + 90;
            this.size = Math.random() < .78 ? Math.random() * .8 + .3 : Math.random() * 1.2 + .8;
            this.isStreak = Math.random() < .45;
            this.prevX = this.x; this.prevY = this.y;
            this.fp = Math.random() * Math.PI * 2; this.fs = Math.random() * .18 + .08;
            if (boot) { const sk = Math.floor(Math.random() * this.maxLife * .8); for (let i = 0; i < sk; i++) this._step(0); }
        }
        _step(t) {
            this.prevX = this.x; this.prevY = this.y;
            const w = noise(t * .01 + this.x * .002) * 1.8;
            this.vx += w * (1 - this.mass) * .08; this.vx *= this.drag; this.vy *= this.drag;
            this.vy -= this.buoyancy * (1 - this.life);
            this.x += this.vx; this.y += this.vy; this.fp += this.fs; this.life += 1 / this.maxLife;
        }
        update() { this._step(time); }
        colour() {
            const t = this.life; let r, g, b;
            if (t < .15) { const p = t / .15; r = 255; g = Math.round(220 - p * 140); b = Math.round(120 - p * 120); }
            else if (t < .40) { const p = (t - .15) / .25; r = 255; g = Math.round(80 - p * 55); b = 0; }
            else if (t < .70) { const p = (t - .40) / .30; r = Math.round(255 - p * 40); g = Math.round(25 - p * 20); b = 0; }
            else { const p = (t - .70) / .30; r = Math.round(215 - p * 170); g = 0; b = 0; }
            return [r, g, b];
        }
        draw() {
            if (this.life >= 1) return;
            const [r, g, b] = this.colour();
            const fade = this.life > .70 ? 1 - (this.life - .70) / .30 : 1;
            const flicker = .78 + .22 * Math.sin(this.fp);
            const alpha = Math.min(1, fade * flicker * (.6 + (1 - this.life) * .4));
            cx.save(); cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = alpha;
            if (this.isStreak) {
                const dx = this.x - this.prevX, dy = this.y - this.prevY, sl = Math.max(Math.sqrt(dx * dx + dy * dy) * 4, 5);
                const ag = Math.atan2(dy, dx), co = Math.cos(ag), si = Math.sin(ag);
                const x1 = this.x - co * sl * .75, y1 = this.y - si * sl * .75, x2 = this.x + co * sl * .25, y2 = this.y + si * sl * .25;
                cx.lineCap = 'round'; cx.lineWidth = .85;
                const sg = cx.createLinearGradient(x1, y1, x2, y2);
                sg.addColorStop(0, `rgba(${r},${g},${b},0)`); sg.addColorStop(.25, `rgba(${r},${g},${b},.9)`);
                sg.addColorStop(.75, `rgba(${r},${g},${b},.9)`); sg.addColorStop(1, `rgba(${r},${g},${b},0)`);
                cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.strokeStyle = sg; cx.stroke();
            } else {
                cx.beginPath(); cx.arc(this.x, this.y, Math.max(this.size * .5, .5), 0, Math.PI * 2);
                cx.fillStyle = `rgba(${r},${g},${b},1)`; cx.fill();
            }
            cx.restore();
        }
        dead() { return this.life >= 1; }
    }
    class HeatZone {
        constructor() { this.reset(); }
        reset() { this.x = W * .15 + Math.random() * W * .7; this.y = H; this.vy = -(Math.random() * .5 + .15); this.r = Math.random() * 120 + 60; this.alpha = Math.random() * .09 + .03; this.decay = .0004 + Math.random() * .0003; this.vx = (Math.random() - .5) * .3; }
        update(t) { const w = noise(t * .008 + this.x * .003) * .6; this.vx += w * .03; this.vx *= .97; this.x += this.vx; this.y += this.vy; this.alpha -= this.decay; }
        draw() { if (this.alpha <= 0) return; const g = cx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r); g.addColorStop(0, `rgba(200,20,0,${this.alpha})`); g.addColorStop(.5, `rgba(140,8,0,${this.alpha * .4})`); g.addColorStop(1, 'transparent'); cx.save(); cx.globalCompositeOperation = 'screen'; cx.beginPath(); cx.arc(this.x, this.y, this.r, 0, Math.PI * 2); cx.fillStyle = g; cx.fill(); cx.restore(); }
        dead() { return this.alpha <= 0 || this.y + this.r < 0; }
    }
    class Mote {
        constructor() { this.reset(true); }
        reset(ini) { this.x = Math.random() * W; this.y = ini ? Math.random() * H : H + 5; this.r = Math.random() * .55 + .2; this.vy = -(Math.random() * .35 + .05); this.vx = (Math.random() - .5) * .15; this.alpha = Math.random() * .55 + .15; this.decay = Math.random() * .0012 + .0003; const ro = Math.random(); if (ro < .70) { this.r2 = 180; this.g2 = 0; this.b2 = 0; } else if (ro < .90) { this.r2 = 220; this.g2 = 30; this.b2 = 0; } else { this.r2 = 255; this.g2 = 90; this.b2 = 0; } this.t = Math.random() * Math.PI * 2; this.tS = Math.random() * .008 + .002; }
        update() { this.t += this.tS; this.vx += Math.sin(this.t) * .018; this.vx *= .98; this.x += this.vx; this.y += this.vy; this.alpha -= this.decay; }
        draw() { if (this.alpha <= 0) return; cx.save(); cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = Math.max(0, this.alpha); cx.beginPath(); cx.arc(this.x, this.y, this.r, 0, Math.PI * 2); cx.fillStyle = `rgb(${this.r2},${this.g2},${this.b2})`; cx.fill(); cx.restore(); }
        dead() { return this.alpha <= 0 || this.y < -4; }
    }

    /* Reduce particle count on mobile for performance */
    const isMobile = window.innerWidth < 600;
    const sparkCount = isMobile ? 250 : 600;
    const heatCount = isMobile ? 4 : 6;
    const moteCount = isMobile ? 120 : 300;
    const maxSparks = isMobile ? 320 : 700;
    const maxMotes = isMobile ? 180 : 400;
    const spawnRate = isMobile ? 9 : 18;

    const sparks = Array.from({ length: sparkCount }, () => new Spark(true));
    const heat = Array.from({ length: heatCount }, () => new HeatZone());
    const motes = Array.from({ length: moteCount }, () => new Mote());
    let spawnAcc = 0;
    function spawnBatch(dt) { spawnAcc += dt * spawnRate; while (spawnAcc >= 1 && sparks.length < maxSparks) { sparks.push(new Spark(false)); spawnAcc--; } if (Math.random() < .012 && heat.length < 10) heat.push(new HeatZone()); if (Math.random() < .35 && motes.length < maxMotes) motes.push(new Mote()); }
    function drawGlow() { const g = cx.createLinearGradient(0, H, 0, H - H * .35); g.addColorStop(0, 'rgba(180,15,0,.18)'); g.addColorStop(.4, 'rgba(120,8,0,.07)'); g.addColorStop(1, 'transparent'); cx.save(); cx.globalCompositeOperation = 'screen'; cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore(); }
    let last = 0;
    function frame(ts) { const dt = Math.min((ts - last) / 16.67, 3); last = ts; time += dt; cx.fillStyle = 'rgba(0,0,0,.92)'; cx.fillRect(0, 0, W, H); drawGlow(); spawnBatch(dt); for (let i = heat.length - 1; i >= 0; i--) { heat[i].update(time); heat[i].draw(); if (heat[i].dead()) heat.splice(i, 1); } for (let i = motes.length - 1; i >= 0; i--) { motes[i].update(); motes[i].draw(); if (motes[i].dead()) motes.splice(i, 1); } for (let i = sparks.length - 1; i >= 0; i--) { sparks[i].update(); sparks[i].draw(); if (sparks[i].dead()) sparks[i].init(false); } requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
})();


/* ══════════════════════════════════════════════════════
   DECODE SEQUENCE
══════════════════════════════════════════════════════ */
(function () {
    const HACK = [
        '▓', '▒', '░', '█', '▄', '▀', '▌', '▐',
        '¥', '§', 'µ', '±', '×', '÷', '∞', '∑', '√', '∂', '∆', '∏',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F',
        '$', '#', '@', '!', '?', '&', '*', '<', '>', '^', '~', '|',
        'Ω', 'Σ', 'Λ', 'Ξ', 'Ψ', 'Φ', 'Γ', 'Δ',
        'ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク'
    ];
    const rh = () => HACK[Math.floor(Math.random() * HACK.length)];

    function buildMorse(cell) {
        const ml = cell.querySelector('.morse-layer');
        ml.innerHTML = '';
        ml.style.opacity = '1';
        const groups = cell.dataset.morse.trim().split(' ');
        groups.forEach((g, gi) => {
            if (gi > 0) { const sp = document.createElement('span'); sp.className = 'md-gap'; ml.appendChild(sp); }
            [...g].forEach(ch => {
                const s = document.createElement('span');
                s.className = 'md-sym ' + (ch === '-' ? 'dash' : 'dot');
                s.textContent = ch === '-' ? '—' : '•';
                s.style.opacity = '1';
                s.style.color = '#ff5500';
                s.style.textShadow = '0 0 8px rgba(255,90,0,1),0 0 18px rgba(255,50,0,.8)';
                ml.appendChild(s);
            });
        });
    }

    function symPulse(syms, n, cb) {
        let p = 0;
        const iv = setInterval(() => {
            const on = p % 2 === 0;
            syms.forEach(s => {
                s.style.color = on ? '#ffffff' : '#ff2200';
                s.style.textShadow = on ? '0 0 18px #fff,0 0 34px rgba(255,160,0,.9)' : '0 0 4px rgba(255,20,0,.6)';
                s.style.opacity = on ? '1' : '.2';
            });
            if (++p >= n * 2) { clearInterval(iv); syms.forEach(s => { s.style.color = '#ff5500'; s.style.opacity = '1'; s.style.textShadow = '0 0 8px rgba(255,90,0,1)'; }); setTimeout(cb, 60); }
        }, 90);
    }

    function symMorph(syms, cb) {
        let i = 0;
        (function next() {
            if (i >= syms.length) { setTimeout(cb, 50); return; }
            const s = syms[i]; let t = 0;
            const iv = setInterval(() => {
                s.textContent = rh();
                const c = ['#ff6600', '#ff2200', '#ffaa00', '#00ff41', '#ff00ff', '#00ffff'][t % 6];
                s.style.color = c; s.style.textShadow = `0 0 18px ${c},0 0 34px ${c}`;
                if (++t >= 7) { clearInterval(iv); i++; setTimeout(next, 30); }
            }, 50);
        })();
    }

    let gapCompressed = false;

    function reveal(cell, cb) {
        const ml = cell.querySelector('.morse-layer');
        const sl = cell.querySelector('.scramble-layer');
        const lt = cell.querySelector('.ltr');
        // Compress gap the moment the FIRST letter enters the scramble phase
        if (!gapCompressed) {
            gapCompressed = true;
            document.getElementById('titleWrap').classList.add('revealed');
        }
        ml.style.transition = 'opacity 0.2s';
        ml.style.opacity = '0';
        sl.style.opacity = '1';
        let t = 0;
        const iv = setInterval(() => {
            sl.textContent = rh();
            const c = ['#ff6600', '#ff2200', '#ffaa00', '#00ff41', '#ff00ff'][t % 5];
            sl.style.color = c; sl.style.textShadow = `0 0 16px ${c}`;
            if (++t >= 16) {
                clearInterval(iv);
                sl.style.opacity = '0';
                setTimeout(() => {
                    lt.style.opacity = '1';
                    if (cb) cb();
                }, 320);
            }
        }, 45);
    }

    function decode(cell, delay, done) {
        setTimeout(() => {
            const syms = [...cell.querySelector('.morse-layer').querySelectorAll('.md-sym')];
            symPulse(syms, 3, () => symMorph(syms, () => reveal(cell, done)));
        }, delay);
    }

    function reset(cells) {
        gapCompressed = false;
        cells.forEach(cell => {
            cell.querySelector('.ltr').style.opacity = '0';
            cell.querySelector('.scramble-layer').style.opacity = '0';
            cell.querySelector('.scramble-layer').textContent = '';
            buildMorse(cell);
        });
        const tagline = document.getElementById('tagline');
        const year = document.getElementById('taglineYear');
        const cursor = document.getElementById('crtCursor');
        tagline.className = 'tagline';
        tagline.style.visibility = 'hidden';
        year.textContent = '';
        cursor.classList.remove('blink');
        cursor.style.opacity = '0';
        document.getElementById('titleWrap').classList.remove('revealed');
    }

    /* ── CRT OLD-COMPUTER TYPEWRITER for prefix + "2026" ── */
    function bootCRT(onComplete) {
        const tagline = document.getElementById('tagline');
        const yearSpan = document.getElementById('taglineYear');
        const cursor = document.getElementById('crtCursor');
        const scanline = document.getElementById('crtScanline');

        const yearText = '2026';
        const staticChars = '▓▒░█▄▀01#@';

        // scanline sweep
        tagline.classList.add('crt-typing');
        scanline.classList.remove('sweep');
        void scanline.offsetWidth;
        scanline.style.opacity = '0.9';
        scanline.classList.add('sweep');

        cursor.classList.add('blink');

        // helper: type a string into a span with glitch, then call done()
        function typeInto(span, text, delayBase, glitchChance, onDone) {
            let i = 0;
            function next() {
                if (i >= text.length) { onDone(); return; }
                const glitch = Math.random() < glitchChance;
                if (glitch) {
                    const wrong = staticChars[Math.floor(Math.random() * staticChars.length)];
                    span.textContent = text.slice(0, i) + wrong;
                    setTimeout(() => {
                        span.textContent = text.slice(0, i + 1);
                        i++;
                        setTimeout(next, delayBase + Math.random() * 50);
                    }, 75);
                } else {
                    span.textContent = text.slice(0, i + 1);
                    i++;
                    setTimeout(next, delayBase + Math.random() * 50);
                }
            }
            next();
        }

        setTimeout(() => {
            // type the year digits with dramatic glitch
            typeInto(yearSpan, yearText, 160, 0.35, () => {
                // done — stop cursor, settle into flicker
                setTimeout(() => {
                    cursor.classList.remove('blink');
                    cursor.style.opacity = '0';
                    tagline.classList.remove('crt-typing');
                    tagline.classList.add('crt-done');
                    if (onComplete) onComplete();
                }, 700);
            });
        }, 320);
    }

    function run(cells) {
        reset(cells);
        let done = 0;
        // All cells decode simultaneously (delay = 0)
        cells.forEach((cell) => decode(cell, 0, () => {
            done++;
            if (done === cells.length) {
                setTimeout(() => {
                    bootCRT(() => {
                        // Apply shimmer to all revealed letters — no loop
                        cells.forEach(c => {
                            const ltr = c.querySelector('.ltr');
                            if (ltr) ltr.classList.add('ltr-shimmer');
                        });
                    });
                }, 500);
            }
        }));
    }

    const cells = [...document.querySelectorAll('.lc')];
    cells.forEach(buildMorse);
    setTimeout(() => run(cells), 800);
})();

/* ════════════════════════════════════
   NAVBAR — one-time scramble → reveal + burger
════════════════════════════════════ */
(function () {
    const HACK = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
        '#', '@', '$', '%', '!', '?', '&', '*', '+', '=',
        '<', '>', '/', '^', '~', '|', '{', '}'
    ];
    const rh = () => HACK[Math.floor(Math.random() * HACK.length)];

    document.querySelectorAll('.nav-reveal').forEach((el, idx) => {
        const target = el.dataset.text || '';
        const chars = [...target]; // unicode-safe split

        // Phase 1 — fill with random chars (same count as target)
        el.style.fontFamily = "'Share Tech Mono', monospace";
        el.style.letterSpacing = '0.08em';
        el.textContent = chars.map(rh).join('');

        // Phase 2 — scramble rapidly, then reveal final text
        const SCRAMBLE_DURATION = 900;  // ms of scramble
        const INTERVAL = 60;
        const start = performance.now();
        const delay = 200 + idx * 140;

        setTimeout(() => {
            const iv = setInterval(() => {
                const elapsed = performance.now() - start;
                if (elapsed >= SCRAMBLE_DURATION) {
                    clearInterval(iv);
                    // Reveal: switch to Madu font with actual text
                    el.style.fontFamily = "Madu, serif";
                    el.style.letterSpacing = '0.04em';
                    el.textContent = target;
                    el.classList.add('nav-revealed');
                } else {
                    el.textContent = chars.map(rh).join('');
                }
            }, INTERVAL);
        }, delay);
    });

    // Burger toggle
    const burger = document.getElementById('navBurger');
    const links = document.getElementById('navLinks');
    if (burger && links) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('open');
            links.classList.toggle('open');
        });
        links.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                burger.classList.remove('open');
                links.classList.remove('open');
            });
        });
    }
})();
