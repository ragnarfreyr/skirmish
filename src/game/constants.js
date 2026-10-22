export const ROWS = 6
export const COLS = 6

// Rows each player may deploy units into (index 0 = top of the board)
export const HOME_ROWS = { 1: [4, 5], 2: [0, 1] }

// Total units a player may place across the whole game (opening 3 + up to 12 more)
export const MAX_UNITS = 15

// Players can draw reinforcements only during the first DRAW_ROUNDS battle rounds.
// A round is one turn each (Player 1, then Player 2). After that, fight with what's on the board.
export const DRAW_ROUNDS = 4
