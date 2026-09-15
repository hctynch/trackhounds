import { STAKE_LABELS } from '../ui';

/** A stake for a printed sheet. */
export function stakeLabel(stake) {
  return STAKE_LABELS[stake] || String(stake || '');
}

/** A dog's name for a printed sheet; scratched dogs are marked so the sheet says so. */
export function dogLabel(dog) {
  const name = dog.dogName || dog.name || '';
  return dog.scratched ? `${name} (scratched)`.trim() : name;
}
