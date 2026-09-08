import PropTypes from 'prop-types';
import { forwardRef } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';

const variants = {
  primary:
    'bg-pine-700 text-white border-pine-700 hover:bg-pine-800 hover:border-pine-800 disabled:bg-pine-300 disabled:border-pine-300',
  secondary:
    'bg-surface text-ink border-line-strong hover:bg-pine-50 hover:border-pine-300 disabled:text-ink-faint disabled:hover:bg-surface',
  danger:
    'bg-surface text-danger-700 border-danger-600/50 hover:bg-danger-100 hover:border-danger-600 disabled:text-ink-faint disabled:border-line',
  ghost:
    'bg-transparent text-ink-muted border-transparent hover:bg-pine-100 hover:text-ink disabled:text-ink-faint disabled:hover:bg-transparent',
};

const sizes = {
  sm: 'h-8 px-2.5 text-small gap-1.5',
  md: 'h-9 px-3.5 text-body gap-2',
  lg: 'h-11 px-5 text-body gap-2',
};

/**
 * The one button. `variant` says how important it is, `icon` puts a Lucide icon before the label.
 */
const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, loading = false, disabled, className = '', type = 'button', children, ...props },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md border font-medium transition-colors duration-150 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <LuLoaderCircle className="animate-spin" size={16} aria-hidden /> : Icon ? <Icon size={16} aria-hidden /> : null}
      {children}
    </button>
  );
});

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  icon: PropTypes.elementType,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  children: PropTypes.node,
};

export default Button;

/** Square icon-only button for table row actions. Always give it a `title`/`aria-label`. */
export const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, tone = 'neutral', size = 16, className = '', ...props },
  ref,
) {
  const tones = {
    neutral: 'text-ink-muted hover:text-ink hover:bg-pine-100',
    danger: 'text-ink-muted hover:text-danger-700 hover:bg-danger-100',
  };
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${tones[tone]} ${className}`}
      {...props}
    >
      <Icon size={size} aria-hidden />
    </button>
  );
});

IconButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(['neutral', 'danger']),
  size: PropTypes.number,
  className: PropTypes.string,
};
