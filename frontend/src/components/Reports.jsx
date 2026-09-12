import { useEffect, useMemo, useState } from 'react';
import { LuChevronRight, LuSettings2 } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import ReportGenerator from './ReportGenerator';
import { CustomLimitSelector } from './Reports/CustomLimitSelector';
import { DailyCustomLimitSelector } from './Reports/DailyCustomTopDogsReport';
import { DogNumberSelector } from './Reports/DogDetailScoresReport';
import { DaySelector } from './Reports/DogScoresByDayReport';
import { JudgeNumberSelector } from './Reports/JudgeDetailScoresReport';
import { DailySpeedAndDriveLimitSelector } from './Reports/SpeedAndDriveD.jsx';
import { OverallTopDogsLimitSelector } from './Reports/SpeedAndDriveO.jsx';
import { DayAndStakeTypeSelector } from './Reports/TopDogsByDayAndStakeTypeReport';
import { StakeTypeSelector } from './Reports/TopDogsByStakeTypeReport';
import reportGroups, { allReports } from './Reports/index.js';
import { PageHeader, Panel, PanelHeader } from './ui';

const configComponents = {
  DaySelector,
  StakeTypeSelector,
  DayAndStakeTypeSelector,
  CustomLimitSelector,
  DailyCustomLimitSelector,
  DogNumberSelector,
  JudgeNumberSelector,
  OverallTopDogsLimitSelector,
  DailySpeedAndDriveLimitSelector,
};

/** Report catalogue at /reports and one report at /reports/:reportId. */
function Reports() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { hunt } = useHunt();
  const selectedReport = useMemo(() => allReports.find((report) => report.id === reportId) || null, [reportId]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportConfig, setReportConfig] = useState({});

  useEffect(() => {
    setReportData(null);
    setReportConfig(selectedReport?.defaultConfig || {});
  }, [selectedReport]);

  useEffect(() => {
    if (!selectedReport?.fetchData) return undefined;
    // The options are reset to the report's defaults by the effect above; until that has happened
    // a report with defaults would be fetched once with an empty configuration (day "undefined").
    if (selectedReport.defaultConfig && Object.keys(reportConfig).length === 0) return undefined;
    let cancelled = false;
    setLoading(true);
    selectedReport
      .fetchData(reportConfig)
      .then((result) => {
        if (!cancelled) setReportData(result);
      })
      .catch((err) => console.error('Error generating report:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedReport, reportConfig]);

  if (reportId && !selectedReport) {
    navigate('/reports', { replace: true });
    return null;
  }

  if (selectedReport) {
    const Options = selectedReport.configComponent ? configComponents[selectedReport.configComponent] : null;
    return (
      <>
        <PageHeader backTo="/reports" backLabel="All reports" title={selectedReport.title} description={selectedReport.description} />
        {loading && !reportData ? (
          <Panel>
            <PanelHeader title={selectedReport.title} description="Preparing the report" />
          </Panel>
        ) : (
          <ReportGenerator
            hunt={hunt || undefined}
            day={reportConfig.day || undefined}
            title={reportData?.title || selectedReport.title}
            columns={reportData?.columns || []}
            columnGroups={reportData?.columnGroups}
            data={reportData?.data || []}
            facts={reportData?.facts}
            sections={reportData?.sections}
            options={Options ? <Options onChange={setReportConfig} config={reportConfig} /> : null}
          />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader title="Reports" description="Printable sheets for the hunt. Pick one, adjust its options, then print." />
      <div className="grid gap-6 lg:grid-cols-3">
        {reportGroups.map((group) => (
          <Panel key={group.type} className="self-start">
            <PanelHeader title={group.type} />
            <ul className="divide-y divide-line">
              {group.items.map((report) => (
                <li key={report.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="group flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-pine-50 focus-visible:outline-offset-[-2px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink group-hover:text-pine-800">{report.title}</p>
                      {report.description && <p className="mt-0.5 text-small text-ink-muted">{report.description}</p>}
                    </div>
                    {report.configComponent && <LuSettings2 size={16} className="mt-1 shrink-0 text-ink-faint" aria-label="Has options" />}
                    <LuChevronRight size={16} className="mt-1 shrink-0 text-ink-faint group-hover:text-pine-700" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </>
  );
}

export default Reports;
