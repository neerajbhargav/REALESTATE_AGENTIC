import React from "react";
import { Building2, MapPin, Zap, Code2, ExternalLink, Trash2, Scale, X } from "lucide-react";

const TEST_ADDRESSES = [
  "21-48 44th Drive, Long Island City, NY",
  "23-29 Astoria Boulevard, Astoria, NY",
  "365 Rutland Road, Brooklyn, NY",
  "75-43 113th Street, Forest Hills, NY",
  "4408 60th Street, Woodside, NY",
];

export const Sidebar = ({
  reports = [],
  onSelect,
  onSample,
  activeId,
  loading,
  onDelete,
  selectedCompareIds = [],
  onToggleCompare,
  onCompareClick,
  compareMode,
  isMobile,
  onCloseMobile,
}) => {
  return (
    <aside
      data-testid="sidebar"
      className="w-full lg:w-[280px] shrink-0 border-r border-zinc-200 bg-white flex flex-col h-full overflow-hidden"
    >
      {/* Brand header */}
      <div className="px-5 py-5 border-b border-zinc-100 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-zinc-950 rounded-md flex items-center justify-center shadow-sm">
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
        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-800 rounded-md hover:bg-zinc-50 transition-colors"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Capabilities */}
      <div className="px-5 py-4 border-b border-zinc-100 shrink-0">
        <div className="flex items-center gap-1.5 mb-2.5">
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
                className="inline-flex items-center font-mono text-[9px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-sm"
              >
                {cap}
              </span>
            )
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {/* Sample addresses */}
        <div className="px-5 py-4 border-b border-zinc-100 shrink-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-2.5">
            Sample Sites
          </p>
          <div className="flex flex-col gap-0.5">
            {TEST_ADDRESSES.map((addr, i) => (
              <button
                key={addr}
                data-testid={`sample-address-${i}`}
                disabled={loading}
                onClick={() => onSample(addr)}
                className="text-left text-[12px] leading-snug text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 px-2 py-1.5 rounded-md transition-all flex items-start gap-2 disabled:opacity-40 group"
              >
                <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                <span className="truncate">{addr}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Persisted History */}
        <div className="px-5 py-4 flex-1 flex flex-col min-h-[150px]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-2.5">
            Assessment History
          </p>
          {reports.length === 0 ? (
            <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-200 rounded-lg p-4 text-center">
              <p className="text-[11px] font-mono text-zinc-400">
                No analyses yet.<br />Run a site lookup above.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[300px] pr-1">
              {reports.map((r) => {
                const isSelected = selectedCompareIds.includes(r.id);
                const isActive = activeId === r.id && !compareMode;
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md group transition-all border ${
                      isActive
                        ? "bg-zinc-50 border-zinc-200"
                        : "border-transparent hover:bg-zinc-50"
                    }`}
                  >
                    {/* Checkbox for comparison */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleCompare(r.id)}
                      title="Select for comparison"
                      className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-500 cursor-pointer shrink-0"
                    />

                    {/* Address title (Click to select) */}
                    <button
                      onClick={() => onSelect(r.id)}
                      className="flex-1 text-left text-[12px] font-medium text-zinc-700 hover:text-zinc-950 transition-colors truncate"
                      title={r.address}
                    >
                      <span className="block truncate">{r.address}</span>
                      <span className="block font-mono text-[9px] text-zinc-400 mt-0.5">
                        {r.borough} · BBL {r.assessment?.bbl || r.bbl || "—"}
                      </span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDelete(r.id)}
                      className="text-zinc-300 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      title="Delete from history"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Compare Action Button */}
      {selectedCompareIds.length >= 2 && (
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-100 shrink-0">
          <button
            onClick={onCompareClick}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-mono uppercase tracking-wider text-white font-semibold transition-all ${
              compareMode
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-zinc-950 hover:bg-zinc-800"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            {compareMode ? "Viewing Comparison" : `Compare Sites (${selectedCompareIds.length})`}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-100 shrink-0 bg-white">
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
