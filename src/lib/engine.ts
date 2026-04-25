import { E_STEEL, EPS, STEEL_DB, STEEL_LISTS, CONCRETE_STRENGTHS } from './constants';

export function normalizeText(text: string) {
  return text.replace(/[０-９．，]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/、/g, ',');
}

export function getSteelProps(shape: string, name: string, axis: string) {
  const props = STEEL_DB[name];
  if (!props) return { H:0, B:0, t1:0, t2:0, I:0, Z:0, A:0, w:0, label: name + ' (Unk)' };

  let H = 0, B = 0, t1 = 0, t2 = 0, C_lip = 0;
  if (shape.includes('SheetPile')) {
    H = props.H; B = props.B; t1 = props.t; t2 = props.t;
  } else if (shape === 'SquarePipe') {
    const nums = name.replace(/^Square-/, '').split('x').map(Number);
    [H, B, t1] = nums; t2 = t1;
  } else {
    const nums = name.replace(/^[A-Z]-/, '').split('x').map(Number);
    if (shape === 'H' || shape === 'Channel') { [H, B, t1, t2] = nums; } 
    else if (shape === 'LipChannel') { [H, B, C_lip, t1] = nums; t2 = t1; } 
    else if (shape === 'Angle') { [H, B, t1] = nums; t2 = t1; }
  }

  let I, Z;
  if (axis === 'strong') {
    I = props.Ix * 10000; Z = props.Zx * 1000;
  } else {
    I = props.Iy * 10000; Z = props.Zy * 1000;
  }

  return { H, B, t1, t2, C_lip, I, Z, A: props.A, w: props.w };
}

