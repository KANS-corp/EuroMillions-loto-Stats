// ============================================================
// STATS — EuroMillions + Loto
// Générateur intelligent : poids récents, anti-doublons, multi-grilles
// ============================================================

let currentGame = 'euro';   // 'euro' | 'loto'
let currentMode = 'balanced';
let genHistory = [];
let generatedGrids = new Set(); // anti-doublons

// ── Switch jeu ────────────────────────────────────────────────
function switchGame(game, btn) {
  currentGame = game;
  generatedGrids.clear();

  document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const isEuro = game === 'euro';

  // Header
  document.getElementById('main-title').className = isEuro ? 'euro-title' : 'loto-title';
  document.getElementById('main-title').textContent = isEuro ? 'EuroMillions Stats' : 'Loto Stats';
  document.getElementById('main-subtitle').textContent = isEuro
    ? 'Analyse statistique complète depuis 2004'
    : 'Analyse statistique complète depuis 2008';

  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.className = 'tab ' + (game === 'euro' ? 'euro-tab' : 'loto-tab');
  });

  // Stars tab label
  document.querySelectorAll('.tab')[2].textContent = isEuro ? 'Étoiles' : 'N° Chance';

  // Rebuild tout
  buildOverview();
  buildNumbersTable();
  buildStarsTable();
  buildDelayTable();
  buildHistory();
  buildGenModes();
  updateGenUI();

  // Reset tab actif
  showPanelDirect('overview');
  document.querySelectorAll('.tab')[0].classList.add('active');

  document.getElementById('data-info').textContent = isEuro
    ? `${TOTAL_DRAWS} tirages analysés (2004–2025)`
    : `${LOTO_TOTAL_DRAWS} tirages analysés (2008–2025)`;
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  buildOverview();
  buildNumbersTable();
  buildStarsTable();
  buildDelayTable();
  buildHistory();
  buildGenModes();
  updateGenUI();
  document.getElementById('data-info').textContent = `${TOTAL_DRAWS} tirages analysés (2004–2025)`;
  await fetchLiveDraws();
});

// ── Live fetch (Netlify function) ─────────────────────────────
async function fetchLiveDraws() {
  try {
    const res = await fetch('/.netlify/functions/draws');
    if (!res.ok) throw new Error('err');
    const data = await res.json();
    const draws = Array.isArray(data) ? data : (data.draws || []);
    const converted = draws.map(d => ({
      date: d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '–',
      numbers: d.numbers || [],
      stars: d.stars || d.luckyStars || []
    })).filter(d => d.numbers.length === 5 && d.stars.length === 2);
    if (converted.length > 0) {
      const merged = mergeDraws(converted, RECENT_DRAWS);
      RECENT_DRAWS.length = 0;
      merged.forEach(d => RECENT_DRAWS.push(d));
      if (currentGame === 'euro') { buildDelayTable(); buildHistory(); }
      document.getElementById('data-info').textContent =
        `✅ ${TOTAL_DRAWS} tirages — Mis à jour le ${new Date().toLocaleDateString('fr-FR')}`;
    }
  } catch(e) {
    // fallback silencieux
  }
}

function mergeDraws(live, local) {
  const seen = new Set();
  return [...live, ...local].filter(d => {
    if (seen.has(d.date)) return false;
    seen.add(d.date); return true;
  }).slice(0, 60);
}

// ── Navigation ────────────────────────────────────────────────
function showPanel(id, tabEl) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active');
    t.className = 'tab ' + (currentGame === 'euro' ? 'euro-tab' : 'loto-tab');
  });
  document.getElementById('panel-' + id).classList.add('active');
  if (tabEl) tabEl.classList.add('active');
}

function showPanelDirect(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
}

