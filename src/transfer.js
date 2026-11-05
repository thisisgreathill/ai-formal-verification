/** Example pure function, NOT a production account transfer service. */
export function transfer(senderBalance, recipientBalance, amount) {
  if (![senderBalance, recipientBalance, amount].every(Number.isSafeInteger)) {
    throw new TypeError("Integer minor units are required");
  }
  if (senderBalance < 0 || recipientBalance < 0 || amount < 0 || senderBalance < amount) {
    throw new RangeError("Invalid transfer");
  }
  if (!Number.isSafeInteger(recipientBalance + amount)) {
    throw new RangeError("Recipient balance overflow");
  }
  return { senderAfter: senderBalance - amount, recipientAfter: recipientBalance + amount };
}
