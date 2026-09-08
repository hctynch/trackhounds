import PropTypes from 'prop-types';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import HuntService from '../services/HuntService';

const HuntContext = createContext(null);

/**
 * The current hunt, shared by the sidebar and every page. `hunt` is null while nothing has been
 * created; call `refresh()` after creating or editing a hunt.
 */
export function HuntProvider({ children }) {
  const [hunt, setHunt] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await HuntService.getHunt();
    if (data instanceof Error || !data || typeof data !== 'object' || !('title' in data)) {
      setHunt(null);
    } else {
      setHunt(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ hunt, loading, refresh }), [hunt, loading, refresh]);
  return <HuntContext.Provider value={value}>{children}</HuntContext.Provider>;
}

HuntProvider.propTypes = {
  children: PropTypes.node,
};

export function useHunt() {
  const context = useContext(HuntContext);
  if (!context) {
    throw new Error('useHunt must be used inside HuntProvider');
  }
  return context;
}
