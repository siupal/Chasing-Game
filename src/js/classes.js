// Game classes file
class Player {
    constructor() {
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT / 2;
        this.size = PLAYER_SIZE;
        this.color = '#3498db';
        this.speed = PLAYER_SPEED;
        this.trail = [];
    }

    draw() {
        // Draw trail
        ctx.save();
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            ctx.globalAlpha = i / this.trail.length * 0.3;
            ctx.fillStyle = this.color;
            ctx.fillRect(point.x - this.size/2, point.y - this.size/2, this.size, this.size);
        }
        ctx.restore();

        // Draw player
        ctx.fillStyle = playerInvincible ? '#f1c40f' : this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        
        if (playerInvincible) {
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    move(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        let canMove = true;
        obstacles.forEach(obstacle => {
            if (newX > obstacle.x - this.size/2 && 
                newX < obstacle.x + obstacle.width + this.size/2 &&
                newY > obstacle.y - this.size/2 && 
                newY < obstacle.y + obstacle.height + this.size/2) {
                canMove = false;
            }
        });

        if (canMove) {
            this.trail.push({x: this.x, y: this.y});
            if (this.trail.length > 10) this.trail.shift();
            
            this.x = Math.max(this.size/2, Math.min(CANVAS_WIDTH - this.size/2, newX));
            this.y = Math.max(this.size/2, Math.min(CANVAS_HEIGHT - this.size/2, newY));
        }
    }
}

class Enemy {
    constructor() {
        this.size = 25;
        this.resetPosition();
        this.speed = 2 + Math.random() * (level * 0.5);
        this.angle = Math.random() * Math.PI * 2;
        this.glowSize = 0;
        this.glowIncreasing = true;
    }

    resetPosition() {
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0:
                this.x = Math.random() * CANVAS_WIDTH;
                this.y = -this.size;
                break;
            case 1:
                this.x = CANVAS_WIDTH + this.size;
                this.y = Math.random() * CANVAS_HEIGHT;
                break;
            case 2:
                this.x = Math.random() * CANVAS_WIDTH;
                this.y = CANVAS_HEIGHT + this.size;
                break;
            case 3:
                this.x = -this.size;
                this.y = Math.random() * CANVAS_HEIGHT;
                break;
        }
    }

    draw() {
        // Draw glow effect
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + this.glowSize, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.size,
            this.x, this.y, this.size + this.glowSize
        );
        gradient.addColorStop(0, 'rgba(231, 76, 60, 0.3)');
        gradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();

        // Draw enemy
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size/2);
        ctx.lineTo(this.x + this.size/2, this.y + this.size/2);
        ctx.lineTo(this.x - this.size/2, this.y + this.size/2);
        ctx.closePath();
        ctx.fill();

        // Update glow effect
        if (this.glowIncreasing) {
            this.glowSize += 0.2;
            if (this.glowSize >= 10) this.glowIncreasing = false;
        } else {
            this.glowSize -= 0.2;
            if (this.glowSize <= 0) this.glowIncreasing = true;
        }
    }

    move() {
        // Calculate direction to player for smarter movement
        if (player && Math.random() < 0.05) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            this.angle = Math.atan2(dy, dx);
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        if (Math.random() < 0.02) {
            this.angle += (Math.random() - 0.5) * Math.PI/2;
        }

        if (this.x < -this.size || this.x > CANVAS_WIDTH + this.size ||
            this.y < -this.size || this.y > CANVAS_HEIGHT + this.size) {
            this.resetPosition();
        }
    }
}

class Item {
    constructor() {
        this.size = ITEM_SIZE;
        this.x = Math.random() * (CANVAS_WIDTH - this.size) + this.size/2;
        this.y = Math.random() * (CANVAS_HEIGHT - this.size) + this.size/2;
        this.type = Math.random() < 0.7 ? 'normal' : 'special';
        this.color = this.type === 'normal' ? '#e74c3c' : '#9b59b6';
        this.value = this.type === 'normal' ? 10 : 30;
        this.floatOffset = 0;
        this.floatSpeed = 0.05;
    }

    draw() {
        this.floatOffset += this.floatSpeed;
        const yOffset = Math.sin(this.floatOffset) * 5;

        if (this.type === 'normal') {
            const gradient = ctx.createRadialGradient(
                this.x, this.y + yOffset, this.size/4,
                this.x, this.y + yOffset, this.size/2
            );
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y + yOffset, this.size/2, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        } else {
            ctx.save();
            ctx.translate(this.x, this.y + yOffset);
            ctx.rotate(this.floatOffset);
            
            ctx.beginPath();
            const spikes = 5;
            const outerRadius = this.size/2;
            const innerRadius = this.size/4;
            
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI * 2 * i) / (spikes * 2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            ctx.fill();
            
            ctx.restore();
        }
    }
}

class PowerUp {
    constructor() {
        this.size = ITEM_SIZE;
        this.x = Math.random() * (CANVAS_WIDTH - this.size) + this.size/2;
        this.y = Math.random() * (CANVAS_HEIGHT - this.size) + this.size/2;
        this.type = Math.random() < 0.5 ? 'shield' : 'speed';
        this.color = this.type === 'shield' ? '#f1c40f' : '#2ecc71';
        this.rotation = 0;
    }

    draw() {
        this.rotation += 0.05;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        if (this.type === 'shield') {
            ctx.fillRect(-5, -5, 10, 10);
        } else {
            ctx.beginPath();
            ctx.moveTo(-5, 5);
            ctx.lineTo(5, 0);
            ctx.lineTo(-5, -5);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Obstacle {
    constructor() {
        this.width = 40 + Math.random() * 60;
        this.height = 40 + Math.random() * 60;
        this.x = Math.random() * (CANVAS_WIDTH - this.width);
        this.y = Math.random() * (CANVAS_HEIGHT - this.height);
        this.color = '#7f8c8d';
        this.glowAmount = 0;
        this.glowIncreasing = true;
    }

    draw() {
        if (this.glowIncreasing) {
            this.glowAmount += 0.5;
            if (this.glowAmount >= 20) this.glowIncreasing = false;
        } else {
            this.glowAmount -= 0.5;
            if (this.glowAmount <= 0) this.glowIncreasing = true;
        }

        ctx.shadowColor = '#95a5a6';
        ctx.shadowBlur = this.glowAmount;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        for (let i = 0; i < Math.max(this.width, this.height); i += 20) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i, this.y + this.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + i);
            ctx.lineTo(this.x + this.width, this.y + i);
            ctx.stroke();
        }
    }
}

class Particle {
    constructor(x, y, color, text) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.text = text;
        this.alpha = 1;
        this.size = text ? 20 : 5;
        this.velocityY = text ? -2 : (Math.random() - 0.5) * 4;
        this.velocityX = (Math.random() - 0.5) * 4;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.alpha -= 0.02;
        if (this.text) {
            this.size += 0.2;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        if (this.text) {
            ctx.fillStyle = this.color;
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
