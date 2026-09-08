import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DogService from '../services/DogService';
import { Button, Field, Input, PageHeader, Panel, PanelBody, PanelFooter, PanelHeader, STAKE_LABELS, SegmentedControl, useToast } from './ui';

const STAKES = ['ALL_AGE', 'DERBY'].map((value) => ({ value, label: STAKE_LABELS[value] }));

function EditDog() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { dog } = location.state || {};
  const [values, setValues] = useState({
    name: dog?.name || '',
    stake: dog?.stake || 'ALL_AGE',
    owner: dog?.owner || '',
    sire: dog?.sire || '',
    dam: dog?.dam || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dog) navigate('/dogs/all');
  }, [dog, navigate]);

  if (!dog) return null;

  const set = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = {};
    if (values.name.trim().length < 1) found.name = 'Give the dog a name.';
    if (values.owner.trim().length < 1) found.owner = 'Enter the owner.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const data = await DogService.editDog({ number: dog.number, points: dog.points, ...values });
    setSaving(false);
    if (data instanceof Error) {
      setErrors(data.response?.data?.fields || { name: 'The changes could not be saved.' });
      return;
    }
    if (data && data.fields) {
      setErrors(data.fields);
      return;
    }
    toast.success(`Dog ${dog.number} updated.`);
    navigate('/dogs/all');
  };

  return (
    <>
      <PageHeader backTo="/dogs/all" backLabel="All dogs" title={`Dog ${dog.number}`} description="The number and points cannot be changed here." />
      <form onSubmit={handleSubmit} noValidate className="max-w-2xl">
        <Panel>
          <PanelHeader title="Details" />
          <PanelBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Number">{({ id }) => <Input id={id} value={dog.number} disabled numeric />}</Field>
            <Field label="Points">{({ id }) => <Input id={id} value={dog.points ?? 0} disabled numeric />}</Field>
            <Field label="Name" required error={errors.name} className="sm:col-span-2">
              {({ id, invalid }) => <Input id={id} invalid={invalid} value={values.name} onChange={set('name')} autoFocus />}
            </Field>
            <Field label="Stake" className="sm:col-span-2">
              <SegmentedControl
                label="Stake"
                options={STAKES}
                value={values.stake}
                onChange={(stake) => setValues((current) => ({ ...current, stake }))}
                className="self-start"
              />
            </Field>
            <Field label="Owner" required error={errors.owner} className="sm:col-span-2">
              {({ id, invalid }) => <Input id={id} invalid={invalid} value={values.owner} onChange={set('owner')} />}
            </Field>
            <Field label="Sire">{({ id }) => <Input id={id} value={values.sire} onChange={set('sire')} />}</Field>
            <Field label="Dam">{({ id }) => <Input id={id} value={values.dam} onChange={set('dam')} />}</Field>
          </PanelBody>
          <PanelFooter>
            <Button variant="secondary" onClick={() => navigate('/dogs/all')} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              Save changes
            </Button>
          </PanelFooter>
        </Panel>
      </form>
    </>
  );
}

export default EditDog;
