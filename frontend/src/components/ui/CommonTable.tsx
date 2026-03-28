import type { ReactNode } from 'react'

type Column<T> = {
  key: keyof T
  header: string
  render?: (row: T) => ReactNode
}

export function CommonTable<T extends Record<string, any>>({
  columns,
  rows,
}: {
  columns: Column<T>[]
  rows: T[]
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="px-4 py-3 text-left font-medium text-gray-600">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="border-t border-gray-200">
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-4 py-3 text-gray-900">
                      {column.render ? column.render(row) : String(row[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
