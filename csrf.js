/* ============================================================
   ESPRIT DU PAGNE — csrf.js
   Protection CSRF pour tous les formulaires
   ============================================================ */

(function() {
  'use strict';

  // Générer un token CSRF unique par session
  function generateToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }

  // Récupérer ou créer le token de session
  function getCSRFToken() {
    let token = sessionStorage.getItem('csrf_token');
    if (!token) {
      token = generateToken();
      sessionStorage.setItem('csrf_token', token);
    }
    return token;
  }

  // Vérifier le token
  function verifyCSRFToken(token) {
    const stored = sessionStorage.getItem('csrf_token');
    return stored && token === stored;
  }

  // Ajouter le token à tous les formulaires
  function protectForms() {
    const token = getCSRFToken();

    document.querySelectorAll('form').forEach(form => {
      // Ajouter champ caché avec token
      if (!form.querySelector('[name="csrf_token"]')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'csrf_token';
        input.value = token;
        form.appendChild(input);
      }

      // Intercepter la soumission
      form.addEventListener('submit', function(e) {
        const formToken = form.querySelector('[name="csrf_token"]')?.value;
        if (!verifyCSRFToken(formToken)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          console.error('CSRF: Token invalide');
          // Afficher message d'erreur
          const msg = document.createElement('p');
          msg.textContent = 'Erreur de sécurité. Veuillez rafraîchir la page.';
          msg.style.cssText = 'color:red;font-size:.85rem;margin-top:8px';
          form.appendChild(msg);
          setTimeout(() => msg.remove(), 4000);
          return false;
        }
        // Regénérer le token après soumission réussie
        const newToken = generateToken();
        sessionStorage.setItem('csrf_token', newToken);
        // Mettre à jour tous les champs cachés
        document.querySelectorAll('[name="csrf_token"]').forEach(el => {
          el.value = newToken;
        });
      }, true); // capture phase pour intercepter avant script.js
    });
  }

  // Rate limiting côté client
  const submitTimes = {};
  function rateLimitForm(formId, limitMs = 30000) {
    const now = Date.now();
    const last = submitTimes[formId] || 0;
    if (now - last < limitMs) {
      const remaining = Math.ceil((limitMs - (now - last)) / 1000);
      return { blocked: true, remaining };
    }
    submitTimes[formId] = now;
    return { blocked: false };
  }

  // Appliquer rate limiting sur les formulaires sensibles
  function applyRateLimit() {
    const forms = {
      'contactForm': 30000,       // 30 secondes entre chaque envoi
      'newsletterForm': 60000,    // 60 secondes
      'inscriptionForm': 60000,
      'temoignageForm': 120000,   // 2 minutes
    };

    Object.entries(forms).forEach(([id, limit]) => {
      const form = document.getElementById(id);
      if (!form) return;

      form.addEventListener('submit', function(e) {
        const check = rateLimitForm(id, limit);
        if (check.blocked) {
          e.preventDefault();
          e.stopImmediatePropagation();
          // Trouver ou créer message d'erreur
          let msg = form.querySelector('.rate-limit-msg');
          if (!msg) {
            msg = document.createElement('p');
            msg.className = 'rate-limit-msg';
            msg.style.cssText = 'color:#CC0000;font-size:.85rem;margin-top:8px;text-align:center';
            form.appendChild(msg);
          }
          msg.textContent = `Veuillez attendre ${check.remaining}s avant de renvoyer.`;
          setTimeout(() => { if(msg) msg.textContent = ''; }, 3000);
          return false;
        }
      }, true);
    });
  }

  // Sanitiser les inputs contre XSS
  function sanitizeInputs() {
    document.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(input => {
      input.addEventListener('input', function() {
        // Bloquer caractères dangereux en temps réel
        const dangerous = /<script|javascript:|on\w+=/gi;
        if (dangerous.test(this.value)) {
          this.value = this.value.replace(dangerous, '');
        }
      });
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', function() {
    protectForms();
    applyRateLimit();
    sanitizeInputs();
    
    // Exposer pour vérification externe si besoin
    window._csrf = { getToken: getCSRFToken, verify: verifyCSRFToken };
  });

})();
