export interface ReminderTemplateData {
  patientName: string
  appointmentDate: string
  appointmentTime: string
  professionalName: string
  clinicPhone?: string
}

export function getAppointmentReminderTemplate(data: ReminderTemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .appointment-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb; }
    .appointment-info p { margin: 8px 0; }
    .label { font-weight: bold; color: #6b7280; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .cta-button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Lembrete de Consulta</h1>
    </div>
    <div class="content">
      <p>Olá, <strong>${data.patientName}</strong>!</p>
      <p>Este é um lembrete da sua consulta agendada na <strong>Clínica Altamente</strong>.</p>
      
      <div class="appointment-info">
        <p><span class="label">📅 Data:</span> ${data.appointmentDate}</p>
        <p><span class="label">⏰ Horário:</span> ${data.appointmentTime}</p>
        <p><span class="label">👨‍⚕️ Profissional:</span> ${data.professionalName}</p>
      </div>
      
      <p><strong>⚠️ Por favor, confirme sua presença ou desmarque com antecedência caso não possa comparecer.</strong></p>
      
      <p>Caso precise remarcar ou cancelar, entre em contato:</p>
      <p>📞 ${data.clinicPhone || '(11) 9999-9999'}</p>
    </div>
    <div class="footer">
      <p>Clínica Altamente - Sistema de Gestão de Saúde</p>
      <p>Este é um email automático. Por favor, não responda diretamente.</p>
    </div>
  </div>
</body>
</html>
`
}

export function getAppointmentConfirmationTemplate(data: ReminderTemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .appointment-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
    .appointment-info p { margin: 8px 0; }
    .label { font-weight: bold; color: #6b7280; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Consulta Confirmada</h1>
    </div>
    <div class="content">
      <p>Olá, <strong>${data.patientName}</strong>!</p>
      <p>Sua presença foi <strong>confirmada</strong> para a consulta abaixo:</p>
      
      <div class="appointment-info">
        <p><span class="label">📅 Data:</span> ${data.appointmentDate}</p>
        <p><span class="label">⏰ Horário:</span> ${data.appointmentTime}</p>
        <p><span class="label">👨‍⚕️ Profissional:</span> ${data.professionalName}</p>
      </div>
      
      <p>Por favor, chegue com <strong>10 minutos de antecedência</strong>.</p>
      <p>Não se esqueça de trazer documentos e medicamentos em uso.</p>
    </div>
    <div class="footer">
      <p>Clínica Altamente - Sistema de Gestão de Saúde</p>
    </div>
  </div>
</body>
</html>
`
}

export function getAppointmentCancellationTemplate(data: ReminderTemplateData & { reason?: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .appointment-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ef4444; }
    .appointment-info p { margin: 8px 0; }
    .label { font-weight: bold; color: #6b7280; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Consulta Cancelada</h1>
    </div>
    <div class="content">
      <p>Olá, <strong>${data.patientName}</strong>!</p>
      <p>Sua consulta foi <strong>cancelada</strong>:</p>
      
      <div class="appointment-info">
        <p><span class="label">📅 Data:</span> ${data.appointmentDate}</p>
        <p><span class="label">⏰ Horário:</span> ${data.appointmentTime}</p>
        <p><span class="label">👨‍⚕️ Profissional:</span> ${data.professionalName}</p>
        ${data.reason ? `<p><span class="label">📝 Motivo:</span> ${data.reason}</p>` : ''}
      </div>
      
      <p>Caso precise remarcar, entre em contato:</p>
      <p>📞 ${data.clinicPhone || '(11) 9999-9999'}</p>
    </div>
    <div class="footer">
      <p>Clínica Altamente - Sistema de Gestão de Saúde</p>
    </div>
  </div>
</body>
</html>
`
}
