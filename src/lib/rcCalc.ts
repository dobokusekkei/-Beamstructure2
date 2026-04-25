import { CONCRETE_STRENGTHS } from './constants';

export const REBAR_AREAS: Record<string, number> = {
    'D10': 71.3,
    'D13': 126.7,
    'D16': 198.6,
    'D19': 286.5,
    'D22': 387.1,
    'D25': 506.7,
    'D29': 642.4,
    'D32': 794.2,
};

export interface RCCalcInput {
    enabled: boolean;
    fcIdx: number;
    width: number;
    depth: number;
    rebarDia: string;
    rebarCount: number;
    cover: number;
}

export interface RCCalcResult {
    sigma_c: number; // N/mm2
    sigma_s: number; // N/mm2
    tau: number;     // N/mm2
    M: number;       // kN.m
    Q: number;       // kN
    x: number;       // neutral axis depth (mm)
    j: number;       // lever arm (mm)
}

/**
 * Calculates stress in singly reinforced rectangular section (単鉄筋長方形断面)
 * @param input RC calculation specifications
 * @param M Bending moment (kN.m)
 * @param Q Shear force (kN)
 */
export function calcRCStress(input: RCCalcInput, M: number, Q: number): RCCalcResult {
    if (!input.enabled || input.width <= 0 || input.depth <= 0) {
        return { sigma_c: 0, sigma_s: 0, tau: 0, M, Q, x: 0, j: 0 };
    }

    const n = 15; // Young's modulus ratio
    const b = input.width;
    const d = input.depth - input.cover; // Effective depth
    const As = (REBAR_AREAS[input.rebarDia] || 0) * input.rebarCount;

    if (As <= 0 || d <= 0) {
        return { sigma_c: 0, sigma_s: 0, tau: 0, M, Q, x: 0, j: 0 };
    }

    const absM = Math.abs(M) * 1e6; // N.mm
    const absQ = Math.abs(Q) * 1000; // N

    // Neutral axis depth x
    // b * x^2 / 2 = n * As * (d - x)
    // b * x^2 + 2 * n * As * x - 2 * n * As * d = 0
    const A = b;
    const B = 2 * n * As;
    const C = -2 * n * As * d;
    
    const x = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
    const j = d - x / 3;

    let sigma_c = 0;
    let sigma_s = 0;
    let tau = 0;

    // Cracked moment of inertia
    const Ic = (b * Math.pow(x, 3)) / 3 + n * As * Math.pow(d - x, 2);

    if (Ic > 0) {
        sigma_c = (absM / Ic) * x;
        sigma_s = n * (absM / Ic) * (d - x);
    }

    if (j > 0) {
        tau = absQ / (b * j);
    }

    return {
        sigma_c,
        sigma_s,
        tau,
        M,
        Q,
        x,
        j
    };
}
