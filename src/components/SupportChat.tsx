import { Check, CheckCheck, MessagesSquare, SendHorizontal } from 'lucide-react'
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { usePolling } from '../hooks/usePolling'
import { notifySupportChanged } from '../hooks/useSupportUnread'
import type { SupportMessage, SupportThread } from '../types'
import { errorMessage } from '../utils/format'
import { ErrorBox, Loading } from './Status'

/** How often an open chat checks for new messages. */
const CHAT_POLL_MS = 4_000
const MAX_LENGTH = 2000

interface Props {
  /** Who is looking at the chat: decides which bubbles are "mine". */
  viewer: 'client' | 'admin'
  /** Loads the conversation; with afterId, only messages newer than it. */
  load: (afterId?: number) => Promise<SupportThread>
  send: (body: string) => Promise<SupportMessage>
  /** Marks the other side's messages as read. */
  markRead: () => Promise<void>
  /** Label shown above the other side's messages, e.g. "Support team" or the client's name. */
  otherName: string
  header?: ReactNode
  emptyTitle: string
  emptyText: string
  /** Quick-start messages shown while the conversation is empty. */
  suggestions?: string[]
}

/**
 * A support conversation: message list, composer, polling for new messages, read receipts.
 * Mount it with a `key` per conversation so switching conversations starts fresh.
 */
export default function SupportChat({ viewer, load, send, markRead, otherName, header, emptyTitle, emptyText, suggestions }: Props) {
  const [messages, setMessages] = useState<SupportMessage[] | null>(null)
  const [readUpTo, setReadUpTo] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const stickToBottom = useRef(true) // false while the user has scrolled up to read history
  const lastId = useRef<number | undefined>(undefined)
  const marking = useRef(false)
  // The callbacks are new closures every render; keep the latest without re-running effects.
  const api = useRef({ load, send, markRead })
  useEffect(() => {
    api.current = { load, send, markRead }
  })

  const isMine = (m: SupportMessage) => (viewer === 'admin' ? m.fromAdmin : !m.fromAdmin)

  function merge(incoming: SupportMessage[]) {
    if (incoming.length === 0) return
    lastId.current = Math.max(lastId.current ?? 0, ...incoming.map((m) => m.id))
    setMessages((prev) => {
      const seen = new Set((prev ?? []).map((m) => m.id))
      return [...(prev ?? []), ...incoming.filter((m) => !seen.has(m.id))]
    })
  }

  /** Marks incoming messages read when the user can actually see them. */
  function markIfNeeded(list: SupportMessage[]) {
    const unread = list.some((m) => !isMine(m) && !m.readAt)
    if (!unread || marking.current || document.visibilityState !== 'visible') return
    marking.current = true
    api.current
      .markRead()
      .then(() => {
        const now = new Date().toISOString()
        setMessages((prev) => prev?.map((m) => (!isMine(m) && !m.readAt ? { ...m, readAt: now } : m)) ?? prev)
        notifySupportChanged()
      })
      .catch(() => {})
      .finally(() => {
        marking.current = false
      })
  }

  // First load.
  useEffect(() => {
    api.current.load().then(
      (t) => {
        setMessages([])
        merge(t.messages)
        setReadUpTo(t.readUpTo)
        markIfNeeded(t.messages)
      },
      (e: unknown) => setError(errorMessage(e, 'Could not load messages')),
    )
    // runs once per mount (each conversation gets its own key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll for new messages and read receipts.
  usePolling(
    () => {
      api.current.load(lastId.current).then(
        (t) => {
          merge(t.messages)
          setReadUpTo(t.readUpTo)
          markIfNeeded([...(messages ?? []), ...t.messages])
        },
        () => {}, // keep showing what we have; the next poll retries
      )
    },
    CHAT_POLL_MS,
    messages !== null,
  )

  // Keep the newest message in view unless the user scrolled up.
  useLayoutEffect(() => {
    const el = listRef.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [messages])

  function onScroll() {
    const el = listRef.current
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  async function submit(text = draft) {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setSendError(null)
    try {
      const m = await api.current.send(body)
      stickToBottom.current = true
      merge([m])
      setDraft('')
      notifySupportChanged()
    } catch (e) {
      setSendError(errorMessage(e, 'Message not sent'))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    submit()
  }

  // Enter sends, Shift+Enter adds a new line.
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const lastMine = messages ? [...messages].reverse().find(isMine) : undefined

  return (
    <div className="chat">
      {header && <div className="chat-header">{header}</div>}

      <div className="chat-body" ref={listRef} onScroll={onScroll}>
        {error ? (
          <div className="chat-center">
            <ErrorBox message={error} />
          </div>
        ) : messages === null ? (
          <Loading rows={3} />
        ) : messages.length === 0 ? (
          <div className="chat-center chat-empty">
            <span className="chat-empty-icon">
              <MessagesSquare size={28} />
            </span>
            <strong>{emptyTitle}</strong>
            <span className="muted small">{emptyText}</span>
            {suggestions && (
              <div className="chat-suggestions">
                {suggestions.map((s) => (
                  <button key={s} type="button" className="chip-btn" onClick={() => submit(s)} disabled={sending}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1]
            const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt)
            const mine = isMine(m)
            const groupStart = newDay || !prev || isMine(prev) !== mine
            return (
              <Fragment key={m.id}>
                {newDay && <div className="chat-day">{dayLabel(m.createdAt)}</div>}
                <div className={`chat-row ${mine ? 'mine' : 'theirs'} ${groupStart ? 'group-start' : ''}`}>
                  {groupStart && !mine && <span className="chat-sender">{otherName}</span>}
                  <div className="chat-bubble">
                    <span className="chat-text">{m.body}</span>
                    <span className="chat-meta">
                      {timeLabel(m.createdAt)}
                      {mine &&
                        (readUpTo != null && m.id <= readUpTo ? (
                          <CheckCheck size={14} className="chat-seen" aria-label="Seen" />
                        ) : (
                          <Check size={14} aria-label="Sent" />
                        ))}
                    </span>
                  </div>
                  {m === lastMine && readUpTo != null && m.id <= readUpTo && <span className="chat-receipt">Seen</span>}
                </div>
              </Fragment>
            )
          })
        )}
      </div>

      <form className="chat-composer" onSubmit={onSubmit}>
        {sendError && <div className="alert alert-error chat-send-error">{sendError}</div>}
        <textarea
          ref={inputRef}
          className="input chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message…"
          rows={Math.min(5, Math.max(1, draft.split('\n').length))}
          maxLength={MAX_LENGTH}
          disabled={messages === null || !!error}
          aria-label="Message"
        />
        <button className="btn btn-primary chat-send" disabled={!draft.trim() || sending} aria-label="Send">
          {sending ? <span className="spinner" /> : <SendHorizontal size={18} />}
        </button>
      </form>
    </div>
  )
}

const dayKey = (iso: string) => new Date(iso).toDateString()

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