export function solveGeneralBeam(spans: number[], supports: string[], loads: any[], resolution: number, spanProps: any[]) {
  const totalL = spans.reduce((a, b) => a + b, 0);
  const validSupportIndices = supports.map((s, i) => s !== 'free' ? i : -1).filter(i => i !== -1);
  if (validSupportIndices.length < 1) return generateEmptyResult();

  const idxStart = validSupportIndices[0];
  const idxEnd = validSupportIndices[validSupportIndices.length - 1];

  const spanLoads = spans.map(() => [] as any[]);
  let cx = 0;
  spans.forEach((len, i) => {
    const sx = cx; const ex = cx + len;
    loads.forEach(l => {
      if (l.type === 'moment' && l.pos === 0 && supports[0] === 'fixed') return; 
      if (l.type === 'moment' && l.pos === totalL && supports[supports.length - 1] === 'fixed') return;

      const lStart = l.pos;
      const lEnd = l.type === 'point' || l.type === 'moment' ? l.pos : l.pos + l.length;
      const oStart = Math.max(sx, lStart);
      const oEnd = Math.min(ex, lEnd);
      if ((oEnd > oStart + EPS) || ((l.type === 'point' || l.type === 'moment') && lStart >= sx - EPS && (i === spans.length-1 ? lStart <= ex + EPS : lStart < ex - EPS))) {
        let mag = l.mag; let magEnd = l.magEnd;
        if (l.type === 'trapezoid') {
           const slope = (l.magEnd - l.mag) / l.length;
           mag = l.mag + slope * (oStart - l.pos);
           magEnd = l.mag + slope * (oEnd - l.pos);
        }
        spanLoads[i].push({ ...l, pos: oStart - sx, length: oEnd - oStart, mag, magEnd });
      }
    });
    cx += len;
  });

  let M_start = 0; 
  if (idxStart > 0) {
    for (let i = 0; i < idxStart; i++) {
       const distToSupport = spans.slice(i+1, idxStart).reduce((a,b)=>a+b, 0);
       spanLoads[i].forEach(l => {
         if (l.type === 'moment') M_start += l.mag;
         else {
             const { totalForce, momentA } = getLoadIntegral(l);
             const xc = totalForce !== 0 ? momentA / totalForce : 0;
             const arm = (spans[i] - xc) + distToSupport;
             M_start -= totalForce * arm; 
         }
       });
    }
  }
  let M_end = 0;
  if (idxEnd < spans.length) {
    for (let i = idxEnd; i < spans.length; i++) {
       const distToSupport = spans.slice(idxEnd, i).reduce((a,b)=>a+b, 0);
       spanLoads[i].forEach(l => {
         if (l.type === 'moment') M_end -= l.mag; 
         else {
             const { totalForce, momentA } = getLoadIntegral(l);
             const xc = totalForce !== 0 ? momentA / totalForce : 0;
             const arm = distToSupport + xc;
             M_end -= totalForce * arm;
         }
       });
    }
  }

  const numNodes = idxEnd - idxStart + 1;
  const nodeMoments = new Array(spans.length + 1).fill(0);
  
  if (numNodes <= 1) {
    if (idxStart === idxEnd) nodeMoments[idxStart] = M_start + M_end;
  } else {
    const matrixSize = numNodes;
    const A = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));
    const B = Array(matrixSize).fill(0);

    const EI0 = spanProps[0].E * spanProps[0].I || 1;

    for (let k = 0; k < numNodes; k++) {
      const nodeIdx = idxStart + k;
      const supportType = supports[nodeIdx]; 
      const leftSpanIdx = nodeIdx - 1;
      const rightSpanIdx = nodeIdx;
      
      const EI_L = (leftSpanIdx >= 0 && spanProps[leftSpanIdx]) ? (spanProps[leftSpanIdx].E * spanProps[leftSpanIdx].I) : 1;
      const EI_R = (rightSpanIdx < spans.length && spanProps[rightSpanIdx]) ? (spanProps[rightSpanIdx].E * spanProps[rightSpanIdx].I) : 1;
      
      const L_L = (leftSpanIdx >= 0) ? spans[leftSpanIdx] : 0;
      const L_R = (rightSpanIdx < spans.length) ? spans[rightSpanIdx] : 0;

      const loadTermL = (leftSpanIdx >= idxStart) ? calcPhi(L_L, spanLoads[leftSpanIdx]).phiR : 0;
      const loadTermR = (rightSpanIdx < idxEnd) ? calcPhi(L_R, spanLoads[rightSpanIdx]).phiL : 0;

      const flexL = (L_L / EI_L) * EI0;
      const flexR = (L_R / EI_R) * EI0;
      const termL = (loadTermL / EI_L) * EI0;
      const termR = (loadTermR / EI_R) * EI0;

      if (k === 0) {
        if (supportType === 'fixed') {
          A[k][k] = 2 * flexR;
          if (numNodes > 1) A[k][k+1] = flexR;
          B[k] = -6 * termR;
        } else {
          A[k][k] = 1; B[k] = M_start;
        }
      } else if (k === numNodes - 1) {
        if (supportType === 'fixed') {
          A[k][k-1] = flexL; A[k][k] = 2 * flexL;
          B[k] = -6 * termL;
        } else {
          A[k][k] = 1; B[k] = M_end;
        }
      } else {
        A[k][k-1] = flexL;
        A[k][k] = 2 * (flexL + flexR);
        A[k][k+1] = flexR;
        B[k] = -6 * (termL + termR);
      }
    }
    const M_solutions = solveLinearSystem(A, B);
    for(let k=0; k<numNodes; k++) {
      nodeMoments[idxStart + k] = M_solutions[k];
    }
  }

  const shearData = []; 
  const momentData = [];
  let globalX = 0;

  for (let i = 0; i < spans.length; i++) {
    const len = spans[i];
    const sLoads = spanLoads[i];
    const ML = nodeMoments[i];
    const MR = nodeMoments[i+1];

    const keyPoints = new Set([0, len]);
    sLoads.forEach(l => { 
        keyPoints.add(l.pos); 
        if (l.type === 'moment') {
            keyPoints.add(Math.max(0, l.pos - 1e-6));
            keyPoints.add(Math.min(len, l.pos + 1e-6));
        } else if(l.type !== 'point') {
            keyPoints.add(l.pos + l.length);
        }
    });
    
    const steps = Math.max(50, Math.min(Math.ceil(len * 200), 2000));
    for(let k=0; k<=steps; k++) keyPoints.add(k * (len / steps));
    const sortedLx = Array.from(keyPoints).sort((a,b)=>a-b);

    let sumP=0, sumM=0;
    sLoads.forEach(l=>{ const r=getLoadIntegral(l); sumP+=r.totalForce; sumM+=r.momentA; });
    const Rb_s = sumM/len; const Ra_s = sumP - Rb_s;

    sortedLx.forEach(lx => {
        const gx = globalX + lx;
        const Qb = (MR - ML) / len;
        
        const Q_left = getSectionForceSimple(lx, sLoads, Ra_s, 'left').Q + Qb;
        const Q_right = getSectionForceSimple(lx, sLoads, Ra_s, 'right').Q + Qb;
        
        shearData.push({ x: gx, y: Q_left });
        if (Math.abs(Q_left - Q_right) > 1e-6) {
            shearData.push({ x: gx, y: Q_right });
        }
        
        const Ms = getSectionForceSimple(lx, sLoads, Ra_s).M;
        const Mb = ML + (MR - ML) * (lx / len);
        momentData.push({ x: gx, y: Ms + Mb });
    });
    globalX += len;
  }

  const deflectionData = [];
  const spanDeltas = [];
  
  for (let i = 0; i < spans.length; i++) {
      const len = spans[i];
      const props = spanProps[i];
      const EI = props.E * props.I;
      const sLoads = spanLoads[i];
      
      let sumP=0, sumM=0;
      sLoads.forEach(l=>{ const r=getLoadIntegral(l); sumP+=r.totalForce; sumM+=r.momentA; });
      const Rb_s = sumM/len; const Ra_s = sumP - Rb_s;
      const ML = nodeMoments[i]; const MR = nodeMoments[i+1];
      
      const steps = Math.max(50, Math.min(Math.ceil(len * 200), 2000));
      const dx = len / steps;
      let dTh = 0, dV = 0;
      const localPoints = [];
      localPoints.push({ x: 0, dTh: 0, dV: 0 });
      
      for(let k=0; k<steps; k++) {
          const x1 = k * dx;
          const x2 = (k + 1) * dx;
          
          const Ms1 = getSectionForceSimple(x1, sLoads, Ra_s).M;
          const Mb1 = ML + (MR - ML) * (x1 / len);
          const M1 = Ms1 + Mb1;
          const kappa1 = -(M1 * 1e6) / EI;
          
          const Ms2 = getSectionForceSimple(x2, sLoads, Ra_s).M;
          const Mb2 = ML + (MR - ML) * (x2 / len);
          const M2 = Ms2 + Mb2;
          const kappa2 = -(M2 * 1e6) / EI;
          
          const dx_mm = dx * 1000;
          const avgKappa = (kappa1 + kappa2) / 2;
          
          const prev_dTh = dTh;
          dTh += avgKappa * dx_mm;
          dV += (prev_dTh + dTh) / 2 * dx_mm;
          
          localPoints.push({ x: x2, dTh, dV });
      }
      spanDeltas.push({ dTh, dV, localPoints });
  }

  const spanV0 = new Array(spans.length).fill(0);
  const spanTh0 = new Array(spans.length).fill(0);

  for (let i = 0; i < spans.length; i++) {
      if (supports[i] !== 'free' && supports[i+1] !== 'free') {
          spanV0[i] = 0;
          if (supports[i] === 'fixed') spanTh0[i] = 0;
          else spanTh0[i] = -spanDeltas[i].dV / (spans[i] * 1000);
      }
  }

  for (let i = 0; i < spans.length; i++) {
      if (supports[i] !== 'free' && supports[i+1] === 'free') {
          spanV0[i] = 0;
          if (supports[i] === 'fixed') spanTh0[i] = 0;
          else if (i > 0) spanTh0[i] = spanTh0[i-1] + spanDeltas[i-1].dTh;
      }
  }

  if (supports[0] === 'free' && spans.length > 1) {
      const th_right = spanTh0[1];
      spanTh0[0] = th_right - spanDeltas[0].dTh;
      const L_mm = spans[0] * 1000;
      spanV0[0] = -(spanTh0[0] * L_mm + spanDeltas[0].dV);
  }

  if (supports[0] === 'fixed' && supports[1] === 'free') {
      spanV0[0] = 0; spanTh0[0] = 0;
  }

  let globalX_def = 0;
  for (let i = 0; i < spans.length; i++) {
      const pts = spanDeltas[i].localPoints;
      pts.forEach((p: any) => {
          const x_mm = p.x * 1000;
          const y = spanV0[i] + spanTh0[i] * x_mm + p.dV;
          if (i > 0 && p.x === 0) return;
          deflectionData.push({ x: globalX_def + p.x, y: y });
      });
      globalX_def += spans[i];
  }

  const spanBounds = [];
  let sx = 0;
  for (let i = 0; i < spans.length; i++) {
    const ex = sx + spans[i];
    
    const sLoads = spanLoads[i];
    let sumP=0, sumM=0;
    sLoads.forEach(l=>{ const r=getLoadIntegral(l); sumP+=r.totalForce; sumM+=r.momentA; });
    const len = spans[i];
    const Rb_s = sumM/len; const Ra_s = sumP - Rb_s;
    const ML = nodeMoments[i]; const MR = nodeMoments[i+1];
    const Qb = (MR - ML) / len;

    const zeroCrossX = [];
    const checkStep = 50; 
    for(let k=0; k<checkStep; k++) {
        const x1 = (k/checkStep)*len;
        const x2 = ((k+1)/checkStep)*len;
        const Q1 = getSectionForceSimple(x1, sLoads, Ra_s).Q + Qb;
        const Q2 = getSectionForceSimple(x2, sLoads, Ra_s).Q + Qb;
        if(Q1 * Q2 < 0) {
             const x0 = x1 + (0 - Q1) * (x2 - x1) / (Q2 - Q1);
             zeroCrossX.push(x0);
        }
    }

    const sM_points = momentData.filter(d => d.x >= sx - EPS && d.x <= ex + EPS);
    const sQ_points = shearData.filter(d => d.x >= sx - EPS && d.x <= ex + EPS);
    const sD_points = deflectionData.filter(d => d.x >= sx - EPS && d.x <= ex + EPS);

    zeroCrossX.forEach(zx => {
        const gx = sx + zx;
        const res = getSectionForceSimple(zx, sLoads, Ra_s);
        const Mb = ML + (MR - ML) * (zx / len);
        const valM = res.M + Mb;
        sM_points.push({ x: gx, y: valM });
    });

    const maxM = Math.max(...sM_points.map(d => d.y)), minM = Math.min(...sM_points.map(d => d.y));
    const maxQ = Math.max(...sQ_points.map(d => d.y)), minQ = Math.min(...sQ_points.map(d => d.y));
    const maxD = Math.max(...sD_points.map(d => d.y)), minD = Math.min(...sD_points.map(d => d.y));

    const Z = spanProps[i]?.Z || 1;
    const maxSigma_pos_local = maxM > 0 ? maxM * 1e6 / Z : 0;
    const maxSigma_neg_local = minM < 0 ? minM * 1e6 / Z : 0;

    spanBounds.push({
      spanIndex: i, 
      maxM, maxM_x: sM_points.find(d => d.y === maxM)?.x || sx,
      minM, minM_x: sM_points.find(d => d.y === minM)?.x || sx,
      maxQ, maxQ_x: sQ_points.find(d => d.y === maxQ)?.x || sx,
      minQ, minQ_x: sQ_points.find(d => d.y === minQ)?.x || sx,
      maxD, maxD_x: sD_points.find(d => d.y === maxD)?.x || sx,
      minD, minD_x: sD_points.find(d => d.y === minD)?.x || sx,
      maxSigma_pos: maxSigma_pos_local,
      maxSigma_neg: maxSigma_neg_local
    });
    sx = ex;
  }

  const reactions: any[] = [];
  validSupportIndices.forEach(idx => {
    let pos = 0; for(let k=0; k<idx; k++) pos += spans[k];
    let R_val = 0;

    if (idx > 0) {
        const i = idx - 1;
        const len = spans[i];
        const sLoads = spanLoads[i];
        let sumP=0, sumM=0;
        sLoads.forEach(l=>{ const r=getLoadIntegral(l); sumP+=r.totalForce; sumM+=r.momentA; });
        const Rb_simple = sumM/len; 
        
        const ML = nodeMoments[i]; const MR = nodeMoments[i+1];
        const Q_mom = (MR - ML) / len; 
        R_val += (Rb_simple - Q_mom);
    }

    if (idx < spans.length) {
        const i = idx;
        const len = spans[i];
        const sLoads = spanLoads[i];
        let sumP=0, sumM=0;
        sLoads.forEach(l=>{ const r=getLoadIntegral(l); sumP+=r.totalForce; sumM+=r.momentA; });
        const Rb_simple = sumM/len;
        const Ra_simple = sumP - Rb_simple;

        const ML = nodeMoments[i]; const MR = nodeMoments[i+1];
        const Q_mom = (MR - ML) / len;
        
        R_val += (Ra_simple + Q_mom);
    }
    
    reactions.push({ x: pos, val: R_val, label: String.fromCharCode(65+idx) });
  });

  const maxM_pos = Math.max(0, ...momentData.map(d=>d.y));
  const maxM_neg = Math.min(0, ...momentData.map(d=>d.y));

  let globalMaxSigma_pos = 0;
  let globalMaxSigma_neg = 0;
  spanBounds.forEach(sb => {
      if (sb.maxSigma_pos > globalMaxSigma_pos) globalMaxSigma_pos = sb.maxSigma_pos;
      if (Math.abs(sb.maxSigma_neg) > Math.abs(globalMaxSigma_neg)) globalMaxSigma_neg = sb.maxSigma_neg;
  });

  return {
    shearData, momentData, deflectionData, spanBounds, reactions,
    raw: { spans, spanLoads, nodeMoments, supports },
    bounds: { 
      maxShear: Math.max(...shearData.map(d=>Math.abs(d.y))), maxShear_x: 0,
      maxM_pos, maxM_pos_x: momentData.find(d=>d.y===maxM_pos)?.x || 0,
      maxM_neg, maxM_neg_x: momentData.find(d=>d.y===maxM_neg)?.x || 0,
      maxDeflection: Math.max(...deflectionData.map(d=>Math.abs(d.y))), 
      maxDef_x: deflectionData.find(d=>Math.abs(d.y) === Math.max(...deflectionData.map(v=>Math.abs(v.y))))?.x || 0,
      maxSigma_pos: globalMaxSigma_pos,
      maxSigma_neg: globalMaxSigma_neg
    },
  };
}

