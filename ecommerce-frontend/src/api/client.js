/**
 * Fetch wrapper: timeout, AbortController, chuẩn hoá lỗi.
 */

/**
 * @typedef {object} NormalizedError
 * @property {'network'|'timeout'|'abort'|'http'|'parse'|'unknown'} type
 * @property {string} message
 * @property {number} [status]
 */

/**
 * Tạo lỗi đã chuẩn hoá.
 * @param {string} type
 * @param {string} message
 * @param {number} [status]
 * @returns {Error}
 */
export function createError(type, message, status) {
  const error = new Error(message);
  error.name = 'ApiError';
  error.type = type;
  if (typeof status === 'number') error.status = status;
  return error;
}

/**
 * Gọi API JSON với timeout 8s.
 * @param {string} url
 * @param {{ method?: string, headers?: Record<string,string>, body?: any, signal?: AbortSignal, timeout?: number }} [options]
 * @returns {Promise<any>}
 */
export async function request(url, options = {}) {
  const { method = 'GET', headers = {}, body, signal, timeout = 8000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeout);

  const onExternalAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) onExternalAbort();
    else signal.addEventListener('abort', onExternalAbort);
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw createError('http', `Yêu cầu thất bại (${response.status})`, response.status);
    }

    try {
      return await response.json();
    } catch {
      throw createError('parse', 'Dữ liệu phản hồi không hợp lệ');
    }
  } catch (error) {
    if (error && error.type) throw error; // đã chuẩn hoá
    if (error && error.name === 'AbortError') {
      const timedOut = signal ? !signal.aborted : true;
      throw createError(
        timedOut ? 'timeout' : 'abort',
        timedOut ? 'Yêu cầu quá thời gian chờ' : 'Yêu cầu đã bị huỷ',
      );
    }
    throw createError('network', 'Không thể kết nối tới máy chủ. Vui lòng thử lại.');
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }
}

export default request;