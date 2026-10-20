/* VISCOVA landing — GSAP + Lenis choreography and form behaviour.
 * Motion: Lenis smooth scroll · hero check-stroke · continuous scrubbed loop (≥60rem) ·
 * arc-reactor core that reacts to scroll velocity · once-only reveals · counters · CTA lift (CSS).
 * Everything renders complete without JS or with reduced motion.
 */
(function () {
  "use strict";

  const EASE_OUT = "expo.out"; // matches --ease-out (0.16, 1, 0.3, 1)
  const NAV_OFFSET = -88;
  const root = document.documentElement;

  /* ---------- nav: mobile sheet ---------- */
  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.getElementById("nav-links");
  if (toggle && links) {
    const close = () => { links.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", () => {
      const open = !links.classList.contains("is-open");
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- free scan placeholder ---------- */
  const scan = document.querySelector("[data-scan]");
  if (scan) {
    const status = document.getElementById("scan-status");
    scan.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = scan.elements.url.value.trim();
      if (!url) {
        status.textContent = "Enter your app's address first — for example https://yourapp.in.";
        scan.elements.url.focus();
        return;
      }
      status.textContent = "Free scan is still in private build. Book a consultation and we'll review " + url + " by hand.";
    });
  }

  /* ---------- consultation form → prefilled email ---------- */
  const book = document.querySelector("[data-book]");
  if (book) {
    const rules = {
      name: (v) => (v.trim() ? "" : "Add your name so we know who to reply to."),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "That email looks incomplete. Use a full address like name@company.com."),
    };
    const check = (input) => {
      const msg = rules[input.name](input.value);
      const err = document.getElementById(input.getAttribute("aria-describedby"));
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      err.textContent = msg;
      return !msg;
    };
    Object.keys(rules).forEach((name) => {
      const input = book.elements[name];
      input.addEventListener("blur", () => { input.dataset.touched = "1"; check(input); });
      input.addEventListener("input", () => { if (input.dataset.touched) check(input); });
    });
    book.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = Object.keys(rules).map((n) => book.elements[n]);
      const ok = fields.map(check).every(Boolean);
      if (!ok) { fields.find((f) => f.getAttribute("aria-invalid") === "true").focus(); return; }
      const f = book.elements;
      const subject = `${f.need.value} — ${f.name.value.trim()}`;
      const body = [
        `Name: ${f.name.value.trim()}`,
        `Email: ${f.email.value.trim()}`,
        `Need: ${f.need.value}`,
        "",
        f.message.value.trim(),
      ].join("\n");
      window.location.href = `mailto:hello@viscova.dev?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  /* ---------- motion ---------- */
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove("js-motion"); return; }
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  window.__viscovaMotion = true;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => gsap.utils.toArray(sel, scope);

  // Smooth scroll — Lenis drives the scroll, GSAP's ticker drives Lenis, ScrollTrigger listens.
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollToTarget = (target, immediate) => {
    if (lenis) lenis.scrollTo(target, { offset: NAV_OFFSET, duration: 1.4, immediate: !!immediate });
    else target.scrollIntoView({ behavior: immediate || reduce ? "instant" : "smooth" });
  };

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains("skip")) return;
    const id = a.getAttribute("href");
    const target = id.length > 1 && document.querySelector(id);
    if (!target || !lenis) return;
    e.preventDefault();
    scrollToTarget(target);
    history.pushState(null, "", id);
  });

  const mm = gsap.matchMedia();

  // 1 · Hero — the V draws itself, then the tick snaps on: down-stroke, then the flick to the tip.
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const tl = gsap.timeline({ defaults: { ease: EASE_OUT }, onComplete: () => root.classList.remove("js-motion") });
    tl.to(".hero-mark__v", { strokeDashoffset: 0, duration: 0.95, ease: "power2.inOut" }, 0.05)
      .to(".hero-mark__v", { fillOpacity: 1, duration: 0.5, ease: "power1.out" }, 0.75)
      .to("[data-check]", { strokeDashoffset: 790, duration: 0.14, ease: "power1.in" }, 1.0)
      .to("[data-check]", { strokeDashoffset: 0, duration: 0.24, ease: "power3.out" }, ">")
      .to("[data-tick]", { x: 10, y: -10, duration: 0.11, ease: "power2.out", yoyo: true, repeat: 1 }, ">-0.05")
      .to('[data-load="line"]', { y: 0, duration: 1.1, stagger: 0.1 }, 0.15)
      .to('[data-load="fade"]', { opacity: 1, duration: 0.8, stagger: 0.12 }, 0.55);
    return () => root.classList.remove("js-motion");
  });

  // Hero eases out of the way as the loop arrives.
  mm.add("(min-width: 60rem) and (prefers-reduced-motion: no-preference)", () => {
    const st = { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 };
    gsap.to(".hero__art", { yPercent: -12, autoAlpha: 0.2, ease: "none", scrollTrigger: st });
    gsap.to(".hero__copy", { y: -48, autoAlpha: 0.35, ease: "none", scrollTrigger: { ...st } });
  });

  // 2 · The loop.
  const map = $("[data-map]");
  if (map) {
    const ring = $("[data-ring]", map);
    const head = $("[data-head]", map);
    const dial = $("[data-dial]", map);
    const meter = $("[data-meter]", map);
    const steps = $$("[data-step]", map);
    const nodes = $$("[data-node]", map);
    const halos = $$("[data-node-halo]", map);
    const core = $("[data-core]", map);
    const coreHalo = $("[data-core-halo]", map);
    const glow = $("[data-reactor-glow]", map);
    const ORIGIN = "400 400";

    // 2a · Pinned, continuous scrub — one ring draws around the loop; stations and copy crossfade as the head passes.
    mm.add("(min-width: 60rem) and (prefers-reduced-motion: no-preference)", () => {
      const S = 0.8;   // lead-in so station 01 can be read
      const SEG = 2;   // timeline units per station
      map.classList.add("is-scrubbed");

      // Rotations/scales about the map centre are written as SVG transform attributes with an explicit
      // pivot, so a layout refresh can never re-derive (and lose) the origin.
      const svgTransform = (el, fn) => {
        const state = { v: 0 };
        const apply = () => el.setAttribute("transform", fn(state.v));
        return { state, apply };
      };
      const headTurn = svgTransform(head, (d) => `rotate(${d} ${ORIGIN})`);
      const dialTurn = svgTransform(dial, (d) => `rotate(${d} ${ORIGIN})`);
      const haloGrow = svgTransform(coreHalo, (s) => `translate(${ORIGIN}) scale(${s}) translate(-400 -400)`);

      gsap.set(ring, { strokeDashoffset: 1000 });
      gsap.set(meter, { scaleX: 0 });
      gsap.set(nodes.slice(1), { opacity: 0.3 });
      gsap.set(halos, { opacity: 0 });
      gsap.set(halos[0], { opacity: 1 });
      gsap.set(coreHalo, { opacity: 0 });
      steps.slice(1).forEach((s) => gsap.set(s.children, { y: 28, autoAlpha: 0 }));

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: map,
          start: "top top",
          end: () => "+=" + window.innerHeight * 4,
          pin: true,
          scrub: 1.1,
          anticipatePin: 1,
        },
      });

      tl.fromTo(ring, { strokeDashoffset: 1000 }, { strokeDashoffset: 0, duration: SEG * 5 }, S)
        .fromTo(headTurn.state, { v: 0 }, { v: 360, duration: SEG * 5, onUpdate: headTurn.apply }, S)
        .fromTo(meter, { scaleX: 0 }, { scaleX: 1, duration: SEG * 5 }, S)
        .fromTo(dialTurn.state, { v: 0 }, { v: 40, duration: SEG * 5 + S * 2, onUpdate: dialTurn.apply }, 0);
      [headTurn, dialTurn].forEach((t) => t.apply());
      haloGrow.state.v = 0.9;
      haloGrow.apply();

      for (let i = 1; i < nodes.length; i++) {
        const t = S + SEG * i;
        tl.to(halos[i - 1], { opacity: 0, duration: 0.5 }, t - 0.25)
          .to(nodes[i], { opacity: 1, duration: 0.5, ease: "power2.out" }, t - 0.25)
          .to(halos[i], { opacity: 1, duration: 0.5 }, t - 0.25)
          .to(steps[i - 1].children, { y: -22, autoAlpha: 0, duration: 0.45, stagger: 0.05, ease: "power2.in" }, t - 0.6)
          .to(steps[i].children, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" }, t - 0.1);
      }
      const end = S + SEG * 5;
      tl.to(halos[nodes.length - 1], { opacity: 0, duration: 0.5 }, end - 0.25)
        .to(halos[0], { opacity: 1, duration: 0.5 }, end - 0.25)
        .to(coreHalo, { opacity: 1, duration: 0.8, ease: "power2.out" }, end - 0.3)
        .fromTo(haloGrow.state, { v: 0.9 }, { v: 1, duration: 0.8, ease: "power2.out", onUpdate: haloGrow.apply }, end - 0.3)
        .to({}, { duration: S });

      return () => {
        map.classList.remove("is-scrubbed");
        [head, dial, coreHalo].forEach((el) => el.removeAttribute("transform"));
      };
    });

    // 2b · Arc-reactor core. The radar sweep is a pure CSS loop (see .map-scan) so it never depends on scroll.
    // Rings are integrated every frame (not looping tweens) — they always run, and scrolling only nudges their speed.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(core, { svgOrigin: ORIGIN });
      const rotor = (el, degPerSec) => {
        gsap.set(el, { rotation: 0, svgOrigin: ORIGIN });
        return { set: gsap.quickSetter(el, "rotation", "deg"), speed: degPerSec, angle: 0 };
      };
      const rotors = [
        rotor($("[data-ring-a]", map), 360 / 26),
        rotor($("[data-ring-b]", map), -360 / 44),
        rotor($("[data-ring-c]", map), -360 / 72),
      ];
      gsap.to(glow, { opacity: 0.6, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });

      let target = 1;   // where the speed wants to be (decays back to 1)
      let boost = 1;    // the eased speed actually applied
      const tick = (time, deltaMs) => {
        const dt = Math.min(deltaMs, 64) / 1000;
        target += (1 - target) * (1 - Math.exp(-dt * 1.1));
        boost += (target - boost) * (1 - Math.exp(-dt * 4));
        rotors.forEach((r) => {
          r.angle = (r.angle + r.speed * boost * dt) % 360;
          r.set(r.angle);
        });
      };
      gsap.ticker.add(tick);

      // quickTo can't drive the "scale" shorthand, so X and Y get their own setters.
      const swell = { duration: 0.9, ease: "power3.out" };
      const scaleX = gsap.quickTo(core, "scaleX", swell);
      const scaleY = gsap.quickTo(core, "scaleY", swell);
      const scaleTo = (s) => { scaleX(s); scaleY(s); };
      let settle;

      // Page-wide listener: no start/end to fall out of, so the reaction never switches off.
      ScrollTrigger.create({
        onUpdate: (self) => {
          const v = Math.abs(self.getVelocity());
          if (v < 20) return;
          target = self.direction * (1 + Math.min(v / 450, 3.5));
          scaleTo(1 + Math.min(v / 12000, 0.03));
          if (settle) settle.kill();
          settle = gsap.delayedCall(0.2, () => scaleTo(1));
        },
      });

      return () => gsap.ticker.remove(tick);
    });
  }

  // 3 · Reveals — each element enters once, then stays put.
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    $$(".section-title").forEach((h) => {
      const st = { trigger: h, start: "top 88%", once: true };
      gsap.from(h, { y: 48, autoAlpha: 0, duration: 1.1, ease: EASE_OUT, scrollTrigger: st });
      const lede = h.nextElementSibling;
      if (lede && lede.tagName === "P") gsap.from(lede, { y: 24, autoAlpha: 0, duration: 1, delay: 0.12, ease: EASE_OUT, scrollTrigger: { ...st } });
    });

    gsap.set("[data-reveal]", { y: 36, autoAlpha: 0 });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 90%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1, ease: EASE_OUT, stagger: 0.08, overwrite: true }),
    });

    gsap.from(".foot__line", { y: 40, autoAlpha: 0, duration: 1.1, ease: EASE_OUT, scrollTrigger: { trigger: ".foot", start: "top 90%", once: true } });

    // Counters — screen readers get the final figure; the animated digits are hidden from them.
    $$("[data-count]").forEach((el) => {
      const num = el.closest(".figure__num");
      if (num && !num.dataset.sr) {
        const sr = document.createElement("span");
        sr.className = "visually-hidden";
        sr.textContent = num.textContent.replace(/\s+/g, " ");
        Array.from(num.children).forEach((c) => c.setAttribute("aria-hidden", "true"));
        num.appendChild(sr);
        num.dataset.sr = "1";
      }
      const end = Number(el.dataset.count);
      const o = { n: 0 };
      const render = () => { el.textContent = Math.round(o.n).toLocaleString("en-IN"); };
      render();
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: () => gsap.to(o, { n: end, duration: 1.6, ease: "power3.out", onUpdate: render }),
      });
    });
  });

  // 4 · Nav — the current section's link is marked. The pinned Approach section is measured by its wrapper,
  // which contains the pin spacer, so its link stays marked for the whole loop scroll.
  $$(".nav__links a").forEach((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section.closest(".map-wrap") || section, start: "top 45%", end: "bottom 45%",
      onToggle: (self) => link.setAttribute("aria-current", self.isActive ? "true" : "false"),
    });
  });

  // Fonts change line lengths; the pin adds scroll distance after the browser has jumped to a #hash.
  const settleLayout = () => {
    ScrollTrigger.refresh();
    const target = location.hash && document.querySelector(location.hash);
    if (target) scrollToTarget(target, true);
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  if (document.readyState === "complete") settleLayout();
  else window.addEventListener("load", settleLayout);
})();
