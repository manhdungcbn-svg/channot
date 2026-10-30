/**
 * Smoke test bằng Chrome DevTools Protocol (không thêm dependency).
 * Dùng WebSocket native của Node 22+ để kết nối Chrome remote debugging.
 *
 * Chạy:  node smoke.mjs
 * Yêu cầu: Chrome đang chạy với --remote-debugging-port=9222
 */

const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:5174'
const CDP_HOST = process.env.CDP_HOST || '127.0.0.1:9222'
const EMAIL = process.env.SMOKE_EMAIL || 'kh1@gmail.com'
const PASSWORD = process.env.SMOKE_PASSWORD || 'Khach@123'

const ROUTES = [
  '/login', '/', '/tickets', '/products', '/wallet', '/settings',
  '/my-tickets', '/my-products', '/ai', '/chat', '/lookup', '/coming-soon',
  '/khong-ton-tai-404',
]

let ws
let msgId = 0
const pending = new Map()
const consoleErrors = []
const pageErrors = []

function send(method, params = {}) {
  const id = ++msgId
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id)
        reject(new Error(`Timeout: ${method}`))
      }
    }, 30000)
  })
}

async function evalJS(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) {
    throw new Error('Eval error: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  }
  return r.result?.value
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function waitFor(selector, timeout = 12000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await evalJS(`!!document.querySelector(${JSON.stringify(selector)})`)) return true
    await sleep(300)
  }
  return false
}

