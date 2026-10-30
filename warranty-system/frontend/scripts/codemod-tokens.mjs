/**
 * Codemod: chuyển hex hardcode trong inline style → CSS variables (design tokens).
 *
 * Không thay toàn cục vì cùng một giá trị hex có thể mang ý nghĩa khác nhau
 * tuỳ vị trí: #FFFFFF là "màu nền card" ở chỗ này nhưng "màu chữ trên nền tối"
 * ở chỗ kia. Vì vậy map theo KEY gần nhất phía trước mỗi hex.
 *
 * Cách làm: quét vị trí các `key:` và `#HEX`; với mỗi hex tìm key gần nhất
 * phía trước → quyết định bảng map nào dùng (TEXT / BG / BORDER).
 * Cách này xử lý được cả ternary (`cond ? '#A' : '#B'`) — thứ mà regex
 * `key:\s*'#HEX'` bỏ sót.
 *
 * Chạy: node scripts/codemod-tokens.mjs [--dry]
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const SRC = join(ROOT, 'src')
const DRY = process.argv.includes('--dry')

/**
 * File có nền tối CỐ ĐỊNH (chat surface) — dùng bảng token riêng (--chat-*)
 * vì chúng luôn hiển thị nền tối bất kể theme app.
 */
const DARK_SURFACE_FILES = new Set([
  'components/ChatPanel.jsx',
  'components/ChatFab.jsx',
  'components/ChatSerialModal.jsx',
  'pages/CustomerChat.jsx',
])

/** Bảng map riêng cho chat surface */
const CHAT = {
  '#0F1929': 'var(--chat-bg)',
  '#0A1628': 'var(--chat-bg)',
  '#0A0E1A': 'var(--chat-bg)',
  '#1E293B': 'var(--chat-surface)',
  '#334155': 'var(--chat-surface-hover)',
  '#475569': 'var(--chat-surface-hover)',
  '#94A3B8': 'var(--chat-text-muted)',
  '#64748B': 'var(--chat-text-dim)',
  '#F1F5F9': 'var(--chat-text)',
  '#CBD5E1': 'var(--chat-text)',
}

/* ------------------------------------------------------------------ *
 * Bảng mapping
 * ------------------------------------------------------------------ */

