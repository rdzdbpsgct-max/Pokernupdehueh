import {
  getMonetizationCounters,
  trackMonetizationEvent,
} from '../src/domain/monetizationTelemetry';

describe('monetization telemetry', () => {
  it('increments counters for tracked events', () => {
    const baseline = structuredClone(getMonetizationCounters());

    trackMonetizationEvent('feature_gate_seen', {
      feature: 'tvDisplay',
      currentTier: 'free',
      requiredTier: 'premium',
      mode: 'game',
    });

    const counters = getMonetizationCounters();
    expect(counters.total).toBe(baseline.total + 1);
    expect(counters.byEvent.feature_gate_seen).toBe(baseline.byEvent.feature_gate_seen + 1);
    expect(counters.byFeature.tvDisplay).toBe((baseline.byFeature.tvDisplay ?? 0) + 1);
  });

  it('tracks multiple event categories', () => {
    const baseline = structuredClone(getMonetizationCounters());

    trackMonetizationEvent('feature_gate_seen', { feature: 'league' });
    trackMonetizationEvent('feature_gate_upgrade_clicked', { feature: 'league' });
    trackMonetizationEvent('feature_gate_dismissed', { feature: 'league' });

    const counters = getMonetizationCounters();
    expect(counters.total).toBe(baseline.total + 3);
    expect(counters.byEvent.feature_gate_seen).toBe(baseline.byEvent.feature_gate_seen + 1);
    expect(counters.byEvent.feature_gate_upgrade_clicked).toBe(baseline.byEvent.feature_gate_upgrade_clicked + 1);
    expect(counters.byEvent.feature_gate_dismissed).toBe(baseline.byEvent.feature_gate_dismissed + 1);
    expect(counters.byFeature.league).toBe((baseline.byFeature.league ?? 0) + 3);
  });

  it('tracks upgrade conversion events', () => {
    const baseline = structuredClone(getMonetizationCounters());

    trackMonetizationEvent('tier_upgrade_detected', {
      previousTier: 'free',
      currentTier: 'premium',
      gainedFeatures: 5,
    });
    trackMonetizationEvent('conversion_free_to_premium', {
      previousTier: 'free',
      currentTier: 'premium',
      gainedFeatures: 5,
    });
    trackMonetizationEvent('conversion_premium_to_pro', {
      previousTier: 'premium',
      currentTier: 'pro',
      gainedFeatures: 3,
    });

    const counters = getMonetizationCounters();
    expect(counters.total).toBe(baseline.total + 3);
    expect(counters.byEvent.tier_upgrade_detected).toBe(baseline.byEvent.tier_upgrade_detected + 1);
    expect(counters.byEvent.conversion_free_to_premium).toBe(
      baseline.byEvent.conversion_free_to_premium + 1,
    );
    expect(counters.byEvent.conversion_premium_to_pro).toBe(
      baseline.byEvent.conversion_premium_to_pro + 1,
    );
  });
});
