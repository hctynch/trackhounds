import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import {
  LuBookOpen,
  LuChevronDown,
  LuClipboardList,
  LuDog,
  LuFileText,
  LuFlag,
  LuGavel,
  LuHouse,
} from 'react-icons/lu';
import { NavLink, useLocation } from 'react-router-dom';
import { useHunt } from '../../hooks/useHunt';
import { STAKE_LABELS } from '../ui/Badge';

const navigation = [
  { label: 'Home', to: '/', icon: LuHouse, end: true },
  {
    label: 'Dogs',
    icon: LuDog,
    children: [
      { label: 'All dogs', to: '/dogs/all' },
      { label: 'Add dogs', to: '/dogs/add' },
    ],
  },
  { label: 'Judges', to: '/judges/all', icon: LuGavel },
  {
    label: 'Scores',
    icon: LuClipboardList,
    children: [
      { label: 'Enter scores', to: '/score-entry/enter' },
      { label: 'View scores', to: '/score-entry/view' },
    ],
  },
  { label: 'Scratch sheet', to: '/scratch-sheet/view', icon: LuFlag },
  { label: 'Reports', to: '/reports', icon: LuFileText },
];

const itemBase =
  'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-body font-medium transition-colors focus-visible:outline-brass-300';
const itemIdle = 'text-pine-100/90 hover:bg-pine-700 hover:text-white';
const itemActive = 'bg-pine-900 text-white shadow-[inset_3px_0_0_0_var(--color-brass-500)]';

function NavItem({ item }) {
  return (
    <NavLink to={item.to} end={item.end} className={({ isActive }) => `${itemBase} ${isActive ? itemActive : itemIdle}`}>
      <item.icon size={18} className="shrink-0" aria-hidden />
      <span className="truncate max-lg:sr-only">{item.label}</span>
    </NavLink>
  );
}

NavItem.propTypes = {
  item: PropTypes.shape({
    to: PropTypes.string.isRequired,
    end: PropTypes.bool,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
  }).isRequired,
};

function NavGroup({ item }) {
  const location = useLocation();
  const childActive = item.children.some((child) => location.pathname.startsWith(child.to));
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={`${itemBase} ${childActive && !open ? itemActive : itemIdle}`}
      >
        <item.icon size={18} className="shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left max-lg:sr-only">{item.label}</span>
        <LuChevronDown
          size={16}
          aria-hidden
          className={`shrink-0 text-pine-300 transition-transform max-lg:hidden ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-0.5 flex flex-col gap-0.5 max-lg:hidden">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                `ml-[26px] flex items-center gap-2 rounded-md py-1.5 pl-4 pr-3 text-small font-medium transition-colors focus-visible:outline-brass-300 ${
                  isActive ? 'bg-pine-900 text-white shadow-[inset_3px_0_0_0_var(--color-brass-500)]' : 'text-pine-200 hover:bg-pine-700 hover:text-white'
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

NavGroup.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    children: PropTypes.arrayOf(
      PropTypes.shape({ to: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
    ).isRequired,
  }).isRequired,
};

/** The green rail: brand, navigation, and which hunt is loaded. */
function Sidebar() {
  const { hunt, loading } = useHunt();

  return (
    <aside className="sticky top-0 flex h-screen flex-col bg-pine-800 text-white print:hidden">
      <NavLink to="/" className="flex items-center gap-3 px-4 pb-5 pt-5 focus-visible:outline-brass-300">
        <img src="./dog.svg" alt="" width={36} height={36} className="shrink-0 rounded-md bg-white/10 p-1" />
        <span className="font-serif text-[22px] font-semibold leading-none tracking-tight max-lg:sr-only">TrackHounds</span>
      </NavLink>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {navigation.map((item) => (item.children ? <NavGroup key={item.label} item={item} /> : <NavItem key={item.to} item={item} />))}
        <div className="mt-auto pt-3">
          <NavItem item={{ label: 'Docs and help', to: '/docs', icon: LuBookOpen }} />
        </div>
      </nav>

      <div className="border-t border-pine-700 px-4 py-4 max-lg:hidden">
        {loading ? (
          <div className="h-10 animate-pulse rounded-md bg-pine-700/60" />
        ) : hunt ? (
          <div className="min-w-0">
            <p className="text-tiny text-pine-300">Current hunt</p>
            <p className="truncate text-body font-medium text-white" title={hunt.title}>
              {hunt.title}
            </p>
            <p className="truncate text-small text-pine-200">
              {[hunt.dates, STAKE_LABELS[hunt.stake]].filter(Boolean).join(', ')}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-small text-pine-200">No hunt loaded</p>
            <NavLink to="/hunt/create" className="text-small font-medium text-brass-300 hover:text-brass-100 focus-visible:outline-brass-300">
              Create a hunt
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
