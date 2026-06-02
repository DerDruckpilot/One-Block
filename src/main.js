import { Game } from './core/game.js';

const canvas = document.querySelector('#game');
const hudElement = document.querySelector('#hud-content');

const game = new Game(canvas, hudElement);
game.start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('Service Worker konnte nicht registriert werden:', error);
    });
  });
}