export function getResultAt(x: number, results: any, spanProps: any[], targetSpanIndex = -1) {
    if (!results.momentData) return {};

    if (results.raw) {
        const { spans, spanLoads, nodeMoments, supports } = results.raw;
        let currentX = 0;
        let spanIndex = -1;
        let localX = 0;

        if (targetSpanIndex !== -1 && targetSpanIndex >= 0 && targetSpanIndex < spans.length) {
            for(let k=0; k<targetSpanIndex; k++) currentX += spans[k];
            spanIndex = targetSpanIndex;
            localX = x - currentX;
            if(localX < 0 && localX > -0.001) localX = 0;
            if(localX > spans[spanIndex] && localX < spans[spanIndex] + 0.001) localX = spans[spanIndex];
        } else {
            for(let i=0; i<spans.length; i++) {
                if (x >= currentX - 1e-9 && x <= currentX + spans[i] + 1e-9) {
                    spanIndex = i;
                    localX = x - currentX;
                    if(localX < 0) localX = 0;
                    if(localX > spans[i]) localX = spans[i];
                    break;
                }
                currentX += spans[i];
            }
        }

        if (spanIndex !== -1) {
            const props = spanProps[spanIndex] || spanProps[0];
            const len = spans[spanIndex];
            const loads = spanLoads[spanIndex];
            const ML = nodeMoments[spanIndex];
            const MR = nodeMoments[spanIndex + 1];

            let sumP=0, sumM=0;
            loads.forEach((l: any)=>{ const r=getLoadIntegral(l); sumP+=r.totalForce; sumM+=r.momentA; });
            const Rb_simple = sumM/len;
            const Ra_simple = sumP - Rb_simple;

            const simpleRes = getSectionForceSimple(localX, loads, Ra_simple, 'right');
            const Qb = (MR - ML) / len;
            const Mb = ML + (MR - ML) * (localX / len);
            
            const totalQ = simpleRes.Q + Qb;
            let totalM = simpleRes.M + Mb;

            const totalLen = spans.reduce((a: number,b: number)=>a+b, 0);
            const rightSupport = supports[supports.length - 1];
            
            const isTargetSupport = ['free', 'pin', 'roller'].includes(rightSupport);

            if (Math.abs(x - totalLen) < 0.001 && isTargetSupport) {
                const lastSpanIdx = spans.length - 1;
                const lastSpanLoads = spanLoads[lastSpanIdx];
                const lastSpanLen = spans[lastSpanIdx];
                
                let endMomentSum = 0;
                lastSpanLoads.forEach((l: any) => {
                    if (l.type === 'moment' && Math.abs(l.pos - lastSpanLen) < 0.001) {
                        endMomentSum += l.mag;
                    }
                });
                
                if (endMomentSum !== 0) {
                    totalM += (-endMomentSum);
                }
            }

            let defVal = 0;
            if (results.deflectionData) {
                 const arr = results.deflectionData;
                 const match = arr.find((p: any) => Math.abs(p.x - x) < 1e-4);
                 if (match) defVal = match.y;
                 else {
                     const low = arr.filter((p: any) => p.x <= x).pop();
                     const high = arr.find((p: any) => p.x > x);
                     if (low && high) {
                         defVal = low.y + (high.y - low.y) * ((x - low.x)/(high.x - low.x));
                     } else {
                         defVal = low ? low.y : (high ? high.y : 0);
                     }
                 }
            }

            let supX = 0;
            let isNearSupport = false;
            for(let i=0; i<supports.length; i++) {
                if (supports[i] !== 'free') {
                    if (Math.abs(x - supX) < 0.001) {
                        isNearSupport = true;
                        break;
                    }
                }
                if (i < spans.length) supX += spans[i];
            }
            if (isNearSupport) defVal = 0;

            return {
                Q: totalQ,
                M: totalM,
                deflection: defVal,
                sigma: Math.abs(totalM * 1e6 / (props.Z || 1))
            };
        }
    }

    const getVal = (arr: any[]) => {
        if (!arr || arr.length === 0) return 0;
        const match = arr.find(p => Math.abs(p.x - x) < 1e-4);
        if (match) return match.y;
        const low = arr.filter(p => p.x <= x).pop();
        const high = arr.find(p => p.x > x);
        if (low && high) {
             return low.y + (high.y - low.y) * ((x - low.x)/(high.x - low.x));
        }
        return low ? low.y : (high ? high.y : 0);
    };
    const M = getVal(results.momentData);

    let fallbackZ = spanProps[0]?.Z || 1;
    let fallbackSpanIdx = 0;
    let currX = 0;
    for(let i=0; i<(results.raw?.spans?.length || 0); i++) {
        currX += results.raw.spans[i];
        if (x <= currX + 1e-4) {
            fallbackSpanIdx = i;
            break;
        }
    }
    if(spanProps[fallbackSpanIdx]) fallbackZ = spanProps[fallbackSpanIdx].Z;

    return {
        Q: getVal(results.shearData),
        M: M,
        deflection: getVal(results.deflectionData),
        sigma: Math.abs(M * 1e6 / fallbackZ)
    };
}

