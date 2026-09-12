import PropTypes from 'prop-types';
import { forwardRef, useId } from 'react';

const controlBase =
  'w-full rounded-md border bg-surface px-3 text-ink placeholder:text-ink-faint transition-colors disabled:bg-sunken disabled:text-ink-muted';
const controlSize = 'h-9 text-body';
const controlState = (invalid) =>
  invalid
    ? 'border-danger-600 focus-visible:outline-danger-600'
    : 'border-line-strong hover:border-pine-300 focus-visible:border-pine-500';

/**
 * Label + control + help/error text. Pass the control as children and it is wired to the label.
 */
export function Field({ label, hint, error, htmlFor, required = false, className = '', children }) {
  const generated = useId();
  const id = htmlFor || generated;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-small font-medium text-ink">
          {label}
          {required && (
            <span className="ml-0.5 text-brass-500" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {typeof children === 'function' ? children({ id, invalid: Boolean(error) }) : children}
      {error ? (
        <p className="text-small text-danger-700" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-small text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.node,
  hint: PropTypes.node,
  error: PropTypes.node,
  htmlFor: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
};

export const Input = forwardRef(function Input({ invalid = false, className = '', numeric = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${controlBase} ${controlSize} ${controlState(invalid)} ${numeric ? 'input-number' : ''} ${className}`}
      {...props}
    />
  );
});

Input.propTypes = {
  invalid: PropTypes.bool,
  numeric: PropTypes.bool,
  className: PropTypes.string,
};

export const Select = forwardRef(function Select({ invalid = false, className = '', children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${controlBase} ${controlSize} ${controlState(invalid)} select-arrow appearance-none pr-9 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

Select.propTypes = {
  invalid: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

/** A compact input for use inside table cells (no outer chrome until focused). */
export const CellInput = forwardRef(function CellInput({ invalid = false, className = '', numeric = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`h-8 w-full rounded-sm border bg-surface px-2 text-body text-ink placeholder:text-ink-faint transition-colors ${
        invalid ? 'border-danger-600' : 'border-line hover:border-pine-300 focus-visible:border-pine-500'
      } ${numeric ? 'input-number text-right' : ''} ${className}`}
      {...props}
    />
  );
});

CellInput.propTypes = {
  invalid: PropTypes.bool,
  numeric: PropTypes.bool,
  className: PropTypes.string,
};
