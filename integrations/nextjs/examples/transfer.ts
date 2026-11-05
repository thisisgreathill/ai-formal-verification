/** Pure, educational ledger transfer; not a database or production money service. */
export function transfer(
  sender: bigint,
  recipient: bigint,
  amount: bigint
): Readonly<{ sender: bigint; recipient: bigint }> {
  if (sender < 0n || recipient < 0n || amount < 0n || amount > sender) {
    throw new RangeError("Invalid amount or balance");
  }
  return { sender: sender - amount, recipient: recipient + amount };
}
