/* ============================================================
   ESPRIT DU PAGNE — animations.js
   Script d'animations professionnelles
   ============================================================ */

(function() {
  'use strict';

  // ── 1. SCROLL REVEAL ────────────────────────────────────
  function initScrollReveal() {
    const els = document.querySelectorAll(
      '.product-card, .why-card, .service-item, .testimonial-card, ' +
      '.formation-card, .gallery-item, .post-card, .stat-card, ' +
      '.footer-section, .section-header, .course-card-pro, ' +
      '[class*="card"], .btn-primary, .details-section'
    );

    els.forEach((el, i) => {
      if (!el.classList.contains('reveal') &&
          !el.classList.contains('reveal-left') &&
          !el.classList.contains('reveal-right')) {
        el.classList.add('reveal');
        // Cascade delay for grids
        const parent = el.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(c =>
            c.classList.contains('reveal')
          );
          const idx = siblings.indexOf(el);
          if (idx > 0 && idx < 6) {
            el.style.transitionDelay = (idx * 0.1) + 's';
          }
        }
      }
    });

    // Section headers
    document.querySelectorAll('.section-header h2').forEach(el => {
      el.classList.add('reveal');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
      .forEach(el => observer.observe(el));
  }

  // ── 2. RIPPLE SUR BOUTONS ───────────────────────────────
  function initRipple() {
    document.querySelectorAll('.btn, .btn-add-cart, .btn-inscrire, .cart-checkout-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        const ripple = document.createElement('span');
        ripple.classList.add('btn-ripple');
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  // ── 3. COMPTEUR ANIMÉ POUR LES STATS ────────────────────
  function initCounters() {
    const counters = document.querySelectorAll('.stat-num, [style*="font-size:2.8rem"], [style*="font-size:2rem"]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const text = el.textContent.trim();
        const num = parseInt(text.replace(/\D/g, ''));
        if (!num || num > 2100 || el.dataset.counted) return;
        el.dataset.counted = '1';
        const suffix = text.replace(/[\d]/g, '').trim();
        let start = 0;
        const duration = 1500;
        const step = 16;
        const increment = num / (duration / step);
        const timer = setInterval(() => {
          start += increment;
          if (start >= num) {
            el.textContent = num + suffix;
            clearInterval(timer);
          } else {
            el.textContent = Math.floor(start) + suffix;
          }
        }, step);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => observer.observe(el));
  }

  // ── 4. PARALLAX LÉGER SUR LE HERO ───────────────────────
  function initParallax() {
    const hero = document.querySelector('.hero-slider, .formations-hero, .page-hero');
    if (!hero) return;
    window.addEventListener('scroll', () => {
      const scroll = window.scrollY;
      if (scroll < window.innerHeight) {
        const imgs = hero.querySelectorAll('.slide.active img, .hero-img');
        imgs.forEach(img => {
          img.style.transform = `scale(1.06) translateY(${scroll * 0.2}px)`;
        });
      }
    }, { passive: true });
  }

  // ── 5. NAVBAR ACTIVE LINK ───────────────────────────────
  function initActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-menu a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (path.includes(href.replace('.html', '')) && href !== '#') {
        a.classList.add('active');
      }
    });
  }

  // ── 6. IMAGE LAZY LOAD AVEC FADE ────────────────────────
  function initLazyLoad() {
    const imgs = document.querySelectorAll('img[loading="lazy"]');
    imgs.forEach(img => {
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.5s ease';
      if (img.complete) {
        img.style.opacity = '1';
      } else {
        img.addEventListener('load', () => {
          img.style.opacity = '1';
        });
      }
    });
  }

  // ── 7. SMOOTH SCROLL SUR LIENS ANCRES ───────────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ── 8. CURSOR PERSONNALISÉ (desktop) ────────────────────
  function initCursor() {
    if (window.innerWidth < 768) return;
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    cursor.style.cssText = `
      position:fixed;width:10px;height:10px;border-radius:50%;
      background:#CC0000;pointer-events:none;z-index:99999;
      transition:transform 0.15s ease,width 0.2s ease,height 0.2s ease,opacity 0.2s;
      transform:translate(-50%,-50%);opacity:0;
    `;
    const ring = document.createElement('div');
    ring.id = 'cursor-ring';
    ring.style.cssText = `
      position:fixed;width:32px;height:32px;border-radius:50%;
      border:1.5px solid rgba(204,0,0,0.5);pointer-events:none;z-index:99998;
      transition:transform 0.35s ease,width 0.2s ease,height 0.2s ease,opacity 0.2s;
      transform:translate(-50%,-50%);opacity:0;
    `;
    document.body.appendChild(cursor);
    document.body.appendChild(ring);

    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.opacity = '1';
      ring.style.opacity = '1';
      cursor.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
      setTimeout(() => {
        ring.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
      }, 60);
    });

    document.querySelectorAll('a, button, .product-card, .gallery-item').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.width = '14px';
        cursor.style.height = '14px';
        ring.style.width = '44px';
        ring.style.height = '44px';
        ring.style.borderColor = 'rgba(204,0,0,0.8)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.width = '10px';
        cursor.style.height = '10px';
        ring.style.width = '32px';
        ring.style.height = '32px';
        ring.style.borderColor = 'rgba(204,0,0,0.5)';
      });
    });
  }

  // ── 9. TYPEWRITER SUR LE HERO ───────────────────────────
  function initTypewriter() {
    const el = document.querySelector('.hero-tagline, .slide.active .slide-subtitle');
    if (!el || el.dataset.typed) return;
    el.dataset.typed = '1';
    const text = el.textContent;
    el.textContent = '';
    let i = 0;
    const type = () => {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(type, 40);
      }
    };
    setTimeout(type, 800);
  }

  // ── 10. PROGRESS BAR PAGE ───────────────────────────────
  function initProgressBar() {
    const bar = document.createElement('div');
    bar.style.cssText = `
      position:fixed;top:0;left:0;height:3px;width:0%;
      background:linear-gradient(90deg,#CC0000,#ff6b6b);
      z-index:9999;transition:width 0.1s linear;border-radius:0 2px 2px 0;
    `;
    document.body.appendChild(bar);
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  // ── INIT ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initRipple();
    initCounters();
    initParallax();
    initActiveNav();
    initLazyLoad();
    initSmoothScroll();
    initCursor();
    initProgressBar();
    // Typewriter avec délai
    setTimeout(initTypewriter, 500);
  });

})();
