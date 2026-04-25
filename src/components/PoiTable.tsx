import React, { useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { PoiInput } from './PoiInput';
import { getResultAt } from '../lib/engine';

export function PoiTable({ finalPoiData, userPoi, setUserPoi, totalLength, spans, results, spanSectionProps, showStress = true }: any) {
  const addUserPoint = (globalX: number) => {
      const newId = Date.now();
      setUserPoi([...userPoi, { id: newId, x: globalX }]);
  };

  const updateUserPoint = (id: any, newGlobalX: number) => {
      setUserPoi(userPoi.map((p: any) => p.id === id ? { ...p, x: newGlobalX } : p));
  };

  const removeUserPoint = (id: any) => {
      setUserPoi(userPoi.filter((p: any) => p.id !== id));
  };

  const spanRanges = useMemo(() => {
    let currentX = 0; return spans.map((len: number) => { const range = { start: currentX, end: currentX + len }; currentX += len; return range; });
  }, [spans]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold text-slate-600">着目点詳細 (スパン別)</h3></div>
      {spanRanges.map((range: any, sIdx: number) => {
        const spanPoints = finalPoiData.filter((p: any) => p.x >= range.start - 1e-4 && p.x <= range.end + 1e-4);
        
        return (
          <div key={sIdx} className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 flex justify-between items-center">
                <span>径間 {sIdx + 1} ({String.fromCharCode(65+sIdx)} - {String.fromCharCode(65+sIdx+1)})</span>
                <div className="flex items-center gap-3">
                    <span className="font-normal opacity-70">スパン長: {spans[sIdx].toFixed(2)}m</span>
                    <button 
                        onClick={() => addUserPoint(range.start)} 
                        className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                        <Plus className="w-3 h-3"/> 追加
                    </button>
                </div>
            </div>
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-50 text-slate-400 border-b"><tr><th className="p-2 w-24">Local x (m)</th><th className="p-2">Q (kN)</th><th className="p-2">M (kN·m)</th>{showStress && <th className="p-2">σ (N/mm²)</th>}<th className="p-2">δ (mm)</th><th className="w-8"></th></tr></thead>
              <tbody className="divide-y">
                {spanPoints.map((p: any) => {
                  const localX = Math.max(0, Math.min(spans[sIdx], p.x - range.start));
                  const isUser = p.type === 'user';
                  
                  const val = getResultAt(p.x, results, spanSectionProps, sIdx);

                  return (
                    <tr key={p.id} className={isUser ? "bg-blue-50/20" : "hover:bg-slate-50"}>
                      <td className="p-2">
                          <div className="flex items-center gap-1">
                              {isUser ? (
                                  <PoiInput 
                                    id={p.id}
                                    globalX={p.x}
                                    rangeStart={range.start}
                                    onUpdate={updateUserPoint}
                                  />
                              ) : (
                                  <div className="flex items-center gap-2">
                                      <span className="font-mono text-slate-500 w-12">{localX.toFixed(3)}</span>
                                      <span className="text-[9px] px-1 bg-slate-200 rounded text-slate-500">Auto</span>
                                  </div>
                              )}
                              {isUser && <span className="text-[9px] text-slate-300">m</span>}
                          </div>
                      </td>
                      <td className="p-2 font-mono text-slate-600">{val?.Q?.toFixed(2)}</td>
                      <td className="p-2 font-mono text-slate-600">{val?.M?.toFixed(2)}</td>
                      {showStress && <td className="p-2 font-mono text-slate-700">{val?.sigma?.toFixed(1)}</td>}
                      <td className="p-2 font-mono text-blue-600 font-bold">{val?.deflection?.toFixed(2)}</td>
                      <td className="p-2 text-right">
                          {isUser && (
                              <button onClick={() => removeUserPoint(p.id)}><X className="w-3 h-3 text-slate-300 hover:text-red-500" /></button>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
