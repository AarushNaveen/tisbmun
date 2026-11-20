/* TISBMUN XXVI: shared behaviour for every page. Content lives in config.js. */
(() => {
const C = window.TISBMUN || {};
const ROOT = document.body.dataset.root || '';
const url = p => /^(https?:|mailto:)/.test(p) ? p : ROOT + p;
const ICON_CLOCK = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path stroke-linejoin="round" d="M12 8V12L14.5 14.5"/></g></svg>`, ICON_OPEN = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M18 15V6H9"/></svg>`;
const AGENDA_DEFAULT = 'Agenda to be announced';

/* ---------- Registration link: config.js holds the one URL every Register button uses ---------- */
if (C.registrationUrl) document.querySelectorAll('[data-reg-link]').forEach(a => { a.href = C.registrationUrl; });

/* ---------- Document covers (home page documents, committee guide + matrix) ---------- */
const cover = d => `
  <li data-row><span class="dt">${d.title}</span>
    ${d.file ? `<a class="ds" href="${url(d.file)}" target="_blank" rel="noopener">Open PDF ${ICON_OPEN}</a>` : `<span class="ds">Coming soon</span>`}</li>`;
const renderDocs = (list, listEl, embedEl) => {
  if (!listEl) return;
  listEl.innerHTML = list.map(cover).join('');
  if (embedEl && window.self === window.top)
    embedEl.innerHTML = list.filter(d => d.file).map(d =>
      `<div class="doc-embed"><iframe src="${url(d.file)}" title="${d.title}" loading="lazy"></iframe></div>`).join('');
};
renderDocs(C.documents || [], document.getElementById('doc-list'), document.getElementById('doc-embeds'));

/* ---------- Agendas on the home page committee list ---------- */
document.querySelectorAll('[data-agenda-for]').forEach(el => {
  const cfg = (C.committees || {})[el.dataset.agendaFor];
  el.textContent = (cfg && cfg.agenda) || '';
});

/* ---------- Committee page ---------- */
const id = document.body.dataset.committee;
if (id) {
  const cfg = (C.committees || {})[id] || {};
  document.querySelectorAll('[data-agenda]').forEach(el => el.textContent = cfg.agenda || 'To be announced');
  renderDocs([{ title: 'Background Guide', file: cfg.guide }, { title: 'Country Matrix', file: cfg.matrix }],
             document.getElementById('committee-docs'), document.getElementById('doc-embeds'));
}

/* ---------- Mobile menu ---------- */
const side = document.querySelector('.side'), menuBtn = document.querySelector('.menu-btn');
if (side && menuBtn) {
  const setOpen = open => { menuBtn.setAttribute('aria-expanded', open); menuBtn.textContent = open ? 'Close' : 'Menu'; side.toggleAttribute('data-open', open); };
  menuBtn.addEventListener('click', () => setOpen(menuBtn.getAttribute('aria-expanded') !== 'true'));
  side.querySelectorAll('.side-menu a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && side.hasAttribute('data-open')) { setOpen(false); menuBtn.focus(); } });
  matchMedia('(min-width: 901px)').addEventListener('change', e => e.matches && setOpen(false));
}

/* ---------- Committees list in the side navigation ---------- */
const sub = document.querySelector('.has-sub');
if (sub) {
  const btn = sub.querySelector('.sub-toggle');
  let chosen = false;                       // once the visitor toggles it, their choice wins
  const set = open => {
    sub.toggleAttribute('data-open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', (open ? 'Hide' : 'Show') + ' committees');
  };
  btn.addEventListener('click', () => { chosen = true; set(!sub.hasAttribute('data-open')); });
  sub.querySelector('.toc-row > a').addEventListener('click', () => set(true));
  const sec = document.getElementById('committees');
  const wide = matchMedia('(min-width: 901px)');      // phones: the list only matters inside the menu
  if (sec && !document.body.dataset.committee)
    new IntersectionObserver(es => es.forEach(e => { if (!chosen && wide.matches) set(e.isIntersecting); }),
                             { rootMargin: '-30% 0px -50% 0px' }).observe(sec);
}

/* ---------- Clean section addresses: /committees, /venue … (no index.html, no #) ---------- */
const navLinks = [...document.querySelectorAll('.toc a[data-section]')];
const onHome = !document.body.dataset.committee;
const padTop = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
const goTo = (id, behavior) => {
  const el = document.getElementById(id); if (!el) return;
  const top = id === 'overview' ? 0 : el.getBoundingClientRect().top + scrollY - padTop();
  window.scrollTo({ top, behavior });
};
if (onHome) {
  const start = document.body.dataset.start;
  if (start && start !== 'overview') {
    goTo(start, 'instant');
    /* fonts can shift the page after the first jump: settle once they and everything else have loaded */
    const settle = () => { if (scrollY < 2 || Math.abs(document.getElementById(start).getBoundingClientRect().top - padTop()) > 2) goTo(start, 'instant'); };
    if (document.fonts) document.fonts.ready.then(settle);
    addEventListener('load', settle, { once: true });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-section]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    goTo(a.dataset.section, 'smooth');
    history.pushState({ section: a.dataset.section }, '', a.getAttribute('href'));
  });
  addEventListener('popstate', () => {
    const id = location.pathname.replace(/\/$/, '').split('/').pop().replace(/\.html$/, '');
    const target = document.getElementById(id) ? id : 'overview';
    goTo(target, 'instant');   // Back/Forward jump, as browsers normally do
    /* some browsers start their own scroll right after a history step: hold the position briefly */
    let n = 0; const hold = () => { goTo(target, 'instant'); if (++n < 30) requestAnimationFrame(hold); };
    requestAnimationFrame(hold);
  });
  /* the site does its own scrolling for these addresses, so the browser shouldn't restore old positions */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  /* contents highlight: the last section whose top has passed 30% of the screen */
  const secs = [...document.querySelectorAll('main .sec[id]')];
  let ticking = false;
  const spy = () => {
    ticking = false;
    const line = innerHeight * .3;
    let cur = secs[0];
    for (const s of secs) if (s.getBoundingClientRect().top <= line) cur = s;
    navLinks.forEach(a => a.setAttribute('aria-current', a.dataset.section === cur.id ? 'true' : 'false'));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  addEventListener('resize', spy); spy();
}

/* ---------- Motion ----------
   One system: entrance curve "out", movement curve "inOut", 12px block rise,
   0.3em word rise, 0.6s blocks, 0.55s words, staggers capped by total time. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!window.gsap || !window.ScrollTrigger) return;
gsap.registerPlugin(ScrollTrigger);
if (window.CustomEase) {
  gsap.registerPlugin(CustomEase);
  CustomEase.create('out', '0.23,1,0.32,1');
  CustomEase.create('inOut', '0.77,0,0.175,1');
}
const EASE = window.CustomEase ? 'out' : 'expo.out';
const RISE = reduce ? 0 : 12, WORD = reduce ? 0 : '0.3em';
const BLOCK = reduce ? .3 : .6, WORDS = reduce ? .3 : .55;
gsap.defaults({ ease: EASE, duration: BLOCK });

if (!reduce) document.querySelectorAll('[data-split]').forEach(el => {
  const text = el.textContent.trim();
  el.innerHTML = `<span class="sr">${text}</span><span aria-hidden="true">${text.split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ')}</span>`;
});
const words = el => el && el.querySelectorAll('.w').length ? el.querySelectorAll('.w') : el;

let seen = false;
try { seen = sessionStorage.getItem('tisbmun-intro-seen') === '1'; } catch (e) {}
try { sessionStorage.setItem('tisbmun-intro-seen', '1'); } catch (e) {}
// Opening: cover panel, then the lead line, the photo, then the details.
if (!seen) {
const intro = gsap.timeline();
intro.from('[data-intro]', { y: RISE, opacity: 0, stagger: { amount: .3 } });
const lead = document.querySelector('[data-lead]');
if (lead) intro.from(words(lead), { y: WORD, opacity: 0, duration: WORDS, stagger: { amount: .4, ease: 'sine.in' } }, .12);
const photo = document.querySelector('[data-photo]');
if (photo) {
  if (reduce) intro.from(photo, { opacity: 0 }, .2);
  else intro.fromTo(photo, { clipPath: 'inset(0 0 100% 0)', scale: 1.04 },
                           { clipPath: 'inset(0 0 0% 0)', scale: 1, duration: 1.1, ease: 'inOut', clearProps: 'clipPath,transform' }, .22);
}
const after = document.querySelectorAll('[data-intro-after]');
if (after.length) intro.from(after, { y: RISE, opacity: 0, stagger: { amount: .12 } }, .45);
} else {
  const quick = [document.querySelector('[data-lead]'), document.querySelector('[data-photo]'),
                 ...document.querySelectorAll('[data-intro-after]')].filter(Boolean);
  if (quick.length) gsap.from(quick, { opacity: 0, duration: .3, ease: EASE });
}

const below = el => el.getBoundingClientRect().top > window.innerHeight;
const revealOnScroll = !location.hash && !(document.body.dataset.start && document.body.dataset.start !== 'overview');

// Each section: heading, then its note.
if (revealOnScroll) document.querySelectorAll('main .sec-head').forEach(head => {
  if (!below(head)) return;
  gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 85%', once: true } })
    .from(head.querySelector('h2'), { y: RISE, opacity: 0 })
    .from(head.querySelectorAll('p'), { y: reduce ? 0 : 8, opacity: 0 }, .1);
});

// Section contents reveal in batches as they enter.
const items = revealOnScroll ? gsap.utils.toArray('main [data-row], main [data-rise]').filter(below) : [];
if (items.length) {
  gsap.set(items, { y: RISE, opacity: 0 });
  ScrollTrigger.batch(items, {
    start: 'top 92%', once: true, interval: .08, batchMax: 6,
    onEnter: batch => gsap.to(batch, { y: 0, opacity: 1, overwrite: true,
                                        stagger: { amount: Math.min(.3, .06 * (batch.length - 1)), ease: 'sine.in' } })
  });
}

const refresh = () => ScrollTrigger.refresh();
window.addEventListener('load', refresh);
document.fonts && document.fonts.ready.then(refresh);
window.addEventListener('pageshow', e => {
  if (e.persisted) gsap.set(document.querySelectorAll('main [data-row], main [data-rise], main .sec-head h2, main .sec-head p'),
                            { clearProps: 'opacity,visibility,transform' });
});
})();
