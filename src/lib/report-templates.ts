export interface PatientReportData {
  patientName: string
  patientEmail: string | null
  patientPhone: string | null
  period: {
    start: string
    end: string
  }
  totalAppointments: number
  attendedAppointments: number
  missedAppointments: number
  appointments: Array<{
    date: string
    time: string
    professional: string
    status: string
    notes?: string
  }>
}

export function getIndividualReportTemplate(data: PatientReportData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { color: #2563eb; margin: 0; }
    .header h2 { color: #333; margin: 10px 0 0; font-size: 18px; }
    .patient-info { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .patient-info p { margin: 5px 0; }
    .label { font-weight: bold; color: #6b7280; }
    .summary { display: flex; gap: 20px; margin-bottom: 20px; }
    .summary-item { flex: 1; text-align: center; padding: 15px; background-color: #eff6ff; border-radius: 8px; }
    .summary-item.green { background-color: #dcfce7; }
    .summary-item.red { background-color: #fee2e2; }
    .summary-item h3 { font-size: 24px; margin: 0; }
    .summary-item p { margin: 5px 0 0; font-size: 14px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background-color: #2563eb; color: white; padding: 12px; text-align: left; }
    td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status.completed { background-color: #dcfce7; color: #166534; }
    .status.no-show { background-color: #fee2e2; color: #991b1b; }
    .status.cancelled { background-color: #fef3c7; color: #92400e; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Clínica Altamente</h1>
      <h2>Relatório Individual de Atendimento</h2>
    </div>

    <div class="patient-info">
      <p><span class="label">Paciente:</span> ${data.patientName}</p>
      <p><span class="label">E-mail:</span> ${data.patientEmail || 'Não informado'}</p>
      <p><span class="label">Telefone:</span> ${data.patientPhone || 'Não informado'}</p>
      <p><span class="label">Período:</span> ${data.period.start} a ${data.period.end}</p>
    </div>

    <div class="summary">
      <div class="summary-item">
        <h3>${data.totalAppointments}</h3>
        <p>Total de Consultas</p>
      </div>
      <div class="summary-item green">
        <h3>${data.attendedAppointments}</h3>
        <p>Comparecimentos</p>
      </div>
      <div class="summary-item red">
        <h3>${data.missedAppointments}</h3>
        <p>Faltas</p>
      </div>
    </div>

    <h3 style="margin-top: 30px;">Histórico de Consultas</h3>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Hora</th>
          <th>Profissional</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.appointments.map(apt => `
          <tr>
            <td>${apt.date}</td>
            <td>${apt.time}</td>
            <td>${apt.professional}</td>
            <td><span class="status ${apt.status.toLowerCase().replace(' ', '-')}">${apt.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      <p>Clínica Altamente - Sistema de Gestão de Saúde</p>
    </div>
  </div>
</body>
</html>
`
}

export interface ConsolidatedReportData {
  period: {
    start: string
    end: string
  }
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  noShowRate: number
  professionals: Array<{
    name: string
    total: number
    completed: number
    noShow: number
  }>
}

export function getConsolidatedReportTemplate(data: ConsolidatedReportData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 900px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { color: #2563eb; margin: 0; }
    .header h2 { color: #333; margin: 10px 0 0; font-size: 18px; }
    .period { text-align: center; background-color: #eff6ff; padding: 10px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; }
    .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 30px; }
    .summary-item { text-align: center; padding: 20px 10px; background-color: #f3f4f6; border-radius: 8px; }
    .summary-item h3 { font-size: 28px; margin: 0; }
    .summary-item p { margin: 5px 0 0; font-size: 12px; color: #6b7280; }
    .summary-item.blue { background-color: #eff6ff; }
    .summary-item.blue h3 { color: #2563eb; }
    .summary-item.green { background-color: #dcfce7; }
    .summary-item.green h3 { color: #16a34a; }
    .summary-item.red { background-color: #fee2e2; }
    .summary-item.red h3 { color: #dc2626; }
    .summary-item.orange { background-color: #fef3c7; }
    .summary-item.orange h3 { color: #d97706; }
    .summary-item.purple { background-color: #f3e8ff; }
    .summary-item.purple h3 { color: #9333ea; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background-color: #2563eb; color: white; padding: 12px; text-align: left; }
    td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Clínica Altamente</h1>
      <h2>Relatório Consolidado de Atendimento</h2>
    </div>

    <div class="period">
      Período: ${data.period.start} a ${data.period.end}
    </div>

    <div class="summary">
      <div class="summary-item blue">
        <h3>${data.totalAppointments}</h3>
        <p>Total</p>
      </div>
      <div class="summary-item green">
        <h3>${data.completedAppointments}</h3>
        <p>Realizadas</p>
      </div>
      <div class="summary-item orange">
        <h3>${data.cancelledAppointments}</h3>
        <p>Canceladas</p>
      </div>
      <div class="summary-item red">
        <h3>${data.noShowAppointments}</h3>
        <p>Faltosos</p>
      </div>
      <div class="summary-item purple">
        <h3>${data.noShowRate}%</h3>
        <p>Taxa Falta</p>
      </div>
    </div>

    <h3 style="margin-top: 30px;">Atendimentos por Profissional</h3>
    <table>
      <thead>
        <tr>
          <th>Profissional</th>
          <th>Total</th>
          <th>Realizadas</th>
          <th>Faltosos</th>
          <th>% Realização</th>
        </tr>
      </thead>
      <tbody>
        ${data.professionals.map(prof => {
          const rate = prof.total > 0 ? Math.round((prof.completed / prof.total) * 100) : 0
          return `
            <tr>
              <td>${prof.name}</td>
              <td>${prof.total}</td>
              <td>${prof.completed}</td>
              <td>${prof.noShow}</td>
              <td>${rate}%</td>
            </tr>
          `
        }).join('')}
      </tbody>
    </table>

    <div class="footer">
      <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      <p>Clínica Altamente - Sistema de Gestão de Saúde</p>
    </div>
  </div>
</body>
</html>
`
}
