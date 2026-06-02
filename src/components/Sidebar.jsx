import React from "react";
import { Building2, MapPin, Zap, Code2, ExternalLink } from "lucide-react";

const TEST_ADDRESSES = [
  "21-48 44th Drive, Long Island City, NY",
  "23-29 Astoria Boulevard, Astoria, NY",
  "365 Rutland Road, Brooklyn, NY",
  "75-43 113th Street, Forest Hills, NY",
  "4408 60th Street, Woodside, NY",
];

export const Sidebar = ({ reports, onSelect, onSample, activeId, loading }) => {
  return (
    <aside
      data-testid="sidebar"
      className="w-full lg:w-[280px] shrink-0 border-r border-zinc-200/80 bg-white/80 backdrop-blur-sm flex flex-col h-full"
    >
      {/* Brand header */}
      <div className="px-5 py-5 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-zinc-950 rounded-md flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-display font-black tracking-tighter text-[15px] leading-none text-zinc-950 block">
              CRE&nbsp;Intelligence
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 block mt-0.5">
              Agentic Platform
            </span>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-1.5 mb-3">
          <Zap className="w-3 h-3 text-zinc-500" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
            Capabilities
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["GeoSearch", "PLUTO", "ACRIS", "Zoning RAG", "Claude AI"].map(
            (cap) => (
              <span
                key={cap}
                className="inline-flex items-center font-mono text-[9px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-1 rounded-sm"
              >
                {cap}
              </span>
            )
          )}
        </div>
      </div>

      {/* Sample addresses */}
      <div className="px-5 py-4 border-b border-zinc-100">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-3">
          Sample Sites
        </p>
        <div className="flex flex-col gap-0.5">
          {TEST_ADDRESSES.map((addr, i) => (
            <button
              key={addr}
              data-testid={`sample-address-${i}`}
              disabled={loading}
              onClick={() => onSample(addr)}
              className="text-left text-[12px] leading-snug text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 px-2.5 py-2 rounded-md transition-all flex items-start gap-2 disabled:opacity-40 group"
            >
              <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
              <span>{addr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-100">
        <a
          href="https://github.com/neerajbhargav/REALESTATE_AGENTIC"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>View Source</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-300 mt-2 leading-relaxed">
          Built by Neeraj Bhargav
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