export function getSectionForceSimple(x: number, loads: any[], Ra: number, side='left') {
  let Q = Ra, M = Ra * x;
  loads.forEach(l => {
    if (l.pos > x + EPS) return;
    if ((l.type === 'point' || l.type === 'moment') && Math.abs(l.pos - x) < EPS && side === 'left') return;
    let endPos = l.pos + l.length, effectiveLen = Math.max(0, Math.min(x, endPos) - l.pos);
    if (effectiveLen < EPS && l.type !== 'point' && l.type !== 'moment') return;
    let pLoad = { ...l, length: effectiveLen };
    if (l.type === 'trapezoid') pLoad.magEnd = l.mag + (l.magEnd - l.mag) * effectiveLen / l.length;
    
    if (l.type === 'moment') {
        M += l.mag; 
    } else {
        const r = getLoadIntegral(pLoad);
        Q -= r.totalForce; M -= (x * r.totalForce - r.momentA);
    }
  });
  return { Q, M };
}

export function getLoadIntegral(l: any) {
  if (l.type === 'point') return { totalForce: l.mag, momentA: l.mag * l.pos };
  if (l.type === 'moment') return { totalForce: 0, momentA: l.mag }; 
  const w1=l.mag, w2=l.type==='trapezoid'?l.magEnd:l.mag, L=l.length;
  if (L <= 0) return { totalForce: 0, momentA: 0 };
  const F = L*(w1+w2)/2, distC = (w1+w2)===0 ? L/2 : (L/3) * (w1 + 2*w2) / (w1+w2); 
  return { totalForce: F, momentA: F * (l.pos + distC) };
}

