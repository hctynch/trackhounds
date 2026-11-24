import { useEffect, useMemo, useState } from 'react';
import { LuAward, LuPencil, LuPlus, LuPrinter, LuTrash2 } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import { AWARD_SUGGESTIONS, showsStake } from '../lib/hunt';
import AwardService from '../services/AwardService';
import DogService from '../services/DogService';
import { Alert, Badge, Button, ConfirmDialog, DataTable, Dialog, EmptyState, Field, IconButton, Input, PageHeader, Panel, StakeBadge, useToast } from './ui';

const emptyAward = { title: '', dogNumber: '', notes: '' };

/**
 * Special awards: distinctions the hunt gives to a dog outside the scoring, such as Best Mouth or
 * Classiest Hound. Each award is a name and a dog; they print on the Special awards sheet, on the
 * hunt summary and beside the dog on the final standings.
 */
function Awards() {
  const toast = useToast();
  const { hunt, loading: huntLoading } = useHunt();
  const [awards, setAwards] = useState([]);
  const [dogsByNumber, setDogsByNumber] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editor, setEditor] = useState(null); // { id | null, values }
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const [list, dogs] = await Promise.all([AwardService.getAwards(), DogService.getDogs()]);
    if (Array.isArray(list)) {
      setAwards(list);
      setLoadError('');
    } else {
      setAwards([]);
      setLoadError(list?.message || 'The awards could not be loaded.');
    }
    const byNumber = {};
    (Array.isArray(dogs) ? dogs : []).forEach((dog) => {
      byNumber[String(dog.number)] = dog;
    });
    setDogsByNumber(byNumber);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [hunt]);

  // The usual names first, then whatever this hunt has already used, without repeats.
  const suggestions = useMemo(() => {
    const names = [...AWARD_SUGGESTIONS];
    awards.forEach((award) => {
      if (award.title && !names.some((name) => name.toLowerCase() === award.title.toLowerCase())) names.push(award.title);
    });
    return names;
  }, [awards]);

  const openAdd = () => {
    setErrors({});
    setEditor({ id: null, values: emptyAward });
  };
  const openEdit = (award) => {
    setErrors({});
    setEditor({ id: award.id, values: { title: award.title || '', dogNumber: award.dogNumber || '', notes: award.notes || '' } });
  };
  const closeEditor = () => setEditor(null);
  const setValue = (field, value) => {
    setEditor((current) => ({ ...current, values: { ...current.values, [field]: value } }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const typedDog = editor ? dogsByNumber[editor.values.dogNumber.trim()] : null;

  const save = async (event) => {
    event.preventDefault();
    const values = { title: editor.values.title.trim(), dogNumber: editor.values.dogNumber.trim(), notes: editor.values.notes.trim() };
    const found = {};
    if (!values.title) found.title = 'Name the award, for example Best Mouth.';
    if (!values.dogNumber) found.dogNumber = 'Enter the number of the dog that won it.';
    else if (!dogsByNumber[values.dogNumber]) found.dogNumber = `Dog ${values.dogNumber} is not registered in this hunt.`;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const result = editor.id ? await AwardService.updateAward(editor.id, values) : await AwardService.createAward(values);
    setSaving(false);
    if (!result || !result.id) {
      setErrors(result?.fields || { title: result?.message || 'The award could not be saved.' });
      return;
    }
    await load();
    toast.success(`${result.title} ${editor.id ? 'updated' : 'given'}: dog ${result.dogNumber}${result.dogName ? `, ${result.dogName}` : ''}.`);
    closeEditor();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const result = await AwardService.deleteAward(pendingDelete.id);
    setDeleting(false);
    if (result && result.message) {
      toast.error(result.message);
      return;
    }
    setAwards((current) => current.filter((award) => award.id !== pendingDelete.id));
    toast.success(`${pendingDelete.title} removed from dog ${pendingDelete.dogNumber}.`);
    setPendingDelete(null);
  };

  const columns = [
    { key: 'title', header: 'Award', render: (award) => <span className="font-medium">{award.title}</span> },
    { key: 'dogNumber', header: 'Dog', numeric: true, width: '5rem', cellClassName: 'font-semibold' },
    {
      key: 'dogName',
      header: 'Name',
      render: (award) =>
        award.dogName ? (
          <span className="inline-flex items-center gap-2">
            <span>{award.dogName}</span>
            {showsStake(hunt, award.stake) && <StakeBadge stake={award.stake} />}
            {award.scratched && <Badge tone="warning">Scratched</Badge>}
          </span>
        ) : (
          <span className="text-ink-faint">Not registered</span>
        ),
    },
    { key: 'owner', header: 'Owner', cellClassName: 'text-ink-muted' },
    { key: 'notes', header: 'Notes', cellClassName: 'text-ink-muted' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '5.5rem',
      render: (award) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={LuPencil} label={`Edit ${award.title} for dog ${award.dogNumber}`} onClick={() => openEdit(award)} />
          <IconButton icon={LuTrash2} label={`Remove ${award.title} from dog ${award.dogNumber}`} tone="danger" onClick={() => setPendingDelete(award)} />
        </div>
      ),
    },
  ];

  const noDogs = !loading && Object.keys(dogsByNumber).length === 0;

  return (
    <>
      <PageHeader
        title="Special awards"
        description="Awards given to a dog outside the scoring, such as Best Mouth or Classiest Hound. They print on the Special awards sheet, on the hunt summary, and beside the dog on the final standings."
        actions={
          <>
            <Link to="/reports/special-awards" className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3.5 text-body font-medium text-ink transition-colors hover:border-pine-300 hover:bg-pine-50">
              <LuPrinter size={16} aria-hidden />
              Print sheet
            </Link>
            <Button variant="primary" icon={LuPlus} onClick={openAdd} disabled={!hunt || noDogs}>
              Add award
            </Button>
          </>
        }
      />

      {!huntLoading && !hunt && (
        <Alert tone="warning" title="No hunt loaded" className="mb-6">
          <Link to="/hunt/create" className="font-medium underline">
            Create a hunt
          </Link>{' '}
          before giving awards.
        </Alert>
      )}
      {loadError && <Alert tone="danger" title={loadError} className="mb-6" />}

      <Panel>
        <DataTable
          columns={columns}
          rows={awards}
          rowKey={(award) => award.id}
          empty={
            loading ? (
              <p className="text-center text-small text-ink-muted">Loading awards</p>
            ) : (
              <EmptyState
                icon={LuAward}
                title="No awards yet"
                description={
                  noDogs
                    ? 'Awards go to registered dogs. Register the dogs first.'
                    : 'Add an award when the hunt has decided it: name the award and enter the number of the dog that won it.'
                }
                action={
                  noDogs ? (
                    <Link to="/dogs/add" className="text-small font-medium text-pine-700 hover:underline">
                      Add dogs
                    </Link>
                  ) : hunt ? (
                    <Button variant="primary" icon={LuPlus} onClick={openAdd}>
                      Add award
                    </Button>
                  ) : null
                }
              />
            )
          }
        />
      </Panel>

      <Dialog
        open={Boolean(editor)}
        onClose={closeEditor}
        title={editor?.id ? 'Edit award' : 'Add award'}
        description="An award is a name and the dog that won it. The same award can go to more than one dog, for instance one per stake."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeEditor} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="award-form" loading={saving}>
              {editor?.id ? 'Save changes' : 'Add award'}
            </Button>
          </>
        }
      >
        {editor && (
          <form id="award-form" onSubmit={save} noValidate className="flex flex-col gap-4">
            <Field label="Award" required error={errors.title}>
              {({ id, invalid }) => (
                <>
                  <Input id={id} invalid={invalid} value={editor.values.title} onChange={(event) => setValue('title', event.target.value)} placeholder="Best Mouth" autoFocus />
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setValue('title', name)}
                        className={`rounded-sm border px-2 py-0.5 text-small transition-colors ${
                          editor.values.title.trim().toLowerCase() === name.toLowerCase()
                            ? 'border-pine-700 bg-pine-700 text-white'
                            : 'border-line-strong text-ink-muted hover:border-pine-300 hover:bg-pine-50 hover:text-ink'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </Field>
            <Field
              label="Dog number"
              required
              error={errors.dogNumber}
              hint={
                typedDog ? (
                  <span className="inline-flex flex-wrap items-center gap-2 text-ink">
                    {typedDog.name}
                    {showsStake(hunt, typedDog.stake) && <StakeBadge stake={typedDog.stake} />}
                    {typedDog.owner ? <span className="text-ink-muted">owner {typedDog.owner}</span> : null}
                  </span>
                ) : editor.values.dogNumber.trim() ? (
                  'No registered dog has this number.'
                ) : undefined
              }
            >
              {({ id, invalid }) => (
                <Input id={id} type="text" inputMode="numeric" invalid={invalid} value={editor.values.dogNumber} onChange={(event) => setValue('dogNumber', event.target.value)} className="tabular" />
              )}
            </Field>
            <Field label="Notes" hint="Optional. Printed with the award." error={errors.notes}>
              {({ id, invalid }) => <Input id={id} invalid={invalid} value={editor.values.notes} onChange={(event) => setValue('notes', event.target.value)} />}
            </Field>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        busy={deleting}
        danger
        title={pendingDelete ? `Remove ${pendingDelete.title}?` : ''}
        description={pendingDelete ? `The award is taken away from dog ${pendingDelete.dogNumber}${pendingDelete.dogName ? `, ${pendingDelete.dogName}` : ''}. The dog and its scores are not affected.` : ''}
        confirmLabel="Remove award"
      />
    </>
  );
}

export default Awards;
