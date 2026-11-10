import * as home from './views/home.js';
import * as learn from './views/learn.js';
import * as setup from './views/setup.js';
import * as play from './views/play.js';
import * as result from './views/result.js';
import * as settingsView from './views/settings.js';
import * as statsView from './views/stats.js';
import { unlockSpeech, stopSpeech } from './core/speech.js';

const routes = { '': home, learn, setup, play, result, settings: settingsView, stats: statsView };
const app = document.getElementById('app');
let cleanup = null;

function route() {
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  stopSpeech();
  const [name = '', param] = location.hash.replace(/^#\/?/, '').split('/');
  const view = routes[name] || home;
  app.innerHTML = '';
  window.scrollTo(0, 0);
  cleanup = view.render(app, param);
}

window.addEventListener('hashchange', route);
document.addEventListener('pointerdown', unlockSpeech, { once: true });
route();
