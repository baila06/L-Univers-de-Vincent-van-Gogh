/* =========================================================
   1. EFFET D'APPARITION AU SCROLL
   (placé en premier pour fonctionner même si le reste a un souci)
   ========================================================= */
document.documentElement.classList.add('js');

const sectionGalerie = document.getElementById('galerie');
if (sectionGalerie) {
  // La galerie rejoue l'effet à chaque passage
  new IntersectionObserver((entrees) => {
    entrees.forEach(e => e.target.classList.toggle('visible', e.isIntersecting));
  }, { threshold: 0.2 }).observe(sectionGalerie);
}

// Les autres blocs (.reveal) apparaissent une seule fois
const obsReveal = new IntersectionObserver((entrees) => {
  entrees.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); obsReveal.unobserve(e.target); }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal:not([data-manuel])').forEach(el => obsReveal.observe(el));


/* =========================================================
   1b. ACCUEIL : CIEL ÉTOILÉ CALME (étoiles qui scintillent doucement)
   ========================================================= */
(function ciel() {
  const hero = document.getElementById('accueil');
  const cv = document.getElementById('ciel');
  if (!hero || !cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, etoiles = [], actif = true, filante = null, prochaine = 4000;

  function dimensionner() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(220, Math.round(W * H / 5500));
    etoiles = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.92,
      r: 0.4 + Math.random() * 1.3,
      vit: 0.0004 + Math.random() * 0.0012,   // vitesse du scintillement
      ph: Math.random() * 6.28,
      chaud: Math.random() < 0.18             // quelques étoiles dorées
    }));
  }

  function dessiner(t) {
    ctx.clearRect(0, 0, W, H);
    for (const e of etoiles) {
      const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * e.vit + e.ph));
      ctx.globalAlpha = a;
      ctx.fillStyle = e.chaud ? '#ffe9a0' : '#e6edff';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.283); ctx.fill();
      if (e.r > 1.2) {                         // petit halo sur les plus grosses
        ctx.globalAlpha = a * 0.18;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 3.2, 0, 6.283); ctx.fill();
      }
    }
    // Étoile filante rare et discrète
    if (filante) {
      const k = (t - filante.t0) / 1100;
      if (k >= 1) filante = null;
      else {
        const x = filante.x + filante.dx * k, y = filante.y + filante.dy * k;
        const g = ctx.createLinearGradient(x, y, x - filante.dx * 0.18, y - filante.dy * 0.18);
        g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 1 - k * k;
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - filante.dx * 0.18, y - filante.dy * 0.18); ctx.stroke();
      }
    } else if (t > prochaine) {
      filante = { t0: t, x: W * (0.1 + Math.random() * 0.5), y: H * (0.05 + Math.random() * 0.3), dx: W * 0.35, dy: H * 0.2 };
      prochaine = t + 9000 + Math.random() * 6000;
    }
    ctx.globalAlpha = 1;
  }

  function boucle(t) {
    if (actif) dessiner(t);
    requestAnimationFrame(boucle);
  }

  dimensionner();
  window.addEventListener('resize', () => { dimensionner(); if (reduit) dessiner(0); });
  if (reduit) { dessiner(0); return; }
  new IntersectionObserver(([e]) => { actif = e.isIntersecting; }).observe(hero);
  requestAnimationFrame(boucle);
})();


/* =========================================================
   1c. TRANSITION : LA PEINTURE QUI COULE (liée au scroll)
   ========================================================= */
