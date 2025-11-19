import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

/**
 * Helper: returns all 9 board cell buttons in order.
 */
function getCells() {
  const grid = screen.getByRole('grid');
  // Each cell has role="gridcell" and is a button element (square)
  const cells = within(grid).getAllByRole('gridcell');
  expect(cells).toHaveLength(9);
  return cells;
}

/**
 * Helper: click a sequence of indices (0..8) on the board.
 */
async function clickSequence(indices) {
  const user = userEvent.setup();
  const cells = getCells();
  for (const i of indices) {
    await user.click(cells[i]);
  }
}

/**
 * Accessors for scoreboard numbers.
 */
function getScoreValues() {
  const scoreboard = screen.getByLabelText(/Scoreboard/i);
  const x = within(scoreboard).getByLabelText(/X score/i);
  const o = within(scoreboard).getByLabelText(/O score/i);
  const d = within(scoreboard).getByLabelText(/Draws/i);
  const xVal = within(x).getByText(/\d+/);
  const oVal = within(o).getByText(/\d+/);
  const dVal = within(d).getByText(/\d+/);
  return {
    x: xVal,
    o: oVal,
    d: dVal,
  };
}

describe('Tic Tac Toe App - Ocean Professional', () => {
  test('renders header and theme elements (Ocean Professional), basic structure snapshot-ish', () => {
    const { container } = render(<App />);
    expect(screen.getByRole('heading', { name: /Tic Tac Toe/i })).toBeInTheDocument();
    expect(screen.getByText(/Ocean Professional/i)).toBeInTheDocument();
    // Presence of navbar, status card, board, scoreboard blocks
    expect(container.querySelector('.navbar')).toBeTruthy();
    expect(container.querySelector('.status-card')).toBeTruthy();
    expect(container.querySelector('.board')).toBeTruthy();
    expect(screen.getByLabelText(/Scoreboard/i)).toBeInTheDocument();
  });

  test('initial state: empty board, X starts, scoreboard zeros', () => {
    render(<App />);
    const cells = getCells();
    cells.forEach((cell) => {
      expect(cell).toBeEnabled();
      expect(cell).toHaveAttribute('aria-pressed', 'false');
      expect(within(cell).queryByText('X')).not.toBeInTheDocument();
      expect(within(cell).queryByText('O')).not.toBeInTheDocument();
    });
    // Status shows Next Turn: X
    expect(screen.getByRole('status')).toHaveTextContent(/Next Turn:\s*X/i);

    const scores = getScoreValues();
    expect(scores.x).toHaveTextContent('0');
    expect(scores.o).toHaveTextContent('0');
    expect(scores.d).toHaveTextContent('0');
  });

  test('cells have accessible roles and labels (role=grid/gridcell, aria-label per cell)', () => {
    render(<App />);
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
    const cells = getCells();
    cells.forEach((cell, idx) => {
      expect(cell).toHaveAttribute('aria-label', expect.stringMatching(new RegExp(`Cell ${idx + 1}`)));
      // buttons are disabled if filled or game over, otherwise enabled
      expect(cell.tagName.toLowerCase()).toBe('button');
    });
    // Theme toggle button has accessible name reflecting action
    const themeButton = screen.getByRole('button', { name: /Switch to (dark|light) mode/i });
    expect(themeButton).toBeInTheDocument();
  });

  test('turn toggles between X and O after moves', async () => {
    render(<App />);
    const user = userEvent.setup();
    const cells = getCells();

    expect(screen.getByRole('status')).toHaveTextContent(/Next Turn:\s*X/i);
    await user.click(cells[0]);
    expect(within(cells[0]).getByText('X')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Next Turn:\s*O/i);

    await user.click(cells[1]);
    expect(within(cells[1]).getByText('O')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Next Turn:\s*X/i);
  });

  test('prevent move overwrite on occupied cell', async () => {
    render(<App />);
    const user = userEvent.setup();
    const cells = getCells();

    await user.click(cells[0]); // X
    expect(within(cells[0]).getByText('X')).toBeInTheDocument();

    // Second click on same cell should do nothing (cell is disabled once filled)
    await user.click(cells[0]);
    // Still X, not toggled to O or changed
    expect(within(cells[0]).getByText('X')).toBeInTheDocument();

    // Ensure turn has toggled only once because first valid move occurred
    expect(screen.getByRole('status')).toHaveTextContent(/Next Turn:\s*O/i);
  });

  describe('win detection - rows, columns, diagonals', () => {
    test('row win (top row) by X', async () => {
      render(<App />);
      const user = userEvent.setup();
      const cells = getCells();
      // X: 0, O: 3, X: 1, O: 4, X: 2 -> X wins on [0,1,2]
      await user.click(cells[0]); // X
      await user.click(cells[3]); // O
      await user.click(cells[1]); // X
      await user.click(cells[4]); // O
      await user.click(cells[2]); // X wins

      expect(screen.getByRole('alert')).toHaveTextContent(/X wins/i);
      // Board marked game over: grid aria-disabled true
      expect(screen.getByRole('grid')).toHaveAttribute('aria-disabled', 'true');

      // All cells disabled after game concluded
      cells.forEach((c) => expect(c).toBeDisabled());

      const scores = getScoreValues();
      expect(scores.x).toHaveTextContent('1');
      expect(scores.o).toHaveTextContent('0');
      expect(scores.d).toHaveTextContent('0');
    });

    test('column win (left column) by O', async () => {
      render(<App />);
      const user = userEvent.setup();
      const cells = getCells();
      // Sequence to make O win: X plays somewhere not blocking, then O stacks 0,3,6
      // X: 1, O: 0, X: 2, O: 3, X: 4, O: 6 -> O wins
      await user.click(cells[1]); // X
      await user.click(cells[0]); // O
      await user.click(cells[2]); // X
      await user.click(cells[3]); // O
      await user.click(cells[4]); // X
      await user.click(cells[6]); // O wins

      expect(screen.getByRole('alert')).toHaveTextContent(/O wins/i);
      expect(screen.getByRole('grid')).toHaveAttribute('aria-disabled', 'true');

      const scores = getScoreValues();
      expect(scores.o).toHaveTextContent('1');
    });

    test('diagonal win (0-4-8) by X', async () => {
      render(<App />);
      const user = userEvent.setup();
      const cells = getCells();
      // X:0, O:1, X:4, O:2, X:8 -> X wins via main diagonal
      await user.click(cells[0]); // X
      await user.click(cells[1]); // O
      await user.click(cells[4]); // X
      await user.click(cells[2]); // O
      await user.click(cells[8]); // X wins

      expect(screen.getByRole('alert')).toHaveTextContent(/X wins/i);
      expect(screen.getByRole('grid')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  test('draw detection with full board and no winner', async () => {
    render(<App />);
    const user = userEvent.setup();
    const cells = getCells();
    // Fill to a draw:
    // X O X
    // X X O
    // O X O  -> indices: 0..8
    const order = [0,1,2,5,3,6,4,8,7];
    await clickSequence(order);

    expect(screen.getByRole('alert')).toHaveTextContent(/draw/i);
    expect(screen.getByRole('status')).toHaveTextContent(/Draw/i);
    // Grid disabled after draw
    expect(screen.getByRole('grid')).toHaveAttribute('aria-disabled', 'true');

    // Scoreboard draws increment
    const scores = getScoreValues();
    expect(scores.d).toHaveTextContent('1');
  });

  test('New Game resets board but preserves scoreboard and sets X to start', async () => {
    render(<App />);
    const user = userEvent.setup();
    const cells = getCells();

    // Play a quick win for X to increase X score
    await user.click(cells[0]); // X
    await user.click(cells[3]); // O
    await user.click(cells[1]); // X
    await user.click(cells[4]); // O
    await user.click(cells[2]); // X wins

    const scoresBefore = getScoreValues();
    expect(scoresBefore.x).toHaveTextContent('1');

    // New Game
    const newGameBtn = screen.getByRole('button', { name: /New Game/i });
    await user.click(newGameBtn);

    // Board cleared, enabled, X starts
    const cells2 = getCells();
    cells2.forEach((c) => {
      expect(c).toBeEnabled();
      expect(c).toHaveAttribute('aria-pressed', 'false');
      expect(within(c).queryByText('X')).not.toBeInTheDocument();
      expect(within(c).queryByText('O')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('status')).toHaveTextContent(/Next Turn:\s*X/i);

    // Scoreboard preserved
    const scoresAfter = getScoreValues();
    expect(scoresAfter.x).toHaveTextContent('1');
    expect(scoresAfter.o).toHaveTextContent('0');
    expect(scoresAfter.d).toHaveTextContent('0');
  });

  test('Reset Scores resets scoreboard and board', async () => {
    render(<App />);
    const user = userEvent.setup();
    const cells = getCells();

    // Create an O win to increment O
    await user.click(cells[1]); // X
    await user.click(cells[0]); // O
    await user.click(cells[2]); // X
    await user.click(cells[3]); // O
    await user.click(cells[5]); // X
    await user.click(cells[6]); // O wins

    const scoresBefore = getScoreValues();
    expect(scoresBefore.o).toHaveTextContent('1');

    const resetBtn = screen.getByRole('button', { name: /Reset Scores/i });
    await user.click(resetBtn);

    // Board should be reset and scoreboard zeroed
    const cells2 = getCells();
    cells2.forEach((c) => {
      expect(c).toBeEnabled();
      expect(within(c).queryByText('X')).not.toBeInTheDocument();
      expect(within(c).queryByText('O')).not.toBeInTheDocument();
    });
    // X starts
    expect(screen.getByRole('status')).toHaveTextContent(/Next Turn:\s*X/i);

    const scoresAfter = getScoreValues();
    expect(scoresAfter.x).toHaveTextContent('0');
    expect(scoresAfter.o).toHaveTextContent('0');
    expect(scoresAfter.d).toHaveTextContent('0');
  });

  test('no further moves allowed after a game has ended (disabled interactions)', async () => {
    render(<App />);
    const user = userEvent.setup();
    const cells = getCells();
    // Make a quick X win
    await user.click(cells[0]); // X
    await user.click(cells[3]); // O
    await user.click(cells[1]); // X
    await user.click(cells[4]); // O
    await user.click(cells[2]); // X wins

    expect(screen.getByRole('alert')).toHaveTextContent(/X wins/i);

    // Try clicking another empty cell should do nothing (disabled)
    const emptyCell = cells[5];
    expect(emptyCell).toBeDisabled();
    await user.click(emptyCell);
    expect(within(emptyCell).queryByText('X')).not.toBeInTheDocument();
    expect(within(emptyCell).queryByText('O')).not.toBeInTheDocument();
  });

  test('basic accessibility: New Game and Reset Scores buttons have accessible names', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /New Game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset Scores/i })).toBeInTheDocument();
  });

  test('board cells have aria-pressed updated when filled', async () => {
    render(<App />);
    const user = userEvent.setup();
    const cells = getCells();

    expect(cells[0]).toHaveAttribute('aria-pressed', 'false');
    await user.click(cells[0]);
    expect(cells[0]).toHaveAttribute('aria-pressed', 'true');
  });
});