async function main() {
  const target = await (await fetch(`http://${CDP_HOST}/json/new?about:blank`, { method: 'PUT' })).json()
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(JSON.stringify(msg.error)))
      else resolve(msg.result)
      return
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map(a => a.value ?? a.description ?? a.type).join(' '))
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text)
    }
  }

  await send('Runtime.enable')
  await send('Page.enable')

  // ── Đăng nhập ──────────────────────────────────────────────
  await send('Page.navigate', { url: BASE + '/login' })
  await sleep(2000)
  console.log('LOGIN:', await evalJS(`(async () => {
    const r = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ${JSON.stringify(EMAIL)}, password: ${JSON.stringify(PASSWORD)} }),
    })
    const d = await r.json()
    if (!d.access_token) return 'FAIL:' + JSON.stringify(d).slice(0, 200)
    localStorage.setItem('token', d.access_token)
    localStorage.setItem('user', JSON.stringify(d.user))
    return 'OK:' + d.user.role
  })()`))

  // ── Trang login: nút Google phải bị ẩn khi chưa có Supabase ──
  console.log('GOOGLE BTN:', await evalJS(`(() => {
    const btns = [...document.querySelectorAll('button')].map(b => b.textContent.trim())
    return JSON.stringify({ hasGoogle: btns.some(t => t.includes('Google')), hasDivider: document.body.innerText.includes('hoặc') })
  })()`))

  // ── Sweep tất cả route ────────────────────────────────────
  const results = []
  for (const route of ROUTES) {
    consoleErrors.length = 0
    pageErrors.length = 0
    await send('Page.navigate', { url: BASE + route })
    await sleep(1200)
    await waitFor('#root > *', 10000)
    await sleep(1500)
    const info = await evalJS(`(() => {
      const body = document.body ? document.body.innerText : ''
      const root = document.getElementById('root')
      return JSON.stringify({
        path: location.pathname + location.search,
        textLen: body.trim().length,
        rootChildren: root ? root.children.length : 0,
        head: body.trim().slice(0, 200).replace(/\\s+/g, ' '),
      })
    })()`)
    results.push({ route, ...JSON.parse(info), consoleErrors: [...consoleErrors], pageErrors: [...pageErrors] })
  }

  // ── Chatbot ────────────────────────────────────────────────
  console.log('=== CHAT TESTS ===')
  await send('Page.navigate', { url: BASE + '/chat' })
  await waitFor('input[placeholder*="Nhập câu hỏi"]', 15000)
  await sleep(1200)

  console.log('CHAT:', await evalJS(`(async () => {
    const out = {}
    const sleep = (ms) => new Promise(r => setTimeout(r, ms))
    const inp = document.querySelector('input[placeholder*="Nhập câu hỏi"]')
    out.hasInput = !!inp
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    const sendMsg = async (text) => {
      setter.call(inp, text)
      inp.dispatchEvent(new Event('input', { bubbles: true }))
      await sleep(250)
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    }
    await sendMsg('xin chào')
    await sleep(4500)
    const body = document.body.innerText
    out.hasSourceBadge = /Gemini|Rule-based/.test(body)
    out.hasConfidence = /\\d{1,3}%/.test(body)
    out.sessionId = localStorage.getItem('warranty:chat:session:v1')
    out.hasClearBtn = !!document.querySelector('button[aria-label*="Xoá cuộc trò chuyện"]')
    out.fabHiddenOnChat = !document.querySelector('button[aria-label="Mở trợ lý ảo"]')
    const shopBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Tư vấn mua sản phẩm mới'))
    out.hasShopQuick = !!shopBtn
    if (shopBtn) { shopBtn.click(); await sleep(5000); out.shopProducts = (document.body.innerText.match(/₫/g) || []).length }
    return JSON.stringify(out)
  })()`))

  // ── Actions ────────────────────────────────────────────────
  console.log('ACTIONS:', await evalJS(`(async () => {
    const out = {}
    const sleep = (ms) => new Promise(r => setTimeout(r, ms))
    const inp = document.querySelector('input[placeholder*="Nhập câu hỏi"]')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    const sendMsg = async (text) => {
      setter.call(inp, text)
      inp.dispatchEvent(new Event('input', { bubbles: true }))
      await sleep(250)
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    }
    await sendMsg('mua tivi qled 4k')
    await sleep(6500)
    out.cartBtns = [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /Thêm vào giỏ|Xem giỏ hàng/.test(t))
    const cartBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Thêm vào giỏ')
    if (cartBtn) { cartBtn.click(); await sleep(800); out.cartToast = document.body.innerText.includes('Đã thêm vào giỏ') }
    await sendMsg('tôi muốn tạo phiếu bảo hành serial TND-WMS04-001')
    await sleep(6500)
    out.confirmBtns = [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => /Xác nhận|Huỷ/.test(t))
    return JSON.stringify(out)
  })()`))

  // ── Xoá cuộc trò chuyện ────────────────────────────────────
  console.log('CLEAR:', await evalJS(`(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms))
    const btn = document.querySelector('button[aria-label*="Xoá cuộc trò chuyện"]')
    if (!btn) return JSON.stringify({ hasBtn: false })
    btn.click(); await sleep(700)
    const dlg = [...document.querySelectorAll('h3')].some(h => h.textContent.includes('Xoá cuộc trò chuyện'))
    const confirm = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Xoá')
    if (confirm) { confirm.click(); await sleep(900) }
    return JSON.stringify({ hasBtn: true, hasDialog: dlg, afterClear: document.body.innerText.includes('đã được xoá') })
  })()`))

  // ── Tra cứu: nút "Hỏi trợ lý ảo" ──────────────────────────
  await send('Page.navigate', { url: BASE + '/lookup' })
  await waitFor('button', 10000)
  await sleep(1200)
  console.log('LOOKUP:', await evalJS(`(() => JSON.stringify({
    hasAskBtn: [...document.querySelectorAll('button')].some(x => x.textContent.includes('Hỏi trợ lý ảo')),
  }))()`))

  // ── Pre-fill ?q= ───────────────────────────────────────────
  await send('Page.navigate', { url: BASE + '/chat?q=' + encodeURIComponent('Tra cứu bảo hành sản phẩm TND-WMS04-001') })
  await waitFor('input[placeholder*="Nhập câu hỏi"]', 15000)
  await sleep(7500)
  console.log('PREFILL:', await evalJS(`(() => {
    const body = document.body.innerText
    return JSON.stringify({
      hasUserMsg: body.includes('Tra cứu bảo hành sản phẩm TND-WMS04-001'),
      hasReply: /TND-WMS04-001/.test(body),
      urlClean: !location.search.includes('q='),
    })
  })()`))

  // ── FAB trên trang khác ────────────────────────────────────
  await send('Page.navigate', { url: BASE + '/my-tickets' })
  await waitFor('#root > *', 10000)
  await sleep(1500)
  console.log('FAB:', await evalJS(`(() => JSON.stringify({
    hasFab: !!document.querySelector('button[aria-label="Mở trợ lý ảo"]'),
  }))()`))

  // ── Kết quả ───────────────────────────────────────────────
  console.log('=== SWEEP RESULTS ===')
  let failed = 0
  for (const r of results) {
    const ok = r.rootChildren > 0 && r.textLen > 40 && r.pageErrors.length === 0
    if (!ok) failed++
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${r.route.padEnd(22)} -> ${r.path.padEnd(22)} len=${String(r.textLen).padStart(5)} root=${r.rootChildren} errs=${r.pageErrors.length}/${r.consoleErrors.length}`)
    if (r.pageErrors.length) console.log('     pageErrors:', r.pageErrors)
    if (r.consoleErrors.length) console.log('     consoleErrors:', r.consoleErrors)
    if (!ok) console.log('     head:', r.head)
  }
  console.log(failed === 0 ? 'ALL ROUTES PASSED' : `${failed} ROUTE(S) FAILED`)

  await fetch(`http://${CDP_HOST}/json/close/${target.id}`)
  ws.close()
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(err => {
  console.error('SMOKE FAILED:', err.message)
  process.exit(1)
})
