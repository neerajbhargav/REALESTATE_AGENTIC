import React from "react";
import { AlertTriangle } from "lucide-react";

export const FlagsCard = ({ flags }) => {
  if (!flags || flags.length === 0) return null;
  return (
    <div className="bg-white border-l-2 border-[#FF3B30] border border-zinc-200 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-[#FF3B30]" />
        <h2 className="font-mono text-xs uppercase tracking-widest text-[#FF3B30]">
          Due Diligence Flags
        </h2>
      </div>
      <ul data-testid="flags-list" className="space-y-3">
        {flags.map((flag, i) => (
          <li key={flag} className="flex gap-3 text-sm text-zinc-700">
            <span className="font-mono text-[#FF3B30] shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="leading-relaxed">{flag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FlagsCard;
