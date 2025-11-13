# 🎨 Frontend - Carteira Digital

Interface web desenvolvida com Next.js 14, React e TypeScript.

## 🛠️ Stack Tecnológica

- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização utilitária
- **Zod**: Validação de schemas
- **React Hook Form**: Gerenciamento de formulários
- **Sonner**: Notificações toast
- **Yarn**: Gerenciador de pacotes

## 🏗️ Arquitetura

### Estrutura

```
app/
├── page.tsx          # Login (rota raiz)
├── cadastro/         # Cadastro
├── dashboard/        # Dashboard principal
└── layout.tsx        # Layout global

lib/
├── actions.ts        # Server Actions
├── validations.ts    # Schemas Zod
├── token.ts          # Gerenciamento de token
├── types.ts          # Tipos TypeScript
└── utils.ts          # Utilitários
```

### Server Actions

Todas as operações usam Next.js Server Actions:

- `registerAction` - Cadastro
- `loginAction` - Login
- `getProfileAction` - Perfil
- `depositAction` - Depósito
- `transferAction` - Transferência
- `reverseTransactionAction` - Reversão
- `getTransactionsAction` - Histórico
- `getBalanceAction` - Saldo

**Vantagens:**

- Sem necessidade de API routes
- Type-safe end-to-end
- Execução no servidor
- Cache controlável

### Validação com Zod

Schemas de validação:

- `registerSchema` - Cadastro
- `loginSchema` - Login
- `depositSchema` - Depósito
- `transferSchema` - Transferência

**Integração com React Hook Form:**

```typescript
const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

## 🎨 Componentes

### Componentes Reutilizáveis

- **Button**: Botão estilizado com variantes
- **Input**: Input com validação e máscaras
- **Card**: Container de conteúdo
- **Dialog**: Modal para confirmações

### Máscaras

- **CPF**: `000.000.000-00`
- **Moeda**: `R$ 0,00`

## 🔒 Segurança

- Token JWT armazenado em `localStorage`
- Validação de dados com Zod
- Sanitização de inputs
- Proteção de rotas (redirecionamento se não autenticado)

## ⚡ Performance

### Otimizações

- `useCallback` para funções estáveis
- `memo` para componentes pesados
- `cache: 'no-store'` em fetch requests
- Lazy loading quando necessário

### Hooks Utilizados

- `useState` - Estado local
- `useEffect` - Efeitos colaterais
- `useCallback` - Memorização de funções
- `memo` - Memorização de componentes

## 🚀 Comandos

```bash
# Desenvolvimento
yarn dev

# Build
yarn build

# Produção
yarn start

# Linter
yarn lint
yarn lint:fix

# Formatação
yarn format
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- Yarn
- Backend rodando (veja [backend/README.md](../backend/README.md))

### 1. Configurar Variáveis de Ambiente

```bash
cp env.example .env.local
# Edite .env.local com a URL da API backend
```

**Variável obrigatória:**

- `NEXT_PUBLIC_API_URL` - URL da API backend (padrão: `http://localhost:3001/api`)

### 2. Instalar Dependências

```bash
yarn install
```

### 3. Iniciar Aplicação

```bash
yarn dev
```

A aplicação estará disponível em: **http://localhost:3000**

## 🔗 Backend

Este frontend requer que o backend esteja rodando.

Para configurar e executar o backend, veja: [backend/README.md](../backend/README.md)

**Importante:** Certifique-se de que:

- O backend está rodando na porta 3001
- A variável `NEXT_PUBLIC_API_URL` aponta para a URL correta do backend

## 🔧 Variáveis de Ambiente

Veja `env.example` para todas as variáveis necessárias.

**Obrigatória:**

- `NEXT_PUBLIC_API_URL` - URL da API backend

## 📱 Páginas

### `/` - Login

- Formulário de login
- Link para cadastro
- Validação com Zod

### `/cadastro` - Cadastro

- Formulário completo
- Validação de CPF
- Confirmação de senha

### `/dashboard` - Dashboard

- Saldo disponível
- Histórico de transações
- Depósito
- Transferência
- Reversão de transações

## 🎯 Features

- ✅ Autenticação com JWT
- ✅ Validação de formulários
- ✅ Máscaras de CPF e moeda
- ✅ Notificações toast
- ✅ Design responsivo
- ✅ Loading states
- ✅ Tratamento de erros
- ✅ Server Actions
