// PWA：註冊 Service Worker、加到主畫面、新版本提示
import { VERSION } from './version.js';

const ua = navigator.userAgent;
const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isInApp = /\bLine\/|FBAN|FBAV|FB_IAB|Instagram|Messenger/i.test(ua);
// iOS 只有 Safari 能加到主畫面
const isIOSSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua) && !isInApp;

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

let deferred = null; // Android Chrome 的安裝事件
const listeners = new Set();
const notify = () => listeners.forEach(fn => fn());
export const onInstallChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferred = e;
  notify();
});
window.addEventListener('appinstalled', () => { deferred = null; notify(); });

// 'prompt'：可以直接跳出安裝視窗（Android）；'ios'：要教使用者手動加；''：不顯示
export function installMode() {
  if (isStandalone() || isInApp) return '';
  if (deferred) return 'prompt';
  if (isIOSSafari) return 'ios';
  return '';
}

export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  notify();
  return outcome === 'accepted';
}

// 離線檔案是否已經下載好
export async function offlineReady() {
  if (!('caches' in window)) return false;
  try { return await caches.has(`fastkana-${VERSION}`); } catch { return false; }
}

export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  // 本機開發時不註冊，避免快取干擾
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !location.search.includes('sw=1')) return;

  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js').catch(() => {});

  // 新版本接手後提示重新整理（第一次安裝不提示）
  let shown = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || shown) return;
    shown = true;
    showUpdateToast();
  });
}

function showUpdateToast() {
  const bar = document.createElement('div');
  bar.className = 'toast';
  bar.setAttribute('role', 'status');
  bar.innerHTML = '<span>有新版本了</span><button type="button">重新整理</button>';
  bar.querySelector('button').addEventListener('click', () => location.reload());
  document.body.appendChild(bar);
}
