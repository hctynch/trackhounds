import PropTypes from 'prop-types';

/** An empty screen is an invitation to act: say what is missing and offer the next step. */
function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'py-6' : 'py-14'}`}>
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-pine-100 text-pine-600">
          <Icon size={22} aria-hidden />
        </div>
      )}
      <p className="text-heading font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-[46ch] text-small text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  action: PropTypes.node,
  compact: PropTypes.bool,
};

export default EmptyState;
