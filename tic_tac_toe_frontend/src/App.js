import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * PUBLIC_INTERFACE
 * App
 * The main Tic Tac Toe application component. Renders a responsive, accessible 3x3 grid game
 * with Ocean Professional theme, scoreboard, and controls.
 *
 * Environment:
 * - No required environment variables. App respects existing React environment if present.
 */
function App() {
  // Theme is optional; keeping support for potential dark mode extensibility.
  const [theme, setTheme] = useState('light');

  // Game state
  const [board, setBoard] = useState(Array(9).fill(null)); // 0..8
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [winnerInfo, setWinnerInfo] = useState({ winner: null, line: [] }); // {winner: 'X'|'O'|null, line: [i,i,i]}
  const [isDraw, setIsDraw] = useState(false);

  // Apply theme to document for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const statusText = useMemo(() => {
    if (winnerInfo.winner) return `Winner: ${winnerInfo.winner}`;
    if (isDraw) return 'Draw';
    return `Next Turn: ${xIsNext ? 'X' : 'O'}`;
  }, [winnerInfo, isDraw, xIsNext]);

  // Calculate winner from board
  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], // rows
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6], // cols
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8], // diags
      [2, 4, 6]
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[b] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    return { winner: null, line: [] };
  };

  // Handle a user clicking a square
  const handleSquareClick = (idx) => {
    // Prevent playing if game over or square filled
    if (winnerInfo.winner || isDraw || board[idx]) return;

    const nextBoard = board.slice();
    nextBoard[idx] = xIsNext ? 'X' : 'O';

    const res = calculateWinner(nextBoard);
    const filled = nextBoard.every(Boolean);
    const draw = !res.winner && filled;

    // Update state
    setBoard(nextBoard);
    setXIsNext((prev) => !prev);
    setWinnerInfo(res);
    setIsDraw(draw);

    // Update scores when game concluded
    if (res.winner) {
      setScores((prev) => ({
        ...prev,
        [res.winner]: prev[res.winner] + 1
      }));
    } else if (draw) {
      setScores((prev) => ({
        ...prev,
        draws: prev.draws + 1
      }));
    }
  };

  // PUBLIC_INTERFACE
  /**
   * newGame
   * Clears the board while keeping the score.
   */
  const newGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinnerInfo({ winner: null, line: [] });
    setIsDraw(false);
  };

  // PUBLIC_INTERFACE
  /**
   * resetScores
   * Clears the board and resets all scores to zero.
   */
  const resetScores = () => {
    newGame();
    setScores({ X: 0, O: 0, draws: 0 });
  };

  // PUBLIC_INTERFACE
  /**
   * toggleTheme
   * Toggles between light and dark theme.
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Determine if board should be interactive
  const gameOver = Boolean(winnerInfo.winner) || isDraw;

  return (
    <div className="App">
      <header className="ttt-header">
        <div className="navbar">
          <div className="brand">
            <div className="brand-logo" aria-hidden="true">◻︎</div>
            <div className="brand-text">
              <h1 className="title">Tic Tac Toe</h1>
              <p className="subtitle">Ocean Professional</p>
            </div>
          </div>
          <div className="actions">
            <button
              className="btn ghost"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>
      </header>

      <main className="ttt-main">
        <div className="card status-card" role="status" aria-live="polite">
          <div className="status">
            <span className={`status-dot ${winnerInfo.winner ? 'win' : isDraw ? 'draw' : 'next'}`} />
            <span className="status-text">{statusText}</span>
          </div>
          <div className="scoreboard" aria-label="Scoreboard">
            <div className="score x-score" aria-live="polite" aria-label="X score">
              <span className="score-label">X</span>
              <span className="score-value">{scores.X}</span>
            </div>
            <div className="score o-score" aria-live="polite" aria-label="O score">
              <span className="score-label">O</span>
              <span className="score-value">{scores.O}</span>
            </div>
            <div className="score draw-score" aria-live="polite" aria-label="Draws">
              <span className="score-label">Draws</span>
              <span className="score-value">{scores.draws}</span>
            </div>
          </div>
          <div className="controls">
            <button className="btn primary" onClick={newGame}>
              New Game
            </button>
            <button className="btn warning" onClick={resetScores}>
              Reset Scores
            </button>
          </div>
        </div>

        <div
          className={`board-card card ${gameOver ? 'board-disabled' : ''}`}
          aria-label="Tic Tac Toe board"
        >
          <div className="board" role="grid" aria-disabled={gameOver ? 'true' : 'false'}>
            {board.map((value, idx) => {
              const isWinning = winnerInfo.line.includes(idx);
              return (
                <button
                  key={idx}
                  className={`square ${value ? 'filled' : ''} ${isWinning ? 'win-cell' : ''}`}
                  onClick={() => handleSquareClick(idx)}
                  aria-pressed={Boolean(value)}
                  aria-label={`Cell ${idx + 1}${value ? `, ${value}` : ''}`}
                  disabled={gameOver || Boolean(value)}
                  role="gridcell"
                >
                  <span className={`mark ${value === 'X' ? 'mark-x' : value === 'O' ? 'mark-o' : ''}`}>
                    {value}
                  </span>
                </button>
              );
            })}
          </div>
          {winnerInfo.winner && (
            <p className="result-banner win" role="alert">
              {winnerInfo.winner} wins! 🎉
            </p>
          )}
          {!winnerInfo.winner && isDraw && (
            <p className="result-banner draw" role="alert">
              It&apos;s a draw. 🤝
            </p>
          )}
        </div>
      </main>

      <footer className="ttt-footer">
        <p className="footnote">
          Built with React • Runs on port 3000 • No backend required
        </p>
      </footer>
    </div>
  );
}

export default App;
