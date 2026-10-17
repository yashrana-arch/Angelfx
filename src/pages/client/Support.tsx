import { Headset } from 'lucide-react'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import SupportChat from '../../components/SupportChat'

const SUGGESTIONS = ['I have a question about my deposit', 'My withdrawal is pending', 'Help with KYC verification']

export default function Support() {
  return (
    <div className="page page-support">
      <PageHeader title="Help & support" subtitle="Chat with our team. We usually reply within a few hours." back="/client/profile" />
      <SupportChat
        viewer="client"
        load={(afterId) => api.client.getSupportThread(afterId)}
        send={(body) => api.client.sendSupportMessage(body)}
        markRead={() => api.client.markSupportRead()}
        otherName="Support team"
        header={
          <div className="chat-peer">
            <span className="chat-peer-avatar">
              <Headset size={18} />
            </span>
            <div>
              <strong>Veltrex Support</strong>
              <span className="muted small">
                <span className="live-dot" /> Messages update automatically
              </span>
            </div>
          </div>
        }
        emptyTitle="How can we help?"
        emptyText="Send us a message and our support team will get back to you here."
        suggestions={SUGGESTIONS}
      />
    </div>
  )
}
