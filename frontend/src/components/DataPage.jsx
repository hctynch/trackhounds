import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LuArchive, LuArchiveRestore, LuDownload, LuFolderInput, LuFolderOpen, LuSave, LuTrash2 } from 'react-icons/lu';
import { getAppInfo } from '../config';
import { downloadFile } from '../lib/download';
import { useHunt } from '../hooks/useHunt';
import DataService from '../services/DataService';
import { Alert, Button, ConfirmDialog, DataTable, EmptyState, IconButton, PageHeader, Panel, PanelBody, PanelHeader, useToast } from './ui';

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatWhen = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

/** A hunt as stored in a file, for the tables. */
function HuntCell({ hunt }) {
  if (!hunt) return <span className="text-ink-faint">Unreadable file</span>;
  const parts = [];
  if (hunt.dogs !== undefined) parts.push(`${hunt.dogs} ${hunt.dogs === 1 ? 'dog' : 'dogs'}`);
  if (hunt.scores !== undefined) parts.push(`${hunt.scores} ${hunt.scores === 1 ? 'score' : 'scores'}`);
  return (
    <span className="flex flex-col">
      <span className="font-medium">{hunt.title || 'Untitled hunt'}</span>
      <span className="text-small text-ink-muted">{[hunt.dates, parts.join(', ')].filter(Boolean).join(' · ')}</span>
    </span>
  );
}

HuntCell.propTypes = { hunt: PropTypes.shape({ title: PropTypes.string, dates: PropTypes.string, dogs: PropTypes.number, scores: PropTypes.number }) };

/** A file picker that looks like a button. */
function FileButton({ label, icon, onFile, disabled = false, variant = 'secondary' }) {
  const ref = useRef(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".db,application/octet-stream,application/x-sqlite3,application/vnd.sqlite3"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onFile(file);
        }}
      />
      <Button variant={variant} icon={icon} onClick={() => ref.current?.click()} disabled={disabled}>
        {label}
      </Button>
    </>
  );
}

FileButton.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  onFile: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  variant: PropTypes.string,
};

/**
 * Backups, restores and the library of past hunts. One hunt lives in the database at a time; every
 * file here is a complete copy of one hunt, so a backup, an exported hunt and an archived hunt are
 * the same kind of file.
 */
