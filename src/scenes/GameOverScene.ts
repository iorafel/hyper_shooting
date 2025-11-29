import Phaser from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../constants';

export class GameOverScene extends Phaser.Scene {
  private rKey!: Phaser.Input.Keyboard.Key;
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;
  private buttonCooldown = 0;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    // Game Over text
    this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
    }).setOrigin(0.5);

    // Restart instruction
    this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 20, 'Press R to restart', {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Input setup
    if (this.input.keyboard) {
      this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    }

    // Gamepad setup
    if (this.input.gamepad) {
      this.input.gamepad.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
        this.gamepad = pad;
      });
      if (this.input.gamepad.total > 0) {
        this.gamepad = this.input.gamepad.getPad(0);
      }
    }
  }

  update() {
    if (this.buttonCooldown > 0) this.buttonCooldown--;

    // Keyboard R to restart
    if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
      this.scene.start('PlayerSelectScene');
    }

    // Gamepad A button to restart
    if (this.gamepad && this.gamepad.buttons[0]?.pressed && this.buttonCooldown === 0) {
      this.scene.start('PlayerSelectScene');
      this.buttonCooldown = 30;
    }
  }
}
