import React, { useState, useEffect } from 'react';

export function PoiInput({ id, globalX, rangeStart, onUpdate }: any) {
    const localVal = Math.max(0, globalX - rangeStart);
    const [val, setVal] = useState(localVal.toFixed(3));

    useEffect(() => {
        if (Math.abs(Number(val) - localVal) > 0.001) {
             setVal(localVal.toFixed(3));
        }
    }, [globalX, rangeStart]);

    const handleChange = (e: any) => {
        const v = e.target.value;
        setVal(v);
        
        const n = parseFloat(v);
        if (!isNaN(n)) {
            onUpdate(id, n + rangeStart);
        }
    };

    return (
        <input 
            type="number" 
            step="0.001" 
            className="w-16 p-1 border rounded bg-white font-mono text-blue-700 focus:ring-1 ring-blue-400"
            value={val} 
            onChange={handleChange} 
        />
    );
}
