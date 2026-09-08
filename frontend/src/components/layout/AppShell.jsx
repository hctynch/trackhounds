import PropTypes from 'prop-types';
import Sidebar from './Sidebar';

/** Rail on the left, page on the right. The rail collapses to icons below the lg breakpoint. */
function AppShell({ children }) {
  return (
    <div className="grid min-h-screen grid-cols-[64px_minmax(0,1fr)] lg:grid-cols-[232px_minmax(0,1fr)] print:block">
      <Sidebar />
      <main className="min-w-0 px-6 py-6 lg:px-8 print:p-0">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}

AppShell.propTypes = {
  children: PropTypes.node,
};

export default AppShell;
