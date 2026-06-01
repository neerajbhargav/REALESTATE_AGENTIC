import React from "react";
import { Building } from "lucide-react";
import CitationChip from "../CitationChip";
import { fmtMoney } from "../../lib/format";

const CompRow = ({ comp, index }) => (
  <tr
    data-testid={`comp-row-${index}`}
    className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
  >
    <td className="px-6 py-3 text-zinc-800">{comp.address}</td>
    <td className="px-4 py-3 font-mono text-zinc-600">{comp.sale_date}</td>
    <td className="px-4 py-3 font-mono text-right text-zinc-950 font-medium">
      {fmtMoney(comp.sale_price)}
    </td>
    <td className="px-4 py-3 font-mono text-right text-zinc-600">
      {comp.implied_ppbsf ? fmtMoney(comp.implied_ppbsf) : "—"}
    </td>
    <td className="px-4 py-3 text-zinc-500 text-xs">{comp.notes}</td>
    <td className="px-6 py-3">
      <CitationChip
        label={`ACRIS ${String(comp.document_id).slice(0, 10)}`}
        href={comp.acris_url}
        testId={`comp-citation-${index}`}
      />
    </td>
  </tr>
);

export const CompsTable = ({ comps }) => (
  <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
    <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-200">
      <Building className="w-4 h-4" />
      <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-700">
        Comparable Sales — ACRIS Deed Records
      </h2>
      <span className="ml-auto font-mono text-[11px] text-zinc-400">
        {comps.length} arm's-length comps
      </span>
    </div>
    <div className="overflow-x-auto">
      <table data-testid="comps-table" className="w-full text-sm">
        <thead>
          <tr className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 border-b border-zinc-200">
            <th className="text-left font-medium px-6 py-2">Address</th>
            <th className="text-left font-medium px-4 py-2">Sale Date</th>
            <th className="text-right font-medium px-4 py-2">Sale Price</th>
            <th className="text-right font-medium px-4 py-2">Impl. $/BSF</th>
            <th className="text-left font-medium px-4 py-2">Notes</th>
            <th className="text-left font-medium px-6 py-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {comps.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-6 text-zinc-400 text-center">
                No arm's-length comps found on the same or adjacent blocks.
              </td>
            </tr>
          ) : (
            comps.map((c, i) => (
              <CompRow key={c.document_id || `comp-${i}`} comp={c} index={i} />
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default CompsTable;
