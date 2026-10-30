import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function TicketCard({ ticket, delay = 0 }) {
  const withinColor = ticket.within_warranty === 'YES' ? 'text-green-400' : 'text-red-400'
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ x: 4 }}
    >
      <Link
        to={`/tickets/${ticket.id}`}
        className="block glass p-4 hover:border-cyan-glow/60 transition-all"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-cyan-glow text-sm">{ticket.ticket_code}</span>
              <span className={`badge badge-${ticket.status}`}>
                {ticket.status === 'RECEIVED' && '● '}
                {ticket.status}
              </span>
              {ticket.ai_classification && (
                <span className="text-xs px-2 py-0.5 rounded bg-electric-purple/20 text-electric-purple border border-electric-purple/40">
                  AI: {ticket.ai_classification}
                </span>
              )}
            </div>
            <div className="text-sm text-[color:var(--text-muted)] line-clamp-1">{ticket.issue_description}</div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className={withinColor}>● {ticket.within_warranty === 'YES' ? 'Còn BH' : 'Hết BH'}</span>
              <span className="text-[color:var(--text-muted)]">•</span>
              <span className="text-[color:var(--text-light)]">{new Date(ticket.created_at).toLocaleString('vi-VN')}</span>
            </div>
          </div>
          <div className="text-cyan-glow/50 text-2xl">›</div>
        </div>
      </Link>
    </motion.div>
  )
}