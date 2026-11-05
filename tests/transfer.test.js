import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { transfer } from "../src/transfer.js";

describe("internal transfer contract (pure model)", () => {
  it("conserves balances and never goes negative for valid safe inputs", () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 1_000_000 }),
      fc.integer({ min: 0, max: 1_000_000 }),
      fc.integer({ min: 0, max: 1_000_000 }),
      (senderBalance, recipientBalance, requested) => {
        const amount = Math.min(senderBalance, requested);
        const result = transfer(senderBalance, recipientBalance, amount);
        expect(result.senderAfter).toBe(senderBalance - amount);
        expect(result.recipientAfter).toBe(recipientBalance + amount);
        expect(result.senderAfter + result.recipientAfter).toBe(senderBalance + recipientBalance);
        expect(result.senderAfter).toBeGreaterThanOrEqual(0);
        expect(result.recipientAfter).toBeGreaterThanOrEqual(0);
      }
    ), { numRuns: 2000 });
  });
  it("rejects insufficient funds", () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 10000 }),
      fc.integer({ min: 0, max: 10000 }),
      fc.integer({ min: 1, max: 10000 }),
      (sender, recipient, excess) => {
        expect(() => transfer(sender, recipient, sender + excess)).toThrow(RangeError);
      }
    ));
  });
});
