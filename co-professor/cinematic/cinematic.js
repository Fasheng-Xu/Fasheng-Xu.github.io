(() => {
  'use strict';
  const teaching = document.getElementById('teaching');
  const portfolio = document.querySelector('.portfolio');
  const stage = document.querySelector('.teaching-stage');
  const mobile = matchMedia('(max-width:900px)');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  let engine;
  function configureGallery() {
    if (engine) engine.destroy();
    const native = mobile.matches || reduce.matches;
    teaching.setAttribute('data-sc-act', native ? 'flow' : 'pan');
    teaching.classList.remove('sc-act--pinned');
    teaching.style.removeProperty('height');
    portfolio.style.removeProperty('transform');
    stage.classList.remove('sc-stage');
    if (native) {
      portfolio.removeAttribute('data-sc-pan');
      stage.removeAttribute('data-sc-stage');
    } else {
      portfolio.setAttribute('data-sc-pan', '0');
      stage.setAttribute('data-sc-stage', '');
    }
    if (window.ScrollCraft) engine = window.ScrollCraft.mount(document.body);
  }
  configureGallery();
  mobile.addEventListener('change', configureGallery);
  reduce.addEventListener('change', configureGallery);
  const hero = document.querySelector('.hero');
  if (!hero || reduce.matches) return;
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  function paint() {
    frame = 0;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
    const small = mobile.matches;
    hero.style.setProperty('--far-x', (pointerX * -4).toFixed(2) + 'px');
    hero.style.setProperty('--far-y', (progress * 18 + pointerY * -3).toFixed(2) + 'px');
    hero.style.setProperty('--object-x', (small ? 0 : pointerX * 9).toFixed(2) + 'px');
    hero.style.setProperty('--object-y', (progress * -30 + pointerY * 6).toFixed(2) + 'px');
    hero.style.setProperty('--edge-y', (progress * 9 + pointerY * 2).toFixed(2) + 'px');
    hero.style.setProperty('--front-y', (progress * 4 + pointerY).toFixed(2) + 'px');
  }
  function queue() { if (!frame) frame = requestAnimationFrame(paint); }
  addEventListener('scroll', queue, {passive:true});
  addEventListener('resize', queue, {passive:true});
  if (fine.matches) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - .5;
      pointerY = (event.clientY - rect.top) / rect.height - .5;
      queue();
    });
    hero.addEventListener('pointerleave', () => {pointerX = 0; pointerY = 0; queue();});
  }
  queue();
})();