export function calcPhi(L: number, loads: any[]) {
  let phiL = 0, phiR = 0; 
  const stepsPerMeter = 1000;
  const N = Math.min(Math.max(50, Math.ceil(L * stepsPerMeter)), 10000); 
  const dx = L/N;
  let sumP=0, sumM=0; loads.forEach(l=>{ const r=getLoadIntegral(l); sumP+=r.totalForce; sumM+=r.momentA; });
  const Rb = sumM/L, Ra = sumP - Rb;
  for(let i=0; i<N; i++) {
    const x = (i+0.5)*dx, M = getSectionForceSimple(x, loads, Ra).M;
    phiL += (M * (L-x)/L) * dx; phiR += (M * x/L) * dx;
  }
  return { phiL, phiR };
}

export function solveLinearSystem(A: number[][], B: number[]) {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(A[i][i]), maxRow = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > maxEl) { maxEl = Math.abs(A[k][i]); maxRow = k; }
    for (let k = i; k < n; k++) { const t = A[maxRow][k]; A[maxRow][k] = A[i][k]; A[i][k] = t; }
    { const t = B[maxRow]; B[maxRow] = B[i]; B[i] = t; }
    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) A[k][j] = (i === j ? 0 : A[k][j] + c * A[i][j]);
      B[k] += c * B[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i > -1; i--) {
    let sum = 0; for (let k = i + 1; k < n; k++) sum += A[i][k] * x[k];
    x[i] = (B[i] - sum) / A[i][i];
  }
  return x;
}

export function generateEmptyResult() {
  return { shearData:[], momentData:[], deflectionData:[], poiResults:[], spanBounds:[], reactions:[], bounds:{ maxShear:0, maxM_pos:0, maxM_neg:0, maxDeflection:0, maxSigma_pos:0, maxSigma_neg:0 } };
}
