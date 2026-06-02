import React from "react";
import { fmtNum, fmtMoneyShort } from "../../lib/format";

const MetricItem = ({ label, value, accent }) => (
  <div className="flex flex-col items-center justify-center py-4 px-3 text-center">
    <span
      className={`font-display font-black tracking-tighter text-2xl lg:text-3xl leading-none ${
        accent ? "text-emerald-600" : "text-zinc-950"
      }`}
    >
      {value}
    </span>
    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 mt-1.5">
      {label}
    </span>
  </div>
);

const MetricsBar = ({ assessment }) => {
  if (!assessment) return null;

  const dev = assessment.development_potential || {};
  const lot = assessment.lot_characteristics || {};
  const val = assessment.land_value_estimate || {};
  const zoning = assessment.zoning_summary || {};

  const items = [
    { label: "Zoning", value: zoning.district || "—" },
    { label: "Lot Area", value: lot.lot_area_sf ? `${fmtNum(lot.lot_area_sf)} SF` : (dev.lot_area_sf ? `${fmtNum(dev.lot_area_sf)} SF` : "—") },
    { label: "Buildable SF", value: dev.residential_bsf ? fmtNum(dev.residential_bsf) : "—", accent: true },
    { label: "FAR Utilization", value: dev.utilization_pct != null ? `${Math.round(dev.utilization_pct)}%` : "—" },
    { label: "Est. $/BSF", value: val.estimated_value_per_bsf ? fmtMoneyShort(val.estimated_value_per_bsf) : "—" },
    { label: "Est. Total Value", value: val.total_estimated_value ? fmtMoneyShort(val.total_estimated_value) : "—", accent: true },
  ];

  return (
    <div className="bg-white border border-zinc-200 rounded-sm">
      <div className="grid grid-cols-3 lg:grid-cols-6 divide-x divide-zinc-100">
        {items.map((item) => (
          <MetricItem key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
};

export default MetricsBar;
