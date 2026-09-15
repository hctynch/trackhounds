import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { LuBug, LuDownload, LuExternalLink, LuFileText, LuFolderOpen, LuLifeBuoy, LuRefreshCw } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { getAppInfo } from '../config';
import { openExternal } from '../lib/download';
import { fetchLatestRelease } from '../lib/updates';
import { compareVersions } from '../lib/version';
import DataService from '../services/DataService';
import { Button, PageHeader, Panel, PanelBody, PanelHeader, useToast } from './ui';

const RELEASES_URL = 'https://github.com/hctynch/trackhounds/releases/latest';
const ISSUES_URL = 'https://github.com/hctynch/trackhounds/issues';

function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={(event) => openExternal(event, href)} className="inline-flex items-center gap-1 font-medium text-pine-700 underline-offset-2 hover:underline">
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

function QuickStartPhase({ title, children }) {
  return (
    <div>
      <p className="mb-1.5 text-small font-semibold text-pine-700">{title}</p>
      <ol className="list-decimal space-y-2 pl-5 text-body">{children}</ol>
    </div>
  );
}

QuickStartPhase.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node };

function Docs() {
  const toast = useToast();
  const [appInfo, setAppInfo] = useState(null);
  const [update, setUpdate] = useState({ state: 'idle' }); // idle | checking | latest | newer | failed

  // Only on a click: GitHub is asked for the latest release and its tag is compared with this build.
  const checkForUpdates = async () => {
    setUpdate({ state: 'checking' });
    try {
      const latest = await fetchLatestRelease();
      const comparison = compareVersions(latest.version, appInfo?.version);
      if (comparison === null) {
        setUpdate({ state: 'failed', message: `The latest release is ${latest.version}; this version could not be compared with it.` });
      } else if (comparison > 0) {
        setUpdate({ state: 'newer', version: latest.version, url: latest.url });
      } else {
        setUpdate({ state: 'latest', version: latest.version });
      }
    } catch {
      setUpdate({ state: 'failed', message: 'GitHub could not be reached. Check the internet connection and try again.' });
    }
  };

  const openFolder = async (target) => {
    const result = await DataService.openFolder(target);
    if (result?.message && !result.opened) toast.error(result.message);
  };

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
        description="A quick start for running a hunt, how scoring works, where the data lives, and what to do when something goes wrong."
        meta={appInfo ? <span className="text-small text-ink-muted">Version {appInfo.version}</span> : null}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title="Quick start" description="The whole hunt in order. The Home page checklist tracks the setup steps." />
            <PanelBody className="space-y-5">
              <QuickStartPhase title="Before the hunt">
                <li>
                  <span className="font-medium">Create the hunt</span> from Home: title, dates, number of days (1 to 4), scoring interval in minutes, first-dog points, point step and stake. In a dual stake hunt, number ranges give every dog its stake from its number.
                </li>
                <li>
                  <span className="font-medium">Add the judges</span> with their numbers. The member PIN is only a reference.
                </li>
                <li>
                  <span className="font-medium">Register the dogs</span> on Add dogs. Type them in rows (arrow keys move between cells, sire and dam suggest names already typed) or use Import CSV with the columns <Code>number, name, stake, sire, dam, owner</Code>. Leading zeros count: 0 and 00 are different dogs.
                </li>
              </QuickStartPhase>
              <QuickStartPhase title="Each day">
                <li>
                  <span className="font-medium">Set the start time</span> with the first cross of the day on Enter scores. Every later cross that day is scored in intervals from it.
                </li>
                <li>
                  <span className="font-medium">Enter each cross</span>: day, cross time, judge, then the dogs in crossing order. Points fill in from the hunt&apos;s first-dog points and point step and can be overridden. Enter moves through the rows and saves. An unregistered dog can be registered on the spot or skipped, and the other dogs keep their places.
                </li>
                <li>
                  <span className="font-medium">Scratch</span> any dog withdrawn from the hunt on the scratch sheet, with the day, time, judge and reason.
                </li>
                <li>
                  <span className="font-medium">Print Daily speed and drive</span> from Reports at the end of the day. Home shows the standings as scores come in.
                </li>
              </QuickStartPhase>
              <QuickStartPhase title="End of the hunt">
                <li>
                  <span className="font-medium">Print the final sheets</span>: Hunt summary (one page with settings, entries, placings and scratches), Overall speed and drive, All dogs all days, Scratches and Judge summary.
                </li>
                <li>
                  <span className="font-medium">Save a backup</span> on the <Link to="/data" className="font-medium text-pine-700 hover:underline">Backups</Link> page, or download a copy to another drive. The same page keeps finished hunts as past hunts, so a hunt can be opened again later.
                </li>
                <li>
                  <span className="font-medium">Start the next hunt</span> with New hunt on Home. It clears the dogs, judges, scores and scratches of the current one, so print first.
                </li>
              </QuickStartPhase>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Fixing mistakes" />
            <PanelBody>
              <dl className="grid gap-x-6 gap-y-3 text-body sm:grid-cols-[auto_1fr]">
                <dt className="font-medium">A wrong score</dt>
                <dd className="text-ink-muted">Delete the line on View scores and enter the cross again. Scores cannot be edited in place; every dog&apos;s points are recalculated.</dd>
                <dt className="font-medium">A wrong start time</dt>
                <dd className="text-ink-muted">Use Change start time on Enter scores. The day&apos;s crosses are re-sorted into intervals from the new time.</dd>
                <dt className="font-medium">A wrong dog number</dt>
                <dd className="text-ink-muted">Open the dog from All dogs and change its number. Its scores and scratches move with it.</dd>
                <dt className="font-medium">Scratched by mistake</dt>
                <dd className="text-ink-muted">Remove the scratch on the scratch sheet. The dog is no longer marked as scratched unless another scratch remains.</dd>
                <dt className="font-medium">Wrong hunt settings</dt>
                <dd className="text-ink-muted">Edit hunt on Home. Changing the number ranges does not change the stake of dogs already registered.</dd>
              </dl>
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
                  <li>TrackHounds has its own window. If that window cannot open, the page is shown with Microsoft Edge or, without Edge, in the default browser; the tray icon then closes TrackHounds.</li>
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
              {appInfo?.canOpenFolders && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" icon={LuFolderOpen} onClick={() => openFolder('data')}>
                    Open data folder
                  </Button>
                  <Button size="sm" icon={LuFileText} onClick={() => openFolder('log')}>
                    Show log file
                  </Button>
                </div>
              )}
              <div className="flex gap-3 rounded-md bg-brass-100 px-3.5 py-3 text-small text-brass-700">
                <LuFolderOpen size={18} className="mt-px shrink-0" aria-hidden />
                <div>
                  <p className="font-medium">Back up without closing TrackHounds</p>
                  <p className="mt-0.5">
                    All hunt data lives in <Code>trackhounds.db</Code> inside the data folder. The <Link to="/data" className="font-medium underline">Backups</Link> page saves, downloads and restores copies while TrackHounds runs, and keeps past hunts.
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
                    Run the newer installer over the existing installation. Your data is kept. TrackHounds never checks for updates on its own; the button below asks GitHub only when you click it.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Button size="sm" icon={LuRefreshCw} loading={update.state === 'checking'} disabled={!appInfo} onClick={checkForUpdates}>
                      Check for updates
                    </Button>
                    {update.state === 'latest' && <span className="text-success-700">This is the latest version ({update.version}).</span>}
                    {update.state === 'newer' && (
                      <span className="text-ink">
                        Version {update.version} is available. <ExternalLink href={update.url}>Open the download page</ExternalLink>
                      </span>
                    )}
                    {update.state === 'failed' && <span className="text-warning-700">{update.message}</span>}
                  </div>
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
