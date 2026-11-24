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

/** True when the hunt places all-age and derby dogs as two separate competitions. */
export function isDualHunt(hunt) {
  return hunt?.stake === 'DUAL';
}

/**
 * Whether a dog's stake is worth showing next to its name: always in a dual hunt, and in a
 * single-stake hunt only when the dog's stake differs from the hunt's (a dog registered outside
 * the number ranges). Showing "All age" on every row of an all-age hunt would say nothing.
 */
export function showsStake(hunt, stake) {
  if (!stake) return false;
  if (!hunt?.stake) return true;
  return hunt.stake === 'DUAL' || stake !== hunt.stake;
}

/** The stake views offered on standings and score lists of a dual hunt. */
export const STAKE_VIEWS = [
  { value: 'ALL', label: 'Both stakes' },
  { value: 'ALL_AGE', label: 'All age' },
  { value: 'DERBY', label: 'Derby' },
];

/** Where the hunt is held, as "City, State" (either part may be missing); empty when neither is set. */
export function huntLocation(hunt) {
  return [hunt?.city, hunt?.state].map((part) => String(part ?? '').trim()).filter(Boolean).join(', ');
}

/** The lowest points a cross proposes: the pack minimum under pack scoring, otherwise zero. */
export function lowestCrossPoints(hunt) {
  return hunt?.packScoring ? Math.max(0, Number(hunt.packMinimumPoints) || 0) : 0;
}

/** Points for a place in a cross (0 for the first dog): the first-dog points less the step per dog ahead, never below `lowest`. */
export function ladderPoints(firstDogPoints, pointStep, position, lowest = 0) {
  return Math.max(lowest, Number(firstDogPoints) - Number(pointStep) * position);
}

/**
 * The points of the first dogs of a cross as a sentence fragment, to show what a scoring setting
 * does: "35, 30, 25, 20, 15, 15, 15" for pack scoring with a minimum of 15.
 */
export function ladderPreview(firstDogPoints, pointStep, lowest = 0, length = 8) {
  const first = Number(firstDogPoints) || 0;
  const step = Number(pointStep) || 0;
  return Array.from({ length }, (_, position) => ladderPoints(first, step, position, lowest)).join(', ');
}

/** Awards most hunts give, offered as one-click names on the Awards page. Any other name can be typed. */
export const AWARD_SUGGESTIONS = ['Best Mouth', 'Classiest Hound'];

/** Reasons offered on the scratch sheet; "Other" takes free text. */
export const SCRATCH_REASONS = ['Injured', 'Withdrawn by owner', 'Not found', 'Disqualified', 'Other'];
