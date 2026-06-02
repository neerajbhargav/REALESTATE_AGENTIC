import React from "react";
import { Sparkles } from "lucide-react";

const ExecutiveSummary = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-sm p-6 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Executive Summary
        </h2>
      </div>
      <p className="text-[15px] leading-relaxed text-zinc-200 font-sans">
        {summary}
      </p>
      <div className="mt-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
          AI-Synthesized from public records
        </span>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
