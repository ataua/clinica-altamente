# Clínica Altamente

Sistema de gestão para clínica médica com autenticação, gestão de pacientes, consultas e prontuários.

## Tech Stack

- **Frontend/Backend**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **ORM**: Prisma 7
- **Banco de dados**: PostgreSQL
- **Autenticação**: NextAuth v5 (Credentials)
- **Estilização**: Tailwind CSS
- **Runtime**: Bun

## Primeiros Passos

### 1. Configuração do Banco de Dados

```bash
# Iniciar o PostgreSQL via Docker
docker-compose up -d

# Criar as tabelas no banco
bun run db:push

# Criar usuário admin padrão
bun run db:init
```

### 2. Variáveis de Ambiente

Copie o arquivo de exemplo e configure as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

### 3. Iniciar o Servidor

```bash
bun run dev
```

Acesse: http://localhost:3000

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | Iniciar servidor de desenvolvimento |
| `bun run build` | Build de produção |
| `bun run start` | Iniciar servidor de produção |
| `bun run lint` | Verificar código |
| `bun run db:generate` | Gerar Prisma Client |
| `bun run db:push` | Sincronizar schema com banco |
| `bun run db:studio` | Abrir Prisma Studio |
| `bun run db:migrate` | Criar migração |
| `bun run db:init` | Criar usuário admin padrão |

## Estrutura do Projeto

```
src/
├── app/                    # Páginas e API routes
│   ├── api/auth/          # Rotas de autenticação
│   └── ...
├── lib/                   # Utilitários
│   ├── auth.ts           # Configuração NextAuth
│   ├── prisma.ts         # Instância PrismaClient
│   └── bcrypt.ts         # Funções de hash
└── ...
prisma/
├── schema.prisma         # Schema do banco
└── seed.ts              # Script de inicialização
```

## Autenticação

O sistema utiliza NextAuth v5 com provider Credentials:

- Senha armazenada com bcrypt (salt 12)
- Sessões via JWT
- Página de login: `/login`

## Banco de Dados

### Tabelas Criadas

- **User** - Usuários do sistema
- **Account** - Contas de provedores OAuth
- **Session** - Sessões ativas
- **VerificationToken** - Tokens de verificação

## Links Úteis

- Board de tarefas: https://trello.com/c/GcMK1bt7/19-desenho-do-banco-de-dados
