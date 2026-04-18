// ===== Multi-profile portfolio =====
// URL: ?u=<slug>  →  picks profiles[slug]. Falls back to data.default if missing/invalid.

function getProfileSlug() {
  const params = new URLSearchParams(location.search);
  return (params.get('u') || params.get('user') || '').trim().toLowerCase();
}

async function init() {
  const res = await fetch('/data.json');
  const db = await res.json();

  const profiles = db.profiles || {};
  const requested = getProfileSlug();
  const slug = profiles[requested] ? requested : (db.default || Object.keys(profiles)[0]);
  const data = profiles[slug];

  if (!data) {
    document.body.innerHTML = '<div style="padding:40px;font-family:monospace">No profiles found in data.json</div>';
    return;
  }

  // Safe accessors — any missing section just renders empty
  const meta   = data.meta   || {};
  const hero   = data.hero   || {};
  const skills = data.skills || [];
  const projects     = data.projects     || [];
  const about        = data.about        || { paragraphs: [], timeline: [] };
  const testimonials = data.testimonials || [];
  const hobbies      = data.hobbies      || { photography: [], travel: [] };
  const connect      = data.connect      || { links: [] };
  const vcard        = data.vcard        || {};

  renderMeta(meta);
  renderHero(hero);
  renderSkills(skills);
  renderProjects(projects);
  renderAbout(about);
  renderTestimonials(testimonials);
  renderHobbies(hobbies);
  renderConnect(connect);
  renderReachMe(vcard, connect);
  wireVCard(slug, vcard, connect);
  applySectionVisibility(data.sections || {});

  bootGreeting(hero.greetings || ['Hello']);
  bootTypewriter('thanks', [
    'Thank you','धन्यवाद','ಧನ್ಯವಾದಗಳು','ధన్యవాదాలు','நன்றி','നന്ദി','ধন্যবাদ','Merci','Gracias','ありがとう'
  ]);
  bootSliders();
  bootTestimonials();
  bootScrollReveal();
  bootCursor();
  bootParallax();
  bootNav();
}

// ===== Renderers =====
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '';
}

function renderMeta(meta) {
  if (meta.title) document.title = meta.title;
  if (meta.description) document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  setText('meta-tag', meta.tag);
  setText('meta-years', meta.years);
}

function renderHero(hero) {
  setText('greeting', (hero.greetings && hero.greetings[0]) || '');
  setText('hero-name', hero.name || '');
  setText('hero-heading', hero.heading);
  setText('hero-bio', hero.bio);
  const photoEl = document.getElementById('hero-photo');
  if (photoEl) {
    photoEl.src = hero.photo || '';
    photoEl.alt = hero.name || '';
  }
  const photoWrap = document.querySelector('.hero-photo-wrap');
  const overlay   = document.querySelector('.hero-photo-overlay');
  if (photoWrap && overlay) {
    photoWrap.addEventListener('mousemove', (e) => {
      const rect = photoWrap.getBoundingClientRect();
      overlay.style.left = (e.clientX - rect.left + 14) + 'px';
      overlay.style.top  = (e.clientY - rect.top  + 14) + 'px';
    });
  }
}

function renderSkills(skills) {
  const track = document.getElementById('skills-track');
  if (!track) return;
  const html = skills.map(s => `<span class="skill-item">✦ ${s}</span>`).join('');
  track.innerHTML = html + html;
}

function renderProjects(projects) {
  const container = document.getElementById('projects-container');
  if (!container) return;
  container.innerHTML = projects.map(p => {
    const stats = (p.stats || []).map(s => {
      if (!s.label && s.value === '& more') {
        return `<div class="stat stat-more"><span class="stat-value">&amp; more</span></div>`;
      }
      if ((s.value || '').includes('→')) {
        const [a, b] = s.value.split('→');
        return `<div class="stat"><span class="stat-label">${s.label || ''}</span><div class="stat-value">${a.trim()} → <span class="accent">${b.trim()}</span></div></div>`;
      }
      return `<div class="stat"><span class="stat-label">${s.label || ''}</span><span class="stat-value${s.accent ? ' accent' : ''}">${s.value || ''}</span></div>`;
    }).join('');
    return `<a href="${p.link || '#'}" target="_blank" rel="noopener noreferrer" class="project-card" data-cursor="View project">
      <div class="project-image-wrap"><div class="project-image"><img src="${p.image || ''}" alt="${p.title || ''}" /></div></div>
      <div class="project-info">
        <h4 class="project-name">${p.title || ''}</h4>
        <p class="project-desc">${p.description || ''}</p>
        <div class="project-stats">${stats}</div>
      </div>
    </a>`;
  }).join('');
}

