import Phaser from 'phaser';
import { SCREEN_WIDTH, COLORS, Difficulty, PlayerType } from '../constants';

export class PlayerSelectScene extends Phaser.Scene {
  private selectedPlayer: PlayerType = 1;
  private difficulty: Difficulty = 'ノーマル';
  private selectionMode: 'player' | 'difficulty' = 'player';
  private playerText!: Phaser.GameObjects.Text;
  private difficultyText!: Phaser.GameObjects.Text;
  private playerShip!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;
  private lastAxisX = 0;
  private lastAxisY = 0;
  private axisCooldown = 0;
  private buttonCooldown = 0;

  constructor() {
    super({ key: 'PlayerSelectScene' });
  }

  create() {
    // Title
    this.add.text(SCREEN_WIDTH / 2, 100, 'Player Select', {
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Player selection text
    this.playerText = this.add.text(SCREEN_WIDTH / 2, 220, `Player ${this.selectedPlayer}`, {
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Player ship preview
    this.playerShip = this.add.graphics();
    this.drawPlayerShip();

    // Difficulty selection text
    this.difficultyText = this.add.text(SCREEN_WIDTH / 2, 380, `難易度: ${this.difficulty}`, {
      fontSize: '36px',
      color: '#888888',
    }).setOrigin(0.5);

    // Instructions
    this.add.text(SCREEN_WIDTH / 2, 480, '↑↓: 選択モード切替  ←→: 選択', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(SCREEN_WIDTH / 2, 520, 'Enter: ゲーム開始', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Input setup
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
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
    // Cooldowns
    if (this.axisCooldown > 0) this.axisCooldown--;
    if (this.buttonCooldown > 0) this.buttonCooldown--;

    this.handleGamepadInput();
    this.handleKeyboardInput();
    this.updateUI();
  }

  private handleGamepadInput() {
    if (!this.gamepad || this.axisCooldown > 0) return;

    const axisX = this.gamepad.axes[0]?.getValue() ?? 0;
    const axisY = this.gamepad.axes[1]?.getValue() ?? 0;

    // D-Pad
    const dpadLeft = this.gamepad.buttons[14]?.pressed;
    const dpadRight = this.gamepad.buttons[15]?.pressed;
    const dpadUp = this.gamepad.buttons[12]?.pressed;
    const dpadDown = this.gamepad.buttons[13]?.pressed;

    // Horizontal selection
    if ((axisX > 0.5 && this.lastAxisX <= 0.5) || dpadRight) {
      this.changeSelection(1);
      this.axisCooldown = 15;
    } else if ((axisX < -0.5 && this.lastAxisX >= -0.5) || dpadLeft) {
      this.changeSelection(-1);
      this.axisCooldown = 15;
    }

    // Vertical mode switch
    if ((axisY > 0.5 && this.lastAxisY <= 0.5) || dpadDown) {
      this.selectionMode = 'difficulty';
      this.axisCooldown = 15;
    } else if ((axisY < -0.5 && this.lastAxisY >= -0.5) || dpadUp) {
      this.selectionMode = 'player';
      this.axisCooldown = 15;
    }

    this.lastAxisX = axisX;
    this.lastAxisY = axisY;

    // A button to start
    if (this.gamepad.buttons[0]?.pressed && this.buttonCooldown === 0) {
      this.startGame();
      this.buttonCooldown = 30;
    }

    // B button to switch mode
    if (this.gamepad.buttons[1]?.pressed && this.buttonCooldown === 0) {
      this.selectionMode = this.selectionMode === 'player' ? 'difficulty' : 'player';
      this.buttonCooldown = 15;
    }
  }

  private handleKeyboardInput() {
    if (!this.cursors) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.changeSelection(1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.changeSelection(-1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectionMode = 'difficulty';
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectionMode = 'player';
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.startGame();
    }
  }

  private changeSelection(direction: number) {
    if (this.selectionMode === 'player') {
      this.selectedPlayer = ((this.selectedPlayer - 1 + direction + 3) % 3 + 1) as PlayerType;
      this.drawPlayerShip();
    } else {
      const difficulties: Difficulty[] = ['イージー', 'ノーマル', 'ハード'];
      const currentIndex = difficulties.indexOf(this.difficulty);
      this.difficulty = difficulties[(currentIndex + direction + 3) % 3];
    }
  }

  private updateUI() {
    this.playerText.setText(`Player ${this.selectedPlayer}`);
    this.difficultyText.setText(`難易度: ${this.difficulty}`);

    if (this.selectionMode === 'player') {
      this.playerText.setColor('#ffffff');
      this.difficultyText.setColor('#888888');
    } else {
      this.playerText.setColor('#888888');
      this.difficultyText.setColor('#ffffff');
    }
  }

  private drawPlayerShip() {
    this.playerShip.clear();

    const x = SCREEN_WIDTH / 2;
    const y = 300;
    const width = 30;

    let mainColor: number;
    switch (this.selectedPlayer) {
      case 1:
        mainColor = COLORS.BLUE;
        break;
      case 2:
        mainColor = COLORS.YELLOW;
        break;
      case 3:
        mainColor = COLORS.GREEN;
        break;
    }

    // Main body triangle
    this.playerShip.fillStyle(mainColor);
    this.playerShip.fillTriangle(
      x, y - 20,
      x - width / 2 + 5, y - 5,
      x + width / 2 - 5, y - 5
    );

    // Body rectangle
    this.playerShip.fillRect(x - width / 2 + 8, y - 5, width - 16, 20);

    // Engines (orange)
    this.playerShip.fillStyle(COLORS.ORANGE);
    if (this.selectedPlayer === 3) {
      this.playerShip.fillRect(x - 9, y + 15, 4, 5);
      this.playerShip.fillRect(x - 2, y + 15, 4, 5);
      this.playerShip.fillRect(x + 5, y + 15, 4, 5);
    } else {
      this.playerShip.fillRect(x - 5, y + 15, 4, 5);
      this.playerShip.fillRect(x + 1, y + 15, 4, 5);
    }

    // Cockpit
    this.playerShip.fillStyle(COLORS.WHITE);
    this.playerShip.fillCircle(x, y - 10, 3);
  }

  private startGame() {
    this.scene.start('GameScene', {
      playerType: this.selectedPlayer,
      difficulty: this.difficulty,
    });
  }
}
