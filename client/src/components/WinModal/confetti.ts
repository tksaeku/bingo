import { CONFETTI_PIECE_COUNT } from '../../constants';

export interface ConfettiPiece {
  leftPercent: number;
  delaySeconds: number;
  hue: number;
}

/** Creates the randomized confetti layout once; call from a state initializer, never during render. */
export function createConfettiPieces(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_PIECE_COUNT }, () => ({
    leftPercent: Math.random() * 100,
    delaySeconds: Math.random() * 3,
    hue: Math.random() * 360,
  }));
}