function renderAbout(about) {
  const textEl = document.getElementById('about-text');
  if (textEl) textEl.innerHTML = (about.paragraphs || []).map(p => `<p>${p}</p>`).join('');
  const tlEl = document.getElementById('timeline-items');
  if (tlEl) tlEl.innerHTML = (about.timeline || []).map(item => {
    const roleClass = item.accent ? 'tl-role accent-role' : 'tl-role';
    return `<div class="tl-item">
      <div class="tl-marker"></div>
      <span class="tl-year">${item.years || ''}</span>
      <div class="tl-company">${logoForCompany(item.logo, item.company)}${item.company || ''}</div>
      <span class="${roleClass}">${item.role || ''}</span>
    </div>`;
  }).join('');
}

function renderTestimonials(testimonials) {
  const track = document.getElementById('testimonials-track');
  if (!track) return;
  const html = testimonials.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-author">${t.name || ''}</div>
      <div class="testimonial-role">${t.role || ''}</div>
      <p class="testimonial-text">${t.text || ''}</p>
    </div>`).join('');
  track.innerHTML = html + html;
}

function renderHobbies(hobbies) {
  const photoTrack = document.getElementById('photo-track');
  const travelTrack = document.getElementById('travel-track');
  const p = hobbies.photography || [];
  const t = hobbies.travel || [];
  if (photoTrack && p.length) {
    const all = [...p, ...p.slice(0, Math.min(3, p.length))];
    photoTrack.innerHTML = all.map((url, i) => `<img src="${url}" alt="Photography ${(i % p.length) + 1}" />`).join('');
  }
  if (travelTrack && t.length) {
    const all = [...t, ...t.slice(0, Math.min(3, t.length))];
    travelTrack.innerHTML = all.map((url, i) => `<img src="${url}" alt="Travel ${(i % t.length) + 1}" />`).join('');
  }
}

const SOCIAL_ICONS = {
  linkedin:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  whatsapp:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
  twitter:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  instagram: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>`,
  github:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`
};

function renderConnect(connect) {
  const grid = document.getElementById('connect-grid');
  if (!grid) return;

  const socials = (connect.social || []).map(s => `
    <a href="${s.url}" target="_blank" rel="noopener" class="connect-social-card">
      <span class="connect-social-icon">${SOCIAL_ICONS[s.type] || '↗'}</span>
      <span class="connect-social-handle">${s.handle}</span>
    </a>`).join('');

  const companies = (connect.companies || []).map(c => `
    <a href="${c.url}" target="_blank" rel="noopener" class="connect-company-card">
      <span class="connect-company-name">${c.name} <span class="arrow">↗</span></span>
      <span class="connect-company-tag">${c.tag}</span>
    </a>`).join('');

  grid.innerHTML = `
    ${socials ? `<div class="connect-socials">${socials}</div>` : ''}
    ${companies ? `<div class="connect-companies">${companies}</div>` : ''}
  `;
}

// ===== Dynamic vCard generation =====
function pickLink(connect, label) {
  return (connect.links || []).find(l => (l.label || '').toLowerCase() === label.toLowerCase());
}

// Fetch an image and return base64 + mime. Returns null on failure.
async function fetchPhotoBase64(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = (blob.type || 'image/jpeg').split('/')[1].toUpperCase();
    const buf = await blob.arrayBuffer();
    let binary = '';
    new Uint8Array(buf).forEach(b => binary += String.fromCharCode(b));
    return { base64: btoa(binary), type };
  } catch { return null; }
}

// Escape vCard special chars in a text value
function vEsc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

async function buildVCard(vcard, connect) {
  // Fallbacks from connect.links if vcard doesn't have explicit arrays
  const fallbackPhone    = pickLink(connect, 'Phone');
  const fallbackEmail    = pickLink(connect, 'Email');
  const fallbackLinkedIn = pickLink(connect, 'LinkedIn');

  const phones    = vcard.phones    && vcard.phones.length    ? vcard.phones    : (fallbackPhone ? [{ type: 'CELL', number: (fallbackPhone.url || '').replace(/^tel:/, '') || fallbackPhone.display }] : []);
  const emails    = vcard.emails    && vcard.emails.length    ? vcard.emails    : (fallbackEmail ? [{ type: 'WORK', address: (fallbackEmail.url || '').replace(/^mailto:/, '') || fallbackEmail.display }] : []);
  const urls      = vcard.urls      && vcard.urls.length      ? vcard.urls      : (fallbackLinkedIn ? [{ label: 'LinkedIn', value: fallbackLinkedIn.url }] : []);
  const addresses = vcard.addresses && vcard.addresses.length ? vcard.addresses : (vcard.location ? [{ type: 'WORK', city: vcard.location }] : []);

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${vEsc(vcard.fullName || '')}`,
    `N:${vEsc(vcard.lastName || '')};${vEsc(vcard.firstName || '')};;;`,
    vcard.nickname ? `NICKNAME:${vEsc(vcard.nickname)}` : '',
    vcard.org      ? `ORG:${vEsc(vcard.org)}`           : '',
    vcard.title    ? `TITLE:${vEsc(vcard.title)}`       : '',
    vcard.role     ? `ROLE:${vEsc(vcard.role)}`         : '',
    ...phones.map(p => `TEL;TYPE=${(p.type || 'CELL').toUpperCase()}:${(p.number || '').replace(/\s/g, '')}`),
    ...emails.map(e => `EMAIL;TYPE=${(e.type || 'WORK').toUpperCase()}:${e.address || ''}`),
    ...urls.map(u => `URL:${u.value || ''}`),
    ...addresses.map(a => `ADR;TYPE=${(a.type || 'WORK').toUpperCase()}:;;${vEsc(a.street || '')};${vEsc(a.city || '')};${vEsc(a.region || '')};${vEsc(a.postalCode || '')};${vEsc(a.country || '')}`),
    vcard.birthday            ? `BDAY:${vcard.birthday}` : '',
    (vcard.categories || []).length ? `CATEGORIES:${vcard.categories.join(',')}` : '',
    vcard.note                ? `NOTE:${vEsc(vcard.note)}` : ''
  ];

  // Embed photo as base64
  if (vcard.photo) {
    const photo = await fetchPhotoBase64(vcard.photo);
    if (photo) lines.push(`PHOTO;ENCODING=b;TYPE=${photo.type}:${photo.base64}`);
  }

  lines.push('END:VCARD');
  return lines.filter(Boolean).join('\r\n') + '\r\n';
}

