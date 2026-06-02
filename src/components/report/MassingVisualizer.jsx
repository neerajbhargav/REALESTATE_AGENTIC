import React, { useState, useRef, useEffect } from "react";
import { Box, HelpCircle, Layers, Maximize } from "lucide-react";
import { fmtNum } from "../../lib/format";

export const MassingVisualizer = ({ bsf }) => {
  const allowedBsf = bsf?.residential_bsf || 20000;
  const lotArea = bsf?.lot_area_sf || 5000;

  // Visualizer interactive state
  const [coverage, setCoverage] = useState(60); // Footprint coverage %
  const [floors, setFloors] = useState(5);       // Floors count
  const [isRotating, setIsRotating] = useState(true);

  // Rotation angles for user drag controls
  const [rotX, setRotX] = useState(-25);
  const [rotY, setRotY] = useState(35);

  const dragStart = useRef(null);
  const animationRef = useRef(null);

  // Auto rotation when not dragging
  useEffect(() => {
    if (!isRotating) return;
    
    const animate = () => {
      setRotY((y) => (y + 0.15) % 360);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRotating]);

  // Handle drag to rotate 3D view
  const handleMouseDown = (e) => {
    setIsRotating(false);
    dragStart.current = { x: e.clientX, y: e.clientY, rotX, rotY };
  };

  const handleMouseMove = (e) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    // Scale sensitivity
    setRotY(dragStart.current.rotY + dx * 0.5);
    setRotX(Math.max(-70, Math.min(0, dragStart.current.rotX - dy * 0.5)));
  };

  const handleMouseUp = () => {
    dragStart.current = null;
  };

  // Calculations
  const footprintSf = lotArea * (coverage / 100);
  const calculatedBsf = footprintSf * floors;
  const utilization = allowedBsf > 0 ? (calculatedBsf / allowedBsf) * 100 : 0;
  
  // Heights and widths for the CSS 3D Box
  const lotWidth = 140; // baseline lot width px
  const lotDepth = 140;

  // building sizes scaled
  const bldgWidth = lotWidth * Math.sqrt(coverage / 100);
  const bldgDepth = lotDepth * Math.sqrt(coverage / 100);
  const bldgHeight = floors * 8; // 8px per floor

  return (
    <div className="bg-white border border-zinc-200 rounded-sm p-6 overflow-hidden flex flex-col lg:flex-row gap-6 lg:h-full">
      
      {/* 3D Viewport Column */}
      <div className="flex-1 flex flex-col min-h-[300px] border border-zinc-100 rounded-sm bg-zinc-50/50 relative select-none">
        
        {/* Controls Overlay */}
        <div className="absolute top-3 left-3 z-10 font-mono text-[9px] text-zinc-400 bg-white/80 backdrop-blur-sm border border-zinc-200 rounded px-2 py-1 pointer-events-none">
          Drag to rotate massing envelope
        </div>

        <button
          onClick={() => setIsRotating(!isRotating)}
          className="absolute top-3 right-3 z-10 font-mono text-[9px] uppercase tracking-wider bg-white hover:bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-zinc-600 transition-colors shadow-sm"
        >
          {isRotating ? "Pause Spin" : "Auto Spin"}
        </button>

        {/* 3D Perspective Box */}
        <div
          className="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ perspective: "800px", perspectiveOrigin: "50% 35%" }}
        >
          <div
            className="relative transition-transform duration-100 ease-out"
            style={{
              width: `${lotWidth}px`,
              height: `${lotDepth}px`,
              transformStyle: "preserve-3d",
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            }}
          >
            {/* LOT PLANE GRID */}
            <div
              className="absolute inset-0 bg-zinc-200/50 border border-zinc-300 shadow-inner"
              style={{
                transform: "rotateX(90deg) translateZ(-70px)",
                backgroundImage: "radial-gradient(circle, #d4d4d8 1px, transparent 1px)",
                backgroundSize: "14px 14px",
              }}
            />

            {/* LOT BOUNDARY WIREFRAME BOX */}
            <div
              className="absolute inset-0 border border-dashed border-zinc-300"
              style={{
                transform: `translateZ(${-70 + 80}px)`, // height wireframe outline
                width: `${lotWidth}px`,
                height: `${lotDepth}px`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Back posts to anchor lot boundaries in 3D */}
              <div className="absolute left-0 top-0 w-0 h-40 border-l border-zinc-200/50 origin-bottom" style={{ transform: "rotateX(-90deg) translateZ(80px)" }} />
              <div className="absolute right-0 top-0 w-0 h-40 border-l border-zinc-200/50 origin-bottom" style={{ transform: "rotateX(-90deg) translateZ(80px)" }} />
              <div className="absolute left-0 bottom-0 w-0 h-40 border-l border-zinc-200/50 origin-bottom" style={{ transform: "rotateX(-90deg) translateZ(80px)" }} />
              <div className="absolute right-0 bottom-0 w-0 h-40 border-l border-zinc-200/50 origin-bottom" style={{ transform: "rotateX(-90deg) translateZ(80px)" }} />
            </div>

            {/* BUILDING 3D BOX (Translucent Envelope) */}
            <div
              className="absolute transition-all duration-300 ease-out"
              style={{
                width: `${bldgWidth}px`,
                height: `${bldgDepth}px`,
                left: `${(lotWidth - bldgWidth) / 2}px`,
                top: `${(lotDepth - bldgDepth) / 2}px`,
                transformStyle: "preserve-3d",
                transform: `rotateX(90deg) translateZ(${-70 + bldgHeight / 2}px)`, // centered height translate
              }}
            >
              {/* Faces of the 3D translucent solid box */}
              {/* Front */}
              <div
                className="absolute inset-0 bg-blue-500/25 border border-blue-500/80 backdrop-blur-[1px] transition-all"
                style={{ transform: `translateZ(${bldgDepth / 2}px)` }}
              />
              {/* Back */}
              <div
                className="absolute inset-0 bg-blue-500/25 border border-blue-500/80 backdrop-blur-[1px] transition-all"
                style={{ transform: `rotateY(180deg) translateZ(${bldgDepth / 2}px)` }}
              />
              {/* Left */}
              <div
                className="absolute top-0 bottom-0 bg-blue-500/20 border border-blue-500/70 backdrop-blur-[1px] transition-all"
                style={{
                  width: `${bldgDepth}px`,
                  left: `${-bldgDepth / 2}px`,
                  transform: "rotateY(-90deg)",
                }}
              />
              {/* Right */}
              <div
                className="absolute top-0 bottom-0 bg-blue-500/20 border border-blue-500/70 backdrop-blur-[1px] transition-all"
                style={{
                  width: `${bldgDepth}px`,
                  right: `${-bldgDepth / 2}px`,
                  transform: "rotateY(90deg)",
                }}
              />
              {/* Top (Roof) */}
              <div
                className="absolute left-0 right-0 bg-blue-600/40 border border-blue-500 transition-all flex items-center justify-center"
                style={{
                  height: `${bldgDepth}px`,
                  top: `${-bldgDepth / 2}px`,
                  transform: "rotateX(90deg)",
                }}
              >
                <div className="font-mono text-[7px] text-white font-extrabold uppercase select-none opacity-80 scale-75">
                  Roof
                </div>
              </div>
              {/* Bottom */}
              <div
                className="absolute left-0 right-0 bg-blue-700/10"
                style={{
                  height: `${bldgDepth}px`,
                  top: `${-bldgDepth / 2}px`,
                  transform: "rotateX(-90deg)",
                }}
              />
            </div>

          </div>
        </div>

        {/* Floor markers */}
        <div className="absolute bottom-3 right-3 font-mono text-[10px] text-zinc-500 bg-white/80 border border-zinc-200 rounded px-2 py-1">
          {floors} Stories ({fmtNum(bldgHeight)}px visual)
        </div>
      </div>

      {/* Assumptions & Outputs Column */}
      <div className="w-full lg:w-[320px] shrink-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Box className="w-4 h-4 text-zinc-950" />
            <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-700 font-bold">
              3D Zoning Envelope
            </h3>
          </div>
          
          <p className="text-xs text-zinc-500 leading-relaxed mb-6">
            Test building footprints and story counts relative to PLUTO's maximum buildable limits.
          </p>

          <div className="space-y-4">
            {/* Coverage slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-500">Lot Coverage (Footprint)</span>
                <span className="font-bold text-zinc-950">{coverage}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={coverage}
                onChange={(e) => setCoverage(Number(e.target.value))}
                className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-950"
              />
              <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                <span>{fmtNum(lotArea * 0.3)} SF footprint</span>
                <span>{fmtNum(lotArea * 0.9)} SF footprint</span>
              </div>
            </div>

            {/* Stories/Floors slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-500">Story Height (Floors)</span>
                <span className="font-bold text-zinc-950">{floors} FLOORS</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={floors}
                onChange={(e) => setFloors(Number(e.target.value))}
                className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-950"
              />
              <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                <span>1 Story</span>
                <span>24 Stories</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Outputs */}
        <div className="border-t border-zinc-150 pt-5 mt-6 space-y-3.5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-zinc-500 font-sans">Allowed Buildable SF</span>
            <span className="font-mono text-xs font-bold text-zinc-950">{fmtNum(allowedBsf)} SF</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-zinc-500 font-sans">Designed Envelope SF</span>
            <span className={`font-mono text-xs font-extrabold ${calculatedBsf > allowedBsf ? "text-red-600" : "text-emerald-700"}`}>
              {fmtNum(calculatedBsf)} SF
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  utilization > 100 ? "bg-red-600 animate-pulse" : "bg-emerald-600"
                }`}
                style={{ width: `${Math.min(100, utilization)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-zinc-400">
              <span>Zoning Utilization</span>
              <span className={utilization > 100 ? "text-red-600 font-bold" : ""}>
                {Math.round(utilization)}%
              </span>
            </div>
          </div>

          {/* Under/Over warning indicator */}
          {calculatedBsf > allowedBsf ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-[11px] font-sans flex items-start gap-2 animate-pulse">
              <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Zoning Limit Exceeded!</strong> This height and coverage combination exceeds the maximum allowable FAR of this lot under as-of-right zoning.
              </span>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-zinc-200 text-zinc-600 rounded p-3 text-[11px] font-sans flex items-start gap-2">
              <Layers className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-500" />
              <span>
                Building fits inside limits. Remaining potential: <strong>{fmtNum(allowedBsf - calculatedBsf)} SF</strong> buildable.
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default MassingVisualizer;
