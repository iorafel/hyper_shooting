import Phaser from 'phaser';
import { SCREEN_HEIGHT, GAME_WIDTH, COLORS, Difficulty, PlayerType } from '../constants';

interface GameData {
  playerType: PlayerType;
  difficulty: Difficulty;
}

interface Bullet {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  dx: number;
  dy: number;
  width: number;
  height: number;
  isRotating?: boolean;
  rotationAngle?: number;
}

interface Enemy {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  enemyType: number;
  bullets: Bullet[];
  shootTimer: number;
  rotationAngle: number;
}

interface Boss {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  maxHp: number;
  bullets: Bullet[];
  shootTimer: number;
  rotationAngle: number;
  isDying: boolean;
  deathTimer: number;
  explosionCount: number;
}

interface Explosion {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
  sizeMultiplier: number;
  type: 'normal' | 'special' | 'grenade';
}

interface PowerUp {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'speed' | 'hp';
}

interface Apple {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Grenade {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  timer: number;
  moveTime: number;
  dx: number;
  dy: number;
  arrived: boolean;
  arrivalTimer: number;
  explosionDelay: number;
  rotation: number;
}

interface MagatamaBoss {
  graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  bullets: Bullet[];
  shootTimer: number;
  isDying: boolean;
  rageMode: boolean;
  side: 'left' | 'right';
  targetX: number;
  targetY: number;
  movingToRagePosition: boolean;
  moveSpeed: number;
}

interface TwinBoss {
  boss1: MagatamaBoss;
  boss2: MagatamaBoss;
  isDying: boolean;
  deathTimer: number;
  bulletsSaved: boolean;
}

export class GameScene extends Phaser.Scene {
  private playerType: PlayerType = 1;
  private difficulty: Difficulty = 'ノーマル';

  private playerGraphics!: Phaser.GameObjects.Graphics;
  private playerX = 0;
  private playerY = 0;
  private playerWidth = 30;
  private playerHeight = 40;
  private playerSpeed = 5;
  private baseSpeed = 5;
  private playerBullets: Bullet[] = [];
  private specialBullets: Bullet[] = [];
  private lastShotTime = 0;
  private isInvincible = false;
  private invincibleTimer = 0;
  private defeatedEnemies = 0;

  private enemies: Enemy[] = [];
  private enemySpawnTimer = 0;
  private enemyCount = 0;
  private defeatedEnemyCount = 0;

  private boss: Boss | null = null;
  private twinBoss: TwinBoss | null = null;
  private bossDefeatedCount = 0;

  private explosions: Explosion[] = [];
  private powerups: PowerUp[] = [];
  private apples: Apple[] = [];
  private appleTimer = 0;
  private independentBullets: Bullet[] = [];
  private grenades: Grenade[] = [];
  private grenadeCount = 2;

  private hardAttackTimer = 0;
  private warningTimer = 0;
  private warningSide: 'left' | 'right' | null = null;
  private isWarningActive = false;
  private hardBullets: Bullet[] = [];
  private warningGraphics!: Phaser.GameObjects.Graphics;

  private score = 0;
  private highScore = 0;
  private lives = 3;

  private gameStartTimer = 180;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private gKey!: Phaser.Input.Keyboard.Key;
  private f6Key!: Phaser.Input.Keyboard.Key;
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;
  private buttonCooldown = 0;

  private uiGraphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private grenadeText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameData) {
    this.playerType = data.playerType || 1;
    this.difficulty = data.difficulty || 'ノーマル';
  }

