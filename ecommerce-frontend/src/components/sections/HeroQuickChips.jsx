import { useNavigate } from 'react-router-dom';
import { Search } from '../icons';
import { cn } from '../../utils/cn';

/**
 * Quick-intent chips: giúp người dùng nhảy thẳng tới trang tìm kiếm
 * theo ý định phổ biến (tivi, máy lọc nước, quạt thông minh...).
 *
 * @param {object} props
 * @param {{id: string, label: string, query: string}[]} props.chips
 * @param {string} [props.className]
 */
export function HeroQuickChips({ chips = [], className }) {
  const navigate = useNavigate();

  if (!chips.length) return null;

  const handleClick = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className={cn('mt-6 flex flex-wrap gap-2', className)}>
      {chips.map((chip) => (
        <button
          key={chip.id ?? chip.label}
          type="button"
          onClick={() => handleClick(chip.query ?? chip.label)}
          className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-full bg-white border border-line-200 text-sm text-ink-700 hover:border-brand-accent hover:text-brand-600 transition-colors duration-150"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{chip.label}</span>
        </button>
      ))}
    </div>
  );
}

export default HeroQuickChips;