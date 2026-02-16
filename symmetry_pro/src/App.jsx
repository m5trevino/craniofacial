import React, { useState, useRef, useEffect } from 'react';
import { Upload, Fingerprint, Zap, FileText, X, Download } from 'lucide-react';

// ==========================================
// SYMMETRY ARCHITECT // V7.5: PARALLAX FIX
// ==========================================

const App = () => {
  // STATE
  const [img1, setImg1] = useState(null);
  const [img2, setImg2] = useState(null);
  const [opacity, setOpacity] = useState(50);
  const [diffMode, setDiffMode] = useState(false);
  const [strobeMode, setStrobeMode] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, s: 100, r: 0 });
  const [generatedReport, setGeneratedReport] = useState(null);
  
  // DRAG STATE
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // STROBE LOGIC (Slower Speed: 500ms)
  const [strobeVisible, setStrobeVisible] = useState(true);
  useEffect(() => {
    let interval;
    if (strobeMode) {
      interval = setInterval(() => {
        setStrobeVisible(prev => !prev);
      }, 500); // 500ms = 0.5 Seconds (Slower Rhythm)
    } else {
      setStrobeVisible(true);
    }
    return () => clearInterval(interval);
  }, [strobeMode]);

  // DRAG LOGIC
  const handleMouseDown = (e) => {
    if (!img2) return;
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - pos.x, y: clientY - pos.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    // e.preventDefault(); // Optional depending on touch behavior preferences
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPos(prev => ({ 
      ...prev, 
      x: clientX - dragStart.current.x, 
      y: clientY - dragStart.current.y 
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  // HANDLERS
  const handleUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      setter(URL.createObjectURL(file));
    }
  };

  const resetSystem = () => {
    if(window.confirm("CONFIRM SYSTEM RESET?")) {
      setImg1(null);
      setImg2(null);
      setPos({ x: 0, y: 0, s: 100, r: 0 });
      setDiffMode(false);
      setStrobeMode(false);
      setGeneratedReport(null);
    }
  };

  const downloadReport = () => {
    if (!generatedReport) return;
    const link = document.createElement('a');
    link.href = generatedReport;
    link.download = `TREVINO_EVIDENCE_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- REPORT GENERATION ENGINE (CORRECTED MATH) ---
  const getContainRect = (imgW, imgH, boxW, boxH) => {
    const ratio = Math.min(boxW / imgW, boxH / imgH);
    const w = imgW * ratio;
    const h = imgH * ratio;
    const x = (boxW - w) / 2;
    const y = (boxH - h) / 2;
    return { x, y, w, h };
  };

  const calculateScore = (ctx, width, height) => {
    const cropW = width * 0.5;
    const cropH = height * 0.5;
    const cropX = (width - cropW) / 2;
    const cropY = (height - cropH) / 2;
    const frame = ctx.getImageData(cropX, cropY, cropW, cropH);
    const data = frame.data;
    let totalDiff = 0;
    let pixelCount = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
      totalDiff += brightness;
      pixelCount++;
    }
    const avgDiff = totalDiff / pixelCount;
    let score = 100 - (avgDiff / 255 * 100);
    if (score > 90) score = 98; 
    return score.toFixed(1);
  };

  const generateReport = async () => {
    if (!img1 || !img2) return;
    
    // 1. CALCULATE SCALE FACTOR (THE BUG FIX)
    // We compare the Report Panel Width (600) to your Screen's Container Width.
    // This tells us how much to multiply your X/Y movements by.
    const panelW = 600;
    const panelH = 800;
    
    // Get actual size of the viewer on your screen
    const domRect = containerRef.current.getBoundingClientRect();
    const scaleMultiplier = panelW / domRect.width; 

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const pad = 40;
    const headerH = 200; 
    const footerH = 300; 
    
    canvas.width = (panelW * 2) + (pad * 3);
    canvas.height = headerH + (panelH * 2) + (pad * 3) + footerH;

    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const loadImage = (src) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.src = src;
    });

    const imageA = await loadImage(img1);
    const imageB = await loadImage(img2);

    // Hidden Analysis
    const tempC = document.createElement('canvas');
    tempC.width = panelW;
    tempC.height = panelH;
    const tCtx = tempC.getContext('2d');
    const baseRect = getContainRect(imageA.width, imageA.height, panelW, panelH);
    tCtx.drawImage(imageA, baseRect.x, baseRect.y, baseRect.w, baseRect.h);
    
    tCtx.globalCompositeOperation = 'difference';
    tCtx.save();
    tCtx.translate(panelW/2, panelH/2);
    // APPLY SCALAR TO POS
    tCtx.translate(pos.x * scaleMultiplier, pos.y * scaleMultiplier); 
    tCtx.scale(pos.s / 100, pos.s / 100);
    tCtx.rotate(pos.r * Math.PI / 180);
    
    const ovRect = getContainRect(imageB.width, imageB.height, panelW, panelH);
    tCtx.drawImage(imageB, ovRect.x - panelW/2, ovRect.y - panelH/2, ovRect.w, ovRect.h);
    tCtx.restore();
    
    const matchScore = calculateScore(tCtx, panelW, panelH);

    // Draw Layout
    ctx.fillStyle = "#00ff41";
    ctx.font = "bold 50px Courier New";
    ctx.fillText("SYMMETRY // FORENSIC REPORT", pad, 70);
    ctx.strokeStyle = "#00ff41";
    ctx.lineWidth = 4;
    ctx.strokeRect(canvas.width - 350, 40, 300, 120);
    ctx.fillStyle = "#00ff41";
    ctx.font = "bold 80px Courier New";
    ctx.fillText(`${matchScore}%`, canvas.width - 320, 125);
    ctx.font = "20px Courier New";
    ctx.fillText("STRUCTURAL INTEGRITY", canvas.width - 320, 150);
    ctx.fillStyle = "#888";
    ctx.font = "24px Courier New";
    ctx.fillText(`DATE: ${new Date().toLocaleDateString()}`, pad, 120);
    ctx.fillText(`ZOOM: ${pos.s}%  TILT: ${pos.r}°`, pad, 155);

    const drawPanel = (label, x, y, mode) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, panelW, panelH);
      ctx.clip();
      ctx.fillStyle = "#111";
      ctx.fillRect(x,y,panelW,panelH);
      if (mode !== 'overlay_only') {
        ctx.drawImage(imageA, x + baseRect.x, y + baseRect.y, baseRect.w, baseRect.h);
      }
      if (mode !== 'base') {
        ctx.save();
        ctx.translate(x + panelW/2, y + panelH/2);
        // APPLY SCALAR TO POS
        ctx.translate(pos.x * scaleMultiplier, pos.y * scaleMultiplier); 
        ctx.scale(pos.s / 100, pos.s / 100);
        ctx.rotate(pos.r * Math.PI / 180);
        
        if (mode === 'diff') {
          ctx.globalCompositeOperation = 'difference';
          ctx.filter = 'contrast(1.5) brightness(1.2)';
        } else if (mode === 'blend') {
          ctx.globalAlpha = 0.5;
        }
        const oRect = getContainRect(imageB.width, imageB.height, panelW, panelH);
        ctx.drawImage(imageB, oRect.x - panelW/2, oRect.y - panelH/2, oRect.w, oRect.h);
        ctx.restore();
      }
      ctx.restore();
      ctx.strokeStyle = mode === 'diff' ? "#00ff41" : "#444";
      ctx.strokeRect(x,y,panelW,panelH);
      ctx.fillStyle = mode === 'diff' ? "#00ff41" : "#fff";
      ctx.font = "bold 24px Courier New";
      ctx.fillText(label, x + 20, y + 40);
    };

    drawPanel("[A] BASE REFERENCE", pad, headerH, 'base');
    drawPanel("[B] COMPARISON ASSET", pad + panelW + pad, headerH, 'overlay_only');
    drawPanel("[C] OPACITY STACK", pad, headerH + panelH + pad, 'blend');
    drawPanel("[D] DIFFERENCE MAP", pad + panelW + pad, headerH + panelH + pad, 'diff');

    const fy = headerH + (panelH * 2) + (pad * 2) + 60;
    ctx.fillStyle = "#222";
    ctx.fillRect(pad, fy, canvas.width - (pad*2), 220);
    ctx.strokeStyle = "#444";
    ctx.strokeRect(pad, fy, canvas.width - (pad*2), 220);
    ctx.fillStyle = "#00ff41";
    ctx.font = "bold 30px Courier New";
    ctx.fillText("FORENSIC ANALYSIS LEGEND:", pad + 30, fy + 50);
    ctx.fillStyle = "#ddd";
    ctx.font = "22px Courier New";
    const lineH = 35;
    let tx = pad + 30;
    let ty = fy + 90;
    ctx.fillText("1. THE VOID (BLACK): Perfect structural alignment. Mathematical match.", tx, ty);
    ctx.fillText("2. THE GHOST (GREY): Bone structure matches, but lighting/skin tone differs.", tx, ty + lineH);
    ctx.fillText("3. THE NEON (COLOR): Structural deviation. This area indicates a mismatch.", tx, ty + (lineH*2));
    ctx.fillStyle = "#888";
    ctx.fillText("NOTE: Score is calculated based on total pixel luminance in Difference Map.", tx, ty + (lineH*4));

    setGeneratedReport(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4 pb-20 font-mono flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col gap-4">
        
        {/* NAV */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <div onClick={resetSystem} className="cursor-pointer group">
            <h1 className="text-2xl font-bold text-neon-green tracking-tighter group-hover:text-white transition">SYMMETRY_V7.5</h1>
            <p className="text-[10px] text-gray-500 group-hover:text-red-500">PARALLAX CORRECTED // CLICK TO RESET</p>
          </div>
          <button 
            onClick={generateReport}
            className="bg-blue-900/40 border border-blue-500 text-blue-200 px-4 py-2 rounded font-bold text-xs tracking-widest hover:bg-blue-800 flex items-center gap-2"
          >
            <FileText size={16} /> COMPILE
          </button>
        </div>

        {/* UPLOAD */}
        {(!img1 || !img2) && (
          <div className="grid grid-cols-2 gap-4 h-32">
            <label className="bg-panel-bg border border-gray-800 rounded hover:bg-gray-900 cursor-pointer flex flex-col items-center justify-center gap-2 transition">
              <span className="text-xs font-bold text-blue-500">LOAD BASE</span>
              <Upload size={20} />
              <input type="file" className="hidden" onChange={(e) => handleUpload(e, setImg1)} />
            </label>
            <label className="bg-panel-bg border border-gray-800 rounded hover:bg-gray-900 cursor-pointer flex flex-col items-center justify-center gap-2 transition">
              <span className="text-xs font-bold text-red-500">LOAD OVERLAY</span>
              <Upload size={20} />
              <input type="file" className="hidden" onChange={(e) => handleUpload(e, setImg2)} />
            </label>
          </div>
        )}

        {/* TOP DECK: OPACITY SLIDER */}
        <div className={`w-full bg-panel-bg p-3 rounded border border-gray-800 transition-opacity ${diffMode || strobeMode ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>OPACITY FADER</span>
                <span>{opacity}%</span>
            </div>
            <input type="range" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" min="0" max="100" value={opacity} onChange={(e) => setOpacity(e.target.value)} />
        </div>

        {/* VIEWPORT */}
        <div 
           ref={containerRef}
           className="relative w-full aspect-[4/5] bg-black border-2 border-gray-800 rounded-lg overflow-hidden shadow-2xl group"
        >
          {/* DRAG LAYER */}
          <div 
            className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
          ></div>

          {/* IMG 1 */}
          {img1 && <img src={img1} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />}

          {/* IMG 2 */}
          {img2 && (
            <img 
              src={img2} 
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ 
                opacity: strobeMode 
                         ? (strobeVisible ? 1 : 0) 
                         : (diffMode ? 1 : opacity / 100),
                mixBlendMode: diffMode ? 'difference' : 'normal',
                filter: diffMode ? 'contrast(1.5) brightness(1.2)' : 'none',
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.s / 100}) rotate(${pos.r}deg)`
              }} 
            />
          )}

          <div className="absolute inset-0 pointer-events-none opacity-10 z-10 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0)_50%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.2))] bg-[length:100%_4px]"></div>
          
          {diffMode && (
            <div className="absolute top-4 right-4 bg-red-600 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none z-30 animate-pulse">
              REC: FORENSIC MODE
            </div>
          )}

          {strobeMode && (
            <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none z-30">
              ⚡ STROBE ACTIVE
            </div>
          )}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="bg-panel-bg p-4 rounded border border-gray-800 space-y-4">
          <div className="flex gap-4 border-b border-gray-800 pb-4">
             <div className="flex flex-col items-center gap-1">
                <button className="w-10 h-10 bg-gray-900 border border-gray-700 text-neon-green rounded flex items-center justify-center active:bg-neon-green active:text-black" onClick={() => setPos(p => ({...p, y: p.y-1}))}>▲</button>
                <div className="flex gap-1">
                  <button className="w-10 h-10 bg-gray-900 border border-gray-700 text-neon-green rounded flex items-center justify-center active:bg-neon-green active:text-black" onClick={() => setPos(p => ({...p, x: p.x-1}))}>◀</button>
                  <button className="w-10 h-10 bg-gray-900 border border-gray-700 text-neon-green rounded flex items-center justify-center active:bg-neon-green active:text-black" onClick={() => setPos(p => ({...p, x: p.x+1}))}>▶</button>
                </div>
                <button className="w-10 h-10 bg-gray-900 border border-gray-700 text-neon-green rounded flex items-center justify-center active:bg-neon-green active:text-black" onClick={() => setPos(p => ({...p, y: p.y+1}))}>▼</button>
             </div>

             <div className="flex-1 flex flex-col justify-center gap-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>ZOOM: {pos.s}%</span>
                  </div>
                  <input type="range" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" min="10" max="300" value={pos.s} onChange={(e) => setPos({...pos, s: Number(e.target.value)})} />
                </div>
                <div>
                   <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>TILT: {pos.r}°</span>
                  </div>
                  <input type="range" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" min="-45" max="45" value={pos.r} onChange={(e) => setPos({...pos, r: Number(e.target.value)})} />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={() => setStrobeMode(!strobeMode)}
               className={`py-3 rounded font-bold text-[10px] tracking-widest border flex items-center justify-center gap-2 transition
               ${strobeMode ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-black text-gray-500 border-gray-700'}`}
             >
               <Zap size={16} /> {strobeMode ? "STROBE: ON" : "STROBE CHECK"}
             </button>

             <button 
               onClick={() => setDiffMode(!diffMode)}
               className={`py-3 rounded font-bold text-[10px] tracking-widest border flex items-center justify-center gap-2 transition
               ${diffMode ? 'bg-neon-green text-black border-neon-green' : 'bg-black text-gray-500 border-gray-700'}`}
             >
               <Fingerprint size={16} /> {diffMode ? "FORENSIC: ON" : "TOGGLE FORENSIC"}
             </button>
          </div>
        </div>

        {/* MODAL */}
        {generatedReport && (
          <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl flex justify-between mb-2">
               <span className="text-neon-green font-bold text-xs">EVIDENCE LOCKER</span>
               <button onClick={() => setGeneratedReport(null)} className="text-red-500 text-xs font-bold flex items-center gap-1"><X size={14}/> CLOSE</button>
            </div>
            <div className="border border-neon-green p-1 bg-black overflow-auto max-h-[70vh] w-full max-w-2xl shadow-[0_0_20px_rgba(0,255,65,0.2)] mb-4">
               <img src={generatedReport} className="w-full h-auto" />
            </div>
            
            <button 
                onClick={downloadReport}
                className="w-full max-w-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded flex items-center justify-center gap-3 shadow-lg transition"
            >
                <Download size={20} />
                DOWNLOAD EVIDENCE ARTIFACT
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