// ── Data helpers ──────────────────────────────────────────────
function getFreq() { return currentGame === 'euro' ? NUM_FREQ : LOTO_NUM_FREQ; }
function getExtraFreq() { return currentGame === 'euro' ? STAR_FREQ : LOTO_CHANCE_FREQ; }
function getDraws() { return currentGame === 'euro' ? RECENT_DRAWS : LOTO_RECENT_DRAWS; }
function getTotal() { return currentGame === 'euro' ? TOTAL_DRAWS : LOTO_TOTAL_DRAWS; }
function getRange() { return currentGame === 'euro' ? 50 : 49; }
function getExtraRange() { return currentGame === 'euro' ? 12 : 10; }
function accentClass() { return currentGame === 'euro' ? 'euro-accent' : 'loto-accent'; }
function ballClass() { return currentGame === 'euro' ? 'ball-num' : 'ball-loto'; }
function extraBallClass() { return currentGame === 'euro' ? 'ball-star' : 'ball-chance'; }
function ndClass() { return currentGame === 'euro' ? 'nd-euro' : 'nd-loto'; }
function ndExtraClass() { return currentGame === 'euro' ? 'nd-star' : 'nd-chance'; }
function barClass() { return currentGame === 'euro' ? 'bar-euro' : 'bar-loto'; }
function barExtraClass() { return currentGame === 'euro' ? 'bar-star' : 'bar-chance'; }

function sortedNums() {
  const freq = getFreq(); const total = getTotal();
  return Object.entries(freq)
    .map(([n,c]) => ({ num:parseInt(n), count:c, pct:(c/total*100).toFixed(2) }))
    .sort((a,b) => b.count - a.count);
}

function sortedExtra() {
  const freq = getExtraFreq(); const total = getTotal();
  return Object.entries(freq)
    .map(([n,c]) => ({ num:parseInt(n), count:c, pct:(c/total*100).toFixed(2) }))
    .sort((a,b) => b.count - a.count);
}

// Poids récents : les 50 derniers tirages comptent 3x plus que les anciens
function buildWeightedFreq(type) {
  const freq = type === 'main' ? { ...getFreq() } : { ...getExtraFreq() };
  const draws = getDraws();
  const recent = draws.slice(0, 50);

  recent.forEach(d => {
    const arr = type === 'main' ? d.numbers : (d.stars || [d.chance]);
    arr.forEach(n => { if (freq[n] !== undefined) freq[n] += 2; }); // bonus récence
  });

  return freq;
}

function computeDelays(type) {
  const draws = getDraws();
  const range = type === 'main' ? getRange() : getExtraRange();
  const result = {};
  for (let i = 1; i <= range; i++) result[i] = { lastDate:'–', delay: draws.length };
  draws.forEach((draw, idx) => {
    const arr = type === 'main' ? draw.numbers : (draw.stars || (draw.chance ? [draw.chance] : []));
    arr.forEach(n => {
      if (result[n] && result[n].delay === draws.length) {
        result[n].lastDate = draw.date;
        result[n].delay = idx;
      }
    });
  });
  return result;
}

