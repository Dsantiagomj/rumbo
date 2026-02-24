export class InsufficientBalanceError extends Error {
  constructor(message = 'Insufficient balance: cash products cannot have a negative balance') {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}
