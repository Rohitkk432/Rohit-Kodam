'use strict';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);

// ---------- copy email (works with or without motion) ----------
const mailBtn = $('.contact__mail');
mailBtn.addEventListener('click', async () => {
  const hint = $('small', mailBtn);
  try {
    await navigator.clipboard.writeText(mailBtn.dataset.email);
    hint.textContent = 'copied ✓';
  } catch {
    location.href = `mailto:${mailBtn.dataset.email}`;
  }
  setTimeout(() => (hint.textContent = 'click to copy'), 2000);
});

// ---------- shatter: slice an image into jittered triangular shards ----------
// Each shard is a full-size copy of the image clipped to one triangle, so they
// line up perfectly when untransformed and can be flung apart independently.
const buildShatter = el => {
  const cols = +el.dataset.cols, rows = +el.dataset.rows;
  const pts = [];
  for (let r = 0; r <= rows; r++) {
    pts.push([]);
    for (let c = 0; c <= cols; c++) {
      const edge = r === 0 || c === 0 || r === rows || c === cols;
      pts[r].push([
        (c / cols) * 100 + (edge ? 0 : rand(-0.35, 0.35) * (100 / cols)),
        (r / rows) * 100 + (edge ? 0 : rand(-0.35, 0.35) * (100 / rows)),
      ]);
    }
  }
  const tris = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const [a, b, d, e] = [pts[r][c], pts[r][c + 1], pts[r + 1][c], pts[r + 1][c + 1]];
      tris.push(...((r + c) % 2 ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]]));
    }
  el.innerHTML = `<img class="shatter__base" src="${el.dataset.src}" alt="" />` + tris.map(t => `<div class="shard" style="background-image:url(${el.dataset.src});clip-path:polygon(${t.map(p => `${p[0].toFixed(2)}% ${p[1].toFixed(2)}%`).join(',')})"></div>`).join('');
  return $$('.shard', el).map((node, i) => {
    const cx = (tris[i][0][0] + tris[i][1][0] + tris[i][2][0]) / 3 - 50;
    const cy = (tris[i][0][1] + tris[i][1][1] + tris[i][2][1]) / 3 - 50;
    const len = Math.hypot(cx, cy) || 1, force = rand(0.5, 1.3);
    return {
      node,
      out: { x: (cx / len) * innerWidth * 0.6 * force, y: (cy / len) * innerHeight * 0.6 * force + rand(-80, 80), rotation: rand(-120, 120), scale: rand(0.5, 1.1) },
    };
  });
};

const shatterEl = $('.hero__bust');
const bustImg = new Image();
bustImg.src = shatterEl.dataset.src;

// split hero words into characters
$$('.hero__word').forEach(w => {
  const target = $('em', w) || w;
  target.innerHTML = [...target.textContent].map(c => `<span class="ch">${c}</span>`).join('');
});

// manifesto: wrap every word (and each image pill) so they can light up in sequence
const wrapWords = el => {
  [...el.childNodes].forEach(node => {
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(part);
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = part;
        frag.append(s);
      });
      node.replaceWith(frag);
    } else if (node.classList.contains('pill')) node.classList.add('w');
    else wrapWords(node);
  });
};
wrapWords($('.manifesto__text'));

bustImg.decode().catch(() => {}).then(() => {
  shatterEl.style.aspectRatio = `${bustImg.naturalWidth} / ${bustImg.naturalHeight}`;
  const shards = buildShatter(shatterEl);
  if (reduceMotion || !window.gsap) return void ($('.shatter__base').style.opacity = 1);
  animate(shards);
});

