import React from "react";
import { Landmark } from "lucide-react";
import CitationChip from "../CitationChip";
import { fmtMoney, fmtMoneyShort } from "../../lib/format";

const confBorderClass = (confidence) => {
  if (confidence === "high") return "text-zinc-900 border-zinc-900";
  if (confidence === "medium") return "text-zinc-700 border-zinc-400";
  return "text-zinc-500 border-zinc-300";
};

export const LandValueCard = ({ value, narrative }) => {
  const confidence = value.confidence || narrative.confidence || "low";

  return (
    <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Landmark className="w-4 h-4" />
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-700">
          Preliminary Land Value
        </h2>
        <span
          className={`ml-auto font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${confBorderClass(
            confidence
          )}`}
        >
          {confidence} confidence
        </span>
      </div>

      {value.low ? (
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
      ) : (
        <div className="py-2">
          <span className="font-display font-bold text-2xl text-zinc-400">
            Estimate withheld
          </span>
        </div>
      )}
      <p className="mt-4 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
        {narrative.methodology || value.methodology}
      </p>
      {(narrative.caveats || value.caveats) && (
        <p className="mt-2 text-xs text-zinc-500 italic">
          {narrative.caveats || value.caveats}
        </p>
      )}
    </div>
  );
};

export default LandValueCard;
