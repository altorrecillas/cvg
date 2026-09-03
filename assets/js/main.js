(() => {
  'use strict';

  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  /* Header scroll state + active link */
  const header = $('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Hero-to-content fade: builds in as you scroll through the hero
     (0 at the top, 1 once you've scrolled past it), instead of sitting
     there as a fixed gradient from page load. Also drives a subtle
     parallax on the hero photo and its decorative paw shapes, each
     moving at a different rate for depth — skipped under
     reduced-motion since it's purely decorative. */
  const hero = $('.hero, .page-hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (hero) {
    const onHeroScroll = () => {
      const scrollY = window.scrollY;
      const progress = Math.min(1, Math.max(0, scrollY / hero.offsetHeight));
      hero.style.setProperty('--hero-fade', progress.toFixed(3));
      if (!reduceMotion && scrollY < hero.offsetHeight * 1.4) {
        hero.style.setProperty('--parallax', (scrollY * 0.12).toFixed(1) + 'px');
      }
    };
    onHeroScroll();
    window.addEventListener('scroll', onHeroScroll, { passive: true });
  }

  const here = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    const isHere = href === here || (here === '' && href === 'index.html');
    a.classList.toggle('is-active', isHere);
    if (isHere) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  /* Mobile nav toggle */
  const navToggle = $('.nav-toggle');
  const navLinks = $('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navLinks.addEventListener('click', e => {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* Scroll reveal */
  const revealEls = $$('[data-reveal]');
  const revealGroupEls = $$('[data-reveal-group]');
  if (revealEls.length || revealGroupEls.length) {
    if ('IntersectionObserver' in window) {
      const onIntersect = (io) => (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      };
      // Single elements: a real fraction-visible check works since they're viewport-sized.
      const io1 = new IntersectionObserver((e) => onIntersect(io1)(e), { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach(el => io1.observe(el));
      // Groups (e.g. a long stacked grid on mobile) can be far taller than any viewport,
      // so a 15%-of-the-whole-element threshold could mathematically never be reached —
      // fire as soon as any part of the group enters view instead.
      const io2 = new IntersectionObserver((e) => onIntersect(io2)(e), { threshold: 0, rootMargin: '0px 0px -60px 0px' });
      revealGroupEls.forEach(el => io2.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('in-view'));
      revealGroupEls.forEach(el => el.classList.add('in-view'));
    }
  }

  /* Animated stat counters */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const animate = (el) => {
      const target = parseFloat(el.getAttribute('data-count'));
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => io2.observe(el));
  }

  /* Service category sub-nav: highlights whichever group is currently
     in view as you scroll, so the sticky pill bar tracks your position. */
  const subnav = $('.service-subnav');
  const serviceGroups = $$('.service-group[id]');
  if (subnav && serviceGroups.length && 'IntersectionObserver' in window) {
    const subnavLinks = $$('.service-subnav a', subnav);
    const setActiveGroup = (id) => {
      subnavLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    };
    const groupObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveGroup(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    serviceGroups.forEach(g => groupObserver.observe(g));
  }

  /* FAQ accordion */
  $$('.faq-item').forEach((item, i) => {
    const btn = $('.faq-question', item);
    const answer = $('.faq-answer', item);
    if (!btn || !answer) return;
    const answerId = `faq-answer-${i}`;
    answer.id = answerId;
    answer.setAttribute('role', 'region');
    btn.setAttribute('aria-controls', answerId);
    btn.setAttribute('aria-expanded', 'false');
    btn.id = btn.id || `faq-question-${i}`;
    answer.setAttribute('aria-labelledby', btn.id);
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.faq-item.is-open').forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          $('.faq-answer', other).style.maxHeight = null;
          $('.faq-question', other).setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : null;
    });
  });

  /* Testimonial carousel */
  $$('.testimonial-track-wrap').forEach(wrap => {
    const track = $('.testimonial-track', wrap);
    const cards = $$('.testimonial-card', track);
    const controls = wrap.parentElement.querySelector('.testimonial-controls');
    if (!track || !cards.length) return;
    let index = 0;
    const perView = () => window.innerWidth <= 640 ? 1 : window.innerWidth <= 960 ? 2 : 3;
    const update = () => {
      const gap = 24;
      const cardWidth = cards[0].getBoundingClientRect().width + gap;
      const maxIndex = Math.max(0, cards.length - perView());
      index = Math.min(index, maxIndex);
      track.style.transform = `translateX(-${index * cardWidth}px)`;
    };
    if (controls) {
      const [prev, next] = $$('button', controls);
      next && next.addEventListener('click', () => {
        const maxIndex = Math.max(0, cards.length - perView());
        index = index >= maxIndex ? 0 : index + 1;
        update();
      });
      prev && prev.addEventListener('click', () => {
        const maxIndex = Math.max(0, cards.length - perView());
        index = index <= 0 ? maxIndex : index - 1;
        update();
      });
    }
    window.addEventListener('resize', update);
    update();

    let autoplay = setInterval(() => controls && $$('button', controls)[1]?.click(), 6000);
    wrap.addEventListener('mouseenter', () => clearInterval(autoplay));
    wrap.addEventListener('mouseleave', () => {
      autoplay = setInterval(() => controls && $$('button', controls)[1]?.click(), 6000);
    });
  });

  /* Back to top: visible past 500px, with a ring showing how far through
     the page you are (full circle = at the bottom). Fades out after a
     couple of seconds of no scrolling, and reappears the moment you
     scroll again — so it doesn't just sit there once you stop reading. */
  const topBtn = $('.float-btn.top');
  if (topBtn) {
    const ringFill = $('.progress-ring-fill', topBtn);
    const circumference = ringFill ? 2 * Math.PI * ringFill.r.baseVal.value : 0;
    if (ringFill) ringFill.style.strokeDasharray = String(circumference);
    let idleTimer = null;
    const onScroll = () => {
      topBtn.classList.toggle('is-visible', window.scrollY > 500);
      topBtn.classList.remove('is-idle');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => topBtn.classList.add('is-idle'), 2500);
      if (ringFill) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        ringFill.style.strokeDashoffset = String(circumference * (1 - pct));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* Service card photo reveal on touch: :hover never fires reliably on
     touchscreens, so tapping a card triggers the same dissolve-to-photo
     cycle the CSS already plays on hover, timed to match its duration. */
  $$('.service-card.is-flip').forEach(card => {
    let timer = null;
    card.addEventListener('touchstart', () => {
      if (card.classList.contains('is-touched')) return;
      card.classList.add('is-touched');
      clearTimeout(timer);
      timer = setTimeout(() => card.classList.remove('is-touched'), 3800);
    }, { passive: true });
  });

  /* Footer year */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* Cookie consent */
  (() => {
    const STORAGE_KEY = 'cvg-cookie-consent';
    const banner = $('#cookie-banner');
    if (!banner) return;

    const prefsBtn = $('#cookie-prefs-btn');
    const prefsPanel = $('#cookie-prefs-panel');
    const mapsCheckbox = $('#cookie-pref-maps');
    const reopenBtn = $('#cookie-reopen-btn');

    const getConsent = () => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
    };
    const setConsent = (maps) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ necessary: true, maps: !!maps, ts: Date.now() })); } catch { /* localStorage unavailable */ }
    };

    const loadMaps = () => {
      $$('[data-map-consent] iframe[data-src]').forEach(f => {
        f.src = f.getAttribute('data-src');
        f.removeAttribute('hidden');
        const ph = f.parentElement.querySelector('.map-placeholder');
        if (ph) ph.hidden = true;
      });
    };

    const openBanner = () => {
      banner.hidden = false;
      if (reopenBtn) reopenBtn.hidden = true;
    };
    const closeBanner = () => {
      banner.hidden = true;
      if (prefsPanel) prefsPanel.hidden = true;
      if (prefsBtn) prefsBtn.setAttribute('aria-expanded', 'false');
      if (reopenBtn) reopenBtn.hidden = false;
    };

    const existing = getConsent();
    if (existing) {
      if (existing.maps) loadMaps();
      if (reopenBtn) reopenBtn.hidden = false;
    } else {
      openBanner();
    }

    $('#cookie-accept-btn')?.addEventListener('click', () => {
      setConsent(true);
      loadMaps();
      closeBanner();
    });
    $('#cookie-reject-btn')?.addEventListener('click', () => {
      setConsent(false);
      closeBanner();
    });
    prefsBtn?.addEventListener('click', () => {
      if (!prefsPanel) return;
      const nowHidden = !prefsPanel.hidden;
      prefsPanel.hidden = nowHidden;
      prefsBtn.setAttribute('aria-expanded', String(!nowHidden));
    });
    $('#cookie-save-prefs-btn')?.addEventListener('click', () => {
      const wantsMaps = !!mapsCheckbox?.checked;
      setConsent(wantsMaps);
      if (wantsMaps) loadMaps();
      closeBanner();
    });
    reopenBtn?.addEventListener('click', () => {
      const current = getConsent();
      if (mapsCheckbox) mapsCheckbox.checked = !!current?.maps;
      openBanner();
    });
    $$('.cookie-manage-btn').forEach(b => b.addEventListener('click', () => reopenBtn?.click()));

    /* Per-map "Cargar mapa" button: loads just that map and records consent */
    $$('.map-load-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrap = btn.closest('[data-map-consent]');
        const iframe = wrap?.querySelector('iframe[data-src]');
        if (iframe) {
          iframe.src = iframe.getAttribute('data-src');
          iframe.removeAttribute('hidden');
          const ph = btn.closest('.map-placeholder');
          if (ph) ph.hidden = true;
        }
        setConsent(true);
        if (mapsCheckbox) mapsCheckbox.checked = true;
        if (!banner.hidden) closeBanner();
      });
    });
  })();

  /* Contact form */
  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      let firstInvalid = null;
      $$('[data-required]', form).forEach(field => {
        const wrapper = field.closest('.field');
        const value = field.value.trim();
        let ok = value.length > 0;
        if (field.type === 'email' && ok) {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }
        wrapper.classList.toggle('has-error', !ok);
        field.setAttribute('aria-invalid', String(!ok));
        if (!ok) { valid = false; firstInvalid = firstInvalid || field; }
      });
      if (!valid) { firstInvalid.focus(); return; }

      const name = form.querySelector('[name="nombre"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      const phone = form.querySelector('[name="telefono"]')?.value.trim() || '';
      const message = form.querySelector('[name="mensaje"]').value.trim();
      const subject = encodeURIComponent(`Contacto web — ${name}`);
      const body = encodeURIComponent(
        `Nombre: ${name}\nEmail: ${email}\nTeléfono: ${phone}\n\nMensaje:\n${message}`
      );

      const success = $('.form-success', form.closest('.form-card') || document);
      if (success) success.classList.add('is-visible');
      form.reset();

      window.location.href = `mailto:gavavet@gavavet.es?subject=${subject}&body=${body}`;
    });

    $$('[data-required]', form).forEach(field => {
      field.addEventListener('input', () => {
        field.closest('.field').classList.remove('has-error');
        field.setAttribute('aria-invalid', 'false');
      });
    });
  }
})();