(function coulure() {
  const svg = document.getElementById('coulure-svg');
  const hero = document.getElementById('accueil');
  if (!svg || !hero) return;
  const NS = 'http://www.w3.org/2000/svg';
  const COULEUR = '#14234f';
  let drips = [], W = 0, hauteurSvg = 0;

  // Générateur pseudo-aléatoire fixe : les coulures sont toujours les mêmes
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

  // Bord irrégulier de la "lèvre" de peinture
  const base = x => 10 + 6 * Math.sin(x * 0.013) + 4 * Math.sin(x * 0.041);

  function el(nom, attrs) {
    const e = document.createElementNS(NS, nom);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function construire() {
    W = document.documentElement.clientWidth;
    const rand = rng(42);
    const nb = Math.max(7, Math.min(26, Math.round(W / 60)));
    const maxLen = 150;
    hauteurSvg = 70 + 20 + maxLen + 30;
    svg.setAttribute('width', W);
    svg.setAttribute('height', hauteurSvg);
    svg.setAttribute('viewBox', `0 -70 ${W} ${hauteurSvg}`);
    svg.innerHTML = '';

    const defs = el('defs', {});
    const grad = el('linearGradient', { id: 'gp', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: maxLen + 30 });
    grad.appendChild(el('stop', { offset: '0', 'stop-color': COULEUR }));
    grad.appendChild(el('stop', { offset: '1', 'stop-color': '#27489a' }));
    defs.appendChild(grad); svg.appendChild(defs);

    // Lèvre de peinture continue (recouvre le bas de l'accueil)
    let d = `M0,-70 H${W} V${base(W)}`;
    for (let x = W; x >= 0; x -= 8) d += ` L${x},${base(x).toFixed(1)}`;
    d += ' Z';
    svg.appendChild(el('path', { d, fill: COULEUR }));

    drips = [];
    for (let i = 0; i < nb; i++) {
      const cx = (i + 0.2 + rand() * 0.6) * (W / nb);
      const h = 5 + rand() * 7;                 // demi-largeur de la coulure
      const r = h * (1.25 + rand() * 0.35);     // rayon de la goutte au bout
      const f = h * 0.9;                        // raccord arrondi en haut
      const max = 35 + Math.pow(rand(), 0.8) * (maxLen - 35);
      const delai = rand() * 0.5;
      const y0 = base(cx) - 2;
      const g = el('g', { fill: 'url(#gp)' });
      const tige = el('rect', { x: cx - h, width: 2 * h, rx: 0 });
      const bulbe = el('circle', { cx, r });
      const fg = el('path', { fill: COULEUR });
      const fd = el('path', { fill: COULEUR });
      const reflet = el('rect', { x: cx - h * 0.5, width: h * 0.28, fill: '#9bbcff', opacity: 0.22, rx: h * 0.14 });
      fg.setAttribute('d', `M${cx - h - f},${y0} H${cx - h} V${y0 + f} Q${cx - h},${y0} ${cx - h - f},${y0} Z`);
      fd.setAttribute('d', `M${cx + h + f},${y0} H${cx + h} V${y0 + f} Q${cx + h},${y0} ${cx + h + f},${y0} Z`);
      g.append(fg, fd, tige, bulbe, reflet);
      svg.appendChild(g);
      drips.push({ cx, h, r, max, delai, y0, tige, bulbe, reflet, g });
    }
    maj();
  }

  const ease = t => 1 - Math.pow(1 - t, 2.2);   // démarrage rapide, fin visqueuse

  function maj() {
    const vh = window.innerHeight;
    const bas = hero.getBoundingClientRect().bottom;
    // 0 = le bas de l'accueil entre à l'écran, 1 = il est presque en haut
    const p = Math.min(1, Math.max(0, (vh - bas) / (vh * 0.85)));
    for (const dr of drips) {
      const local = Math.min(1, Math.max(0, (p - dr.delai * 0.6) / 0.55));
      const L = dr.max * ease(local);
      dr.g.style.display = local <= 0 ? 'none' : '';
      const bulbeR = dr.r * Math.min(1, local * 5);
      dr.tige.setAttribute('y', dr.y0);
      dr.tige.setAttribute('height', Math.max(0, L));
      dr.bulbe.setAttribute('cy', dr.y0 + L);
      dr.bulbe.setAttribute('r', bulbeR);
      dr.reflet.setAttribute('y', dr.y0 + 12);
      dr.reflet.setAttribute('height', Math.max(0, L - 12));
    }
  }

  let attente = false;
  function surScroll() {
    if (attente) return;
    attente = true;
    requestAnimationFrame(() => { attente = false; maj(); });
  }

  construire();
  window.addEventListener('scroll', surScroll, { passive: true });
  window.addEventListener('resize', construire);
})();


/* =========================================================
   1e. TRANSITIONS EN POINTILLÉS (liées au scroll)
   - galerie -> réservation : l'étoile tombe, la carte s'ouvre en cercle
   - réservation -> plan    : le repère tombe, la carte s'ouvre en cercle
   ========================================================= */
function creerChemin(cfg) {
  const zone = document.getElementById(cfg.zone);
  const svg = document.getElementById(cfg.svg);
  const section = document.getElementById(cfg.section);
  if (!zone || !svg || !section) return;
  const carte = section.querySelector(cfg.carte);
  const NS = 'http://www.w3.org/2000/svg';
  let masque, longueur = 0, pointe, halo, chemin;

  function el(nom, attrs) {
    const e = document.createElementNS(NS, nom);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function construire() {
    const W = document.documentElement.clientWidth;
    const H = zone.clientHeight;
    const X = x => cfg.sens === 1 ? x : W - x;      // miroir du tracé
    const cx = carte ? carte.getBoundingClientRect().left + carte.offsetWidth / 2 : W / 2;
    const d = `M${W / 2},0 C${W / 2},${H * 0.45} ${X(W * 0.1)},${H * 0.15} ${X(W * 0.22)},${H * 0.5} C${X(W * 0.32)},${H * 0.85} ${cx},${H * 0.45} ${cx},${H}`;

    svg.innerHTML = '';
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const defs = el('defs', {});
    const grad = el('linearGradient', { id: cfg.id + 'g', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: H });
    grad.append(el('stop', { offset: '0', 'stop-color': cfg.couleurs[0] }), el('stop', { offset: '1', 'stop-color': cfg.couleurs[1] }));
    const m = el('mask', { id: cfg.id + 'm', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H });
    masque = el('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 16, 'stroke-linecap': 'round' });
    m.appendChild(masque);
    defs.append(grad, m);
    svg.appendChild(defs);

    chemin = el('path', { d, fill: 'none', stroke: `url(#${cfg.id}g)`, 'stroke-width': 4.5,
      'stroke-linecap': 'round', 'stroke-dasharray': '0.1 13', mask: `url(#${cfg.id}m)` });
    svg.appendChild(chemin);
    halo = el('circle', { r: 14, fill: '#f5d76e', opacity: 0.28 });
    pointe = el('circle', { r: 6, fill: '#fff3b8' });
    svg.append(halo, pointe);

    longueur = chemin.getTotalLength();
    masque.setAttribute('stroke-dasharray', longueur);
    maj();
  }

  function maj() {
    const r = zone.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.95 - r.top) / (r.height + vh * 0.3)));
    masque.setAttribute('stroke-dashoffset', longueur * (1 - p));
    const pt = chemin.getPointAtLength(longueur * p);
    pointe.setAttribute('cx', pt.x); pointe.setAttribute('cy', pt.y);
    halo.setAttribute('cx', pt.x); halo.setAttribute('cy', pt.y);
    const vis = p > 0.01 && p < 0.995 ? 1 : 0;
    pointe.style.opacity = vis; halo.style.opacity = vis ? 0.28 : 0;
    if (p >= 0.97) section.classList.add('arrive');        // arrivée : l'objet tombe, la carte s'ouvre
    else if (p < 0.6) section.classList.remove('arrive');
  }

  let attente = false;
  window.addEventListener('scroll', () => {
    if (attente) return;
    attente = true;
    requestAnimationFrame(() => { attente = false; maj(); });
  }, { passive: true });
  window.addEventListener('resize', construire);
  window.addEventListener('load', construire);
  construire();
}

