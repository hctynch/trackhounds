import PropTypes from 'prop-types';
import { LuArrowLeft } from 'react-icons/lu';
import { Link } from 'react-router-dom';

/**
 * Title row of every page. `backTo` renders a small "back" link above the title so pages that are
 * part of a flow (add dogs, edit hunt) show where they came from.
 */
function PageHeader({ title, description, actions, backTo, backLabel = 'Back', meta }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="mb-2 inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-pine-700"
          >
            <LuArrowLeft size={14} aria-hidden />
            {backLabel}
          </Link>
        )}
        <h1 className="text-display font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-[70ch] text-body text-ink-muted">{description}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  actions: PropTypes.node,
  backTo: PropTypes.string,
  backLabel: PropTypes.string,
  meta: PropTypes.node,
};

export default PageHeader;
