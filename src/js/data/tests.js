// The flexibility check: five quick self-tests you can repeat every two weeks.
// Each level is a plain description; higher is looser.

export const TESTS = [
  {
    id: 'fold',
    name: 'Forward fold reach',
    fig: 'foldtest',
    how: 'Stand with your feet together and your knees straight but not locked. Breathe out and let your upper body hang forward. No bouncing. Where do your fingertips reach?',
    levels: ['Above my knees', 'My knees', 'Middle of my shins', 'My ankles', 'My toes or the floor', 'Palms flat on the floor'],
  },
  {
    id: 'shoulder',
    name: 'Back-scratch reach',
    fig: 'scratchtest',
    how: 'Reach one hand over your shoulder and down your back. Reach the other hand behind you and up your back. Try both sides and pick the harder one.',
    levels: ['Hands far apart (more than a hand length)', 'About a hand length apart', 'Fingers almost touch', 'Fingertips touch', 'Fingers overlap'],
  },
  {
    id: 'hips',
    name: 'Butterfly knees',
    fig: 'butterflytest',
    how: 'Sit tall with the soles of your feet together, heels about a hand length from your body. Relax your legs. Where do your knees rest?',
    levels: ['Well above my hips', 'About level with my hips', 'Halfway to the floor', 'A fist away from the floor', 'On the floor'],
  },
  {
    id: 'neck',
    name: 'Neck turn',
    fig: 'necktest',
    how: 'Sit tall and slowly turn your head to look over one shoulder, then the other. Pick the harder side. How far does your chin go?',
    levels: ['Less than halfway to my shoulder', 'About halfway', 'Almost over my shoulder', 'Right over my shoulder'],
  },
  {
    id: 'squat',
    name: 'Deep squat',
    fig: 'squattest',
    how: 'Feet a bit wider than your hips, toes slightly out. Sink down as low as you comfortably can. Hold something if you need to.',
    levels: ['I cannot go below halfway', 'Low, but only with my heels up', 'Low with my heels on a block', 'Low with heels down, holding on', 'Low with heels down, hands free, for 30 seconds'],
  },
];

export const TEST = Object.fromEntries(TESTS.map((t) => [t.id, t]));
