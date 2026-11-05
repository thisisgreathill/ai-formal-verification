/**
 * Model-based test skeleton (adapt per domain). Runs a seeded random event sequence against BOTH a pure
 * reference model and the REAL service on a disposable database; compares everything after every step.
 * Skips cleanly when TEST_DATABASE_URL is unset. Run in-band (shared DB).
 */
import fc from "fast-check";

type Money = bigint;
interface State { /* all balances, counters, statuses the spec defines */ }
type Event =
  | { kind: "deposit"; user: number; amount: Money }
  | { kind: "bet"; user: number; amount: Money; round: string }
  | { kind: "win"; user: number; amount: Money; round: string }
  | { kind: "rollback"; user: number; round: string }
  | { kind: "replay"; of: number };                       // idempotent replay of an earlier event

// 1. Pure reference model (BigInt, no I/O) — derived from the SPEC, not from the service code.
function modelApply(s: State, e: Event): { next: State; outcome: "ok" | "rejected" } { throw new Error("implement"); }

// 2. Driver that calls the real service / route and then reads the real state back.
async function realApply(e: Event): Promise<"ok" | "rejected"> { throw new Error("implement"); }
async function readRealState(): Promise<State> { throw new Error("implement"); }

// 3. Global invariants asserted after EVERY step (see docs/BUG-CLASSES.md "Değişmez şablonları").
function assertInvariants(s: State) { /* no negatives, conservation vs ledger, caps, monotone counters... */ }

const SEED = Number(process.env.MODEL_SEED ?? 20261105);
const RUNS = Number(process.env.MODEL_RUNS ?? 40);
const STEPS = Number(process.env.MODEL_STEPS ?? 60);
const describeDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeDb("model vs real", () => {
  it("every step: model state == real state; invariants hold", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.constant(0), { minLength: STEPS, maxLength: STEPS }), async () => {
        // generate events with fc.oneof(...) incl. boundary amounts: 0n, 1n, cap-1, cap, cap+1, MAX_SAFE
        // for each event: const m = modelApply(...); const r = await realApply(...); compare outcome + state
      }),
      { seed: SEED, numRuns: RUNS },
    );
  });

  it("concurrent same-row operations are exactly-once", async () => {
    // await Promise.all([realApply(e), realApply(e)]) on the same user/round; assert one effect, no negative balance
  });
});
