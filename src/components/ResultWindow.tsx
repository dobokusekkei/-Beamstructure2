import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Activity } from 'lucide-react';
import { ResultBox } from './ResultBox';
import { AdvancedVisualizer } from './AdvancedVisualizer';
import { PoiTable } from './PoiTable';
import { RCSummary } from './RCSummary';

export function ResultWindow({ onClose, children }: any) {
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const newWindow = useRef<Window | null>(null);

    useEffect(() => {
        newWindow.current = window.open("", "_blank", "width=1000,height=800,left=200,top=100");
        const win = newWindow.current;

        if (!win) {
            alert("ポップアップがブロックされました。許可してください。");
            onClose();
            return;
        }

        Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"], script')).forEach(node => {
            win.document.head.appendChild(node.cloneNode(true));
        });
        win.document.title = "構造計算結果 (リアルタイム表示)";
        
        win.document.body.className = "bg-slate-50 text-slate-800 p-4 overflow-y-auto";

        const div = win.document.createElement("div");
        div.id = "portal-root";
        win.document.body.appendChild(div);
        setContainer(div);

        win.onbeforeunload = () => {
            onClose();
        };

        return () => {
            if (win && !win.closed) {
                win.close();
            }
        };
    }, []);

    return container ? createPortal(children, container) : null;
}

export function ResultContent({ results, spanSectionProps, loads, spans, supports, totalLength, finalPoiData, userPoi, setUserPoi, showStress = true }: any) {
    return (
        <div className="space-y-6 container mx-auto max-w-5xl">
            <header className="border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-600" />
                    計算結果モニター
                </h1>
                <p className="text-sm text-slate-500">メイン画面の入力変更がリアルタイムに反映されます</p>
            </header>

            <section>
                <h3 className="text-sm font-bold text-slate-600 mb-2 border-l-4 border-blue-500 pl-2">最大値・反力一覧</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <ResultBox label="最大M (+)" val={results.bounds.maxM_pos} x={results.bounds.maxM_pos_x} unit="kN·m" color="text-emerald-600" sub={showStress ? `σ=${results.bounds.maxSigma_pos.toFixed(0)}` : undefined} />
                    <ResultBox label="最大M (-)" val={results.bounds.maxM_neg} x={results.bounds.maxM_neg_x} unit="kN·m" color="text-red-600" sub={showStress ? `σ=${Math.abs(results.bounds.maxSigma_neg).toFixed(0)}` : undefined} />
                    <ResultBox label="最大たわみ" val={results.bounds.maxDeflection} x={results.bounds.maxDef_x} unit="mm" color="text-blue-600" />
                    <ResultBox label="最大せん断" val={results.bounds.maxShear} x={results.bounds.maxShear_x} unit="kN" color="text-amber-600" />
                    {results.reactions.map((r: any, i: number) => (
                        <ResultBox key={i} label={`反力 ${r.label}`} val={r.val} unit="kN" color="text-purple-600" sub={`@${r.x.toFixed(1)}m`} />
                    ))}
                </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
                <h3 className="text-sm font-bold text-slate-500 mb-4 flex items-center justify-between">
                    <span>応力図・変位図</span>
                    <span className="text-xs font-normal bg-slate-100 px-2 py-1 rounded text-slate-500">Auto Scale</span>
                </h3>
                <AdvancedVisualizer spans={spans} supports={supports} totalLength={totalLength} loads={loads} results={results} spanSectionProps={spanSectionProps} />
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <PoiTable 
                    finalPoiData={finalPoiData} 
                    userPoi={userPoi} 
                    setUserPoi={setUserPoi} 
                    totalLength={totalLength} 
                    spans={spans} 
                    results={results}
                    spanSectionProps={spanSectionProps}
                    showStress={showStress}
                />
            </section>

            <RCSummary spans={spans} spanSectionProps={spanSectionProps} results={results} showStress={showStress} />
        </div>
    );
}
