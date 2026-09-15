import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuChevronRight, LuCopy, LuPencil, LuPlus, LuSettings2, LuTrash2, LuWandSparkles } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import { DEFAULT_ANSWERS, askedFilters, runDefinition } from '../lib/reports';
import ReportService from '../services/ReportService';
import ReportGenerator from './ReportGenerator';
import DefinitionOptions from './Reports/DefinitionOptions';
import HuntSummaryReport from './Reports/HuntSummaryReport';
import builtinReports from './Reports/builtin';
import { Button, ConfirmDialog, PageHeader, Panel, PanelHeader, useToast } from './ui';

const GROUPS = ['Daily', 'Whole hunt', 'Details', 'Custom'];

/** The one hand-written sheet keeps the old module shape (fetchData). */
const huntSummary = { ...HuntSummaryReport, id: 'hunt-summary', name: HuntSummaryReport.title, group: 'Whole hunt', builtin: true };

/** Whether a sheet asks questions when opened (shown with a settings icon in the catalogue). */
const hasOptions = (report) => (report.fetchData ? Boolean(report.configComponent) : askedFilters(report).length > 0);

/** Report catalogue at /reports and one report at /reports/:reportId. */
function Reports() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hunt } = useHunt();
  const [custom, setCustom] = useState([]);
  const [customLoaded, setCustomLoaded] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadCustom = useCallback(async () => {
    const layouts = await ReportService.getLayouts();
    setCustom(Array.isArray(layouts) ? layouts.map((layout) => ({ ...layout, group: 'Custom', builtin: false })) : []);
    setCustomLoaded(true);
  }, []);

  useEffect(() => {
    loadCustom();
  }, [loadCustom]);

  const allReports = useMemo(() => {
    const builtins = [...builtinReports];
    builtins.splice(2, 0, huntSummary);
    return [...builtins, ...custom];
  }, [custom]);

  const selectedReport = useMemo(() => allReports.find((report) => report.id === reportId) || null, [allReports, reportId]);

  useEffect(() => {
    setReportData(null);
    setError('');
    setAnswers(selectedReport ? { ...DEFAULT_ANSWERS, ...(selectedReport.filters?.dayAllowAll ? { day: 'all' } : {}) } : {});
  }, [selectedReport]);

  useEffect(() => {
    if (!selectedReport) return undefined;
    let cancelled = false;
    setLoading(true);
    const run = selectedReport.fetchData ? selectedReport.fetchData(answers) : runDefinition(selectedReport, answers, hunt);
    run
      .then((result) => {
        if (!cancelled) setReportData(result);
      })
      .catch((err) => {
        console.error('Error generating report:', err);
        if (!cancelled) setError(err?.message || 'The report could not be prepared.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedReport, answers, hunt]);

  useEffect(() => {
    if (reportId && customLoaded && !selectedReport) navigate('/reports', { replace: true });
  }, [reportId, customLoaded, selectedReport, navigate]);

  const duplicate = async (report) => {
    const copy = { ...report, name: `${report.name} (copy)` };
    delete copy.id;
    delete copy.group;
    delete copy.builtin;
    const base = `${report.id}-copy`;
    let id = base;
    for (let n = 2; custom.some((layout) => layout.id === id); n += 1) id = `${base}-${n}`;
    const saved = await ReportService.saveLayout(id, copy);
    if (!saved || !saved.id) {
      toast.error(saved?.message || 'The copy could not be saved.');
      return;
    }
    await loadCustom();
    toast.success(`"${copy.name}" saved under custom reports.`);
    navigate(`/reports/${saved.id}`);
  };

  const remove = async () => {
    setConfirmDelete(false);
    const result = await ReportService.deleteLayout(selectedReport.id);
    if (result && result.message) {
      toast.error(result.message);
      return;
    }
    toast.success(`"${selectedReport.name}" deleted.`);
    await loadCustom();
    navigate('/reports');
  };

  if (selectedReport) {
    const definitionBased = !selectedReport.fetchData;
    const actions = definitionBased ? (
      selectedReport.builtin ? (
        <Button size="sm" icon={LuWandSparkles} onClick={() => navigate(`/reports/builder?from=${selectedReport.id}`)} title="Start a custom report from this sheet">
          Customise
        </Button>
      ) : (
        <>
          <Button size="sm" icon={LuPencil} onClick={() => navigate(`/reports/builder/${selectedReport.id}`)}>
            Edit
          </Button>
          <Button size="sm" icon={LuCopy} onClick={() => duplicate(selectedReport)}>
            Duplicate
          </Button>
          <Button size="sm" icon={LuTrash2} onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </>
      )
    ) : null;
    return (
      <>
        <PageHeader backTo="/reports" backLabel="All reports" title={selectedReport.name} description={selectedReport.description} />
        {loading && !reportData ? (
          <Panel>
            <PanelHeader title={selectedReport.name} description="Preparing the report" />
          </Panel>
        ) : (
          <ReportGenerator
            hunt={hunt || undefined}
            day={reportData?.day || undefined}
            title={reportData?.title || selectedReport.name}
            description={error || undefined}
            columns={reportData?.columns || []}
            columnGroups={reportData?.columnGroups}
            boldColumns={reportData?.boldColumns}
            data={reportData?.data || []}
            facts={reportData?.facts}
            sections={reportData?.sections}
            options={definitionBased ? <DefinitionOptions definition={selectedReport} answers={answers} onChange={setAnswers} /> : null}
            actions={actions}
          />
        )}
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={remove}
          danger
          title={`Delete "${selectedReport.name}"?`}
          description="The saved report layout is removed. The hunt's data is not affected."
          confirmLabel="Delete"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Printable sheets for the hunt. Pick one, adjust its options, then print. Custom reports are built from the hunt's data with the columns you want."
        actions={
          <Button variant="primary" icon={LuPlus} onClick={() => navigate('/reports/builder')}>
            New report
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {GROUPS.map((group) => {
          const items = allReports.filter((report) => report.group === group);
          return (
            <Panel key={group} className="self-start">
              <PanelHeader title={group === 'Custom' ? 'Custom reports' : group} description={group === 'Custom' ? 'Sheets you built. Saved with the application, not the hunt.' : undefined} />
              {items.length === 0 ? (
                <div className="px-5 py-6 text-small text-ink-muted">
                  {customLoaded ? 'No custom reports yet. Open any sheet and choose Customise, or start from New report.' : 'Loading'}
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((report) => (
                    <li key={report.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/reports/${report.id}`)}
                        className="group flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-pine-50 focus-visible:outline-offset-[-2px]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink group-hover:text-pine-800">{report.name}</p>
                          {report.description && <p className="mt-0.5 text-small text-ink-muted">{report.description}</p>}
                        </div>
                        {hasOptions(report) && <LuSettings2 size={16} className="mt-1 shrink-0 text-ink-faint" aria-label="Has options" />}
                        <LuChevronRight size={16} className="mt-1 shrink-0 text-ink-faint group-hover:text-pine-700" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>
    </>
  );
}

export default Reports;
