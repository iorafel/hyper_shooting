import Phaser from 'phaser';
import { PlayerSelectScene } from './scenes/PlayerSelectScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  input: {
    gamepad: true,
  },
  scene: [PlayerSelectScene, GameScene, GameOverScene],
};

new Phaser.Game(config);
