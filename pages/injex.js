import { useEffect, useRef } from 'react';

export default function Game() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Game initialization code from previous answer
    // (Same game logic as before, wrapped in requestAnimationFrame)
    // ...

    // Cleanup function
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'black' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid white' }}
      />
    </div>
  );
}
