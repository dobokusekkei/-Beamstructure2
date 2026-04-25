import React from 'react';
import { BEAM_TYPES } from '../lib/constants';
import { getResultAt } from '../lib/engine';
import { AdvancedVisualizer } from './AdvancedVisualizer';
import { RCSummary } from './RCSummary';

export function PrintReport({ params }: any) {
    const { spanSectionProps, results, loads, spans, totalLength, beamType, finalPoiData, showStress } = params;
    const today = new Date().toLocaleDateString('ja-JP');

    const spanRanges = spans.map((len: number, idx: number) => {
        const start = spans.slice(0, idx).reduce((a: number, b: number) => a + b, 0);
        return { idx, len, start, end: start + len };
    });

    const isUniform = spanSectionProps.every((p: any) => p.label === spanSectionProps[0].label);

    return (
        <div className="space-y-6 text-sm text-slate-800">
            <header className="border-b-2 border-slate-800 pb-2 mb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">構造計算書</h1>
                    <p className="text-xs text-slate-500">Structural Analysis Report</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-sm">作成日: {today}</p>
                    <p className="text-xs text-slate-500">Ver 30.00</p>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-6 mb-4 avoid-break">
                <section>
                    <h2 className="text-sm font-bold border-l-4 border-blue-600 pl-2 mb-2 bg-slate-50 py-1">1. 設計条件</h2>
                    <table className="w-full text-left text-xs border-collapse">
                        <tbody>
                            <tr className="border-b"><th className="py-1 text-slate-500 w-24">梁タイプ</th><td className="font-bold">{BEAM_TYPES[beamType]?.label}</td></tr>
                            <tr className="border-b"><th className="py-1 text-slate-500">スパン構成</th><td className="font-mono">{spans.map((s: number)=>s.toFixed(2)+'m').join(' + ')} (L={totalLength.toFixed(2)}m)</td></tr>
                            {isUniform ? (
                                <>
                                    <tr className="border-b"><th className="py-1 text-slate-500">使用材料</th><td className="font-bold">{spanSectionProps[0].label}</td></tr>
                                    <tr className="border-b"><th className="py-1 text-slate-500">断面性能</th><td className="font-mono">
                                        I={(spanSectionProps[0].I/10000).toFixed(3)}cm⁴, Z={(spanSectionProps[0].Z/1000).toFixed(3)}cm³, E={(spanSectionProps[0].E/1000).toFixed(1)}kN/mm²
                                    </td></tr>
                                </>
                            ) : (
                                <tr className="border-b"><th className="py-1 text-slate-500 align-top">使用材料</th><td className="py-1">
                                    {spans.map((_: any, idx: number) => (
                                        <div key={idx} className="mb-1">
                                            <span className="font-bold text-xs bg-slate-100 px-1 rounded mr-1">径間 {idx+1}</span>
                                            {spanSectionProps[idx].label} <span className="font-mono text-[10px] text-slate-500 ml-1">(I={(spanSectionProps[idx].I/10000).toFixed(3)}cm⁴, Z={(spanSectionProps[idx].Z/1000).toFixed(3)}cm³)</span>
                                        </div>
                                    ))}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </section>
                
                <section>
                    <h2 className="text-sm font-bold border-l-4 border-blue-600 pl-2 mb-2 bg-slate-50 py-1">2. 荷重条件</h2>
                    <table className="w-full text-xs text-left border border-slate-200">
                        <thead className="bg-slate-100">
                            <tr><th className="p-1 border">No.</th><th className="p-1 border">種類</th><th className="p-1 border">大きさ</th><th className="p-1 border">位置</th></tr>
                        </thead>
                        <tbody>
                            {loads.map((l: any, i: number) => (
                                <tr key={l.id} className="border-b">
                                    <td className="p-1 border text-center">{i+1}</td>
                                    <td className="p-1 border">{l.type === 'point' ? '集中' : l.type === 'moment' ? 'モーメント' : '分布'}</td>
                                    <td className="p-1 border font-mono">{l.type==='trapezoid'?`${l.mag}~${l.magEnd}`:l.mag}</td>
                                    <td className="p-1 border font-mono">{l.type==='point'||l.type==='moment'?l.pos:`${l.pos}~${l.pos+l.length}`}</td>
                                </tr>
                            ))}
                            {loads.length===0 && <tr><td colSpan={4} className="p-2 text-center text-slate-400">なし</td></tr>}
                        </tbody>
                    </table>
                </section>
            </div>

            <section className="mb-4">
                <h2 className="text-sm font-bold border-l-4 border-blue-600 pl-2 mb-2 bg-slate-50 py-1">3. 解析結果一覧（スパン別最大・最小）</h2>
                <div className="grid grid-cols-1 gap-4">
                    {results.spanBounds.map((sb: any, idx: number) => {
                        const offset = spans.slice(0, idx).reduce((a: number, b: number) => a + b, 0);
                        const Z = spanSectionProps[idx]?.Z || 1;
                        return (
                            <div key={idx} className="avoid-break border rounded-lg overflow-hidden mb-2">
                                <div className="text-xs font-bold bg-slate-100 px-2 py-1 border-b text-slate-700 flex justify-between">
                                    <span>径間 {idx + 1} <span className="font-normal ml-2 text-slate-500">L = {spans[idx].toFixed(2)}m</span></span>
                                    {!isUniform && <span className="font-normal text-slate-500">{spanSectionProps[idx].label}</span>}
                                </div>
                                <table className="w-full text-xs text-right">
                                    <thead className="bg-slate-50 text-slate-600">
                                            <tr>
                                                <th className="p-1 border-b w-32 text-left pl-2">項目</th>
                                                <th className="p-1 border-b">値</th>
                                                <th className="p-1 border-b">位置 x (local)</th>
                                                {showStress && <th className="p-1 border-b">応力度 σ (N/mm²)</th>}
                                            </tr>
                                    </thead>
                                    <tbody>
                                            <tr className="border-b">
                                                <td className="p-1 text-left pl-2">最大曲げ M<sub>max</sub> (+)</td>
                                                <td className="p-1 font-mono font-bold">{sb.maxM.toFixed(2)} kN·m</td>
                                                <td className="p-1 font-mono">{(sb.maxM_x - offset).toFixed(3)} m</td>
                                                {showStress && <td className="p-1 font-mono">{(Math.abs(sb.maxM) * 1e6 / Z).toFixed(0)}</td>}
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-1 text-left pl-2">最大曲げ M<sub>min</sub> (-)</td>
                                                <td className="p-1 font-mono font-bold">{sb.minM.toFixed(2)} kN·m</td>
                                                <td className="p-1 font-mono">{(sb.minM_x - offset).toFixed(3)} m</td>
                                                {showStress && <td className="p-1 font-mono">{(Math.abs(sb.minM) * 1e6 / Z).toFixed(0)}</td>}
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-1 text-left pl-2">最大せん断 Q<sub>max</sub> (+)</td>
                                                <td className="p-1 font-mono font-bold">{sb.maxQ.toFixed(2)} kN</td>
                                                <td className="p-1 font-mono">{(sb.maxQ_x - offset).toFixed(3)} m</td>
                                                {showStress && <td className="p-1 text-slate-400">-</td>}
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-1 text-left pl-2">最大せん断 Q<sub>min</sub> (-)</td>
                                                <td className="p-1 font-mono font-bold">{sb.minQ.toFixed(2)} kN</td>
                                                <td className="p-1 font-mono">{(sb.minQ_x - offset).toFixed(3)} m</td>
                                                {showStress && <td className="p-1 text-slate-400">-</td>}
                                            </tr>
                                            <tr className="border-b">
                                                <td className="p-1 text-left pl-2">最大変位 δ<sub>max</sub> (+)</td>
                                                <td className="p-1 font-mono font-bold">{sb.maxD.toFixed(2)} mm</td>
                                                <td className="p-1 font-mono">{(sb.maxD_x - offset).toFixed(3)} m</td>
                                                {showStress && <td className="p-1 text-slate-400">-</td>}
                                            </tr>
                                             <tr>
                                                <td className="p-1 text-left pl-2">最大変位 δ<sub>min</sub> (-)</td>
                                                <td className="p-1 font-mono font-bold">{sb.minD.toFixed(2)} mm</td>
                                                <td className="p-1 font-mono">{(sb.minD_x - offset).toFixed(3)} m</td>
                                                {showStress && <td className="p-1 text-slate-400">-</td>}
                                            </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                    
                    <div className="avoid-break mt-2 border rounded p-2 bg-slate-50">
                         <div className="text-xs font-bold text-slate-600 mb-1">支点反力一覧</div>
                         <div className="flex flex-wrap gap-4">
                            {results.reactions.map((r: any, i: number) => (
                                <div key={i} className="text-xs font-mono">
                                    R<sub>{r.label}</sub> = <strong>{r.val.toFixed(2)}</strong> kN <span className="text-slate-400">(@{r.x.toFixed(1)}m)</span>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </section>

            <section className="mb-4 avoid-break">
                <h2 className="text-sm font-bold border-l-4 border-blue-600 pl-2 mb-2 bg-slate-50 py-1">4. 応力図 (SFD, BMD, Deflection)</h2>
                <div className="border rounded p-2 flex justify-center bg-white">
                    <AdvancedVisualizer {...params} forceWidth={580} />
                </div>
            </section>

            <section className="page-break">
                <h2 className="text-sm font-bold border-l-4 border-blue-600 pl-2 mb-2 bg-slate-50 py-1">5. 計算結果詳細（スパン別）</h2>
                <div className="grid grid-cols-1 gap-4">
                    {spanRanges.map((range: any, sIdx: number) => {
                        const spanPoints = finalPoiData.filter((p: any) => p.x >= range.start - 1e-4 && p.x <= range.end + 1e-4);
                        if (spanPoints.length === 0) return null;

                        return (
                            <div key={sIdx} className="avoid-break mb-2">
                                <div className="text-xs font-bold bg-slate-100 px-2 py-1 border-t border-l border-r rounded-t text-slate-700">
                                    径間 {sIdx + 1} ({String.fromCharCode(65+sIdx)} - {String.fromCharCode(65+sIdx+1)}) 
                                    <span className="font-normal ml-2 text-slate-500">L = {range.len.toFixed(2)}m</span>
                                </div>
                                <table className="w-full text-xs text-right border border-slate-200">
                                    <thead className="bg-slate-50 text-slate-600">
                                            <tr>
                                                <th className="p-1 border w-16 text-center">x (local)</th>
                                                <th className="p-1 border">せん断 Q (kN)</th>
                                                <th className="p-1 border">曲げ M (kN·m)</th>
                                                {showStress && <th className="p-1 border">応力 σ (N/mm²)</th>}
                                                <th className="p-1 border">たわみ δ (mm)</th>
                                            </tr>
                                    </thead>
                                    <tbody>
                                            {spanPoints.map((p: any, idx: number) => {
                                                const localX = Math.max(0, Math.min(range.len, p.x - range.start));
                                                const val = getResultAt(p.x, results, spanSectionProps, sIdx);

                                                return (
                                                    <tr key={idx} className="border-b">
                                                        <td className="p-1 border text-center font-mono bg-slate-50/50">{localX.toFixed(3)}</td>
                                                        <td className="p-1 border font-mono">{val?.Q?.toFixed(2)}</td>
                                                        <td className="p-1 border font-mono">{val?.M?.toFixed(2)}</td>
                                                        {showStress && <td className="p-1 border font-mono">{val?.sigma?.toFixed(1)}</td>}
                                                        <td className="p-1 border font-mono">{val?.deflection?.toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            </section>
            
            {showStress && (
                <section className="page-break mb-4">
                    <RCSummary spans={spans} spanSectionProps={spanSectionProps} results={results} showStress={showStress} />
                </section>
            )}
        </div>
    );
}
