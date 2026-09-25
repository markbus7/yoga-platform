# Unstuck

A daily stretching, gravity-hold and breathing coach for a body that feels stuck from stress and sitting. No yoga background needed.

- **Guided sessions** with an animated figure for every exercise, spoken cues, soft chimes, and a screen that stays on while you practise.
- **Unstuck 30**, a four-week plan: short sessions in week one, holds that slowly get longer after that.
- **12 routines**: Wake-up Unstick, Gravity Release, Desk Reset, Neck & Shoulders, Hips & Lower Back, Legs & Hamstrings, Upper Body Unwind, Deep Hip Release, Wind Down, Full Body Deep, Gravity Basics and Just Breathe.
- **48 exercises** with plain-English names (the yoga name in small print), step-by-step setup, what you should feel and where, easier and deeper options, and when to be careful.
- **Build a session**: tap where you feel stuck on a body map, pick 5 to 20 minutes, and get a session for exactly those spots.
- **Progress**: streaks, a practice calendar, minutes per week, tension before and after each session, a five-test flexibility check every two weeks, and milestones.
- **Video classes**: free beginner follow-alongs on YouTube that you can log as practice.

The figure is drawn to scale: 180 cm tall, on a 183 cm mat, with 23 × 15 × 10 cm blocks.

## How the practice works

Three kinds of exercise, mixed differently in each routine:

| | What it is | Why |
|---|---|---|
| Moving stretches | Slow joint movements such as cat–cow, shoulder rolls, hip circles | Wakes up stiff joints |
| Gravity holds | Passive holds of 1 to 3 minutes where your body weight does the stretching (Yin style) | Lets muscles that are tight from stress let go |
| Breathing | A longer out-breath than in-breath | Turns down the stress response and makes every hold work better |

The three rules: go to a 4 out of 10 (a clear pull, never pain), breathe out longer than you breathe in, and let go once you are in position.

Unstuck is a practice guide, not medical advice. Stop if anything hurts, and check with a doctor or physiotherapist if you have an injury or ongoing pain.

## Running it

It is a static web app with no runtime dependencies.

```sh
npm install      # installs esbuild, used only for the production build
npm run dev      # serves src/ at http://localhost:5173
npm test         # data, progress, session and storage tests
npm run build    # writes dist/index.html (one self-contained file)
npm run poses    # writes dist/poses.html, a sheet of every figure pose for review
```

`dist/index.html` works on its own: open it in a browser, or host it anywhere. The build also writes `dist/artifact.html`, the same app as a page fragment for publishing on claude.ai.

### Where progress is saved

- On claude.ai the page asks for a private per-person database, so progress follows you between devices.
- Anywhere else it is saved in the browser's local storage. Use **You → Copy backup** now and then, and **Restore a backup** to move it.

### Hosting on GitHub Pages (optional)

1. In the repository settings, open **Pages** and set the source to **GitHub Actions**.
2. Add a repository variable `PAGES_ENABLED` with the value `true` (**Settings → Secrets and variables → Actions → Variables**).
3. Push to `main`. The **Deploy to GitHub Pages** workflow builds and publishes `dist/index.html`.

## Project layout

```
src/
  index.html            page shell (the build inlines CSS and JS into it)
  css/app.css           all styles, light and dark
  js/
    main.js, app.js     start-up, navigation, shared actions
    player.js           the guided session (timer, voice, chimes, check-ins)
    screens/            Today, Explore, exercise, routine, Build, Progress, You, check, plan, guide
    figure/rig.js       the 2D mannequin: kinematics, grounding, props, animation
    figure/poses.js     keyframes for every exercise
    data/               exercises, routines, the 30-day plan, videos, flexibility tests, guide
    lib/                dates, stats, session timing, the session builder, storage, audio
    ui/                 DOM helpers, icons, body map, charts, animated figures
scripts/                build, dev server, pose contact sheet
tests/                  node:test suites
```

## Credits

Video classes by Yoga With Adriene, Tom Merrick (Bodyweight Warrior), Melissa West and the Gravity Yoga series, linked on YouTube. Fonts: Anybody and Figtree from Google Fonts.
