import React from "react";
import { TrendingUp } from "lucide-react";
import CitationChip from "../CitationChip";
import Stat from "./Stat";
import { fmtNum, fmtFar } from "../../lib/format";

export const DevelopmentCard = ({ bsf, methodology }) => (
  <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-sm p-6">
    <div className="flex items-center gap-2 mb-4">
      <TrendingUp className="w-4 h-4" />
      <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-700">
        Development Potential — As-of-Right
      </h2>
    </div>
    <div className="flex items-end gap-3 flex-wrap">
      <span
        data-testid="bsf-value"
        className="font-display font-black tracking-tighter text-6xl lg:text-7xl leading-none text-zinc-950"
      >
        {fmtNum(bsf.residential_bsf)}
      </span>
      <span className="font-mono text-sm text-zinc-500 mb-2">SF buildable</span>
    </div>
    <div className="mt-2">
      <CitationChip
        label={`PLUTO residfar ${fmtFar(bsf.residential_far)} × lot ${fmtNum(bsf.lot_area_sf)} SF`}
      />
    </div>

    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-4 border-t border-zinc-100">
      <Stat label="Residential FAR" value={fmtFar(bsf.residential_far)} citation="PLUTO residfar" testId="stat-resfar" />
      <Stat label="Built FAR" value={fmtFar(bsf.currently_built_far)} citation="PLUTO builtfar" />
      <Stat label="Utilization" value={`${fmtNum(bsf.utilization_pct)}%`} citation="computed" />
      <Stat label="Remaining" value={`${fmtNum(bsf.remaining_development_potential)} SF`} citation="computed" />
    </div>

    <div className="mt-4 flex items-center gap-2 flex-wrap">
      <span
        data-testid="underbuilt-badge"
        className={`font-mono text-[11px] uppercase tracking-widest px-2 py-1 rounded-sm border ${
          bsf.is_underbuilt
            ? "border-[#0055FF] text-[#0055FF]"
            : "border-zinc-300 text-zinc-500"
        }`}
      >
        {bsf.is_underbuilt ? "● Underbuilt — upside" : "Built to ~capacity"}
      </span>
      {bsf.community_facility_bsf > 0 && (
        <span className="font-mono text-[11px] text-zinc-500">
          Community facility BSF: {fmtNum(bsf.community_facility_bsf)}{" "}
          <CitationChip label="PLUTO facilfar" />
        </span>
      )}
    </div>
    {methodology && (
      <p className="mt-4 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
        {methodology}
      </p>
    )}
  </div>
);

export default DevelopmentCard;
