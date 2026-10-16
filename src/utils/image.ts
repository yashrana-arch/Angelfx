/**
 * Shrinks an image in the browser before upload: scales it so the longest side is at most
 * `maxSide` px and re-encodes it as WebP (or JPEG where the browser can't encode WebP).
 *
 * Returns the original file when compressing wouldn't help (already small, an animated GIF,
 * or the result came out bigger), or when the browser can't decode it.
 */
export async function compressImage(file: File, { maxSide = 2000, quality = 0.8, skipBelow = 150 * 1024 } = {}): Promise<File> {
  // GIFs may be animated, and drawing to a canvas would keep only the first frame.
  if (file.type === 'image/gif' || file.size <= skipBelow) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file) // applies EXIF rotation in modern browsers
  } catch {
    return file
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  // White behind transparent areas, since JPEG has no alpha.
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // Browsers that can't encode WebP silently return PNG, so check the type and fall back to JPEG.
  let blob = await toBlob(canvas, 'image/webp', quality)
  if (blob?.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality)
  if (!blob || blob.size >= file.size) return file

  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const name = file.name.replace(/\.[^.]+$/, '') || 'screenshot'
  return new File([blob], `${name}.${ext}`, { type: blob.type, lastModified: Date.now() })
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

/** 1536 -> "1.5 KB", 2_400_000 -> "2.3 MB" */
export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`
