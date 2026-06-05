import { Game } from './core/game.js';
import { updateOrientationState } from './ui/orientation.js';

const canvas = document.querySelector('#game');
const hudElement = document.querySelector('#hud-content');
const hotbarElement = document.querySelector('#hotbar');
const inventoryButton = document.querySelector('#inventory-button');
const craftingButton = document.querySelector('#crafting-button');
const buildButton = document.querySelector('#build-button');
const inventoryPanel = document.querySelector('#inventory-panel');
const craftingPanel = document.querySelector('#crafting-panel');
const buildPanel = document.querySelector('#build-panel');
const cookingPanel = document.querySelector('#cooking-panel');
const furnacePanel = document.querySelector('#furnace-panel');
const touchControlsElement = document.querySelector('#touch-controls');
const joystickElement = document.querySelector('#touch-joystick');
const joystickKnobElement = document.querySelector('#touch-joystick-knob');
const actionButton = document.querySelector('#touch-action');
const attackButton = document.querySelector('#touch-attack');

const getLocalStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const game = new Game(canvas, hudElement, {
  actionButton,
  attackButton,
  buildButton,
  buildPanel,
  craftingButton,
  craftingPanel,
  cookingPanel,
  furnacePanel,
  hotbarElement,
  inventoryButton,
  inventoryPanel,
  joystickElement,
  joystickKnobElement,
  storage: getLocalStorage(),
  touchControlsElement
});
game.start();

const preventGameTouchDefault = (event) => {
  if (event.target?.closest?.('#inventory-panel, #crafting-panel, #build-panel, #cooking-panel, #furnace-panel')) return;
  event.preventDefault();
};

document.addEventListener('touchstart', preventGameTouchDefault, { passive: false });
document.addEventListener('touchmove', preventGameTouchDefault, { passive: false });

updateOrientationState();
window.addEventListener('resize', () => updateOrientationState());
window.addEventListener('orientationchange', () => updateOrientationState());

if (window.navigator && 'serviceWorker' in window.navigator) {
  window.addEventListener('load', () => {
    window.navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('Service Worker konnte nicht registriert werden:', error);
    });
  });
}
