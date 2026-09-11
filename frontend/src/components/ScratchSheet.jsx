import { useEffect, useMemo, useState } from 'react';
import { LuFlag } from 'react-icons/lu';
import { useHunt } from '../hooks/useHunt';
import { huntDays, SCRATCH_REASONS } from '../lib/hunt';
import DogService from '../services/DogService';
import { Alert, Button, DataTable, EmptyState, Field, Input, PageHeader, Panel, PanelBody, PanelFooter, PanelHeader, SearchInput, Select, useToast } from './ui';

const emptyScratch = { dogNumber: '', day: 1, time: '', judgeNumber: '', reason: SCRATCH_REASONS[0], otherReason: '' };

function ScratchSheet() {
  const toast = useToast();
  const { hunt } = useHunt();
  const [search, setSearch] = useState('');
  const [scratches, setScratches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState(emptyScratch);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await DogService.getScratches();
    setScratches(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () => (search ? scratches.filter((scratch) => scratch.dogNumber.toString().includes(search.trim())) : scratches),
    [scratches, search],
  );

  const set = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const reason = values.reason === 'Other' ? values.otherReason.trim() : values.reason;
    if (values.reason === 'Other' && !reason) {
      setErrors({ reason: 'Say why the dog was scratched.' });
      return;
    }
    setSaving(true);
    const response = await DogService.postScratch({
      dogNumber: Number(values.dogNumber),
      day: Number(values.day),
      time: values.time,
      judgeNumber: Number(values.judgeNumber),
      reason,
    });
    setSaving(false);
    if (response && response.fields) {
      setErrors(response.fields);
      return;
    }
    if (response && response.message) {
      setErrors({ general: response.message });
      return;
    }
    toast.success(`Dog ${values.dogNumber} scratched.`);
    setValues(emptyScratch);
    setErrors({});
    load();
  };

  const columns = [
    { key: 'day', header: 'Day', numeric: true, width: '4rem', render: (scratch) => scratch.day ?? 1 },
    { key: 'dogNumber', header: 'Dog', numeric: true, width: '5rem', cellClassName: 'font-semibold' },
    { key: 'dogName', header: 'Name', render: (scratch) => scratch.dogName || <span className="text-ink-faint">unknown</span> },
    { key: 'time', header: 'Time', width: '6rem', cellClassName: 'tabular' },
    { key: 'judgeNumber', header: 'Judge', numeric: true, width: '5rem' },
    { key: 'reason', header: 'Reason' },
  ];

  return (
    <>
      <PageHeader
        title="Scratch sheet"
        description="Dogs withdrawn from the hunt, with the judge who recorded it and why."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Find by dog number" className="w-56" />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="self-start">
          <DataTable
            columns={columns}
            rows={visible}
            rowKey={(scratch) => scratch.id}
            empty={
              loading ? (
                <p className="text-center text-small text-ink-muted">Loading scratches</p>
              ) : search ? (
                <EmptyState compact title={`No scratch for a dog number containing "${search}"`} />
              ) : (
                <EmptyState icon={LuFlag} title="No scratches" description="Record a scratch with the form when a dog is withdrawn." />
              )
            }
          />
        </Panel>

        <form onSubmit={handleSubmit} noValidate>
          <Panel>
            <PanelHeader title="Record a scratch" />
            <PanelBody className="flex flex-col gap-4">
              {errors.general && <Alert tone="danger">{errors.general}</Alert>}
              <Field label="Dog number" required error={errors.dogNumber}>
                {({ id, invalid }) => <Input id={id} type="number" numeric min={1} invalid={invalid} value={values.dogNumber} onChange={set('dogNumber')} />}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Day" required error={errors.day}>
                  {({ id, invalid }) => (
                    <Select id={id} invalid={invalid} value={values.day} onChange={set('day')}>
                      {huntDays(hunt).map((day) => (
                        <option key={day} value={day}>
                          Day {day}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Time" required error={errors.time}>
                  {({ id, invalid }) => <Input id={id} type="time" invalid={invalid} value={values.time} onChange={set('time')} className="tabular" />}
                </Field>
              </div>
              <Field label="Judge number" required error={errors.judgeNumber}>
                {({ id, invalid }) => <Input id={id} type="number" numeric min={1} invalid={invalid} value={values.judgeNumber} onChange={set('judgeNumber')} />}
              </Field>
              <Field label="Reason" required error={values.reason === 'Other' ? undefined : errors.reason}>
                {({ id, invalid }) => (
                  <Select id={id} invalid={invalid} value={values.reason} onChange={set('reason')}>
                    {SCRATCH_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {values.reason === 'Other' && (
                <Field label="What happened" required error={errors.reason}>
                  {({ id, invalid }) => <Input id={id} invalid={invalid} value={values.otherReason} onChange={set('otherReason')} autoFocus />}
                </Field>
              )}
            </PanelBody>
            <PanelFooter>
              <Button variant="primary" type="submit" loading={saving}>
                Scratch dog
              </Button>
            </PanelFooter>
          </Panel>
        </form>
      </div>
    </>
  );
}

export default ScratchSheet;
