import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHunt } from '../hooks/useHunt';
import HuntService from '../services/HuntService.js';
import HuntForm, { emptyHunt } from './HuntForm';
import { PageHeader, useToast } from './ui';

function EditHunt() {
  const navigate = useNavigate();
  const { hunt, loading, refresh } = useHunt();
  const toast = useToast();

  useEffect(() => {
    if (!loading && !hunt) navigate('/');
  }, [hunt, loading, navigate]);

  const initial = useMemo(
    () =>
      hunt
        ? {
            title: hunt.title || '',
            dates: hunt.dates || '',
            huntInterval: hunt.huntInterval ?? 0,
            pointStep: hunt.pointStep ?? 5,
            firstDogPoints: hunt.firstDogPoints ?? 35,
            huntDays: hunt.huntDays ?? 4,
            stake: hunt.stake || 'ALL_AGE',
            stakeTypeRange: hunt.stakeTypeRange || emptyHunt.stakeTypeRange,
            stakeRange: hunt.stakeRange || emptyHunt.stakeRange,
          }
        : emptyHunt,
    [hunt],
  );

  const handleSubmit = async (payload) => {
    const data = await HuntService.editHunt(payload);
    if (data instanceof Error) {
      return data.response?.data?.fields || { title: 'The changes could not be saved. Check the log for details.' };
    }
    await refresh();
    toast.success('Hunt updated.');
    navigate('/');
    return null;
  };

  if (!hunt) return null;

  return (
    <>
      <PageHeader backTo="/" backLabel="Home" title="Edit hunt" description="Changes apply to the current hunt only." />
      <HuntForm
        initial={initial}
        title="Hunt details"
        description="Shown on every screen and printed report"
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/')}
      />
    </>
  );
}

export default EditHunt;