/** Màu dùng cho CHỮ */
const TEXT = {
  '#0F1929': 'var(--text-primary)',
  '#1F2937': 'var(--text-primary)',
  '#1E293B': 'var(--text-primary)',
  '#191B2A': 'var(--text-primary)',
  '#0F172A': 'var(--text-primary)',
  '#111827': 'var(--text-primary)',

  '#374151': 'var(--text-secondary)',
  '#41445A': 'var(--text-secondary)',
  '#334155': 'var(--text-secondary)',
  '#475569': 'var(--text-secondary)',

  '#64748B': 'var(--text-muted)',
  '#73768A': 'var(--text-muted)',
  '#6B7280': 'var(--text-muted)',
  '#85889A': 'var(--text-muted)',

  '#9CA3AF': 'var(--text-light)',
  '#9A9CAD': 'var(--text-light)',
  '#94A3B8': 'var(--text-light)',

  // Brand cũ (navy + indigo) → Teal
  '#1A3A6B': 'var(--brand-700)',
  '#4F46E5': 'var(--brand-600)',
  '#4338CA': 'var(--brand-700)',
  '#3730A3': 'var(--brand-800)',
  '#312E81': 'var(--brand-900)',
  '#1E1B4B': 'var(--brand-900)',
  '#5B50E8': 'var(--brand-600)',

  '#FFFFFF': '#FFFFFF',

  '#047857': 'var(--success-text)',
  '#065F46': 'var(--success-text)',
  '#059669': 'var(--success-text)',
  '#10B981': 'var(--success)',
  '#34D399': 'var(--success)',

  '#B45309': 'var(--warning-text)',
  '#92400E': 'var(--warning-text)',
  '#D97706': 'var(--warning-text)',
  '#F59E0B': 'var(--warning)',

  '#B91C1C': 'var(--danger-text)',
  '#991B1B': 'var(--danger-text)',
  '#DC2626': 'var(--danger)',
  '#EF4444': 'var(--danger)',
  '#F87171': 'var(--danger)',

  '#1D4ED8': 'var(--info-text)',
  '#2563EB': 'var(--info)',
  '#3B82F6': 'var(--info)',
  '#60A5FA': 'var(--info)',
  '#93C5FD': 'var(--info)',

  '#7C3AED': 'var(--accent-violet)',
  '#A78BFA': 'var(--accent-violet)',
  '#C4B5FD': 'var(--accent-violet)',
  '#8B5CF6': 'var(--accent-violet)',
  '#6D28D9': 'var(--accent-violet)',
  '#5B21B6': 'var(--accent-violet)',
  '#DDD6FE': 'var(--brand-100)',

  '#F97316': 'var(--accent-orange)',
  '#FDBA74': 'var(--accent-orange)',
  '#9A3412': 'var(--accent-orange)',
  '#FBBF24': 'var(--accent-orange)',

  '#A7F3D0': 'var(--success-text)',
  '#FCA5A5': 'var(--danger-text)',

  // Neutral bổ sung
  '#4B5563': 'var(--text-secondary)',
  '#1F1B2D': 'var(--text-primary)',
  '#292B3D': 'var(--text-primary)',
  '#A5A7B4': 'var(--text-light)',
  '#C5C7D0': 'var(--text-light)',
  '#D1D5DB': 'var(--border-strong)',
  '#E2E8F0': 'var(--border)',
  '#F1F2F7': 'var(--bg-hover)',
  '#E1E3ED': 'var(--border)',
  '#E8EEF5': 'var(--bg-subtle)',
}

/** Màu dùng cho NỀN */
const BG = {
  '#FFFFFF': 'var(--bg-card)',
  '#F8FAFC': 'var(--bg-subtle)',
  '#F9FAFB': 'var(--bg-subtle)',
  '#F8F9FC': 'var(--bg-subtle)',
  '#F8F9FB': 'var(--bg-subtle)',
  '#FAFAFC': 'var(--bg-subtle)',
  '#F6F8FA': 'var(--bg-page)',
  '#F5F6FA': 'var(--bg-page)',
  '#F1F5F9': 'var(--bg-hover)',
  '#F3F4F6': 'var(--bg-hover)',
  '#F3F4F8': 'var(--bg-hover)',

  // Brand đậm (nút, tab active, chip active)
  '#1A3A6B': 'var(--brand-700)',
  '#4F46E5': 'var(--brand-600)',
  '#4338CA': 'var(--brand-700)',
  '#312E81': 'var(--brand-900)',
  '#2563EB': 'var(--brand-600)',
  '#059669': 'var(--success)',
  '#10B981': 'var(--success)',
  '#DC2626': 'var(--danger)',
  '#EF4444': 'var(--danger)',
  '#F59E0B': 'var(--warning)',
  '#3B82F6': 'var(--info)',
  '#7C3AED': 'var(--accent-violet)',
  '#94A3B8': 'var(--border-strong)',

  // Brand nền nhạt
  '#EEF2FF': 'var(--brand-50)',
  '#EEF4FF': 'var(--brand-50)',
  '#EDE9FE': 'var(--brand-50)',
  '#E0E7FF': 'var(--brand-100)',
  '#E8EAFE': 'var(--brand-100)',
  '#D1DCF0': 'var(--brand-100)',
  '#C7D2FE': 'var(--brand-200)',

  // Status nền
  '#FEE2E2': 'var(--danger-bg)',
  '#FEF3C7': 'var(--warning-bg)',
  '#FFEDD5': 'var(--warning-bg)',
  '#D1FAE5': 'var(--success-bg)',
  '#DBEAFE': 'var(--info-bg)',

  // Border dùng như nền
  '#E5E7EB': 'var(--border)',
  '#E4EBF7': 'var(--border)',
  '#E7E9F1': 'var(--border)',
  '#F0F1F5': 'var(--border-light)',
  '#E2E8F0': 'var(--border)',

  // Nền theo nhóm ngành hàng (category chips)
  '#EFF6FF': 'var(--info-bg)',
  '#F5F3FF': 'var(--brand-50)',
  '#ECFDF5': 'var(--success-bg)',
  '#FFFBEB': 'var(--warning-bg)',
  '#FEF2F2': 'var(--danger-bg)',
  '#F0F7FF': 'var(--info-bg)',
  '#F0F9FF': 'var(--info-bg)',
  '#BAE6FD': 'var(--info-bg)',
  '#DDD6FE': 'var(--brand-100)',
}