// ── Overview ──────────────────────────────────────────────────
function buildOverview() {
  const nums = sortedNums();
  const extras = sortedExtra();
  const isEuro = currentGame === 'euro';
  const ac = accentClass();

  document.getElementById('overview-cards').innerHTML = `
    <div class="card"><div class="card-label">Tirages analysés</div><div class="card-value ${currentGame}">${getTotal().toLocaleString('fr')}</div><div class="card-sub">depuis ${isEuro ? 'fév. 2004' : '2008'}</div></div>
    <div class="card"><div class="card-label">N° le + fréquent</div><div class="card-value ${currentGame}">${nums[0].num}</div><div class="card-sub">${nums[0].count} sorties (${nums[0].pct}%)</div></div>
    <div class="card"><div class="card-label">N° le + rare</div><div class="card-value ${currentGame}">${nums[nums.length-1].num}</div><div class="card-sub">${nums[nums.length-1].count} sorties (${nums[nums.length-1].pct}%)</div></div>
    <div class="card"><div class="card-label">Prob. grille exacte</div><div class="card-value ${currentGame}" style="font-size:16px;line-height:1.5">${isEuro ? '1/139M' : '1/19M'}</div><div class="card-sub">${isEuro ? '1 / 139 838 160' : '1 / 19 068 840'}</div></div>
    <div class="card"><div class="card-label">Prob. par numéro</div><div class="card-value ${currentGame}">${isEuro ? '10%' : '10.2%'}</div><div class="card-sub">par tirage</div></div>
    <div class="card"><div class="card-label">Prob. ${isEuro ? 'étoile' : 'n° chance'}</div><div class="card-value ${currentGame}">${isEuro ? '16.7%' : '10%'}</div><div class="card-sub">par tirage</div></div>
  `;

  document.getElementById('hot-title').className = `section-title ${ac}`;
  document.getElementById('hot-title').textContent = '🔥 Top 10 Numéros les plus fréquents';
  document.getElementById('hot-extra-title').className = `section-title ${ac}`;
  document.getElementById('hot-extra-title').textContent = isEuro ? '⭐ Top 6 Étoiles' : '🍀 Top 5 N° Chance';

  document.getElementById('top-nums').innerHTML = nums.slice(0,10).map(n => `
    <div class="top-ball"><div class="ball ${ballClass()}">${n.num}</div><div class="ball-count">${n.count}×</div></div>
  `).join('');

  document.getElementById('top-extra').innerHTML = extras.slice(0, isEuro ? 6 : 5).map(s => `
    <div class="top-ball"><div class="ball ${extraBallClass()}">${s.num}</div><div class="ball-count">${s.count}×</div></div>
  `).join('');

  document.getElementById('cold-nums').innerHTML = nums.slice(-8).reverse().map(n => `
    <div class="top-ball"><div class="ball ball-cold">${n.num}</div><div class="ball-count">${n.count}×</div></div>
  `).join('');
}

// ── Numbers table ─────────────────────────────────────────────
function buildNumbersTable() {
  const nums = sortedNums();
  const max = nums[0].count;
  document.getElementById('total-draws-label').textContent = `${getTotal()} tirages`;
  document.getElementById('numbers-table').innerHTML = nums.map((n,i) => `
    <tr>
      <td>${rankBadge(i+1)}</td>
      <td><span class="num-display ${ndClass()}">${n.num}</span></td>
      <td style="font-weight:600">${n.count}</td>
      <td><div class="bar-wrap"><div class="bar-fill ${barClass()}" style="width:${(n.count/max*100).toFixed(1)}%"></div></div></td>
      <td class="pct">${n.pct}%</td>
    </tr>
  `).join('');
}

// ── Stars/Chance table ────────────────────────────────────────
function buildStarsTable() {
  const extras = sortedExtra();
  const max = extras[0].count;
  const isEuro = currentGame === 'euro';
  document.getElementById('stars-title').textContent = isEuro ? '⭐ Fréquence de chaque étoile (1–12)' : '🍀 Fréquence du numéro chance (1–10)';
  document.getElementById('star-col-label').textContent = isEuro ? 'Étoile' : 'N° Chance';
  document.getElementById('stars-table').innerHTML = extras.map((s,i) => `
    <tr>
      <td>${rankBadge(i+1)}</td>
      <td><span class="num-display ${ndExtraClass()}">${isEuro ? '★' : '🍀'}${s.num}</span></td>
      <td style="font-weight:600">${s.count}</td>
      <td><div class="bar-wrap"><div class="bar-fill ${barExtraClass()}" style="width:${(s.count/max*100).toFixed(1)}%"></div></div></td>
      <td class="pct">${s.pct}%</td>
    </tr>
  `).join('');
}

