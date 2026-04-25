import React from 'react';
import { STEEL_LISTS, CONCRETE_STRENGTHS } from '../lib/constants';
import { SectionProfileView } from './SectionProfileView';
import { REBAR_AREAS } from '../lib/rcCalc';

export function MaterialSettings({ 
    materials, 
    setMaterials, 
    activeSpanIdx, 
    setActiveSpanIdx, 
    spans, 
    applyToAllSpans, 
    activeMat, 
    updateMaterial, 
    activeSectionProps,
    results
}: any) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                断面・材料設定
            </h2>
            
            <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded border">
                <label className="text-xs font-bold text-slate-600 whitespace-nowrap">対象スパン:</label>
                <select 
                    value={activeSpanIdx} 
                    onChange={(e) => setActiveSpanIdx(Number(e.target.value))}
                    className="p-1 border rounded text-sm bg-white flex-1"
                >
                    {spans.map((_: any, idx: number) => (
                        <option key={idx} value={idx}>スパン {idx + 1} ({spans[idx].toFixed(2)}m)</option>
                    ))}
                </select>
                <button 
                    onClick={applyToAllSpans}
                    className="text-[10px] px-2 py-1.5 bg-white border rounded text-blue-600 font-bold hover:bg-blue-50 shadow-sm whitespace-nowrap"
                    title="現在の材料設定をすべてのスパンに適用します"
                >
                    全てに適用
                </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                <button onClick={() => updateMaterial('matType', 'steel')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${activeMat.matType === 'steel' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>S造</button>
                <button onClick={() => updateMaterial('matType', 'concrete')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${activeMat.matType === 'concrete' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>RC造</button>
                <button onClick={() => updateMaterial('matType', 'manual')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${activeMat.matType === 'manual' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>任意</button>
            </div>

            {activeMat.matType === 'steel' && (
            <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 font-bold block mb-1">鋼材種別</label>
                    <select value={activeMat.steelShape} onChange={e => { updateMaterial('steelShape', e.target.value); updateMaterial('steelProfileIdx', 0); }} className="w-full p-2 border rounded text-sm">
                        <option value="H">H形鋼</option>
                        <option value="Channel">溝形鋼</option>
                        <option value="LipChannel">C形鋼</option>
                        <option value="Angle">山形鋼</option>
                        <option value="SheetPile">鋼矢板 (U形)</option>
                        <option value="SheetPileW">鋼矢板 (広幅/w)</option>
                        <option value="SheetPileH">鋼矢板 (ハット形)</option>
                        <option value="LightSheetPile">軽量鋼矢板</option>
                        <option value="SquarePipe">角形鋼管 (Square Pipe)</option>
                    </select>
                </div>
                <div><label className="text-xs text-slate-500 font-bold block mb-1">断面サイズ</label><select value={activeMat.steelProfileIdx} onChange={e => updateMaterial('steelProfileIdx', Number(e.target.value))} className="w-full p-2 border rounded text-sm font-mono">{(STEEL_LISTS[activeMat.steelShape] || STEEL_LISTS['H']).map((name, idx) => <option key={idx} value={idx}>{name}</option>)}</select></div>
                {(!activeMat.steelShape.includes('SheetPile') && !activeMat.steelShape.includes('SquarePipe')) && (
                    <div className="flex bg-slate-50 border rounded p-1"><button onClick={() => updateMaterial('steelAxis', 'strong')} className={`flex-1 text-xs py-1 rounded font-bold ${activeMat.steelAxis === 'strong' ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}>強軸 (X)</button><button onClick={() => updateMaterial('steelAxis', 'weak')} className={`flex-1 text-xs py-1 rounded font-bold ${activeMat.steelAxis === 'weak' ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}>弱軸 (Y)</button></div>
                )}
                
                {(activeMat.steelShape.includes('SheetPile')) && (
                <div className="mt-2 space-y-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold block">施工延長 L (m) <span className="font-normal text-slate-400">(計算用壁幅)</span></label>
                        <input type="number" step="0.1" value={activeMat.wallLength} onChange={e=>updateMaterial('wallLength', e.target.value)} className="w-full p-1.5 border rounded text-sm bg-white text-right font-bold text-blue-600"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-yellow-200/50">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold block">効率 (I用)</label>
                            <input type="number" step="0.05" value={activeMat.effI} onChange={e=>updateMaterial('effI', e.target.value)} className="w-full p-1 border rounded text-xs bg-white text-right"/>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold block">効率 (Z用)</label>
                            <input type="number" step="0.05" value={activeMat.effZ} onChange={e=>updateMaterial('effZ', e.target.value)} className="w-full p-1 border rounded text-xs bg-white text-right"/>
                        </div>
                    </div>
                </div>
                )}
            </div>
            )}
            
            {activeMat.matType === 'concrete' && (
            <div className="space-y-4">
                <div><label className="text-xs text-slate-500 font-bold block mb-1">コンクリート</label><select value={activeMat.rcFcIdx} onChange={e => updateMaterial('rcFcIdx', Number(e.target.value))} className="w-full p-2 border rounded text-sm">{CONCRETE_STRENGTHS.map((fc, idx) => <option key={idx} value={idx}>{fc.label}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-slate-500 font-bold block mb-1">幅 b (mm)</label><input type="number" value={activeMat.rcWidthStr} onChange={e=>updateMaterial('rcWidthStr', e.target.value)} className="w-full p-2 border rounded text-sm"/></div>
                    <div><label className="text-xs text-slate-500 font-bold block mb-1">高さ D (mm)</label><input type="number" value={activeMat.rcDepthStr} onChange={e=>updateMaterial('rcDepthStr', e.target.value)} className="w-full p-2 border rounded text-sm"/></div>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-200 mt-2">
                    <label className="flex items-center gap-2 mb-3">
                        <input type="checkbox" checked={activeMat.rcCalcEnable} onChange={e => updateMaterial('rcCalcEnable', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500"/>
                        <span className="text-xs font-bold text-slate-700">RC断面計算 (単鉄筋) を行う</span>
                    </label>
                    {activeMat.rcCalcEnable && (() => {
                        const sb = results?.spanBounds?.find((b: any) => b.spanIndex === activeSpanIdx);
                        const hasPosM = !sb || sb.maxM > 0.01;
                        const hasNegM = !sb || sb.minM < -0.01;

                        return (
                        <div className="space-y-3 pt-2 border-t border-slate-200">
                            <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100">
                                {hasNegM ? (
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold block mb-1">上端鉄筋 (M &lt; 0 用)</label>
                                    <div className="flex gap-1 mb-2">
                                        <select value={activeMat.rcRebarDiaTop || 'D16'} onChange={e=>updateMaterial('rcRebarDiaTop', e.target.value)} className="w-1/2 p-1.5 border rounded text-xs">
                                            {Object.keys(REBAR_AREAS).map(dia => <option key={dia} value={dia}>{dia}</option>)}
                                        </select>
                                        <input type="number" min="0" placeholder="本数" value={activeMat.rcRebarCountTop ?? 2} onChange={e=>updateMaterial('rcRebarCountTop', e.target.value)} className="w-1/2 p-1.5 border rounded text-xs"/>
                                    </div>
                                    <label className="text-[10px] text-slate-500 font-bold block mb-1">上端かぶり dt (mm)</label>
                                    <input type="number" value={activeMat.rcCoverTopStr ?? 50} onChange={e=>updateMaterial('rcCoverTopStr', e.target.value)} className="w-full p-1.5 border rounded text-xs"/>
                                </div>
                                ) : <div />}
                                {hasPosM ? (
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold block mb-1">下端鉄筋 (M &gt; 0 用)</label>
                                    <div className="flex gap-1 mb-2">
                                        <select value={activeMat.rcRebarDiaBottom || 'D19'} onChange={e=>updateMaterial('rcRebarDiaBottom', e.target.value)} className="w-1/2 p-1.5 border rounded text-xs">
                                            {Object.keys(REBAR_AREAS).map(dia => <option key={dia} value={dia}>{dia}</option>)}
                                        </select>
                                        <input type="number" min="0" placeholder="本数" value={activeMat.rcRebarCountBottom ?? 4} onChange={e=>updateMaterial('rcRebarCountBottom', e.target.value)} className="w-1/2 p-1.5 border rounded text-xs"/>
                                    </div>
                                    <label className="text-[10px] text-slate-500 font-bold block mb-1">下端かぶり dt (mm)</label>
                                    <input type="number" value={activeMat.rcCoverBottomStr ?? 50} onChange={e=>updateMaterial('rcCoverBottomStr', e.target.value)} className="w-full p-1.5 border rounded text-xs"/>
                                </div>
                                ) : <div />}
                            </div>
                        </div>
                        );
                    })()}
                </div>
            </div>
            )}

            {activeMat.matType === 'manual' && (
            <div className="space-y-3 bg-blue-50 p-4 rounded border border-blue-100">
                  <p className="text-xs text-slate-500 mb-2 font-bold text-center border-b border-blue-200 pb-2">任意断面入力</p>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">断面二次モーメント Ix (cm⁴)</label>
                    <input type="number" step="1" value={activeMat.manualI} onChange={e=>updateMaterial('manualI', e.target.value)} className="w-full p-1.5 border rounded text-sm bg-white text-right"/>
                </div>
                <div>
                    <label className="text-[10px] text-slate-500 font-bold block">断面係数 Zx (cm³)</label>
                    <input type="number" step="1" value={activeMat.manualZ} onChange={e=>updateMaterial('manualZ', e.target.value)} className="w-full p-1.5 border rounded text-sm bg-white text-right"/>
                </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">ヤング係数 E (kN/mm²)</label>
                    <input type="number" step="1" value={activeMat.manualE} onChange={e=>updateMaterial('manualE', e.target.value)} className="w-full p-1.5 border rounded text-sm bg-white text-right"/>
                </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">断面積 A (cm²) <span className="font-normal text-slate-400">(重量計算用)</span></label>
                    <input type="number" step="0.1" value={activeMat.manualA} onChange={e=>updateMaterial('manualA', e.target.value)} className="w-full p-1.5 border rounded text-sm bg-white text-right"/>
                </div>
            </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded border text-xs space-y-1 font-mono text-slate-600">
                <div className="flex justify-between"><span>Ix:</span> <span>{(activeSectionProps.I/10000).toFixed(3)} cm⁴</span></div>
                <div className="flex justify-between"><span>Zx:</span> <span>{(activeSectionProps.Z/1000).toFixed(3)} cm³</span></div>
                <div className="flex justify-between"><span>E :</span> <span>{(activeSectionProps.E/1000).toFixed(1)} kN/mm²</span></div>
                <div className="flex justify-between text-slate-500 mt-1 border-t pt-1"><span>A :</span> <span>{activeSectionProps.A.toFixed(2)} cm²</span></div>
                <div className="flex justify-between text-slate-500"><span>w :</span> <span>{activeSectionProps.w.toFixed(1)} kg/m</span></div>
            </div>
            <div className="flex items-center justify-center bg-white border rounded aspect-square p-2"><SectionProfileView props={activeSectionProps} /></div>
            </div>
        </div>
    );
}
