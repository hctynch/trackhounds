import PropTypes from 'prop-types';

const tones = {
  neutral: 'bg-pine-100 text-pine-800',
  brass: 'bg-brass-100 text-brass-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  outline: 'border border-line-strong text-ink-muted',
};

export function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-tiny font-medium leading-4 ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  tone: PropTypes.oneOf(Object.keys(tones)),
  className: PropTypes.string,
  children: PropTypes.node,
};

export const STAKE_LABELS = {
  ALL_AGE: 'All age',
  DERBY: 'Derby',
  DUAL: 'Dual',
};

/** Stake types are the one category every scorekeeper reads at a glance, so they get fixed colours. */
export function StakeBadge({ stake }) {
  if (!stake) return null;
  const tone = stake === 'ALL_AGE' ? 'neutral' : stake === 'DERBY' ? 'brass' : 'outline';
  return <Badge tone={tone}>{STAKE_LABELS[stake] || stake}</Badge>;
}

StakeBadge.propTypes = {
  stake: PropTypes.string,
};
