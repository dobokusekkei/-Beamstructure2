export const INITIAL_SPAN = "6.0";
export const RESOLUTION = 400;
export const E_STEEL = 205000;
export const EPS = 1e-9; 

export const STEEL_DB: Record<string, any> = {
  'H-100x100x6x8':    { Ix: 378, Iy: 134, Zx: 75.6, Zy: 26.7, A: 21.59, w: 16.9 },
  'H-125x60x6x8':     { Ix: 413, Iy: 29.2, Zx: 66.1, Zy: 9.73, A: 16.84, w: 13.2 },
  'H-125x125x6.5x9':  { Ix: 847, Iy: 293, Zx: 136, Zy: 47.0, A: 30.00, w: 23.6 },
  'H-148x100x6x9':    { Ix: 711, Iy: 122, Zx: 96.2, Zy: 24.4, A: 26.84, w: 21.1 },
  'H-150x75x5x7':     { Ix: 666, Iy: 49.5, Zx: 88.8, Zy: 13.2, A: 17.85, w: 14.0 },
  'H-150x150x7x10':   { Ix: 1640, Iy: 563, Zx: 219, Zy: 75.1, A: 39.65, w: 31.1 },
  'H-175x90x5x8':     { Ix: 1210, Iy: 89.6, Zx: 138, Zy: 19.9, A: 23.04, w: 18.1 },
  'H-175x175x7.5x11': { Ix: 2900, Iy: 984, Zx: 331, Zy: 112, A: 51.21, w: 40.2 },
  'H-194x150x6x9':    { Ix: 2690, Iy: 507, Zx: 277, Zy: 67.6, A: 38.11, w: 29.9 },
  'H-200x100x5.5x8':  { Ix: 1840, Iy: 134, Zx: 184, Zy: 26.8, A: 27.16, w: 21.3 },
  'H-200x200x8x12':   { Ix: 4720, Iy: 1600, Zx: 472, Zy: 160, A: 63.53, w: 49.9 },
  'H-244x175x7x11':   { Ix: 6120, Iy: 984, Zx: 502, Zy: 113, A: 55.49, w: 43.6 },
  'H-250x125x6x9':    { Ix: 4050, Iy: 294, Zx: 324, Zy: 47.0, A: 37.66, w: 29.6 },
  'H-250x250x9x14':   { Ix: 10800, Iy: 3650, Zx: 867, Zy: 292, A: 91.43, w: 71.8 },
  'H-294x200x8x12':   { Ix: 11300, Iy: 1600, Zx: 771, Zy: 160, A: 72.38, w: 56.8 },
  'H-300x150x6.5x9':  { Ix: 7210, Iy: 488, Zx: 481, Zy: 65.1, A: 46.78, w: 36.7 },
  'H-300x300x10x15':  { Ix: 20200, Iy: 6750, Zx: 1350, Zy: 450, A: 118.4, w: 93.0 },
  'H-340x250x9x14':   { Ix: 15300, Iy: 3650, Zx: 903, Zy: 292, A: 101.5, w: 79.7 },
  'H-350x175x7x11':   { Ix: 13600, Iy: 984, Zx: 775, Zy: 112, A: 62.91, w: 49.4 },
  'H-350x350x12x19':  { Ix: 39800, Iy: 13600, Zx: 2280, Zy: 776, A: 171.9, w: 135 },
  'H-390x300x10x16':  { Ix: 38700, Iy: 7210, Zx: 1980, Zy: 481, A: 133.2, w: 105 },
  'H-400x200x8x13':   { Ix: 23700, Iy: 1740, Zx: 1190, Zy: 174, A: 83.37, w: 65.4 },
  'H-400x400x13x21':  { Ix: 66600, Iy: 22400, Zx: 3330, Zy: 1120, A: 218.7, w: 172 },
  'H-440x300x11x18':  { Ix: 56100, Iy: 8110, Zx: 2550, Zy: 541, A: 157.4, w: 124 },
  'H-450x200x9x14':   { Ix: 33500, Iy: 1870, Zx: 1490, Zy: 187, A: 96.76, w: 76.0 },
  'H-496x199x9x14':   { Ix: 41900, Iy: 1840, Zx: 1690, Zy: 185, A: 101.3, w: 79.5 },
  'H-500x200x10x16':  { Ix: 47800, Iy: 2140, Zx: 1910, Zy: 214, A: 114.2, w: 89.6 },
  'H-588x300x12x20':  { Ix: 118000, Iy: 9020, Zx: 4020, Zy: 601, A: 192.5, w: 151 },
  'H-600x200x11x17':  { Ix: 77600, Iy: 2280, Zx: 2590, Zy: 228, A: 134.4, w: 106 },

  'C-75x40x5x7':      { Ix: 75.3, Iy: 12.2, Zx: 20.1, Zy: 4.47, A: 8.818, w: 6.92 },
  'C-100x50x5x7.5':   { Ix: 188, Iy: 26.0, Zx: 37.6, Zy: 7.52, A: 11.92, w: 9.36 },
  'C-125x65x6x8':     { Ix: 424, Iy: 61.8, Zx: 67.8, Zy: 13.4, A: 17.11, w: 13.4 },
  'C-150x75x6.5x10':  { Ix: 861, Iy: 117, Zx: 115, Zy: 21.2, A: 23.71, w: 18.6 },
  'C-150x75x9x12.5':  { Ix: 1050, Iy: 147, Zx: 140, Zy: 26.6, A: 30.59, w: 24.0 },
  'C-180x75x7x10.5':  { Ix: 1380, Iy: 131, Zx: 153, Zy: 23.6, A: 27.20, w: 21.4 },
  'C-200x80x7.5x11':  { Ix: 1950, Iy: 168, Zx: 195, Zy: 27.4, A: 31.33, w: 24.6 },
  'C-200x90x8x13.5':  { Ix: 2490, Iy: 277, Zx: 249, Zy: 42.1, A: 38.65, w: 30.3 },
  'C-250x90x9x13':    { Ix: 4180, Iy: 294, Zx: 334, Zy: 43.6, A: 44.07, w: 34.6 },
  'C-300x90x9x13':    { Ix: 6440, Iy: 309, Zx: 429, Zy: 45.7, A: 48.57, w: 38.1 },
  'C-380x100x10.5x16': { Ix: 14500, Iy: 535, Zx: 763, Zy: 67.6, A: 69.39, w: 54.5 },

  'C-60x30x10x1.6':   { Ix: 10.6, Iy: 2.37, Zx: 3.54, Zy: 1.12, A: 2.155, w: 1.69 },
  'C-60x30x10x2.3':   { Ix: 14.6, Iy: 3.20, Zx: 4.88, Zy: 1.54, A: 3.018, w: 2.37 },
  'C-75x45x15x1.6':   { Ix: 27.0, Iy: 7.82, Zx: 7.19, Zy: 2.50, A: 2.955, w: 2.32 },
  'C-75x45x15x2.3':   { Ix: 37.6, Iy: 10.8, Zx: 10.0, Zy: 3.51, A: 4.168, w: 3.27 },
  'C-100x50x20x1.6':  { Ix: 58.7, Iy: 16.7, Zx: 11.7, Zy: 4.41, A: 3.675, w: 2.88 },
  'C-100x50x20x2.3':  { Ix: 82.2, Iy: 23.2, Zx: 16.4, Zy: 6.25, A: 5.203, w: 4.08 },
  'C-100x50x20x3.2':  { Ix: 109, Iy: 30.1, Zx: 21.8, Zy: 8.37, A: 7.077, w: 5.56 },
  'C-125x50x20x2.3':  { Ix: 133, Iy: 26.2, Zx: 21.3, Zy: 6.81, A: 5.778, w: 4.54 },
  'C-125x50x20x3.2':  { Ix: 178, Iy: 34.2, Zx: 28.5, Zy: 9.20, A: 7.877, w: 6.18 },
  'C-150x75x20x3.2':  { Ix: 387, Iy: 90.9, Zx: 51.6, Zy: 16.3, A: 10.68, w: 8.38 },

  'L-30x30x3':        { Ix: 1.13, Iy: 1.13, Zx: 0.52, Zy: 0.52, A: 1.727, w: 1.36 },
  'L-40x40x3':        { Ix: 2.87, Iy: 2.87, Zx: 0.98, Zy: 0.98, A: 2.327, w: 1.83 },
  'L-40x40x5':        { Ix: 4.45, Iy: 4.45, Zx: 1.58, Zy: 1.58, A: 3.755, w: 2.95 },
  'L-50x50x4':        { Ix: 9.38, Iy: 9.38, Zx: 2.57, Zy: 2.57, A: 3.892, w: 3.06 },
  'L-50x50x6':        { Ix: 13.3, Iy: 13.3, Zx: 3.73, Zy: 3.73, A: 5.644, w: 4.43 },
  'L-60x60x5':        { Ix: 20.3, Iy: 20.3, Zx: 4.71, Zy: 4.71, A: 5.747, w: 4.51 },
  'L-65x65x6':        { Ix: 33.3, Iy: 33.3, Zx: 7.11, Zy: 7.11, A: 7.527, w: 5.91 },
  'L-75x75x6':        { Ix: 52.4, Iy: 52.4, Zx: 9.85, Zy: 9.85, A: 8.727, w: 6.85 },
  'L-75x75x9':        { Ix: 75.2, Iy: 75.2, Zx: 14.5, Zy: 14.5, A: 12.69, w: 9.96 },
  'L-90x90x7':        { Ix: 107, Iy: 107, Zx: 16.7, Zy: 16.7, A: 12.22, w: 9.59 },
  'L-90x90x10':       { Ix: 147, Iy: 147, Zx: 23.6, Zy: 23.6, A: 17.00, w: 13.3 },
  'L-100x100x7':      { Ix: 150, Iy: 150, Zx: 21.0, Zy: 21.0, A: 13.62, w: 10.7 },
  'L-100x100x10':     { Ix: 207, Iy: 207, Zx: 29.5, Zy: 29.5, A: 19.00, w: 14.9 },
  'L-130x130x9':      { Ix: 395, Iy: 395, Zx: 42.9, Zy: 42.9, A: 22.74, w: 17.9 },
  'L-130x130x12':     { Ix: 516, Iy: 516, Zx: 57.0, Zy: 57.0, A: 29.76, w: 23.4 },
  'L-150x150x12':     { Ix: 804, Iy: 804, Zx: 75.7, Zy: 75.7, A: 34.77, w: 27.3 },

  'SP-II':   { Ix: 8740,  Zx: 874,  Iy: 0, Zy: 0, H: 100, B: 400, t: 10.5, A: 152.9, w: 120 },
  'SP-III':  { Ix: 16800, Zx: 1340, Iy: 0, Zy: 0, H: 125, B: 400, t: 13.0, A: 191.0, w: 150 },
  'SP-IV':   { Ix: 22700, Zx: 2270, Iy: 0, Zy: 0, H: 170, B: 400, t: 15.5, A: 242.5, w: 190 },
  'SP-VL':   { Ix: 31500, Zx: 3150, Iy: 0, Zy: 0, H: 200, B: 500, t: 24.3, A: 267.5, w: 210 },
  'SP-VIL':  { Ix: 38600, Zx: 3820, Iy: 0, Zy: 0, H: 225, B: 500, t: 27.6, A: 306.0, w: 240 },

  'SP-IIw':  { Ix: 13000, Zx: 1000, Iy: 0, Zy: 0, H: 130, B: 600, t: 10.3, A: 131.2, w: 103 },
  'SP-IIIw': { Ix: 22400, Zx: 1360, Iy: 0, Zy: 0, H: 180, B: 600, t: 13.4, A: 173.3, w: 136 },
  'SP-IVw':  { Ix: 32400, Zx: 2160, Iy: 0, Zy: 0, H: 225, B: 600, t: 18.0, A: 202.5, w: 159 },

  'SP-10H':  { Ix: 10800, Zx: 902,  Iy: 0, Zy: 0, H: 230, B: 900, t: 10.8, A: 122.2, w: 95.9 },
  'SP-25H':  { Ix: 24400, Zx: 1610, Iy: 0, Zy: 0, H: 300, B: 900, t: 13.2, A: 169.6, w: 133 },

  'LSP-1':   { Ix: 382,   Zx: 147,  Iy: 0, Zy: 0, H: 35,  B: 200, t: 3.2,  A: 61.2,  w: 48.0 }, 
  'LSP-2':   { Ix: 644,   Zx: 208,  Iy: 0, Zy: 0, H: 40,  B: 250, t: 4.0,  A: 77.4,  w: 60.8 },

  'Square-50x50x2.3': { Ix: 16.3, Iy: 16.3, Zx: 6.54, Zy: 6.54, A: 4.321, w: 3.39 },
  'Square-60x60x2.3': { Ix: 28.8, Iy: 28.8, Zx: 9.61, Zy: 9.61, A: 5.241, w: 4.11 },
  'Square-75x75x3.2': { Ix: 78.2, Iy: 78.2, Zx: 20.8, Zy: 20.8, A: 9.043, w: 7.10 },
  'Square-100x100x3.2': { Ix: 192, Iy: 192, Zx: 38.3, Zy: 38.3, A: 12.24, w: 9.61 },
  'Square-100x100x4.5': { Ix: 259, Iy: 259, Zx: 51.8, Zy: 51.8, A: 16.85, w: 13.2 },
  'Square-125x125x4.5': { Ix: 518, Iy: 518, Zx: 82.9, Zy: 82.9, A: 21.35, w: 16.8 },
  'Square-150x150x6.0': { Ix: 1270, Iy: 1270, Zx: 170, Zy: 170, A: 34.02, w: 26.7 },
  'Square-200x200x6.0': { Ix: 3080, Iy: 3080, Zx: 308, Zy: 308, A: 46.02, w: 36.1 },
  'Square-250x250x9.0': { Ix: 8870, Iy: 8870, Zx: 710, Zy: 710, A: 85.64, w: 67.2 },
  'Square-300x300x12.0': { Ix: 20100, Iy: 20100, Zx: 1340, Zy: 1340, A: 135.5, w: 106 },
};

