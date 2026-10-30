/**
 * Sửa lỗi greeting: `full_name.split(' ').slice(-1)[0]` cắt sai tên tiếng Việt
 * (ví dụ "Quản trị viên" → "viên"). Thay bằng getDisplayName() dùng chung.
 *
 * Dùng Node để giữ nguyên encoding UTF-8 (PowerShell Set-Content sẽ phá).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

/** file → danh sách import cần thêm */
const TARGETS = [
  'components/ChatPanel.jsx',
  'components/ChatSerialModal.jsx',
]

const OLD = "user?.full_name?.split(' ').slice(-1)[0] || 'bạn'"
const NEW = 'getDisplayName(user?.full_name)'

for (const rel of TARGETS) {
  const path = join(SRC, rel)
  const src = readFileSync(path, 'utf8')
  if (!src.includes(OLD)) {
    console.log(`${rel}: không cần sửa`)
    continue
  }

  let out = src.split(OLD).join(NEW)

  // Thêm import nếu chưa có
  if (!out.includes("from '../utils/displayName'") && !out.includes('from "./displayName"')) {
    const relPath = rel.startsWith('components/') ? '../utils/displayName' : './utils/displayName'
    // Chèn sau import cuối cùng ở đầu file
    const importRe = /^import .*?$/gm
    const matches = [...out.matchAll(importRe)]
    if (matches.length) {
      const last = matches[matches.length - 1]
      const insertAt = last.index + last[0].length
      out = `${out.slice(0, insertAt)}\nimport { getDisplayName } from '${relPath}'${out.slice(insertAt)}`
    }
  }

  writeFileSync(path, out, 'utf8')
  console.log(`${rel}: đã sửa greeting`)
}
