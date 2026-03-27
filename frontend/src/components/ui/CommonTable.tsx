import React from 'react'

type Column<T> = {
  key: keyof T
  header: string
  render?: (row: T) => React.ReactNode
}

export function CommonTable<T extends Record<string, any>>({
  columns,
  rows,
}: {
  columns: Column<T>[]
  rows: T[]
}) {
  return (
    <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-200">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-zinc-500">
                No data found
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} className="border-t border-zinc-200/50 dark:border-zinc-800/50">
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-4 py-3 text-zinc-800 dark:text-zinc-100">
                    {c.render ? c.render(row) : String(row[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