export const STEEL_LISTS: Record<string, string[]> = {
  H: Object.keys(STEEL_DB).filter(k => k.startsWith('H')),
  Channel: Object.keys(STEEL_DB).filter(k => k.startsWith('C') && !k.includes('x1.6') && !k.includes('x2.3') && !k.includes('x3.2')),
  LipChannel: Object.keys(STEEL_DB).filter(k => k.startsWith('C') && (k.includes('x1.6') || k.includes('x2.3') || k.includes('x3.2'))),
  Angle: Object.keys(STEEL_DB).filter(k => k.startsWith('L') && !k.startsWith('LSP')),
  SheetPile: ['SP-II', 'SP-III', 'SP-IV', 'SP-VL', 'SP-VIL'],
  SheetPileW: ['SP-IIw', 'SP-IIIw', 'SP-IVw'],
  SheetPileH: ['SP-10H', 'SP-25H'],
  LightSheetPile: ['LSP-1', 'LSP-2'],
  SquarePipe: Object.keys(STEEL_DB).filter(k => k.startsWith('Square')),
};

export const CONCRETE_STRENGTHS = [
  { label: 'Fc18', Fc: 18, Ec: 20500 }, { label: 'Fc21', Fc: 21, Ec: 21800 },
  { label: 'Fc24', Fc: 24, Ec: 22700 }, { label: 'Fc27', Fc: 27, Ec: 23500 },
  { label: 'Fc30', Fc: 30, Ec: 24300 }, { label: 'Fc36', Fc: 36, Ec: 25000 },
  { label: 'Fc40', Fc: 40, Ec: 26500 }, { label: 'Fc42', Fc: 42, Ec: 27000 },
  { label: 'Fc45', Fc: 45, Ec: 28000 }, { label: 'Fc50', Fc: 50, Ec: 30000 },
];

