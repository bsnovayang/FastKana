import { load, save } from './storage.js';

const KEY = 'fastkana.settings';
const DEFAULTS = {
  sound: true,
  rate: 0.8,
  autoNext: true,
  quickSubmit: true,
  showRomaji: true,
  hwDebug: false,
  hwStrict: false,
  dailyGoal: 20,
  range: { script: 'hira', rows: ['a', 'ka', 'sa', 'ta', 'na'], count: 20 },
};

export const settings = load(KEY, DEFAULTS);
export const saveSettings = () => save(KEY, settings);