creerChemin({ zone: 'chemin-resa', svg: 'chemin-resa-svg', section: 'evenement', carte: '.evt-carte',
              sens: -1, id: 'cr', couleurs: ['#7a5a00', '#f5d76e'] });
creerChemin({ zone: 'chemin', svg: 'chemin-svg', section: 'plan', carte: '.plan-carte',
              sens: 1, id: 'cp', couleurs: ['#f5d76e', '#7a5a00'] });


/* =========================================================
   1f. MENU HAMBURGER
   ========================================================= */
(function menuHamburger() {
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const fond = document.getElementById('menu-fond');
  if (!burger || !menu) return;
  const racine = document.documentElement;

  function ouvrir(oui) {
    racine.classList.toggle('menu-ouvert', oui);
    burger.setAttribute('aria-expanded', oui);
  }

  burger.addEventListener('click', () => ouvrir(!racine.classList.contains('menu-ouvert')));
  if (fond) fond.addEventListener('click', () => ouvrir(false));
  // un clic sur un lien referme le menu (puis la page défile vers la section)
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => ouvrir(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') ouvrir(false); });
})();


/* =========================================================
   1g. BARRE DU HAUT : la barre grise disparaît dès qu'on descend
   ========================================================= */
(function barreFlottante() {
  const racine = document.documentElement;
  function maj() { racine.classList.toggle('defile', window.scrollY > 30); }
  window.addEventListener('scroll', maj, { passive: true });
  maj();
})();


/* =========================================================
   2. TEXTES DYNAMIQUES (FR / EN)
   ========================================================= */
let lang = 'fr';

const T = {
  fr: {
    choisir: 'Choisissez un créneau',
    restantes: 'places restantes',
    complet: 'Complet',
    erreurChamps: 'Merci de remplir tous les champs avec une adresse e-mail valide.',
    erreurCreneau: 'Merci de choisir un créneau.',
    erreurPlaces: 'Il ne reste que {n} place(s) sur ce créneau.',
    ok: 'Réservation confirmée !',
    detail: '{nom}, {n} place(s) réservée(s) pour le {creneau}. Référence : {ref}.'
  },
  en: {
    choisir: 'Choose a time slot',
    restantes: 'seats left',
    complet: 'Sold out',
    erreurChamps: 'Please fill in all fields with a valid email address.',
    erreurCreneau: 'Please choose a time slot.',
    erreurPlaces: 'Only {n} seat(s) left on this slot.',
    ok: 'Booking confirmed!',
    detail: '{nom}, {n} seat(s) booked for {creneau}. Reference: {ref}.'
  }
};
const fmt = (txt, vars) => txt.replace(/\{(\w+)\}/g, (_, k) => vars[k]);


/* =========================================================
   3. GALERIE (chevalet + flèches)
   ========================================================= */
/* ==========================================================
   >>> ICI : c'est ICI que tu ajoutes tes tableaux <<<
   1. Mets l'image dans le dossier "oeuvres/"
   2. Ajoute un bloc ci-dessous : chemin + titre + description (FR et EN)
   (n'oublie pas la virgule entre les blocs, sauf après le dernier)
   ========================================================== */
const oeuvres = [
  {
    src: 'oeuvres/nuit-etoilee.jpg',
    fr: 'La Nuit étoilée (1889)',
    en: 'The Starry Night (1889)',
    descFr: "Peinte en juin 1889 depuis la fenêtre de sa chambre à l'asile de Saint-Rémy-de-Provence, juste avant le lever du soleil. Le village est en grande partie imaginé, et le ciel tourbillonne en spirales lumineuses. Aujourd'hui conservée au MoMA, à New York.",
    descEn: "Painted in June 1889 from the window of his room at the Saint-Rémy-de-Provence asylum, just before sunrise. The village is largely imagined, and the sky swirls in luminous spirals. Today it is held at MoMA in New York."
  },
  {
    src: 'oeuvres/tournesols.jpg',
    fr: 'Les Tournesols (1888)',
    en: 'Sunflowers (1888)',
    descFr: "Série réalisée à Arles en août 1888 pour décorer la chambre de son ami Gauguin dans la Maison jaune. Le jaune, éclatant et expressif, y devient le symbole de l'amitié et de la lumière du Midi. Plusieurs versions existent, dont une à la National Gallery de Londres et une au Musée Van Gogh d'Amsterdam.",
    descEn: "A series made in Arles in August 1888 to decorate his friend Gauguin's room in the Yellow House. The bold, expressive yellow becomes a symbol of friendship and the light of southern France. Several versions exist, including one at the National Gallery in London and one at the Van Gogh Museum in Amsterdam."
  },
  {
    src: 'oeuvres/chambre-arles.jpg',
    fr: 'La Chambre à Arles (1888)',
    en: 'The Bedroom in Arles (1888)',
    descFr: "Van Gogh peint sa propre chambre dans la Maison jaune, avec des aplats de couleurs pures et une perspective volontairement déformée. Il voulait y exprimer le repos et le calme. Il en a réalisé trois versions, conservées à Amsterdam, à Chicago et au Musée d'Orsay.",
    descEn: "Van Gogh paints his own bedroom in the Yellow House, using flat areas of pure colour and a deliberately distorted perspective. He wanted it to express rest and calm. He made three versions, held in Amsterdam, Chicago and the Musée d'Orsay."
  },
  {
    src: 'oeuvres/cafe-nuit.jpg',
    fr: 'Terrasse du café le soir (1888)',
    en: 'Café Terrace at Night (1888)',
    descFr: "Peinte en septembre 1888 sur la place du Forum, à Arles. C'est la première toile où Van Gogh représente un ciel étoilé. Il peint la nuit sans utiliser de noir, avec des bleus profonds et le jaune chaud des lumières. Elle est conservée au musée Kröller-Müller, aux Pays-Bas.",
    descEn: "Painted in September 1888 on the Place du Forum in Arles. It is the first canvas in which Van Gogh depicts a starry sky. He paints the night without using black, with deep blues and the warm yellow of the lights. It is held at the Kröller-Müller Museum in the Netherlands."
  },
  {
    src: 'oeuvres/champ-ble.jpg',
    fr: 'Champ de blé aux corbeaux (1890)',
    en: 'Wheatfield with Crows (1890)',
    descFr: "Réalisée en juillet 1890 à Auvers-sur-Oise, c'est l'une de ses toutes dernières toiles. Un ciel sombre et orageux, des chemins qui s'égarent et des corbeaux en vol donnent à la scène une intensité dramatique. Elle est conservée au Musée Van Gogh d'Amsterdam.",
    descEn: "Made in July 1890 in Auvers-sur-Oise, it is one of his very last canvases. A dark, stormy sky, paths that lose themselves and crows in flight give the scene a dramatic intensity. It is held at the Van Gogh Museum in Amsterdam."
  },
  {
    src: 'oeuvres/autoportrait.jpg',
    fr: 'Autoportrait (1889)',
    en: 'Self-Portrait (1889)',
    descFr: "Peint à Saint-Rémy-de-Provence à l'automne 1889, cet autoportrait se détache sur un fond bleu animé de volutes. Van Gogh a réalisé de nombreux autoportraits pour étudier la couleur et exprimer son état intérieur. Cette version est conservée au Musée d'Orsay, à Paris.",
    descEn: "Painted in Saint-Rémy-de-Provence in autumn 1889, this self-portrait stands out against a blue background alive with swirls. Van Gogh made many self-portraits to study colour and express his inner state. This version is held at the Musée d'Orsay in Paris."
  }
];

const zone = document.getElementById('zone');
const legende = document.getElementById('legende');
const description = document.getElementById('description');
let index = 0;
let enCours = false;

function creerToile(i) {
  const img = document.createElement('img');
  img.className = 'toile';
  img.src = oeuvres[i].src;
  img.alt = oeuvres[i].fr;
  return img;
}

function majLegende() {
  const o = oeuvres[index];
  legende.textContent = o[lang];
  description.textContent = lang === 'fr' ? o.descFr : o.descEn;
}

// dir = 1 (flèche droite) ou -1 (flèche gauche)
function changer(dir) {
  if (enCours) return;
  enCours = true;
  const decalage = 320;
  const ancienne = zone.querySelector('.toile');
  index = (index + dir + oeuvres.length) % oeuvres.length;

  const apparition = () => {
    const nouvelle = creerToile(index);
    zone.appendChild(nouvelle);
    majLegende();
    // La nouvelle œuvre arrive en allant dans le sens de la flèche et se pose
    nouvelle.animate([
      { transform: `translateX(${-dir * decalage}px) rotate(${-dir * 8}deg)`, opacity: 0 },
      { transform: 'translateX(0) rotate(0deg)', opacity: 1 }
    ], { duration: 600, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' })
      .finished.then(() => { enCours = false; });
  };

  if (ancienne) {
    // L'ancienne repart dans le même sens
    ancienne.animate([
      { transform: 'translateX(0) rotate(0deg)', opacity: 1 },
      { transform: `translateX(${dir * decalage}px) rotate(${dir * 8}deg)`, opacity: 0 }
    ], { duration: 400, easing: 'ease-in', fill: 'forwards' })
      .finished.then(() => { ancienne.remove(); apparition(); });
  } else {
    apparition();
  }
}

document.getElementById('next').addEventListener('click', () => changer(1));
document.getElementById('prev').addEventListener('click', () => changer(-1));

zone.appendChild(creerToile(index));
majLegende();


/* =========================================================
   4. RÉSERVATION DE L'ÉVÉNEMENT
   ========================================================= */
/* >>> ICI : tu peux changer les dates et le nombre de places <<< */
const creneaux = [
  { id: 's1', fr: 'sam. 14 nov. 2026 à 19h00', en: 'Sat 14 Nov 2026 at 7:00 pm', places: 18 },
  { id: 's2', fr: 'sam. 14 nov. 2026 à 21h00', en: 'Sat 14 Nov 2026 at 9:00 pm', places: 12 },
  { id: 's3', fr: 'sam. 21 nov. 2026 à 19h00', en: 'Sat 21 Nov 2026 at 7:00 pm', places: 24 },
  { id: 's4', fr: 'sam. 5 déc. 2026 à 19h00',  en: 'Sat 5 Dec 2026 at 7:00 pm',  places: 0 }
];

const form = document.getElementById('form-resa');
const selCreneau = document.getElementById('resa-creneau');
const msg = document.getElementById('resa-msg');
let derniereResa = null;   // pour retraduire le message de confirmation

// Places déjà réservées (mémorisées dans le navigateur)
function lireReservees() {
  try { return JSON.parse(localStorage.getItem('vg_reservees') || '{}'); }
  catch (e) { return {}; }
}
function ecrireReservees(obj) {
  try { localStorage.setItem('vg_reservees', JSON.stringify(obj)); } catch (e) {}
}
function placesRestantes(c) {
  return Math.max(0, c.places - (lireReservees()[c.id] || 0));
}

function renderCreneaux() {
  if (!selCreneau) return;
  const choix = selCreneau.value;
  selCreneau.innerHTML = '';
  const vide = new Option(T[lang].choisir, '');
  selCreneau.add(vide);
  creneaux.forEach(c => {
    const n = placesRestantes(c);
    const texte = n > 0 ? `${c[lang]} — ${n} ${T[lang].restantes}` : `${c[lang]} — ${T[lang].complet}`;
    const opt = new Option(texte, c.id);
    opt.disabled = n === 0;
    selCreneau.add(opt);
  });
  selCreneau.value = choix;
}

function afficherMsg(texte, ok) {
  msg.textContent = texte;
  msg.className = 'resa-msg ' + (ok ? 'ok' : 'erreur');
}

function majConfirmation() {
  if (!msg) return;
  if (!derniereResa) { msg.textContent = ''; return; }
  const c = creneaux.find(x => x.id === derniereResa.id);
  afficherMsg(
    T[lang].ok + ' ' + fmt(T[lang].detail, {
      nom: derniereResa.nom, n: derniereResa.n, creneau: c[lang], ref: derniereResa.ref
    }), true);
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    derniereResa = null;
    const nom = document.getElementById('resa-nom').value.trim();
    const email = document.getElementById('resa-email').value.trim();
    const id = selCreneau.value;
    const n = parseInt(document.getElementById('resa-places').value, 10);

    if (!nom || !/^\S+@\S+\.\S+$/.test(email) || !n || n < 1 || n > 6) {
      return afficherMsg(T[lang].erreurChamps, false);
    }
    if (!id) return afficherMsg(T[lang].erreurCreneau, false);

    const c = creneaux.find(x => x.id === id);
    const reste = placesRestantes(c);
    if (n > reste) return afficherMsg(fmt(T[lang].erreurPlaces, { n: reste }), false);

    const reservees = lireReservees();
    reservees[id] = (reservees[id] || 0) + n;
    ecrireReservees(reservees);

    const ref = 'VG-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    derniereResa = { nom, n, id, ref };
    form.reset();
    renderCreneaux();
    majConfirmation();
  });
}
renderCreneaux();


/* =========================================================
   5. LANGUE (drapeau)
   ========================================================= */
// Découpe le paragraphe d'accueil en mots pour les faire apparaître un à un
function decouperMots(el, vite) {
  if (!el) return;
  const mots = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  mots.forEach((m, i) => {
    const s = document.createElement('span');
    s.className = 'mot' + (vite ? ' vite' : '');
    s.style.setProperty('--i', i);
    s.textContent = m;
    el.appendChild(s);
    if (i < mots.length - 1) el.appendChild(document.createTextNode(' '));
  });
}
const introAccueil = document.querySelector('.hero-intro');
decouperMots(introAccueil, false);

const btn = document.getElementById('lang-btn');
const flag = document.getElementById('flag-img');

function appliquerLangue() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-fr]').forEach(el => {
    el.textContent = el.dataset[lang];
  });
  document.querySelectorAll('[data-ph-fr]').forEach(el => {
    el.placeholder = el.dataset[lang === 'fr' ? 'phFr' : 'phEn'];
  });
  flag.src = lang === 'fr'
    ? 'https://flagcdn.com/w40/fr.png'
    : 'https://flagcdn.com/w40/gb.png';
  flag.alt = lang === 'fr' ? 'Français' : 'English';
  decouperMots(introAccueil, true);
  majLegende();
  renderCreneaux();
  majConfirmation();
}

if (btn) {
  btn.addEventListener('click', () => {
    lang = lang === 'fr' ? 'en' : 'fr';
    appliquerLangue();
  });
}

const annee = document.getElementById('annee');
if (annee) annee.textContent = new Date().getFullYear();
