import GameCanvas from '../components/GameCanvas';

export default function Home() {
  return (
    <div className="container">
      <GameCanvas />
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          overflow: hidden;
          background: #000;
        }
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
      `}</style>
    </div>
  );
}