function DataPage() {
  const toast = useToast();
  const { hunt, refresh } = useHunt();
  const [status, setStatus] = useState(null);
  const [backups, setBackups] = useState([]);
  const [hunts, setHunts] = useState([]);
  const [appInfo, setAppInfo] = useState(null);
  const [busy, setBusy] = useState('');
  const [pending, setPending] = useState(null); // { kind, item, file }
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [nextStatus, nextBackups, nextHunts] = await Promise.all([DataService.getStatus(), DataService.getBackups(), DataService.getHunts()]);
    setStatus(nextStatus && !nextStatus.message ? nextStatus : null);
    setBackups(Array.isArray(nextBackups) ? nextBackups : []);
    setHunts(Array.isArray(nextHunts) ? nextHunts : []);
  }, []);

  useEffect(() => {
    load();
    getAppInfo().then(setAppInfo);
  }, [load]);

  const failed = (result) => {
    if (result && result.message && !result.file && !result.hunt && !result.opened) {
      setError(result.message);
      toast.error(result.message);
      return true;
    }
    return false;
  };

  const run = async (kind, action, success) => {
    setBusy(kind);
    setError('');
    const result = await action();
    setBusy('');
    if (failed(result)) return;
    await Promise.all([load(), refresh()]);
    if (success) toast.success(success(result));
  };

  const confirmPending = async () => {
    const current = pending;
    setPending(null);
    if (!current) return;
    switch (current.kind) {
      case 'restore-upload':
        await run('restore', () => DataService.restore(current.file), (result) => `Restored "${result.hunt?.title}" from ${current.file.name}.`);
        break;
      case 'restore-backup':
        await run('restore', () => DataService.restoreBackup(current.item.file), (result) => `Restored "${result.hunt?.title}" from the backup.`);
        break;
      case 'delete-backup':
        await run('delete', () => DataService.deleteBackup(current.item.file), () => 'Backup deleted.');
        break;
      case 'open-hunt':
        await run('open', () => DataService.openHunt(current.item.file), (result) => `"${result.hunt?.title}" is now the current hunt.`);
        break;
      case 'delete-hunt':
        await run('delete', () => DataService.deleteHunt(current.item.file), () => 'Past hunt deleted.');
        break;
      default:
        break;
    }
  };

  const openFolder = async (target) => {
    const result = await DataService.openFolder(target);
    if (result?.message && !result.opened) toast.error(result.message);
  };

  const canOpen = Boolean(appInfo?.canOpenFolders);

  const dialog = {
    'restore-upload': {
      title: `Restore from ${pending?.file?.name}?`,
      description: 'The current hunt is replaced by the hunt in this file. A safety copy of the current data is saved to backups first.',
      confirmLabel: 'Restore',
    },
    'restore-backup': {
      title: `Restore "${pending?.item?.hunt?.title || pending?.item?.file}"?`,
      description: `The current hunt is replaced by this backup from ${formatWhen(pending?.item?.savedAt)}. A safety copy of the current data is saved first.`,
      confirmLabel: 'Restore',
    },
    'delete-backup': { title: 'Delete this backup?', description: 'The file is removed from the backups folder. This cannot be undone.', confirmLabel: 'Delete', danger: true },
    'open-hunt': {
      title: `Open "${pending?.item?.hunt?.title || pending?.item?.file}"?`,
      description: hunt
        ? `"${hunt.title}" is saved to past hunts first, then replaced by this hunt.`
        : 'This hunt becomes the current hunt.',
      confirmLabel: 'Open hunt',
    },
    'delete-hunt': {
      title: `Delete "${pending?.item?.hunt?.title || pending?.item?.file}"?`,
      description: 'The saved file is removed. The current hunt is not affected. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    },
  }[pending?.kind];

  const backupColumns = [
    { key: 'savedAt', header: 'Saved', width: '11rem', render: (row) => <span className="tabular">{formatWhen(row.savedAt)}</span> },
    { key: 'hunt', header: 'Hunt', render: (row) => <HuntCell hunt={row.hunt} /> },
    { key: 'size', header: 'Size', numeric: true, width: '6rem', render: (row) => formatSize(row.size) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '6rem',
      render: (row) => (
        <span className="inline-flex gap-1">
          <IconButton icon={LuArchiveRestore} label={`Restore backup from ${formatWhen(row.savedAt)}`} onClick={() => setPending({ kind: 'restore-backup', item: row })} disabled={!row.readable} />
          <IconButton icon={LuTrash2} label="Delete backup" tone="danger" onClick={() => setPending({ kind: 'delete-backup', item: row })} />
        </span>
      ),
    },
  ];

  const huntColumns = [
    { key: 'hunt', header: 'Hunt', render: (row) => <HuntCell hunt={row.hunt} /> },
    { key: 'savedAt', header: 'Saved', width: '11rem', render: (row) => <span className="tabular">{formatWhen(row.savedAt)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '9rem',
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          <Button size="sm" onClick={() => setPending({ kind: 'open-hunt', item: row })} disabled={!row.readable || busy !== ''}>
            Open
          </Button>
          <IconButton icon={LuTrash2} label={`Delete ${row.hunt?.title || row.file}`} tone="danger" onClick={() => setPending({ kind: 'delete-hunt', item: row })} />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Backups and past hunts"
        description="Every file here is a complete copy of one hunt. Save a backup before and after each day, and keep finished hunts in the library."
      />

      {error && <Alert tone="danger" title="That did not work" className="mb-6">{error}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader
              title="Backups"
              description={
                status?.lastBackup ? `Last backup ${formatWhen(status.lastBackup)}. Backups are kept in the data folder.` : 'No backup has been saved yet. Backups are kept in the data folder.'
              }
              actions={
                <>
                  <Button
                    icon={LuDownload}
                    disabled={!hunt}
                    title="Download a copy of the current hunt to another folder or drive"
                    onClick={() => downloadFile(DataService.downloadUrl(), `trackhounds-${(hunt?.title || 'hunt').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.db`)}
                  >
                    Download a copy
                  </Button>
                  <Button variant="primary" icon={LuSave} loading={busy === 'backup'} disabled={!hunt} onClick={() => run('backup', () => DataService.createBackup(), () => 'Backup saved.')}>
                    Save a backup
                  </Button>
                </>
              }
            />
            <DataTable
              columns={backupColumns}
              rows={backups}
              rowKey={(row) => row.file}
              empty={<EmptyState compact title="No backups yet" description="Save a backup to keep a copy of the current hunt as it is right now." />}
            />
          </Panel>

          <Panel>
            <PanelHeader title="Restore from a file" description="Use a backup, a downloaded copy, or a hunt file from another computer." />
            <PanelBody className="flex flex-wrap items-center gap-3">
              <FileButton label="Choose a file to restore" icon={LuFolderInput} onFile={(file) => setPending({ kind: 'restore-upload', file })} disabled={busy !== ''} />
              <p className="text-small text-ink-muted">The current hunt is replaced. A safety copy is saved to backups first, so a restore can always be undone.</p>
            </PanelBody>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader
              title="Past hunts"
              description="Finished hunts kept for reference. Opening one saves the current hunt here first."
              actions={
                <Button variant="primary" icon={LuArchive} loading={busy === 'archive'} disabled={!hunt} onClick={() => run('archive', () => DataService.archiveCurrentHunt(), (result) => `"${result.hunt?.title}" saved to past hunts.`)}>
                  Save current hunt
                </Button>
              }
            />
            <DataTable
              columns={huntColumns}
              rows={hunts}
              rowKey={(row) => row.file}
              empty={<EmptyState compact title="No past hunts" description="Save the current hunt here before starting a new one, or import a hunt file." />}
            />
            <PanelBody className="border-t border-line">
              <FileButton label="Import a hunt file" icon={LuFolderInput} onFile={(file) => run('import', () => DataService.importHunt(file), (result) => `"${result.hunt?.title}" added to past hunts.`)} disabled={busy !== ''} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Where the files are" />
            <PanelBody>
              <dl className="grid gap-y-3 text-small">
                {[
                  { label: 'Database', value: status?.databaseFile, size: status?.databaseSize, target: 'data' },
                  { label: 'Backups', value: status?.backupsDir, target: 'backups' },
                  { label: 'Past hunts', value: status?.huntsDir, target: 'hunts' },
                ].map((entry) => (
                  <div key={entry.label} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <dt className="text-ink-muted">
                        {entry.label}
                        {entry.size ? <span className="ml-2 tabular">{formatSize(entry.size)}</span> : null}
                      </dt>
                      <dd className="break-all font-mono text-[12px]">{entry.value || ''}</dd>
                    </div>
                    {canOpen && <IconButton icon={LuFolderOpen} label={`Open the ${entry.label.toLowerCase()} folder`} onClick={() => openFolder(entry.target)} />}
                  </div>
                ))}
              </dl>
              {!canOpen && <p className="mt-3 text-small text-ink-faint">Folders can be opened from here in the desktop application.</p>}
            </PanelBody>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={confirmPending}
        title={dialog?.title || ''}
        description={dialog?.description}
        confirmLabel={dialog?.confirmLabel}
        danger={Boolean(dialog?.danger)}
        busy={busy !== ''}
      />
    </>
  );
}

export default DataPage;
