import { ExternalLink, ImageOff, ZoomIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import Modal from './Modal'

/**
 * Thumbnail of a payment screenshot that opens full size on click.
 * Images come from an authenticated endpoint, so they're fetched as a blob (with the token)
 * rather than via a plain <img src>.
 */
export default function ProofImage({ load, alt }: { load: () => Promise<Blob>; alt: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    load().then(
      (blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      },
      () => !cancelled && setFailed(true),
    )
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // load is a new closure every render; the image for a proof never changes, so load once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (failed) {
    return (
      <div className="proof-thumb proof-thumb-empty" title="Couldn’t load image">
        <ImageOff size={20} />
      </div>
    )
  }
  if (!url) return <div className="proof-thumb skeleton" aria-label="Loading image" />

  return (
    <>
      <button type="button" className="proof-thumb" onClick={() => setOpen(true)} aria-label={`View ${alt}`}>
        <img src={url} alt={alt} />
        <span className="proof-thumb-zoom">
          <ZoomIn size={16} />
        </span>
      </button>
      {open && (
        <Modal title="Payment screenshot" onClose={() => setOpen(false)} width={720}>
          <div className="proof-full">
            <img src={url} alt={alt} />
            <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
              <ExternalLink size={16} /> Open in new tab
            </a>
          </div>
        </Modal>
      )}
    </>
  )
}