function applySectionVisibility(sections) {
  // Each key defaults to visible (true). Set to false in data.json to hide.
  const map = {
    reachMe:       '#reachme',
    featuredWork:  '#featuredwork',
    aboutMe:       '#aboutme',
    testimonials:  '#testimonials-section',
    outsideOfWork: '#outside-section',
    connect:       '#connectsection'
  };
  Object.entries(map).forEach(([key, sel]) => {
    if (sections[key] === false) {
      document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
    }
  });
  // Hide nav links whose target is hidden
  document.querySelectorAll('.nav-links a').forEach(a => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target && target.style.display === 'none') a.style.display = 'none';
  });
}

function renderReachMe(vcard, connect) {
  const list = document.getElementById('reach-list');
  if (!list) return;
  const rows = [];

  const pill = (v) => `<span class="pill">${v}</span>`;

  const addr = (vcard.addresses || [])[0];
  if (addr) {
    const parts = [addr.street, addr.city, addr.region, addr.postalCode, addr.country].filter(Boolean);
    if (parts.length) rows.push(['Office Address', pill(parts.join(', '))]);
  }

  const phone = (vcard.phones || [])[0];
  if (phone?.number) rows.push(['Phone', pill(phone.number)]);

  const email = (vcard.emails || [])[0]
    || (connect.links || []).find(l => /mail/i.test(l.type || l.label || ''));
  const emailAddr = email?.address || email?.value;
  if (emailAddr) rows.push(['Email', `<a href="mailto:${emailAddr}">${pill(emailAddr)}</a>`]);

  const web = (vcard.urls || []).find(u => /company|website|web/i.test(u.label || ''))
    || (vcard.urls || [])[0];
  if (web?.value) {
    const display = web.value.replace(/^https?:\/\//, '').replace(/\/$/, '');
    rows.push(['Website', `<a href="${web.value}" target="_blank" rel="noopener">${pill(display)}</a>`]);
  }

  list.innerHTML = rows.map(([k, v]) =>
    `<div class="reach-row"><dt>${k}</dt><dd>${v}</dd></div>`
  ).join('');
}

async function wireVCard(slug, vcard, connect) {
  if (!vcard.fullName) return;
  const vcfText = await buildVCard(vcard, connect);
  const blob = new Blob([vcfText], { type: 'text/vcard;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const filename = (vcard.fullName || 'contact').replace(/\s+/g, '-') + '.vcf';

  const btn = document.querySelector('.save-contact-btn');
  if (btn) {
    btn.href = blobUrl;
    btn.setAttribute('download', filename);
  }

  // Auto-download once per session per profile
  const key = `vcf_downloaded_${slug}`;
  if (!sessionStorage.getItem(key)) {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      sessionStorage.setItem(key, '1');
    }, 2000);
  }
}

// ===== Logo helper =====
function logoForCompany(type, name) {
  if (type === 'amazon')     return `<span class="co-logo co-amazon">a</span>`;
  if (type === 'designboat') return `<span class="co-logo co-designboat">▶</span>`;
  if (type === 'ciq')        return `<span class="co-logo co-ciq">IQ</span>`;
  if (type === 'jwl')        return `<span class="co-logo co-ciq">JW</span>`;
  if (type === 'snowman')    return `<span class="co-logo co-amazon">❄</span>`;
  if (type === 'school')     return `<span class="co-logo co-designboat">🎓</span>`;
  if (type === 'university') return `<span class="co-logo co-designboat">📘</span>`;
  return `<span class="co-logo">${(name && name[0]) || '✦'}</span>`;
}

// ===== Generic Typewriter =====
function bootTypewriter(elementId, words) {
  const el = document.getElementById(elementId);
  if (!el || !words || !words.length) return;

  let wordIndex = 0, charIndex = 0, isDeleting = false;
  const TYPE_SPEED = 90, DELETE_SPEED = 50, HOLD_TIME = 1800;

  function typeWriter() {
    const currentWord = words[wordIndex];
    if (!isDeleting) {
      charIndex++;
      el.textContent = currentWord.slice(0, charIndex);
      if (charIndex === currentWord.length) { isDeleting = true; setTimeout(typeWriter, HOLD_TIME); return; }
      setTimeout(typeWriter, TYPE_SPEED);
    } else {
      charIndex--;
      el.textContent = currentWord.slice(0, charIndex);
      if (charIndex === 0) { isDeleting = false; wordIndex = (wordIndex + 1) % words.length; setTimeout(typeWriter, 300); return; }
      setTimeout(typeWriter, DELETE_SPEED);
    }
  }

  el.textContent = words[0];
  charIndex = words[0].length;
  isDeleting = true;
  setTimeout(typeWriter, HOLD_TIME);
}

function bootGreeting(greetings) { bootTypewriter('greeting', greetings); }

// ===== Hobby Sliders =====
function makeVerticalSlider(trackId, panelSelector) {
  const track = document.getElementById(trackId);
  if (!track) return;
  const panel = track.closest(panelSelector || '.hobby-panel');
  const count = track.querySelectorAll('img').length;
  if (!count) return;
  let current = 0;
  const imgHeight = 240;
  const goTo = i => { track.style.transform = `translateY(-${i * imgHeight}px)`; };
  const next = () => {
    if (current >= count - 1) {
      track.style.transition = 'none'; current = 0; goTo(0);
      requestAnimationFrame(() => requestAnimationFrame(() => { track.style.transition = ''; }));
    } else { track.style.transition = ''; current++; goTo(current); }
  };
  let timer = setInterval(next, 2000);
  panel.addEventListener('mouseenter', () => clearInterval(timer));
  panel.addEventListener('mouseleave', () => { timer = setInterval(next, 2000); });
}

function makeHorizontalSlider(trackId, panelSelector) {
  const track = document.getElementById(trackId);
  if (!track) return;
  const panel = track.closest(panelSelector || '.hobby-panel');
  const count = track.querySelectorAll('img').length;
  if (!count) return;
  let current = 0;
  const getW = () => track.parentElement.offsetWidth;
  const goTo = i => { track.style.transform = `translateX(-${i * getW()}px)`; };
  const next = () => {
    if (current >= count - 1) {
      track.style.transition = 'none'; current = 0; goTo(0);
      requestAnimationFrame(() => requestAnimationFrame(() => { track.style.transition = ''; }));
    } else { track.style.transition = ''; current++; goTo(current); }
  };
  let timer = setInterval(next, 2200);
  panel.addEventListener('mouseenter', () => clearInterval(timer));
  panel.addEventListener('mouseleave', () => { timer = setInterval(next, 2200); });
}

function bootSliders() { makeVerticalSlider('photo-track'); makeHorizontalSlider('travel-track'); }

// ===== Testimonials Marquee =====
function bootTestimonials() {
  const track = document.getElementById('testimonials-track');
  const prevBtn = document.getElementById('testimonial-prev');
  const nextBtn = document.getElementById('testimonial-next');
  if (!track) return;
  track.classList.add('auto-scrolling');

  let userInteracted = false;
  if (prevBtn && nextBtn) {
    const scrollAmount = 316;
    const stopAutoScroll = () => {
      if (!userInteracted) {
        userInteracted = true;
        track.classList.remove('auto-scrolling');
        track.style.animation = 'none';
        track.style.overflow = 'auto';
        track.style.transform = 'none';
      }
    };
    prevBtn.addEventListener('click', () => { stopAutoScroll(); track.scrollBy({ left: -scrollAmount, behavior: 'smooth' }); });
    nextBtn.addEventListener('click', () => { stopAutoScroll(); track.scrollBy({ left:  scrollAmount, behavior: 'smooth' }); });
  }

  let isDown = false, startX, scrollLeft;
  track.addEventListener('mousedown', (e) => { isDown = true; track.style.cursor = 'grabbing'; startX = e.pageX - track.offsetLeft; scrollLeft = track.scrollLeft; });
  track.addEventListener('mouseleave', () => { isDown = false; track.style.cursor = ''; });
  track.addEventListener('mouseup',    () => { isDown = false; track.style.cursor = ''; });
  track.addEventListener('mousemove', (e) => {
    if (!isDown) return; e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.5;
  });
}

// ===== Scroll Reveal =====
function bootScrollReveal() {
  const els = document.querySelectorAll('.project-card, .about-text, .timeline, .testimonials-wrapper, .hobby-card, .connect-section, .hero-section, .section-title');
  els.forEach((el, i) => {
    el.classList.add('reveal');
    if (el.classList.contains('hobby-card')) el.classList.add(`reveal-delay-${(i % 2) + 1}`);
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
}

// ===== Custom Cursor =====
function bootCursor() {
  const cursorDot = document.getElementById('cursor-dot');
  if (!cursorDot) return;
  const interactive = document.querySelectorAll('a, button, .project-card, .hobby-card');
  document.addEventListener('mousemove', (e) => {
    cursorDot.style.left = e.clientX - 4 + 'px';
    cursorDot.style.top  = e.clientY - 4 + 'px';
    cursorDot.classList.add('active');
  });
  document.addEventListener('mouseleave', () => cursorDot.classList.remove('active'));
  interactive.forEach(el => {
    el.addEventListener('mouseenter', () => cursorDot.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursorDot.classList.remove('hovering'));
  });
}

// ===== Parallax =====
function bootParallax() {
  const heroPhoto = document.querySelector('.hero-photo-wrap') || document.querySelector('.hero-photo');
  if (!heroPhoto) return;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY < 600) heroPhoto.style.transform = `translateY(${scrollY * 0.08}px)`;
  }, { passive: true });
}

// ===== Nav Active State =====
function bootNav() {
  const sections = document.querySelectorAll('[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => { link.style.opacity = link.getAttribute('href') === `#${id}` ? '1' : '0.5'; });
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(s => { if (s.id) navObserver.observe(s); });
  navLinks.forEach(link => link.style.opacity = '0.5');
  if (navLinks[0]) navLinks[0].style.opacity = '1';
}

// ===== Boot =====
init();
