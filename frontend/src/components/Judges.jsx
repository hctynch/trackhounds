import { useEffect, useMemo, useState } from 'react';
import { LuGavel, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import JudgeService from '../services/JudgeService';
import { Button, ConfirmDialog, DataTable, Dialog, EmptyState, Field, IconButton, Input, PageHeader, Panel, SearchInput, useToast } from './ui';

const emptyJudge = { number: '', memberPin: '', name: '' };

function Judges() {
  const toast = useToast();
  const [judges, setJudges] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null); // { mode: 'add' | 'edit', values }
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const data = await JudgeService.getJudges();
    setJudges(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () => (search ? judges.filter((judge) => judge.number.toString().includes(search.trim())) : judges),
    [judges, search],
  );

  const openAdd = () => {
    setErrors({});
    setEditor({ mode: 'add', values: emptyJudge });
  };
  const openEdit = (judge) => {
    setErrors({});
    setEditor({ mode: 'edit', values: { ...judge, memberPin: judge.memberPin || '' } });
  };
  const closeEditor = () => setEditor(null);
  const setValue = (field) => (event) => {
    setEditor((current) => ({ ...current, values: { ...current.values, [field]: event.target.value } }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const save = async (event) => {
    event.preventDefault();
    const { mode, values } = editor;
    const found = {};
    if (!values.name.trim()) found.name = 'Enter the judge’s name.';
    if (!values.number || Number(values.number) <= 0) found.number = 'Enter a judge number greater than 0.';
    if (mode === 'add' && judges.some((judge) => judge.number === Number(values.number))) found.number = 'That judge number is already taken.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const payload = { number: Number(values.number), memberPin: values.memberPin, name: values.name.trim() };
    const result = mode === 'add' ? await JudgeService.createJudge(payload) : await JudgeService.editJudge(payload);
    setSaving(false);
    if (result instanceof Error) {
      setErrors(result.response?.data?.fields || { name: 'The judge could not be saved.' });
      return;
    }
    await load();
    toast.success(mode === 'add' ? `Judge ${payload.number} added.` : `Judge ${payload.number} updated.`);
    closeEditor();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const result = await JudgeService.deleteJudge(pendingDelete.number);
    setDeleting(false);
    if (result instanceof Error) {
      toast.error(`Judge ${pendingDelete.number} could not be removed.`);
      return;
    }
    setJudges((current) => current.filter((judge) => judge.number !== pendingDelete.number));
    toast.success(`Judge ${pendingDelete.number} removed.`);
    setPendingDelete(null);
  };

  const columns = [
    { key: 'number', header: 'Judge', numeric: true, width: '5rem', cellClassName: 'font-semibold' },
    { key: 'name', header: 'Name', render: (judge) => <span className="font-medium">{judge.name}</span> },
    { key: 'memberPin', header: 'Member PIN', render: (judge) => judge.memberPin || <span className="text-ink-faint">none</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '5.5rem',
      render: (judge) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={LuPencil} label={`Edit judge ${judge.number}`} onClick={() => openEdit(judge)} />
          <IconButton icon={LuTrash2} label={`Remove judge ${judge.number}`} tone="danger" onClick={() => setPendingDelete(judge)} />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Judges"
        description={loading ? 'Loading' : `${judges.length} in this hunt${search ? `, ${visible.length} shown` : ''}`}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Find by judge number" className="w-56" />
            <Button variant="primary" icon={LuPlus} onClick={openAdd}>
              Add judge
            </Button>
          </>
        }
      />

      <Panel>
        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(judge) => judge.number}
          empty={
            loading ? (
              <p className="text-center text-small text-ink-muted">Loading judges</p>
            ) : search ? (
              <EmptyState compact title={`No judge number contains "${search}"`} description="Check the number or clear the search." />
            ) : (
              <EmptyState
                icon={LuGavel}
                title="No judges yet"
                description="Scores are recorded against a judge number, so add the judges before entering scores."
                action={
                  <Button variant="primary" icon={LuPlus} onClick={openAdd}>
                    Add judge
                  </Button>
                }
              />
            )
          }
        />
      </Panel>

      <Dialog
        open={Boolean(editor)}
        onClose={closeEditor}
        title={editor?.mode === 'edit' ? `Edit judge ${editor.values.number}` : 'Add judge'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeEditor} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="judge-form" loading={saving}>
              {editor?.mode === 'edit' ? 'Save changes' : 'Add judge'}
            </Button>
          </>
        }
      >
        {editor && (
          <form id="judge-form" onSubmit={save} noValidate className="flex flex-col gap-4">
            <Field label="Judge number" required error={errors.number} hint={editor.mode === 'edit' ? 'Numbers cannot be changed.' : undefined}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  type="number"
                  numeric
                  min={1}
                  invalid={invalid}
                  value={editor.values.number}
                  onChange={setValue('number')}
                  disabled={editor.mode === 'edit'}
                  autoFocus={editor.mode === 'add'}
                />
              )}
            </Field>
            <Field label="Name" required error={errors.name}>
              {({ id, invalid }) => <Input id={id} invalid={invalid} value={editor.values.name} onChange={setValue('name')} autoFocus={editor.mode === 'edit'} />}
            </Field>
            <Field label="Member PIN" hint="Optional." error={errors.memberPin}>
              {({ id, invalid }) => <Input id={id} invalid={invalid} value={editor.values.memberPin} onChange={setValue('memberPin')} />}
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
        title={pendingDelete ? `Remove judge ${pendingDelete.number}?` : ''}
        description={pendingDelete ? `${pendingDelete.name} is removed from the hunt. Scores already entered under this number stay.` : ''}
        confirmLabel="Remove judge"
      />
    </>
  );
}

export default Judges;
