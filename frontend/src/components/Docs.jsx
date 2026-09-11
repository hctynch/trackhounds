import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { LuBug, LuDownload, LuExternalLink, LuFolderOpen, LuLifeBuoy, LuRefreshCw } from 'react-icons/lu';
import { getAppInfo } from '../config';
import { PageHeader, Panel, PanelBody, PanelHeader } from './ui';

const RELEASES_URL = 'https://github.com/hctynch/trackhounds/releases/latest';
const ISSUES_URL = 'https://github.com/hctynch/trackhounds/issues';

function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-pine-700 underline-offset-2 hover:underline">
      {children}
      <LuExternalLink size={13} aria-hidden />
    </a>
  );
}

ExternalLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function Code({ children }) {
  return <code className="rounded-sm bg-pine-100 px-1 py-0.5 font-mono text-[13px] text-pine-800">{children}</code>;
}

Code.propTypes = { children: PropTypes.node };

function Docs() {
  const [appInfo, setAppInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAppInfo().then((info) => {
      if (!cancelled) setAppInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dataDir = appInfo?.dataDir || '%LOCALAPPDATA%\\TrackHounds';

  return (
    <>
      <PageHeader
        title="Docs and help"
        description="How TrackHounds works, where it keeps your data, and what to do when something goes wrong."
        meta={appInfo ? <span className="text-small text-ink-muted">Version {appInfo.version}</span> : null}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title="Working through a hunt" />
            <PanelBody>
              <ol className="list-decimal space-y-2 pl-5 text-body">
                <li>
                  <span className="font-medium">Create the hunt</span> from Home: title, dates, scoring interval, point step and stake.
                </li>
                <li>
                  <span className="font-medium">Add judges</span>, then <span className="font-medium">add dogs</span>. Dogs take their stake from their number when the hunt defines number ranges.
                </li>
                <li>
                  <span className="font-medium">Enter scores</span> one cross at a time: day, start and cross time, judge, then the dogs in crossing order. Points fill in from the first-dog points and the hunt&apos;s point step, and can be overridden.
                </li>
                <li>
                  <span className="font-medium">Scratch</span> any dog withdrawn from the hunt from the scratch sheet.
                </li>
                <li>
                  <span className="font-medium">Print reports</span> at the end of each day and at the end of the hunt. Standings on Home update as scores come in.
                </li>
              </ol>
              <p className="mt-4 text-small text-ink-muted">
                Creating a new hunt clears the current one. Print what you need before starting the next hunt.
              </p>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="How scoring works" />
            <PanelBody className="space-y-3 text-body">
              <p>
                Each cross awards the first dog the first-dog points and every following dog the point step less (normally 5 points). Separately, the hunt has a scoring interval in minutes: counted from the day&apos;s start time, only a dog&apos;s highest cross within each interval is scored. A scratched dog keeps its points, stays in the standings and is marked as scratched on every report.
              </p>
              <p>
                Daily standings show speed and drive (the counted points for the day) and endurance, which adds ten percent per day: day 1 adds 10%, day 2 adds 20%, and so on. Overall standings add every day together.
              </p>
              <p>In a dual stake, all-age and derby dogs are scored as two separate crosses even when they cross together.</p>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Troubleshooting" />
            <PanelBody className="space-y-5">
              <div>
                <p className="flex items-center gap-2 font-medium">
                  <LuBug size={16} className="text-ink-muted" aria-hidden />
                  The window did not open
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-small text-ink-muted">
                  <li>Right-click the TrackHounds icon in the system tray (next to the clock) and choose Open TrackHounds.</li>
                  <li>TrackHounds shows its window with Microsoft Edge, which is part of Windows. Without Edge the page opens in the default browser.</li>
                  <li>Any browser on this computer can open the address shown under This installation.</li>
                </ul>
              </div>
              <div>
                <p className="flex items-center gap-2 font-medium">
                  <LuBug size={16} className="text-ink-muted" aria-hidden />
                  TrackHounds does not start
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-small text-ink-muted">
                  <li>If it is already running, starting it again opens another window on the running copy.</li>
                  <li>
                    Check the newest file in the <Code>logs</Code> folder inside the data folder and attach it when reporting a problem.
                  </li>
                  <li>Running the installer again repairs the installation and keeps your data.</li>
                </ul>
              </div>
              <div>
                <p className="flex items-center gap-2 font-medium">
                  <LuBug size={16} className="text-ink-muted" aria-hidden />
                  Starting over with an empty database
                </p>
                <p className="mt-1.5 text-small text-ink-muted">
                  Close TrackHounds, then rename or delete <Code>trackhounds.db</Code> in the data folder. An empty database is created on the next start. Creating a new hunt inside the application has the same effect for hunt data.
                </p>
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title="This installation" />
            <PanelBody className="space-y-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-small">
                <dt className="text-ink-muted">Version</dt>
                <dd className="font-medium">{appInfo?.version ?? 'Loading'}</dd>
                <dt className="text-ink-muted">Address</dt>
                <dd className="font-medium tabular">{typeof window !== 'undefined' ? window.location.origin : ''}</dd>
                <dt className="text-ink-muted">Data folder</dt>
                <dd className="break-all font-mono text-[13px]">{dataDir}</dd>
              </dl>
              <div className="flex gap-3 rounded-md bg-brass-100 px-3.5 py-3 text-small text-brass-700">
                <LuFolderOpen size={18} className="mt-px shrink-0" aria-hidden />
                <div>
                  <p className="font-medium">Back up by copying one file</p>
                  <p className="mt-0.5">
                    All hunt data lives in <Code>trackhounds.db</Code> inside the data folder. Close TrackHounds, copy the file somewhere safe, and copy it back to restore. The tray icon menu opens the data folder.
                  </p>
                </div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Installing and updating" />
            <PanelBody className="space-y-4 text-small">
              <div className="flex gap-3">
                <LuDownload size={18} className="mt-px shrink-0 text-ink-muted" aria-hidden />
                <div>
                  <p className="font-medium text-ink">Install</p>
                  <p className="mt-0.5 text-ink-muted">
                    Download <Code>TrackHounds-&lt;version&gt;.exe</Code> from the <ExternalLink href={RELEASES_URL}>latest release</ExternalLink> and run it. Windows may warn that the publisher is unknown: choose More info, then Run anyway. Nothing else is needed, not Docker, Java or an internet connection.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <LuRefreshCw size={18} className="mt-px shrink-0 text-ink-muted" aria-hidden />
                <div>
                  <p className="font-medium text-ink">Update</p>
                  <p className="mt-0.5 text-ink-muted">
                    Run the newer installer over the existing installation. Your data is kept. TrackHounds never checks for updates on its own.
                  </p>
                </div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Support" />
            <PanelBody className="space-y-3 text-small">
              <div className="flex gap-3">
                <LuLifeBuoy size={18} className="mt-px shrink-0 text-ink-muted" aria-hidden />
                <p className="text-ink-muted">
                  Report a problem or ask for a feature on the <ExternalLink href={ISSUES_URL}>issues page</ExternalLink>, or email{' '}
                  <a href="mailto:tynchhunt@gmail.com" className="font-medium text-pine-700 hover:underline">
                    tynchhunt@gmail.com
                  </a>
                  .
                </p>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  );
}

export default Docs;
