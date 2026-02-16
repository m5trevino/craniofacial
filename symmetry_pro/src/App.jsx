import React, { useState, useRef } from 'react';
import { Upload, Fingerprint, Download, RefreshCw, Crosshair } from 'lucide-react';

const App = () => {
  const [img1, setImg1] = useState(null);
  const [img2, setImg2] = useState(null);
  const [opacity, setOpacity] = useState(50);
  const [diffMode, setDiffMode] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, s: 100, r: 0 });
  const [report, setReport] = useState(null);
  const containerRef = useRef(null);

  const handleUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setter(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const move = (dx, dy) => setPos(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));

  const generateReport = async () => {
    if (!img1 || !img2) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const panelW = 1000;
    const panelH = 1200;
    const pad = 40;
    
    canvas.width = (panelW * 2) + (pad * 3);
    canvas.height = (panelH * 2) + (pad * 4) + 200;

    const loadImage = (src) => new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.src = src;
    });

    const iA = await loadImage(img1);
    const iB = await loadImage(img2);

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawPanel = (img, x, y, title, isComposite = false, useDiff = false) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, panelW, panelH);
      ctx.clip();

      const ratio = Math.min(panelW / img.width, panelH / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const ox = (panelW - w) / 2;
      const oy = (panelH - h) / 2;

      if (!isComposite) {
        ctx.drawImage(img, x + ox, y + oy, w, h);
      } else {
        const iARatio = Math.min(panelW / iA.width, panelH / iA.height);
        ctx.drawImage(iA, x + (panelW - iA.width * iARatio) / 2, y + (panelH - iA.height * iARatio) / 2, iA.width * iARatio, iA.height * iARatio);
        
        ctx.save();
        ctx.translate(x + panelW/2, y + panelH/2);
        const domScale = panelW / containerRef.current.clientWidth;
        ctx.translate(pos.x * domScale, pos.y * domScale);
        ctx.scale(pos.s / 100, pos.s / 100);
        ctx.rotate(pos.r * Math.PI / 180);
        
        if (useDiff) {
          ctx.globalCompositeOperation = 'difference';
          ctx.filter = 'contrast(1.5) brightness(1.2)';
        } else {
          ctx.globalAlpha = opacity / 100;
        }
        ctx.drawImage(iB, -w/2, -h/2, w, h);
        ctx.restore();
      }
      ctx.restore();
      ctx.strokeStyle = '#333';
      ctx.strokeRect(x, y, panelW, panelH);
      ctx.fillStyle = '#00ff41';
      ctx.font = 'bold 32px Courier New';
      ctx.fillText(title, x + 20, y + 50);
    };

    drawPanel(iA, pad, pad + 100, "EXHIBIT A: REFERENCE");
    drawPanel(iB, panelW + pad * 2, pad + 100, "EXHIBIT B: TARGET");
    drawPanel(iB, pad, panelH + pad * 2 + 100, "OVERLAY BLEND", true, false);
    drawPanel(iB, panelW + pad * 2, panelH + pad * 2 + 100, "FORENSIC DIFFERENCE", true, true);

    ctx.fillStyle = '#111';
    ctx.fillRect(pad, canvas.height - 180, canvas.width - (pad * 2), 140);
    ctx.fillStyle = '#00ff41';
    ctx.font = '26px Courier New';
    ctx.fillText(`LANDMARKS >> ZOOM: ${pos.s}% | TILT: ${pos.r}deg | X: ${pos.x} | Y: ${pos.y}`, pad + 40, canvas.height - 110);
    ctx.fillText(`VERDICT: SYMMETRY_PRO // DATA_LOCK_SECURE`, pad + 40, canvas.height - 60);

    setReport(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col gap-4">
      <header className="border-b border-gray-800 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-neon-green font-bold text-xl tracking-tighter">SYMMETRY_PRO</h1>
          <p className="text-[9px] text-gray-500 uppercase">Forensic Systems Architect</p>
        </div>
        <button onClick={() => setPos({x:0,y:0,s:100,r:0})} className="p-2 border border-red-900 rounded text-red-500 active:bg-red-900/20">
          <RefreshCw size={16} />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col items-center p-3 bg-tactical-gray border border-gray-800 rounded">
          <span className="text-[10px] text-blue-500 font-bold mb-1">BASE_A</span>
          <Upload size={18} />
          <input type="file" className="hidden" onChange={e => handleUpload(e, setImg1)} />
        </label>
        <label className="flex flex-col items-center p-3 bg-tactical-gray border border-gray-800 rounded">
          <span className="text-[10px] text-red-500 font-bold mb-1">BASE_B</span>
          <Upload size={18} />
          <input type="file" className="hidden" onChange={e => handleUpload(e, setImg2)} />
        </label>
      </div>

      <div ref={containerRef} className="relative aspect-[4/5] bg-black border border-gray-700 rounded-lg overflow-hidden">
        {img1 && <img src={img1} className="absolute inset-0 w-full h-full object-contain" />}
        {img2 && (
          <img 
            src={img2} 
            className="absolute inset-0 w-full h-full object-contain transition-all"
            style={{ 
              opacity: diffMode ? 1 : opacity / 100,
              mixBlendMode: diffMode ? 'difference' : 'normal',
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.s/100}) rotate(${pos.r}deg)`,
              filter: diffMode ? 'contrast(1.4) brightness(1.2)' : 'none'
            }} 
          />
        )}
      </div>

      <div className="bg-tactical-gray p-4 border border-gray-800 rounded-lg space-y-4">
        <div className="flex gap-4">
          <div className="grid grid-cols-3 gap-1">
            <div /> <button className="w-10 h-10 border border-gray-700 rounded" onClick={() => move(0,-2)}>▲</button> <div />
            <button className="w-10 h-10 border border-gray-700 rounded" onClick={() => move(-2,0)}>◀</button>
            <div className="w-10 h-10 flex items-center justify-center text-neon-green"><Crosshair size={14}/></div>
            <button className="w-10 h-10 border border-gray-700 rounded" onClick={() => move(2,0)}>▶</button>
            <div /> <button className="w-10 h-10 border border-gray-700 rounded" onClick={() => move(0,2)}>▼</button> <div />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 uppercase"><span>Zoom</span><span>{pos.s}%</span></div>
              <input type="range" min="50" max="250" value={pos.s} onChange={e => setPos({...pos, s: +e.target.value})} />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 uppercase"><span>Tilt</span><span>{pos.r}°</span></div>
              <input type="range" min="-30" max="30" value={pos.r} onChange={e => setPos({...pos, r: +e.target.value})} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-[10px] text-gray-500 uppercase"><span>Opacity</span><span>{opacity}%</span></div>
          <input type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(e.target.value)} disabled={diffMode} />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button onClick={() => setDiffMode(!diffMode)} className={`py-4 rounded font-bold text-[10px] border flex items-center justify-center gap-2 ${diffMode ? 'bg-neon-green text-black border-neon-green' : 'border-gray-600'}`}>
            <Fingerprint size={16}/> {diffMode ? 'ACTIVE' : 'FORENSIC'}
          </button>
          <button onClick={generateReport} className="py-4 bg-blue-900 border border-blue-500 rounded font-bold text-[10px] flex items-center justify-center gap-2">
            <Download size={16}/> LOCK CASE
          </button>
        </div>
      </div>

      {report && (
        <div className="fixed inset-0 bg-black/98 z-50 flex flex-col p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-neon-green font-bold text-sm">QUAD-PANEL EVIDENCE FILE</h2>
            <button onClick={() => setReport(null)} className="px-4 py-2 bg-red-900/30 text-red-500 text-xs rounded">CLOSE</button>
          </div>
          <div className="flex-1 overflow-auto bg-[#050505] rounded border border-gray-800 p-2">
            <img src={report} className="w-full h-auto" />
          </div>
          <p className="text-[10px] text-gray-500 mt-4 text-center">LONG-PRESS TO SAVE TO GALLERY</p>
        </div>
      )}
    </div>
  );
};

export default App;
