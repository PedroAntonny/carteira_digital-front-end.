"use server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "Variável de ambiente API_URL (ou NEXT_PUBLIC_API_URL) não configurada."
  );
}

/**
 * Helper para fazer requisições autenticadas
 * Recebe o token como parâmetro (gerenciado pelo cliente via localStorage)
 */
async function fetchWithAuth(
  endpoint: string,
  token: string | null,
  options: RequestInit = {}
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Erro desconhecido",
    }));
    throw new Error(
      Array.isArray(error.message) ? error.message[0] : error.message
    );
  }

  return response.json();
}

export async function registerAction(formData: {
  name: string;
  email: string;
  password: string;
  cpf: string;
}) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: Array.isArray(error.message) ? error.message[0] : error.message,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Erro ao registrar";
    return { success: false, error: errorMessage };
  }
}

export async function loginAction(formData: {
  email: string;
  password: string;
}) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: Array.isArray(error.message) ? error.message[0] : error.message,
      };
    }

    const data = await response.json();

    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Erro ao fazer login";
    return { success: false, error: errorMessage };
  }
}

export async function logoutAction() {
  return { success: true };
}

export async function getProfileAction(token: string | null) {
  try {
    const data = await fetchWithAuth("/auth/profile", token);
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Erro ao obter perfil";
    return { success: false, error: errorMessage };
  }
}

export async function depositAction(
  formData: {
    amount: number;
    description?: string;
  },
  token: string | null
) {
  try {
    const data = await fetchWithAuth("/transactions/deposit", token, {
      method: "POST",
      body: JSON.stringify(formData),
    });
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Erro ao realizar depósito";
    return { success: false, error: errorMessage };
  }
}

export async function transferAction(
  formData: {
    recipientCpf: string;
    amount: number;
    description?: string;
  },
  token: string | null
) {
  try {
    const data = await fetchWithAuth("/transactions/transfer", token, {
      method: "POST",
      body: JSON.stringify(formData),
    });
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Erro ao realizar transferência";
    return { success: false, error: errorMessage };
  }
}

export async function reverseTransactionAction(
  transactionId: string,
  token: string | null
) {
  try {
    const data = await fetchWithAuth(
      `/transactions/${transactionId}/reverse`,
      token,
      {
        method: "POST",
      }
    );
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Erro ao reverter transação";
    return { success: false, error: errorMessage };
  }
}

export async function getTransactionsAction(token: string | null) {
  try {
    const data = await fetchWithAuth("/transactions/history", token);
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Erro ao obter histórico";
    return { success: false, error: errorMessage };
  }
}

export async function getBalanceAction(token: string | null) {
  try {
    const data = await fetchWithAuth("/transactions/balance", token);
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Erro ao obter saldo";
    return { success: false, error: errorMessage };
  }
}
