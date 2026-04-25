import React from 'react';
import { calcRCStress } from '../lib/rcCalc';

export function RCSummary({ spans, spanSectionProps, results, showStress }: any) {
    if (!showStress) return null;
    
    // Find spans with RC enabled
    const rcSpans = spanSectionProps.map((p: any, i: number) => ({ ...p, index: i, len: spans[i] }))
        .filter((p: any) => p.matType === 'concrete' && p.rcCalcEnable);

    if (rcSpans.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                RC断面計算結果 (単鉄筋長方形断面)
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr>
                            <th className="px-3 py-2 border">スパン</th>
                            <th className="px-3 py-2 border">部材/鉄筋</th>
                            <th className="px-3 py-2 border" colSpan={2}>最大曲げ (+)</th>
                            <th className="px-3 py-2 border" colSpan={2}>最大曲げ (-)</th>
                            <th className="px-3 py-2 border" colSpan={2}>最大せん断</th>
                        </tr>
                        <tr>
                            <th className="px-3 py-1 border bg-slate-100"></th>
                            <th className="px-3 py-1 border bg-slate-100"></th>
                            <th className="px-3 py-1 border bg-slate-100">M / Q</th>
                            <th className="px-3 py-1 border bg-slate-100">応力 (σc, σs, τ)</th>
                            <th className="px-3 py-1 border bg-slate-100">M / Q</th>
                            <th className="px-3 py-1 border bg-slate-100">応力 (σc, σs, τ)</th>
                            <th className="px-3 py-1 border bg-slate-100">M / Q</th>
                            <th className="px-3 py-1 border bg-slate-100">応力 (σc, σs, τ)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rcSpans.map((sp: any) => {
                            const sb = results.spanBounds.find((b: any) => b.spanIndex === sp.index);
                            if (!sb) return null;

                            const input = {
                                enabled: true,
                                fcIdx: sp.rcFcIdx,
                                width: sp.dims.B,
                                depth: sp.dims.H,
                                rebarDia: sp.rcRebarDia,
                                rebarCount: sp.rcRebarCount,
                                cover: sp.rcCover
                            };

                            const resPos = calcRCStress(input, sb.maxM, sb.maxM_Q || 0); // Need Q at max M? We can just use calcRCStress for M and Q separately for Maxes
                            // Actually wait, tau is calculated from Q. So we calculate tau max at maxQ.
                            // calculate max M+ stresses
                            const rcPos = calcRCStress(input, sb.maxM, 0); // tau not relevant here
                            const rcNeg = calcRCStress(input, sb.minM, 0);
                            const rcShear = calcRCStress(input, 0, sb.maxQ); // sigma not relevant here
                            const rcShearMin = calcRCStress(input, 0, sb.minQ);
                            const maxTau = Math.max(rcShear.tau, rcShearMin.tau);
                            const maxQAbs = Math.abs(sb.maxQ) > Math.abs(sb.minQ) ? sb.maxQ : sb.minQ;

                            return (
                                <tr key={sp.index} className="border-b">
                                    <td className="px-3 py-2 border font-bold text-slate-600 border-x">Span {sp.index + 1}</td>
                                    <td className="px-3 py-2 border text-xs text-slate-500">
                                        {sp.dims.B}x{sp.dims.H}<br/>
                                        {sp.rcRebarCount}-{sp.rcRebarDia} (dt={sp.rcCover})
                                    </td>
                                    <td className="px-3 py-2 border font-mono">{(sb.maxM || 0).toFixed(1)} kN·m</td>
                                    <td className="px-3 py-2 border text-xs whitespace-nowrap">
                                        σc: <span className="text-blue-600 font-bold">{rcPos.sigma_c.toFixed(1)}</span> N/mm²<br/>
                                        σs: <span className="text-red-600 font-bold">{rcPos.sigma_s.toFixed(1)}</span> N/mm²
                                    </td>
                                    <td className="px-3 py-2 border font-mono">{(sb.minM || 0).toFixed(1)} kN·m</td>
                                    <td className="px-3 py-2 border text-xs whitespace-nowrap">
                                        σc: <span className="text-blue-600 font-bold">{rcNeg.sigma_c.toFixed(1)}</span> N/mm²<br/>
                                        σs: <span className="text-red-600 font-bold">{rcNeg.sigma_s.toFixed(1)}</span> N/mm²
                                    </td>
                                    <td className="px-3 py-2 border font-mono">{(maxQAbs || 0).toFixed(1)} kN</td>
                                    <td className="px-3 py-2 border text-xs border-r whitespace-nowrap">
                                        τ: <span className="text-amber-600 font-bold">{maxTau.toFixed(2)}</span> N/mm²
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
