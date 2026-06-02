import React from "react";
import { DollarSign } from "lucide-react";
import CitationChip from "../CitationChip";
import { fmtMoney, fmtMoneyShort } from "../../lib/format";

export const LandValueCard = ({ value, narrative }) => {
  const hasTotal = value?.total_estimated_value != null;
  const hasPerBsf = value?.estimated_value_per_bsf != null;
  const hasRange = value?.low != null;
  const narText = typeof narrative === "string" ? narrative : (narrative?.methodology || value?.methodology || "");

  return (
    <div className="bg-white border border-zinc-200 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4" />
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-700">
          Land Value Estimate
        </h2>
      </div>

      {hasTotal ? (
        <>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              data-testid="value-total"
              className="font-display font-black tracking-tighter text-4xl lg:text-5xl text-emerald-700"
            >
              {fmtMoneyShort(value.total_estimated_value)}
            </span>
            <span className="font-mono text-sm text-zinc-500">estimated total</span>
          </div>
          {hasPerBsf && (
            <div className="mt-2 font-mono text-sm text-zinc-600">
              at{" "}
              <span className="text-zinc-950 font-medium">
                {fmtMoney(value.estimated_value_per_bsf)}/BSF
              </span>{" "}
              <CitationChip label="Agent computed" />
            </div>
          )}
        </>
      ) : hasRange ? (
        <>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              data-testid="value-range"
              className="font-display font-black tracking-tighter text-4xl lg:text-5xl text-zinc-950"
            >
              {fmtMoneyShort(value.low)} — {fmtMoneyShort(value.high)}
            </span>
          </div>
          <div className="mt-3 flex gap-6 flex-wrap font-mono text-sm">
            <span className="text-zinc-600">
              $/BSF range:{" "}
              <span className="text-zinc-950 font-medium">
                {fmtMoney(value.per_bsf_low)} – {fmtMoney(value.per_bsf_high)}
              </span>{" "}
              <CitationChip label={`${value.usable_comps || 0} comps`} />
            </span>
          </div>
        </>
      ) : hasPerBsf ? (
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="font-display font-bold text-3xl text-zinc-950">
            {fmtMoney(value.estimated_value_per_bsf)}/BSF
          </span>
        </div>
      ) : (
        <div className="py-2">
          <span className="font-display font-bold text-2xl text-zinc-400">
            Estimate pending
          </span>
        </div>
      )}

      {(value?.narrative || narText) && (
        <p className="mt-4 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
          {value?.narrative || narText}
        </p>
      )}
    </div>
  );
};

export default LandValueCard;