  create() {
    // Initialize player position
    this.playerX = GAME_WIDTH / 2;
    this.playerY = SCREEN_HEIGHT - 80;

    // Reset game state
    this.playerBullets = [];
    this.specialBullets = [];
    this.enemies = [];
    this.boss = null;
    this.twinBoss = null;
    this.explosions = [];
    this.powerups = [];
    this.apples = [];
    this.independentBullets = [];
    this.grenades = [];
    this.hardBullets = [];

    this.score = 0;
    this.defeatedEnemyCount = 0;
    this.bossDefeatedCount = 0;
    this.grenadeCount = 2;
    this.enemySpawnTimer = 0;
    this.enemyCount = 0;
    this.gameStartTimer = 180;
    this.appleTimer = 0;
    this.hardAttackTimer = 0;
    this.warningTimer = 0;
    this.warningSide = null;
    this.isWarningActive = false;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.defeatedEnemies = 0;
    this.lastShotTime = 0;
    this.playerSpeed = this.baseSpeed;

    // Set lives based on difficulty and player type
    if (this.difficulty === 'イージー') {
      this.lives = 5;
    } else if (this.difficulty === 'ハード') {
      this.lives = this.playerType === 3 ? 4 : 6;
    } else {
      this.lives = this.playerType === 3 ? 1 : 3;
    }

    // Create graphics objects
    this.playerGraphics = this.add.graphics();
    this.uiGraphics = this.add.graphics();
    this.warningGraphics = this.add.graphics();

    // UI divider line
    this.uiGraphics.lineStyle(2, COLORS.WHITE);
    this.uiGraphics.lineBetween(GAME_WIDTH, 0, GAME_WIDTH, SCREEN_HEIGHT);

    // UI Text
    this.scoreText = this.add.text(GAME_WIDTH + 10, 50, `Score: ${this.score}`, {
      fontSize: '24px',
      color: '#ffffff',
    });

    this.highScoreText = this.add.text(GAME_WIDTH + 10, 90, `High: ${this.highScore}`, {
      fontSize: '24px',
      color: '#ffffff',
    });

    this.add.text(GAME_WIDTH + 10, 130, 'Lives:', {
      fontSize: '24px',
      color: '#ffffff',
    });

    this.grenadeText = this.add.text(GAME_WIDTH + 10, 200, `Grenades: ${this.grenadeCount}`, {
      fontSize: '24px',
      color: '#ffffff',
    });

    this.titleText = this.add.text(GAME_WIDTH / 2, SCREEN_HEIGHT / 2, '超弾幕シューティングゲーム', {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Input setup
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.gKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
      this.f6Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F6);
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

  update(_time: number, _delta: number) {
    if (this.buttonCooldown > 0) this.buttonCooldown--;

    // Start countdown
    if (this.gameStartTimer > 0) {
      this.gameStartTimer--;
      this.titleText.setVisible(true);
      this.drawPlayer();
      this.drawUI();
      return;
    }
    this.titleText.setVisible(false);

    // Handle input
    this.handleInput();

    // Update game objects
    this.updatePlayer();
    this.updateBullets();
    this.updateEnemies();
    this.updateBoss();
    this.updateTwinBoss();
    this.updateExplosions();
    this.updatePowerups();
    this.updateApples();
    this.updateGrenades();
    this.updateHardMode();

    // Check collisions
    this.checkCollisions();

    // Spawn enemies
    this.spawnEnemies();

    // Draw everything
    this.drawAll();
  }

  private handleInput() {
    // Keyboard movement
    if (this.cursors.left.isDown && this.playerX > 0) {
      this.playerX -= this.playerSpeed;
    }
    if (this.cursors.right.isDown && this.playerX < GAME_WIDTH - this.playerWidth) {
      this.playerX += this.playerSpeed;
    }
    if (this.cursors.up.isDown && this.playerY > 0) {
      this.playerY -= this.playerSpeed;
    }
    if (this.cursors.down.isDown && this.playerY < SCREEN_HEIGHT - this.playerHeight) {
      this.playerY += this.playerSpeed;
    }

    // Gamepad movement
    if (this.gamepad) {
      const axisX = this.gamepad.axes[0]?.getValue() ?? 0;
      const axisY = this.gamepad.axes[1]?.getValue() ?? 0;

      if (Math.abs(axisX) > 0.1) {
        const newX = this.playerX + axisX * this.playerSpeed;
        if (newX >= 0 && newX <= GAME_WIDTH - this.playerWidth) {
          this.playerX = newX;
        }
      }
      if (Math.abs(axisY) > 0.1) {
        const newY = this.playerY + axisY * this.playerSpeed;
        if (newY >= 0 && newY <= SCREEN_HEIGHT - this.playerHeight) {
          this.playerY = newY;
        }
      }

      // D-pad
      if (this.gamepad.buttons[14]?.pressed && this.playerX > 0) {
        this.playerX -= this.playerSpeed;
      }
      if (this.gamepad.buttons[15]?.pressed && this.playerX < GAME_WIDTH - this.playerWidth) {
        this.playerX += this.playerSpeed;
      }
      if (this.gamepad.buttons[12]?.pressed && this.playerY > 0) {
        this.playerY -= this.playerSpeed;
      }
      if (this.gamepad.buttons[13]?.pressed && this.playerY < SCREEN_HEIGHT - this.playerHeight) {
        this.playerY += this.playerSpeed;
      }
    }

    // Shooting
    if (this.spaceKey.isDown || (this.gamepad && this.gamepad.buttons[0]?.pressed)) {
      this.shoot();
    }

    // Grenade
    if (Phaser.Input.Keyboard.JustDown(this.gKey) ||
        (this.gamepad && this.gamepad.buttons[2]?.pressed && this.buttonCooldown === 0)) {
      this.throwGrenades();
      this.buttonCooldown = 30;
    }

    // Boss summon (B button when no boss)
    if (this.gamepad && this.gamepad.buttons[1]?.pressed && this.buttonCooldown === 0) {
      if (!this.boss) {
        this.spawnBoss();
      } else {
        this.throwGrenades();
      }
      this.buttonCooldown = 30;
    }

    // Return to player select
    if (Phaser.Input.Keyboard.JustDown(this.f6Key) ||
        (this.gamepad && this.gamepad.buttons[7]?.pressed && this.buttonCooldown === 0)) {
      this.scene.start('PlayerSelectScene');
      this.buttonCooldown = 30;
    }
  }

  private shoot() {
    const currentTime = this.time.now;
    const centerX = this.playerX + this.playerWidth / 2;
    const bulletY = this.playerY;

    if (this.playerType === 1) {
      const bullet = this.createBullet(centerX, bulletY, 0, -8, COLORS.BLUE);
      this.playerBullets.push(bullet);
    } else if (this.playerType === 2) {
      // Player 2: 0.5 second interval
      if (currentTime - this.lastShotTime >= 500) {
        const bullet = this.createBullet(centerX, bulletY, 0, -8, COLORS.YELLOW, true);
        this.specialBullets.push(bullet);
        this.lastShotTime = currentTime;
      }
    } else if (this.playerType === 3) {
      // Player 3: 0.2 second interval, fan pattern
      if (currentTime - this.lastShotTime >= 200) {
        const bulletCount = Math.min(this.lives, 10);
        if (bulletCount === 1) {
          const bullet = this.createBullet(centerX, bulletY, 0, -8, COLORS.GREEN);
          this.playerBullets.push(bullet);
        } else {
          for (let i = 0; i < bulletCount; i++) {
            const angleOffset = (i - (bulletCount - 1) / 2) * 15;
            const angleRad = angleOffset * Math.PI / 180;
            const dx = 3 * Math.sin(angleRad);
            const dy = -8 * Math.cos(angleRad);
            const bullet = this.createBullet(centerX, bulletY, dx, dy, COLORS.GREEN);
            this.playerBullets.push(bullet);
          }
        }
        this.lastShotTime = currentTime;
      }
    }
  }

  private createBullet(x: number, y: number, dx: number, dy: number, _color: number, isSpecial = false): Bullet {
    const graphics = this.add.graphics();
    return {
      graphics,
      x,
      y,
      dx,
      dy,
      width: isSpecial ? 6 : 4,
      height: isSpecial ? 6 : 8,
      isRotating: false,
      rotationAngle: 0,
    };
  }

  private updatePlayer() {
    // Invincibility
    if (this.isInvincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
      }
    }
  }

  private updateBullets() {
    // Player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;

      if (bullet.y < 0 || bullet.x < 0 || bullet.x > GAME_WIDTH) {
        bullet.graphics.destroy();
        this.playerBullets.splice(i, 1);
      }
    }

    // Special bullets
    for (let i = this.specialBullets.length - 1; i >= 0; i--) {
      const bullet = this.specialBullets[i];
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;

      if (bullet.y < 0) {
        bullet.graphics.destroy();
        this.specialBullets.splice(i, 1);
      }
    }

    // Independent bullets
    for (let i = this.independentBullets.length - 1; i >= 0; i--) {
      const bullet = this.independentBullets[i];
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;

      if (bullet.isRotating) {
        bullet.rotationAngle = (bullet.rotationAngle ?? 0) + 8;
      }

      if (bullet.x < 0 || bullet.x > GAME_WIDTH || bullet.y < 0 || bullet.y > SCREEN_HEIGHT) {
        bullet.graphics.destroy();
        this.independentBullets.splice(i, 1);
      }
    }

    // Hard mode bullets
    for (let i = this.hardBullets.length - 1; i >= 0; i--) {
      const bullet = this.hardBullets[i];
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;

      if (bullet.x < -50 || bullet.x > GAME_WIDTH + 50 || bullet.y < -50 || bullet.y > SCREEN_HEIGHT + 50) {
        bullet.graphics.destroy();
        this.hardBullets.splice(i, 1);
      }
    }
  }

