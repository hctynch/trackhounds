import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { LuPrinter } from 'react-icons/lu';
import { useReactToPrint } from 'react-to-print';
import DogService from '../services/DogService';
import { Button, EmptyState, Panel, PanelHeader } from './ui';

const isNumeric = (value) => value === '' || value === null || value === undefined || !Number.isNaN(Number(value));

/**
 * One table of a printed sheet. The header repeats on every printed page and rows never split.
 * `columnGroups` ({ title, start, span }) put a group heading over a run of columns; grouped runs
 * get a rule on their left and right so the eye can find them.
 */
function SheetTable({ columns, columnGroups = [], boldColumns = [], data }) {
  const numericColumn = (index) => data.length > 0 && data.every((row) => isNumeric(row[index]));
  const groupAt = (index) => columnGroups.find((group) => index >= group.start && index < group.start + group.span);
  const startsGroup = (index) => columnGroups.some((group) => group.start === index);
  const endsGroup = (index) => columnGroups.some((group) => group.start + group.span === index);
  const ruled = (index) => index > 0 && (startsGroup(index) || endsGroup(index));
  const bold = (index) => boldColumns.includes(index);
  const grouped = columnGroups.length > 0;

  return (
    <table className="report-table w-full border-collapse text-[13px]">
      <thead>
        <tr>
          {columns.map((column, index) => {
            const group = groupAt(index);
            if (group && group.start !== index) return null;
            if (group) {
              return (
                <th key={index} colSpan={group.span} className="border-b border-l border-line-strong px-2 py-1.5 text-center font-medium text-ink last:border-r">
                  {group.title}
                </th>
              );
            }
            return (
              <th
                key={index}
                rowSpan={grouped ? 2 : 1}
                className={`border-b border-line-strong px-2 py-1.5 font-medium text-ink-muted ${numericColumn(index) ? 'text-right' : 'text-left'} ${ruled(index) ? 'border-l' : ''} ${grouped ? 'align-bottom' : ''}`}
              >
                {column}
              </th>
            );
          })}
        </tr>
        {grouped && (
          <tr>
            {columns.map((column, index) =>
              groupAt(index) ? (
                <th key={index} className={`border-b border-line-strong px-2 py-1.5 font-medium text-ink-muted ${numericColumn(index) ? 'text-right' : 'text-left'} ${ruled(index) ? 'border-l' : ''}`}>
                  {column}
                </th>
              ) : null,
            )}
          </tr>
        )}
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-sunken' : ''}>
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className={`border-b border-line px-2 py-1 ${numericColumn(cellIndex) ? 'text-right tabular' : 'text-left'} ${ruled(cellIndex) ? 'border-l border-line-strong' : ''} ${
                  bold(cellIndex) ? 'font-semibold' : ''
                }`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const groupShape = PropTypes.shape({ title: PropTypes.string, start: PropTypes.number, span: PropTypes.number });

SheetTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.node).isRequired,
  columnGroups: PropTypes.arrayOf(groupShape),
  boldColumns: PropTypes.arrayOf(PropTypes.number),
  data: PropTypes.arrayOf(PropTypes.array).isRequired,
};

/** Label and value pairs printed above the tables (the hunt summary's front-page facts). */
function FactGrid({ facts }) {
  return (
    <dl className="report-facts mb-5 grid grid-cols-2 gap-x-8 gap-y-1.5 text-[13px] sm:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-col border-b border-line pb-1">
          <dt className="text-small text-ink-muted">{fact.label}</dt>
          <dd className="font-medium tabular">{fact.value === '' || fact.value === null || fact.value === undefined ? '—' : fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

FactGrid.propTypes = {
  facts: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string.isRequired, value: PropTypes.node })).isRequired,
};

/**
 * The printable sheet. A report is either one table (columns + data) or several titled sections,
 * optionally preceded by a grid of facts. See the print rules in index.css.
 */
function ReportGenerator({ hunt, day, title, columns = [], columnGroups, boldColumns, data = [], facts, sections, options, actions, description }) {
  const contentRef = useRef(null);
  const [startTime, setStartTime] = useState('');

  useEffect(() => {
    if (!day) return;
    DogService.getStartTime(day).then((result) => setStartTime(result instanceof Error ? 'not set' : result || 'not set'));
  }, [day]);

  const printInBrowser = useReactToPrint({ contentRef, documentTitle: title });

  // Inside the JavaFX window there is no window.print(); the window prints the sheet itself from
  // its HTML and the page's stylesheets (see Desktop/JavaFxWindow.Bridge). Browsers print the iframe
  // that react-to-print builds.
  const print = () => {
    const bridge = window.trackhoundsWindow;
    if (bridge && typeof bridge.print === 'function' && contentRef.current) {
      const links = Array.from(document.styleSheets)
        .map((sheet) => sheet.href)
        .filter(Boolean)
        .map((href) => new URL(href, window.location.href).href);
      const inline = Array.from(document.querySelectorAll('style'))
        .map((style) => style.textContent || '')
        .join('\n');
      bridge.print(title, contentRef.current.outerHTML, links.join('\n'), inline);
      return;
    }
    printInBrowser();
  };

  const hasSections = Array.isArray(sections) && sections.length > 0;
  const hasFacts = Array.isArray(facts) && facts.length > 0;
  const empty = !hasFacts && !hasSections && data.length === 0;

  return (
    <Panel>
      <PanelHeader
        title={title}
        description={description || (options ? undefined : 'Preview of the printed sheet')}
        actions={
          <>
            {actions}
            <Button variant="primary" icon={LuPrinter} onClick={print} disabled={empty}>
              Print
            </Button>
          </>
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
            {empty ? (
              <EmptyState compact title="Nothing to print yet" description="This report has no rows for the current selection." />
            ) : (
              <>
                {hasFacts && <FactGrid facts={facts} />}
                {hasSections
                  ? sections.map((section) => (
                      <section key={section.title} className="report-section mb-5 last:mb-0">
                        <h3 className="mb-1.5 font-serif text-[17px] font-semibold text-pine-800">{section.title}</h3>
                        {section.data.length === 0 ? (
                          <p className="text-small text-ink-muted">{section.emptyText || 'None.'}</p>
                        ) : (
                          <SheetTable columns={section.columns} columnGroups={section.columnGroups} boldColumns={section.boldColumns} data={section.data} />
                        )}
                      </section>
                    ))
                  : data.length > 0 && <SheetTable columns={columns} columnGroups={columnGroups} boldColumns={boldColumns} data={data} />}
              </>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

const sectionShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  columns: PropTypes.arrayOf(PropTypes.node).isRequired,
  columnGroups: PropTypes.arrayOf(groupShape),
  boldColumns: PropTypes.arrayOf(PropTypes.number),
  data: PropTypes.arrayOf(PropTypes.array).isRequired,
  emptyText: PropTypes.string,
});

ReportGenerator.propTypes = {
  hunt: PropTypes.shape({ title: PropTypes.string, dates: PropTypes.string }),
  day: PropTypes.number,
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  columns: PropTypes.arrayOf(PropTypes.node),
  columnGroups: PropTypes.arrayOf(groupShape),
  boldColumns: PropTypes.arrayOf(PropTypes.number),
  data: PropTypes.arrayOf(PropTypes.array),
  facts: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string.isRequired, value: PropTypes.node })),
  sections: PropTypes.arrayOf(sectionShape),
  options: PropTypes.node,
  actions: PropTypes.node,
};

export default ReportGenerator;
