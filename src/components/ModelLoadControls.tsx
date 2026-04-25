import React from 'react';
import { BEAM_TYPES } from '../lib/constants';
import { Settings, Plus, Trash2 } from 'lucide-react';

export function ModelLoadControls({
    beamType,
    setBeamType,
    spanStr,
    setSpanStr,
    handleTypeChange,
    newLoadType,
    setNewLoadType,
    newMagStart,
    setNewMagStart,
    newMagEnd,
    setNewMagEnd,
    newPos,
    setNewPos,
    newLength,
    setNewLength,
    addLoad,
    loads,
    setLoads
}: any) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-400" />モデル・荷重</h2>
            <div className="space-y-4 mb-6">
            <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">梁タイプ</label>
                <select value={beamType} onChange={(e) => handleTypeChange(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm">
                {Object.entries(BEAM_TYPES).map(([key, val]: [string, any]) => <option key={key} value={key}>{val.label}</option>)}
                </select>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">スパン長さ (m)</label>
                <input type="text" value={spanStr} onChange={e=>setSpanStr(e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="例: 6.0"/>
                <p className="text-[10px] text-slate-400 mt-1">{BEAM_TYPES[beamType]?.hint || 'カンマ区切りで複数入力可'}</p>
            </div>
            </div>
            <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-slate-600 mb-3">荷重追加</h3>
            <div className="flex bg-slate-100 p-1 rounded mb-4">{['point', 'distributed', 'trapezoid', 'moment'].map(type => (<button key={type} onClick={() => setNewLoadType(type)} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${newLoadType === type ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{type === 'point' ? '集中' : type === 'distributed' ? '等分布' : type === 'trapezoid' ? '台形' : 'モーメント'}</button>))}</div>
            <div className="space-y-3 mb-4">
                <div className="flex gap-2">
                <div className="w-1/2"><label className="text-xs text-slate-500 block">荷重{newLoadType!=='point' && newLoadType!=='moment' && '(始)'}</label><input type="number" value={newMagStart} onChange={e=>setNewMagStart(Number(e.target.value))} className="w-full p-2 border rounded text-sm"/></div>
                {newLoadType==='trapezoid' && <div className="w-1/2"><label className="text-xs text-slate-500 block">荷重(終)</label><input type="number" value={newMagEnd} onChange={e=>setNewMagEnd(Number(e.target.value))} className="w-full p-2 border rounded text-sm"/></div>}
                </div>
                <div className="flex gap-2">
                <div className="w-1/2"><label className="text-xs text-slate-500 block">位置 x</label><input type="number" value={newPos} onChange={e=>setNewPos(Number(e.target.value))} className="w-full p-2 border rounded text-sm"/></div>
                {newLoadType!=='point' && newLoadType!=='moment' && <div className="w-1/2"><label className="text-xs text-slate-500 block">長さ L</label><input type="number" value={newLength} onChange={e=>setNewLength(Number(e.target.value))} className="w-full p-2 border rounded text-sm"/></div>}
                </div>
                {newLoadType === 'moment' && <p className="text-[10px] text-slate-400">※時計回りを正(+)として入力</p>}
            </div>
            <button onClick={addLoad} className="w-full py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> 荷重を追加</button>
            </div>
            <div className="mt-4 space-y-1 max-h-[150px] overflow-y-auto text-sm">
            {loads.map((l: any) => (
                <div key={l.id} className="flex justify-between items-center p-2 bg-slate-50 border rounded">
                <div className="flex flex-col"><span className="font-bold text-slate-700">{l.type==='point' ? `P=${l.mag}kN` : l.type==='moment' ? `M=${l.mag}kN·m` : `w=${l.mag}kN/m`}</span><span className="text-xs text-slate-500">x={l.pos}m {l.type!=='point' && l.type!=='moment' && `(L=${l.length})`}</span></div>
                <button onClick={()=>setLoads(loads.filter((x: any)=>x.id!==l.id))}><Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500"/></button>
                </div>
            ))}
            </div>
        </div>
    );
}
