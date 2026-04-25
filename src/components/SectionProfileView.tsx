import React from 'react';

export function SectionProfileView({ props }: any) {
  const { shape, dims, axis, matType } = props;
  const size = 100, scale = 0.8;
  const cx = size / 2, cy = size / 2;
  let pathD = "";
  
  if (matType === 'manual') {
      const maxDim = 200;
      const s_manual = (v: number) => (v / maxDim) * size * scale;
      const H=s_manual(200), B=s_manual(100), t1=s_manual(6), t2=s_manual(8);
      pathD = `M ${cx-B/2} ${cy-H/2} h ${B} v ${t2} h ${-(B-t1)/2} v ${H-2*t2} h ${(B-t1)/2} v ${t2} h ${-B} v ${-t2} h ${(B-t1)/2} v ${-(H-2*t2)} h ${-(B-t1)/2} z`;
      return <svg width="100%" height="100%" viewBox="0 0 100 100"><path d={pathD} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3" /><text x={50} y={50} textAnchor="middle" fontSize="10" fill="#64748b" dominantBaseline="middle">Manual</text></svg>;
  }

  if (!dims.H) return null;
  const maxDim = Math.max(dims.H, dims.B);
  function s(v: number) { return (v / maxDim) * size * scale; }
  
  if (matType === 'concrete') {
    const w = s(dims.B), h = s(dims.H); 
    pathD = `M ${cx-w/2} ${cy-h/2} h ${w} v ${h} h ${-w} z`;
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        <path d={pathD} fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
        <text x={cx} y={cy+h/2+10} textAnchor="middle" fontSize="8" fill="#475569">b={dims.B}</text>
        <text x={cx+w/2+2} y={cy} textAnchor="start" fontSize="8" fill="#475569">D={dims.H}</text>
      </svg>
    );
  } else {
    const H = s(dims.H), B = s(dims.B), t1 = s(dims.t1), t2 = s(dims.t2), C = s(dims.C_lip || 0);
    if (shape === 'H') pathD = `M ${cx-B/2} ${cy-H/2} h ${B} v ${t2} h ${-(B-t1)/2} v ${H-2*t2} h ${(B-t1)/2} v ${t2} h ${-B} v ${-t2} h ${(B-t1)/2} v ${-(H-2*t2)} h ${-(B-t1)/2} z`;
    else if (shape === 'Channel') pathD = `M ${cx-B/2} ${cy-H/2} h ${B} v ${t2} h ${-(B-t1)} v ${H-2*t2} h ${B-t1} v ${t2} h ${-B} z`;
    else if (shape === 'Angle') pathD = `M ${cx-B/2} ${cy-H/2} v ${H} h ${B} v ${-t2} h ${-(B-t1)} v ${-(H-t2)} z`;
    else if (shape === 'LipChannel') pathD = `M ${cx-B/2} ${cy-H/2} h ${B} v ${C} h ${-t2} v ${-(C-t2)} h ${-(B-t1-t2)} v ${H-2*t2} h ${B-t1-t2} v ${-(C-t2)} h ${t2} v ${C} h ${-B} z`;
    else if (shape.includes('SheetPile')) {
        const dH = H, dB = B, dt = t1;
        pathD = `M ${cx-dB/2} ${cy-dH/2} v ${dH} h ${dB} v ${-dH} h ${-dt} v ${dH-dt} h ${-(dB-2*dt)} v ${-(dH-dt)} z`;
    } else if (shape === 'SquarePipe') {
        const dH = H, dB = B, dt = t1;
        pathD = `M ${cx-dB/2} ${cy-dH/2} h ${dB} v ${dH} h ${-dB} z M ${cx-(dB-2*dt)/2} ${cy-(dH-2*dt)/2} v ${dH-2*dt} h ${dB-2*dt} v ${-(dH-2*dt)} z`;
    }
  }
  return <svg width="100%" height="100%" viewBox="0 0 100 100"><path d={pathD} fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" fillRule="evenodd" transform={axis === 'weak' ? `rotate(90, ${cx}, ${cy})` : ''} /></svg>;
}
