import { useEffect } from 'react';
import { useFlyingGame } from '../contexts/FlyingGameContext';
import { useGameSounds } from '../hooks/useGameSounds';

function ScorePopups() {
  const game = useFlyingGame();
  if (!game?.scorePopups?.length) return null;

  return (
    <>
      {game.scorePopups.map((popup) => (
        <div
          key={popup.id}
          style={{
            position: 'fixed',
            left: `${popup.x}px`,
            top: `${popup.y}px`,
            transform: 'translate(-50%, -100%)',
            color: '#FFD700',
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
            zIndex: 10002,
            animation: 'scorePopup 1s ease-out forwards',
            whiteSpace: 'nowrap',
          }}
        >
          {popup.text}
        </div>
      ))}
    </>
  );
}

function HUD() {
  const game = useFlyingGame();
  if (!game?.isPlaying) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: '32px',
        padding: '12px 20px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        zIndex: 10001,
        pointerEvents: 'none',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ color: '#FFD700', fontSize: '20px', fontWeight: 'bold' }}>
        SCORE {game.score.toLocaleString()}
      </div>
      <div style={{ color: '#FF4444', fontSize: '20px' }}>
        {'❤️'.repeat(Math.max(0, game.lives))}
      </div>
      <div style={{ color: '#FFFFFF', fontSize: '20px' }}>
        RND {game.round}/3
      </div>
      <div style={{
        color: game.combo > 1 ? '#FF6600' : '#888888',
        fontSize: '20px',
        fontWeight: game.combo > 1 ? 'bold' : 'normal',
        ...(game.combo > 1 ? { animation: 'comboPulse 0.5s ease-in-out infinite alternate' } : {}),
      }}>
        {Math.min(game.combo + 1, 5)}x MULTIPLIER
      </div>
      <div style={{
        color: game.roundTimeLeft < 4000 ? '#FF4444' : '#AAAAAA',
        fontSize: '20px',
        fontWeight: game.roundTimeLeft < 4000 ? 'bold' : 'normal',
      }}>
        {Math.ceil(game.roundTimeLeft / 1000)}s
      </div>
    </div>
  );
}

function RoundTransition() {
  const game = useFlyingGame();
  const sounds = useGameSounds();

  useEffect(() => {
    if (game?.roundTransition) {
      sounds.playRoundStart();
    }
  }, [game?.roundTransition?.round]);

  if (!game?.roundTransition) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10003,
        pointerEvents: 'none',
        textAlign: 'center',
        animation: 'roundTransition 1.5s ease-out forwards',
      }}
    >
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadow: '0 0 20px rgba(255, 255, 255, 0.6)',
      }}>
        ROUND {game.roundTransition.round + 1}
      </div>
    </div>
  );
}

function StartScreen() {
  const game = useFlyingGame();
  const sounds = useGameSounds();
  if (game?.isPlaying) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 10001,
      }}
    >
      <button
        onClick={() => {
          sounds.playRoundStart();
          game.startGame();
        }}
        style={{
          background: 'linear-gradient(135deg, #FF6B35, #FF4500)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(255, 69, 0, 0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          fontFamily: 'monospace',
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 20px rgba(255, 69, 0, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 15px rgba(255, 69, 0, 0.4)';
        }}
      >
        🎯 JAGEN!
      </button>
      {game.highScore > 0 && (
        <div style={{
          textAlign: 'center',
          marginTop: '6px',
          color: '#FFD700',
          fontSize: '12px',
          fontFamily: 'monospace',
          textShadow: '0 0 5px rgba(255, 215, 0, 0.5)',
        }}>
          HIGH: {game.highScore.toLocaleString()}
        </div>
      )}
    </div>
  );
}

function GameOverScreen() {
  const game = useFlyingGame();
  const sounds = useGameSounds();

  useEffect(() => {
    if (game?.gameOver) {
      sounds.playGameOver();
    }
  }, [game?.gameOver]);

  if (game?.isPlaying || !game?.gameOver) return null;

  const isNewHighScore = game.score >= game.highScore && game.score > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 10004,
        animation: 'fadeIn 0.5s ease-out',
      }}
    >
      <div style={{
        fontSize: '56px',
        fontWeight: 'bold',
        color: '#FF4444',
        textShadow: '0 0 30px rgba(255, 68, 68, 0.6)',
        marginBottom: '20px',
      }}>
        GAME OVER
      </div>

      <div style={{
        fontSize: '36px',
        color: '#FFD700',
        fontWeight: 'bold',
        textShadow: '0 0 15px rgba(255, 215, 0, 0.5)',
        marginBottom: '10px',
      }}>
        {game.score.toLocaleString()}
      </div>

      <div style={{
        fontSize: '18px',
        color: '#FFFFFF',
        marginBottom: '8px',
      }}>
        Round {game.round}
      </div>

      {isNewHighScore && (
        <div style={{
          fontSize: '24px',
          color: '#FFD700',
          fontWeight: 'bold',
          marginBottom: '20px',
          animation: 'comboPulse 0.5s ease-in-out infinite alternate',
        }}>
          ✨ NEW HIGH SCORE! ✨
        </div>
      )}

      <div style={{
        fontSize: '14px',
        color: '#AAAAAA',
        marginBottom: '30px',
      }}>
        High Score: {game.highScore.toLocaleString()}
      </div>

      <button
        onClick={() => {
          sounds.playRoundStart();
          game.startGame();
        }}
        style={{
          background: 'linear-gradient(135deg, #FF6B35, #FF4500)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '16px 40px',
          fontSize: '20px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(255, 69, 0, 0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          fontFamily: 'monospace',
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 20px rgba(255, 69, 0, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 15px rgba(255, 69, 0, 0.4)';
        }}
      >
        Opnieuw?
      </button>
    </div>
  );
}

// Global keyframes injected once
const styleId = 'duckhunt-game-styles';
function injectStyles() {
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes scorePopup {
      0% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -200%) scale(1.5); }
    }
    @keyframes comboPulse {
      0% { transform: scale(1); }
      100% { transform: scale(1.1); }
    }
    @keyframes roundTransition {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
      20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
      40% { transform: translate(-50%, -50%) scale(1); }
      80% { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes screenShake {
      0% { background: rgba(255, 215, 0, 0.15); }
      25% { background: rgba(255, 215, 0, 0.05); }
      50% { background: rgba(255, 215, 0, 0.1); }
      100% { background: transparent; }
    }
  `;
  document.head.appendChild(style);
}

export function GameOverlay() {
  injectStyles();

  return (
    <>
      <HUD />
      <RoundTransition />
      <ScorePopups />
      <StartScreen />
      <GameOverScreen />
    </>
  );
}
