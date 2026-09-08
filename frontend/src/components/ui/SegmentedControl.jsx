import PropTypes from 'prop-types';
import { forwardRef } from 'react';

/**
 * A row of mutually exclusive choices (hunt day, stake type). Behaves as a radio group: arrow keys
 * move between options and Space/Enter selects. `optionRef(value)` exposes each button for
 * pages that manage focus themselves.
 */
const SegmentedControl = forwardRef(function SegmentedControl(
  { options, value, onChange, label, size = 'md', className = '', optionRef, onOptionKeyDown },
  ref,
) {
  const sizes = { sm: 'h-8 px-3 text-small', md: 'h-9 px-4 text-body', lg: 'h-11 px-5 text-body' };

  const handleKeyDown = (event, index) => {
    if (onOptionKeyDown && onOptionKeyDown(event, options[index].value)) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const next = (index + delta + options.length) % options.length;
      onChange(options[next].value);
      const nextEl = event.currentTarget.parentElement.children[next];
      if (nextEl) nextEl.focus();
    }
  };

  return (
    <div ref={ref} role="radiogroup" aria-label={label} className={`inline-flex rounded-md border border-line-strong bg-surface p-0.5 ${className}`}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={option.disabled}
            ref={optionRef ? (el) => optionRef(option.value, el) : undefined}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`flex-1 whitespace-nowrap rounded-sm font-medium transition-colors ${sizes[size]} ${
              selected ? 'bg-pine-700 text-white' : 'text-ink-muted hover:bg-pine-50 hover:text-ink'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
});

SegmentedControl.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
      disabled: PropTypes.bool,
    }),
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  optionRef: PropTypes.func,
  onOptionKeyDown: PropTypes.func,
};

export default SegmentedControl;
