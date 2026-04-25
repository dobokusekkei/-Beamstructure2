import React, { useEffect, useRef, useState } from 'react';
import { COLORS } from '../lib/constants';

export function AdvancedVisualizer({ spans, supports, totalLength, loads, results, forceWidth, spanSectionProps }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(forceWidth || 600);
  
  useEffect(() => {
    if (forceWidth) {
        setWidth(forceWidth);
        return;
    }
    if(containerRef.current) setWidth(containerRef.current.clientWidth);
    const h = () => { if(containerRef.current) setWidth(containerRef.current.clientWidth); };
    window.addEventListener('resize', h); return () => window.removeEventListener('resize', h);
  }, [forceWidth]);

  const height = 950, padding = { left: 50, right: 50, top: 40 };
  const scaleX = (v: number) => padding.left + (v / totalLength) * (width - padding.left - padding.right);
  
  const beamY = 120;
  const sfdY = 360; 
  const bmdY = 610; 
  const defY = 860; 
  const graphH = 70;
  
  const { maxShear, maxM_pos, maxM_neg, maxDeflection } = results.bounds;
  const maxM = Math.max(Math.abs(maxM_pos), Math.abs(maxM_neg), 1), maxD = Math.max(Math.abs(maxDeflection), 0.1), maxQ = Math.max(Math.abs(maxShear), 1);
  const syQ = (v: number) => sfdY - (v/maxQ)*(graphH/2), syM = (v: number) => bmdY + (v/maxM)*(graphH/2), syD = (v: number) => defY + (v/maxD)*(graphH/2);
  const maxLoadMag = Math.max(...loads.map((l: any) => Math.max(Math.abs(l.mag), Math.abs(l.magEnd || 0))), 1);
  const loadHScale = 40 / maxLoadMag;

  const calculateLabelLayout = (rawPoints: any[], baseY: number) => {
      let sorted = [...rawPoints].sort((a, b) => a.x - b.x);
      const placedRects: any[] = []; 
      const res: any[] = [];
      const boxW = 120; 
      const boxH = 16;  

      sorted.forEach(p => {
          const originY = p.y;
          
          const isVisuallyBelow = originY > baseY + 1; 
          const isVisuallyAbove = originY < baseY - 1; 
          let goUp;
          if (isVisuallyBelow) goUp = false;
          else if (isVisuallyAbove) goUp = true;
          else goUp = true;

          const offsetUp = 10;
          const offsetDown = 12; 
          let candY = originY + (goUp ? -offsetUp : offsetDown);
          
          const shiftStep = goUp ? -17 : 17; 

          for (let k = 0; k < 15; k++) { 
              let collision = false;
              for (const r of placedRects) {
                  const dx = Math.abs(p.x - r.x);
                  const dy = Math.abs(candY - r.y);
                  
                  if (dx < boxW && dy < boxH) {
                      collision = true;
                      break;
                  }
              }
              if (!collision) break; 
              candY += shiftStep;
          }

          placedRects.push({ x: p.x, y: candY }); 
          const showLine = Math.abs(candY - originY) > 25;
          res.push({ ...p, finalY: candY, originY, showLine });
      });

      return res;
  };

  const collectPoints = (dataArr: any[], boundsArr: any[], scaleYFunc: (v: number)=>number, type: string) => {
      const points: any[] = [];
      if (!dataArr || dataArr.length === 0) return [];

      let startP = dataArr[0];
      for(let i=0; i<dataArr.length; i++) {
          if(dataArr[i].x > 0.0001) break;
          if(Math.abs(dataArr[i].y) > Math.abs(startP.y)) startP = dataArr[i];
      }
      points.push({ xVal: startP.x, val: startP.y });
      
      let endP = dataArr[dataArr.length-1];
      const L = dataArr[dataArr.length-1].x;
      for(let i=dataArr.length-1; i>=0; i--) {
          if(dataArr[i].x < L - 0.0001) break;
          if(Math.abs(dataArr[i].y) > Math.abs(endP.y)) endP = dataArr[i];
      }
      points.push({ xVal: endP.x, val: endP.y });

      boundsArr.forEach(sb => {
          if (type === 'M') {
              if (Math.abs(sb.maxM_x - sb.minM_x) < 0.001) {
                  const val = Math.abs(sb.maxM) >= Math.abs(sb.minM) ? sb.maxM : sb.minM;
                  const x = Math.abs(sb.maxM) >= Math.abs(sb.minM) ? sb.maxM_x : sb.minM_x;
                  points.push({ xVal: x, val: val });
              } else {
                  points.push({ xVal: sb.maxM_x, val: sb.maxM });
                  points.push({ xVal: sb.minM_x, val: sb.minM });
              }
          } else if (type === 'Q') {
              points.push({ xVal: sb.maxQ_x, val: sb.maxQ });
              points.push({ xVal: sb.minQ_x, val: sb.minQ });
          } else { 
              points.push({ xVal: sb.maxD_x, val: sb.maxD });
              points.push({ xVal: sb.minD_x, val: sb.minD });
          }
      });

      const uniquePoints: any[] = [];
      points.forEach(p => {
          const exists = uniquePoints.some(ep => Math.abs(ep.xVal - p.xVal) < 0.001 && Math.abs(ep.val - p.val) < 0.01);
          if (!exists) {
              uniquePoints.push({
                  x: scaleX(p.xVal),
                  y: scaleYFunc(p.val),
                  val: p.val,
                  xVal: p.xVal,
                  unit: type === 'M' ? 'kN·m' : (type === 'Q' ? 'kN' : 'mm')
              });
          }
      });
      return uniquePoints;
  };

  const sfdPoints = collectPoints(results.shearData, results.spanBounds, syQ, 'Q');
  const sfdLabels = calculateLabelLayout(sfdPoints, sfdY); 

  const bmdPoints = collectPoints(results.momentData, results.spanBounds, syM, 'M');
  const bmdLabels = calculateLabelLayout(bmdPoints, bmdY); 

  const defPoints = collectPoints(results.deflectionData, results.spanBounds, syD, 'D');
  const defLabels = calculateLabelLayout(defPoints, defY); 

  const loadTextOccupied = useRef<any[]>([]);
  loadTextOccupied.current = [];
  const getAdjustedLoadTextY = (x: number, yBase: number, isBottom: boolean) => {
      let y = yBase, shift = isBottom ? 13 : -13;
      for(let i=0; i<5; i++) {
         let collision = false;
         for (let l of loadTextOccupied.current) if (Math.abs(x - l.x) < 40 && Math.abs(y - l.y) < 12) { collision = true; break; }
         if (!collision) break;
         y += shift; 
      }
      loadTextOccupied.current.push({ x, y }); return y;
  };

  return (
    <div ref={containerRef} className="w-full select-none">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="5" refX="7.5" refY="2.5" orient="auto">
            <polygon points="0 0, 8 2.5, 0 5" fill={COLORS.load} />
          </marker>
        </defs>
        
        <g key={`${totalLength}-${spans.join('-')}`}>
          {(() => {
            const guidePoints = new Set([0, totalLength]);
            let cx = 0; spans.forEach((s: number) => { cx += s; guidePoints.add(cx); });
            loads.forEach((l: any) => { guidePoints.add(l.pos); if(l.type !== 'point') guidePoints.add(l.pos + l.length); });
            return Array.from(guidePoints).map((gx, i) => <line key={i} x1={scaleX(gx)} y1={beamY+20} x2={scaleX(gx)} y2={height-20} stroke={COLORS.guide} strokeWidth="0.5" strokeDasharray="3" opacity="0.3" />);
          })()}

          {spans.map((len: number, i: number) => {
             let sx_val = 0; for(let k=0; k<i; k++) sx_val += spans[k];
             const x1 = scaleX(sx_val), x2 = scaleX(sx_val + len);
             return (
               <g key={`dim-span-${i}`}>
                 <text x={(x1+x2)/2} y={beamY + 45} textAnchor="middle" fontSize="10" fill={COLORS.dim}>{len}m</text>
                 <line x1={x1} y1={beamY + 35} x2={x2} y2={beamY + 35} stroke={COLORS.dim} strokeWidth="0.8" />
                 <line x1={x1} y1={beamY + 32} x2={x1} y2={beamY + 38} stroke={COLORS.dim} strokeWidth="0.8" />
                 <line x1={x2} y1={beamY + 32} x2={x2} y2={beamY + 38} stroke={COLORS.dim} strokeWidth="0.8" />
               </g>
             );
          })}

          <line x1={scaleX(0)} y1={beamY} x2={scaleX(totalLength)} y2={beamY} stroke={COLORS.beam} strokeWidth="4" />
          
          {supports.map((type: string, i: number) => {
            let cx = 0; for(let k=0;k<i;k++) cx += (k<spans.length?spans[k]:0);
            const x = scaleX(cx); if (type === 'free') return null;
            let icon = (type === 'fixed') ? <line x1={x} y1={beamY-15} x2={x} y2={beamY+15} stroke={COLORS.support} strokeWidth="6"/> : (type === 'pin') ? <polygon points={`${x},${beamY} ${x-6},${beamY+10} ${x+6},${beamY+10}`} fill="none" stroke={COLORS.support} strokeWidth="2"/> : <g><polygon points={`${x},${beamY} ${x-6},${beamY+10} ${x+6},${beamY+10}`} fill="none" stroke={COLORS.support} strokeWidth="2"/><line x1={x-8} y1={beamY+13} x2={x+8} y2={beamY+13} stroke={COLORS.support} strokeWidth="1"/></g>;
            return <g key={`supp-label-${i}`}>{icon}<text x={x} y={beamY + 25} textAnchor="middle" fontSize="11" fontWeight="bold" fill={COLORS.support}>{String.fromCharCode(65 + i)}</text></g>;
          })}

          {(() => {
            const posStack: any = {}, negStack: any = {};
            return [...loads].sort((a, b) => a.pos - b.pos).map(l => {
                const isNeg = l.mag < 0, stack = isNeg ? negStack : posStack, key = Math.round(l.pos * 10), count = stack[key] || 0; stack[key] = count + 1;
                const shift = count * 30, x = scaleX(l.pos);
                const pointOffset = (l.type === 'point') ? 20 : 0;
                const h1 = Math.abs(l.mag) * loadHScale + pointOffset; 
                const currentBeamY = isNeg ? (beamY + shift) : (beamY - shift);
                const baseY = isNeg ? (currentBeamY + h1 + 15) : (currentBeamY - h1 - 5), textY = getAdjustedLoadTextY(x, baseY, isNeg), posTextY = isNeg ? (textY + 12) : (textY - 12);
              
                if(l.type==='point') {
                   const yS = isNeg ? currentBeamY + h1 : currentBeamY - h1, yE = isNeg ? currentBeamY + 5 : currentBeamY - 5;
                   return <g key={l.id}>{shift > 0 && <line x1={x} y1={currentBeamY} x2={x} y2={beamY} stroke={COLORS.load} strokeWidth="1" strokeDasharray="2" opacity="0.5" />}<line x1={x} y1={yS} x2={x} y2={yE} stroke={COLORS.load} strokeWidth="2" markerEnd="url(#arrow)"/><text x={x} y={textY} textAnchor="middle" fontSize="10" fill={COLORS.load} fontWeight="bold">{l.mag}kN</text><text x={x} y={posTextY} textAnchor="middle" fontSize="9" fill={COLORS.dim}>x={l.pos}m</text></g>;
                } else if (l.type === 'moment') {
                   const yCenter = currentBeamY - 20;
                   const r = 16; 
                   const isCW = l.mag > 0;
                   
                   return <g key={l.id}>
                        {shift > 0 && <line x1={x} y1={currentBeamY} x2={x} y2={beamY} stroke={COLORS.load} strokeWidth="1" strokeDasharray="2" opacity="0.5" />}
                        <circle cx={x} cy={yCenter} r="2" fill={COLORS.load} />
                        <path d={isCW ? `M ${x} ${yCenter-r} A ${r} ${r} 0 1 1 ${x-r} ${yCenter}` : `M ${x} ${yCenter-r} A ${r} ${r} 0 1 0 ${x+r} ${yCenter}` } fill="none" stroke={COLORS.load} strokeWidth="2.5" />
                        <path d={isCW ? `M ${x-r} ${yCenter-6} L ${x-r-5} ${yCenter+4} L ${x-r+5} ${yCenter+4} Z` : `M ${x+r} ${yCenter-6} L ${x+r-5} ${yCenter+4} L ${x+r+5} ${yCenter+4} Z` } fill={COLORS.load} />
                        <text x={x} y={yCenter - r - 8} textAnchor="middle" fontSize="10" fill={COLORS.load} fontWeight="bold">{l.mag}kN·m</text>
                        <text x={x} y={posTextY} textAnchor="middle" fontSize="9" fill={COLORS.dim}>x={l.pos}m</text>
                   </g>;
                } else {
                   const x2 = scaleX(l.pos + l.length), mag2 = l.type === 'trapezoid' ? l.magEnd : l.mag, h2 = Math.abs(mag2) * loadHScale, y1P = isNeg ? currentBeamY + h1 : currentBeamY - h1, y2P = mag2 < 0 ? currentBeamY + h2 : currentBeamY - h2;
                   
                   if ((l.mag > 0 && mag2 < 0) || (l.mag < 0 && mag2 > 0)) {
                      const ratio = Math.abs(l.mag) / (Math.abs(l.mag) + Math.abs(mag2));
                      const xMid = x + (x2 - x) * ratio;
                      return (
                        <g key={l.id}>
                          {shift > 0 && <g><line x1={x} y1={currentBeamY} x2={x} y2={beamY} stroke={COLORS.load} strokeWidth="1" strokeDasharray="2" opacity="0.5" /><line x1={x2} y1={currentBeamY} x2={x2} y2={beamY} stroke={COLORS.load} strokeWidth="1" strokeDasharray="2" opacity="0.5" /></g>}
                          <polygon points={`${x},${currentBeamY} ${x},${y1P} ${xMid},${currentBeamY}`} fill={COLORS.loadPolygon} />
                          <polygon points={`${xMid},${currentBeamY} ${x2},${y2P} ${x2},${currentBeamY}`} fill={COLORS.loadPolygon} />
                          <line x1={x} y1={y1P} x2={xMid} y2={currentBeamY} stroke={COLORS.load} strokeWidth="1.5"/>
                          <line x1={xMid} y1={currentBeamY} x2={x2} y2={y2P} stroke={COLORS.load} strokeWidth="1.5"/>
                          <line x1={x} y1={y1P} x2={x} y2={currentBeamY + (isNeg ? 5 : -5)} stroke={COLORS.load} strokeWidth="1.5" markerEnd="url(#arrow)"/>
                          <line x1={x2} y1={y2P} x2={x2} y2={currentBeamY + (mag2 < 0 ? 5 : -5)} stroke={COLORS.load} strokeWidth="1.5" markerEnd="url(#arrow)"/>
                          <text x={x} y={textY} textAnchor="end" fontSize="10" fill={COLORS.load} fontWeight="bold">{l.mag}kN/m</text>
                          <text x={x2} y={getAdjustedLoadTextY(x2, (mag2 < 0 ? currentBeamY + h2 + 15 : currentBeamY - h2 - 5), mag2 < 0)} textAnchor="start" fontSize="10" fill={COLORS.load} fontWeight="bold">{mag2}kN/m</text>
                        </g>
                      );
                   }
                   
                   return <g key={l.id}>{shift > 0 && <g><line x1={x} y1={currentBeamY} x2={x} y2={beamY} stroke={COLORS.load} strokeWidth="1" strokeDasharray="2" opacity="0.5" /><line x1={x2} y1={currentBeamY} x2={x2} y2={beamY} stroke={COLORS.load} strokeWidth="1" strokeDasharray="2" opacity="0.5" /></g>}<polygon points={`${x},${currentBeamY} ${x},${y1P} ${x2},${y2P} ${x2},${currentBeamY}`} fill={COLORS.loadPolygon} /><line x1={x} y1={y1P} x2={x2} y2={y2P} stroke={COLORS.load} strokeWidth="1.5"/><line x1={x} y1={y1P} x2={x} y2={currentBeamY + (isNeg ? 5 : -5)} stroke={COLORS.load} strokeWidth="1.5" markerEnd="url(#arrow)"/><line x1={x2} y1={y2P} x2={x2} y2={currentBeamY + (mag2 < 0 ? 5 : -5)} stroke={COLORS.load} strokeWidth="1.5" markerEnd="url(#arrow)"/><text x={x} y={textY} textAnchor="end" fontSize="10" fill={COLORS.load} fontWeight="bold">{l.mag}kN/m</text><text x={x2} y={getAdjustedLoadTextY(x2, (mag2 < 0 ? currentBeamY + h2 + 15 : currentBeamY - h2 - 5), mag2 < 0)} textAnchor="start" fontSize="10" fill={COLORS.load} fontWeight="bold">{mag2}kN/m</text><text x={(x+x2)/2} y={posTextY} textAnchor="middle" fontSize="9" fill={COLORS.dim}>x={l.pos}~{(l.pos+l.length).toFixed(1)}m</text></g>;
                }
            });
          })()}

          <g>
            <text x={10} y={sfdY - 75} fontSize="10" fontWeight="bold" fill={COLORS.shearLine}>せん断力図 (SFD) [kN]</text>
            <line x1={scaleX(0)} y1={sfdY} x2={scaleX(totalLength)} y2={sfdY} stroke="#cbd5e1" strokeDasharray="2"/>
            <path d={`M ${scaleX(0)} ${sfdY} ` + results.shearData.map((p: any)=>`L ${scaleX(p.x)} ${syQ(p.y)}`).join(' ') + ` L ${scaleX(totalLength)} ${sfdY}`} fill={COLORS.shearFill} opacity="0.6"/><path d={`M ${scaleX(0)} ${syQ(results.shearData[0]?.y||0)} ` + results.shearData.map((p: any)=>`L ${scaleX(p.x)} ${syQ(p.y)}`).join(' ')} fill="none" stroke={COLORS.shearLine} strokeWidth="1.5"/>
            
            {sfdLabels.map((lbl, i) => {
                const anchor = (lbl.x < padding.left + 40) ? "start" : (lbl.x > width - padding.right - 40) ? "end" : "middle";
                const showLine = lbl.showLine;
                return (
                    <g key={i}>
                        {showLine && <line x1={lbl.x} y1={lbl.originY} x2={lbl.x} y2={lbl.finalY + (lbl.val>=0?5:-5)} stroke={COLORS.shearLine} strokeWidth="0.5" opacity="0.5" />}
                        <text x={lbl.x} y={lbl.finalY} textAnchor={anchor} fontSize="10" fill={COLORS.shearLine} fontWeight="bold">
                            {lbl.val > 0 ? '+' : ''}{lbl.val.toFixed(2)}{lbl.unit} <tspan fontSize="9" fill={COLORS.dim} dx="4">(x={lbl.xVal.toFixed(3)}m)</tspan>
                        </text>
                        <circle cx={lbl.x} cy={lbl.originY} r="2" fill={COLORS.shearLine} />
                    </g>
                );
            })}
          </g>

          <g>
            <text x={10} y={bmdY - 75} fontSize="10" fontWeight="bold" fill={COLORS.momentLine}>曲げモーメント図 (BMD) [kN·m]</text>
            <line x1={scaleX(0)} y1={bmdY} x2={scaleX(totalLength)} y2={bmdY} stroke="#cbd5e1" strokeDasharray="2"/>
            <path d={`M ${scaleX(0)} ${bmdY} ` + results.momentData.map((p: any)=>`L ${scaleX(p.x)} ${syM(p.y)}`).join(' ') + ` L ${scaleX(totalLength)} ${bmdY}`} fill={COLORS.momentFill} opacity="0.6"/><path d={`M ${scaleX(0)} ${syM(results.momentData[0]?.y||0)} ` + results.momentData.map((p: any)=>`L ${scaleX(p.x)} ${syM(p.y)}`).join(' ')} fill="none" stroke={COLORS.momentLine} strokeWidth="1.5"/>
            
            {bmdLabels.map((lbl, i) => {
                const anchor = (lbl.x < padding.left + 40) ? "start" : (lbl.x > width - padding.right - 40) ? "end" : "middle";
                const showLine = lbl.showLine;
                return (
                    <g key={i}>
                        {showLine && <line x1={lbl.x} y1={lbl.originY} x2={lbl.x} y2={lbl.finalY + (lbl.val>=0?5:-5)} stroke={COLORS.momentLine} strokeWidth="0.5" opacity="0.5" />}
                        <text x={lbl.x} y={lbl.finalY} textAnchor={anchor} fontSize="10" fill={COLORS.momentLine} fontWeight="bold">
                            {lbl.val > 0 ? '+' : ''}{lbl.val.toFixed(2)}{lbl.unit} <tspan fontSize="9" fill={COLORS.dim} dx="4">(x={lbl.xVal.toFixed(3)}m)</tspan>
                        </text>
                        <circle cx={lbl.x} cy={lbl.originY} r="2" fill={COLORS.momentLine} />
                    </g>
                );
            })}
          </g>

          <g>
            <text x={10} y={defY - 75} fontSize="10" fontWeight="bold" fill={COLORS.deflLine}>変位図 (たわみ) [mm]</text>
            <line x1={scaleX(0)} y1={defY} x2={scaleX(totalLength)} y2={defY} stroke="#cbd5e1" strokeDasharray="2"/>
            <path d={`M ${scaleX(0)} ${defY} ` + results.deflectionData.map((p: any)=>`L ${scaleX(p.x)} ${syD(p.y)}`).join(' ') + ` L ${scaleX(totalLength)} ${defY}`} fill={COLORS.deflFill} opacity="0.4"/><path d={`M ${scaleX(0)} ${syD(results.deflectionData[0]?.y||0)} ` + results.deflectionData.map((p: any)=>`L ${scaleX(p.x)} ${syD(p.y)}`).join(' ')} fill="none" stroke={COLORS.deflLine} strokeWidth="1.5"/>
            
            {defLabels.map((lbl, i) => {
                const anchor = (lbl.x < padding.left + 40) ? "start" : (lbl.x > width - padding.right - 40) ? "end" : "middle";
                const showLine = lbl.showLine;
                return (
                    <g key={i}>
                        {showLine && <line x1={lbl.x} y1={lbl.originY} x2={lbl.x} y2={lbl.finalY + (lbl.val>=0?5:-5)} stroke={COLORS.deflLine} strokeWidth="0.5" opacity="0.5" />}
                        <text x={lbl.x} y={lbl.finalY} textAnchor={anchor} fontSize="10" fill={COLORS.deflLine} fontWeight="bold">
                            {lbl.val > 0 ? '+' : ''}{lbl.val.toFixed(2)}{lbl.unit} <tspan fontSize="9" fill={COLORS.dim} dx="4">(x={lbl.xVal.toFixed(3)}m)</tspan>
                        </text>
                        <circle cx={lbl.x} cy={lbl.originY} r="2" fill={COLORS.deflLine} />
                    </g>
                );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