/** Màu dùng cho VIỀN */
const BORDER = {
  '#E5E7EB': 'var(--border)',
  '#E4EBF7': 'var(--border)',
  '#E7E9F1': 'var(--border)',
  '#F0F1F5': 'var(--border-light)',
  '#F1F5F9': 'var(--border-light)',
  '#F3F4F6': 'var(--border-light)',
  '#C7D2FE': 'var(--brand-200)',
  '#D1DCF0': 'var(--brand-200)',
  '#FDE68A': 'var(--warning-bg)',
  '#BFDBFE': 'var(--info-bg)',
  '#FECACA': 'var(--danger-bg)',
  '#FCD34D': 'var(--warning-bg)',
  '#6EE7B7': 'var(--success-bg)',
  '#93C5FD': 'var(--info-bg)',
  '#CBD5E1': 'var(--border-strong)',
  '#E2E8F0': 'var(--border)',
  '#D1D5DB': 'var(--border-strong)',
}

/** key → bảng map */
/**
 * key → bảng map.
 * Key ở đây PHẢI viết thường (lowercase) vì key.name được lowercase khi so khớp.
 */
const KEY_MAP = {
  color: TEXT,
  text: TEXT,
  stroke: TEXT,
  fill: TEXT,
  iconcolor: TEXT,
  backgroundcolor: BG,
  background: BG,
  bg: BG,
  bgcolor: BG,
  iconbg: BG,
  buttoncolor: BG,
  buttonhover: BG,
  bordercolor: BORDER,
  bordertopcolor: BORDER,
  borderbottomcolor: BORDER,
  borderleftcolor: BORDER,
  borderrightcolor: BORDER,
}

