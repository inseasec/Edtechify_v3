import React from "react";

/** Marketing comparison table — scrolls horizontally on narrow viewports */
export default function TwoColTable({ leftHeader, rightHeader, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80">
      <table className="w-full min-w-[min(100%,520px)] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90">
            <th scope="col" className="w-[34%] min-w-[10rem] px-4 py-3 font-semibold tracking-tight text-slate-900 sm:px-5">
              {leftHeader}
            </th>
            <th scope="col" className="px-4 py-3 font-semibold tracking-tight text-slate-900 sm:px-5">
              {rightHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-b-0">
              <td className="align-top px-4 py-3.5 font-semibold text-slate-800 sm:px-5">
                {row.left}
              </td>
              <td className="align-top px-4 py-3.5 leading-relaxed text-slate-600 sm:px-5">
                {row.right}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
