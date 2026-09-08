import PropTypes from 'prop-types';

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/**
 * Ledger-style table. Columns declare their alignment; numeric columns get tabular figures.
 *
 * column: { key, header, align, numeric, width, render(row, index), headerClassName, cellClassName }
 */
function DataTable({ columns, rows, rowKey, empty, dense = false, stickyHeader = false, className = '', rowClassName }) {
  const cellPad = dense ? 'px-3 py-1.5' : 'px-4 py-2.5';
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-body">
        <thead className={stickyHeader ? 'sticky top-0 z-[1] bg-surface' : ''}>
          <tr className="border-b border-line-strong">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={`${cellPad} whitespace-nowrap text-small font-medium text-ink-muted ${alignClass[column.align || (column.numeric ? 'right' : 'left')]} ${column.headerClassName || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && empty ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row, index) : index}
                className={`border-b border-line last:border-b-0 hover:bg-pine-50/70 ${rowClassName ? rowClassName(row, index) : ''}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${cellPad} align-middle ${alignClass[column.align || (column.numeric ? 'right' : 'left')]} ${column.numeric ? 'tabular' : ''} ${column.cellClassName || ''}`}
                  >
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.node,
      align: PropTypes.oneOf(['left', 'right', 'center']),
      numeric: PropTypes.bool,
      width: PropTypes.string,
      render: PropTypes.func,
      headerClassName: PropTypes.string,
      cellClassName: PropTypes.string,
    }),
  ).isRequired,
  rows: PropTypes.array.isRequired,
  rowKey: PropTypes.func,
  empty: PropTypes.node,
  dense: PropTypes.bool,
  stickyHeader: PropTypes.bool,
  className: PropTypes.string,
  rowClassName: PropTypes.func,
};

export default DataTable;
