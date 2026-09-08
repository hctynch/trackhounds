import { useNavigate } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import HuntService from '../services/HuntService.js';
import HuntForm, { emptyHunt } from './HuntForm';
import { Alert, PageHeader, useToast } from './ui';

function CreateHunt() {
  const navigate = useNavigate();
  const { hunt, refresh } = useHunt();
  const toast = useToast();

  const handleSubmit = async (payload) => {
    const data = await HuntService.createHunt(payload);
    if (data instanceof Error) {
      return data.response?.data?.fields || { title: 'The hunt could not be saved. Check the log for details.' };
    }
    await refresh();
    toast.success(`Hunt "${payload.title}" created.`);
    navigate('/');
    return null;
  };

  return (
    <>
      <PageHeader
        backTo="/"
        backLabel="Home"
        title="Create a hunt"
        description="A hunt holds its own dogs, judges, scores and scratches."
      />
      {hunt && (
        <Alert tone="warning" title={`This replaces "${hunt.title}".`} className="mb-6">
          Creating a new hunt clears the current hunt&apos;s dogs, scores and scratches. Print any reports you need first.
        </Alert>
      )}
      <HuntForm
        initial={emptyHunt}
        title="Hunt details"
        description="Shown on every screen and printed report"
        submitLabel="Create hunt"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
      />
    </>
  );
}

export default CreateHunt;
