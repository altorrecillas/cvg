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
  const revealEls = $$('[data-reveal], [data-reveal-group]');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      revealEls.forEach(el => io.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('in-view'));
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

  /* Back to top + floating actions visibility */
  const topBtn = $('.float-btn.top');
  if (topBtn) {
    window.addEventListener('scroll', () => {
      topBtn.classList.toggle('is-visible', window.scrollY > 500);
    }, { passive: true });
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

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
      $$('[data-required]', form).forEach(field => {
        const wrapper = field.closest('.field');
        const value = field.value.trim();
        let ok = value.length > 0;
        if (field.type === 'email' && ok) {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }
        wrapper.classList.toggle('has-error', !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;

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
      field.addEventListener('input', () => field.closest('.field').classList.remove('has-error'));
    });
  }
})();
