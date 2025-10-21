import pygame
import math

class Grenade:
    def __init__(self, start_x, start_y, target_x, target_y):
        self.start_x = start_x
        self.start_y = start_y
        self.x = start_x
        self.y = start_y
        self.target_x = target_x
        self.target_y = target_y
        self.rotation = 0
        self.timer = 0
        self.explosion_delay = 42  # 0.7秒 (60fps * 0.7)
        self.arrived = False
        self.arrival_timer = 0
        
        # 移動の計算
        distance = math.sqrt((target_x - start_x)**2 + (target_y - start_y)**2)
        self.move_time = 30  # 0.5秒で到着
        self.dx = (target_x - start_x) / self.move_time if self.move_time > 0 else 0
        self.dy = (target_y - start_y) / self.move_time if self.move_time > 0 else 0
        
    def update(self):
        self.timer += 1
        self.rotation += 8  # 少し早い回転
        
        if self.timer <= self.move_time:
            # 目標地点に向かって移動
            self.x += self.dx
            self.y += self.dy
        else:
            # 到着後は停止
            if not self.arrived:
                self.arrived = True
                self.x = self.target_x
                self.y = self.target_y
            self.arrival_timer += 1
    
    def should_explode(self):
        # 到着してから0.7秒後に爆発
        return self.arrived and self.arrival_timer >= self.explosion_delay
    
    def draw(self, screen):
        # より大きく、手榴弾らしい形で描画
        size = 25  # さらに大きく
        
        # 回転の計算
        cos_r = math.cos(math.radians(self.rotation))
        sin_r = math.sin(math.radians(self.rotation))
        
        # 手榴弾の本体（楕円形）
        body_width = size
        body_height = size * 1.2
        
        # 本体の楕円
        pygame.draw.ellipse(screen, (50, 80, 50), 
                          (self.x - body_width//2, self.y - body_height//2, 
                           body_width, body_height))
        
        # 安全ピンの部分（小さな四角）
        pin_x = -size//3
        pin_y = -size//2
        rotated_pin_x = pin_x * cos_r - pin_y * sin_r + self.x
        rotated_pin_y = pin_x * sin_r + pin_y * cos_r + self.y
        pygame.draw.circle(screen, (200, 200, 0), (int(rotated_pin_x), int(rotated_pin_y)), 3)
        
        # レバーの部分（小さな線）
        lever_start_x = size//3
        lever_start_y = -size//3
        lever_end_x = size//2
        lever_end_y = -size//4
        
        rotated_start_x = lever_start_x * cos_r - lever_start_y * sin_r + self.x
        rotated_start_y = lever_start_x * sin_r + lever_start_y * cos_r + self.y
        rotated_end_x = lever_end_x * cos_r - lever_end_y * sin_r + self.x
        rotated_end_y = lever_end_x * sin_r + lever_end_y * cos_r + self.y
        
        pygame.draw.line(screen, (100, 100, 100), 
                        (rotated_start_x, rotated_start_y), 
                        (rotated_end_x, rotated_end_y), 2)
        
        # 中央のハイライト
        pygame.draw.circle(screen, (80, 120, 80), (int(self.x), int(self.y)), 3)