import { useState, useEffect } from 'react'

/**
 * Hook trì hoãn cập nhật giá trị cho đến khi người dùng ngừng gõ trong `delay` ms.
 * Theo pattern rule TypeScript của ECC (.cursor/rules/typescript-patterns.md).
 *
 * @template T
 * @param {T} value - giá trị đầu vào (thường là state từ input)
 * @param {number} delay - thời gian chờ (ms), mặc định 300
 * @returns {T} giá trị đã debounce
 *
 * @example
 *   const [search, setSearch] = useState('')
 *   const debouncedSearch = useDebounce(search, 300)
 *   useEffect(() => { filter(debouncedSearch) }, [debouncedSearch])
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}