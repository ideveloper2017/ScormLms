import { describe, expect, it } from 'vitest';
import { audioRms, classifyVisualSignal, SustainedSignal } from '../proctoring-signals';

describe('local proctoring signals', () => {
  it('ignores brief movements and rate limits sustained signals', () => {
    const gate = new SustainedSignal(3_000);
    expect(gate.observe('HEAD_TURNED', 0)).toBe(false);
    expect(gate.observe(null, 2_500)).toBe(false);
    expect(gate.observe('HEAD_TURNED', 3_000)).toBe(false);
    expect(gate.observe('HEAD_TURNED', 6_000)).toBe(true);
    expect(gate.observe('HEAD_TURNED', 7_000)).toBe(false);
    expect(gate.observe('HEAD_TURNED', 36_000)).toBe(true);
  });
  it('distinguishes no face, multiple faces and head pose without labelling cheating', () => {
    expect(classifyVisualSignal(0)).toBe('FACE_NOT_VISIBLE');
    expect(classifyVisualSignal(2)).toBe('MULTIPLE_FACES');
    expect(classifyVisualSignal(1, 0.1)).toBeNull();
    expect(classifyVisualSignal(1, -0.5)).toBe('HEAD_TURNED');
  });
  it('measures sound energy without a recording', () => {
    expect(audioRms(new Uint8Array([128, 128]))).toBe(0);
    expect(audioRms(new Uint8Array([64, 192]))).toBe(0.5);
    expect(audioRms(new Uint8Array())).toBe(0);
  });
});
