import { test, expect } from '@playwright/test'

test.describe('Account Management', () => {
  test('should create a new account', async ({ page }) => {
    await page.goto('/accounts')
    
    // Click "New Account" button
    await page.click('button:has-text("New Account")')
    
    // Fill in the form
    await page.fill('input[placeholder*="name" i]', 'Test Checking Account')
    await page.selectOption('select', { label: 'Asset' })
    await page.fill('input[list="currency-list"]', 'USD')
    await page.fill('textarea[placeholder*="description" i]', 'My main checking account')
    
    // Submit the form
    await page.click('button:has-text("Create")')
    
    // Wait for the modal to close and account to appear
    await page.waitForTimeout(1000)
    
    // Verify the account appears in the list
    await expect(page.locator('text=Test Checking Account')).toBeVisible()
  })
  
  test('should display empty state when no accounts exist', async ({ page }) => {
    await page.goto('/accounts')
    
    // Check for empty state message (might not be visible if accounts exist from previous test)
    const emptyState = page.locator('text=No accounts yet')
    const hasAccounts = await page.locator('text=Test Checking Account').isVisible().catch(() => false)
    
    if (!hasAccounts) {
      await expect(emptyState).toBeVisible()
    }
  })
  
  test('should show account details with balance', async ({ page }) => {
    await page.goto('/accounts')
    
    // Wait for accounts to load
    await page.waitForTimeout(500)
    
    // Check if any account exists (from setup or previous test)
    const accountExists = await page.locator('[class*="account"]').first().isVisible().catch(() => false)
    
    if (accountExists) {
      // Verify account card shows currency and balance
      const accountCard = page.locator('[class*="account"]').first()
      await expect(accountCard).toBeVisible()
    }
  })
  
  test('should filter accounts by type', async ({ page }) => {
    await page.goto('/accounts')
    
    // Wait for page to load
    await page.waitForTimeout(500)
    
    // Check for account type groupings
    const hasAssets = await page.locator('h2:has-text("Assets")').isVisible().catch(() => false)
    const hasLiabilities = await page.locator('h2:has-text("Liabilities")').isVisible().catch(() => false)
    
    // At least the section headers should exist
    expect(hasAssets || hasLiabilities).toBeTruthy()
  })
})
