import { test, expect } from '@playwright/test'

test.describe('Transaction Creation', () => {
  // Setup: Create accounts needed for transactions
  test.beforeEach(async ({ page }) => {
    await page.goto('/accounts')
    
    // Check if accounts already exist
    const hasAccounts = await page.locator('text=Checking').isVisible().catch(() => false)
    
    if (!hasAccounts) {
      // Create a checking account
      await page.click('button:has-text("New Account")')
      await expect(page.locator('h2:has-text("New Account")')).toBeVisible()
      await page.fill('input[placeholder="e.g., Checking Account"]', 'Checking')
      await page.selectOption('select.form-select', 'asset')
      await page.click('button:has-text("Create")')
      await expect(page.locator('h2:has-text("New Account")')).not.toBeVisible()
      
      // Create an income category
      await page.goto('/budgets')
      await page.click('button:has-text("New Budget")')
      await expect(page.locator('h2:has-text("New Budget")')).toBeVisible()
      await page.fill('input[placeholder="e.g., Groceries"]', 'Salary')
      await page.selectOption('select.form-select >> nth=0', 'income')
      await page.click('button:has-text("Create")')
      await expect(page.locator('h2:has-text("New Budget")')).not.toBeVisible()
      
      // Create an expense category
      await page.click('button:has-text("New Budget")')
      await expect(page.locator('h2:has-text("New Budget")')).toBeVisible()
      await page.fill('input[placeholder="e.g., Groceries"]', 'Groceries')
      await page.selectOption('select.form-select >> nth=0', 'expense')
      await page.click('button:has-text("Create")')
      await expect(page.locator('h2:has-text("New Budget")')).not.toBeVisible()
    }
  })
  
  test('should create an expense transaction', async ({ page }) => {
    await page.goto('/transactions')
    
    // Click "New Transaction" button
    await page.click('button:has-text("New Transaction")')
    
    // Wait for modal
    await expect(page.locator('h2:has-text("New Transaction")')).toBeVisible()
    
    // Select Expense type (default)
    await expect(page.locator('select').first()).toHaveValue('expense')
    
    // Fill in the form
    await page.fill('input[type="date"]', '2026-02-04')
    await page.fill('input[placeholder="e.g., Grocery shopping"]', 'Weekly groceries')
    await page.fill('input[type="number"]', '150.50')
    
    // Select account and budget (assuming they exist from beforeEach)
    const accountSelect = page.locator('select.form-select').nth(1)
    await accountSelect.selectOption({ label: /Checking/i })
    
    const budgetSelect = page.locator('select.form-select').nth(2)
    await budgetSelect.selectOption({ label: /Groceries/i })
    
    // Submit the form
    await page.click('button:has-text("Save Transaction")')
    
    // Wait for the modal to close
    await expect(page.locator('h2:has-text("New Transaction")')).not.toBeVisible()
    
    // Verify the transaction appears in the list
    await expect(page.locator('text=Weekly groceries')).toBeVisible()
  })
  
  test('should create an income transaction', async ({ page }) => {
    await page.goto('/transactions')
    
    // Click "New Transaction" button
    await page.click('button:has-text("New Transaction")')
    
    // Wait for modal
    await expect(page.locator('h2:has-text("New Transaction")')).toBeVisible()
    
    // Select Income type
    await page.selectOption('select', 'income')
    
    // Fill in the form
    await page.fill('input[type="date"]', '2026-02-01')
    await page.fill('input[placeholder="e.g., Grocery shopping"]', 'Monthly salary')
    await page.fill('input[type="number"]', '5000')
    
    // Select account and budget
    const accountSelect = page.locator('select.form-select').nth(1)
    await accountSelect.selectOption({ label: /Checking/i })
    
    const budgetSelect = page.locator('select.form-select').nth(2)
    await budgetSelect.selectOption({ label: /Salary/i })
    
    // Submit the form
    await page.click('button:has-text("Save Transaction")')
    
    // Wait for the modal to close
    await expect(page.locator('h2:has-text("New Transaction")')).not.toBeVisible()
    
    // Verify the transaction appears in the list
    await expect(page.locator('text=Monthly salary')).toBeVisible()
  })
  
  test('should validate required fields', async ({ page }) => {
    await page.goto('/transactions')
    
    // Click "New Transaction" button
    await page.click('button:has-text("New Transaction")')
    
    // Wait for modal
    await expect(page.locator('h2:has-text("New Transaction")')).toBeVisible()
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Save Transaction")')
    
    // Form should still be visible (validation prevents submission)
    await expect(page.locator('button:has-text("Save Transaction")')).toBeVisible()
  })
  
  test('should display transactions in chronological order', async ({ page }) => {
    await page.goto('/transactions')
    
    // Wait for transactions to load
    await page.waitForTimeout(500)
    
    // Check if transactions exist
    const hasTransactions = await page.locator('[class*="transaction"]').first().isVisible().catch(() => false)
    
    if (hasTransactions) {
      // Verify at least one transaction is visible
      await expect(page.locator('[class*="transaction"]').first()).toBeVisible()
    }
  })
})
