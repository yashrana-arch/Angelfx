import { ChevronLeft, ExternalLink, MessagesSquare, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import SupportChat from '../../components/SupportChat'
import { useAsync } from '../../hooks/useAsync'
import { usePolling } from '../../hooks/usePolling'
import { onSupportChanged } from '../../hooks/useSupportUnread'
import type { SupportConversation } from '../../types'
import { errorMessage, initials } from '../../utils/format'

/** How often the inbox list re-checks for new conversations and messages. */
const INBOX_POLL_MS = 8_000

/** Support inbox: conversations on the left, the selected chat on the right (one at a time on phones). */
export default function Support() {
  const { userId } = useParams()
  const [convos, setConvos] = useState<SupportConversation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const refresh = useCallback(() => {
    api.admin.listSupportConversations().then(
      (list) => {
        setConvos(list)
        setError(null)
      },
      (e: unknown) => setError(errorMessage(e, 'Could not load conversations')),
    )
  }, [])

  useEffect(() => {
    refresh()
    return onSupportChanged(refresh)
  }, [refresh])
  usePolling(refresh, INBOX_POLL_MS)

  // The open client's details (also covers clients who haven't messaged yet).
  const { data: client } = useAsync(() => (userId ? api.admin.getUser(userId) : Promise.resolve(null)), [userId])

  const q = query.trim().toLowerCase()
  const filtered = (convos ?? []).filter((c) => [c.clientName, c.email, c.clientCode ?? ''].some((v) => v.toLowerCase().includes(q)))
  const totalUnread = (convos ?? []).reduce((n, c) => n + c.unread, 0)

  return (
    <div className="page">
      <PageHeader
        title="Support"
        subtitle={totalUnread > 0 ? `${totalUnread} unread message${totalUnread === 1 ? '' : 's'}` : 'Messages from clients appear here automatically'}
      />

      <div className={`support-layout ${userId ? 'has-chat' : ''}`}>
        <aside className="support-list">
          <div className="support-list-search">
            <label className="search-box">
              <Search size={16} />
              <input placeholder="Search clients…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
          </div>
          <div className="support-list-items">
            {error && !convos ? (
              <div className="panel-pad">
                <ErrorBox message={error} onRetry={refresh} />
              </div>
            ) : !convos ? (
              <div className="panel-pad">
                <Loading rows={3} />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={<MessagesSquare size={26} />} title={q ? 'No matches' : 'No conversations yet'} text={q ? undefined : 'When a client sends a message, it shows up here.'} />
            ) : (
              filtered.map((c) => (
                <NavLink key={c.userId} to={`/admin/support/${c.userId}`} className={`support-convo ${c.unread ? 'unread' : ''}`}>
                  <span className="avatar avatar-sm">{initials(c.clientName)}</span>
                  <span className="support-convo-main">
                    <span className="support-convo-top">
                      <strong>{c.clientName}</strong>
                      <span className="support-convo-time">{shortTime(c.lastAt)}</span>
                    </span>
                    <span className="support-convo-bottom">
                      <span className="support-convo-preview">
                        {c.lastFromAdmin && <span className="muted">You: </span>}
                        {c.lastMessage}
                      </span>
                      {c.unread > 0 && <span className="notif-pill">{c.unread}</span>}
                    </span>
                  </span>
                </NavLink>
              ))
            )}
          </div>
        </aside>

        <section className="support-pane">
          {userId ? (
            <SupportChat
              key={userId}
              viewer="admin"
              load={(afterId) => api.admin.getSupportThread(userId, afterId)}
              send={(body) => api.admin.sendSupportMessage(userId, body)}
              markRead={() => api.admin.markSupportRead(userId)}
              otherName={client?.name ?? 'Client'}
              header={
                <div className="chat-peer">
                  <Link to="/admin/support" className="icon-btn support-back" aria-label="All conversations">
                    <ChevronLeft size={20} />
                  </Link>
                  <span className="avatar avatar-sm">{initials(client?.name ?? '')}</span>
                  <div>
                    <strong>{client?.name ?? '…'}</strong>
                    <span className="muted small">
                      {client?.clientCode && <span className="mono">{client.clientCode} · </span>}
                      {client?.email}
                    </span>
                  </div>
                  <Link to={`/admin/users/${userId}`} className="btn btn-ghost btn-sm chat-peer-action">
                    <ExternalLink size={14} /> Client
                  </Link>
                </div>
              }
              emptyTitle="No messages yet"
              emptyText="Start the conversation. The client will see your message in their Support chat."
            />
          ) : (
            <div className="support-placeholder">
              <EmptyState icon={<MessagesSquare size={28} />} title="Select a conversation" text="Pick a client on the left to read and reply to their messages." />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

/** Time today, "Yesterday", or a short date. */
function shortTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const y = new Date()
  y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