export const COLORS = {
  beam: '#334155', support: '#475569', load: '#ef4444',
  loadPolygon: 'rgba(239, 68, 68, 0.2)',
  shearFill: '#fcd34d', shearLine: '#d97706',
  momentFill: '#86efac', momentLine: '#16a34a',
  deflFill: '#bfdbfe', deflLine: '#2563eb',
  text: '#1e293b', dim: '#64748b',
  guide: '#94a3b8'
};

export const BEAM_TYPES: Record<string, any> = {
  simple: { label: '単純梁 (1径間)', icon: 'I', hint: 'スパン長を入力 (例: 6.0)' },
  fixed: { label: '両端固定梁 (1径間)', icon: 'H', hint: 'スパン長を入力 (例: 6.0)' },
  cantilever: { label: '片持ち梁 (1径間)', icon: 'L', hint: 'スパン長を入力 (例: 3.0)' },
  overhang_one: { label: '単純梁 + 片側張り出し', icon: 'P', hint: '中央, 張り出し長 (例: 6.0, 2.0)' },
  overhang_both: { label: '単純梁 + 両側張り出し', icon: 'W', hint: '左張出, 中央, 右張出 (例: 2.0, 6.0, 2.0)' },
  continuous2: { label: '2径間連続梁', icon: 'M', hint: 'L1, L2 (例: 5.0, 5.0)' },
  continuous2_overhang: { label: '2径間 + 片側張り出し', icon: 'M', hint: '径間1, 径間2, 張出 (例: 5.0, 5.0, 2.0)' },
  continuous3: { label: '3径間連続梁', icon: 'C', hint: 'L1, L2, L3 (例: 5.0, 5.0, 5.0)' },
};
