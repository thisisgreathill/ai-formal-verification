import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { transfer } from "../examples/transfer";

const balance = fc.bigInt({ min: 0n, max: 10n ** 15n });

describe("example transfer invariants (pure function only)", () => {
  it("preserves total and nonnegative balances", () => {
    fc.assert(fc.property(balance, balance, balance, (a, b, candidate) => {
      const amount = candidate <= a ? candidate : a;
      const result = transfer(a, b, amount);
      expect(result.sender).toBe(a - amount);
      expect(result.recipient).toBe(b + amount);
      expect(result.sender + result.recipient).toBe(a + b);
      expect(result.sender).toBeGreaterThanOrEqual(0n);
    }), { numRuns: 2000 });
  });
  it("rejects overspending", () => {
    fc.assert(fc.property(balance, balance, fc.bigInt({ min: 1n, max: 1000n }), (a,b,extra) => {
      expect(() => transfer(a,b,a+extra)).toThrow(RangeError);
    }));
  });
});
