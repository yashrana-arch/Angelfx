import { useState, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: number | null
  /** Receives null when the field is cleared. */
  onChange: (value: number | null) => void
}

const toText = (v: number | null) => (v == null ? '' : String(v))

/**
 * Number field that keeps the raw text while typing, so a default 0 can be
 * cleared or typed over (no "05") and the existing value is selected on focus.
 */
export default function NumberInput({ value, onChange, onFocus, ...rest }: Props) {
  const [text, setText] = useState(() => toText(value))
  const [synced, setSynced] = useState(value)

  // Sync when the value changes from outside (e.g. auto-calculated P&L), unless the text already means that value.
  if (value !== synced) {
    setSynced(value)
    const same = text === '' ? value == null || value === 0 : Number(text) === value
    if (!same) setText(toText(value))
  }

  return (
    <input
      {...rest}
      type="number"
      value={text}
      onFocus={(e) => {
        e.currentTarget.select()
        onFocus?.(e)
      }}
      onChange={(e) => {
        setText(e.target.value)
        onChange(e.target.value === '' ? null : Number(e.target.value))
      }}
    />
  )
}
