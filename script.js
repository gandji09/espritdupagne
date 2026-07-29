
// -- LIGHTBOX -----------------------------------------------
function openLightbox(src, alt) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  if (!lb || !img) {
    // Create lightbox if it doesn't exist on this page
    const el = document.createElement('div');
    el.id = 'lightbox';
    el.className = 'lightbox';
    el.innerHTML = '<span class="close-lightbox" onclick="closeLightbox()">&times;</span><img class="lightbox-content" id="lightboxImg" alt="">';
    el.onclick = e => { if (e.target === el) closeLightbox(); };
    document.body.appendChild(el);
  }
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxImg').alt = alt || '';
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('active');
  document.body.style.overflow = '';
}

// Close lightbox with Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

// Wire existing lightbox close button
document.addEventListener('DOMContentLoaded', () => {
  const close = document.querySelector('.close-lightbox');
  if (close) close.onclick = closeLightbox;
  const lb = document.getElementById('lightbox');
  if (lb) lb.onclick = e => { if (e.target === lb) closeLightbox(); };
});

/* =========================================================
   ESPRIT DU PAGNE - script.js (version propre et stable)
   ========================================================= */

// -- CONFIG ----------------------------------------------
const WHATSAPP = '2290196725416';
const SUPABASE_URL = 'https://xxtkywcchutdhwcjawrz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dGt5d2NjaHV0ZGh3Y2phd3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1Njk3MjAsImV4cCI6MjA5NDE0NTcyMH0.UzDTCSboartGYeiLJ6bo8P-3NibVMVEiBMLgkxdKSRQ';

// -- UTILS ------------------------------------------------
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmt = n => new Intl.NumberFormat('fr-FR').format(n);
const fmtDate = d => new Date(d).toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'});

// --  TAT -------------------------------------------------
let sb = null;
let panier = JSON.parse(localStorage.getItem('panier') || '[]');
let paymentMethod = 'momo';

