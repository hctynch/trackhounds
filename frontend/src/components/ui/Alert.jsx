import PropTypes from 'prop-types';
import { LuCircleAlert, LuCircleCheck, LuInfo, LuTriangleAlert } from 'react-icons/lu';

const tones = {
  info: { icon: LuInfo, className: 'border-pine-300 bg-pine-50 text-pine-800', iconClass: 'text-pine-600' },
  success: { icon: LuCircleCheck, className: 'border-success-600/30 bg-success-100 text-success-700', iconClass: 'text-success-600' },
  warning: { icon: LuTriangleAlert, className: 'border-warning-600/30 bg-warning-100 text-warning-700', iconClass: 'text-warning-600' },
  danger: { icon: LuCircleAlert, className: 'border-danger-600/30 bg-danger-100 text-danger-700', iconClass: 'text-danger-600' },
};

/** Inline notice. Errors say what went wrong and what to do; they do not apologise. */
function Alert({ tone = 'info', title, children, items, className = '' }) {
  const { icon: Icon, className: toneClass, iconClass } = tones[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex gap-3 rounded-md border px-3.5 py-3 text-small ${toneClass} ${className}`}>
      <Icon size={18} className={`mt-px shrink-0 ${iconClass}`} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
        {items && items.length > 0 && (
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

Alert.propTypes = {
  tone: PropTypes.oneOf(Object.keys(tones)),
  title: PropTypes.node,
  children: PropTypes.node,
  items: PropTypes.arrayOf(PropTypes.node),
  className: PropTypes.string,
};

export default Alert;