// ── Delay table ───────────────────────────────────────────────
function buildDelayTable() {
  const isEuro = currentGame === 'euro';
  const numDelays = Object.entries(computeDelays('main'))
    .map(([n,d]) => ({num:parseInt(n),...d}))
    .sort((a,b) => b.delay - a.delay);
  const extraDelays = Object.entries(computeDelays('extra'))
    .map(([n,d]) => ({num:parseInt(n),...d}))
    .sort((a,b) => b.delay - a.delay);

  document.getElementById('delay-table').innerHTML = numDelays.map(n => `
    <tr>
      <td><span class="num-display ${ndClass()}">${n.num}</span></td>
      <td style="font-size:12px;color:var(--muted)">${n.lastDate}</td>
      <td style="font-weight:600">${n.delay}</td>
      <td>${delayBadge(n.delay)}</td>
    </tr>
  `).join('');

  document.getElementById('delay-extra-title').textContent = isEuro ? '⏱️ Retard des étoiles' : '⏱️ Retard du numéro chance';
  document.getElementById('delay-extra-col').textContent = isEuro ? 'Étoile' : 'N° Chance';
  document.getElementById('delay-extra-table').innerHTML = extraDelays.map(s => `
    <tr>
      <td><span class="num-display ${ndExtraClass()}">${s.num}</span></td>
      <td style="font-size:12px;color:var(--muted)">${s.lastDate}</td>
      <td style="font-weight:600">${s.delay}</td>
      <td>${delayBadge(s.delay)}</td>
    </tr>
  `).join('');
}

// ── History ───────────────────────────────────────────────────
function buildHistory() {
  const isEuro = currentGame === 'euro';
  document.getElementById('history-list').innerHTML = getDraws().map(draw => `
    <div class="draw-item">
      <div class="draw-date">${draw.date}</div>
      <div class="draw-balls">
        ${draw.numbers.map(n => `<div class="small-ball ${ballClass()}">${n}</div>`).join('')}
        <span class="draw-sep">·</span>
        ${isEuro
          ? (draw.stars||[]).map(s => `<div class="small-ball ${extraBallClass()}">${s}</div>`).join('')
          : `<div class="small-ball ${extraBallClass()}">${draw.chance}</div>`
        }
      </div>
    </div>
  `).join('');
}

// ── Generator UI ──────────────────────────────────────────────
function buildGenModes() {
  const isEuro = currentGame === 'euro';
  const mc = isEuro ? 'euro-mode' : 'loto-mode';
  const modes = [
    { id:'random', label:'🎲 Aléatoire pondéré' },
    { id:'hot', label:'🔥 Numéros chauds' },
    { id:'cold', label:'❄️ Numéros froids' },
    { id:'balanced', label:'⚖️ Équilibré' },
    { id:'overdue', label:'⏱️ En retard' },
    { id:'recent', label:'📅 Tendance récente' },
  ];
  document.getElementById('gen-modes').innerHTML = modes.map(m => `
    <button class="mode-btn ${m.id === currentMode ? 'active '+mc : ''}" onclick="setMode('${m.id}', this)">${m.label}</button>
  `).join('');
}

function updateGenUI() {
  const isEuro = currentGame === 'euro';
  const btn = document.getElementById('gen-btn');
  btn.className = 'gen-btn ' + (isEuro ? 'euro-btn' : 'loto-btn');
}

function setMode(mode, btn) {
  currentMode = mode;
  const mc = currentGame === 'euro' ? 'euro-mode' : 'loto-mode';
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active','euro-mode','loto-mode'));
  btn.classList.add('active', mc);
}

// ── Generator logic ───────────────────────────────────────────
function generateGrids() {
  const count = parseInt(document.getElementById('grid-count').value);
  const grilles = [];
  let attempts = 0;

  while (grilles.length < count && attempts < count * 20) {
    attempts++;
    const g = generateOneGrid();
    const key = g.numbers.join('-') + '|' + (g.extra || []).join('-');
    if (!generatedGrids.has(key)) {
      generatedGrids.add(key);
      grilles.push(g);
    }
  }

  displayGrids(grilles);
  grilles.forEach(g => addToHistory(g));
}

