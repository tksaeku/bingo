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

/** localStorage key holding the anonymous analytics visitor ID. */
export const VISITOR_ID_STORAGE_KEY = 'bingoVisitorId';

/** How long queued analytics events wait before being sent. */
export const ANALYTICS_FLUSH_INTERVAL_MS = 10_000;

/** Number of analytics events that triggers an immediate send, and the most one request carries. */
export const ANALYTICS_MAX_BATCH_SIZE = 20;

/** Most analytics events held in the queue; the oldest are dropped beyond this. */
export const ANALYTICS_MAX_QUEUE_SIZE = 100;

/** Largest `offsetMs` the server accepts. */
export const ANALYTICS_MAX_OFFSET_MS = 300_000;

/** How often the stats dashboard refreshes itself. */
export const ANALYTICS_SUMMARY_REFRESH_INTERVAL_MS = 60_000;
