import "./config.js";

// Web Audio & Sound Controller
window.Sound = (function() {
  let enabled = true;
  try {
    enabled = localStorage.getItem("sound") !== "off";
  } catch {}

  let ctx = null;
  function getCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // Synthesized acoustic sound effects
  function tick() {
    if (!enabled) return;
    try {
      let c = getCtx();
      if (!c) return;
      let osc = c.createOscillator();
      let gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1400, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.035);
      gain.gain.setValueAtTime(0.12, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.04);
    } catch {}
  }

  function paper() {
    if (!enabled) return;
    try {
      let c = getCtx();
      if (!c) return;
      let bufferSize = c.sampleRate * 0.12;
      let buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      let data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      let noise = c.createBufferSource();
      noise.buffer = buffer;
      let filter = c.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1800, c.currentTime);
      filter.Q.setValueAtTime(1.8, c.currentTime);
      let gain = c.createGain();
      gain.gain.setValueAtTime(0.2, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      noise.start();
    } catch {}
  }

  function playTablaBol(voice, level) {
    if (!enabled) return;
    try {
      let c = getCtx();
      if (!c) return;
      let now = c.currentTime;
      if (voice === "ge" || voice === "dha") {
        let osc = c.createOscillator();
        let gain = c.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(115, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);
        gain.gain.setValueAtTime(0.45 * level, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.24);
      }
      if (voice === "na" || voice === "dha") {
        let osc = c.createOscillator();
        let gain = c.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.14);
        gain.gain.setValueAtTime(0.35 * level, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }
      if (voice === "ti") {
        let osc = c.createOscillator();
        let gain = c.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.2 * level, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      }
    } catch {}
  }

  let rhythm = [
    [0, "dha", 1], [2, "ge", 0.5], [3, "na", 0.8], [5, "ge", 0.5],
    [6, "dha", 0.95], [8, "ge", 0.5], [9, "na", 0.8], [10, "ti", 0.7],
    [11, "ge", 0.5], [12, "dha", 1], [14, "ge", 0.5], [15, "na", 0.8],
    [17, "ge", 0.5], [18, "dha", 0.95], [20, "na", 0.7], [21, "na", 0.85],
    [22, "ti", 0.7], [23, "na", 0.75], [24, "dha", 1.1]
  ];

  return {
    init: getCtx,
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem("sound", enabled ? "on" : "off"); } catch {}
      return enabled;
    },
    tick,
    paper,
    playTablaBol,
    groove() {
      return rhythm.map(([step, voice, level]) => ({
        at: step * 0.1695,
        voice,
        level,
        accent: voice === "dha"
      }));
    }
  };
})();

