export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 600;
export const GAME_WIDTH = Math.floor(SCREEN_WIDTH * 0.65);
export const UI_WIDTH = SCREEN_WIDTH - GAME_WIDTH;

export const COLORS = {
  WHITE: 0xffffff,
  BLACK: 0x000000,
  RED: 0xff0000,
  BLUE: 0x0000ff,
  GREEN: 0x00ff00,
  ORANGE: 0xffa500,
  YELLOW: 0xffff00,
  DARK_RED: 0x800000,
  PURPLE: 0x800080,
};

export type Difficulty = 'イージー' | 'ノーマル' | 'ハード';
export type PlayerType = 1 | 2 | 3;