// -- SUPABASE ---------------------------------------------
function initSupabase() {
  return new Promise(resolve => {
    if (sb) return resolve(sb);
    if (window.supabase) {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return resolve(sb);
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = () => {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      resolve(sb);
    };
    script.onerror = () => {
      console.error('Supabase CDN indisponible');
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

// -- TOAST -------------------------------------------------
function toast(msg, type = 'success') {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(20px);background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:50px;font-size:.9rem;font-weight:500;z-index:9999;opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.background = type === 'error' ? '#CC0000' : '#1a1a1a';
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3000);
}

// -- NAV ---------------------------------------------------
function initNav() {
  const toggle = $('#menuToggle');
  const menu = $('#navMenu');
  if (!toggle || !menu) return;

  toggle.onclick = e => {
    e.stopPropagation();
    menu.classList.toggle('active');
  };

  menu.querySelectorAll('a').forEach(a => {
    a.onclick = () => menu.classList.remove('active');
  });

  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && e.target !== toggle) {
      menu.classList.remove('active');
    }
  });

  window.addEventListener('scroll', () => {
    const nav = $('.navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// -- SLIDER -----------------------------------------------
function initSlider() {
  const slides = $$('.slide');
  if (!slides.length) return;
  let cur = 0;
  const go = i => {
    slides[cur].classList.remove('active');
    cur = (i + slides.length) % slides.length;
    slides[cur].classList.add('active');
  };
  setInterval(() => go(cur + 1), 5000);
  $('.slider-prev') && ($('.slider-prev').onclick = () => go(cur - 1));
  $('.slider-next') && ($('.slider-next').onclick = () => go(cur + 1));
}

// -- PANIER ------------------------------------------------
function initCart() {
  updateCartCount();
  const icon = $('#cartIcon');
  if (icon) icon.addEventListener('click', e => { e.preventDefault(); openCart(); });
}

function openCart() {
  renderCart();
  $('#cartDrawer') .classList.add('open');
  $('#cartOverlay') .classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  $('#cartDrawer') .classList.remove('open');
  $('#cartOverlay') .classList.remove('open');
  document.body.style.overflow = '';
}

function selectPay(btn) {
  $$('.cart-pay-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  paymentMethod = btn.dataset.pay;
}

function addToCart(id) {
  const p = window._PRODUITS .find(x => String(x.id) === String(id));
  if (!p) return;
  const ex = panier.find(x => String(x.id) === String(id));
  if (ex) ex.qty++;
  else panier.push({ ...p, qty: 1 });
  localStorage.setItem('panier', JSON.stringify(panier));
  updateCartCount();
  toast('  ' + p.nom + ' ajoute au panier');
  openCart();
}

function changeQty(id, delta) {
  const item = panier.find(x => String(x.id) === String(id));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) panier = panier.filter(x => String(x.id) !== String(id));
  localStorage.setItem('panier', JSON.stringify(panier));
  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  panier = panier.filter(x => String(x.id) !== String(id));
  localStorage.setItem('panier', JSON.stringify(panier));
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const total = panier.reduce((s, x) => s + x.qty, 0);
  $$('.cart-count').forEach(el => el.textContent = total);
}

function renderCart() {
  const body = $('#cartDrawerBody');
  const footer = $('#cartDrawerFooter');
  const count = $('#cartItemCount');
  if (!body) return;
  const total = panier.reduce((s, x) => s + x.qty, 0);
  if (count) count.textContent = total === 0 ? '0 article' : total === 1 ? '1 article' : total + ' articles';
  if (!panier.length) {
    body.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#888">
      <i class="fas fa-cart-shopping" style="font-size:3rem;opacity:.2;display:block;margin-bottom:16px"></i>
      <p>Votre panier est vide</p>
    </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }
  if (footer) footer.style.display = 'block';
  body.innerHTML = panier.map(p => `
    <div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid #eee;align-items:flex-start">
      ${p.image ? `<img src="${p.image}" style="width:70px;height:70px;object-fit:cover;border-radius:10px;flex-shrink:0" alt="">` : `<div style="width:70px;height:70px;background:#f5f5f5;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0"> </div>`}
      <div style="flex:1">
        <div style="font-weight:600;font-size:.92rem">${p.nom}</div>
        <div style="font-size:.8rem;color:#888;margin-bottom:8px">${p.categorie || ''}</div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;border:1.5px solid #eee;border-radius:8px;overflow:hidden">
            <button onclick="changeQty('${p.id}',-1)" style="width:30px;height:30px;border:none;background:#f9f9f9;cursor:pointer;font-size:1rem"> </button>
            <span style="width:30px;text-align:center;font-weight:600;font-size:.9rem">${p.qty}</span>
            <button onclick="changeQty('${p.id}',1)" style="width:30px;height:30px;border:none;background:#f9f9f9;cursor:pointer;font-size:1rem">+</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-weight:700;color:#CC0000">${fmt(p.prix * p.qty)} FCFA</span>
            <button onclick="removeFromCart('${p.id}')" style="background:none;border:none;color:#ccc;cursor:pointer;font-size:.9rem"> </button>
          </div>
        </div>
      </div>
    </div>`).join('');
  const totalPrix = panier.reduce((s, p) => s + p.prix * p.qty, 0);
  const sub = $('#cartSubtotal'); if (sub) sub.textContent = fmt(totalPrix) + ' FCFA';
  const tot = $('#cartTotalDrawer'); if (tot) tot.textContent = fmt(totalPrix) + ' FCFA';
}

// -- CHECKOUT ---------------------------------------------
async function checkout() {
  if (!panier.length) { toast('Votre panier est vide', 'error'); return; }
  const nom = prompt('Votre nom complet  ');
  if (!nom) return;
  const tel = prompt('Votre numero de telephone  ');
  if (!tel) return;
  const adresse = prompt('Votre adresse de livraison  ') || '';
  const btn = $('#checkoutBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...'; }
  if (!sb) await initSupabase();
  const total = panier.reduce((s, p) => s + p.prix * p.qty, 0);
  const { error } = await sb.from('commandes').insert({
    client_nom: nom, client_telephone: tel, client_adresse: adresse,
    articles: panier.map(p => ({ id: p.id, nom: p.nom, prix: p.prix, qty: p.qty })),
    total, mode_paiement: paymentMethod, statut: 'en_attente'
  });
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Passer commande'; }
  if (error) { toast('Erreur: ' + error.message, 'error'); return; }
  toast('  Commande enregistree ! Nous vous contacterons.');
  panier = []; localStorage.removeItem('panier');
  updateCartCount();
  closeCart();
}

// -- PRODUITS ---------------------------------------------
function productCard(p) {
  const waMsg = encodeURIComponent('Bonjour, je suis interesse(e) par : ' + p.nom + ' (' + fmt(p.prix) + ' FCFA)');
  return `<div class="product-card" data-cat="${(p.categorie||'').toLowerCase()}">
    ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
    <div class="product-image-wrap" onclick="p_zoom(this)" style="cursor:zoom-in">
      ${p.image_url
        ? `<img src="${p.image_url}" alt="${p.nom}" loading="lazy">`
        : `<div class="product-no-img"><i class="fas fa-shirt"></i></div>`}
      <div class="product-zoom-hint"><i class="fas fa-magnifying-glass-plus"></i></div>
    </div>
    <div class="product-body">
      <span class="product-cat-tag">${p.categorie || ''}</span>
      <h3 class="product-name">${p.nom}</h3>
      ${p.description ? `<p class="product-desc">${p.description}</p>` : ''}
      <div class="product-price-row">
        <span class="product-price">${fmt(p.prix)} <small>FCFA</small></span>
      </div>
      <div class="product-actions">
        <button class="btn-add-cart" onclick="addToCart('${p.id}')">
          <i class="fas fa-cart-plus"></i> Ajouter au panier
        </button>
        <a href="https://wa.me/${WHATSAPP}?text=${waMsg}" target="_blank" class="btn-whatsapp-product" title="Commander via WhatsApp">
          <i class="fab fa-whatsapp"></i>
        </a>
      </div>
    </div>
  </div>`;
}

function p_zoom(el) {
  const img = el.querySelector('img');
  if (img) openLightbox(img.src, img.alt);
}

// -- PAGE ACCUEIL : FEATURED PRODUCTS ---------------------
async function loadFeatured() {
  const el = $('#featuredProducts');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:40px;color:#888"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem"></i></div>';
  if (!sb) await initSupabase();
  if (!sb) { el.innerHTML = '<p style="text-align:center;color:#888">Connexion impossible</p>'; return; }
  const { data, error } = await sb.from('produits').select('*').eq('actif', true).order('created_at', { ascending: false }).limit(4);
  if (error || !data .length) { el.innerHTML = '<p style="text-align:center;padding:40px;color:#888">Aucun produit pour le moment</p>'; return; }
  window._PRODUITS = (window._PRODUITS || []);
  data.forEach(p => { if (!window._PRODUITS.find(x => x.id === p.id)) window._PRODUITS.push(p); });
  el.innerHTML = data.map(productCard).join('');
}

// -- PAGE BOUTIQUE -----------------------------------------
async function loadBoutique() {
  const el = $('#allProducts');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:60px;grid-column:1/-1;color:#888"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem"></i><p style="margin-top:12px">Chargement des produits...</p></div>';
  if (!sb) await initSupabase();
  if (!sb) { el.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:40px;color:#888">Connexion impossible. Verifiez votre reseau.</p>'; return; }
  const { data, error } = await sb.from('produits').select('*').eq('actif', true).order('created_at', { ascending: false });
  if (error) { el.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:#888">Erreur: ' + error.message + '</p>'; return; }
  window._PRODUITS = data || [];
  renderBoutique('all');
  // Filtres
  $$('.filter-btn').forEach(btn => {
    btn.onclick = () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderBoutique(btn.dataset.filter || 'all');
    };
  });
}

function renderBoutique(filter) {
  const el = $('#allProducts');
  if (!el) return;
  let list = window._PRODUITS || [];
  if (filter && filter !== 'all') {
    list = list.filter(p => {
      const cat = (p.categorie || '').toLowerCase().trim();
      const f = filter.toLowerCase().trim();
      if (f === 'femmes' || f === 'femme') return cat.includes('femme') || cat.includes('robe') || cat.includes('ensemble');
      if (f === 'hommes' || f === 'homme') return cat.includes('homme');
      if (f === 'enfants' || f === 'enfant') return cat.includes('enfant');
      if (f === 'boubous' || f === 'boubou') return cat.includes('boubou');
      if (f === 'accessoires') return cat.includes('accessoire');
      return cat.includes(f);
    });
  }
  if (!list.length) { el.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:40px;color:#888">Aucun produit dans cette categorie</p>'; return; }
  el.innerHTML = list.map(productCard).join('');
}

// -- PAGE GALERIE ------------------------------------------
async function loadHomeGalerie() {
  const el = $('#homeGalerie');
  if (!el) return;
  if (!sb) await initSupabase();
  if (!sb) return;
  const { data } = await sb.from('galerie').select('*').order('ordre').limit(6);
  if (!data || !data.length) { el.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:#888">Galerie bientôt disponible</p>'; return; }
  el.innerHTML = data.map(g => `
    <div style="aspect-ratio:1;border-radius:12px;overflow:hidden;cursor:zoom-in" onclick="openLightbox('${g.image_url}','${g.titre||''}')">
      <img src="${g.image_url}" alt="${g.titre||''}" loading="lazy" style="width:100%;height:100%;object-fit:cover;transition:transform .3s">
    </div>`).join('');
}

async function loadGalerie() {
  const el = $('#galleryGrid') || $('#galerieGrid');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:40px;grid-column:1/-1;color:#888"><i class="fas fa-spinner fa-spin"></i></div>';
  if (!sb) await initSupabase();
  if (!sb) return;
  const { data } = await sb.from('galerie').select('*').order('ordre');
  if (!data .length) { el.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:#888">Galerie bientot disponible</p>'; return; }
  el.innerHTML = data.map(g => `
    <div class="gallery-item" style="cursor:zoom-in" onclick="openLightbox('${g.image_url}', '${g.titre || ''}')">
      <img src="${g.image_url}" alt="${g.titre || ''}" loading="lazy">
      ${g.titre ? `<div class="gallery-caption">${g.titre}</div>` : ''}
    </div>`).join('');
}

// -- PAGE BLOG ---------------------------------------------
async function loadBlog() {
  const el = $('#postsGrid') || $('#blogList');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:40px;color:#888"><i class="fas fa-spinner fa-spin"></i></div>';
  if (!sb) await initSupabase();
  if (!sb) return;
  const { data } = await sb.from('articles').select('*').eq('publie', true).order('created_at', { ascending: false });
  if (!data .length) {
    el.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#888"><i class="fas fa-pen-nib" style="font-size:2rem;opacity:.2;display:block;margin-bottom:12px"></i><p>Aucun article pour le moment</p></div>';
    return;
  }
  el.innerHTML = data.map(a => `
    <article class="post-card">
      <div class="post-card-img">
        ${a.image_url ? `<img src="${a.image_url}" alt="${a.titre}" loading="lazy">` : `<div style="height:100%;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:2rem">  </div>`}
      </div>
      <div class="post-card-body">
        <div class="post-card-meta">${fmtDate(a.created_at)}</div>
        <h3>${a.titre}</h3>
        <p>${a.extrait || ''}</p>
      </div>
    </article>`).join('');
}

// -- T MOIGNAGES -------------------------------------------
let noteTemo = 5;

async function loadTemoignages() {
  const el = $('#testimonialsList');
  if (!el) return;
  if (!sb) await initSupabase();
  if (!sb) return;
  const { data } = await sb.from('temoignages').select('*').eq('approuve', true).order('created_at', { ascending: false });
  if (!data .length) {
    el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888"><p>Soyez le premier a temoigner !</p></div>';
    return;
  }
  el.innerHTML = data.map(t => `
    <div class="testimonial-card">
      <div style="color:#F59E0B;margin-bottom:8px">${' '.repeat(t.note || 5)}</div>
      <p>"${t.message}"</p>
      <div class="testimonial-author">
        <div style="width:44px;height:44px;border-radius:50%;background:#CC0000;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700">${t.nom.charAt(0)}</div>
        <div><strong>${t.nom}</strong><span>${t.ville ? 'Cliente - ' + t.ville : 'Cliente'}</span></div>
      </div>
    </div>`).join('');
}

function initTemoignageForm() {
  const stars = $$('#starRating .star');
  stars.forEach(s => {
    s.onclick = () => {
      noteTemo = +s.dataset.val;
      stars.forEach(x => x.classList.toggle('active', +x.dataset.val <= noteTemo));
    };
  });
  const f = $('#temoignageForm');
  if (!f) return;
  f.onsubmit = async e => {
    e.preventDefault();
    const nom = $('#temoNom').value.trim();
    const msg = $('#temoMessage').value.trim();
    if (!nom || !msg) { toast('Remplissez tous les champs', 'error'); return; }
    if (!sb) await initSupabase();
    const { error } = await sb.from('temoignages').insert({ nom, ville: $('#temoVille') .value.trim() || null, message: msg, note: noteTemo, approuve: false });
    if (error) { toast('Erreur: ' + error.message, 'error'); return; }
    toast('  Merci ! Votre temoignage sera affiche apres validation.');
    f.reset(); noteTemo = 5; stars.forEach(s => s.classList.add('active'));
  };
}

// -- CONTACT -----------------------------------------------
function initContact() {
  const f = $('#contactForm');
  if (!f) return;
  f.onsubmit = async e => {
    e.preventDefault();
    const nom = $('#contactNom') .value.trim();
    const email = $('#contactEmail') .value.trim();
    const sujet = $('#contactSujet') .value.trim();
    const message = $('#contactMessage') .value.trim();
    if (!nom || !email || !message) { toast('Remplissez tous les champs', 'error'); return; }
    const btn = f.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi...'; }
    if (!sb) await initSupabase();
    const { error } = await sb.from('messages_contact').insert({ nom, email, sujet: sujet || null, message, lu: false });
    if (btn) { btn.disabled = false; btn.textContent = 'Envoyer'; }
    if (error) { toast('Erreur: ' + error.message, 'error'); return; }
    toast('  Message envoye ! Nous vous repondrons bientot.');
    f.reset();
  };
}

// -- FORMATIONS / INSCRIPTION -----------------------------
function initInscription() {
  const f = $('#inscriptionForm');
  if (!f) return;
  f.onsubmit = async e => {
    e.preventDefault();
    const nom = $('#inscritNom') .value.trim();
    const email = $('#inscritEmail') .value.trim();
    const tel = $('#inscritTelephone') .value.trim();
    const formation = $('#inscriptionModal') .dataset.formation || '';
    if (!nom || !email || !tel) { toast('Remplissez tous les champs', 'error'); return; }
    const btn = f.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi...'; }
    if (!sb) await initSupabase();
    const { error } = await sb.from('inscriptions_formation').insert({ nom, email, telephone: tel, formation, statut: 'en_attente' });
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmer'; }
    if (error) { toast('Erreur: ' + error.message, 'error'); return; }
    toast('  Inscription enregistree !');
    f.reset();
    $('#inscriptionModal') .classList.remove('active');
  };
}

// -- NEWSLETTER --------------------------------------------
async function submitNewsletter(e) {
  e.preventDefault();
  const email = $('#newsletterEmail') .value.trim();
  if (!email) return;
  if (!sb) await initSupabase();
  const { error } = await sb.from('newsletter').insert({ email });
  if (error) {
    if (error.code === '23505') { toast('Vous etes deja inscrit !'); return; }
    toast('Erreur: ' + error.message, 'error'); return;
  }
  toast('  Inscription confirmee !');
  e.target.reset();
}

// -- INIT PRINCIPAL ----------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  // UI immediate (pas besoin de Supabase)
  initNav();
  initSlider();
  initCart();
  initContact();
  initInscription();
  initTemoignageForm();

  // Connexion Supabase
  await initSupabase();

  // Chargement des donnees selon la page
  loadFeatured();
  loadBoutique();
  loadGalerie();
  loadHomeGalerie();
  loadBlog();
  loadTemoignages();

  // Scroll top
  let lastScroll = 0;
  const st = document.createElement('button');
  st.id = 'scrollTop';
  st.className = 'scroll-top';
  st.innerHTML = '<i class="fas fa-chevron-up"></i>';
  st.setAttribute('aria-label', 'Retour en haut');
  st.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(st);

  window.addEventListener('scroll', () => {
    const cur = window.scrollY;
    const btn = $('#scrollTop');
    if (btn) {
      // Visible seulement si on scroll vers le haut ET on est loin du top
      const scrollingUp = cur < lastScroll;
      btn.classList.toggle('visible', scrollingUp && cur > 300);
    }
    lastScroll = cur;
  }, { passive: true });
});
