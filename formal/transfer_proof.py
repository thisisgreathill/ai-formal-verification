"""Symbolic proof for the SPECIFIED transfer model only (not the JS implementation)."""
from z3 import Ints, Solver, Not, And, unsat

sender, recipient, amount = Ints("sender recipient amount")
sender_after = sender - amount
recipient_after = recipient + amount
assumptions = [sender >= 0, recipient >= 0, amount >= 0, sender >= amount]

properties = {
    "conservation": sender_after + recipient_after == sender + recipient,
    "sender_nonnegative": sender_after >= 0,
    "recipient_nonnegative": recipient_after >= 0,
}

for name, property_expr in properties.items():
    solver = Solver()
    solver.add(*assumptions)
    solver.add(Not(property_expr))
    result = solver.check()
    if result != unsat:
        print(f"FAIL {name}: {result} {solver.model() if str(result) == 'sat' else ''}")
        raise SystemExit(1)
    print(f"PASS {name}: no counterexample exists under modeled assumptions")
print("All Z3 model assertions verified. Real database/API/concurrency code not proven.")
