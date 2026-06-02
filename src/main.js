import { Game } from './core/game.js';

const canvas = document.querySelector('#game');
const hudElement = document.querySelector('#hud-content');
const hotbarElement = document.querySelector('#hotbar');
const inventoryButton = document.querySelector('#inventory-button');
const craftingButton = document.querySelector('#crafting-button');
const inventoryPanel = document.querySelector('#inventory-panel');
const craftingPanel = document.querySelector('#crafting-panel');

const getLocalStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const game = new Game(canvas, hudElement, {
  craftingButton,
  craftingPanel,
  hotbarElement,
  inventoryButton,
  inventoryPanel,
  storage: getLocalStorage()
});
game.start();

if (window.navigator && 'serviceWorker' in window.navigator) {
  window.addEventListener('load', () => {
    window.navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('Service Worker konnte nicht registriert werden:', error);
    });
  });
}
