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
    number: dog?.number || '',
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
    const number = values.number.trim();
    if (!/^[0-9]{1,6}$/.test(number)) found.number = 'Dog numbers are digits only, for example 12 or 007.';
    if (values.name.trim().length < 1) found.name = 'Give the dog a name.';
    if (values.owner.trim().length < 1) found.owner = 'Enter the owner.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    if (number !== dog.number) {
      // The number is the dog's identity: scores and scratches move with it on the server.
      const moved = await DogService.renumberDog(dog.number, number);
      if (!moved || moved.fields || moved instanceof Error) {
        setSaving(false);
        setErrors(moved?.fields || { number: 'The number could not be changed.' });
        return;
      }
    }
    const data = await DogService.editDog({ ...values, number, points: dog.points });
    setSaving(false);
    if (data instanceof Error) {
      setErrors(data.response?.data?.fields || { name: 'The changes could not be saved.' });
      return;
    }
    if (data && data.fields) {
      setErrors(data.fields);
      return;
    }
    toast.success(number !== dog.number ? `Dog ${dog.number} is now dog ${number}.` : `Dog ${number} updated.`);
    navigate('/dogs/all');
  };

  return (
    <>
      <PageHeader backTo="/dogs/all" backLabel="All dogs" title={`Dog ${dog.number}`} description="Changing the number moves the dog's scores and scratches with it. Points come from the scores." />
      <form onSubmit={handleSubmit} noValidate className="max-w-2xl">
        <Panel>
          <PanelHeader title="Details" />
          <PanelBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Number" required error={errors.number} hint="Digits only; leading zeros count.">
              {({ id, invalid }) => <Input id={id} invalid={invalid} type="text" inputMode="numeric" className="tabular" value={values.number} onChange={set('number')} />}
            </Field>
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
