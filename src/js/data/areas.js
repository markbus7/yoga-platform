// Body areas, used for tagging exercises, the "where do you feel stuck" map
// and progress breakdowns.

export const AREAS = [
  { id: 'neck', name: 'Neck' },
  { id: 'shoulders', name: 'Shoulders' },
  { id: 'upperBack', name: 'Upper back' },
  { id: 'chest', name: 'Chest' },
  { id: 'arms', name: 'Wrists & forearms' },
  { id: 'sides', name: 'Sides' },
  { id: 'lowerBack', name: 'Lower back' },
  { id: 'hips', name: 'Hips' },
  { id: 'glutes', name: 'Glutes' },
  { id: 'hamstrings', name: 'Back of legs' },
  { id: 'quads', name: 'Front of thighs' },
  { id: 'calves', name: 'Calves & ankles' },
];

export const AREA_NAME = Object.fromEntries(AREAS.map((a) => [a.id, a.name]));

/** Areas someone can flag as "go easy here" (old injuries, niggles). */
export const CARE_AREAS = [
  { id: 'knees', name: 'Knees' },
  { id: 'lowerBack', name: 'Lower back' },
  { id: 'neck', name: 'Neck' },
  { id: 'wrists', name: 'Wrists' },
  { id: 'shoulders', name: 'Shoulders' },
];

export const POSITIONS = {
  standing: 'Standing',
  chair: 'On a chair',
  allfours: 'On all fours',
  kneeling: 'Kneeling',
  seated: 'Sitting on the floor',
  back: 'Lying on your back',
  belly: 'Lying on your belly',
};
