import { test, expect } from '@playwright/test'

test.describe('Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@clinica.com')
    await page.getByLabel(/senha/i).fill('admin123')
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.goto('/reports')
  })

  test('should display reports page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /relatórios/i })).toBeVisible()
  })

  test('should display report type selection', async ({ page }) => {
    await expect(page.getByText(/tipo de relatório/i)).toBeVisible()
    await expect(page.getByText(/consolidado/i)).toBeVisible()
    await expect(page.getByText(/individual/i)).toBeVisible()
  })

  test('should display date range inputs', async ({ page }) => {
    await expect(page.getByText(/data início/i)).toBeVisible()
    await expect(page.getByText(/data fim/i)).toBeVisible()
  })

  test('should show patient selector when individual report is selected', async ({ page }) => {
    await page.locator('input[type="radio"][value="individual"]').check()
    await expect(page.getByText(/selecione o paciente/i)).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('should hide patient selector when consolidated report is selected', async ({ page }) => {
    await page.locator('input[type="radio"][value="consolidated"]').check()
    await expect(page.getByText(/selecione o paciente/i)).not.toBeVisible()
  })

  test('should show generate button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /gerar relatório/i })).toBeVisible()
  })

  test('should show validation error when generating individual report without patient', async ({ page }) => {
    await page.locator('input[type="radio"][value="individual"]').check()
    await page.getByRole('button', { name: /gerar relatório/i }).click()
    await expect(page.getByText(/selecione um paciente/i)).toBeVisible()
  })

  test('should display report descriptions', async ({ page }) => {
    await expect(page.getByText(/relatório consolidado/i)).toBeVisible()
    await expect(page.getByText(/relatório individual/i)).toBeVisible()
  })

  test('should allow changing date range', async ({ page }) => {
    const startDateInput = page.getByLabel(/data início/i)
    const endDateInput = page.getByLabel(/data fim/i)

    await startDateInput.fill('2025-01-01')
    await endDateInput.fill('2025-01-31')

    await expect(startDateInput).toHaveValue('2025-01-01')
    await expect(endDateInput).toHaveValue('2025-01-31')
  })
})
