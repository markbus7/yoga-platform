// Entry point.

import { createStore } from './lib/store.js';
import { createApp } from './app.js';

const store = createStore();
createApp(document.getElementById('app-root'), store);
// On claude.ai, switch to per-person cloud storage once the viewer grants it.
store.connectCloud();
store.resumeSync();
