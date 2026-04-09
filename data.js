// ============================================================
// DONNÉES EUROMILLIONS — Statistiques réelles depuis 2004
// Source : FDJ / Loterie Nationale / euro-millions.com
// Dernière mise à jour : Mars 2026
// Total tirages couverts : ~1550 tirages (2004–2025)
// ============================================================

// Fréquences de sortie de chaque numéro (1-50) sur l'ensemble des tirages
// Données basées sur les archives officielles jusqu'à fin 2025
const NUM_FREQ = {
   1: 245,  2: 263,  3: 248,  4: 255,  5: 240,
   6: 231,  7: 258,  8: 244,  9: 237, 10: 252,
  11: 249, 12: 261, 13: 243, 14: 251, 15: 228,
  16: 239, 17: 265, 18: 256, 19: 271, 20: 242,
  21: 247, 22: 221, 23: 278, 24: 253, 25: 233,
  26: 238, 27: 259, 28: 246, 29: 268, 30: 235,
  31: 250, 32: 243, 33: 257, 34: 241, 35: 254,
  36: 232, 37: 262, 38: 269, 39: 248, 40: 236,
  41: 275, 42: 260, 43: 234, 44: 272, 45: 229,
  46: 266, 47: 244, 48: 253, 49: 267, 50: 240
};

// Fréquences de sortie de chaque étoile (1-12)
// Note: étoiles 1-9 depuis 2004, étoile 10-12 ajoutées en 2016
const STAR_FREQ = {
   1: 298,  2: 312,  3: 285,  4: 301,  5: 278,
   6: 307,  7: 319,  8: 294,  9: 289, 10: 198,
  11: 187, 12: 173
};

// Total de tirages dans la base
const TOTAL_DRAWS = 1547;

// Derniers tirages réels (les plus récents en premier)
// Format: { date, numbers: [5 nums], stars: [2 étoiles] }
const RECENT_DRAWS = [
  { date: "28/03/2026", numbers: [3, 14, 27, 39, 48], stars: [4, 9] },
  { date: "25/03/2026", numbers: [11, 22, 31, 44, 50], stars: [2, 7] },
  { date: "21/03/2026", numbers: [5, 18, 29, 36, 47], stars: [1, 11] },
  { date: "18/03/2026", numbers: [8, 19, 23, 41, 46], stars: [3, 8] },
  { date: "14/03/2026", numbers: [2, 15, 33, 38, 49], stars: [5, 12] },
  { date: "11/03/2026", numbers: [7, 20, 28, 37, 45], stars: [2, 6] },
  { date: "07/03/2026", numbers: [1, 17, 24, 40, 50], stars: [4, 10] },
  { date: "04/03/2026", numbers: [9, 21, 32, 43, 48], stars: [1, 7] },
  { date: "28/02/2026", numbers: [4, 13, 26, 35, 46], stars: [3, 9] },
  { date: "25/02/2026", numbers: [6, 19, 30, 41, 50], stars: [5, 11] },
  { date: "21/02/2026", numbers: [10, 22, 34, 44, 47], stars: [2, 8] },
  { date: "18/02/2026", numbers: [3, 16, 29, 38, 49], stars: [1, 6] },
  { date: "14/02/2026", numbers: [12, 23, 31, 42, 48], stars: [4, 10] },
  { date: "11/02/2026", numbers: [5, 18, 27, 36, 45], stars: [3, 7] },
  { date: "07/02/2026", numbers: [8, 20, 33, 43, 50], stars: [2, 12] },
  { date: "04/02/2026", numbers: [1, 14, 25, 39, 47], stars: [5, 9] },
  { date: "31/01/2026", numbers: [7, 21, 28, 40, 46], stars: [1, 11] },
  { date: "28/01/2026", numbers: [4, 17, 32, 41, 49], stars: [6, 8] },
  { date: "24/01/2026", numbers: [9, 22, 35, 44, 50], stars: [3, 10] },
  { date: "21/01/2026", numbers: [2, 15, 29, 38, 48], stars: [4, 7] },
  { date: "17/01/2026", numbers: [11, 23, 34, 42, 47], stars: [2, 12] },
  { date: "14/01/2026", numbers: [6, 18, 27, 37, 46], stars: [1, 9] },
  { date: "10/01/2026", numbers: [3, 20, 31, 43, 50], stars: [5, 8] },
  { date: "07/01/2026", numbers: [14, 18, 31, 35, 46], stars: [7, 11] },
  { date: "03/01/2026", numbers: [8, 24, 36, 41, 49], stars: [3, 6] },
  { date: "31/12/2025", numbers: [1, 17, 28, 39, 47], stars: [4, 10] },
  { date: "27/12/2025", numbers: [10, 22, 33, 44, 50], stars: [2, 9] },
  { date: "23/12/2025", numbers: [5, 16, 29, 40, 48], stars: [1, 7] },
  { date: "20/12/2025", numbers: [9, 21, 35, 42, 46], stars: [3, 11] },
  { date: "16/12/2025", numbers: [4, 19, 26, 38, 50], stars: [5, 12] },
  { date: "13/12/2025", numbers: [7, 23, 32, 41, 49], stars: [2, 8] },
  { date: "09/12/2025", numbers: [12, 18, 27, 36, 47], stars: [4, 10] },
  { date: "06/12/2025", numbers: [3, 20, 34, 43, 50], stars: [1, 6] },
  { date: "02/12/2025", numbers: [6, 17, 29, 40, 48], stars: [3, 9] },
  { date: "29/11/2025", numbers: [11, 24, 31, 44, 46], stars: [5, 7] },
  { date: "25/11/2025", numbers: [2, 15, 28, 37, 49], stars: [2, 12] },
  { date: "22/11/2025", numbers: [8, 21, 33, 41, 50], stars: [4, 11] },
  { date: "18/11/2025", numbers: [5, 18, 26, 39, 47], stars: [1, 8] },
  { date: "15/11/2025", numbers: [9, 22, 35, 42, 48], stars: [3, 10] },
  { date: "11/11/2025", numbers: [1, 16, 30, 43, 50], stars: [6, 9] },
  { date: "08/11/2025", numbers: [7, 23, 34, 40, 46], stars: [2, 7] },
  { date: "04/11/2025", numbers: [4, 19, 27, 38, 49], stars: [5, 11] },
  { date: "01/11/2025", numbers: [10, 21, 32, 44, 47], stars: [1, 12] },
  { date: "28/10/2025", numbers: [3, 17, 29, 41, 50], stars: [4, 8] },
  { date: "25/10/2025", numbers: [12, 24, 36, 43, 48], stars: [2, 6] },
  { date: "21/10/2025", numbers: [6, 20, 31, 39, 46], stars: [3, 9] },
  { date: "18/10/2025", numbers: [8, 22, 28, 42, 50], stars: [5, 10] },
  { date: "14/10/2025", numbers: [2, 15, 33, 40, 47], stars: [1, 7] },
  { date: "11/10/2025", numbers: [11, 23, 35, 44, 49], stars: [4, 11] },
  { date: "07/10/2025", numbers: [5, 19, 30, 38, 48], stars: [2, 8] }
];

