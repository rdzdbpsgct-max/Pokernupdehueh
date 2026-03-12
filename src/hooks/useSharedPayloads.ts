import { useState } from 'react';
import {
  decodeLeagueStandingsFromQR,
  decodeResultFromQR,
} from '../domain/logic';

type SharedResult = NonNullable<ReturnType<typeof decodeResultFromQR>>;
type SharedLeague = NonNullable<ReturnType<typeof decodeLeagueStandingsFromQR>>;

export function useSharedPayloads() {
  const [sharedResult, setSharedResult] = useState<SharedResult | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#r=')) {
      const encoded = decodeURIComponent(hash.slice(3));
      const result = decodeResultFromQR(encoded);
      if (result) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      return result;
    }
    return null;
  });

  const [sharedLeague, setSharedLeague] = useState<SharedLeague | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#ls=')) {
      const result = decodeLeagueStandingsFromQR(hash);
      if (result) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      return result;
    }
    return null;
  });

  return {
    sharedResult,
    setSharedResult,
    sharedLeague,
    setSharedLeague,
  };
}
