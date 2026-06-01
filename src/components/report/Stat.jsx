import React from "react";
import CitationChip from "../CitationChip";

/** A single labelled metric with an optional citation chip. */
export const Stat = ({ label, value, citation, citationHref, sub, testId }) => (
  <div className="py-3">
    <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
      {label}
    </div>
    <div className="flex items-baseline gap-2 flex-wrap">
      <span data-testid={testId} className="font-mono font-medium text-zinc-950 text-lg">
        {value}
      </span>
      {citation && <CitationChip label={citation} href={citationHref} />}
    </div>
    {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
  </div>
);

export default Stat;
