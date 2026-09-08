import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { LuPrinter } from 'react-icons/lu';
import { useReactToPrint } from 'react-to-print';
import DogService from '../services/DogService';
import { Button, EmptyState, Panel, PanelHeader } from './ui';

/**
 * The printable sheet. The header repeats on every printed page (table-header-group) and rows
 * never split across pages; see the print rules in index.css.
 */
function ReportGenerator({ hunt, day, title, columns, columnGroups, data, options }) {
  const contentRef = useRef(null);
  const [startTime, setStartTime] = useState('');

  useEffect(() => {
    if (!day) return;
    DogService.getStartTime(day).then((result) => setStartTime(result instanceof Error ? 'not set' : result || 'not set'));
  }, [day]);

  const print = useReactToPrint({ contentRef, documentTitle: title });

  const numericColumn = (index) => data.length > 0 && data.every((row) => row[index] === '' || row[index] === null || !Number.isNaN(Number(row[index])));

  return (
    <Panel>
      <PanelHeader
        title={title}
        description={options ? undefined : 'Preview of the printed sheet'}
        actions={
          <Button variant="primary" icon={LuPrinter} onClick={print} disabled={data.length === 0}>
            Print
          </Button>
        }
      />
      {options && <div className="border-b border-line bg-sunken px-5 py-3">{options}</div>}

      <div className="overflow-x-auto p-5 print:p-0">
        <div ref={contentRef} className="report-sheet mx-auto max-w-[1000px] bg-white text-ink print:max-w-none">
          <div className="report-sheet__header">
            <div className="mb-4 border-b-2 border-pine-700 pb-3">
              <h2 className="font-serif text-[24px] font-semibold leading-tight text-pine-800">{title}</h2>
              <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-0.5 text-small text-ink-muted">
                <span>
                  Hunt <span className="text-ink">{hunt?.title || 'not set'}</span>
                </span>
                {hunt?.dates && (
                  <span>
                    Dates <span className="text-ink">{hunt.dates}</span>
                  </span>
                )}
                {day && (
                  <span>
                    Day <span className="text-ink">{day}</span>
                  </span>
                )}
                {day && (
                  <span>
                    Start time <span className="text-ink tabular">{startTime}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="report-sheet__body">
            {data.length === 0 ? (
              <EmptyState compact title="Nothing to print yet" description="This report has no rows for the current selection." />
            ) : (
              <table className="report-table w-full border-collapse text-[13px]">
                <thead>
                  {columnGroups ? (
                    <>
                      <tr>
                        <th className="border-b border-line-strong px-2 py-1.5 text-left font-medium text-ink-muted">{columns[0]}</th>
                        {columnGroups.map((group) => (
                          <th key={group.title} colSpan={group.span} className="border-b border-l border-line-strong px-2 py-1.5 text-center font-medium text-ink">
                            {group.title}
                          </th>
                        ))}
                        <th className="border-b border-l border-line-strong px-2 py-1.5 text-right font-medium text-ink-muted">{columns[columns.length - 1]}</th>
                      </tr>
                      <tr>
                        <th className="border-b border-line-strong"></th>
                        {columns.slice(1, columns.length - 1).map((column, index) => (
                          <th key={index} className={`border-b border-line-strong px-2 py-1.5 text-right font-medium text-ink-muted ${index % 4 === 0 ? 'border-l' : ''}`}>
                            {column}
                          </th>
                        ))}
                        <th className="border-b border-l border-line-strong"></th>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      {columns.map((column, index) => (
                        <th key={index} className={`border-b border-line-strong px-2 py-1.5 font-medium text-ink-muted ${numericColumn(index) ? 'text-right' : 'text-left'}`}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-sunken' : ''}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`border-b border-line px-2 py-1 ${numericColumn(cellIndex) ? 'text-right tabular' : 'text-left'} ${
                            columnGroups && cellIndex > 0 && (cellIndex - 1) % 4 === 0 ? 'border-l border-line-strong' : ''
                          } ${columnGroups && cellIndex === row.length - 1 ? 'border-l border-line-strong font-semibold' : ''}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

ReportGenerator.propTypes = {
  hunt: PropTypes.shape({ title: PropTypes.string, dates: PropTypes.string }),
  day: PropTypes.number,
  title: PropTypes.string.isRequired,
  columns: PropTypes.arrayOf(PropTypes.node).isRequired,
  columnGroups: PropTypes.arrayOf(PropTypes.shape({ title: PropTypes.string, span: PropTypes.number })),
  data: PropTypes.arrayOf(PropTypes.array).isRequired,
  options: PropTypes.node,
};

export default ReportGenerator;
