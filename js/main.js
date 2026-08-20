(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.getElementById('header');

  // O loader possui um script independente no início do body e um fallback CSS.
  if (reduceMotion && typeof window.__hideVortexLoader === 'function') {
    window.setTimeout(window.__hideVortexLoader, 100);
  }

  // mobile nav toggle
  (function mobileNav(){
    const burger = document.getElementById('navBurger');
    const links = document.getElementById('navLinks');
    const overlay = document.getElementById('navOverlay');
    if (!burger || !links || !overlay) return;
    const focusable = links.querySelectorAll('a');
    const backgroundContent = [document.querySelector('main'), document.querySelector('footer')].filter(Boolean);
    function closeNav(returnFocus = false){
      burger.classList.remove('is-open'); links.classList.remove('is-open'); overlay.classList.remove('is-open');
      burger.setAttribute('aria-expanded','false');
      burger.setAttribute('aria-label','Abrir menu');
      document.body.style.overflow = '';
      backgroundContent.forEach(element=> element.inert = false);
      if (returnFocus === true) burger.focus();
    }
    function openNav(){
      burger.classList.add('is-open'); links.classList.add('is-open'); overlay.classList.add('is-open');
      burger.setAttribute('aria-expanded','true');
      burger.setAttribute('aria-label','Fechar menu');
      document.body.style.overflow = 'hidden';
      backgroundContent.forEach(element=> element.inert = true);
      focusable[0]?.focus();
    }
    burger.addEventListener('click', ()=> burger.classList.contains('is-open') ? closeNav() : openNav());
    overlay.addEventListener('click', closeNav);
    links.querySelectorAll('a').forEach(a=> a.addEventListener('click', closeNav));
    document.addEventListener('keydown', (event)=>{
      if (!links.classList.contains('is-open')) return;
      if (event.key === 'Escape') { event.preventDefault(); closeNav(true); return; }
      if (event.key !== 'Tab') return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    window.addEventListener('resize', ()=>{ if (window.innerWidth > 860) closeNav(); });
  })();
  const sections = ['home','nota','materiais','portfolio','processo','investimento','garantias','faq','contato'].map(id=>document.getElementById(id)).filter(Boolean);
  const navLinks = document.querySelectorAll('.nav-link');
  const scrollProgress = document.getElementById('scrollProgress');
  const floatingCta = document.getElementById('floatingCta');
  const threadPath = document.getElementById('threadPath');
  let threadLen = threadPath ? threadPath.getTotalLength() : 100;
  if (threadPath) { threadPath.style.strokeDasharray = threadLen; threadPath.style.strokeDashoffset = threadLen; }

  // portfolio horizontal pin refs
  const pfPin = document.querySelector('.pf-pin');
  const pfTrack = document.getElementById('pfTrack');
  const pfCards = pfTrack ? pfTrack.querySelectorAll('.pf-card') : [];

  function updatePortfolioScroll(){
    if (!pfPin || !pfTrack || window.innerWidth <= 860) return;
    const rect = pfPin.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return;
    let progress = -rect.top / total;
    progress = Math.max(0, Math.min(1, progress));
    const maxTranslate = Math.max(0, pfTrack.scrollWidth - window.innerWidth + 64);
    const x = progress * maxTranslate;
    pfTrack.style.transform = `translateX(-${x}px)`;

    // depth: perspective tilt + scale based on distance from viewport center
    const viewCenter = window.innerWidth / 2;
    pfCards.forEach(card=>{
      const cr = card.getBoundingClientRect();
      const cardCenter = cr.left + cr.width / 2;
      const dist = Math.min(1, Math.abs(cardCenter - viewCenter) / (window.innerWidth * 0.62));
      const scale = 1 - dist * 0.10;
      const rotateY = ((cardCenter - viewCenter) / window.innerWidth) * 12;
      const visual = card.querySelector('.pf-card-visual');
      if (visual) visual.style.transform = `perspective(1100px) rotateY(${-rotateY}deg) scale(${scale})`;
      card.style.opacity = String(1 - dist * 0.45);
    });
  }

  function onScroll(){
    if (header) header.classList.toggle('scrolled', window.scrollY > 40);
    if (floatingCta) floatingCta.classList.toggle('show', window.scrollY > window.innerHeight * 0.9);
    let current = sections[0];
    sections.forEach(s=>{ if(window.scrollY >= s.offsetTop - 140) current = s; });
    if (current) navLinks.forEach(l=> l.classList.toggle('active', l.getAttribute('href') === '#'+current.id));

    // 5. scroll progress bar
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = pct + '%';
    if (threadPath) threadPath.style.strokeDashoffset = (threadLen * (1 - pct / 100)) + '';

    // 4. subtle parallax hero-copy vs hero-visual
    if (!reduceMotion) {
      const heroCopy = document.querySelector('.hero-copy');
      const heroVisual = document.querySelector('.hero-visual');
      if (heroCopy && heroVisual && window.scrollY < window.innerHeight) {
        heroCopy.style.transform = `translateY(${window.scrollY * 0.06}px)`;
        heroVisual.style.transform = `translateY(${window.scrollY * -0.1}px)`;
      }
    }

    // portfolio: horizontal scroll-driven gallery with depth
    updatePortfolioScroll();
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', updatePortfolioScroll);
  onScroll();

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold:0.15 });
    revealElements.forEach(el=> io.observe(el));
  } else {
    revealElements.forEach(el=> el.classList.add('in'));
  }

  // 7. split-text reveal on hero h1 (letter by letter, keeps <em> and <br>)
  (function splitHeroTitle(){
    const h1 = document.querySelector('.hero-title');
    if (!h1) return;
    h1.setAttribute('aria-label', h1.textContent.trim());
    let delayIndex = 0;
    function wrapNode(node){
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        [...node.textContent].forEach(ch=>{
          if (ch === ' ') {
            const sp = document.createElement('span');
            sp.className = 'space';
            sp.textContent = ' ';
            sp.setAttribute('aria-hidden','true');
            frag.appendChild(sp);
          } else {
            const sp = document.createElement('span');
            sp.className = 'char';
            sp.textContent = ch;
            sp.setAttribute('aria-hidden','true');
            sp.style.transitionDelay = (delayIndex * 18) + 'ms';
            delayIndex++;
            frag.appendChild(sp);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
        [...node.childNodes].forEach(wrapNode);
      }
    }
    [...h1.childNodes].forEach(wrapNode);

    if (reduceMotion) {
      h1.querySelectorAll('.char').forEach(c=> c.classList.add('in'));
      return;
    }
    const revealChars = ()=> h1.querySelectorAll('.char').forEach(c=> c.classList.add('in'));
    if (h1.classList.contains('in') || getComputedStyle(h1).opacity !== '0') {
      requestAnimationFrame(revealChars);
    }
    if (!('IntersectionObserver' in window)) {
      revealChars();
      return;
    }
    const titleIo = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ requestAnimationFrame(revealChars); titleIo.unobserve(e.target); } });
    }, { threshold:0.2 });
    titleIo.observe(h1);
  })();

  // 1. weave: draw the threads in on load via real path length, then subtle mouse parallax
  (function drawWeave(){
    const paths = document.querySelectorAll('.weave path');
    const dots = document.querySelectorAll('.weave circle');
    paths.forEach((p, i)=>{
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = reduceMotion ? 0 : len;
      if (!reduceMotion) {
        setTimeout(()=>{ p.style.strokeDashoffset = 0; }, 100 + i * 140);
      }
    });
    dots.forEach((d, i)=>{
      setTimeout(()=> d.classList.add('in'), reduceMotion ? 0 : 100 + paths.length * 140 + i * 90);
    });
  })();

  // 1b. weave: subtle mouse parallax reacting on the hero SVG
  if (!reduceMotion) {
    const heroVisual = document.querySelector('.hero-visual');
    const weave = document.querySelector('.hero-visual .weave');
    if (heroVisual && weave) {
      heroVisual.addEventListener('mousemove', (e)=>{
        const rect = heroVisual.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        weave.style.transform = `rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
      });
      heroVisual.addEventListener('mouseleave', ()=>{ weave.style.transform = 'rotateX(0deg) rotateY(0deg)'; });
    }
  }

  // 10. FAQ accordion
  (function faqAccordion(){
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;
    items.forEach(item=>{
      const btn = item.querySelector('.faq-q');
      const panel = item.querySelector('.faq-a');
      if (!btn || !panel) return;
      btn.addEventListener('click', ()=>{
        const isOpen = item.classList.contains('is-open');
        items.forEach(other=>{
          other.classList.remove('is-open');
          other.querySelector('.faq-q').setAttribute('aria-expanded','false');
          other.querySelector('.faq-a').style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded','true');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  })();

  // 11. process section: sticky number/thread reacts as each step crosses view
  (function processSticky(){
    const items = document.querySelectorAll('.process-item[data-step]');
    const stickyNum = document.getElementById('processStickyNum');
    const dots = document.querySelectorAll('.pdot');
    if (!items.length || !stickyNum) return;
    if (!('IntersectionObserver' in window)) {
      items[0].classList.add('is-active');
      stickyNum.textContent = '01';
      return;
    }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if (entry.isIntersecting) {
          const step = entry.target.getAttribute('data-step');
          items.forEach(it=> it.classList.toggle('is-active', it === entry.target));
          stickyNum.style.opacity = '0';
          setTimeout(()=>{ stickyNum.textContent = '0' + step; stickyNum.style.opacity = '1'; }, reduceMotion ? 0 : 160);
          dots.forEach(d=> d.classList.toggle('is-active', d.getAttribute('data-dot') === step));
        }
      });
    }, { threshold:0.5, rootMargin:'-20% 0px -20% 0px' });
    items.forEach(it=> io.observe(it));
  })();

})();
