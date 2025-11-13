"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Dialog } from "@/components/Dialog";
import {
  getProfileAction,
  depositAction,
  transferAction,
  reverseTransactionAction,
  getTransactionsAction,
  getBalanceAction,
  logoutAction,
} from "@/lib/actions";
import { getToken, removeToken } from "@/lib/token";
import { Transaction, User } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatCurrencyInput,
  cleanCurrency,
  formatCPF,
  cleanCPF,
} from "@/lib/utils";
import {
  depositSchema,
  transferSchema,
  type DepositFormData,
  type TransferFormData,
} from "@/lib/validations";

const HISTORY_RELOAD_DELAY_MS = 500;

const TransactionItem = memo(
  ({
    transaction,
    onReverseClick,
  }: {
    transaction: Transaction;
    onReverseClick: (_transactionId: string) => void;
  }) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${
                transaction.type === "DEPOSIT"
                  ? "bg-green-100 text-green-800"
                  : transaction.type === "TRANSFER"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-orange-100 text-orange-800"
              }`}
            >
              {transaction.type === "DEPOSIT"
                ? "Depósito"
                : transaction.type === "TRANSFER"
                  ? "Transferência"
                  : "Estorno"}
            </span>
            <span
              className={`text-xs whitespace-nowrap ${
                transaction.status === "COMPLETED"
                  ? "text-green-600"
                  : transaction.status === "REVERSED"
                    ? "text-orange-600"
                    : "text-gray-600"
              }`}
            >
              {transaction.status === "COMPLETED"
                ? "✓ Concluída"
                : transaction.status === "REVERSED"
                  ? "↩ Revertida"
                  : transaction.status}
            </span>
          </div>
          <p className="text-sm text-gray-700 mt-1 break-words">
            {transaction.description}
          </p>
          {transaction.otherParty && (
            <p className="text-xs text-gray-500 mt-1 break-words">
              {transaction.direction === "received" ? "De: " : "Para: "}
              {transaction.otherParty.name}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(transaction.createdAt)}
          </p>
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right sm:ml-4 gap-2 flex-shrink-0">
          <p
            className={`text-base sm:text-lg font-semibold whitespace-nowrap ${
              transaction.direction === "received"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {transaction.direction === "received" ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </p>
          {transaction.status === "COMPLETED" &&
            transaction.type !== "REVERSAL" && (
              <Button
                variant="secondary"
                onClick={() => onReverseClick(transaction.id)}
                className="text-xs py-1 px-2 sm:mt-2"
              >
                Estornar
              </Button>
            )}
        </div>
      </div>
    );
  }
);

