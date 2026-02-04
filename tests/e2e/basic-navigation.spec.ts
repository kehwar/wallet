import { test, expect } from '@playwright/test'

test.describe('Basic Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page title or main heading is visible
    await expect(page.locator('h1')).toContainText('Wallet PWA')
  })
  
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to Accounts page
    await page.goto('/accounts')
    await expect(page).toHaveURL('/accounts')
    await expect(page.locator('h1')).toContainText('Accounts')
    
    // Navigate to Transactions page
    await page.goto('/transactions')
    await expect(page).toHaveURL('/transactions')
    await expect(page.locator('h1')).toContainText('Transactions')
    
    // Navigate to Budgets page
    await page.goto('/budgets')
    await expect(page).toHaveURL('/budgets')
    await expect(page.locator('h1')).toContainText('Budgets')
    
    // Navigate to Reports page
    await page.goto('/reports')
    await expect(page).toHaveURL('/reports')
    await expect(page.locator('h1')).toContainText('Reports')
    
    // Navigate to Settings page
    await page.goto('/settings')
    await expect(page).toHaveURL('/settings')
    await expect(page.locator('h1')).toContainText('Firebase Configuration')
  })
  
  test('should display PWA status', async ({ page }) => {
    await page.goto('/')
    
    // Check that network status is visible (should be online in test)
    await expect(page.locator('text=Online')).toBeVisible()
  })
})
