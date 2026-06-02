import { Game } from './core/game.js';

const canvas = document.querySelector('#game');
const hudElement = document.querySelector('#hud-content');

const getLocalStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const game = new Game(canvas, hudElement, { storage: getLocalStorage() });
game.start();

if (window.navigator && 'serviceWorker' in window.navigator) {
  window.addEventListener('load', () => {
    window.navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('Service Worker konnte nicht registriert werden:', error);
    });
  });
}