function animate(shards) {
  gsap.registerPlugin(ScrollTrigger);

  // ---------- smooth scroll ----------
  const lenis = new Lenis({ lerp: 0.085 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach(a =>
    a.addEventListener('click', e => {
      e.preventDefault();
      lenis.scrollTo(a.getAttribute('href'), { duration: 1.6 });
    })
  );

  // ---------- cursor ----------
  const cursor = $('.cursor');
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3' });
  addEventListener('pointermove', e => { cx(e.clientX); cy(e.clientY); });
  $$('a, button, .pile span, .card').forEach(el => {
    el.addEventListener('pointerenter', () => cursor.classList.add('is-big'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-big'));
  });

  // ---------- hero intro: shards fly in and assemble ----------
  // Scrolling is locked until the bust is whole, so the scroll-driven break below
  // always starts from (and reverses back to) the assembled state.
  const nodes = shards.map(s => s.node);
  const base = $('.shatter__base');
  let introDone = false, breakProgress = 0;
  const syncBase = () => (base.style.opacity = introDone && breakProgress < 0.002 ? 1 : 0); // full image hides hairline seams
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  lenis.stop();
  shards.forEach(s => gsap.set(s.node, { ...s.out, autoAlpha: 0 }));
  gsap.timeline({ delay: 0.2, onComplete: () => { introDone = true; syncBase(); lenis.start(); } })
    .from('.hero__blob', { scale: 0, duration: 1.6, ease: 'expo.out' })
    .to(nodes, { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 1.6, ease: 'expo.out', stagger: { amount: 0.6, from: 'random' } }, 0.1)
    .from('.hero__word--top .ch', { yPercent: 110, rotate: 12, duration: 1.2, ease: 'expo.out', stagger: 0.05 }, 0.5)
    .from('.hero__word--bottom .ch', { yPercent: -110, rotate: -12, duration: 1.2, ease: 'expo.out', stagger: 0.05 }, 0.6)
    .from('.hero__float', { scale: 0, duration: 1.2, ease: 'back.out(1.8)', stagger: 0.15 }, 0.9)
    .from('.hero__tag, .hero__edition, .hero__scroll, .nav', { autoAlpha: 0, y: 20, duration: 0.8, stagger: 0.08 }, 1.1);

  // idle float + mouse parallax on the side statues
  gsap.to('.hero__float--a', { y: -24, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.hero__float--b', { y: 20, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  const hero = $('.hero__pin');
  hero.addEventListener('pointermove', e => {
    const dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5;
    gsap.to('.hero__float--a', { x: dx * -60, duration: 1 });
    gsap.to('.hero__float--b', { x: dx * 60, duration: 1 });
    gsap.to('.hero__bust', { rotationY: dx * 10, rotationX: -dy * 6, transformPerspective: 900, duration: 1 });
  });

  // ---------- hero scroll: the bust breaks apart ----------
  // Shard positions are a pure function of scroll progress, so scrubbing down and
  // back up always lands on exactly the same state (no recorded tween start values).
  const proxy = { p: 0 };
  shards.forEach(s => (s.t = rand(0, 0.2)));
  const renderShards = () => {
    breakProgress = proxy.p;
    syncBase();
    if (!introDone) return;
    shards.forEach(s => {
      const l = gsap.utils.clamp(0, 1, (proxy.p - s.t) / 0.8), e = l * l;
      gsap.set(s.node, {
        x: s.out.x * e, y: s.out.y * e, rotation: s.out.rotation * e, scale: 1 + (s.out.scale - 1) * e,
        autoAlpha: l < 0.75 ? 1 : 1 - (l - 0.75) / 0.25,
      });
    });
  };
  const breakTl = gsap.timeline({ scrollTrigger: { trigger: '.hero__pin', pin: true, start: 'top top', end: '+=130%', scrub: 1 } });
  breakTl.to(proxy, { p: 1, ease: 'none', duration: 1, onUpdate: renderShards }, 0);
  const still = { xPercent: 0, yPercent: 0, rotation: 0, scale: 1 };
  breakTl
    .fromTo('.hero__word--top', { yPercent: 0, scale: 1 }, { yPercent: -80, scale: 1.2, ease: 'none', duration: 1, immediateRender: false }, 0)
    .fromTo('.hero__word--bottom', { yPercent: 0, scale: 1 }, { yPercent: 80, scale: 1.2, ease: 'none', duration: 1, immediateRender: false }, 0)
    .fromTo('.hero__float--a', still, { xPercent: -200, yPercent: 80, rotation: -90, ease: 'power2.in', duration: 1, immediateRender: false }, 0)
    .fromTo('.hero__float--b', still, { xPercent: 200, yPercent: -80, rotation: 90, ease: 'power2.in', duration: 1, immediateRender: false }, 0)
    .fromTo('.hero__blob', { scale: 1, opacity: 0.85 }, { scale: 2.6, opacity: 0.4, ease: 'none', duration: 1, immediateRender: false }, 0)
    .fromTo('.hero__tag, .hero__edition, .hero__scroll', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, immediateRender: false }, 0);

  // ---------- manifesto: words light up, image pills pop in ----------
  gsap.set('.manifesto__text .pill', { scale: 0, rotation: -40 });
  gsap.to('.manifesto__text .w', {
    opacity: 1, scale: 1, rotation: 0, stagger: 0.05, ease: 'back.out(2)',
    scrollTrigger: { trigger: '.manifesto__text', start: 'top 75%', end: 'bottom 55%', scrub: 0.6 },
  });

  // ---------- career: stacking panels, statues break out of the frame ----------
  const panels = $$('.panel');
  panels.forEach((panel, i) => {
    gsap.fromTo($('.panel__statue', panel), { yPercent: 25, rotation: 8 }, {
      yPercent: -8, rotation: -4, ease: 'none',
      scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.from($('.panel__org', panel), { yPercent: 60, autoAlpha: 0, skewY: 8, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: panel, start: 'top 70%' } });
    const next = panels[i + 1];
    if (next)
      gsap.fromTo(panel, { scale: 1, filter: 'brightness(1)' }, {
        scale: 0.92, filter: 'brightness(.8)', ease: 'none',
        scrollTrigger: { trigger: next, start: 'top 70%', end: 'top 20%', scrub: true },
      });
  });

  // ---------- work: a deck of cards you throw away ----------
  const cards = $$('.card');
  const n = cards.length;
  cards.forEach((c, i) => gsap.set(c, { zIndex: n - i, rotation: i ? rand(-7, 7) : 0, scale: 1 - Math.min(i, 3) * 0.04, y: Math.min(i, 3) * 14 }));
  const counters = new Map(cards.map(c => [c, $$('.count', c)]));
  const runCounters = card => counters.get(card).forEach(el => {
    if (el.dataset.done) return;
    el.dataset.done = 1;
    const from = +el.dataset.from, to = +el.dataset.to, dec = +el.dataset.dec, plus = 'plus' in el.dataset;
    const o = { v: from };
    gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', onUpdate: () => (el.textContent = (plus ? '+' : '') + o.v.toFixed(dec)) });
  });

  gsap.from(cards, {
    yPercent: 120, rotation: () => rand(-30, 30), duration: 1.2, ease: 'expo.out', stagger: { each: 0.06, from: 'end' },
    scrollTrigger: { trigger: '.work', start: 'top 60%' }, onComplete: () => runCounters(cards[0]),
  });

  const idx = $('.work__idx');
  const deckTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.work__pin', pin: true, start: 'top top', end: `+=${(n - 1) * 70}%`, scrub: 0.8,
      onUpdate: self => (idx.textContent = String(Math.min(n, Math.floor(self.progress * (n - 1) + 1.0001))).padStart(2, '0')),
    },
  });
  cards.slice(0, -1).forEach((card, i) => {
    const dir = i % 2 ? -1 : 1;
    deckTl
      .to(card, { x: () => dir * innerWidth * 1.4, y: -innerHeight * 0.25, rotation: dir * 40, ease: 'power2.in', duration: 1 }, i)
      .to(cards.slice(i + 1, i + 4), { y: (k) => k * 14, scale: (k) => 1 - k * 0.04, ease: 'power1.out', duration: 1 }, i)
      .to(cards[i + 1], { rotation: 0, duration: 1 }, i)
      .call(() => runCounters(cards[i + 1]), null, i + 0.6);
  });
  deckTl.fromTo('.work__flyer', { x: 0, y: '30vh', rotation: -30 }, { x: '160vw', y: '-25vh', rotation: 330, ease: 'none', duration: n - 1 }, 0);

  // ---------- ticker: speed + skew follow scroll velocity ----------
  const rows = $$('.ticker__row').map((row, i) => {
    const inner = $('.ticker__inner', row);
    inner.innerHTML += inner.innerHTML; // duplicate for seamless loop
    return { inner, dir: i ? -1 : 1, x: 0 };
  });
  let velocity = 0, sign = 1;
  lenis.on('scroll', ({ velocity: v }) => {
    velocity = v;
    if (v) sign = Math.sign(v);
  });
  gsap.ticker.add(() => {
    const boost = Math.min(Math.abs(velocity) * 0.8, 20);
    rows.forEach(r => {
      const half = r.inner.scrollWidth / 2;
      r.x = gsap.utils.wrap(-half, 0, r.x - r.dir * sign * (1 + boost));
      r.inner.style.transform = `translate3d(${r.x}px,0,0) skewX(${gsap.utils.clamp(-15, 15, -velocity * 0.6)}deg)`;
    });
    velocity *= 0.9;
  });

  // ---------- toolkit: pills fall from the sky and bounce ----------
  gsap.fromTo('.pile span', { y: () => -innerHeight * rand(0.6, 1.1), rotation: () => rand(-60, 60), autoAlpha: 0 }, {
    y: 0, rotation: 0, autoAlpha: 1, duration: 1.4, ease: 'bounce.out', stagger: { amount: 0.8, from: 'random' },
    scrollTrigger: { trigger: '.pile', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
  gsap.from('.toolkit__title', { yPercent: 50, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.toolkit__title', start: 'top 85%' } });
  gsap.fromTo('.toolkit__verus', { yPercent: 60, rotation: 15 }, { yPercent: 0, rotation: -5, ease: 'none', scrollTrigger: { trigger: '.toolkit', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  // ---------- contact: the lion pounces ----------
  gsap.fromTo('.contact__lion', { xPercent: 90, rotation: 12 }, {
    xPercent: 0, rotation: 0, ease: 'power2.out',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 15%', scrub: 1 },
  });
  gsap.from('.contact__title > *', {
    yPercent: 100, rotation: () => rand(-20, 20), scale: 0.6, duration: 1.2, ease: 'back.out(1.6)', stagger: 0.1,
    scrollTrigger: { trigger: '.contact__title', start: 'top 80%' },
  });
  gsap.from('.contact__mail, .contact__links li', {
    autoAlpha: 0, y: 40, stagger: 0.07, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.contact__mail', start: 'top 90%' },
  });

  ScrollTrigger.refresh();
}
