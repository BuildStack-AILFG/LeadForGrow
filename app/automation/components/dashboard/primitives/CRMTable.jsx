'use client';

export default function CRMTable({ columns = [], rows = [], emptyMessage = 'No records found' }) {
  if (!rows.length) {
    return (
      <div className="py-10 text-center text-sm text-fg-tertiary dark:text-fg-tertiary border border-dashed border-line dark:border-slate-700 rounded-lg">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line dark:border-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-meta font-semibold text-fg-tertiary dark:text-fg-tertiary py-2.5 px-3 first:pl-0"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
          {rows.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-subtle dark:hover:bg-slate-800/30 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-3 first:pl-0 text-fg-secondary dark:text-fg-disabled">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
