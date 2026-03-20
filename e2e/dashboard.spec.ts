import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@clinica.com')
    await page.getByLabel(/senha/i).fill('admin123')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display dashboard header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('should display date range filters', async ({ page }) => {
    await expect(page.getByText(/de:/i)).toBeVisible()
    await expect(page.getByText(/até:/i)).toBeVisible()
    await expect(page.getByRole('textbox', { name: /data/i }).first()).toBeVisible()
  })

  test('should display stats cards', async ({ page }) => {
    await expect(page.getByText(/total de agendamentos/i)).toBeVisible()
    await expect(page.getByText(/consultas realizadas/i)).toBeVisible()
    await expect(page.getByText(/taxa de faltosos/i)).toBeVisible()
    await expect(page.getByText(/agendados\/confirmados/i)).toBeVisible()
  })

  test('should display professional stats section', async ({ page }) => {
    await expect(page.getByText(/atendimentos por profissional/i)).toBeVisible()
  })

  test('should display monthly trend section', async ({ page }) => {
    await expect(page.getByText(/tendência mensal/i)).toBeVisible()
  })

  test('should change date range and reload data', async ({ page }) => {
    const startDateInput = page.getByRole('textbox', { name: /data/i }).first()
    await startDateInput.fill('2025-01-01')

    await expect(startDateInput).toHaveValue('2025-01-01')
  })

  test('should navigate to reports page', async ({ page }) => {
    await page.getByRole('link', { name: /relatórios/i }).click()
    await expect(page).toHaveURL('/reports')
  })

  test('should navigate to no-show page', async ({ page }) => {
    await page.getByRole('link', { name: /faltosos/i }).click()
    await expect(page).toHaveURL('/no-show')
  })
})
