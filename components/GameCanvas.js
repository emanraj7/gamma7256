import { useEffect, useRef, useState } from 'react';

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const lastFrameTime = useRef(0);
  const keys = useRef({ Space: false, Enter: false });
  const enemySpawnInterval = useRef(null);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [spawnRate, setSpawnRate] = useState(2000);

  const gameState = useRef({
    player: {
      x: 50,
      y: 300,
      width: 40,
      height: 30,
      velocity: 0,
      gravity: 0.3,
      jumpForce: -8,
      bulletCooldown: 0,
      invulnerable: false
    },
    bullets: [],
    enemies: [],
    enemyBullets: [],
    lastEnemyShoot: 0,
    particles: [],
    enemyCount: 0
  });

  const checkCollision = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  const createExplosion = (x, y) => {
    for(let i = 0; i < 15; i++) {
      gameState.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1.0
      });
    }
  };

  useEffect(() => {
    if (gameOver) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    const handleKeyDown = (e) => {
      if (e.code === 'Space') keys.current.Space = true;
      if (e.code === 'Enter') keys.current.Enter = true;
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') keys.current.Space = false;
      if (e.code === 'Enter') keys.current.Enter = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const spawnEnemy = () => {
      gameState.current.enemies.push({
        x: canvas.width - 100,
        y: Math.random() * (canvas.height - 30),
        width: 40,
        height: 30,
        speedY: 1
      });
      gameState.current.enemyCount++;
      
      // Increase spawn rate every 5 enemies
      if (gameState.current.enemyCount % 5 === 0) {
        setSpawnRate(prev => Math.max(800, prev * 0.9));
      }
    };

    const gameLoop = (timestamp) => {
      if (gameOver) return;

      const deltaTime = timestamp - lastFrameTime.current;
      lastFrameTime.current = timestamp;

      updateGameState(deltaTime);
      render(ctx);

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);
    enemySpawnInterval.current = setInterval(spawnEnemy, spawnRate);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId.current);
      clearInterval(enemySpawnInterval.current);
    };
  }, [gameOver, spawnRate]);

  const updateGameState = (deltaTime) => {
    if (gameOver) return;

    const state = gameState.current;
    const { player } = state;

    // Player movement
    player.velocity = keys.current.Space ? player.jumpForce : player.velocity + player.gravity;
    player.y = Math.max(0, Math.min(canvasRef.current.height - player.height, player.y + player.velocity * 0.5));

    // Player shooting
    if (keys.current.Enter && player.bulletCooldown <= 0) {
      state.bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2,
        width: 10,
        height: 5,
        speed: 8
      });
      player.bulletCooldown = 150;
    }
    player.bulletCooldown -= deltaTime;

    // Update bullets
    state.bullets = state.bullets.filter(bullet => {
      bullet.x += bullet.speed * (deltaTime / 16);
      return bullet.x < canvasRef.current.width;
    });

    // Update enemies
    state.enemies = state.enemies.filter(enemy => {
      enemy.y += enemy.speedY * (deltaTime / 16);
      if (enemy.y <= 0 || enemy.y >= canvasRef.current.height - enemy.height) {
        enemy.speedY *= -1;
      }
      return true;
    });

    // Bullet-enemy collision
    state.bullets = state.bullets.filter(bullet => {
      const hitEnemyIndex = state.enemies.findIndex(enemy => 
        checkCollision(bullet, enemy)
      );
      
      if (hitEnemyIndex > -1) {
        state.enemies.splice(hitEnemyIndex, 1);
        createExplosion(bullet.x, bullet.y);
        setScore(prev => prev + 100);
        return false;
      }
      return true;
    });

    // Enemy shooting
    if (Date.now() - state.lastEnemyShoot > 1500) {
      state.enemies.forEach(enemy => {
        state.enemyBullets.push({
          x: enemy.x,
          y: enemy.y + enemy.height / 2,
          width: 10,
          height: 5,
          speed: -6
        });
      });
      state.lastEnemyShoot = Date.now();
    }

    // Enemy bullet collision
    state.enemyBullets = state.enemyBullets.filter(bullet => {
      bullet.x += bullet.speed * (deltaTime / 16);
      
      if (checkCollision(bullet, player)) {
        if (!player.invulnerable) {
          setHealth(prev => {
            const newHealth = Math.max(0, prev - 5);
            if (newHealth === 0) setGameOver(true);
            return newHealth;
          });
          player.invulnerable = true;
          setTimeout(() => {
            player.invulnerable = false;
          }, 2000);
        }
        return false;
      }
      return bullet.x > 0;
    });

    // Update particles
    state.particles = state.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      return p.life > 0;
    });
  };

  const render = (ctx) => {
    if (gameOver) return;

    const { player, bullets, enemies, enemyBullets, particles } = gameState.current;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Particles
    ctx.fillStyle = '#ff8800';
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, 5, 5);
    });
    ctx.globalAlpha = 1.0;

    // Player
    ctx.fillStyle = player.invulnerable ? '#00ff0088' : '#00ff00';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Bullets
    ctx.fillStyle = '#ffff00';
    bullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Enemies
    ctx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // Enemy bullets
    ctx.fillStyle = '#ff4444';
    enemyBullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    
    // Health bar
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(10, 50, 200, 20);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(10, 50, (200 * health) / 100, 20);

    // Game Over Screen
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvasRef.current.width/2, canvasRef.current.height/2);
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${score}`, canvasRef.current.width/2, canvasRef.current.height/2 + 50);
    }
  };

  return <canvas ref={canvasRef} style={{ border: '1px solid #fff' }} />;
};

export default GameCanvas;
