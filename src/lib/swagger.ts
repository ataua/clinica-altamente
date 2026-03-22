export const specs = {
  openapi: '3.0.0',
  info: {
    title: 'Clínica Altamente API',
    version: '1.0.0',
    description: 'API para sistema de gestão de clínica médica',
    contact: {
      name: 'API Support',
      email: 'suporte@clinicaaltamente.com.br',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor de desenvolvimento',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'PROFESSIONAL', 'SECRETARY', 'PATIENT', 'RESPONSIBLE', 'TEACHER', 'COORDINATOR'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Patient: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          cpf: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string' },
        },
      },
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          patientName: { type: 'string' },
          professionalName: { type: 'string' },
          scheduledDateTime: { type: 'string', format: 'date-time' },
          endDateTime: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
          notes: { type: 'string' },
        },
      },
      CreateAppointment: {
        type: 'object',
        required: ['patientId', 'professionalId', 'scheduledDateTime'],
        properties: {
          patientId: { type: 'string' },
          professionalId: { type: 'string' },
          scheduledDateTime: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
        },
      },
      UpdateAppointment: {
        type: 'object',
        properties: {
          scheduledDateTime: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
          notes: { type: 'string' },
          cancellationReason: { type: 'string' },
        },
      },
      ResponsibleContact: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          cpf: { type: 'string' },
          relationship: { type: 'string' },
        },
      },
      Professional: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          specialty: { type: 'string' },
          licenseNumber: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/api/users': {
      get: {
        summary: 'Lista todos os usuários',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Lista de usuários',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    pagination: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Cria um novo usuário',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuário criado' },
          400: { description: 'Erro de validação', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/patients': {
      get: {
        summary: 'Lista todos os pacientes',
        tags: ['Patients'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Lista de pacientes' },
        },
      },
      post: {
        summary: 'Cria um novo paciente',
        tags: ['Patients'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          201: { description: 'Paciente criado' },
        },
      },
    },
    '/api/appointments': {
      get: {
        summary: 'Lista todos os agendamentos',
        tags: ['Appointments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'professionalId', in: 'query', schema: { type: 'string' } },
          { name: 'patientId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Lista de agendamentos' },
        },
      },
      post: {
        summary: 'Cria um novo agendamento',
        tags: ['Appointments'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAppointment' },
            },
          },
        },
        responses: {
          201: { description: 'Agendamento criado' },
          400: { description: 'Erro de validação ou conflito de horário' },
        },
      },
    },
    '/api/appointments/{id}': {
      get: {
        summary: 'Retorna um agendamento pelo ID',
        tags: ['Appointments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Agendamento encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Appointment' } } } },
          404: { description: 'Agendamento não encontrado' },
        },
      },
      put: {
        summary: 'Atualiza um agendamento',
        tags: ['Appointments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateAppointment' },
            },
          },
        },
        responses: {
          200: { description: 'Agendamento atualizado' },
          404: { description: 'Agendamento não encontrado' },
        },
      },
      delete: {
        summary: 'Cancela um agendamento',
        tags: ['Appointments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Agendamento cancelado' },
          404: { description: 'Agendamento não encontrado' },
        },
      },
    },
    '/api/appointments/professionals': {
      get: {
        summary: 'Lista todos os profissionais',
        tags: ['Appointments'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lista de profissionais', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Professional' } } } } },
        },
      },
    },
    '/api/appointments/slots': {
      get: {
        summary: 'Retorna horários disponíveis',
        tags: ['Appointments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'professionalId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'date', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: { description: 'Lista de horários disponíveis' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Registra um novo usuário',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuário registrado com sucesso' },
          400: { description: 'Erro de validação' },
        },
      },
    },
  },
}
