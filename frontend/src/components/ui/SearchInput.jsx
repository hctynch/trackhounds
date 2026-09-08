import PropTypes from 'prop-types';
import { LuSearch, LuX } from 'react-icons/lu';

function SearchInput({ value, onChange, placeholder = 'Search', className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      <LuSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-md border border-line-strong bg-surface pl-9 pr-8 text-body placeholder:text-ink-faint hover:border-pine-300 focus-visible:border-pine-500 [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-ink-faint hover:text-ink"
        >
          <LuX size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}

SearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
};

export default SearchInput;
