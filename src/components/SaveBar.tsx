import { Save } from 'lucide-react'
import type { SaveStatus } from '../hooks/useSaver'

/** Sticky footer with a submit button and the last save result. */
export default function SaveBar({ saving, status, label = 'Save changes' }: { saving: boolean; status: SaveStatus | null; label?: string }) {
  return (
    <div className="save-bar">
      {status && <span className={status.ok ? 'up' : 'down'}>{status.text}</span>}
      <button className="btn btn-primary" disabled={saving}>
        <Save size={18} /> {saving ? 'Saving…' : label}
      </button>
    </div>
  )
}
