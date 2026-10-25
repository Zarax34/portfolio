  const root = document.documentElement;
  root.classList.add('js');

  const btn = document.getElementById('lang');
  // each page declares its own titles on <html data-title-ar data-title-en>
  const titles = { ar: root.dataset.titleAr || document.title, en: root.dataset.titleEn || document.title };
  const WHATSAPP = 'https://wa.me/967775738156?text=';
  const orderText = {
    ar: (app) => `مرحباً أحمد، أريد طلب نسخة من تطبيق «${app}». أرجو إرسال التفاصيل والسعر.`,
    en: (app) => `Hi Ahmed, I'd like to order a copy of ${app}. Could you send me the details and price?`,
  };
  function updateOrders(lang) {
    document.querySelectorAll('.order').forEach((a) => {
      a.href = WHATSAPP + encodeURIComponent(orderText[lang](a.dataset['app' + (lang === 'ar' ? 'Ar' : 'En')]));
    });
  }
  function setLang(lang) {
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = titles[lang];
    btn.textContent = lang === 'ar' ? 'EN' : 'عربي';
    updateOrders(lang);
    document.querySelectorAll('[data-ph-ar]').forEach((el) => { el.placeholder = el.dataset[lang === 'ar' ? 'phAr' : 'phEn']; });
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }
  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  setLang(saved === 'en' ? 'en' : 'ar');

  const MIN_IDEA = 10;
  const customForm = document.querySelector('.custom-form');
  if (customForm) {
  const ideaField = customForm.idea.closest('.field');
  function checkIdea() {
    const ok = customForm.idea.value.trim().length >= MIN_IDEA;
    ideaField.classList.toggle('invalid', !ok);
    ideaField.querySelector('.error').hidden = ok;
    customForm.idea.setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  customForm.idea.addEventListener('input', () => { if (ideaField.classList.contains('invalid')) checkIdea(); });
  customForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!checkIdea()) { customForm.idea.focus(); return; }
    const lang = root.lang;
    const type = customForm.querySelector('input[name="type"]:checked').closest('label').querySelector('.' + lang).textContent;
    const biz = customForm.biz.value.trim();
    const idea = customForm.idea.value.trim();
    const lines = lang === 'ar'
      ? ['مرحباً أحمد، أريد طلب تطبيق مخصص.', `نوع التطبيق: ${type}`, biz && `النشاط: ${biz}`, `الفكرة: ${idea}`]
      : ['Hi Ahmed, I\'d like to request a custom app.', `App type: ${type}`, biz && `Business: ${biz}`, `Idea: ${idea}`];
    const url = WHATSAPP + encodeURIComponent(lines.filter(Boolean).join('\n'));
    const win = window.open(url, '_blank');
    if (win) win.opener = null; else location.href = url;
  });
  }

  document.querySelectorAll('.gallery').forEach((gallery) => {
    const main = gallery.querySelector('.gallery-main');
    const thumbs = gallery.querySelectorAll('.thumb');
    thumbs.forEach((thumb) => thumb.addEventListener('click', () => {
      if (thumb.classList.contains('active')) return;
      thumbs.forEach((t) => t.classList.toggle('active', t === thumb));
      main.style.opacity = 0;
      setTimeout(() => {
        main.onload = () => { main.style.opacity = 1; };
        main.src = thumb.dataset.src;
        main.alt = thumb.dataset.alt;
      }, 200);
    }));
  });
  btn.addEventListener('click', () => setLang(root.lang === 'ar' ? 'en' : 'ar'));
  document.getElementById('year').textContent = new Date().getFullYear();

  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  (function showcase() {
    const box = document.querySelector('.showcase');
    if (!box) return;
    const orbs = [...box.querySelectorAll('.orb')];
    const screens = [...box.querySelectorAll('.screen')];
    const ring = box.querySelector('.ring');
    const gap = 360 / orbs.length;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TURN_MS = 1100, HOLD_MS = 3400, CLOSE_MS = 450;
    let rot = 0, current = -1, token = 0;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const easeOutBack = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

    // icon i sits at angle i*gap+rot on an ellipse; 0deg is the front (bottom, largest)
    function place() {
      const rx = ring.clientWidth * .36, ry = ring.clientHeight * .28;
      orbs.forEach((orb, i) => {
        const a = (i * gap + rot) * Math.PI / 180;
        const depth = (Math.cos(a) + 1) / 2;
        orb.style.transform = `translate(-50%, -50%) translate(${(Math.sin(a) * rx).toFixed(1)}px, ${(Math.cos(a) * ry).toFixed(1)}px) scale(${(.6 + .45 * depth).toFixed(3)})`;
        orb.style.opacity = (.4 + .6 * depth).toFixed(2);
        orb.style.zIndex = Math.round(depth * 10);
      });
    }

    function turn(delta, ms, my) {
      if (!delta || !ms) { rot += delta; place(); return Promise.resolve(); }
      const from = rot, start = performance.now();
      return new Promise((done) => {
        (function frame(now) {
          if (my !== token) return done();
          const t = Math.min((now - start) / ms, 1);
          rot = from + delta * easeOutBack(t);
          place();
          t < 1 ? requestAnimationFrame(frame) : done();
        })(start);
      });
    }

    function deltaTo(i, shortest) {
      let d = -(((i * gap + rot) % 360 + 360) % 360);
      if (shortest && d < -180) d += 360;
      return d;
    }

    function setOpen(i) {
      screens.forEach((s, k) => s.classList.toggle('open', k === i));
      orbs.forEach((o, k) => o.classList.toggle('active', k === i));
      current = i;
    }

    async function go(i, shortest) {
      const my = ++token;
      if (current !== -1) {
        setOpen(-1);
        if (!still) await sleep(CLOSE_MS);
        if (my !== token) return;
      }
      await turn(deltaTo(i, shortest), still ? 0 : TURN_MS, my);
      if (my !== token) return;
      setOpen(i);
      if (still) return;
      await sleep(HOLD_MS);
      if (my === token) go((i + 1) % orbs.length, false);
    }

    orbs.forEach((orb, i) => orb.addEventListener('click', () => go(i, true)));
    addEventListener('resize', place);
    place();
    go(0, false);
  })();
