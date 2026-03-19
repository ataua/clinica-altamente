# Clínica Altamente

Sistema de gestão para clínica médica com autenticação, gestão de pacientes, consultas e prontuários.

## Tech Stack

- **Frontend/Backend**: Next.js 16 (App Router)
- **Linguagem**: TypeScript (strict mode)
- **ORM**: Prisma 7 com PostgreSQL adapter
- **Banco de dados**: PostgreSQL
- **Autenticação**: NextAuth v5 (Credentials)
- **Estilização**: Tailwind CSS
- **Runtime**: Bun
- **Validação**: Zod
- **Testes**: Bun test

## Primeiros Passos

### 1. Configuração do Banco de Dados

```bash
# Iniciar o PostgreSQL via Docker (dev e test)
docker-compose up -d

# Criar as tabelas no banco
bun run db:push

# Criar usuário admin padrão
bun run db:seed
```

### 2. Variáveis de Ambiente

Copie o arquivo de exemplo e configure as variáveis:

```bash
cp .env.example .env
```

Variáveis necessárias:
- `DATABASE_URL` - Connection string do PostgreSQL
- `AUTH_SECRET` - Secret para NextAuth (gerar com `openssl rand -base64 32`)

Para testes:
- `TEST_DATABASE_URL` - Connection string do banco de testes (opcional)

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
| `bun run db:seed` | Popular banco com dados iniciais |
| `bun test` | Executar testes |
| `bun test --coverage` | Executar testes com cobertura |

## Estrutura do Projeto

```
src/
├── app/                         # Páginas e API routes (App Router)
│   ├── (auth)/                  # Grupo de rotas de autenticação
│   ├── (dashboard)/             # Grupo de rotas do painel
│   │   ├── admin/
│   │   │   ├── users/          # Gerenciamento de usuários
│   │   │   ├── professionals/  # Gerenciamento de profissionais
│   │   │   └── appointment-types/ # Tipos de agendamento
│   │   ├── patients/           # Pacientes e histórico
│   │   ├── appointments/      # Agendamentos
│   │   └── calendar/          # Calendário
│   └── api/                    # Rotas da API REST
│       ├── auth/               # Autenticação
│       ├── users/              # CRUD de usuários
│       ├── patients/           # CRUD de pacientes
│       ├── professionals/      # CRUD de profissionais
│       ├── appointment-types/  # CRUD de tipos de agendamento
│       ├── appointments/       # Agendamentos
│       ├── attendances/        # Atendimentos
│       └── responsibles/       # Responsáveis
├── lib/                        # Utilitários e configurações
│   ├── auth.ts                # Configuração NextAuth
│   ├── prisma.ts             # Prisma Client com adapter
│   ├── bcrypt.ts             # Funções de hash
│   ├── errors.ts             # Classes de erro customizadas
│   ├── response.ts           # Helpers HTTP com HATEOAS
│   └── hateoas.ts           # Utilitários de links
├── controllers/               # Controllers MVC
│   ├── base.controller.ts   # Controller base
│   ├── user.controller.ts   # CRUD de usuários
│   ├── patient.controller.ts # CRUD de pacientes
│   ├── appointment.controller.ts
│   ├── attendance.controller.ts
│   └── responsible.controller.ts
├── services/                 # Lógica de negócio
├── dtos/                     # Validação Zod
└── __tests__/               # Testes unitários
    ├── setup.ts            # Setup com banco isolado
    ├── services/           # Testes de services
    ├── controllers/        # Testes de controllers
    └── hateoas/           # Testes de HATEOAS

prisma/
├── schema.prisma         # Schema do banco
└── seed.ts              # Script de inicialização
```

## Arquitetura API REST

A API segue o **Richardson Maturity Model nível 3** com **HATEOAS** (Hypermedia as the Engine of Application State).

### Formato de Resposta

```json
{
  "data": { ... },
  "message": "Operação realizada com sucesso",
  "links": [
    { "rel": "self", "href": "/api/resource/1" },
    { "rel": "update", "href": "/api/resource/1", "method": "PUT" },
    { "rel": "delete", "href": "/api/resource/1", "method": "DELETE" }
  ]
}
```

### Rotas Disponíveis

| Recurso | GET | POST | PUT | DELETE |
|---------|-----|------|-----|--------|
| `/api/users` | Listar | Criar | - | - |
| `/api/users/:id` | Detalhes | - | Atualizar | Excluir |
| `/api/patients` | Listar | Criar | - | - |
| `/api/patients/:id` | Detalhes | - | Atualizar | Excluir |
| `/api/professionals` | Listar | Criar | - | - |
| `/api/professionals/:id` | Detalhes | - | Atualizar | Excluir |
| `/api/appointment-types` | Listar | Criar | - | - |
| `/api/appointment-types/:id` | - | - | Atualizar | Excluir |
| `/api/appointments` | Listar | Criar | - | - |
| `/api/appointments/:id` | Detalhes | - | Atualizar | Excluir |
| `/api/appointments/:id/cancel` | - | Cancelar | - | - |
| `/api/appointments/:id/reschedule` | - | Reagendar | - | - |
| `/api/attendances` | Listar | Criar | - | - |
| `/api/attendances/:id/start` | - | Iniciar | - | - |
| `/api/attendances/:id/complete` | - | Finalizar | - | - |
| `/api/responsibles` | Listar | Criar | - | - |
| `/api/responsibles/:id` | - | - | Atualizar | - |

## Autenticação

O sistema utiliza NextAuth v5 com provider Credentials:

- Senha armazenada com bcrypt (salt 12)
- Sessões via JWT
- Roles: ADMIN, COORDINATOR, PROFESSIONAL, PATIENT
- Página de login: `/login`
- Página de registro: `/register`

## Testes

O projeto usa banco de dados PostgreSQL isolado para testes.

```bash
# Executar todos os testes
bun test

# Executar com coverage
bun test --coverage
```

Banco de testes:
- Container: `db_test` (porta 5433)
- Banco: `clinica-altamente_test`

## Modelo de Dados

### User
Usuários do sistema com autenticação.

### Patient
Pacientes com dados pessoais e vínculo com User.

### Professional
Profissionais de saúde com especialidade.

### Appointment
Agendamentos com horário, paciente e profissional.

### Attendance
Registros de atendimento com diagnóstico e plano de tratamento.

### ResponsibleContact
Contatos de emergência vinculados a pacientes.

## Links Úteis

- Board de tarefas: https://trello.com/b/69af4c44dc2cf3594724b0f0
- Documentação da API: `/api/docs` (Swagger)
