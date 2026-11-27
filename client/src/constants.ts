/** Number of rows and columns on the bingo board. */
export const BOARD_SIZE = 5;

/** Total number of cells on the board. */
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

/** Index of the pre-marked free cell (middle of the grid, zero-based). */
export const CENTER_INDEX = Math.floor(TOTAL_CELLS / 2);

/** Number of distinct options a board needs (every cell except the free cell). */
export const REQUIRED_OPTION_COUNT = TOTAL_CELLS - 1;

/** Text displayed on the free cell. */
export const FREE_CELL_TEXT = 'FREE';

/** Delay between the winning mark and the win modal opening. */
export const WIN_MODAL_DELAY_MS = 500;

/** How often the leaderboard refreshes itself. */
export const LEADERBOARD_REFRESH_INTERVAL_MS = 30_000;

/** Maximum length of a player name after normalization. */
export const PLAYER_NAME_MAX_LENGTH = 20;

/** Maximum length of an option's text after trimming. */
export const OPTION_TEXT_MAX_LENGTH = 100;

/** localStorage key holding the in-progress board. */
export const BOARD_STORAGE_KEY = 'bingoBoard';

/** sessionStorage key holding the verified admin key. */
export const ADMIN_KEY_STORAGE_KEY = 'bingoAdminKey';

/** Request header carrying the admin key. */
export const ADMIN_KEY_HEADER = 'x-admin-key';

/** Number of confetti pieces rendered in the win modal. */
export const CONFETTI_PIECE_COUNT = 50;

/** The Open World Swing Dance Championships public website. */
export const THE_OPEN_WEBSITE_URL = 'https://theopenswing.com';
