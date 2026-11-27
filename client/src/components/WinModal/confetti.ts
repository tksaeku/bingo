import { CONFETTI_PIECE_COUNT } from '../../constants';

/** Confetti colors drawn from the design palette: purples, lilac and white. */
const CONFETTI_COLORS = ['#c98bc3', '#a65ba0', '#7c3e77', '#f2c6ee', '#dcd6ff', '#ffffff'];

export interface ConfettiPiece {
  leftPercent: number;
  delaySeconds: number;
  color: string;
  isRound: boolean;
}

/** Creates the randomized confetti layout once; call from a state initializer, never during render. */
export function createConfettiPieces(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_PIECE_COUNT }, () => ({
    leftPercent: Math.random() * 100,
    delaySeconds: Math.random() * 3,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    isRound: Math.random() < 0.5,
  }));
}