/** key nằm trong `border: '1px solid #HEX'` → viền */
const BORDER_SHORTHAND = /(\bborder(?:Top|Bottom|Left|Right)?\s*:\s*)(['"`])1px solid (#[0-9A-Fa-f]{6})\2/gi

/** gradient brand cũ → gradient mới */
const GRADIENTS = [
  [/linear-gradient\(\s*135deg,\s*#4F46E5,\s*#7C3AED\s*\)/gi, 'var(--brand-gradient)'],
  [/linear-gradient\(\s*145deg,\s*#4F46E5,\s*#7C3AED\s*\)/gi, 'var(--brand-gradient)'],
  [/linear-gradient\(\s*100deg,\s*#4F46E5,\s*#5B50E8\s*\)/gi, 'var(--brand-gradient)'],
  [/linear-gradient\(\s*135deg,\s*#312E81\s*0%\s*,\s*#4F46E5\s*58%\s*,\s*#766BF2\s*100%\s*\)/gi, 'var(--brand-dark)'],
  [/linear-gradient\(\s*145deg,\s*#312E81\s*0%\s*,\s*#4F46E5[^)]*\)/gi, 'var(--brand-dark)'],
  [/linear-gradient\(\s*135deg,\s*#1A3A6B,\s*#2563EB\s*\)/gi, 'var(--brand-gradient)'],
  [/linear-gradient\(\s*135deg,\s*#312E81\s*0%\s*,\s*#4F46E5\s*58%\s*,\s*#766BF2\s*100%\s*\)/gi, 'var(--brand-dark)'],
  [/linear-gradient\(\s*115deg,\s*#312E81[^)]*\)/gi, 'var(--brand-dark)'],
]

const hexUpper = (v) => v.toUpperCase()

/* ------------------------------------------------------------------ *
 * Transform
 * ------------------------------------------------------------------ */

/**
 * Quét src, tìm key gần nhất phía trước mỗi hex.
 * @returns {{out: string, replaced: number}}
 */
function mapHexByContext(src) {
  const keyRe = /\b(color|stroke|fill|backgroundColor|background|bg|text|borderColor|borderTopColor|borderBottomColor|borderLeftColor|borderRightColor)\s*:/gi
  const keys = []
  let m
  while ((m = keyRe.exec(src)) !== null) {
    keys.push({ index: m.index, name: m[1].toLowerCase() })
  }
  if (keys.length === 0) return { out: src, replaced: 0 }

  const hexRe = /#[0-9A-Fa-f]{6}\b/g
  const edits = []
  while ((m = hexRe.exec(src)) !== null) {
    const idx = m.index
    let key = null
    for (let i = keys.length - 1; i >= 0; i -= 1) {
      if (keys[i].index < idx) { key = keys[i]; break }
    }
    if (!key) continue
    const map = KEY_MAP[key.name]
    if (!map) continue
    const mapped = map[hexUpper(m[0])]
    if (!mapped) continue
    edits.push({ start: idx, end: idx + m[0].length, text: mapped })
  }

  let out = src
  for (let i = edits.length - 1; i >= 0; i -= 1) {
    const e = edits[i]
    out = out.slice(0, e.start) + e.text + out.slice(e.end)
  }
  return { out, replaced: edits.length }
}

function transform(src) {
  let out = src

  // gradient trước (chúng chứa hex nhiều, không nên map từng hex)
  for (const [re, rep] of GRADIENTS) out = out.replace(re, rep)

  // border shorthand
  out = out.replace(BORDER_SHORTHAND, (match, prefix, quote, value) => {
    const mapped = BORDER[hexUpper(value)] || TEXT[hexUpper(value)]
    return mapped ? `${prefix}${quote}1px solid ${mapped}${quote}` : match
  })

  const { out: next, replaced } = mapHexByContext(out)
  return { out: next, replaced }
}

/* ------------------------------------------------------------------ *
 * Quét file
 * ------------------------------------------------------------------ */
function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) files.push(...walk(full))
    else if (['.jsx', '.js'].includes(extname(full))) files.push(full)
  }
  return files
}

let changed = 0
let totalReplacements = 0

for (const file of walk(SRC)) {
  const rel = file.replace(join(ROOT, 'src') + '\\', '').replace(/\\/g, '/')
  const original = readFileSync(file, 'utf8')
  const isChat = DARK_SURFACE_FILES.has(rel)

  let out = original
  let replaced = 0

  if (isChat) {
    // Chat surface: chỉ map các màu nền tối cố định, GIỮ NGUYÊN màu accent
    // (brand/xanh/violet) vì chúng là màu nhấn trên nền tối.
    out = out.replace(/#[0-9A-Fa-f]{6}\b/g, (match) => {
      const mapped = CHAT[hexUpper(match)]
      return mapped || match
    })
    replaced = (original.match(/#[0-9A-Fa-f]{6}\b/g) || []).length
      - (out.match(/#[0-9A-Fa-f]{6}\b/g) || []).length
  } else {
    const res = transform(original)
    out = res.out
    replaced = res.replaced
  }

  if (out !== original) {
    const left = (out.match(/#[0-9A-Fa-f]{6}\b/g) || []).length
    console.log(`${file.replace(ROOT, '')}: ${replaced} thay → còn ${left} hex`)
    totalReplacements += replaced
    changed += 1
    if (!DRY) writeFileSync(file, out, 'utf8')
  }
}

console.log(`\n${DRY ? '[DRY] ' : ''}${changed} file thay đổi, ${totalReplacements} hex → token.`)