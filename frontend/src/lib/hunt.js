/** Helpers that derive things from the current hunt. */

export const MAX_DAYS = 4;

/** Days of the hunt as [1, 2, ...]; four when no hunt is loaded. */
export function huntDays(hunt) {
  const count = Math.min(MAX_DAYS, Math.max(1, Number(hunt?.huntDays) || MAX_DAYS));
  return Array.from({ length: count }, (_, index) => index + 1);
}

/** Day options for a select or segmented control. */
export function dayOptions(hunt) {
  return huntDays(hunt).map((day) => ({ value: day, label: `Day ${day}` }));
}

/** The stake a dog number falls into according to the hunt's number ranges, or null. */
export function stakeForNumber(hunt, number) {
  if (!hunt?.stakeRange || !hunt?.stakeTypeRange || !Number.isFinite(number)) return null;
  for (let i = 0; i < hunt.stakeRange.length; i += 1) {
    const isLast = i === hunt.stakeRange.length - 1;
    if (number >= hunt.stakeRange[i] && (isLast || number < hunt.stakeRange[i + 1])) return hunt.stakeTypeRange[i];
  }
  return null;
}

/** Reasons offered on the scratch sheet; "Other" takes free text. */
export const SCRATCH_REASONS = ['Injured', 'Withdrawn by owner', 'Not found', 'Disqualified', 'Other'];
