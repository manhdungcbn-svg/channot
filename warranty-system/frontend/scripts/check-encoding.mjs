import { readFileSync } from 'node:fs'
const p = 'src/components/ChatPanel.jsx'
const s = readFileSync(p, 'utf8')
console.log('RECEIVED line:', JSON.stringify(s.match(/RECEIVED: '[^']*'/)?.[0]))
console.log('has split bug:', s.includes("slice(-1)[0]"))
console.log('length:', s.length)
