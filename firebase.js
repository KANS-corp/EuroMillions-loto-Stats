// ============================================================
// FIREBASE — Configuration et fonctions Firestore
// Projet : euromillions-stats
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  where,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDrydSiJG552LgVLdZ7GbF3-FgCdihbJIA",
  authDomain: "euromillions-stats-c7fb5.firebaseapp.com",
  projectId: "euromillions-stats-c7fb5",
  storageBucket: "euromillions-stats-c7fb5.firebasestorage.app",
  messagingSenderId: "787555643782",
  appId: "1:787555643782:web:d41e1003136ad70fa8bc07"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── SAUVEGARDER UNE GRILLE GÉNÉRÉE ───────────────────────────
export async function saveGrille(grille) {
  try {
    const docRef = await addDoc(collection(db, "grilles"), {
      game: grille.game,           // 'euro' ou 'loto'
      numbers: grille.numbers,
      extra: grille.extra,
      strategy: grille.strategy,
      createdAt: new Date().toISOString(),
      scored: false,               // pas encore comparé à un vrai tirage
      score: null
    });
    console.log("Grille sauvegardée :", docRef.id);
    return docRef.id;
  } catch(e) {
    console.error("Erreur sauvegarde grille :", e);
    return null;
  }
}

// ── RÉCUPÉRER LES GRILLES NON SCORÉES ────────────────────────
export async function getUnscoredGrilles(game) {
  try {
    const q = query(
      collection(db, "grilles"),
      where("scored", "==", false),
      where("game", "==", game),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) {
    console.error("Erreur récupération grilles :", e);
    return [];
  }
}

// ── SCORER UNE GRILLE CONTRE UN TIRAGE RÉEL ──────────────────
export async function scoreGrille(grilleId, grilleData, tirageReel) {
  try {
    // Calcule le score
    const numsCommuns = grilleData.numbers.filter(n => 
      tirageReel.numbers.includes(n)
    ).length;
    
    const extraCommuns = grilleData.extra.filter(e => 
      (tirageReel.stars || [tirageReel.chance]).includes(e)
    ).length;

    const score = { nums: numsCommuns, extra: extraCommuns };

    // Met à jour la grille dans Firestore
    await updateDoc(doc(db, "grilles", grilleId), {
      scored: true,
      score: score,
      tirageDate: tirageReel.date,
      scoredAt: new Date().toISOString()
    });

    // Met à jour les performances de la stratégie
    await updateStrategyPerformance(grilleData.strategy, score, grilleData.game);

    return score;
  } catch(e) {
    console.error("Erreur scoring :", e);
    return null;
  }
}

// ── METTRE À JOUR LES PERFORMANCES D'UNE STRATÉGIE ───────────
async function updateStrategyPerformance(strategy, score, game) {
  try {
    const perfId = `${game}_${strategy}`;
    const perfRef = doc(db, "performances", perfId);
    const perfSnap = await getDoc(perfRef);

    if (perfSnap.exists()) {
      await updateDoc(perfRef, {
        totalGrilles: increment(1),
        totalNums: increment(score.nums),
        totalExtra: increment(score.extra),
        // Compteurs par score
        [`score_${score.nums}_${score.extra}`]: increment(1)
      });
    } else {
      await setDoc(perfRef, {
        strategy,
        game,
        totalGrilles: 1,
        totalNums: score.nums,
        totalExtra: score.extra,
        [`score_${score.nums}_${score.extra}`]: 1,
        createdAt: new Date().toISOString()
      });
    }
  } catch(e) {
    console.error("Erreur update performance :", e);
  }
}

// ── RÉCUPÉRER LES PERFORMANCES DE TOUTES LES STRATÉGIES ──────
export async function getAllPerformances(game) {
  try {
    const q = query(
      collection(db, "performances"),
      where("game", "==", game)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) {
    console.error("Erreur récupération performances :", e);
    return [];
  }
}

// ── ENTRAÎNEMENT SUR TIRAGES HISTORIQUES ─────────────────────
export async function trainOnHistoricalData(draws, game) {
  console.log(`🧠 Entraînement sur ${draws.length} tirages historiques...`);
  
  const strategies = ['random', 'hot', 'cold', 'balanced', 'overdue', 'recent'];
  const results = {};

  for (const strategy of strategies) {
    let totalNums = 0;
    let totalExtra = 0;
    let totalGrilles = 0;
    const scoreDistrib = {};

    // Pour chaque tirage historique, simule 10 grilles avec cette stratégie
    for (let i = 1; i < draws.length; i++) {
      const pastDraws = draws.slice(i); // tirages connus avant ce tirage
      const realDraw = draws[i - 1];    // le vrai tirage à deviner

      for (let j = 0; j < 10; j++) {
        const grille = simulateGrid(strategy, pastDraws, game);
        const numsScore = grille.numbers.filter(n => 
          realDraw.numbers.includes(n)
        ).length;
        const extraScore = grille.extra.filter(e => 
          (realDraw.stars || [realDraw.chance]).includes(e)
        ).length;

        totalNums += numsScore;
        totalExtra += extraScore;
        totalGrilles++;

        const key = `${numsScore}_${extraScore}`;
        scoreDistrib[key] = (scoreDistrib[key] || 0) + 1;
      }
    }

    results[strategy] = {
      strategy,
      game,
      totalGrilles,
      totalNums,
      totalExtra,
      avgNums: (totalNums / totalGrilles).toFixed(3),
      avgExtra: (totalExtra / totalGrilles).toFixed(3),
      scoreDistrib,
      isTraining: true,
      trainedAt: new Date().toISOString()
    };

    // Sauvegarde dans Firestore
    await setDoc(doc(db, "performances", `${game}_${strategy}`), results[strategy]);
    console.log(`✅ ${strategy}: avg ${results[strategy].avgNums} nums / ${results[strategy].avgExtra} extra`);
  }

  return results;
}

// ── ENTRAÎNEMENT SUR TIRAGES FICTIFS ─────────────────────────
export async function trainOnFictiveData(nbTirages, game) {
  console.log(`🎲 Génération de ${nbTirages} tirages fictifs...`);
  
  const fictiveDraws = [];
  const range = game === 'euro' ? 50 : 49;
  const extraRange = game === 'euro' ? 12 : 10;
  const extraCount = game === 'euro' ? 2 : 1;

  // Génère des tirages fictifs réalistes basés sur les vraies fréquences
  const freq = game === 'euro' ? NUM_FREQ : LOTO_NUM_FREQ;
  const extraFreq = game === 'euro' ? STAR_FREQ : LOTO_CHANCE_FREQ;

  for (let i = 0; i < nbTirages; i++) {
    const numbers = weightedPickFromFreq(freq, 5);
    const extra = weightedPickFromFreq(extraFreq, extraCount);
    fictiveDraws.push({ 
      numbers: numbers.sort((a,b) => a-b), 
      stars: game === 'euro' ? extra : undefined,
      chance: game === 'loto' ? extra[0] : undefined,
      date: `fictif_${i}` 
    });
  }

  console.log(`✅ ${fictiveDraws.length} tirages fictifs générés`);
  return await trainOnHistoricalData(fictiveDraws, game);
}

// ── TIRAGE PONDÉRÉ PAR FRÉQUENCES RÉELLES ────────────────────
function weightedPickFromFreq(freq, n) {
  const entries = Object.entries(freq).map(([num, w]) => ({ 
    num: parseInt(num), weight: w 
  }));
  const result = [];
  const pool = [...entries];

  while (result.length < n && pool.length > 0) {
    const total = pool.reduce((s, e) => s + e.weight, 0);
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

// ── RÉCUPÉRER LA MEILLEURE STRATÉGIE ─────────────────────────
export async function getBestStrategy(game) {
  try {
    const perfs = await getAllPerformances(game);
    if (!perfs.length) return null;

    // Trie par moyenne de bons numéros
    perfs.sort((a, b) => parseFloat(b.avgNums) - parseFloat(a.avgNums));
    return perfs[0];
  } catch(e) {
    return null;
  }
}

// ── SIMULER UNE GRILLE (version simplifiée pour entraînement) ─
function simulateGrid(strategy, pastDraws, game) {
  const freq = game === 'euro' ? { ...NUM_FREQ } : { ...LOTO_NUM_FREQ };
  const extraFreq = game === 'euro' ? { ...STAR_FREQ } : { ...LOTO_CHANCE_FREQ };
  const isEuro = game === 'euro';

  let numbers, extra;

  switch(strategy) {
    case 'hot':
      numbers = weightedPickFromFreq(
        Object.fromEntries(Object.entries(freq).map(([k,v]) => [k, Math.pow(v,2)])), 5
      );
      extra = weightedPickFromFreq(
        Object.fromEntries(Object.entries(extraFreq).map(([k,v]) => [k, Math.pow(v,2)])), 
        isEuro ? 2 : 1
      );
      break;
    case 'cold':
      const maxF = Math.max(...Object.values(freq));
      numbers = weightedPickFromFreq(
        Object.fromEntries(Object.entries(freq).map(([k,v]) => [k, Math.pow(maxF-v+1,2)])), 5
      );
      const maxE = Math.max(...Object.values(extraFreq));
      extra = weightedPickFromFreq(
        Object.fromEntries(Object.entries(extraFreq).map(([k,v]) => [k, Math.pow(maxE-v+1,2)])),
        isEuro ? 2 : 1
      );
      break;
    default:
      numbers = weightedPickFromFreq(freq, 5);
      extra = weightedPickFromFreq(extraFreq, isEuro ? 2 : 1);
  }

  return { 
    numbers: numbers.sort((a,b) => a-b), 
    extra: extra.sort((a,b) => a-b) 
  };
}
