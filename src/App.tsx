import React, { useState, useMemo, useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Plus, Trash2, Activity, Settings, X as XIcon, Layers, ChevronDown, ArrowRight, RotateCw, AlertTriangle, Save, FolderOpen, Printer, Edit3, HelpCircle, History, FileDown, Upload, ExternalLink } from 'lucide-react';

import { INITIAL_SPAN, BEAM_TYPES, CONCRETE_STRENGTHS, STEEL_LISTS } from './lib/constants';
import { solveGeneralBeam, getSteelProps, getResultAt, generateEmptyResult, normalizeText } from './lib/engine';

import { HelpModal } from './components/HelpModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { ResultWindow, ResultContent } from './components/ResultWindow';
import { ResultBox } from './components/ResultBox';
import { AdvancedVisualizer } from './components/AdvancedVisualizer';
import { PoiTable } from './components/PoiTable';
import { SectionProfileView } from './components/SectionProfileView';
import { PrintReport } from './components/PrintReport';

import { MaterialSettings } from './components/MaterialSettings';
import { ModelLoadControls } from './components/ModelLoadControls';
import { calcRCStress } from './lib/rcCalc';
import { RCSummary } from './components/RCSummary';

export default function App() {
  const [spanStr, setSpanStr] = useState(INITIAL_SPAN);
  const [beamType, setBeamType] = useState('simple');
  const [loads, setLoads] = useState([{ id: 1, type: 'point', mag: 10, pos: 3, length: 0, magEnd: 0 }]);
  const [showHelp, setShowHelp] = useState(false); 
  const [showHistory, setShowHistory] = useState(false); 
  const [showResultWindow, setShowResultWindow] = useState(false);
  const [showStress, setShowStress] = useState(true);
    
  const defaultMaterial = {
    matType: 'steel',
    steelShape: 'H',
    steelProfileIdx: 9, 
    steelAxis: 'strong',
    manualI: "1000",
    manualZ: "100",
    manualA: "30.0",
    manualE: "205",
    effI: "1.0",
    effZ: "1.0",
    wallLength: "1.0",
    rcFcIdx: 1,
    rcWidthStr: '300',
    rcDepthStr: '600',
    rcCalcEnable: false,
    rcRebarDiaTop: 'D16',
    rcRebarCountTop: '2',
    rcRebarDiaBottom: 'D19',
    rcRebarCountBottom: '4',
    rcCoverTopStr: '50',
    rcCoverBottomStr: '50'
  };
  const [materials, setMaterials] = useState<any[]>([{...defaultMaterial}]);
  const [activeSpanIdx, setActiveSpanIdx] = useState(0);

  const [userPoi, setUserPoi] = useState<any[]>([]); 

  const [newLoadType, setNewLoadType] = useState('point');
  const [newMagStart, setNewMagStart] = useState(10);
  const [newMagEnd, setNewMagEnd] = useState(10);
  const [newPos, setNewPos] = useState(0);
  const [newLength, setNewLength] = useState(2);

  const [calcError, setCalcError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { spans, totalLength, supports } = useMemo(() => {
    const vals = normalizeText(spanStr).replace(/,/g, ' ').split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
    const safeVals = vals.length > 0 ? vals : [6.0];
    let s = safeVals;
    let supp: string[] = [];

    switch (beamType) {
      case 'simple': s = [safeVals[0]]; supp = ['pin', 'roller']; break;
      case 'fixed': s = [safeVals[0]]; supp = ['fixed', 'fixed']; break;
      case 'cantilever': s = [safeVals[0]]; supp = ['fixed', 'free']; break;
      case 'overhang_one': 
        if(s.length < 2) s = [s[0], s[0]*0.3]; 
        s = s.slice(0, 2); supp = ['pin', 'roller', 'free']; break;
      case 'overhang_both': 
        if(s.length < 3) { const main = s.length>=2?s[1]:s[0]; const sub = s.length>=1?s[0]:2.0; s = [sub, main, sub]; }
        s = s.slice(0, 3); supp = ['free', 'pin', 'roller', 'free']; break;
      case 'continuous2': 
        if(s.length < 2) s = [s[0], s[0]];
        s = s.slice(0, 2); supp = ['pin', 'roller', 'roller']; break;
      case 'continuous2_overhang': 
        if(s.length < 3) s = [s[0], s[0], s[0]*0.3];
        s = s.slice(0, 3); supp = ['pin', 'roller', 'roller', 'free']; break;
      case 'continuous3': 
        if(s.length < 3) s = [s[0], s[0], s[0]];
        s = s.slice(0, 3); supp = ['pin', 'roller', 'roller', 'roller']; break;
      default: s = [6.0]; supp = ['pin', 'roller'];
    }
    return { spans: s, totalLength: s.reduce((a,b)=>a+b, 0), supports: supp };
  }, [spanStr, beamType]);

  useEffect(() => {
    if (activeSpanIdx >= spans.length) {
      setActiveSpanIdx(Math.max(0, spans.length - 1));
    }
  }, [spans.length, activeSpanIdx]);

  const updateMaterial = (key: string, value: any) => {
    setMaterials(prev => {
      const next = [...prev];
      if(!next[activeSpanIdx]) next[activeSpanIdx] = {...defaultMaterial};
      next[activeSpanIdx] = { ...next[activeSpanIdx], [key]: value };
      return next;
    });
  };

  const applyToAllSpans = () => {
    const currentMat = materials[activeSpanIdx] || defaultMaterial;
    const count = Math.max(spans.length, materials.length);
    setMaterials(Array(count).fill({...currentMat}));
  };

  const spanSectionProps = useMemo(() => {
    return spans.map((_, idx) => {
      const mat = materials[idx] || materials[0] || defaultMaterial;
      let E = 0, I = 0, Z = 0, label = '', dims: any = {}, A = 0, w = 0;
      
      if (mat.matType === 'manual') {
          const iVal = parseFloat(mat.manualI);
          const zVal = parseFloat(mat.manualZ);
          const aVal = parseFloat(mat.manualA);
          const eVal = parseFloat(mat.manualE);
          I = (isNaN(iVal) ? 0 : iVal) * 10000;
          Z = (isNaN(zVal) ? 0 : zVal) * 1000;
          A = (isNaN(aVal) ? 0 : aVal);
          E = (isNaN(eVal) ? 0 : eVal) * 1000;
          w = A * 0.785;
          label = `任意断面 (I=${mat.manualI}, Z=${mat.manualZ})`;
          dims = { type: 'manual' }; 
      } else if (mat.matType === 'steel') {
        E = 205000; 
        const list = STEEL_LISTS[mat.steelShape] || STEEL_LISTS['H'];
        const name = list[mat.steelProfileIdx] || list[0];
        const props = getSteelProps(mat.steelShape, name, mat.steelAxis);
        dims = props;

        if (mat.steelShape.includes('SheetPile')) {
            const wVal = parseFloat(mat.wallLength);
            const safeWL = (isNaN(wVal) || wVal <= 0) ? 1.0 : wVal;
            const iVal = parseFloat(mat.effI);
            const safeEffI = (isNaN(iVal) || iVal < 0) ? 1.0 : iVal;
            const zVal = parseFloat(mat.effZ);
            const safeEffZ = (isNaN(zVal) || zVal < 0) ? 1.0 : zVal;
            I = props.I * safeEffI * safeWL;
            Z = props.Z * safeEffZ * safeWL;
            A = props.A * safeWL;
            w = props.w * safeWL;
            label = `${name} (L=${safeWL}m)`;
        } else {
            I = props.I; Z = props.Z; A = props.A; w = props.w;
            label = `${name} (${mat.steelAxis === 'strong' ? '強軸' : '弱軸'})`;
        }
      } else {
        const fcData = CONCRETE_STRENGTHS[mat.rcFcIdx] || CONCRETE_STRENGTHS[1];
        const b = parseFloat(mat.rcWidthStr) || 0;
        const D = parseFloat(mat.rcDepthStr) || 0;
        E = fcData.Ec; I = (b * Math.pow(D, 3)) / 12; Z = (b * Math.pow(D, 2)) / 6; 
        dims = { H: D, B: b, type: 'RC' };
        const areaM2 = (b/1000)*(D/1000);
        A = areaM2 * 10000; w = areaM2 * 2400;
        label = `RC造 ${fcData.label} ${b}x${D}`;
      }
      return { E, I, Z, label, dims, shape: mat.steelShape, axis: mat.steelAxis, matType: mat.matType, effI: mat.effI, effZ: mat.effZ, wallLength: mat.wallLength, A, w, rcCalcEnable: mat.rcCalcEnable, rcFcIdx: mat.rcFcIdx, rcRebarDiaTop: mat.rcRebarDiaTop || 'D16', rcRebarCountTop: Number(mat.rcRebarCountTop || 2), rcRebarDiaBottom: mat.rcRebarDiaBottom || 'D19', rcRebarCountBottom: Number(mat.rcRebarCountBottom || 4), rcCover: Number(mat.rcCoverStr) };
    });
  }, [materials, spans]);

  const activeSectionProps = spanSectionProps[activeSpanIdx] || spanSectionProps[0];
  const activeMat = materials[activeSpanIdx] || materials[0] || defaultMaterial;

  const results = useMemo(() => {
    try {
      setCalcError(null);
      return solveGeneralBeam(spans, supports, loads, 400, spanSectionProps);
    } catch (e) {
      console.error(e);
      setCalcError("解析エンジンでエラーが発生しました。入力を確認してください。");
      return generateEmptyResult();
    }
  }, [spans, supports, loads, spanSectionProps]);

  const autoPoiPoints = useMemo(() => {
    if(!results.bounds) return [];
    
    const R = (v: number) => Math.round(v * 1000) / 1000;
    const points = new Set<number>();
    
    points.add(R(0));
    points.add(R(totalLength));
    
    let cx = 0;
    spans.forEach((s: number) => { cx += s; points.add(R(cx)); });

    loads.forEach((l: any) => {
        points.add(R(l.pos));
        if (l.type === 'moment') {
            points.add(R(Math.max(0, l.pos - 1e-6)));
            points.add(R(Math.min(totalLength, l.pos + 1e-6)));
        } else if(l.type !== 'point') {
            points.add(R(l.pos + l.length));
        }
    });

    if (results.bounds) {
        const b = results.bounds;
        [b.maxShear_x, b.maxM_pos_x, b.maxM_neg_x, b.maxDef_x].forEach(x => { if (x !== undefined) points.add(R(x)); });
    }
    if (results.spanBounds) {
        results.spanBounds.forEach((sb: any) => {
            [sb.maxM_x, sb.minM_x, sb.maxQ_x, sb.minQ_x, sb.maxD_x, sb.minD_x].forEach(x => { if (x !== undefined) points.add(R(x)); });
        });
    }

    const findZeroCrossings = (data: any[]) => {
        const crossings = [];
        if (!data) return crossings;
        for (let i = 1; i < data.length - 1; i++) {
            if (data[i].y * data[i+1].y < -1e-6) {
                const x = data[i].x + (0 - data[i].y) * (data[i+1].x - data[i].x) / (data[i+1].y - data[i].y);
                crossings.push(x);
            } 
            else if (Math.abs(data[i].y) < 1e-6) {
                const prevY = data[i-1].y;
                const nextY = data[i+1].y;
                if (Math.abs(prevY) > 1e-4 || Math.abs(nextY) > 1e-4) crossings.push(data[i].x);
            }
        }
        return crossings;
    };
    findZeroCrossings(results.momentData).forEach(x => points.add(R(x)));
    findZeroCrossings(results.shearData).forEach(x => points.add(R(x)));

    return Array.from(points)
      .filter(p => p >= 0 && p <= totalLength)
      .sort((a, b) => a - b);
  }, [totalLength, spans.join(','), loads, results.bounds]);

  const finalPoiData = useMemo(() => {
      const merged: any[] = [];
      autoPoiPoints.forEach(x => merged.push({ type: 'auto', x, id: `auto-${x}` }));
      userPoi.forEach(p => merged.push({ type: 'user', x: p.x, id: p.id }));
      
      return merged.sort((a,b) => a.x - b.x).map(p => {
          return { ...p, res: getResultAt(p.x, results, spanSectionProps) };
      });
  }, [autoPoiPoints, userPoi, results, spanSectionProps]);

  const exportToCSV = () => {
    let csvContent = "\uFEFF";
    
    csvContent += `[INFO],Version,21.60,Date,${new Date().toLocaleDateString()}\n`;
    csvContent += `[INPUT_BASIC],SpanStr,"${spanStr}",BeamType,${beamType}\n`;
    
    csvContent += `[HEADER_MATERIAL],SpanIdx,MatType,Shape,ProfileIdx,Axis,ManualI,ManualZ,ManualA,ManualE,FcIdx,Width,Depth,EffI,EffZ,WallLength,RcCalcEnable,RebarDiaTop,RebarCountTop,RebarDiaBottom,RebarCountBottom,RcCoverTopStr,RcCoverBottomStr\n`;
    materials.forEach((mat, idx) => {
        if(idx >= spans.length) return;
        csvContent += `[MATERIAL],${idx},${mat.matType},${mat.steelShape},${mat.steelProfileIdx},${mat.steelAxis},${mat.manualI},${mat.manualZ},${mat.manualA},${mat.manualE},${mat.rcFcIdx},${mat.rcWidthStr},${mat.rcDepthStr},${mat.effI},${mat.effZ},${mat.wallLength},${mat.rcCalcEnable ? '1' : '0'},${mat.rcRebarDiaTop || ''},${mat.rcRebarCountTop || ''},${mat.rcRebarDiaBottom || ''},${mat.rcRebarCountBottom || ''},${mat.rcCoverTopStr || ''},${mat.rcCoverBottomStr || ''}\n`;
    });
    
    csvContent += `[HEADER_LOAD],Id,Type,Mag,Pos,Length,MagEnd\n`;
    loads.forEach(l => {
        csvContent += `[LOAD],${l.id},${l.type},${l.mag},${l.pos},${l.length},${l.magEnd || 0}\n`;
    });

    csvContent += `[HEADER_POI],Id,x\n`;
    userPoi.forEach(p => {
        csvContent += `[USER_POI],${p.id},${p.x}\n`;
    });

    csvContent += `[HEADER_RESULT_SECTION],SpanIdx,Label,I(mm4),Z(mm3),E(N/mm2),A(cm2),w(kg/m)\n`;
    spanSectionProps.forEach((p, idx) => {
        csvContent += `[RESULT_SECTION],${idx},"${p.label}",${p.I},${p.Z},${p.E},${p.A},${p.w}\n`;
    });

    results.reactions.forEach((r: any) => {
        csvContent += `[RESULT_REACTION],${r.label},${r.val.toFixed(2)},kN,${r.x.toFixed(3)}\n`;
    });

    if (results.spanBounds) {
        csvContent += `[HEADER_SPAN_BOUNDS],SpanIdx,Length,Item,Value,Unit,LocalX,GlobalX\n`;
        results.spanBounds.forEach((sb: any) => {
            const offset = spans.slice(0, sb.spanIndex).reduce((a: number, b: number) => a + b, 0);
            const idx = sb.spanIndex + 1;
            const len = spans[sb.spanIndex];
            
            csvContent += `[SPAN_BOUNDS],${idx},${len},MaxM_Pos,${sb.maxM},kN.m,${(sb.maxM_x - offset).toFixed(3)},${sb.maxM_x}\n`;
            csvContent += `[SPAN_BOUNDS],${idx},${len},MaxM_Neg,${sb.minM},kN.m,${(sb.minM_x - offset).toFixed(3)},${sb.minM_x}\n`;
            csvContent += `[SPAN_BOUNDS],${idx},${len},MaxQ_Pos,${sb.maxQ},kN,${(sb.maxQ_x - offset).toFixed(3)},${sb.maxQ_x}\n`;
            csvContent += `[SPAN_BOUNDS],${idx},${len},MaxQ_Neg,${sb.minQ},kN,${(sb.minQ_x - offset).toFixed(3)},${sb.minQ_x}\n`;
            csvContent += `[SPAN_BOUNDS],${idx},${len},MaxD_Pos,${sb.maxD},mm,${(sb.maxD_x - offset).toFixed(3)},${sb.maxD_x}\n`;
            csvContent += `[SPAN_BOUNDS],${idx},${len},MaxD_Neg,${sb.minD},mm,${(sb.minD_x - offset).toFixed(3)},${sb.minD_x}\n`;
        });
    }

    csvContent += `[HEADER_SPAN_DETAIL],SpanIdx,Type,LocalX(m),GlobalX(m),Q(kN),M(kN.m),Sigma(N/mm2),Deflection(mm)\n`;
    
    let currentX = 0;
    spans.forEach((len: number, sIdx: number) => {
        const rangeStart = currentX;
        const rangeEnd = currentX + len;
        
        const spanPoints = finalPoiData.filter(p => p.x >= rangeStart - 1e-4 && p.x <= rangeEnd + 1e-4);
        
        spanPoints.forEach(p => {
            const localX = Math.max(0, Math.min(len, p.x - rangeStart));
            const r = getResultAt(p.x, results, spanSectionProps, sIdx);
            
            csvContent += `[SPAN_DETAIL],${sIdx+1},${p.type},${localX.toFixed(3)},${p.x.toFixed(3)},${(r.Q||0).toFixed(3)},${(r.M||0).toFixed(3)},${(r.sigma||0).toFixed(2)},${(r.deflection||0).toFixed(3)}\n`;
        });
        
        currentX += len;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `structural_calc_result_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFromCSV = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    
    const parseCSVLine = (text: string) => {
        const result = [];
        let curr = '';
        let inQuote = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                result.push(curr);
                curr = '';
            } else {
                curr += char;
            }
        }
        result.push(curr);
        return result.map(s => s.trim().replace(/^"|"$/g, ''));
    };

    reader.onload = (e: any) => {
        try {
            const text = e.target.result;
            const lines = text.split(/\r\n|\n/);
            
            const newLoads: any[] = [];
            const newUserPoi: any[] = [];
            const newMaterials: any[] = [];
            let hasInput = false;
            
            lines.forEach(line => {
                if (!line.trim()) return;
                
                const cols = parseCSVLine(line);
                if(cols.length < 2) return;
                const tag = cols[0];
                
                if(tag === '[INPUT_BASIC]') {
                    hasInput = true;
                    setSpanStr(cols[2]);
                    setBeamType(cols[4]);
                    if (cols.length > 6) {
                        if(!newMaterials[0]) newMaterials[0] = {...defaultMaterial};
                        newMaterials[0].matType = cols[6];
                    }
                } else if (tag === '[MATERIAL]') {
                    hasInput = true;
                    const idx = Number(cols[1]);
                    newMaterials[idx] = {
                        matType: cols[2], steelShape: cols[3], steelProfileIdx: Number(cols[4]), steelAxis: cols[5],
                        manualI: cols[6], manualZ: cols[7], manualA: cols[8], manualE: cols[9],
                        rcFcIdx: Number(cols[10]), rcWidthStr: cols[11], rcDepthStr: cols[12],
                        effI: cols[13], effZ: cols[14], wallLength: cols[15],
                        rcCalcEnable: cols[16] === '1',
                        rcRebarDiaTop: cols[17] || 'D16', rcRebarCountTop: cols[18] || '2',
                        rcRebarDiaBottom: cols[19] || 'D19', rcRebarCountBottom: cols[20] || '4',
                        rcCoverTopStr: cols[21] || '50', rcCoverBottomStr: cols[22] || '50'
                    };
                } else if (tag === '[INPUT_STEEL]') {
                    if(!newMaterials[0]) newMaterials[0] = {...defaultMaterial};
                    newMaterials[0].steelShape = cols[2];
                    newMaterials[0].steelProfileIdx = Number(cols[4]);
                    newMaterials[0].steelAxis = cols[6];
                } else if (tag === '[INPUT_MANUAL]') {
                    if(!newMaterials[0]) newMaterials[0] = {...defaultMaterial};
                    newMaterials[0].manualI = cols[2];
                    newMaterials[0].manualZ = cols[4];
                    newMaterials[0].manualA = cols[6];
                    newMaterials[0].manualE = cols[8];
                } else if (tag === '[INPUT_RC]') {
                    if(!newMaterials[0]) newMaterials[0] = {...defaultMaterial};
                    newMaterials[0].rcFcIdx = Number(cols[2]);
                    newMaterials[0].rcWidthStr = cols[4];
                    newMaterials[0].rcDepthStr = cols[6];
                } else if (tag === '[INPUT_PILE]') {
                    if(!newMaterials[0]) newMaterials[0] = {...defaultMaterial};
                    newMaterials[0].effI = cols[2];
                    newMaterials[0].effZ = cols[4];
                    newMaterials[0].wallLength = cols[6];
                } else if (tag === '[LOAD]') {
                    newLoads.push({
                        id: Number(cols[1]), type: cols[2], mag: Number(cols[3]),
                        pos: Number(cols[4]), length: Number(cols[5]), magEnd: Number(cols[6])
                    });
                } else if (tag === '[USER_POI]') {
                    newUserPoi.push({ id: Number(cols[1]), x: Number(cols[2]) });
                }
            });
            
            if (hasInput) {
                if (newMaterials.length === 1 && newMaterials[0]) {
                    setMaterials([newMaterials[0]]);
                } else if (newMaterials.length > 0) {
                    for(let i=0; i<newMaterials.length; i++) {
                        if(!newMaterials[i]) newMaterials[i] = newMaterials[i-1] || defaultMaterial;
                    }
                    setMaterials(newMaterials);
                }
                setLoads(newLoads);
                setUserPoi(newUserPoi);
                setCalcError(null);
            } else {
                setCalcError("有効な入力データが見つかりませんでした。");
            }
        } catch (err) {
            console.error(err);
            setCalcError("ファイルの解析に失敗しました。正しいCSV形式ではありません。");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const addLoad = () => {
    const id = Date.now();
    let safePos = Math.max(0, Math.min(totalLength, Number(newPos)));
    let safeLength = Math.max(0, Number(newLength));
    if ((newLoadType === 'distributed' || newLoadType === 'trapezoid') && safePos + safeLength > totalLength) {
      safeLength = totalLength - safePos;
    }
    setLoads([...loads, {
      id, type: newLoadType, mag: Number(newMagStart), pos: safePos, length: safeLength,
      magEnd: newLoadType === 'trapezoid' ? Number(newMagEnd) : (newLoadType === 'distributed' ? Number(newMagStart) : 0)
    }]);
  };

  const handleTypeChange = (newType: string) => {
    setBeamType(newType);
    if(newType.includes('continuous3') && spanStr.indexOf(',')===-1) setSpanStr("5.0, 5.0, 5.0");
    else if(newType.includes('continuous2') && spanStr.indexOf(',')===-1) setSpanStr("5.0, 5.0");
    else if(newType.includes('overhang_one') && spanStr.indexOf(',')===-1) setSpanStr("6.0, 2.0");
    else if(newType.includes('overhang_both') && spanStr.indexOf(',')===-1) setSpanStr("2.0, 6.0, 2.0");
  };

  const handlePrint = () => {
      const reportHtml = renderToStaticMarkup(
          <PrintReport 
              params={{ 
                  spanStr, beamType, loads, 
                  spanSectionProps, results, finalPoiData, 
                  spans, totalLength, supports, showStress
              }} 
          />
      );

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
          alert("ポップアップがブロックされました。ブラウザの設定で許可してください。");
          return;
      }

      const htmlContent = `
          <!DOCTYPE html>
          <html lang="ja">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>構造計算書 - 印刷プレビュー</title>
              <script src="https://cdn.tailwindcss.com"><\/script>
              <style>
                  body { font-family: 'Helvetica Neue', Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  @page { size: A4 portrait; margin: 10mm; }
                  @media print {
                      .no-print { display: none; }
                      h2 { break-before: auto; }
                      .page-break { break-before: page; }
                      .avoid-break { page-break-inside: avoid; }
                  }
                  .container { max-width: 190mm; margin: 0 auto; background: white; padding: 5mm; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                  @media screen {
                      body { background: #f1f5f9; padding: 20px; }
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  ${reportHtml}
              </div>
              <script>
                  window.onload = () => {
                      setTimeout(() => {
                          window.print();
                      }, 800);
                  };
              <\/script>
          </body>
          </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="no-print p-4 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                構造計算アプリ Pro <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded">v30.00</span>
                </h1>
                <p className="text-slate-500 text-sm mt-1">スパン毎の材料設定・任意断面入力・不連続点自動補正</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-start md:justify-end">
                <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"><History className="w-3.5 h-3.5 text-blue-500" />履歴</button>
                <button onClick={() => setShowHelp(true)} className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"><HelpCircle className="w-3.5 h-3.5 text-blue-500" />ヘルプ</button>
                <button onClick={() => setShowResultWindow(!showResultWindow)} className={`flex items-center gap-1.5 px-2 py-1.5 border border-slate-300 rounded text-xs font-bold shadow-sm transition-all ${showResultWindow ? 'bg-blue-100 text-blue-700 border-blue-400' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                <ExternalLink className="w-3.5 h-3.5" />別窓
                </button>
                <div className="flex items-center ml-1 border-l pl-2 border-slate-300">
                  <label className="flex items-center gap-1 cursor-pointer text-xs font-bold text-slate-600">
                    <input type="checkbox" checked={showStress} onChange={e => setShowStress(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500"/>
                    応力
                  </label>
                </div>
                <button onClick={handlePrint} className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-600 border border-transparent rounded text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all ml-1"><Printer className="w-3.5 h-3.5" />印刷</button>
                
                <button onClick={exportToCSV} className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"><FileDown className="w-3.5 h-3.5" />CSV出力</button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"><Upload className="w-3.5 h-3.5" />読込</button>
                <input type="file" ref={fileInputRef} accept=".csv" onChange={importFromCSV} className="hidden" />
            </div>
            </div>

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
            {showHistory && <VersionHistoryModal onClose={() => setShowHistory(false)} />}

            <div className="lg:col-span-4 space-y-6">
                <ModelLoadControls 
                    beamType={beamType} setBeamType={setBeamType} spanStr={spanStr} setSpanStr={setSpanStr}
                    handleTypeChange={handleTypeChange} newLoadType={newLoadType} setNewLoadType={setNewLoadType}
                    newMagStart={newMagStart} setNewMagStart={setNewMagStart} newMagEnd={newMagEnd} setNewMagEnd={setNewMagEnd}
                    newPos={newPos} setNewPos={setNewPos} newLength={newLength} setNewLength={setNewLength}
                    addLoad={addLoad} loads={loads} setLoads={setLoads}
                />
                
                <MaterialSettings
                    materials={materials} setMaterials={setMaterials} activeSpanIdx={activeSpanIdx} setActiveSpanIdx={setActiveSpanIdx}
                    spans={spans} applyToAllSpans={applyToAllSpans} activeMat={activeMat} updateMaterial={updateMaterial}
                    activeSectionProps={activeSectionProps}
                />
            </div>

            <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ResultBox label="最大M (+)" val={results.bounds.maxM_pos} x={results.bounds.maxM_pos_x} unit="kN·m" color="text-emerald-600" sub={showStress ? `σ=${results.bounds.maxSigma_pos.toFixed(0)}` : undefined} />
                <ResultBox label="最大M (-)" val={results.bounds.maxM_neg} x={results.bounds.maxM_neg_x} unit="kN·m" color="text-red-600" sub={showStress ? `σ=${Math.abs(results.bounds.maxSigma_neg).toFixed(0)}` : undefined} />
                <ResultBox label="最大たわみ" val={results.bounds.maxDeflection} x={results.bounds.maxDef_x} unit="mm" color="text-blue-600" />
                <ResultBox label="最大せん断" val={results.bounds.maxShear} x={results.bounds.maxShear_x} unit="kN" color="text-amber-600" />
                {results.reactions.map((r: any, i: number) => (
                <ResultBox key={i} label={`反力 ${r.label}`} val={r.val} unit="kN" color="text-purple-600" sub={`@${r.x.toFixed(1)}m`} />
                ))}
            </div>
            
            {calcError ? (
                <div className="bg-red-50 border-red-200 border p-4 text-red-700 rounded flex items-center gap-2"><AlertTriangle className="w-5 h-5"/>{calcError}</div>
            ) : (
                <>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
                    <h2 className="text-sm font-bold text-slate-500 mb-4 flex items-center justify-between">
                    <span>解析結果グラフ ({spanSectionProps.every((p: any) => p.label === spanSectionProps[0].label) ? spanSectionProps[0].label : '複数材料'})</span>
                    <span className="text-xs font-normal bg-slate-100 px-2 py-1 rounded text-slate-500">モデル全長: {totalLength.toFixed(2)}m</span>
                    </h2>
                    <AdvancedVisualizer spans={spans} supports={supports} totalLength={totalLength} loads={loads} results={results} spanSectionProps={spanSectionProps} />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
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
                </div>
                <RCSummary spans={spans} spanSectionProps={spanSectionProps} results={results} showStress={showStress} />
                </>
            )}
            </div>
        </div>
      </div> 

      {showResultWindow && (
        <ResultWindow onClose={() => setShowResultWindow(false)}>
            <ResultContent 
                results={results}
                spanSectionProps={spanSectionProps}
                loads={loads}
                spans={spans}
                supports={supports}
                totalLength={totalLength}
                finalPoiData={finalPoiData}
                userPoi={userPoi}
                setUserPoi={setUserPoi}
                showStress={showStress}
            />
        </ResultWindow>
      )}
      
    </div>
  );
}