TransactionItem.displayName = "TransactionItem";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "history" | "deposit" | "transfer"
  >("history");
  const [reverseDialog, setReverseDialog] = useState<{
    isOpen: boolean;
    transactionId: string | null;
  }>({
    isOpen: false,
    transactionId: null,
  });

  const {
    register: registerDeposit,
    handleSubmit: handleSubmitDeposit,
    formState: { errors: depositErrors, isSubmitting: depositLoading },
    setValue: setDepositValue,
    reset: resetDeposit,
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: "",
      description: "",
    },
  });

  const {
    register: registerTransfer,
    handleSubmit: handleSubmitTransfer,
    formState: { errors: transferErrors, isSubmitting: transferLoading },
    setValue: setTransferValue,
    reset: resetTransfer,
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipientCpf: "",
      amount: "",
      description: "",
    },
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = getToken();

      if (!token) {
        router.push("/");
        return;
      }

      const [profileResult, balanceResult, historyResult] = await Promise.all([
        getProfileAction(token),
        getBalanceAction(token),
        getTransactionsAction(token),
      ]);

      if (!profileResult.success) {
        if (
          profileResult.error?.includes("401") ||
          profileResult.error?.includes("não autorizado")
        ) {
          removeToken();
          router.push("/");
        }
        return;
      }

      if (!balanceResult.success) {
        toast.error(balanceResult.error || "Erro ao obter saldo");
        return;
      }

      if (!historyResult.success) {
        toast.error(historyResult.error || "Erro ao obter histórico");
        return;
      }

      const userData = profileResult.data as User;
      const balanceData = balanceResult.data as { balance: number };
      const transactionsData = historyResult.data as Transaction[];

      if (!userData.wallet) {
        toast.error(
          "Erro: Carteira não encontrada. Entre em contato com o suporte."
        );
        return;
      }

      setUser(userData);
      setBalance(Number(balanceData.balance));
      setTransactions(transactionsData);
    } catch (error: unknown) {
      toast.error("Erro ao carregar dados. Redirecionando para login...");
      removeToken();
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDepositAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCurrencyInput(e.target.value);
      setDepositValue("amount", formatted);
    },
    [setDepositValue]
  );

  const handleTransferCpfChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCPF(e.target.value);
      setTransferValue("recipientCpf", formatted);
    },
    [setTransferValue]
  );

  const handleTransferAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCurrencyInput(e.target.value);
      setTransferValue("amount", formatted);
    },
    [setTransferValue]
  );

  const handleLogout = useCallback(async () => {
    await logoutAction();
    removeToken();
    router.push("/");
  }, [router]);

  const onDepositSubmit = async (data: DepositFormData) => {
    try {
      const token = getToken();
      if (!token) {
        router.push("/");
        return;
      }

      const amount = cleanCurrency(data.amount);

      const result = await depositAction(
        {
          amount,
          description: data.description || undefined,
        },
        token
      );

      if (!result.success) {
        toast.error(result.error || "Erro ao realizar depósito");
        return;
      }

      const depositResult = result.data as Transaction & {
        newBalance: number;
        previousBalance?: number;
      };

      if (!depositResult || depositResult.newBalance === undefined) {
        toast.error("Erro ao processar resposta do depósito");
        return;
      }

      setBalance(Number(depositResult.newBalance));
      toast.success(
        `Depósito de ${formatCurrency(amount)} realizado com sucesso!`
      );
      resetDeposit();

      setTimeout(async () => {
        const token = getToken();
        if (token) {
          const historyResult = await getTransactionsAction(token);
          if (historyResult.success) {
            setTransactions(historyResult.data as Transaction[]);
          }
        }
      }, HISTORY_RELOAD_DELAY_MS);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Erro ao realizar depósito";
      toast.error(errorMessage);
    }
  };

  const onTransferSubmit = async (data: TransferFormData) => {
    try {
      const token = getToken();
      if (!token) {
        router.push("/");
        return;
      }

      const amount = cleanCurrency(data.amount);
      const recipientCpf = cleanCPF(data.recipientCpf);

      const result = await transferAction(
        {
          recipientCpf,
          amount,
          description: data.description || undefined,
        },
        token
      );

      if (!result.success) {
        toast.error(result.error || "Erro ao realizar transferência");
        return;
      }

      const transferResult = result.data as Transaction & {
        newBalance: number;
        previousBalance?: number;
      };

      if (!transferResult || transferResult.newBalance === undefined) {
        toast.error("Erro ao processar resposta da transferência");
        return;
      }

      setBalance(Number(transferResult.newBalance));
      toast.success(
        `Transferência de ${formatCurrency(amount)} realizada com sucesso!`
      );
      resetTransfer();

      setTimeout(async () => {
        const token = getToken();
        if (token) {
          const historyResult = await getTransactionsAction(token);
          if (historyResult.success) {
            setTransactions(historyResult.data as Transaction[]);
          }
        }
      }, 500);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Erro ao realizar transferência";
      toast.error(errorMessage);
    }
  };

  const handleReverseClick = useCallback((transactionId: string) => {
    setReverseDialog({
      isOpen: true,
      transactionId,
    });
  }, []);

  const handleReverseConfirm = async () => {
    if (!reverseDialog.transactionId) return;

    try {
      const token = getToken();
      if (!token) {
        router.push("/");
        return;
      }

      const result = await reverseTransactionAction(
        reverseDialog.transactionId,
        token
      );

      if (!result.success) {
        toast.error(result.error || "Erro ao estornar transação");
        return;
      }

      const reverseResult = result.data as {
        message: string;
        newBalance: number;
      };
      toast.success(reverseResult.message);

      if (reverseResult.newBalance !== undefined) {
        setBalance(reverseResult.newBalance);
      }

      setTimeout(async () => {
        const token = getToken();
        if (token) {
          const historyResult = await getTransactionsAction(token);
          if (historyResult.success) {
            setTransactions(historyResult.data as Transaction[]);
          }
        }
      }, 500);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Erro ao estornar transação";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Carteira Digital
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                Olá, {user?.name}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <Card className="mb-6 sm:mb-8 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
          <div className="overflow-hidden">
            <p className="text-primary-100 mb-2 text-sm sm:text-base">
              Saldo disponível
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold break-words">
              {formatCurrency(balance)}
            </h2>
            <p className="text-xs sm:text-sm text-primary-100 mt-2 break-all">
              Carteira ID: {user?.wallet.id}
            </p>
            <p className="text-xs text-primary-100 mt-1 break-all">
              Seu ID: {user?.id}
            </p>
          </div>
        </Card>

        <div className="mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex space-x-2 sm:space-x-4 min-w-max sm:min-w-0">
            <Button
              variant="tab"
              isActive={activeTab === "history"}
              onClick={() => setActiveTab("history")}
            >
              Histórico
            </Button>
            <Button
              variant="tab"
              isActive={activeTab === "deposit"}
              onClick={() => setActiveTab("deposit")}
            >
              Depositar
            </Button>
            <Button
              variant="tab"
              isActive={activeTab === "transfer"}
              onClick={() => setActiveTab("transfer")}
            >
              Transferir
            </Button>
          </div>
        </div>

        {activeTab === "history" && (
          <Card>
            <CardHeader
              title="Histórico de Transações"
              subtitle="Suas últimas movimentações"
            />

            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Nenhuma transação encontrada</p>
                <p className="text-sm mt-2">
                  Faça um depósito ou transferência para começar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onReverseClick={handleReverseClick}
                  />
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === "deposit" && (
          <Card>
            <CardHeader
              title="Realizar Depósito"
              subtitle="Adicione saldo à sua carteira"
            />

            <form
              onSubmit={handleSubmitDeposit(onDepositSubmit)}
              className="space-y-4"
            >
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    R$
                  </span>
                  <Input
                    type="text"
                    {...registerDeposit("amount")}
                    onChange={(e) => {
                      registerDeposit("amount").onChange(e);
                      handleDepositAmountChange(e);
                    }}
                    placeholder="0,00"
                    inputMode="decimal"
                    className="pl-10"
                  />
                </div>
                {depositErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {depositErrors.amount.message}
                  </p>
                )}
              </div>

              <div className="w-full">
                <Input
                  label="Descrição (opcional)"
                  type="text"
                  {...registerDeposit("description")}
                  placeholder="Ex: Depósito inicial"
                />
                {depositErrors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {depositErrors.description.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={depositLoading}
              >
                Depositar
              </Button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg">
              <p className="font-semibold">💡 Dica:</p>
              <p>
                Se seu saldo estiver negativo, o depósito compensará o valor
                automaticamente.
              </p>
            </div>
          </Card>
        )}

        {activeTab === "transfer" && (
          <Card>
            <CardHeader
              title="Realizar Transferência"
              subtitle="Envie dinheiro para outro usuário"
            />

            <form
              onSubmit={handleSubmitTransfer(onTransferSubmit)}
              className="space-y-4"
            >
              <div className="w-full">
                <Input
                  label="CPF do destinatário"
                  type="text"
                  {...registerTransfer("recipientCpf")}
                  onChange={(e) => {
                    registerTransfer("recipientCpf").onChange(e);
                    handleTransferCpfChange(e);
                  }}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
                {transferErrors.recipientCpf && (
                  <p className="mt-1 text-sm text-red-600">
                    {transferErrors.recipientCpf.message}
                  </p>
                )}
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    R$
                  </span>
                  <Input
                    type="text"
                    {...registerTransfer("amount")}
                    onChange={(e) => {
                      registerTransfer("amount").onChange(e);
                      handleTransferAmountChange(e);
                    }}
                    placeholder="0,00"
                    inputMode="decimal"
                    className="pl-10"
                  />
                </div>
                {transferErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {transferErrors.amount.message}
                  </p>
                )}
              </div>

              <div className="w-full">
                <Input
                  label="Descrição (opcional)"
                  type="text"
                  {...registerTransfer("description")}
                  placeholder="Ex: Pagamento"
                />
                {transferErrors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {transferErrors.description.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={transferLoading}
              >
                Transferir
              </Button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg">
              <p className="font-semibold">💡 Importante:</p>
              <p>• Você precisa do CPF do destinatário</p>
              <p>• Verifique se você tem saldo suficiente</p>
              <p>• A transferência pode ser estornada posteriormente</p>
            </div>
          </Card>
        )}
      </main>

      <Dialog
        isOpen={reverseDialog.isOpen}
        onClose={() => setReverseDialog({ isOpen: false, transactionId: null })}
        onConfirm={handleReverseConfirm}
        title="Confirmar Estorno"
        message="Deseja realmente estornar esta transação? Esta ação não pode ser desfeita."
        confirmText="Estornar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
