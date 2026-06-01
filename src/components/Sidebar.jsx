import React from "react";
import { Building2, Clock, History, MapPin } from "lucide-react";

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
      className="w-full lg:w-72 shrink-0 border-r border-zinc-200 bg-white flex flex-col h-full"
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" strokeWidth={2.5} />
          <span className="font-display font-black tracking-tighter text-lg leading-none">
            CRE&nbsp;Intelligence
          </span>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          NYC Development Site Analyzer
        </p>
      </div>

      {/* Sample addresses */}
      <div className="px-5 py-4 border-b border-zinc-200">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
          Sample Sites
        </p>
        <div className="flex flex-col gap-1">
          {TEST_ADDRESSES.map((addr, i) => (
            <button
              key={addr}
              data-testid={`sample-address-${i}`}
              disabled={loading}
              onClick={() => onSample(addr)}
              className="text-left text-[13px] leading-tight text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 px-2 py-1.5 rounded-sm transition-colors flex items-start gap-1.5 disabled:opacity-40"
            >
              <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-zinc-400" />
              <span>{addr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="px-5 py-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-2">
          <History className="w-3.5 h-3.5 text-zinc-500" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Past Lookups
          </p>
        </div>
        {reports.length === 0 ? (
          <p className="text-xs text-zinc-400 mt-2">No reports yet.</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {reports.map((r) => (
              <button
                key={r.id}
                data-testid={`history-item-${r.id}`}
                onClick={() => onSelect(r.id)}
                className={`text-left px-2 py-2 rounded-sm transition-colors border-l-2 ${
                  activeId === r.id
                    ? "border-zinc-900 bg-zinc-100"
                    : "border-transparent hover:bg-zinc-50"
                }`}
              >
                <p className="text-[13px] leading-tight text-zinc-800 truncate">
                  {r.address}
                </p>
                <p className="font-mono text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                  <span>BBL {r.bbl}</span>
                  <Clock className="w-2.5 h-2.5" />
                  {(r.processing_time_ms / 1000).toFixed(1)}s
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-zinc-200">
        <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 leading-relaxed">
          PLUTO · ACRIS · GeoSearch · Claude
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
