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
