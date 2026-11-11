/* Recipe app: list, recipe view, portion scaling. No build step, no dependencies. */
(function () {
  'use strict';
  const app = document.getElementById('app');
  const recipes = (window.RECIPES || []).filter(r => r && r.id && r.title && Array.isArray(r.ingredients) && Array.isArray(r.steps)).sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
  const byId = Object.fromEntries(recipes.map(r => [r.id, r]));
  const TRS = window.RECIPE_TR || {};
  const CATS = window.CATEGORIES || [];
  const catOf = {};
  CATS.forEach(c => c.ids.forEach(id => { catOf[id] = c.name; }));

  /* ---------- icons: inline SVG, 24 viewBox, stroke only ---------- */
  const ICONS = {
    bread: '<path d="M5 11a4 4 0 0 1 2-7h10a4 4 0 0 1 2 7v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M10 8l-2 2M15 8l-2 2"/>',
    cake: '<path d="M4 21h16M5 21v-8h14v8M5 16c2.3 1.4 4.7 1.4 7 0s4.7-1.4 7 0M12 13V9"/><path d="M12 6.5c-1.1 0-1.4-1.6 0-3.3 1.4 1.7 1.1 3.3 0 3.3z"/>',
    soup: '<path d="M3 11h18a9 7 0 0 1-18 0z"/><path d="M8 21h8M9 3.5c-.8 1 .8 2 0 3.5M13 3.5c-.8 1 .8 2 0 3.5"/>',
    pan: '<circle cx="9" cy="13" r="6"/><path d="M15 13h7"/><circle cx="9" cy="13" r="2.5"/>',
    plate: '<path d="M5 3v6a2.5 2.5 0 0 0 5 0V3M7.5 3v18M17 3c-2 2-2.5 7 0 9v9"/>',
    salad: '<path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15z"/><path d="M5 19l8-8"/>',
    fish: '<path d="M2 12c3-5 9-6 14-3l4-3v12l-4-3c-5 3-11 2-14-3z"/><circle cx="7" cy="11" r=".6"/>',
    drink: '<path d="M6 3h12l-1.5 17a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1zM6.4 8h11.2"/>',
    egg: '<path d="M12 3c3.5 0 6 5.5 6 10a6 6 0 0 1-12 0c0-4.5 2.5-10 6-10z"/>',
    bun: '<path d="M3 15a9 7 0 0 1 18 0v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 11l1 1M13 10l1 1M15.5 13l1 1"/>',
    pasta: '<path d="M4 12h16a8 7 0 0 1-16 0z"/><path d="M9 12c0-3 2-4 2-7M13 12c0-3 2-4 2-7"/><path d="M9 21h6"/>',
    chicken: '<path d="M14.5 9.5a5 5 0 1 0-6 6l-3 3a1.5 1.5 0 1 0 2 2l3-3a5 5 0 0 0 4-8z"/>',
    meat: '<path d="M4 13c0-5 4-9 9-9 4 0 7 3 7 7 0 6-6 9-11 9-3 0-5-3-5-7z"/><circle cx="13" cy="11" r="2.5"/>',
    potato: '<path d="M5 9c2-5 9-6 13-3s3 10-2 12-13 0-11-9z"/><path d="M9 10h.01M14 9h.01M12 14h.01"/>',
    bowl: '<path d="M3 11h18a9 7 0 0 1-18 0z"/><path d="M8 21h8M14 3l-3 8"/>',
    sauce: '<path d="M4 9h11v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM15 11h2a2 2 0 0 1 0 4h-2M4 9l-1-2"/>',
    rice: '<path d="M3 12h18a9 7 0 0 1-18 0z"/><path d="M6 12c1-3 3-5 6-5s5 2 6 5M10 9.5h.01M14 9.5h.01M12 8h.01"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  const icon = name => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.plate}</svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- amounts ---------- */
  const trim = n => String(+n.toFixed(2));
  const FR = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
  function frac(x) {
    let r = Math.round(x * 4) / 4;
    if (r === 0 && x > 0) r = 0.25;
    const w = Math.floor(r), f = r - w;
    return (w ? String(w) : '') + (f ? FR[f] : '') || '0';
  }
  function roundMetric(v) {
    if (v < 10) return Math.round(v * 2) / 2 || 0.5;
    if (v < 100) return Math.round(v);
    if (v < 1000) return Math.round(v / 5) * 5;
    return Math.round(v / 10) * 10;
  }
  /* Each recipe screen keeps its source language (lang: 'en' | 'no'). The list stays English. */
  const T = {
    en: { portion: 'portion', portions: 'portions', ing: 'Ingredients', steps: 'Steps', reset: 'Reset to',
          hint: 'Tap a step to mark it done.', source: 'Source', back: 'Back to all recipes', fewer: 'Fewer portions',
          more: 'More portions', from: 'from', batch: 'recipe', tsp: 'tsp', tbsp: 'tbsp', dec: '.' },
    no: { portion: 'porsjon', portions: 'porsjoner', ing: 'Ingredienser', steps: 'Fremgangsmåte', reset: 'Tilbake til',
          hint: 'Trykk på et steg for å krysse det av.', source: 'Kilde', back: 'Tilbake til alle oppskrifter',
          fewer: 'Færre porsjoner', more: 'Flere porsjoner', from: 'fra', batch: 'oppskrift', tsp: 'ts', tbsp: 'ss', dec: ',' }
  };
  const tr = r => T[r.lang] || T.en;

  /* returns { amt, n } where n is the scaled count (for plurals) */
  function amount(ing, factor, t) {
    t = t || T.en;
    if (ing.q == null) return { amt: '', n: 0 };
    let v = ing.q * factor, u = ing.u;
    const d = x => trim(x).replace('.', t.dec);
    if (u === 'g' || u === 'ml') {
      v = roundMetric(v);
      if (v >= 1000) return { amt: `${d(v / 1000)} ${u === 'g' ? 'kg' : 'l'}`, n: v };
      if (u === 'ml' && t === T.no && v >= 100) return { amt: `${d(Math.round(v / 50) / 2)} dl`, n: v }; // Norwegian kitchens use dl
      return { amt: `${d(v)} ${u}`, n: v };
    }
    // Switch to tablespoons only when the result stays exact (6 tsp -> 2 tbsp, never 4 tsp -> 1¼ tbsp).
    if (u === 'tsp' && v >= 3 && Math.abs(v * 4 / 3 - Math.round(v * 4 / 3)) < 0.01) { v = v / 3; u = 'tbsp'; }
    if (u === 'tsp' || u === 'tbsp') return { amt: `${frac(v)} ${t[u]}`, n: v };
    return { amt: frac(v), n: Math.round(v * 4) / 4 }; // pieces
  }
  function ingName(ing, n) { return ing.u === 'pc' && n > 1 && ing.pl ? ing.pl : ing.name; }
  function inline(ing, factor, t) {
    const { amt, n } = amount(ing, factor, t);
    return amt ? `${amt} ${ingName(ing, n)}` : ing.name;
  }
  function stepHtml(text, r, factor) {
    const t = tr(r);
    const map = Object.fromEntries(r.ingredients.map(i => [i.id, i]));
    return esc(text).replace(/\{([\w-]+)(\|q)?\}/g, (m, id, onlyQ) => {
      const ing = map[id];
      if (!ing) return m;
      return `<b>${esc(onlyQ ? amount(ing, factor, t).amt : inline(ing, factor, t))}</b>`;
    });
  }

  /* ---------- per-recipe memory (convenience only) ---------- */
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem('recipes:' + k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('recipes:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  /* ---------- keep the screen on while a recipe is open ---------- */
  let lock = null;
  async function wake(on) {
    try {
      if (on && 'wakeLock' in navigator && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); }
      if (!on && lock) { await lock.release(); lock = null; }
    } catch (e) { lock = null; }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && current) wake(true); });

  /* ---------- list ---------- */
  let query = '', listScroll = 0, current = null, listLang = 'orig';
  const doneSteps = {}, langOf = {};

  /* The recipe as shown in `lang`: the original, or its translation laid over it.
     Amounts, units and ids always come from the original. */
  function view(r, lang) {
    const x = TRS[r.id];
    if (!x || lang === r.lang || x.lang !== lang) return r;
    const xi = x.ingredients || {};
    return Object.assign({}, r, {
      lang, title: x.title || r.title, time: x.time || r.time,
      steps: x.steps && x.steps.length ? x.steps : r.steps,
      ingredients: r.ingredients.map(i => xi[i.id]
        ? Object.assign({}, i, { name: xi[i.id].name, pl: i.pl ? (xi[i.id].pl || xi[i.id].name) : undefined }) : i)
    });
  }
  function renderList() {
    current = null; wake(false);
    document.title = 'Recipes';
    document.documentElement.lang = 'en';
    app.innerHTML = `
      <div class="top">
        <h1 class="h1">Recipes</h1>
        <div class="seg" role="group" aria-label="Language of titles">${[['orig', 'Original'], ['en', 'English']].map(([k, label]) => `
          <button data-act="listlang" data-lang="${k}" aria-pressed="${listLang === k}" class="${listLang === k ? 'on' : ''}">${label}</button>`).join('')}
        </div>
      </div>
      <div class="sub num">${recipes.length} recipes</div>
      <label class="search">${icon('search')}<input id="q" type="search" placeholder="Find a recipe or ingredient" autocomplete="off" value="${esc(query)}"></label>
      <div id="list"></div>`;
    const input = document.getElementById('q');
    input.addEventListener('input', () => { query = input.value; fillList(); });
    fillList();
    window.scrollTo(0, listScroll);
  }
  function fillList() {
    const q = query.trim().toLowerCase();
    // Search matches both languages: "chicken" finds Kyllingfilet i form, "kylling" finds Marry me chicken.
    const words = r => { const x = TRS[r.id] || {}; const xi = x.ingredients || {};
      return [r.title, x.title || ''].concat(r.ingredients.map(i => i.name + ' ' + ((xi[i.id] || {}).name || ''))).join(' ').toLowerCase(); };
    const hits = recipes.filter(r => !q || words(r).includes(q));
    if (!hits.length) { document.getElementById('list').innerHTML = '<div class="empty">No recipe matches.</div>'; return; }
    const groups = {};
    // In English mode titles come from the translation; each section re-sorts on the shown title.
    hits.map(r => listLang === 'en' ? view(r, 'en') : r)
      .sort((a, b) => a.title.localeCompare(b.title, a.lang === 'no' ? 'nb' : 'en', { sensitivity: 'base' }))
      .forEach(r => { const c = catOf[r.id] || 'Other'; (groups[c] = groups[c] || []).push(r); });
    const order = CATS.map(c => c.name).concat('Other').filter(c => groups[c]);
    document.getElementById('list').innerHTML = order.map(L => `
      <div class="label">${esc(L)}</div>
      <div class="group">${groups[L].map(r => `
        <a class="row" href="#/r/${esc(r.id)}" style="color:inherit;text-decoration:none">
          <span class="badge">${icon(r.icon)}</span>
          <span class="grow"><div class="t">${esc(r.title)}</div>
            <div class="m num">${[r.portions ? `${r.portions} ${r.portions === 1 ? 'portion' : 'portions'}` : '', r.time ? esc(r.time) : ''].filter(Boolean).join(' · ')}</div></span>
          <span class="chev">${icon('chev')}</span>
        </a>`).join('')}</div>`).join('');
  }

  /* ---------- recipe ---------- */
  function renderRecipe(r, wanted) {
    if (!current) listScroll = window.scrollY;
    const first = !current || current.r !== r;
    // Without a known portion count the stepper scales the whole recipe (½×, 1×, 1½× ...).
    const mult = !(r.portions > 0), base = mult ? 1 : r.portions, step = mult ? 0.5 : 1;
    let p = wanted || store.get('p:' + r.id) || base;
    p = Math.max(step, Math.min(99, Math.round(p / step) * step));
    current = { r, p, step };
    store.set('p:' + r.id, p);
    if (first) { // each open starts with no ticks, in the list's language choice
      doneSteps[r.id] = [];
      langOf[r.id] = listLang === 'en' && TRS[r.id] && TRS[r.id].lang === 'en' ? 'en' : r.lang;
    }
    const v = view(r, langOf[r.id]);
    const f = p / base, t = tr(v);
    const done = doneSteps[r.id];
    document.title = v.title;
    document.documentElement.lang = v.lang === 'no' ? 'nb' : 'en';
    app.innerHTML = `
      <div class="top">
        <a class="round" href="#/" aria-label="${t.back}" style="color:inherit">${icon('back')}</a>
        ${TRS[r.id] ? `<div class="seg" role="group" aria-label="Language / Språk">${['no', 'en'].map(l => `
          <button data-act="lang" data-lang="${l}" aria-pressed="${v.lang === l}" class="${v.lang === l ? 'on' : ''}">${l === 'no' ? 'Norsk' : 'English'}</button>`).join('')}
        </div>` : ''}
      </div>
      <h1 class="h1 title">${esc(v.title)}</h1>
      <div class="stepper" role="group" aria-label="${t.portions}">
        <div class="what">
          <span class="n num" aria-live="polite">${mult ? frac(p) + '×' : p}</span> <span class="w">${mult ? t.batch : p === 1 ? t.portion : t.portions}</span>
          ${p !== base ? `<button class="reset" data-act="reset">${t.reset} ${mult ? '1×' : base}</button>` : ''}
        </div>
        <button class="round" data-act="dec" aria-label="${t.fewer}" ${p <= step ? 'disabled' : ''}>${icon('minus')}</button>
        <button class="round" data-act="inc" aria-label="${t.more}">${icon('plus')}</button>
      </div>

      <div class="label">${t.ing}</div>
      <ul class="panel ings">${v.ingredients.map(i => {
        const a = amount(i, f, t);
        return `<li><span class="q num">${esc(a.amt)}</span><span class="nm">${esc(ingName(i, a.n))}${i.from ? `<span class="tag">${t.from} ${esc(i.from)}</span>` : ''}</span></li>`;
      }).join('')}</ul>

      <div class="label">${t.steps}</div>
      <ol class="steps">${v.steps.map((s, k) => `
        <li><button class="step${done.includes(k) ? ' done' : ''}" data-step="${k}">
          <span class="no num">${k + 1}</span><span>${stepHtml(s, v, f)}</span></button></li>`).join('')}</ol>
      <p class="hint">${t.hint}</p>
      ${r.source ? `<p class="source">${t.source}: <a href="${esc(r.source)}" rel="noopener" target="_blank">${esc(r.source)}</a></p>` : ''}`;
    if (first) window.scrollTo(0, 0);
    wake(true);
  }
  function setPortions(p) {
    const { r } = current;
    history.replaceState(null, '', `#/r/${r.id}/${p}`);
    const y = window.scrollY;
    renderRecipe(r, p);
    window.scrollTo(0, y);
  }

  app.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b && b.dataset.act === 'listlang') { // Original / English on the main page; resets to Original on each launch
      listLang = b.dataset.lang; listScroll = window.scrollY; renderList(); return;
    }
    if (!b || !current) return;
    const act = b.dataset.act;
    if (act === 'inc') setPortions(Math.min(99, current.p + current.step));
    else if (act === 'dec') setPortions(Math.max(current.step, current.p - current.step));
    else if (act === 'reset') setPortions(current.r.portions > 0 ? current.r.portions : 1);
    else if (act === 'lang') { langOf[current.r.id] = b.dataset.lang; setPortions(current.p); }
    else if (b.dataset.step != null) {
      const k = +b.dataset.step, done = doneSteps[current.r.id];
      const i = done.indexOf(k);
      i < 0 ? done.push(k) : done.splice(i, 1);
      b.classList.toggle('done');
    }
  });

  /* ---------- routing: #/  and  #/r/<id>[/<portions>] ---------- */
  function route() {
    const [kind, id, p, lang] = location.hash.replace(/^#\/?/, '').split('/');
    if (kind === 'en') listLang = 'en'; // #/en opens the list in English (used for testing)
    if (kind === 'r' && byId[id]) {
      if (current && current.r !== byId[id]) current = null;
      renderRecipe(byId[id], parseFloat(p) || null);
      if (lang && TRS[id] && langOf[id] !== lang) { langOf[id] = lang; setPortions(current.p); } // #/r/<id>/<p>/<en|no>
    }
    else renderList();
  }
  window.addEventListener('hashchange', route);
  route();

  /* ---------- offline: register the service worker when served over http(s) ---------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
