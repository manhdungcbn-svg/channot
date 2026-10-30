/**
 * Test cho lazy-init Supabase — chạy bằng `node --test` (không thêm thư viện).
 *
 * Lệnh chạy:
 *   node --test frontend/src/services/supabaseClientInit.test.js
 *
 * Phạm vi: kiểm tra quyết định "có tạo client hay không" cho cả hai nhánh
 * (có cấu hình / thiếu cấu hình). Không mock @supabase/supabase-js — factory
 * được inject nên test chỉ kiểm tra logic quyết định, không kiểm tra thư viện.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { initSupabase, isSupabaseConfigured } from './supabaseClientInit.js'

test('isSupabaseConfigured — thiếu cả hai biến thì false', () => {
  assert.equal(isSupabaseConfigured('', ''), false)
})

test('isSupabaseConfigured — thiếu anon key thì false', () => {
  assert.equal(isSupabaseConfigured('https://proj.supabase.co', ''), false)
})

test('isSupabaseConfigured — thiếu url thì false', () => {
  assert.equal(isSupabaseConfigured('', 'anon-key'), false)
})

test('isSupabaseConfigured — đủ cả hai thì true', () => {
  assert.equal(isSupabaseConfigured('https://proj.supabase.co', 'anon-key'), true)
})

test('isSupabaseConfigured — undefined được coi như thiếu', () => {
  assert.equal(isSupabaseConfigured(undefined, undefined), false)
  assert.equal(isSupabaseConfigured('https://proj.supabase.co', undefined), false)
})

test('initSupabase — KHÔNG gọi factory khi thiếu cấu hình (trả null)', () => {
  let called = 0
  const factory = (u, k) => { called += 1; return { u, k } }

  assert.equal(initSupabase('', '', factory), null)
  assert.equal(initSupabase('https://proj.supabase.co', '', factory), null)
  assert.equal(initSupabase('', 'anon-key', factory), null)
  assert.equal(initSupabase(undefined, undefined, factory), null)

  // Điểm mấu chốt: createClient() không bao giờ được gọi → app không crash lúc import.
  assert.equal(called, 0)
})

test('initSupabase — gọi factory đúng 1 lần khi có đủ cấu hình', () => {
  const calls = []
  const factory = (u, k) => { calls.push([u, k]); return { client: true } }

  const client = initSupabase('https://proj.supabase.co', 'anon-key', factory)

  assert.deepEqual(client, { client: true })
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], ['https://proj.supabase.co', 'anon-key'])
})

test('initSupabase — truyền đúng url/key xuống factory', () => {
  const factory = (u, k) => ({ u, k })
  const client = initSupabase('https://a.supabase.co', 'key-123', factory)

  assert.equal(client.u, 'https://a.supabase.co')
  assert.equal(client.k, 'key-123')
})
