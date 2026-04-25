import React from 'react';

export function ResultBox({ label, val, x, unit, sub, color }: any) {
  return (
    <div className="bg-white p-3 rounded-lg border shadow-sm">
      <div className="text-[10px] text-slate-400 uppercase font-bold">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{val?.toFixed(2)} <span className="text-xs text-slate-400">{unit}</span></div>
      <div className="flex gap-2 text-[10px]">
        {x !== undefined && <span className="bg-slate-100 px-1 rounded inline-block text-slate-500">x={x.toFixed(3)}m</span>}
        {sub && <span className="bg-slate-100 px-1 rounded inline-block text-slate-500">{sub}</span>}
      </div>
    </div>
  );
}
