import { request } from './client';
import { heroSlides, heroQuickChips } from '../data/mockHero';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Delay giả lập để nhìn thấy được trạng thái skeleton.
 * @param {number} min
 * @param {number} max
 * @returns {Promise<void>}
 */
function simulateDelay(min = 400, max = 800) {
  const ms = Math.round(min + Math.random() * (max - min));
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Lấy dữ liệu slide hero.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../data/mockHero').HeroSlide[]>}
 */
export async function getHeroSlides(options = {}) {
  if (USE_MOCK) {
    await simulateDelay();
    return heroSlides;
  }
  const data = await request(`${API_BASE}/api/v1/hero/slides`, { signal: options.signal });
  return data?.items ?? [];
}

/**
 * Lấy quick-intent chips.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{id: string, label: string, query: string}[]>}
 */
export async function getQuickChips(options = {}) {
  if (USE_MOCK) {
    await simulateDelay(300, 600);
    return heroQuickChips;
  }
  const data = await request(`${API_BASE}/api/v1/hero/quick-chips`, { signal: options.signal });
  return data?.items ?? [];
}

export { USE_MOCK };

export default { getHeroSlides, getQuickChips };