function generateOneGrid() {
  const delays = computeDelays('main');
  const extraDelays = computeDelays('extra');
  const isEuro = currentGame === 'euro';

  let mainWeights, extraWeights;

  switch (currentMode) {
    case 'hot':
      mainWeights = buildWeights('hot', 'main');
      extraWeights = buildWeights('hot', 'extra');
      break;
    case 'cold':
      mainWeights = buildWeights('cold', 'main');
      extraWeights = buildWeights('cold', 'extra');
      break;
    case 'overdue':
      mainWeights = buildWeights('overdue', 'main', delays);
      extraWeights = buildWeights('overdue', 'extra', extraDelays);
      break;
    case 'recent':
      mainWeights = buildWeightsRecent('main');
      extraWeights = buildWeightsRecent('extra');
      break;
    case 'balanced':
      return balancedGrid();
    default: // random pondéré
      mainWeights = buildWeights('equal', 'main');
      extraWeights = buildWeights('equal', 'extra');
  }

  const numbers = weightedPick(mainWeights, 5).sort((a,b) => a-b);
  const extra = weightedPick(extraWeights, isEuro ? 2 : 1).sort((a,b) => a-b);
  return { numbers, extra };
}

// Poids amplifié sur les 50 derniers tirages
function buildWeightsRecent(type) {
  const weighted = buildWeightedFreq(type);
  return Object.entries(weighted).map(([n,w]) => ({ num:parseInt(n), weight: Math.pow(w,1.5) }));
}

function buildWeights(strategy, type, delayData) {
  const freq = type === 'main' ? getFreq() : getExtraFreq();
  const entries = [];
  for (const [n, f] of Object.entries(freq)) {
    let weight;
    const maxF = Math.max(...Object.values(freq));
    switch (strategy) {
      case 'hot':    weight = Math.pow(f, 2); break;
      case 'cold':   weight = Math.pow(maxF - f + 1, 2); break;
      case 'overdue':
        const d = delayData?.[parseInt(n)]?.delay ?? 0;
        weight = Math.pow(d + 1, 2); break;
      default:       weight = f;
    }
    entries.push({ num: parseInt(n), weight });
  }
  return entries;
}

function balancedGrid() {
  const nums = sortedNums();
  const extras = sortedExtra();
  const isEuro = currentGame === 'euro';
  const hot = nums.slice(0,15).map(n => n.num);
  const cold = nums.slice(-12).map(n => n.num);
  const mid = nums.slice(15,35).map(n => n.num);

  let result = [];
  result.push(...pickRandom(hot, 2));
  result.push(...pickRandom(mid.filter(n => !result.includes(n)), 1));
  result.push(...pickRandom(cold.filter(n => !result.includes(n)), 1));
  const all = Array.from({length: getRange()}, (_,i) => i+1).filter(n => !result.includes(n));
  result.push(...pickRandom(all, 1));

  const extraHot = extras.slice(0, isEuro ? 6 : 4).map(s => s.num);
  const extraAll = extras.map(s => s.num).filter(n => !extraHot.includes(n));
  const extraPool = [...extraHot, ...pickRandom(extraAll, isEuro ? 3 : 2)];
  const extra = pickRandom(extraPool, isEuro ? 2 : 1);

  return { numbers: [...new Set(result)].slice(0,5).sort((a,b) => a-b), extra: extra.sort((a,b) => a-b) };
}

function weightedPick(entries, n) {
  const pool = [...entries];
  const result = [];
  while (result.length < n && pool.length > 0) {
    const total = pool.reduce((s,e) => s+e.weight, 0);
    let rand = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      rand -= pool[i].weight;
      if (rand <= 0) { idx = i; break; }
    }
    result.push(pool[idx].num);
    pool.splice(idx, 1);
  }
  return result;
}

function pickRandom(arr, n) {
  const copy = [...arr]; const result = [];
  while (result.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx,1)[0]);
  }
  return result;
}

