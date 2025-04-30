import { useEffect, useRef } from 'react';

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const lastFrameTime = useRef(0);
  const keys = useRef({ Space: false, Enter: false });

  // Game state
  const gameState = useRef({
    player: {
      x: 50,
      y: 300,
      width: 40,
      height: 30,
      velocity: 0,
      gravity: 0.5,
      jumpForce: -10,
      bulletCooldown: 0
    },
    bullets: [],
    enemies: [],
    enemyBullets: [],
    lastEnemyShoot: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // Input handlers
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

    // Game loop
    const gameLoop = (timestamp) => {
      const deltaTime = timestamp - lastFrameTime.current;
      lastFrameTime.current = timestamp;

      updateGameState(deltaTime);
      render(ctx);

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  const updateGameState = (deltaTime) => {
    const state = gameState.current;
    const { player } = state;

    // Player movement
    player.velocity = keys.current.Space ? player.jumpForce : player.velocity + player.gravity;
    player.y = Math.max(0, Math.min(canvasRef.current.height - player.height, player.y + player.velocity));

    // Player shooting
    if (keys.current.Enter && player.bulletCooldown <= 0) {
      state.bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2,
        width: 10,
        height: 5,
        speed: 12
      });
      player.bulletCooldown = 100;
    }
    player.bulletCooldown -= deltaTime;

    // Update bullets
    state.bullets = state.bullets.filter(bullet => bullet.x < canvasRef.current.width);
    state.bullets.forEach(bullet => bullet.x += bullet.speed * (deltaTime / 16));

    // Enemy logic
    if (Date.now() - state.lastEnemyShoot > 2000) {
      state.enemies.forEach(enemy => {
        state.enemyBullets.push({
          x: enemy.x,
          y: enemy.y + enemy.height / 2,
          width: 10,
          height: 5,
          speed: -8
        });
      });
      state.lastEnemyShoot = Date.now();
    }

    // Update enemy bullets
    state.enemyBullets = state.enemyBullets.filter(bullet => bullet.x > 0);
    state.enemyBullets.forEach(bullet => bullet.x += bullet.speed * (deltaTime / 16));
  };

  const render = (ctx) => {
    const { player, bullets, enemies, enemyBullets } = gameState.current;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw bullets
    ctx.fillStyle = '#ffff00';
    bullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw enemies
    ctx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // Draw enemy bullets
    ctx.fillStyle = '#ff4444';
    enemyBullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
  };

  return <canvas ref={canvasRef} style={{ border: '1px solid #fff' }} />;
};

export default GameCanvas;
