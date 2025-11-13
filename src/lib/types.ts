export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  wallet: {
    id: string;
    balance: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export type TransactionType = "DEPOSIT" | "TRANSFER" | "REVERSAL";

export type TransactionStatus = "PENDING" | "COMPLETED" | "REVERSED" | "FAILED";

export type TransactionDirection = "received" | "sent";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  createdAt: string;
  processedAt: string;
  direction?: TransactionDirection;
  otherParty?: {
    id: string;
    name: string;
  };
}

export interface TransactionResponse {
  newBalance: number;
}

export interface ReverseTransactionResponse {
  message: string;
  reversalTransaction: Transaction;
  newBalance: number;
}

export interface BalanceResponse {
  balance: number;
  walletId: string;
}