  private updateEnemies() {
    const playerCenterX = this.playerX + this.playerWidth / 2;
    const playerCenterY = this.playerY + this.playerHeight / 2;

    // Shoot intervals based on difficulty
    let shootInterval1: number, shootInterval2: number;
    if (this.difficulty === 'イージー') {
      shootInterval1 = 300;
      shootInterval2 = 180;
    } else if (this.difficulty === 'ノーマル') {
      shootInterval1 = 180;
      shootInterval2 = 120;
    } else {
      shootInterval1 = 80;
      shootInterval2 = 60;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += enemy.speed;
      enemy.shootTimer++;

      if (enemy.enemyType === 3) {
        enemy.rotationAngle += 5;
      }

      // Enemy shooting
      if (enemy.enemyType === 1 && enemy.shootTimer % shootInterval1 === 0) {
        const angle = Math.atan2(playerCenterY - enemy.y, playerCenterX - (enemy.x + enemy.width / 2));
        const bullet = this.createEnemyBullet(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height,
          3 * Math.cos(angle),
          3 * Math.sin(angle)
        );
        enemy.bullets.push(bullet);
      } else if (enemy.enemyType === 2 && enemy.shootTimer % shootInterval2 === 0) {
        for (let j = 0; j < 16; j++) {
          const angle = (j * 22.5) * Math.PI / 180;
          const bullet = this.createEnemyBullet(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            2 * Math.cos(angle),
            2 * Math.sin(angle)
          );
          enemy.bullets.push(bullet);
        }
      } else if (enemy.enemyType === 3 && enemy.shootTimer % 90 === 0) {
        const baseAngle = Math.atan2(playerCenterY - enemy.y, playerCenterX - (enemy.x + enemy.width / 2));
        for (let j = 0; j < 3; j++) {
          const angleOffset = (j - 1) * 0.3;
          const bullet = this.createEnemyBullet(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            2.5 * Math.cos(baseAngle + angleOffset),
            2.5 * Math.sin(baseAngle + angleOffset),
            true,
            enemy.rotationAngle
          );
          enemy.bullets.push(bullet);
        }
      }

      // Update enemy bullets
      for (let j = enemy.bullets.length - 1; j >= 0; j--) {
        const bullet = enemy.bullets[j];
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        if (bullet.isRotating) {
          bullet.rotationAngle = (bullet.rotationAngle ?? 0) + 8;
        }

        if (bullet.x < 0 || bullet.x > GAME_WIDTH || bullet.y < 0 || bullet.y > SCREEN_HEIGHT) {
          bullet.graphics.destroy();
          enemy.bullets.splice(j, 1);
        }
      }

      // Remove enemy if off screen
      if (enemy.y > SCREEN_HEIGHT) {
        // Move bullets to independent
        for (const bullet of enemy.bullets) {
          this.independentBullets.push(bullet);
        }
        enemy.graphics.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  private createEnemyBullet(x: number, y: number, dx: number, dy: number, isRotating = false, rotation = 0): Bullet {
    const graphics = this.add.graphics();
    return {
      graphics,
      x,
      y,
      dx,
      dy,
      width: isRotating ? 10 : 6,
      height: isRotating ? 10 : 6,
      isRotating,
      rotationAngle: rotation,
    };
  }

  private updateBoss() {
    if (!this.boss) return;

    const playerCenterX = this.playerX + this.playerWidth / 2;
    const playerCenterY = this.playerY + this.playerHeight / 2;

    if (!this.boss.isDying) {
      // Movement
      this.boss.x += this.boss.speed;
      if (this.boss.x <= 0 || this.boss.x >= GAME_WIDTH - this.boss.width) {
        this.boss.speed = -this.boss.speed;
      }

      this.boss.shootTimer++;

      // Shooting based on difficulty
      if (this.difficulty === 'イージー' && this.boss.shootTimer % 120 === 0) {
        for (const angleOffset of [-20, 0, 20]) {
          const angle = Math.atan2(playerCenterY - this.boss.y, playerCenterX - (this.boss.x + this.boss.width / 2)) + angleOffset * Math.PI / 180;
          const bullet = this.createEnemyBullet(
            this.boss.x + this.boss.width / 2,
            this.boss.y + this.boss.height,
            3 * Math.cos(angle),
            3 * Math.sin(angle)
          );
          this.boss.bullets.push(bullet);
        }
      } else if (this.difficulty === 'ノーマル' && this.boss.shootTimer % 90 === 0) {
        for (let i = 0; i < 16; i++) {
          const angle = (i * 22.5) * Math.PI / 180;
          const bullet = this.createEnemyBullet(
            this.boss.x + this.boss.width / 2,
            this.boss.y + this.boss.height / 2,
            2 * Math.cos(angle),
            2 * Math.sin(angle)
          );
          this.boss.bullets.push(bullet);
        }
      } else if (this.difficulty === 'ハード' && this.boss.shootTimer % 60 === 0) {
        this.boss.rotationAngle += 5.625;
        for (let i = 0; i < 32; i++) {
          const baseAngle = (i * 11.25) * Math.PI / 180;
          const angle = baseAngle + this.boss.rotationAngle * Math.PI / 180;
          const bullet = this.createEnemyBullet(
            this.boss.x + this.boss.width / 2,
            this.boss.y + this.boss.height / 2,
            2 * Math.cos(angle),
            2 * Math.sin(angle)
          );
          this.boss.bullets.push(bullet);
        }
      }
    } else {
      // Death animation
      this.boss.deathTimer++;
      if (this.boss.deathTimer % 30 === 0 && this.boss.explosionCount < 5) {
        this.boss.explosionCount++;
        const ex = this.boss.x + Math.random() * this.boss.width;
        const ey = this.boss.y + Math.random() * this.boss.height;
        this.createExplosion(ex, ey, 2 + this.boss.explosionCount);
      }

      if (this.boss.explosionCount >= 5) {
        // Boss defeated
        this.score += 5000;
        this.grenadeCount += 2;
        this.bossDefeatedCount++;

        for (const bullet of this.boss.bullets) {
          this.independentBullets.push(bullet);
        }

        this.boss.graphics.destroy();
        this.boss = null;
        this.defeatedEnemyCount = 0;
        return;
      }
    }

    // Update boss bullets
    if (this.boss) {
      for (let i = this.boss.bullets.length - 1; i >= 0; i--) {
        const bullet = this.boss.bullets[i];
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        if (bullet.x < 0 || bullet.x > GAME_WIDTH || bullet.y < 0 || bullet.y > SCREEN_HEIGHT) {
          bullet.graphics.destroy();
          this.boss.bullets.splice(i, 1);
        }
      }
    }
  }

  private updateTwinBoss() {
    if (!this.twinBoss) return;

    const playerCenterX = this.playerX + this.playerWidth / 2;
    const playerCenterY = this.playerY + this.playerHeight / 2;

    if (!this.twinBoss.isDying) {
      // Update each magatama boss
      this.updateMagatamaBoss(this.twinBoss.boss1, playerCenterX, playerCenterY);
      this.updateMagatamaBoss(this.twinBoss.boss2, playerCenterX, playerCenterY);

      // If one dies, other enters rage mode
      if (this.twinBoss.boss1.isDying && !this.twinBoss.boss2.isDying && !this.twinBoss.boss2.rageMode) {
        this.enterRageMode(this.twinBoss.boss2);
      } else if (this.twinBoss.boss2.isDying && !this.twinBoss.boss1.isDying && !this.twinBoss.boss1.rageMode) {
        this.enterRageMode(this.twinBoss.boss1);
      }

      // Both dead -> start death sequence
      if (this.twinBoss.boss1.isDying && this.twinBoss.boss2.isDying) {
        this.twinBoss.isDying = true;
        this.twinBoss.deathTimer = 0;
      }
    } else {
      this.twinBoss.deathTimer++;

      // Save bullets to independent
      if (!this.twinBoss.bulletsSaved) {
        for (const bullet of this.twinBoss.boss1.bullets) {
          this.independentBullets.push(bullet);
        }
        for (const bullet of this.twinBoss.boss2.bullets) {
          this.independentBullets.push(bullet);
        }
        this.twinBoss.bulletsSaved = true;
      }

      // Death explosions
      if (this.twinBoss.deathTimer % 15 === 1 && this.twinBoss.deathTimer < 60) {
        const ex = GAME_WIDTH / 2 + (Math.random() * 80 - 40);
        const ey = 100 + (Math.random() * 40 - 20);
        this.createExplosion(ex, ey, 3);
      }

      // Twin boss defeated
      if (this.twinBoss.deathTimer >= 60) {
        this.score += 5000;
        this.grenadeCount += 2;
        this.bossDefeatedCount++;

        this.twinBoss.boss1.graphics.destroy();
        this.twinBoss.boss2.graphics.destroy();
        this.twinBoss = null;
        this.defeatedEnemyCount = 0;
        return;
      }
    }

    // Update bullets for both bosses
    if (this.twinBoss && !this.twinBoss.isDying) {
      this.updateMagatamaBullets(this.twinBoss.boss1);
      this.updateMagatamaBullets(this.twinBoss.boss2);
    }
  }

  private updateMagatamaBoss(boss: MagatamaBoss, playerX: number, playerY: number) {
    if (boss.isDying) return;

    boss.shootTimer++;

    // Rage mode movement
    if (boss.rageMode && boss.movingToRagePosition) {
      const dx = boss.targetX - boss.x;
      const dy = boss.targetY - boss.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 2) {
        boss.x += (dx / distance) * boss.moveSpeed;
        boss.y += (dy / distance) * boss.moveSpeed;
      } else {
        boss.movingToRagePosition = false;
      }
    }

    // Shooting
    if (!boss.movingToRagePosition) {
      if (boss.rageMode && boss.shootTimer % 30 === 0) {
        // Rage mode attack patterns
        const pattern = Math.floor(boss.shootTimer / 180) % 4;

        if (pattern === 0) {
          // Pattern 1: 5 bullets toward center
          const centerX = GAME_WIDTH / 2;
          const centerY = SCREEN_HEIGHT / 2;
          const baseAngle = Math.atan2(centerY - boss.y, centerX - (boss.x + boss.width / 2));
          for (let i = 0; i < 5; i++) {
            const angleOffset = (i - 2) * 22.5 * Math.PI / 180;
            const bullet = this.createEnemyBullet(
              boss.x + boss.width / 2,
              boss.y + boss.height / 2,
              3 * Math.cos(baseAngle + angleOffset),
              3 * Math.sin(baseAngle + angleOffset)
            );
            boss.bullets.push(bullet);
          }
        } else if (pattern === 1) {
          // Pattern 2: 8-way
          for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const bullet = this.createEnemyBullet(
              boss.x + boss.width / 2,
              boss.y + boss.height / 2,
              3.5 * Math.cos(angle),
              3.5 * Math.sin(angle)
            );
            boss.bullets.push(bullet);
          }
        } else if (pattern === 2) {
          // Pattern 3: Spiral
          const spiralAngle = (boss.shootTimer * 15) % 360;
          for (let i = 0; i < 3; i++) {
            const angle = (spiralAngle + i * 120) * Math.PI / 180;
            const bullet = this.createEnemyBullet(
              boss.x + boss.width / 2,
              boss.y + boss.height / 2,
              2.5 * Math.cos(angle),
              2.5 * Math.sin(angle)
            );
            boss.bullets.push(bullet);
          }
        } else {
          // Pattern 4: Player tracking
          const playerAngle = Math.atan2(playerY - boss.y, playerX - (boss.x + boss.width / 2));
          for (let i = 0; i < 7; i++) {
            const angleOffset = (i - 3) * 15 * Math.PI / 180;
            const bullet = this.createEnemyBullet(
              boss.x + boss.width / 2,
              boss.y + boss.height / 2,
              4 * Math.cos(playerAngle + angleOffset),
              4 * Math.sin(playerAngle + angleOffset)
            );
            boss.bullets.push(bullet);
          }
        }

        // Special attack: fast bullets every 6 seconds for 2 seconds
        const rageCycle = Math.floor(boss.shootTimer / 360) % 2;
        if (rageCycle === 0 && boss.shootTimer % 5 === 0) {
          const playerAngle = Math.atan2(playerY - boss.y, playerX - (boss.x + boss.width / 2));
          const bullet = this.createEnemyBullet(
            boss.x + boss.width / 2,
            boss.y + boss.height / 2,
            8 * Math.cos(playerAngle),
            8 * Math.sin(playerAngle)
          );
          boss.bullets.push(bullet);
        }
      } else if (!boss.rageMode && boss.shootTimer % 90 === 0) {
        // Normal mode: 3 bullets toward player
        const angle = Math.atan2(playerY - boss.y, playerX - (boss.x + boss.width / 2));
        for (let i = 0; i < 3; i++) {
          const angleOffset = (i - 1) * 0.2;
          const bullet = this.createEnemyBullet(
            boss.x + boss.width / 2,
            boss.y + boss.height / 2,
            2.5 * Math.cos(angle + angleOffset),
            2.5 * Math.sin(angle + angleOffset)
          );
          boss.bullets.push(bullet);
        }
      }
    }
  }

  private updateMagatamaBullets(boss: MagatamaBoss) {
    for (let i = boss.bullets.length - 1; i >= 0; i--) {
      const bullet = boss.bullets[i];
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;

      if (bullet.x < 0 || bullet.x > GAME_WIDTH || bullet.y < 0 || bullet.y > SCREEN_HEIGHT) {
        bullet.graphics.destroy();
        boss.bullets.splice(i, 1);
      }
    }
  }

  private enterRageMode(boss: MagatamaBoss) {
    boss.rageMode = true;
    boss.movingToRagePosition = true;
    boss.targetX = GAME_WIDTH / 2;
    boss.targetY = 30;
  }

  private updateExplosions() {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      explosion.timer++;

      if (explosion.timer >= explosion.maxTimer) {
        explosion.graphics.destroy();
        this.explosions.splice(i, 1);
      }
    }
  }

