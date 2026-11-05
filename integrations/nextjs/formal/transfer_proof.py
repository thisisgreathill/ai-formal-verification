"""Proves model invariants only, NOT the TypeScript program or DB behavior."""
from z3 import Ints, Solver, Not, unsat

a, b, x = Ints("a b x")
assumptions = [a >= 0, b >= 0, x >= 0, x <= a]
properties = {
    "conservation": (a - x) + (b + x) == a + b,
    "sender_nonnegative": a - x >= 0,
    "recipient_nonnegative": b + x >= 0,
}
for name, invariant in properties.items():
    solver = Solver()
    solver.add(*assumptions)
    solver.add(Not(invariant))
    status = solver.check()
    if status != unsat:
        raise SystemExit(f"FAIL {name}: {status}")
    print(f"PASS {name} (model only)")
