import Link from "next/link";

type Endpoint = {
  method: string;
  path: string;
  description: string;
  body?: Record<string, string>;
  query?: string;
  auth?: boolean;
};

const endpoints: { category: string; methods: Endpoint[] }[] = [
  {
    category: "Autenticação",
    methods: [
      {
        method: "POST",
        path: "/api/auth/register",
        description: "Criar novo usuário",
        body: {
          name: "string",
          email: "string",
          password: "string",
          role: "PATIENT | PROFESSIONAL | RECEPTIONIST | COORDINATOR | ADMIN",
        },
      },
      {
        method: "POST",
        path: "/api/auth/[...nextauth]",
        description: "Login com NextAuth",
        body: {
          email: "string",
          password: "string",
        },
      },
    ],
  },
  {
    category: "Usuários",
    methods: [
      {
        method: "GET",
        path: "/api/users",
        description: "Listar todos os usuários",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/users/[id]",
        description: "Buscar usuário por ID",
        auth: true,
      },
      {
        method: "PUT",
        path: "/api/users/[id]",
        description: "Atualizar usuário",
        auth: true,
        body: {
          name: "string",
          email: "string",
        },
      },
      {
        method: "DELETE",
        path: "/api/users/[id]",
        description: "Excluir usuário",
        auth: true,
      },
    ],
  },
  {
    category: "Pacientes",
    methods: [
      {
        method: "GET",
        path: "/api/patients",
        description: "Listar todos os pacientes",
        auth: true,
      },
      {
        method: "POST",
        path: "/api/patients",
        description: "Criar novo paciente",
        auth: true,
        body: {
          name: "string",
          email: "string",
          phone: "string",
          birthDate: "Date",
          address: "string",
          responsibleName: "string (opcional)",
        },
      },
      {
        method: "GET",
        path: "/api/patients/[id]",
        description: "Buscar paciente por ID",
        auth: true,
      },
      {
        method: "PUT",
        path: "/api/patients/[id]",
        description: "Atualizar paciente",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/patients/[id]/history",
        description: "Histórico de atendimentos",
        auth: true,
      },
    ],
  },
  {
    category: "Agendamentos",
    methods: [
      {
        method: "GET",
        path: "/api/appointments",
        description: "Listar agendamentos",
        auth: true,
        query: "?startDate=&endDate=&professionalId=&patientId=",
      },
      {
        method: "POST",
        path: "/api/appointments",
        description: "Criar agendamento",
        auth: true,
        body: {
          patientId: "string",
          professionalId: "string",
          type: "PSYCHOLOGICAL | PEDAGOGICAL | SPEECH | OCCUPATIONAL | PSYCHOPEDAGOGICAL",
          dateTime: "Date",
          duration: "number (minutos)",
          notes: "string (opcional)",
        },
      },
      {
        method: "PUT",
        path: "/api/appointments/[id]",
        description: "Atualizar agendamento",
        auth: true,
      },
      {
        method: "PUT",
        path: "/api/appointments/[id]/cancel",
        description: "Cancelar agendamento",
        auth: true,
      },
      {
        method: "PUT",
        path: "/api/appointments/[id]/reschedule",
        description: "Reagendar agendamento",
        auth: true,
        body: {
          newDateTime: "Date",
        },
      },
    ],
  },
  {
    category: "Atendimentos",
    methods: [
      {
        method: "GET",
        path: "/api/attendances",
        description: "Listar atendimentos",
        auth: true,
      },
      {
        method: "POST",
        path: "/api/attendances",
        description: "Registrar atendimento",
        auth: true,
        body: {
          appointmentId: "string",
          professionalId: "string",
          notes: "string",
          diagnosis: "string (opcional)",
          recommendations: "string (opcional)",
        },
      },
      {
        method: "GET",
        path: "/api/attendances/[id]",
        description: "Buscar atendimento por ID",
        auth: true,
      },
    ],
  },
  {
    category: "Horário",
    methods: [
      {
        method: "GET",
        path: "/api/schedule/available",
        description: "Buscar horários disponíveis",
        auth: true,
        query: "?date=&professionalId=",
      },
    ],
  },
  {
    category: "Relatórios",
    methods: [
      {
        method: "GET",
        path: "/api/reports/appointments",
        description: "Relatório de agendamentos",
        auth: true,
        query: "?startDate=&endDate=&format=json | pdf",
      },
      {
        method: "GET",
        path: "/api/reports/patients",
        description: "Relatório de pacientes",
        auth: true,
        query: "?startDate=&endDate=&format=json | pdf",
      },
      {
        method: "GET",
        path: "/api/reports/professionals",
        description: "Relatório de profissionais",
        auth: true,
        query: "?startDate=&endDate=&format=json | pdf",
      },
    ],
  },
  {
    category: "Dashboard",
    methods: [
      {
        method: "GET",
        path: "/api/dashboard/stats",
        description: "Estatísticas gerais",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/dashboard/appointments-by-professional",
        description: "Atendimentos por profissional",
        auth: true,
      },
      {
        method: "GET",
        path: "/api/dashboard/no-show-rate",
        description: "Taxa de faltosos",
        auth: true,
      },
    ],
  },
];

export default function ApiDocsPage() {
  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "POST":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "PUT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
            >
              ← Voltar
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              API Documentation
            </h1>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Clínica Altamente v1.0
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            API Reference
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Base URL: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">http://localhost:3000/api</code>
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Autenticação: Todas as rotas protegidas requerem token JWT no header{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Authorization: Bearer TOKEN</code>
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Nota:</strong> Esta é uma documentação básica. 
              Para testes interativos, considere usar Postman ou curl.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {endpoints.map((section) => (
            <div
              key={section.category}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {section.category}
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {section.methods.map((endpoint, idx) => (
                  <div key={idx} className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`px-3 py-1 rounded-md text-sm font-mono font-semibold ${getMethodColor(
                          endpoint.method
                        )}`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-sm text-gray-900 dark:text-gray-200 font-mono">
                        {endpoint.path}
                      </code>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {endpoint.description}
                    </p>
                    {endpoint.auth && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">
                        ✨ Requer autenticação
                      </p>
                    )}
                    {endpoint.query && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Query: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{endpoint.query}</code>
                      </p>
                    )}
                    {endpoint.body && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Body:
                        </p>
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
{JSON.stringify(endpoint.body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          © 2026 Clínica Altamente - Sistema de Gestão
        </div>
      </footer>
    </div>
  );
}