  private updatePowerups() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      powerup.y += 2.2;

      if (powerup.y > SCREEN_HEIGHT) {
        powerup.graphics.destroy();
        this.powerups.splice(i, 1);
      }
    }
  }

  private updateApples() {
    this.appleTimer++;
    if (this.appleTimer >= 3000) {
      this.appleTimer = 0;
      this.createApple();
    }

    for (let i = this.apples.length - 1; i >= 0; i--) {
      const apple = this.apples[i];
      apple.y += 2.5;

      if (apple.y > SCREEN_HEIGHT) {
        apple.graphics.destroy();
        this.apples.splice(i, 1);
      }
    }
  }

  private updateGrenades() {
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const grenade = this.grenades[i];
      grenade.timer++;
      grenade.rotation += 8;

      if (grenade.timer <= grenade.moveTime) {
        grenade.x += grenade.dx;
        grenade.y += grenade.dy;
      } else if (!grenade.arrived) {
        grenade.arrived = true;
        grenade.x = grenade.targetX;
        grenade.y = grenade.targetY;
      } else {
        grenade.arrivalTimer++;
      }

      if (grenade.arrived && grenade.arrivalTimer >= grenade.explosionDelay) {
        // Grenade explosion
        if (this.boss && !this.boss.isDying) {
          const bossDamage = Math.floor(this.boss.maxHp * 0.2);
          this.boss.hp -= bossDamage;
          if (this.boss.hp <= 0) {
            this.boss.isDying = true;
            this.boss.deathTimer = 0;
            this.boss.explosionCount = 0;
          }
          this.createExplosion(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 8, 'special');
        }

        // Grenade damage to twin boss
        if (this.twinBoss && !this.twinBoss.isDying) {
          for (const magatamaBoss of [this.twinBoss.boss1, this.twinBoss.boss2]) {
            if (!magatamaBoss.isDying) {
              const bossDamage = Math.floor(magatamaBoss.maxHp * 0.2);
              magatamaBoss.hp -= bossDamage;
              if (magatamaBoss.hp <= 0) {
                magatamaBoss.isDying = true;
              }
              this.createExplosion(magatamaBoss.x + magatamaBoss.width / 2, magatamaBoss.y + magatamaBoss.height / 2, 6, 'special');
            }
          }
        }

        // Destroy all enemies
        for (const enemy of this.enemies) {
          for (const bullet of enemy.bullets) {
            this.independentBullets.push(bullet);
          }
          enemy.graphics.destroy();
          this.score += 100;
        }
        this.enemies = [];

        this.createExplosion(grenade.targetX, grenade.targetY, 5, 'grenade');
        grenade.graphics.destroy();
        this.grenades.splice(i, 1);
      }
    }
  }

  private updateHardMode() {
    if (this.difficulty !== 'ハード') return;

    this.hardAttackTimer++;

    if (this.hardAttackTimer % 1200 === 0) {
      this.isWarningActive = true;
      this.warningTimer = 0;
      this.warningSide = Math.random() < 0.5 ? 'left' : 'right';
    }

    if (this.isWarningActive) {
      this.warningTimer++;
      if (this.warningTimer >= 300) {
        this.isWarningActive = false;
        this.launchHardAttack();
      }
    }
  }

  private launchHardAttack() {
    for (let i = 0; i < 120; i++) {
      let startX: number, startY: number, dx: number, dy: number;

      if (this.warningSide === 'left') {
        if (i < 60) {
          startX = Math.random() * (GAME_WIDTH / 2);
          startY = -20;
          dx = (Math.random() * 2) - 1;
          dy = 2 + Math.random() * 3;
        } else {
          startX = Math.random() * (GAME_WIDTH / 2);
          startY = SCREEN_HEIGHT + 20;
          dx = (Math.random() * 2) - 1;
          dy = -(2 + Math.random() * 3);
        }
      } else {
        if (i < 60) {
          startX = GAME_WIDTH / 2 + Math.random() * (GAME_WIDTH / 2);
          startY = -20;
          dx = (Math.random() * 2) - 1;
          dy = 2 + Math.random() * 3;
        } else {
          startX = GAME_WIDTH / 2 + Math.random() * (GAME_WIDTH / 2);
          startY = SCREEN_HEIGHT + 20;
          dx = (Math.random() * 2) - 1;
          dy = -(2 + Math.random() * 3);
        }
      }

      const bullet = this.createEnemyBullet(startX, startY, dx, dy);
      this.hardBullets.push(bullet);
    }
  }

  private spawnEnemies() {
    if (this.boss || this.twinBoss) return;

    const bossThreshold = this.bossDefeatedCount === 0 ? 15 : 30;

    if (this.defeatedEnemyCount >= bossThreshold) {
      this.spawnBoss();
      return;
    }

    this.enemySpawnTimer++;
    if (this.enemySpawnTimer >= 120) {
      this.enemySpawnTimer = 0;
      this.enemyCount++;

      let enemyType: number;
      if (this.bossDefeatedCount > 0 && Math.random() < 0.5) {
        enemyType = 3; // Enhanced enemy
      } else if (this.enemyCount % 3 === 0) {
        enemyType = 2; // Large enemy
      } else {
        enemyType = 1; // Normal enemy
      }

      this.createEnemy(enemyType);
    }
  }

  private createEnemy(type: number) {
    const graphics = this.add.graphics();
    let width: number, height: number, speed: number, hp: number;

    if (type === 3) {
      width = 35;
      height = 25;
      speed = 1.5;
      hp = 2;
    } else if (type === 2) {
      width = 40;
      height = 40;
      speed = 1;
      hp = 3;
    } else {
      width = 25;
      height = 25;
      speed = 2;
      hp = 1;
    }

    const x = Math.random() * (GAME_WIDTH - width);

    const enemy: Enemy = {
      graphics,
      x,
      y: -height,
      width,
      height,
      speed,
      hp,
      enemyType: type,
      bullets: [],
      shootTimer: 0,
      rotationAngle: 0,
    };

    this.enemies.push(enemy);
  }

  private spawnBoss() {
    if (this.bossDefeatedCount === 1) {
      // 2nd boss is Twin Boss
      this.spawnTwinBoss();
    } else {
      // 1st boss and 3rd+ boss is normal boss
      const graphics = this.add.graphics();
      this.boss = {
        graphics,
        x: GAME_WIDTH / 2 - 40,
        y: 50,
        width: 80,
        height: 80,
        speed: 1,
        hp: 20,
        maxHp: 20,
        bullets: [],
        shootTimer: 0,
        rotationAngle: 0,
        isDying: false,
        deathTimer: 0,
        explosionCount: 0,
      };
    }
  }

  private spawnTwinBoss() {
    const boss1 = this.createMagatamaBoss(GAME_WIDTH * 0.7, 80, 'right');
    const boss2 = this.createMagatamaBoss(GAME_WIDTH * 0.3, 80, 'left');
    this.twinBoss = {
      boss1,
      boss2,
      isDying: false,
      deathTimer: 0,
      bulletsSaved: false,
    };
  }

  private createMagatamaBoss(x: number, y: number, side: 'left' | 'right'): MagatamaBoss {
    const graphics = this.add.graphics();
    return {
      graphics,
      x,
      y,
      width: 60,
      height: 60,
      hp: 30,
      maxHp: 30,
      bullets: [],
      shootTimer: 0,
      isDying: false,
      rageMode: false,
      side,
      targetX: x,
      targetY: 30,
      movingToRagePosition: false,
      moveSpeed: 2,
    };
  }

  private createExplosion(x: number, y: number, sizeMultiplier = 1, type: 'normal' | 'special' | 'grenade' = 'normal') {
    const graphics = this.add.graphics();
    const explosion: Explosion = {
      graphics,
      x,
      y,
      timer: 0,
      maxTimer: type === 'normal' ? 20 : 40,
      sizeMultiplier,
      type,
    };
    this.explosions.push(explosion);
  }

  private createPowerup(x: number, y: number, type: 'speed' | 'hp') {
    const graphics = this.add.graphics();
    const powerup: PowerUp = {
      graphics,
      x: x - 10,
      y: y - 10,
      width: 20,
      height: 20,
      type,
    };
    this.powerups.push(powerup);
  }

  private createApple() {
    const graphics = this.add.graphics();
    const apple: Apple = {
      graphics,
      x: Math.random() * (GAME_WIDTH - 25),
      y: -25,
      width: 25,
      height: 25,
    };
    this.apples.push(apple);
  }

  private throwGrenades() {
    if (this.grenadeCount <= 0) return;
    if (this.boss && this.grenadeCount > 1) return;

    this.grenadeCount--;

    const playerCenterX = this.playerX + this.playerWidth / 2;
    const playerCenterY = this.playerY + this.playerHeight / 2;

    const targets = [
      { x: GAME_WIDTH / 2 + 100, y: SCREEN_HEIGHT / 3 },
      { x: GAME_WIDTH / 2 - 100, y: SCREEN_HEIGHT / 3 },
      { x: GAME_WIDTH / 2, y: SCREEN_HEIGHT / 2 + 100 },
    ];

    for (const target of targets) {
      const moveTime = 30;
      const graphics = this.add.graphics();
      const grenade: Grenade = {
        graphics,
        x: playerCenterX,
        y: playerCenterY,
        startX: playerCenterX,
        startY: playerCenterY,
        targetX: target.x,
        targetY: target.y,
        timer: 0,
        moveTime,
        dx: (target.x - playerCenterX) / moveTime,
        dy: (target.y - playerCenterY) / moveTime,
        arrived: false,
        arrivalTimer: 0,
        explosionDelay: 42,
        rotation: 0,
      };
      this.grenades.push(grenade);
    }
  }

  private checkCollisions() {
    // Player bullets vs enemies
    for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const bullet = this.playerBullets[bi];

      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];

        if (this.checkRectCollision(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height,
            enemy.x, enemy.y, enemy.width, enemy.height)) {
          bullet.graphics.destroy();
          this.playerBullets.splice(bi, 1);

          enemy.hp--;
          if (enemy.hp <= 0) {
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

            for (const b of enemy.bullets) {
              this.independentBullets.push(b);
            }

            enemy.graphics.destroy();
            this.enemies.splice(ei, 1);

            if (enemy.enemyType === 2) {
              this.score += 500;
            } else if (enemy.enemyType === 3) {
              this.score += 300;
            } else {
              this.score += 100;
            }

            this.defeatedEnemyCount++;
            if (this.playerType === 3) {
              this.defeatedEnemies++;
            }

            if (Math.random() < 0.5) {
              const powerupType = Math.random() < 0.5 ? 'speed' : 'hp';
              this.createPowerup(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, powerupType);
            }
          }
          break;
        }
      }
    }

    // Player bullets vs boss
    if (this.boss && !this.boss.isDying) {
      for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
        const bullet = this.playerBullets[bi];

        if (this.checkRectCollision(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height,
            this.boss.x, this.boss.y, this.boss.width, this.boss.height)) {
          bullet.graphics.destroy();
          this.playerBullets.splice(bi, 1);

          this.boss.hp--;
          this.createExplosion(bullet.x, bullet.y, 0.5);

          if (this.boss.hp <= 0) {
            this.boss.isDying = true;
            this.boss.deathTimer = 0;
            this.boss.explosionCount = 0;
          }
          break;
        }
      }

      // Special bullets vs boss
      for (let bi = this.specialBullets.length - 1; bi >= 0; bi--) {
        const bullet = this.specialBullets[bi];

        if (this.checkRectCollision(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height,
            this.boss.x, this.boss.y, this.boss.width, this.boss.height)) {
          bullet.graphics.destroy();
          this.specialBullets.splice(bi, 1);

          this.boss.hp -= 3;
          this.createExplosion(bullet.x, bullet.y, 1, 'special');

          if (this.boss.hp <= 0) {
            this.boss.isDying = true;
            this.boss.deathTimer = 0;
            this.boss.explosionCount = 0;
          }
          break;
        }
      }
    }

    // Player bullets vs twin boss
    if (this.twinBoss && !this.twinBoss.isDying) {
      for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
        const bullet = this.playerBullets[bi];
        let hit = false;

        for (const magatamaBoss of [this.twinBoss.boss1, this.twinBoss.boss2]) {
          if (!magatamaBoss.isDying && this.checkRectCollision(
              bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height,
              magatamaBoss.x, magatamaBoss.y, magatamaBoss.width, magatamaBoss.height)) {
            bullet.graphics.destroy();
            this.playerBullets.splice(bi, 1);

            magatamaBoss.hp--;
            this.createExplosion(bullet.x, bullet.y, 0.5);

            if (magatamaBoss.hp <= 0) {
              magatamaBoss.isDying = true;
            }
            hit = true;
            break;
          }
        }
        if (hit) break;
      }

      // Special bullets vs twin boss
      for (let bi = this.specialBullets.length - 1; bi >= 0; bi--) {
        const bullet = this.specialBullets[bi];
        let hit = false;

        for (const magatamaBoss of [this.twinBoss.boss1, this.twinBoss.boss2]) {
          if (!magatamaBoss.isDying && this.checkRectCollision(
              bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height,
              magatamaBoss.x, magatamaBoss.y, magatamaBoss.width, magatamaBoss.height)) {
            bullet.graphics.destroy();
            this.specialBullets.splice(bi, 1);

            magatamaBoss.hp -= 3;
            this.createExplosion(bullet.x, bullet.y, 1, 'special');

            if (magatamaBoss.hp <= 0) {
              magatamaBoss.isDying = true;
            }
            hit = true;
            break;
          }
        }
        if (hit) break;
      }
    }

    // Enemy bullets vs player
    if (!this.isInvincible) {
      // From enemies
      for (const enemy of this.enemies) {
        for (let bi = enemy.bullets.length - 1; bi >= 0; bi--) {
          const bullet = enemy.bullets[bi];
          if (this.checkRectCollision(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2,
              bullet.width, bullet.height,
              this.playerX, this.playerY, this.playerWidth, this.playerHeight)) {
            bullet.graphics.destroy();
            enemy.bullets.splice(bi, 1);
            this.takeDamage();
            break;
          }
        }
      }

      // From boss
      if (this.boss) {
        for (let bi = this.boss.bullets.length - 1; bi >= 0; bi--) {
          const bullet = this.boss.bullets[bi];
          if (this.checkRectCollision(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2,
              bullet.width, bullet.height,
              this.playerX, this.playerY, this.playerWidth, this.playerHeight)) {
            bullet.graphics.destroy();
            this.boss.bullets.splice(bi, 1);
            this.takeDamage();
            break;
          }
        }
      }

      // From twin boss
      if (this.twinBoss && !this.twinBoss.isDying) {
        for (const magatamaBoss of [this.twinBoss.boss1, this.twinBoss.boss2]) {
          if (!magatamaBoss.isDying) {
            for (let bi = magatamaBoss.bullets.length - 1; bi >= 0; bi--) {
              const bullet = magatamaBoss.bullets[bi];
              if (this.checkRectCollision(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2,
                  bullet.width, bullet.height,
                  this.playerX, this.playerY, this.playerWidth, this.playerHeight)) {
                bullet.graphics.destroy();
                magatamaBoss.bullets.splice(bi, 1);
                this.takeDamage();
                break;
              }
            }
          }
        }
      }

      // Independent bullets
      for (let bi = this.independentBullets.length - 1; bi >= 0; bi--) {
        const bullet = this.independentBullets[bi];
        if (this.checkRectCollision(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2,
            bullet.width, bullet.height,
            this.playerX, this.playerY, this.playerWidth, this.playerHeight)) {
          bullet.graphics.destroy();
          this.independentBullets.splice(bi, 1);
          this.takeDamage();
          break;
        }
      }

      // Hard bullets
      for (let bi = this.hardBullets.length - 1; bi >= 0; bi--) {
        const bullet = this.hardBullets[bi];
        if (this.checkRectCollision(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2,
            bullet.width, bullet.height,
            this.playerX, this.playerY, this.playerWidth, this.playerHeight)) {
          bullet.graphics.destroy();
          this.hardBullets.splice(bi, 1);
          this.takeDamage();
          break;
        }
      }

      // Enhanced enemy collision
      for (const enemy of this.enemies) {
        if (enemy.enemyType === 3) {
          if (this.checkRectCollision(enemy.x, enemy.y, enemy.width, enemy.height,
              this.playerX, this.playerY, this.playerWidth, this.playerHeight)) {
            this.takeDamage();
            break;
          }
        }
      }
    }

    // Powerups
    for (let pi = this.powerups.length - 1; pi >= 0; pi--) {
      const powerup = this.powerups[pi];
      if (this.checkRectCollision(powerup.x, powerup.y, powerup.width, powerup.height,
          this.playerX, this.playerY, this.playerWidth, this.playerHeight)) {
        powerup.graphics.destroy();
        this.powerups.splice(pi, 1);

        if (powerup.type === 'speed') {
          this.playerSpeed = Math.floor(this.baseSpeed * 1.5);
        } else {
          this.lives = Math.min(this.lives + 1, 10);
        }
      }
    }

    // Apples
    for (let ai = this.apples.length - 1; ai >= 0; ai--) {
      const apple = this.apples[ai];
      if (this.checkRectCollision(apple.x, apple.y, apple.width, apple.height,
          this.playerX, this.playerY, this.playerWidth, this.playerHeight)) {
        apple.graphics.destroy();
        this.apples.splice(ai, 1);
        this.lives = Math.min(this.lives + 3, 10);
      }
    }
  }

  private checkRectCollision(x1: number, y1: number, w1: number, h1: number,
                              x2: number, y2: number, w2: number, h2: number): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  private takeDamage() {
    this.isInvincible = true;
    this.invincibleTimer = 120;
    this.lives--;

    if (this.lives <= 0) {
      this.scene.start('GameOverScene');
    }
  }

  private drawAll() {
    this.drawPlayer();
    this.drawBullets();
    this.drawEnemies();
    this.drawBoss();
    this.drawTwinBoss();
    this.drawExplosions();
    this.drawPowerups();
    this.drawApples();
    this.drawGrenades();
    this.drawWarning();
    this.drawUI();
  }

  private drawPlayer() {
    this.playerGraphics.clear();

    // Skip drawing during invincibility blink
    if (this.isInvincible && Math.floor(this.invincibleTimer / 5) % 2 === 0) {
      return;
    }

    const x = this.playerX;
    const y = this.playerY;
    const width = this.playerWidth;

    let mainColor: number;
    switch (this.playerType) {
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
    this.playerGraphics.fillStyle(mainColor);
    this.playerGraphics.fillTriangle(
      x + width / 2, y,
      x + 5, y + 15,
      x + width - 5, y + 15
    );

    // Body rectangle
    this.playerGraphics.fillRect(x + 8, y + 15, width - 16, 20);

    // Engines
    this.playerGraphics.fillStyle(COLORS.ORANGE);
    if (this.playerType === 3) {
      this.playerGraphics.fillRect(x + 6, y + 35, 4, 5);
      this.playerGraphics.fillRect(x + 13, y + 35, 4, 5);
      this.playerGraphics.fillRect(x + 20, y + 35, 4, 5);
    } else {
      this.playerGraphics.fillRect(x + 10, y + 35, 4, 5);
      this.playerGraphics.fillRect(x + width - 14, y + 35, 4, 5);
    }

    // Cockpit
    this.playerGraphics.fillStyle(COLORS.WHITE);
    this.playerGraphics.fillCircle(x + width / 2, y + 10, 3);
  }

  private drawBullets() {
    // Player bullets
    for (const bullet of this.playerBullets) {
      bullet.graphics.clear();
      bullet.graphics.fillStyle(COLORS.BLUE);
      bullet.graphics.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
    }

    // Special bullets
    for (const bullet of this.specialBullets) {
      bullet.graphics.clear();
      bullet.graphics.fillStyle(COLORS.YELLOW);
      bullet.graphics.fillCircle(bullet.x, bullet.y, bullet.width / 2);
    }

    // Independent bullets
    for (const bullet of this.independentBullets) {
      bullet.graphics.clear();
      if (bullet.isRotating) {
        this.drawRotatingBullet(bullet);
      } else {
        bullet.graphics.fillStyle(COLORS.WHITE);
        bullet.graphics.fillCircle(bullet.x, bullet.y, 3);
      }
    }

    // Hard bullets
    for (const bullet of this.hardBullets) {
      bullet.graphics.clear();
      bullet.graphics.fillStyle(COLORS.WHITE);
      bullet.graphics.fillCircle(bullet.x, bullet.y, 3);
    }
  }

  private drawRotatingBullet(bullet: Bullet) {
    const angle = (bullet.rotationAngle ?? 0) * Math.PI / 180;
    const size = 5;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const corners = [
      { x: -size, y: -size },
      { x: size, y: -size },
      { x: size, y: size },
      { x: -size, y: size },
    ];

    const points = corners.map(c => ({
      x: bullet.x + c.x * cos - c.y * sin,
      y: bullet.y + c.x * sin + c.y * cos,
    }));

    bullet.graphics.fillStyle(COLORS.WHITE);
    bullet.graphics.fillPoints(points.map(p => new Phaser.Geom.Point(p.x, p.y)), true);
  }

  private drawEnemies() {
    for (const enemy of this.enemies) {
      enemy.graphics.clear();

      let color: number;
      if (enemy.enemyType === 1) {
        color = COLORS.RED;
      } else if (enemy.enemyType === 2) {
        color = COLORS.DARK_RED;
      } else {
        color = COLORS.BLUE;
      }

      enemy.graphics.fillStyle(color);
      enemy.graphics.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

      // Draw enemy bullets
      for (const bullet of enemy.bullets) {
        bullet.graphics.clear();
        if (bullet.isRotating) {
          this.drawRotatingBullet(bullet);
        } else {
          bullet.graphics.fillStyle(COLORS.WHITE);
          bullet.graphics.fillCircle(bullet.x, bullet.y, 3);
        }
      }
    }
  }

  private drawBoss() {
    if (!this.boss || this.boss.isDying) return;

    this.boss.graphics.clear();

    // Body
    this.boss.graphics.fillStyle(COLORS.PURPLE);
    this.boss.graphics.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);

    // HP bar
    const barWidth = this.boss.width;
    const barHeight = 8;
    const hpRatio = this.boss.hp / this.boss.maxHp;

    this.boss.graphics.fillStyle(COLORS.RED);
    this.boss.graphics.fillRect(this.boss.x, this.boss.y - 15, barWidth, barHeight);
    this.boss.graphics.fillStyle(COLORS.GREEN);
    this.boss.graphics.fillRect(this.boss.x, this.boss.y - 15, barWidth * hpRatio, barHeight);

    // Draw boss bullets
    for (const bullet of this.boss.bullets) {
      bullet.graphics.clear();
      bullet.graphics.fillStyle(COLORS.WHITE);
      bullet.graphics.fillCircle(bullet.x, bullet.y, 3);
    }
  }

  private drawTwinBoss() {
    if (!this.twinBoss || this.twinBoss.isDying) return;

    for (const boss of [this.twinBoss.boss1, this.twinBoss.boss2]) {
      if (boss.isDying) continue;

      boss.graphics.clear();

      const centerX = boss.x + boss.width / 2;
      const centerY = boss.y + boss.height / 2;

      // Magatama shape (comma-shaped like yin-yang)
      boss.graphics.fillStyle(COLORS.PURPLE);
      boss.graphics.fillCircle(centerX, centerY, 20);

      // Small part of magatama
      if (boss.side === 'left') {
        boss.graphics.fillCircle(centerX - 15, centerY - 15, 8);
      } else {
        boss.graphics.fillCircle(centerX + 15, centerY - 15, 8);
      }

      // HP bar
      const barWidth = boss.width;
      const barHeight = 6;
      const hpRatio = boss.hp / boss.maxHp;

      boss.graphics.fillStyle(COLORS.RED);
      boss.graphics.fillRect(boss.x, boss.y - 10, barWidth, barHeight);
      boss.graphics.fillStyle(COLORS.GREEN);
      boss.graphics.fillRect(boss.x, boss.y - 10, barWidth * hpRatio, barHeight);

      // Draw bullets
      for (const bullet of boss.bullets) {
        bullet.graphics.clear();
        bullet.graphics.fillStyle(COLORS.WHITE);
        bullet.graphics.fillCircle(bullet.x, bullet.y, 3);
      }
    }
  }

  private drawExplosions() {
    for (const explosion of this.explosions) {
      explosion.graphics.clear();

      let colors: number[];
      let sizeBase: number;

      if (explosion.type === 'special') {
        colors = [COLORS.RED, COLORS.ORANGE, COLORS.YELLOW, COLORS.WHITE];
        sizeBase = explosion.timer * 8 * explosion.sizeMultiplier;
      } else if (explosion.type === 'grenade') {
        colors = [COLORS.WHITE, COLORS.YELLOW, COLORS.YELLOW, COLORS.RED];
        sizeBase = explosion.timer * 2 * explosion.sizeMultiplier;
      } else {
        colors = [COLORS.RED, COLORS.ORANGE, COLORS.YELLOW];
        sizeBase = explosion.timer * 3 * explosion.sizeMultiplier;
      }

      for (let i = 0; i < colors.length; i++) {
        const size = Math.max(1, sizeBase - i * (explosion.type === 'grenade' ? 2 : 5));
        explosion.graphics.fillStyle(colors[i]);
        explosion.graphics.fillCircle(explosion.x, explosion.y, size);
      }
    }
  }

  private drawPowerups() {
    for (const powerup of this.powerups) {
      powerup.graphics.clear();

      powerup.graphics.fillStyle(COLORS.ORANGE);
      powerup.graphics.fillCircle(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, 10);
      powerup.graphics.fillStyle(COLORS.WHITE);
      powerup.graphics.fillCircle(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, 3);
    }
  }

  private drawApples() {
    for (const apple of this.apples) {
      apple.graphics.clear();

      const centerX = apple.x + apple.width / 2;
      const centerY = apple.y + apple.height / 2;

      // Apple body
      apple.graphics.fillStyle(COLORS.RED);
      apple.graphics.fillCircle(centerX, centerY, 12);

      // Highlight
      apple.graphics.fillStyle(0xff6464);
      apple.graphics.fillCircle(centerX - 3, centerY - 3, 4);

      // Leaf
      apple.graphics.fillStyle(COLORS.GREEN);
      apple.graphics.fillCircle(centerX + 2, centerY - 10, 3);
    }
  }

  private drawGrenades() {
    for (const grenade of this.grenades) {
      grenade.graphics.clear();

      // Grenade body
      grenade.graphics.fillStyle(0x325032);
      grenade.graphics.fillEllipse(grenade.x, grenade.y, 25, 30);

      // Pin
      grenade.graphics.fillStyle(0xc8c800);
      grenade.graphics.fillCircle(grenade.x - 8, grenade.y - 12, 3);

      // Highlight
      grenade.graphics.fillStyle(0x507850);
      grenade.graphics.fillCircle(grenade.x, grenade.y, 3);
    }
  }

  private drawWarning() {
    this.warningGraphics.clear();

    if (this.difficulty === 'ハード' && this.isWarningActive) {
      this.warningGraphics.fillStyle(COLORS.RED, 0.4);

      if (this.warningSide === 'left') {
        this.warningGraphics.fillRect(0, 0, GAME_WIDTH / 2, SCREEN_HEIGHT);
      } else {
        this.warningGraphics.fillRect(GAME_WIDTH / 2, 0, GAME_WIDTH / 2, SCREEN_HEIGHT);
      }
    }
  }

  private drawUI() {
    this.scoreText.setText(`Score: ${this.score}`);
    this.highScoreText.setText(`High: ${this.highScore}`);
    this.grenadeText.setText(`Grenades: ${this.grenadeCount}`);

    // Draw hearts
    this.uiGraphics.clear();
    this.uiGraphics.lineStyle(2, COLORS.WHITE);
    this.uiGraphics.lineBetween(GAME_WIDTH, 0, GAME_WIDTH, SCREEN_HEIGHT);

    for (let i = 0; i < Math.min(this.lives, 5); i++) {
      this.drawHeart(GAME_WIDTH + 40 + i * 25, 170);
    }

    if (this.lives > 5) {
      for (let i = 0; i < this.lives - 5; i++) {
        this.drawHeart(GAME_WIDTH + 40 + i * 25, 195);
      }
    }
  }

  private drawHeart(x: number, y: number) {
    this.uiGraphics.fillStyle(COLORS.RED);
    this.uiGraphics.fillCircle(x - 4, y - 2, 6);
    this.uiGraphics.fillCircle(x + 4, y - 2, 6);
    this.uiGraphics.fillTriangle(x - 10, y, x + 10, y, x, y + 10);
  }
}
