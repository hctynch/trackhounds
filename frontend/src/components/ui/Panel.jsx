import PropTypes from 'prop-types';

/** A white surface with a hairline border. Content is grouped by rules, not shadows. */
export function Panel({ className = '', children, ...props }) {
  return (
    <section className={`rounded-lg border border-line bg-surface ${className}`} {...props}>
      {children}
    </section>
  );
}

Panel.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

export function PanelHeader({ title, description, actions, className = '' }) {
  return (
    <header className={`flex items-start justify-between gap-4 border-b border-line px-5 py-3.5 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-heading font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-small text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

PanelHeader.propTypes = {
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  actions: PropTypes.node,
  className: PropTypes.string,
};

export function PanelBody({ className = '', padded = true, children }) {
  return <div className={`${padded ? 'p-5' : ''} ${className}`}>{children}</div>;
}

PanelBody.propTypes = {
  className: PropTypes.string,
  padded: PropTypes.bool,
  children: PropTypes.node,
};

export function PanelFooter({ className = '', children }) {
  return (
    <footer className={`flex items-center justify-end gap-2 border-t border-line bg-sunken px-5 py-3 rounded-b-lg ${className}`}>
      {children}
    </footer>
  );
}

PanelFooter.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
