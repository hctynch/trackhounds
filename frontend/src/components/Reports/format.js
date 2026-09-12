import HuntService from '../../services/HuntService';
import { STAKE_LABELS } from '../ui';

/** A stake for a printed sheet. */
export function stakeLabel(stake) {
  return STAKE_LABELS[stake] || String(stake || '');
}

/** Whether the loaded hunt places two stakes; false when no hunt exists. */
export async function loadedHuntIsDual() {
  const hunt = await HuntService.getHunt();
  return Boolean(hunt) && typeof hunt === 'object' && hunt.stake === 'DUAL';
}

/**
 * Standings sheets that list both stakes of a dual hunt get a Stake column after the name, so a
 * mixed list says which competition each dog is in. `rows` are [dog, cells] pairs; the dog
 * supplies the stake. With `show` false the cells are returned unchanged.
 */
export function addStakeColumn(columns, rows, show) {
  if (!show) return { columns, data: rows.map(([, cells]) => cells) };
  const at = columns.indexOf('Name') + 1;
  const insert = (list, value) => [...list.slice(0, at), value, ...list.slice(at)];
  return { columns: insert(columns, 'Stake'), data: rows.map(([dog, cells]) => insert(cells, stakeLabel(dog.stake))) };
}

/** A dog's name for a printed sheet; scratched dogs are marked so the sheet says so. */
export function dogLabel(dog) {
  const name = dog.dogName || dog.name || '';
  return dog.scratched ? `${name} (scratched)`.trim() : name;
}

/** A dog number for sheets without a name column. */
export function dogNumberLabel(dog) {
  const number = String(dog.dogNumber ?? dog.number ?? '');
  return dog.scratched ? `${number} (scratched)` : number;
}
