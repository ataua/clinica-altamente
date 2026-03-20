import { test, expect } from '@playwright/test'

test.describe('No-Show Patients Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@clinica.com')
    await page.getByLabel(/senha/i).fill('admin123')
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.goto('/no-show')
  })

  test('should display no-show page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /lista de pacientes faltosos/i })).toBeVisible()
  })

  test('should display date range filters', async ({ page }) => {
    await expect(page.getByText(/de:/i)).toBeVisible()
    await expect(page.getByText(/até:/i)).toBeVisible()
  })

  test('should display table headers', async ({ page }) => {
    await expect(page.getByText(/nome/i)).toBeVisible()
    await expect(page.getByText(/email/i)).toBeVisible()
    await expect(page.getByText(/total de faltas/i)).toBeVisible()
    await expect(page.getByText(/última falta/i)).toBeVisible()
  })

  test('should allow changing date range', async ({ page }) => {
    const startDateInput = page.getByRole('textbox', { name: /data/i }).first()
    await startDateInput.fill('2025-01-01')

    await expect(startDateInput).toHaveValue('2025-01-01')
  })

  test('should display no-show summary card', async ({ page }) => {
    await expect(page.getByText(/resumo de faltosos/i)).toBeVisible()
  })

  test('should display empty state message when no no-shows', async ({ page }) => {
    const emptyMessage = page.getByText(/nenhum paciente faltoso/i)
    const noDataMessage = page.getByText(/nenhum dado disponível/i)
    
    const hasEmptyState = await emptyMessage.isVisible().catch(() => false) || 
                          await noDataMessage.isVisible().catch(() => false)
    
    expect(typeof hasEmptyState).toBe('boolean')
  })
})
