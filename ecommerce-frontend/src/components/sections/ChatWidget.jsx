import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopChat } from '../../api/shop';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../utils/cn';
import { Close } from '../icons';

/**
 * Chat widget AI cho storefront (khách chưa đăng nhập).
 * - Gọi `/api/ai/shop-chat` (Gemini nếu có key, rule-based fallback).
 * - Action trả về: add_to_cart / view_product / navigate → xử lý tại chỗ.
 */

const SESSION_KEY = 'shop:chat:session:v1';

const QUICK_PROMPTS = [
  'Tivi 4K dưới 15 triệu',
  'Sản phẩm đang giảm giá',
  'Máy lọc nước tốt',
  'Tra cứu bảo hành',
];

function getSessionId() {
  try {
    const saved = window.localStorage.getItem(SESSION_KEY);
    if (saved) return saved;
    const id = `shop-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    window.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `shop-${Date.now()}`;
  }
}

/** Render `**bold**` thành <strong> — không cần thư viện ngoài. */
function renderBold(text) {
  const parts = String(text ?? '').split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold text-ink-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const sessionIdRef = useRef(getSessionId());
  const scrollRef = useRef(null);
  const { addItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open || messages.length > 0) return;
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        text:
          'Chào bạn! 👋 Mình là **Trợ lý ảo** của Điện Tử Việt Nam.\n\n' +
          'Mình có thể giúp bạn:\n' +
          '- 🛒 Gợi ý sản phẩm theo ngân sách\n' +
          '- 🔥 Tìm sản phẩm đang giảm giá\n' +
          '- 🔍 Tra cứu bảo hành theo mã serial\n' +
          '- 📋 Giải đáp chính sách đổi trả, trả góp',
      },
    ]);
  }, [open, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = useCallback(
    async (raw) => {
      const text = String(raw ?? '').trim();
      if (!text || sending) return;

      setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text }]);
      setInput('');
      setSending(true);

      try {
        const history = messages
          .filter((m) => m.role === 'user' || m.role === 'bot')
          .slice(-8)
          .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

        const res = await shopChat({ message: text, sessionId: sessionIdRef.current, history });

        setMessages((m) => [
          ...m,
          {
            id: `b-${Date.now()}`,
            role: 'bot',
            text: res.reply,
            intent: res.intent,
            source: res.source,
            confidence: res.confidence,
            products: res.data?.products ?? [],
            actions: res.actions ?? [],
            suggestions: res.suggestions ?? [],
          },
        ]);
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            id: `e-${Date.now()}`,
            role: 'bot',
            text: '⚠️ Rất tiếc, mình chưa xử lý được yêu cầu này. Bạn thử lại hoặc gọi hotline 1900 6868 nhé.',
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [messages, sending],
  );

  const runAction = useCallback(
    (action) => {
      const payload = action?.payload ?? {};
      switch (action?.type) {
        case 'add_to_cart': {
          addItem({
            id: payload.product_id ?? payload.slug,
            slug: payload.slug,
            name: payload.name,
            price: payload.price ?? 0,
            image: payload.image ?? '',
          });
          toast.show(`Đã thêm "${payload.name ?? 'sản phẩm'}" vào giỏ hàng`, { tone: 'success' });
          break;
        }
        case 'view_product': {
          if (payload.slug) navigate(`/product/${payload.slug}`);
          break;
        }
        case 'navigate': {
          if (payload.href) navigate(payload.href);
          break;
        }
        default:
          toast.show('Tính năng này đang được cập nhật', { tone: 'info' });
      }
    },
    [addItem, toast, navigate],
  );

  return (
    <>
      {/* Nút nổi */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Đóng trợ lý ảo' : 'Mở trợ lý ảo'}
        className={cn(
          'fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105',
          open ? 'bg-ink-900 text-white' : 'bg-brand-600 text-white',
        )}
      >
        {open ? (
          <Close className="h-6 w-6" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
            <path d="M9 10h.01M12 10h.01M15 10h.01" />
          </svg>
        )}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-[65] bg-ink-900/40 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Trợ lý ảo"
            className="fixed bottom-0 right-0 z-[68] flex h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line-200 bg-white shadow-2xl md:bottom-24 md:right-5 md:h-[620px] md:w-[400px] md:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-brand-600 px-4 py-3.5 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Trợ lý ảo Điện Tử Việt Nam</p>
                <p className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Trực tuyến — phản hồi tức thì
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng trợ lý ảo"
                className="ml-auto rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <Close className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-surface-page px-4 py-4">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div
                    className={cn(
                      'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'ml-auto rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md border border-line-200 bg-white text-ink-700',
                    )}
                  >
                    {renderBold(msg.text)}
                  </div>

                  {msg.source ? (
                    <p className="text-[11px] text-ink-400">
                      {msg.source === 'gemini' ? '🤖 Gemini' : '📋 Rule-based'} ·{' '}
                      {Math.round((msg.confidence ?? 0) * 100)}%
                    </p>
                  ) : null}

                  {/* Sản phẩm gợi ý */}
                  {msg.products?.length ? (
                    <ul className="space-y-1.5">
                      {msg.products.slice(0, 4).map((p) => (
                        <li
                          key={p.id ?? p.slug}
                          className="flex items-center justify-between gap-3 rounded-xl border border-line-200 bg-white px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-ink-900">{p.name}</p>
                            <p className="text-xs font-semibold text-brand-600">
                              {Number(p.price ?? 0).toLocaleString('vi-VN')} ₫
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => runAction({ type: 'add_to_cart', payload: p })}
                            className="shrink-0 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                          >
                            Thêm
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {/* Action buttons */}
                  {msg.actions?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {msg.actions.map((action, i) => (
                        <button
                          key={`${msg.id}-a-${i}`}
                          type="button"
                          onClick={() => runAction(action)}
                          className="rounded-lg border border-line-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                        >
                          {action.label ?? action.type}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {/* Gợi ý theo ngữ cảnh */}
                  {msg.suggestions?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestions.slice(0, 4).map((s) => (
                        <button
                          key={`${msg.id}-s-${s}`}
                          type="button"
                          onClick={() => sendMessage(s)}
                          className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs text-brand-700 transition-colors hover:bg-brand-100"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {sending ? (
                <div className="flex gap-1.5 px-1 pt-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {/* Quick prompts */}
            <div className="flex gap-1.5 overflow-x-auto border-t border-line-200 px-3 py-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  disabled={sending}
                  className="shrink-0 rounded-full border border-line-200 px-3 py-1.5 text-xs text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <form
              className="flex gap-2 border-t border-line-200 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                aria-label="Nhập câu hỏi"
                className="min-w-0 flex-1 rounded-xl border border-line-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>

            {/* Link sang hệ thống bảo hành */}
            <p className="border-t border-line-200 px-3 py-2 text-center text-[11px] text-ink-400">
              Cần tra cứu phiếu bảo hành?{' '}
              <a
                href="http://localhost:5174"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-600 hover:underline"
              >
                Mở hệ thống BảoHành Pro
              </a>
            </p>
          </div>
        </>
      ) : null}
    </>
  );
}

export default ChatWidget;
