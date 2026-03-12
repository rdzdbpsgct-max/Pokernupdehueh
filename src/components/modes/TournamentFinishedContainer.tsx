import { lazy, Suspense } from 'react';
import type {
  AddOnConfig,
  BountyConfig,
  PayoutConfig,
  Player,
  RebuyConfig,
  TournamentResult,
} from '../../domain/types';
import { SectionErrorBoundary } from '../ErrorBoundary';
import { LoadingFallback } from '../LoadingFallback';

const TournamentFinished = lazy(
  () => import('../TournamentFinished').then((m) => ({ default: m.TournamentFinished })),
);

interface Props {
  players: Player[];
  winner: Player;
  buyIn: number;
  payout: PayoutConfig;
  bounty: BountyConfig;
  rebuy: RebuyConfig;
  addOn: AddOnConfig;
  tournamentResult: TournamentResult | null;
  onBackToSetup: () => void;
}

export function TournamentFinishedContainer({
  players,
  winner,
  buyIn,
  payout,
  bounty,
  rebuy,
  addOn,
  tournamentResult,
  onBackToSetup,
}: Props) {
  return (
    <SectionErrorBoundary><Suspense fallback={<LoadingFallback />}>
      <TournamentFinished
        players={players}
        winner={winner}
        buyIn={buyIn}
        payout={payout}
        bounty={bounty}
        rebuy={rebuy}
        addOn={addOn}
        tournamentResult={tournamentResult}
        onBackToSetup={onBackToSetup}
      />
    </Suspense></SectionErrorBoundary>
  );
}