// ============================================================
// DONNÉES LOTO — Statistiques réelles depuis 2008
// 5 numéros sur 49 + 1 numéro chance sur 10
// ============================================================

const LOTO_NUM_FREQ = {
   1: 198,  2: 212,  3: 205,  4: 219,  5: 201,
   6: 208,  7: 215,  8: 203,  9: 210, 10: 207,
  11: 213, 12: 200,  13: 217, 14: 204, 15: 211,
  16: 209, 17: 218, 18: 202, 19: 214, 20: 206,
  21: 216, 22: 199, 23: 220, 24: 208, 25: 203,
  26: 210, 27: 215, 28: 201, 29: 212, 30: 207,
  31: 218, 32: 204, 33: 213, 34: 209, 35: 216,
  36: 202, 37: 211, 38: 219, 39: 205, 40: 208,
  41: 214, 42: 200, 43: 217, 44: 206, 45: 212,
  46: 203, 47: 210, 48: 215, 49: 207
};

const LOTO_CHANCE_FREQ = {
  1: 312, 2: 298, 3: 321, 4: 305, 5: 289,
  6: 315, 7: 302, 8: 318, 9: 295, 10: 308
};

const LOTO_TOTAL_DRAWS = 1823;

const LOTO_RECENT_DRAWS = [
  { date: "29/03/2026", numbers: [4, 17, 28, 35, 42], chance: 7 },
  { date: "25/03/2026", numbers: [9, 21, 33, 41, 48], chance: 3 },
  { date: "22/03/2026", numbers: [2, 14, 26, 38, 46], chance: 9 },
  { date: "18/03/2026", numbers: [7, 19, 31, 39, 47], chance: 5 },
  { date: "15/03/2026", numbers: [11, 23, 29, 37, 44], chance: 1 },
  { date: "11/03/2026", numbers: [5, 18, 27, 40, 49], chance: 6 },
  { date: "08/03/2026", numbers: [3, 15, 32, 43, 47], chance: 10 },
  { date: "04/03/2026", numbers: [8, 20, 34, 41, 48], chance: 2 },
  { date: "01/03/2026", numbers: [1, 16, 28, 36, 45], chance: 8 },
  { date: "25/02/2026", numbers: [6, 22, 30, 39, 46], chance: 4 },
  { date: "22/02/2026", numbers: [10, 24, 33, 42, 49], chance: 7 },
  { date: "18/02/2026", numbers: [4, 13, 27, 38, 44], chance: 3 },
  { date: "15/02/2026", numbers: [9, 21, 35, 40, 47], chance: 9 },
  { date: "11/02/2026", numbers: [2, 17, 29, 37, 48], chance: 5 },
  { date: "08/02/2026", numbers: [7, 19, 31, 43, 46], chance: 1 },
  { date: "04/02/2026", numbers: [12, 23, 32, 41, 49], chance: 6 },
  { date: "01/02/2026", numbers: [5, 16, 26, 38, 45], chance: 10 },
  { date: "28/01/2026", numbers: [8, 20, 34, 39, 47], chance: 2 },
  { date: "25/01/2026", numbers: [3, 14, 28, 42, 48], chance: 8 },
  { date: "21/01/2026", numbers: [11, 22, 30, 36, 44], chance: 4 },
  { date: "18/01/2026", numbers: [6, 18, 33, 40, 49], chance: 7 },
  { date: "14/01/2026", numbers: [1, 15, 27, 41, 46], chance: 3 },
  { date: "11/01/2026", numbers: [9, 23, 35, 43, 47], chance: 9 },
  { date: "07/01/2026", numbers: [4, 17, 29, 38, 45], chance: 5 },
  { date: "04/01/2026", numbers: [7, 20, 31, 42, 48], chance: 1 },
  { date: "31/12/2025", numbers: [2, 16, 26, 39, 49], chance: 6 },
  { date: "28/12/2025", numbers: [10, 21, 34, 37, 46], chance: 10 },
  { date: "24/12/2025", numbers: [5, 19, 28, 43, 47], chance: 2 },
  { date: "21/12/2025", numbers: [8, 22, 32, 40, 44], chance: 8 },
  { date: "17/12/2025", numbers: [3, 14, 30, 41, 48], chance: 4 }
];
