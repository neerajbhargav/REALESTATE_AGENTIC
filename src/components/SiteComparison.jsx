import React from "react";
import { ArrowLeft, Landmark, Ruler, TrendingUp, DollarSign, AlertTriangle, Building, MapPin, Scale } from "lucide-react";
import { fmtNum, fmtFar, fmtMoney, fmtMoneyShort } from "../lib/format";

export const SiteComparison = ({ reports = [], selectedIds = [], onClose, onSelectReport }) => {
  const comparedReports = reports.filter((r) => selectedIds.includes(r.id) && r.assessment);

  if (comparedReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-zinc-50/50">
        <Scale className="w-12 h-12 text-zinc-300 mb-4" />
        <h2 className="font-display font-black text-xl text-zinc-950">No properties selected</h2>
        <p className="mt-2 text-sm text-zinc-500 max-w-sm">
          Check at least 2 properties in the sidebar history to compare them side-by-side.
        </p>
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-zinc-950 text-white font-mono uppercase text-xs tracking-wider rounded hover:bg-zinc-800 transition-colors"
        >
          Back to Search
        </button>
      </div>
    );
  }

  // Row definition helper
  const CompareRow = ({ label, icon, renderValue }) => (
    <tr className="border-b border-zinc-150/80 hover:bg-zinc-50/60 transition-colors">
      <td className="px-6 py-4 font-medium text-zinc-800 text-xs uppercase font-mono tracking-wider w-[240px] shrink-0 sticky left-0 bg-white z-10 border-r border-zinc-150">
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
      </td>
      {comparedReports.map((r, i) => (
        <td key={r.id} className={`px-6 py-4 text-sm text-zinc-700 ${i % 2 === 1 ? "bg-zinc-50/30" : "bg-white"}`}>
          {renderValue(r)}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="w-full bg-white flex flex-col h-full overflow-hidden animate-rise">
      {/* Header bar */}
      <div className="border-b border-zinc-200 bg-white px-6 lg:px-12 py-6 shrink-0 flex items-center justify-between">
        <div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to individual report
          </button>
          <h1 className="font-display font-black tracking-tighter text-3xl leading-none text-zinc-950 flex items-center gap-3">
            <Scale className="w-7 h-7 text-zinc-800" />
            Side-by-Side Comparison
          </h1>
        </div>
        <div className="font-mono text-[11px] text-zinc-400 bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Comparing {comparedReports.length} Sites
        </div>
      </div>

      {/* Comparison table container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/60 sticky top-0 z-20 shadow-[0_1px_0_0_rgba(228,228,231,1)]">
              <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold w-[240px] shrink-0 sticky left-0 bg-zinc-50 z-30 border-r border-zinc-200">
                Site Attributes
              </th>
              {comparedReports.map((r, i) => (
                <th
                  key={r.id}
                  className={`px-6 py-4 w-[320px] font-sans ${i % 2 === 1 ? "bg-zinc-50/80" : "bg-zinc-50/30"}`}
                >
                  <button
                    onClick={() => onSelectReport(r.id)}
                    className="text-left font-display font-black tracking-tight text-base text-zinc-950 hover:text-zinc-700 block line-clamp-1 group"
                    title="View single site report"
                  >
                    {r.address}
                    <span className="inline-block opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 text-xs text-zinc-400 font-mono">
                      →
                    </span>
                  </button>
                  <span className="block font-mono text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
                    {r.borough} · BBL {r.assessment.bbl}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* ZONING */}
            <CompareRow
              label="Zoning District"
              icon={<Landmark className="w-3.5 h-3.5 text-zinc-500" />}
              renderValue={(r) => (
                <div>
                  <span className="inline-block font-mono font-bold text-zinc-950 bg-zinc-100 px-2 py-0.5 rounded text-xs">
                    {r.assessment.zoning_summary?.district || "—"}
                  </span>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                    {r.assessment.zoning_summary?.description || "—"}
                  </p>
                </div>
              )}
            />

            {/* LOT CHARACTERISTICS */}
            <CompareRow
              label="Lot Area"
              icon={<Ruler className="w-3.5 h-3.5 text-zinc-500" />}
              renderValue={(r) => {
                const area = r.assessment.lot_characteristics?.lot_area_sf || r.assessment.development_potential?.lot_area_sf;
                return area ? `${fmtNum(area)} SF` : "—";
              }}
            />

            <CompareRow
              label="Existing Built Area"
              icon={<Building className="w-3.5 h-3.5 text-zinc-500" />}
              renderValue={(r) => {
                const area = r.assessment.lot_characteristics?.building_area_sf || r.assessment.development_potential?.currently_built_sf;
                return area ? `${fmtNum(area)} SF` : "—";
              }}
            />

            <CompareRow
              label="Year Built / Owner"
              icon={<MapPin className="w-3.5 h-3.5 text-zinc-500" />}
              renderValue={(r) => (
                <div className="text-xs">
                  <p className="text-zinc-800 font-medium">Built: {r.assessment.lot_characteristics?.year_built || "—"}</p>
                  <p className="text-zinc-500 truncate max-w-[280px]" title={r.assessment.lot_characteristics?.owner}>
                    Owner: {r.assessment.lot_characteristics?.owner || "—"}
                  </p>
                </div>
              )}
            />

            {/* DEVELOPMENT POTENTIAL */}
            <CompareRow
              label="Max Residential FAR"
              icon={<TrendingUp className="w-3.5 h-3.5 text-zinc-500" />}
              renderValue={(r) => fmtFar(r.assessment.development_potential?.residential_far)}
            />

            <CompareRow
              label="Buildable SF"
              icon={<TrendingUp className="w-3.5 h-3.5 text-zinc-500 animate-pulse" />}
              renderValue={(r) => (
                <span className="font-bold text-zinc-950">
                  {fmtNum(r.assessment.development_potential?.residential_bsf)} SF
                </span>
              )}
            />

            <CompareRow
              label="Remaining Development"
              icon={<TrendingUp className="w-3.5 h-3.5 text-zinc-500" />}
              renderValue={(r) => {
                const rem = r.assessment.development_potential?.remaining_development_potential;
                const isUnder = r.assessment.development_potential?.is_underbuilt;
                return (
                  <div>
                    <span className="font-medium text-zinc-800">
                      {rem != null ? `${fmtNum(rem)} SF` : "—"}
                    </span>
                    {isUnder && (
                      <span className="ml-2 inline-block font-mono text-[9px] uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                        Underbuilt
                      </span>
                    )}
                  </div>
                );
              }}
            />

            <CompareRow
              label="FAR Utilization"
              icon={<TrendingUp className="w-3.5 h-3.5 text-zinc-500" />}
              renderValue={(r) => {
                const pct = r.assessment.development_potential?.utilization_pct;
                return pct != null ? (
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-zinc-200 h-1.5 rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full ${pct > 90 ? "bg-zinc-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-zinc-800 font-bold">{Math.round(pct)}%</span>
                  </div>
                ) : (
                  "—"
                );
              }}
            />

            {/* LAND VALUE */}
            <CompareRow
              label="Est. Price / BSF"
              icon={<DollarSign className="w-3.5 h-3.5 text-emerald-600" />}
              renderValue={(r) => {
                const price = r.assessment.land_value_estimate?.estimated_value_per_bsf;
                return price ? (
                  <span className="font-medium text-zinc-800">{fmtMoney(price)}/BSF</span>
                ) : (
                  "—"
                );
              }}
            />

            <CompareRow
              label="Total Est. Value"
              icon={<DollarSign className="w-3.5 h-3.5 text-emerald-600 font-bold animate-pulse" />}
              renderValue={(r) => {
                const total = r.assessment.land_value_estimate?.total_estimated_value;
                return total ? (
                  <span className="font-bold text-emerald-700 text-base">{fmtMoneyShort(total)}</span>
                ) : (
                  "—"
                );
              }}
            />

            <CompareRow
              label="Valuation Rationale"
              icon={<DollarSign className="w-3.5 h-3.5 text-zinc-500" />}
              renderValue={(r) => (
                <p className="text-xs text-zinc-500 leading-relaxed max-w-[280px]">
                  {r.assessment.land_value_estimate?.narrative || "—"}
                </p>
              )}
            />

            {/* COMPS */}
            <CompareRow
              label="Comparable Deeds"
              icon={<Building className="w-3.5 h-3.5 text-zinc-500" />}
              renderValue={(r) => {
                const comps = r.assessment.comparable_sales || [];
                return (
                  <div>
                    <span className="font-bold text-zinc-950">{comps.length} comps</span>
                    <p className="mt-1 text-xs text-zinc-400 font-mono">
                      Average Price:{" "}
                      {comps.length > 0
                        ? fmtMoneyShort(comps.reduce((sum, c) => sum + (c.sale_price || 0), 0) / comps.length)
                        : "—"}
                    </p>
                  </div>
                );
              }}
            />

            {/* RISK FLAGS */}
            <CompareRow
              label="Risk Flags"
              icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
              renderValue={(r) => {
                const flags = r.assessment.flags || [];
                return (
                  <div>
                    <span
                      className={`font-mono text-xs font-bold ${
                        flags.length > 0 ? "text-amber-600 bg-amber-50 border border-amber-200" : "text-zinc-400 border border-zinc-150 bg-zinc-50"
                      } px-2 py-0.5 rounded-sm`}
                    >
                      {flags.length} Flags
                    </span>
                    {flags.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-xs text-zinc-500 space-y-0.5 max-w-[280px]">
                        {flags.slice(0, 3).map((f, i) => (
                          <li key={i} className="truncate" title={f}>
                            {f}
                          </li>
                        ))}
                        {flags.length > 3 && <li>and {flags.length - 3} more...</li>}
                      </ul>
                    )}
                  </div>
                );
              }}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SiteComparison;
