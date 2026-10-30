import Layout from '../components/Layout'
import ChatPanel from '../components/ChatPanel'

/**
 * Trang "Trợ lý ảo" — bản đầy đủ (không compact).
 *
 * TRƯỚC ĐÂY trang này có bản implement riêng (~350 dòng) trùng logic với
 * `components/ChatPanel.jsx`. Nay dùng chung ChatPanel để:
 *   - chỉ có 1 nguồn logic chat (session, action handlers, serial modal)
 *   - các tính năng mới thêm vào ChatPanel cũng có trên trang này
 */
export default function CustomerChat() {
  return (
    <Layout pageId="chat">
      <div className="flex flex-col h-full min-h-0">
        <ChatPanel />
      </div>
    </Layout>
  )
}
