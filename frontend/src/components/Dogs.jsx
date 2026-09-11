import { useEffect, useMemo, useState } from 'react';
import { LuDog, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import DogService from '../services/DogService.js';
import { Badge, Button, ConfirmDialog, DataTable, EmptyState, IconButton, PageHeader, Panel, SearchInput, StakeBadge, useToast } from './ui';

function Dogs() {
  const navigate = useNavigate();
  const toast = useToast();
  const [dogs, setDogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    DogService.getDogs().then((data) => {
      if (cancelled) return;
      setDogs(Array.isArray(data) ? data : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(
    () => (search ? dogs.filter((dog) => dog.number.toString().includes(search.trim())) : dogs),
    [dogs, search],
  );

  const confirmDelete = async () => {
    setDeleting(true);
    const result = await DogService.deleteDog(pendingDelete.number);
    setDeleting(false);
    if (Array.isArray(result)) {
      setDogs(result);
      toast.success(`Dog ${pendingDelete.number} removed.`);
      setPendingDelete(null);
    } else {
      toast.error(`Dog ${pendingDelete.number} could not be removed.`);
    }
  };

  const columns = [
    { key: 'number', header: 'Dog', numeric: true, width: '4.5rem', cellClassName: 'font-semibold' },
    {
      key: 'name',
      header: 'Name',
      render: (dog) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-medium">{dog.name}</span>
          {dog.scratched && <Badge tone="warning">Scratched</Badge>}
        </span>
      ),
    },
    { key: 'stake', header: 'Stake', render: (dog) => <StakeBadge stake={dog.stake} /> },
    { key: 'owner', header: 'Owner' },
    { key: 'sire', header: 'Sire', cellClassName: 'text-ink-muted' },
    { key: 'dam', header: 'Dam', cellClassName: 'text-ink-muted' },
    { key: 'points', header: 'Points', numeric: true, width: '5rem', cellClassName: 'font-semibold' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '5.5rem',
      render: (dog) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={LuPencil} label={`Edit dog ${dog.number}`} onClick={() => navigate('/dogs/edit', { state: { dog } })} />
          <IconButton icon={LuTrash2} label={`Remove dog ${dog.number}`} tone="danger" onClick={() => setPendingDelete(dog)} />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Dogs"
        description={loading ? 'Loading' : `${dogs.length} registered${search ? `, ${visible.length} shown` : ''}`}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Find by dog number" className="w-56" />
            <Button variant="primary" icon={LuPlus} onClick={() => navigate('/dogs/add')}>
              Add dogs
            </Button>
          </>
        }
      />

      <Panel>
        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(dog) => dog.number}
          stickyHeader
          empty={
            loading ? (
              <p className="text-center text-small text-ink-muted">Loading dogs</p>
            ) : search ? (
              <EmptyState compact title={`No dog number contains "${search}"`} description="Check the number or clear the search." />
            ) : (
              <EmptyState
                icon={LuDog}
                title="No dogs registered"
                description="Register the dogs entered in this hunt. Owners, sires and dams are printed on the reports."
                action={
                  <Button variant="primary" icon={LuPlus} onClick={() => navigate('/dogs/add')}>
                    Add dogs
                  </Button>
                }
              />
            )
          }
        />
      </Panel>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        busy={deleting}
        danger
        title={pendingDelete ? `Remove dog ${pendingDelete.number}?` : ''}
        description={pendingDelete ? `${pendingDelete.name} and every score recorded for this dog are removed from the hunt.` : ''}
        confirmLabel="Remove dog"
      />
    </>
  );
}

export default Dogs;
