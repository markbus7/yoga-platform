// "Unstuck 30": a four-week plan that starts short and lets holds grow.
// `hold` multiplies hold times on top of the person's own hold-length setting.

export const PROGRAM = {
  id: 'unstuck30',
  name: 'Unstuck 30',
  about: 'Thirty days, one short session a day. Week one teaches the moves, then the holds slowly get longer.',
  weeks: [
    { n: 1, name: 'Wake up', hold: 0.85, about: 'Short sessions to learn the moves. Stay at a 4 out of 10.' },
    { n: 2, name: 'Loosen', hold: 1, about: 'Standard hold times. You will know most poses by now.' },
    { n: 3, name: 'Release', hold: 1.15, about: 'Holds get a little longer. Use blocks to stay relaxed.' },
    { n: 4, name: 'Unstuck', hold: 1.3, about: 'Your longest holds. Notice how different they feel from week one.' },
  ],
  days: [
    { routine: 'wakeup', check: true, tip: ['Go to a 4 out of 10', 'Stretch until you feel a clear pull, about a 4 on a scale of 10. Never pain. Stiff muscles let go when they feel safe, not when they are forced.'] },
    { routine: 'gravitybasics', tip: ['Gravity does the work', 'In a gravity hold you get into position and then stop working. Your body weight does the stretching while you breathe. This is the same idea as the gravity course you did before.'] },
    { routine: 'neck', tip: ['Your breath is the off switch', 'Breathing out for longer than you breathe in slows your heart and tells your body it can relax. Use it in every hold.'] },
    { routine: 'hipsback', tip: ['Use your blocks', 'Blocks bring the floor closer to you. They are not cheating. They let you relax into a pose instead of straining to hold it.'] },
    { routine: 'wakeup', tip: ['Short and daily beats long and rare', 'Ten minutes every day changes more than an hour once a week. You are building a habit as much as flexibility.'] },
    { routine: 'legs', tip: ['Bend your knees', 'Tight hamstrings pull on your lower back. Bending your knees in forward folds lets your back release first. Straight legs will come later.'] },
    { routine: 'winddown', tip: ['Rest is part of it', 'Feeling a little tender after new stretches is normal. Sharp, stabbing or lasting pain is not. Skip that pose for a while if it happens.'] },
    { routine: 'gravity', tip: ['Stay a little longer', 'For the first 30 seconds of a hold your muscles guard. After that they start to let go. That is why gravity holds last a minute or more.'] },
    { routine: 'wakeup', tip: ['Morning moves, evening holds', 'Moving stretches wake you up. Gravity holds calm you down. If you can, do a short one in the morning and a longer one in the evening.'] },
    { routine: 'upper', tip: ['Undo the hunch', 'Screens and phones round your shoulders forward all day. Chest openers and upper back holds put them back where they belong.'] },
    { routine: 'hipsback', tip: ['Sitting tightens the front of your hips', 'Hours in a chair shorten the muscles at the front of your hips, which pulls on your lower back. Low lunge and sphinx undo that.'] },
    { routine: 'gravity', tip: ['Jaw, shoulders, belly', 'Stress hides in three places. In every hold, check them: unclench your jaw, drop your shoulders, soften your belly.'] },
    { routine: 'legs', tip: ['A little shaking is fine', 'Small trembles in a hold are your muscles letting go. Breathe, and ease off slightly if it gets intense.'] },
    { routine: 'deep', tip: ['Notice, do not judge', 'Some days you will feel stiffer than others. Sleep, stress and how much you sat all change it. Just show up.'] },
    { routine: 'gravity', check: true, tip: ['Halfway: check your progress', 'Two weeks in. Take the flexibility check again today and compare it with day one.'] },
    { routine: 'hipopener', tip: ['Hips hold a lot', 'Deep hip holds can make you restless or emotional. That is normal. Stay with your breath and use more support.'] },
    { routine: 'neck', tip: ['Put the phone away', 'Put your phone out of reach during holds. The voice and chime will tell you when to move.'] },
    { routine: 'legs', tip: ['Breathe into the tight spot', 'Picture each out-breath flowing to the place that feels stuck. It sounds odd, and it works.'] },
    { routine: 'upper', tip: ['Warm is easier', 'Stretching after a shower or a walk feels easier. Your tissues are warmer and more willing.'] },
    { routine: 'wakeup', tip: ['Stress lives in the neck', 'If you notice your shoulders creeping up during the day, do the Desk Reset or two minutes of breathing.'] },
    { routine: 'deep', tip: ['Sleep better', 'Many people fall asleep faster after a few minutes of legs up the wall and slow breathing.'] },
    { routine: 'gravity', tip: ['Longest holds yet', 'Week four. Holds are about 30% longer than standard. Use blocks and cushions so you can fully relax.'] },
    { routine: 'hipopener', tip: ['Walk and drink water', 'Walking every day and staying hydrated keep you looser between sessions.'] },
    { routine: 'upper', tip: ['Check your desk', 'Screen at eye level, feet flat on the floor, and get up every 45 minutes. Prevention is easier than release.'] },
    { routine: 'legs', tip: ['Be kind to your knees', 'Always pad your knees. A folded towel or the end of your mat makes kneeling poses much nicer.'] },
    { routine: 'gravity', tip: ['The edge moves', 'The point where you feel a 4 out of 10 moves over the weeks. Follow it gently, never chase it.'] },
    { routine: 'hipsback', tip: ['Build your own', 'When one spot feels stuck, use "Build a session" on the Today screen to make a session just for it.'] },
    { routine: 'deep', tip: ['One minute counts', 'On a busy day, one pose is better than none. A single child\'s pose keeps the habit alive.'] },
    { routine: 'winddown', tip: ['Almost there', 'Tomorrow is day 30. Notice how your body feels compared to day one.'] },
    { routine: 'gravity', check: true, tip: ['You got unstuck', 'Take the final flexibility check and compare. Then keep going with the routines you liked best.'] },
  ],
};

PROGRAM.days.forEach((d, i) => {
  d.day = i + 1;
  d.week = Math.min(4, Math.floor(i / 7) + 1);
});

export function weekOf(day) {
  return PROGRAM.weeks[Math.min(4, Math.floor((day - 1) / 7) + 1) - 1];
}