// Soundtrack Controller
(function() {
  let audio = document.createElement("audio");
  audio.id = "weddingSoundtrack";
  audio.src = "./assets/Sakhiye.mp3";
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = 0.65;
  audio.playsInline = true;
  document.body.appendChild(audio);

  let toggle = document.getElementById("soundToggle");
  let sound = window.Sound;
  if (!toggle || !sound) return;

  let isEnabled = sound.enabled;
  let hasFailed = false;
  let isAttempting = false;

  function updateToggleUI() {
    toggle.classList.toggle("is-off", !isEnabled);
    toggle.setAttribute("aria-pressed", String(isEnabled));
    let label = isEnabled
      ? audio.paused ? "Music on — tap to play" : "Music playing — tap to mute"
      : "Music off — tap to unmute";
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
  }

  function playAudio() {
    if (!isEnabled || hasFailed || isAttempting || !audio.paused || document.hidden) return;
    isAttempting = true;
    try {
      let p = audio.play();
      if (p && typeof p.then === "function") {
        p.then(() => { isAttempting = false; updateToggleUI(); })
         .catch(() => { isAttempting = false; updateToggleUI(); });
      } else {
        isAttempting = false;
        updateToggleUI();
      }
    } catch {
      isAttempting = false;
      updateToggleUI();
    }
  }

  function setEnabledState(state) {
    isEnabled = !!state;
    if (isEnabled) {
      sound.init();
      playAudio();
    } else {
      audio.pause();
    }
    updateToggleUI();
  }

  toggle.addEventListener("click", () => {
    if (isEnabled && audio.paused) {
      sound.init();
      playAudio();
    } else {
      sound.toggle();
      setEnabledState(sound.enabled);
    }
  });

  function userGestureHandler(e) {
    if (e && e.target && e.target.closest && e.target.closest("#soundToggle")) return;
    sound.init();
    playAudio();
  }

  ["touchstart", "pointerdown", "touchmove", "wheel", "scroll", "click", "keydown"].forEach(evt => {
    document.addEventListener(evt, userGestureHandler, { passive: true });
  });

  audio.addEventListener("playing", updateToggleUI);
  audio.addEventListener("pause", updateToggleUI);
  audio.addEventListener("error", () => { hasFailed = true; updateToggleUI(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio.pause();
    else if (isEnabled) playAudio();
  });

  updateToggleUI();
  window.WeddingMusic = {
    start: playAudio,
    setEnabled: setEnabledState,
    isPlaying: () => !audio.paused && !audio.ended
  };
})();

// Petals Physics Engine
window.Petals = (function() {
  let canvas = document.getElementById("petals");
  if (!canvas) return { rain: () => {}, burst: () => {} };
  let ctx = canvas.getContext("2d");
  let reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let sprites = [];
  let particles = [];
  let running = false;

  for (let i = 1; i <= 12; i++) {
    let img = new Image();
    img.src = `./assets/art/petal-${i}.webp`;
    img.onload = () => sprites.push(img);
  }

  function resize() {
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  function spawn(x, y, vx, vy) {
    particles.push({
      x,
      y,
      vx,
      vy,
      size: 16 + Math.random() * 18,
      spin: Math.random() * 6.28,
      spinV: (Math.random() - 0.5) * 0.12,
      sway: Math.random() * 6.28,
      flip: Math.random() * 6.28,
      sprite: sprites.length ? sprites[Math.floor(Math.random() * sprites.length)] : null,
      hue: ["#FFFFFF", "#F6EEDF", "#F3DDD4", "#F4C863", "#F8D57E"][Math.floor(Math.random() * 5)]
    });
  }

  function frame() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.vy = Math.min(p.vy + 0.05, 2.4);
      p.vx *= 0.985;
      p.sway += 0.04;
      p.flip += 0.07;
      p.spin += p.spinV;
      p.x += p.vx + Math.sin(p.sway) * 0.8;
      p.y += p.vy;

      if (p.y > window.innerHeight + 40) {
        particles.splice(i, 1);
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.scale(1, 0.35 + Math.abs(Math.cos(p.flip)) * 0.65);
        if (p.sprite) {
          ctx.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.fillStyle = p.hue;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size / 2, p.size / 3, 0, 0, 6.29);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    if (particles.length) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function loop() {
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  return {
    rain(count = 35) {
      if (reducedMotion) return;
      for (let i = 0; i < count; i++) {
        spawn(Math.random() * window.innerWidth, -30 - Math.random() * window.innerHeight * 0.7, 0, 0.6 + Math.random());
      }
      loop();
    },
    burst(x, y, count = 40) {
      if (reducedMotion) return;
      for (let i = 0; i < count; i++) {
        let angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        let speed = 3 + Math.random() * 6;
        spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
      loop();
    }
  };
})();

// Main Page Initialization & Interactive Animations
(function() {
  let site = window.SITE;
  let sound = window.Sound;
  let petals = window.Petals;
  let $ = id => document.getElementById(id);
  let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Query param "to" for personalized invitations e.g. ?to=Family
  let toParam = (new URLSearchParams(location.search).get("to") || "").trim().slice(0, 40);
  let openingSec = $("opening");
  let pin = $("pin");
  let sleeve = $("sleeve");
  let strip = $("strip");
  let tab = $("tab");
  let restCopy = $("restCopy");
  let enterBtn = $("enter");

  if (toParam && $("envTo")) {
    $("envTo").textContent = `For ${toParam}`;
    $("envTo").hidden = false;
  }

  // Sleeve Pull Geometry & Animation
  let geom = null;
  function updateGeom() {
    if (!pin || !sleeve) return;
    let pinH = pin.offsetHeight;
    let slW = sleeve.offsetWidth;
    let slH = sleeve.offsetHeight;
    let rise = slW * 1.5;
    let gap = pinH * 0.04;
    let restY = Math.max(20, (pinH - slH - gap - (restCopy ? restCopy.offsetHeight : 0)) / 2 - pinH * 0.06);
    if (restCopy) restCopy.style.top = `${restY + slH + gap}px`;
    let openY = Math.max(14, (pinH - slH - rise - 14 - (enterBtn ? enterBtn.offsetHeight : 0)) / 2);
    if (enterBtn) enterBtn.style.top = `${openY + slH + rise + 14}px`;
    geom = { restY, openY, rise };
  }

  let clamp = val => Math.max(0, Math.min(1, val));
  let norm = (val, [min, max]) => clamp((val - min) / (max - min));
  let lerp = (a, b, t) => a + (b - a) * t;
  let easeInOut = t => (1 - Math.cos(Math.PI * t)) / 2;

  function setSleeveProgress(prog) {
    if (!geom || !sleeve || !strip) return;
    sleeve.style.transform = `translate3d(0, ${lerp(geom.restY, geom.openY, easeInOut(norm(prog, [0, 0.5])))}px, 0)`;
    strip.style.transform = `translate3d(0, ${geom.rise * easeInOut(norm(prog, [0.02, 0.9]))}px, 0)`;
    if (restCopy) {
      restCopy.style.opacity = 1 - norm(prog, [0, 0.12]);
      restCopy.style.visibility = prog >= 0.12 ? "hidden" : "visible";
    }
    if (tab) tab.style.opacity = 1 - norm(prog, [0.02, 0.12]);
    sleeve.classList.toggle("is-open", prog > 0.02);
    if (enterBtn) enterBtn.classList.toggle("is-ready", prog >= 0.86);
  }

  function getScrollProgress() {
    if (!openingSec || !pin) return 1;
    let total = openingSec.offsetHeight - pin.offsetHeight;
    return total > 0 ? clamp(-openingSec.getBoundingClientRect().top / total) : 1;
  }

  let scheduled = false;
  let lastProgress = 0;
  let soundCheckpoints = [
    [0.03, () => sound.tick()],
    [0.05, () => sound.paper()],
    [0.34, () => sound.tick()],
    [0.52, () => sound.tick()],
    [0.68, () => sound.tick()]
  ];

  function onScrollOrLayout() {
    scheduled = false;
    let p = reduced ? 1 : getScrollProgress();
    setSleeveProgress(p);
    soundCheckpoints.forEach(([threshold, fn]) => {
      if (lastProgress < threshold && p >= threshold) fn();
    });
    lastProgress = p;
  }

  function requestUpdate() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(onScrollOrLayout);
    }
  }

  if (reduced && openingSec) openingSec.style.height = "100svh";
  updateGeom();
  onScrollOrLayout();

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => { updateGeom(); requestUpdate(); });
  window.addEventListener("load", () => { updateGeom(); requestUpdate(); });
  if (document.fonts) document.fonts.ready.then(() => { updateGeom(); requestUpdate(); });

  // Smooth custom scroll animator
  let scrollAnimId = 0;
  function cancelScrollAnim() {
    if (scrollAnimId) cancelAnimationFrame(scrollAnimId);
    scrollAnimId = 0;
  }
  function smoothScrollTo(targetY, duration, easing = t => t) {
    cancelScrollAnim();
    let startY = window.scrollY;
    let startT = performance.now();
    function step(now) {
      let progress = clamp((now - startT) / duration);
      window.scrollTo(0, lerp(startY, targetY, easing(progress)));
      if (progress < 1) {
        scrollAnimId = requestAnimationFrame(step);
      } else {
        scrollAnimId = 0;
      }
    }
    scrollAnimId = requestAnimationFrame(step);
  }

  ["wheel", "touchstart"].forEach(evt => window.addEventListener(evt, cancelScrollAnim, { passive: true }));

  if (sleeve) {
    sleeve.addEventListener("click", () => {
      sound.init();
      if (!reduced && !sleeve.classList.contains("is-open")) {
        let tgt = openingSec.offsetTop + (openingSec.offsetHeight - pin.offsetHeight) * 0.92;
        smoothScrollTo(tgt, 2800);
      }
    });
  }

  if (enterBtn) {
    enterBtn.addEventListener("click", () => {
      sound.tick();
      let hero = document.querySelector(".hero");
      if (hero) {
        let top = hero.getBoundingClientRect().top + window.scrollY;
        if (reduced) window.scrollTo(0, top);
        else smoothScrollTo(top, 900);
      }
    });
  }

  // 3D Postcard Turn & Stamp Peeling
  let postcard = $("postcard");
  if (postcard) {
    function flipPostcard() {
      sound.init();
      sound.paper();
      postcard.classList.toggle("is-turned");
    }
    postcard.addEventListener("click", flipPostcard);
    postcard.addEventListener("keydown", e => {
      if (e.target === postcard && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        flipPostcard();
      }
    });
  }

  let stamp = $("stamp");
  if (stamp) {
    stamp.addEventListener("click", e => {
      e.stopPropagation();
      sound.init();
      sound.paper();
      let peeled = stamp.classList.toggle("is-peeled");
      if ($("ps")) $("ps").hidden = !peeled;
      if (peeled) {
        let rect = stamp.getBoundingClientRect();
        petals.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 25);
      }
    });
  }

  // Real-Time Countdown Timer
  let unitEls = {};
  document.querySelectorAll("[data-unit]").forEach(el => {
    unitEls[el.dataset.unit] = el;
  });
  let startTime = new Date(site.weddingStart).getTime();
  let endTime = new Date(site.weddingEnd).getTime();

  function updateCountdown() {
    let now = Date.now();
    let countEl = $("countdown");
    let labelEl = $("countLabel");
    if (now >= startTime) {
      if (countEl) countEl.hidden = true;
      if (labelEl) labelEl.textContent = now < endTime ? "The celebration is happening now!" : "Thank you for celebrating with us!";
      clearInterval(countdownTimer);
      return;
    }
    let diff = Math.floor((startTime - now) / 1000);
    let d = Math.floor(diff / 86400); diff %= 86400;
    let h = Math.floor(diff / 3600); diff %= 3600;
    let m = Math.floor(diff / 60);
    let s = diff % 60;
    let timeObj = { d, h, m, s };
    for (let u in timeObj) {
      if (unitEls[u]) unitEls[u].textContent = String(timeObj[u]).padStart(2, "0");
    }
  }
  let countdownTimer = setInterval(updateCountdown, 1000);
  updateCountdown();

  // Scene Color Background Observer
  let sceneSections = [...document.querySelectorAll("main > [data-scene]")];
  let metaTheme = document.querySelector("meta[name='theme-color']");
  let tickingScene = false;

  function updateScene() {
    tickingScene = false;
    let active = sceneSections.find(s => s.getBoundingClientRect().bottom > 30) || sceneSections[sceneSections.length - 1];
    if (active && document.body.dataset.scene !== active.dataset.scene) {
      document.body.dataset.scene = active.dataset.scene;
      if (metaTheme) metaTheme.content = getComputedStyle(active).backgroundColor;
    }
  }

  window.addEventListener("scroll", () => {
    if (!tickingScene) {
      tickingScene = true;
      requestAnimationFrame(updateScene);
    }
  }, { passive: true });
  window.addEventListener("resize", updateScene);
  updateScene();

  // String Lights on Mehendi / Reception
  let lightsEl = $("lights");
  if (lightsEl) {
    for (let i = 0; i < 24; i++) {
      let bulb = document.createElement("i");
      let frac = i / 23;
      bulb.style.left = `${frac * 100}%`;
      bulb.style.top = `${Math.sin(frac * Math.PI * 4 - Math.PI / 2) * 13 + 16}px`;
      lightsEl.appendChild(bulb);
    }
  }

  // Interactive Dholak Rhythm Beat
  let dholakBtn = $("dholak");
  let nextBeatTime = 0;
  function hitDholak() {
    if (!dholakBtn) return;
    dholakBtn.classList.remove("is-hit");
    if (lightsEl) lightsEl.classList.remove("is-lit");
    void dholakBtn.offsetWidth;
    dholakBtn.classList.add("is-hit");
    if (lightsEl) lightsEl.classList.add("is-lit");
  }

  if (dholakBtn) {
    dholakBtn.addEventListener("click", () => {
      sound.init();
      let now = performance.now();
      if (now < nextBeatTime) return;
      let groove = sound.groove();
      nextBeatTime = now + groove[groove.length - 1].at * 1000 + 250;
      groove.forEach(({ at, voice, level, accent }) => {
        setTimeout(() => {
          sound.playTablaBol(voice, level);
          if (accent) hitDholak();
        }, at * 1000);
      });
    });
  }

  // Interactive Haldi Tile Petal Shower
  let haldiTile = $("haldiTile");
  if (haldiTile) {
    haldiTile.addEventListener("click", () => {
      sound.init();
      sound.paper();
      petals.rain(30);
    });
  }

  // Wedding Mandap Petal Shower
  let mandapBtn = $("mandap");
  if (mandapBtn) {
    mandapBtn.addEventListener("click", () => {
      sound.init();
      sound.paper();
      petals.rain(36);
    });
  }

  // Atmospheric petal shower on reaching Subhalagnam section
  let weddingSec = $("wedding");
  let showered = false;
  if (weddingSec) {
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting && !showered) {
        showered = true;
        petals.rain(48);
        obs.disconnect();
      }
    }, { threshold: 0.5 }).observe(weddingSec);
  }

  // Film Reel Auto-scroll & Drag
  let film = $("film");
  if (film && site.reel) {
    site.reel.forEach(item => {
      let fig = document.createElement("figure");
      fig.className = "print";
      fig.style.setProperty("--ratio", String(item.w / item.h));
      fig.innerHTML = `
        <div class="print-photo">
          <img src="./assets/photos/${item.src}.webp" width="${item.w * 240}" height="${item.h * 240}" alt="${item.alt}" loading="lazy" draggable="false">
        </div>
        <figcaption>${item.caption}</figcaption>
      `;
      film.appendChild(fig);
    });

    let scrollPos = 0;
    let dir = 1;
    let lastTime = 0;
    let pauseUntil = 0;
    let rafId = 0;
    let dragData = null;

    function pauseReel(ms = 950) {
      pauseUntil = performance.now() + ms;
    }

    function animateReel(now) {
      rafId = requestAnimationFrame(animateReel);
      let dt = lastTime ? Math.min(now - lastTime, 64) : 0;
      lastTime = now;
      let maxScroll = Math.max(0, film.scrollWidth - film.clientWidth);
      if (maxScroll < 1) return;

      if (dragData || now < pauseUntil) {
        scrollPos = film.scrollLeft;
      } else {
        if (Math.abs(film.scrollLeft - scrollPos) > 3) scrollPos = film.scrollLeft;
        scrollPos += dir * 42 * dt / 1000;
        if (scrollPos >= maxScroll) { scrollPos = maxScroll; dir = -1; pauseReel(450); }
        else if (scrollPos <= 0) { scrollPos = 0; dir = 1; pauseReel(450); }
        film.scrollLeft = scrollPos;
      }
    }

    function startReel() {
      if (!rafId && !reduced) {
        lastTime = 0;
        scrollPos = film.scrollLeft;
        rafId = requestAnimationFrame(animateReel);
      }
    }
    function stopReel() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) startReel();
      else stopReel();
    }).observe(film);

    ["touchstart", "wheel", "keydown"].forEach(evt => film.addEventListener(evt, () => pauseReel(), { passive: true }));
    film.addEventListener("touchend", () => pauseReel(), { passive: true });

    film.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse" && e.button === 0) {
        dragData = { x: e.clientX, left: film.scrollLeft };
      }
    });

    window.addEventListener("pointermove", e => {
      if (!dragData) return;
      let dx = e.clientX - dragData.x;
      if (Math.abs(dx) > 4) film.classList.add("is-dragging");
      film.scrollLeft = dragData.left - dx;
    });

    function endDrag() {
      if (dragData) pauseReel(850);
      dragData = null;
      film.classList.remove("is-dragging");
    }
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("blur", endDrag);
    film.addEventListener("dragstart", e => e.preventDefault());
  }
})();
