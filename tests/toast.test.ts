/**
 * Toast Notification System Tests
 *
 * Tests the module-level toast state management (showToast, dismissToast, subscribeToasts).
 *
 * NOTE: toast.ts uses module-level state (toasts array, listeners set).
 * Since module state persists between tests, we must drain pending timers
 * in afterEach to ensure isolation.
 */
import { showToast, dismissToast, subscribeToasts } from '../src/domain/toast';

describe('Toast system', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Drain any leftover toasts from previous tests by advancing past their 3s auto-dismiss
    vi.advanceTimersByTime(5000);
  });

  afterEach(() => {
    // Drain all pending auto-dismiss timers so module state is clean for next test
    vi.advanceTimersByTime(5000);
    vi.useRealTimers();
  });

  it('showToast notifies subscribers with new toast', () => {
    const listener = vi.fn();
    const unsub = subscribeToasts(listener);

    showToast('Hello');

    expect(listener).toHaveBeenCalledTimes(1);
    const toasts = listener.mock.calls[0][0];
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Hello');
    expect(typeof toasts[0].id).toBe('number');

    unsub();
  });

  it('toast auto-dismisses after 3 seconds', () => {
    const listener = vi.fn();
    const unsub = subscribeToasts(listener);

    showToast('Temp');

    // Find the call that has our toast
    const addCall = listener.mock.calls[listener.mock.calls.length - 1][0];
    const ourToasts = addCall.filter((t: { message: string }) => t.message === 'Temp');
    expect(ourToasts).toHaveLength(1);

    // After 3 seconds, toast should be removed
    vi.advanceTimersByTime(3000);

    const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
    const remaining = lastCall.filter((t: { message: string }) => t.message === 'Temp');
    expect(remaining).toHaveLength(0);

    unsub();
  });

  it('dismissToast removes a specific toast immediately', () => {
    const listener = vi.fn();
    const unsub = subscribeToasts(listener);

    showToast('First');
    showToast('Second');

    // Get the current toasts — filter for our messages
    const latestToasts = listener.mock.calls[listener.mock.calls.length - 1][0];
    const firstToast = latestToasts.find((t: { message: string }) => t.message === 'First');
    const secondToast = latestToasts.find((t: { message: string }) => t.message === 'Second');
    expect(firstToast).toBeDefined();
    expect(secondToast).toBeDefined();

    // Dismiss the first one
    dismissToast(firstToast.id);

    const afterDismiss = listener.mock.calls[listener.mock.calls.length - 1][0];
    expect(afterDismiss.find((t: { message: string }) => t.message === 'First')).toBeUndefined();
    expect(afterDismiss.find((t: { message: string }) => t.message === 'Second')).toBeDefined();

    unsub();
  });

  it('unsubscribe stops notifications', () => {
    const listener = vi.fn();
    const unsub = subscribeToasts(listener);

    showToast('Before');
    expect(listener).toHaveBeenCalled();

    const callsBefore = listener.mock.calls.length;
    unsub();

    showToast('After');
    // No new calls after unsubscribe
    expect(listener.mock.calls.length).toBe(callsBefore);
  });

  it('multiple toasts can coexist', () => {
    const listener = vi.fn();
    const unsub = subscribeToasts(listener);

    showToast('A');
    showToast('B');
    showToast('C');

    const toasts = listener.mock.calls[listener.mock.calls.length - 1][0];
    // Filter for our test's toasts
    const ours = toasts.filter((t: { message: string }) => ['A', 'B', 'C'].includes(t.message));
    expect(ours).toHaveLength(3);
    expect(ours.map((t: { message: string }) => t.message)).toEqual(['A', 'B', 'C']);

    unsub();
  });

  it('each toast gets a unique ID', () => {
    const listener = vi.fn();
    const unsub = subscribeToasts(listener);

    showToast('X');
    showToast('Y');

    const toasts = listener.mock.calls[listener.mock.calls.length - 1][0];
    const x = toasts.find((t: { message: string }) => t.message === 'X');
    const y = toasts.find((t: { message: string }) => t.message === 'Y');
    expect(x.id).not.toBe(y.id);

    unsub();
  });
});
