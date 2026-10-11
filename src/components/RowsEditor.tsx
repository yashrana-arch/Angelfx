import { Plus, Trash2 } from 'lucide-react'

export interface Column<T> {
  key: keyof T & string
  label: string
  type?: 'text' | 'number' | 'date' | 'select'
  options?: readonly string[]
  placeholder?: string
  /** Minimum column width in px. */
  width?: number
}

interface Props<T extends { id: string }> {
  columns: Column<T>[]
  rows: T[]
  onChange: (rows: T[]) => void
  newRow: () => T
  addLabel?: string
  emptyText?: string
}

/** Spreadsheet-like editor for a list of records (admin side). */
export default function RowsEditor<T extends { id: string }>({
  columns,
  rows,
  onChange,
  newRow,
  addLabel = 'Add row',
  emptyText = 'No rows yet.',
}: Props<T>) {
  const update = (id: string, key: keyof T, raw: string, type: Column<T>['type']) => {
    const value = type === 'number' ? (raw === '' ? 0 : Number(raw)) : raw
    onChange(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  }

  return (
    <div className="rows-editor">
      <div className="table-scroll">
        <table className="table table-edit">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ minWidth: c.width }}>
                  {c.label}
                </th>
              ))}
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="muted center">
                  {emptyText}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => {
                  const value = row[c.key] as string | number
                  return (
                    <td key={c.key}>
                      {c.type === 'select' ? (
                        <select className="input input-sm" value={value} onChange={(e) => update(row.id, c.key, e.target.value, c.type)}>
                          {c.options?.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="input input-sm"
                          type={c.type ?? 'text'}
                          step={c.type === 'number' ? 'any' : undefined}
                          placeholder={c.placeholder}
                          value={value}
                          onChange={(e) => update(row.id, c.key, e.target.value, c.type)}
                        />
                      )}
                    </td>
                  )
                })}
                <td className="cell-actions">
                  <button
                    type="button"
                    className="icon-btn danger"
                    aria-label="Remove row"
                    onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...rows, newRow()])}>
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  )
}