// ── Display grilles ───────────────────────────────────────────
function displayGrids(grilles) {
  const isEuro = currentGame === 'euro';
  const container = document.getElementById('grilles-result');
  container.innerHTML = grilles.map((g, gi) => `
    <div class="grille-item">
      <span class="grille-num">#${gi+1}</span>
      <div class="grille-balls">
        ${g.numbers.map((n, i) => `
          <div class="gen-ball ${ballClass()}" id="gb${gi}_${i}" style="transition-delay:${i*0.07}s">${n}</div>
        `).join('')}
        <span class="sep-dot" id="sep${gi}">·</span>
        ${(g.extra||[]).map((s, i) => `
          <div class="gen-ball ${extraBallClass()}" id="gs${gi}_${i}" style="transition-delay:${(i+5)*0.07}s">${s}</div>
        `).join('')}
      </div>
      <span class="grille-strategy">${modeLabel(currentMode)}</span>
    </div>
  `).join('');

  // Animate in
  requestAnimationFrame(() => {
    grilles.forEach((g, gi) => {
      g.numbers.forEach((_,i) => setTimeout(() => document.getElementById(`gb${gi}_${i}`)?.classList.add('visible'), gi*80 + i*70));
      setTimeout(() => document.getElementById(`sep${gi}`)?.classList.add('visible'), gi*80 + 5*70);
      (g.extra||[]).forEach((_,i) => setTimeout(() => document.getElementById(`gs${gi}_${i}`)?.classList.add('visible'), gi*80 + (i+5)*70));
    });
  });
}

function modeLabel(mode) {
  return { random:'🎲 Aléatoire', hot:'🔥 Chauds', cold:'❄️ Froids', balanced:'⚖️ Équilibré', overdue:'⏱️ En retard', recent:'📅 Tendance récente' }[mode] || mode;
}

function addToHistory(g) {
  const isEuro = currentGame === 'euro';
  const date = new Date().toLocaleDateString('fr-FR');
  genHistory.unshift({ ...g, date, mode: modeLabel(currentMode), game: currentGame });

  const container = document.getElementById('gen-history');
  if (!genHistory.length) { container.textContent = 'Aucune grille générée.'; return; }

  container.innerHTML = genHistory.slice(0, 20).map(h => `
    <div class="gen-hist-item">
      <span style="font-size:11px;color:var(--muted);min-width:55px">${h.date}</span>
      <span style="font-size:10px;padding:2px 7px;border-radius:4px;background:var(--surface2);color:var(--muted)">${h.game === 'euro' ? '🌟 EM' : '🎱 Loto'}</span>
      <span style="font-size:11px;color:var(--muted)">${h.mode}</span>
      <div style="display:flex;gap:4px;align-items:center;margin-left:auto;flex-wrap:wrap">
        ${h.numbers.map(n => `<div class="small-ball ${h.game==='euro'?'ball-num':'ball-loto'}" style="width:28px;height:28px;font-size:12px">${n}</div>`).join('')}
        <span style="color:var(--muted)">·</span>
        ${(h.extra||[]).map(s => `<div class="small-ball ${h.game==='euro'?'ball-star':'ball-chance'}" style="width:28px;height:28px;font-size:12px">${s}</div>`).join('')}
      </div>
    </div>
  `).join('');
}

function clearHistory() {
  genHistory = [];
  document.getElementById('gen-history').textContent = 'Aucune grille générée.';
}

// ── Helpers ───────────────────────────────────────────────────
function rankBadge(r) {
  if (r===1) return `<span class="rank-badge gold">1</span>`;
  if (r===2) return `<span class="rank-badge silver">2</span>`;
  if (r===3) return `<span class="rank-badge bronze">3</span>`;
  return `<span class="rank-badge">${r}</span>`;
}
function delayBadge(d) {
  if (d <= 5) return `<span class="delay-badge delay-hot">Récent (${d})</span>`;
  if (d <= 15) return `<span class="delay-badge delay-warm">Normal (${d})</span>`;
  return `<span class="delay-badge delay-cold">En retard (${d})</span>`;
}
