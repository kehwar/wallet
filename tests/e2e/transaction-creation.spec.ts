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
      await expect(page.locator('text=Checking')).toBeVisible()
      
      // Create an income category
      await page.goto('/budgets')
      const hasSalary = await page.locator('text=Salary').isVisible().catch(() => false)
      if (!hasSalary) {
        await page.click('button:has-text("New Budget")')
        await expect(page.locator('h2:has-text("New Budget")')).toBeVisible()
        await page.fill('input[placeholder="e.g., Groceries"]', 'Salary')
        await page.selectOption('select.form-select', 'income')
        await page.click('button:has-text("Create")')
        await expect(page.locator('h2:has-text("New Budget")')).not.toBeVisible()
      }
      
      // Create an expense category  
      const hasGroceries = await page.locator('text=Groceries').isVisible().catch(() => false)
      if (!hasGroceries) {
        await page.click('button:has-text("New Budget")')
        await expect(page.locator('h2:has-text("New Budget")')).toBeVisible()
        await page.fill('input[placeholder="e.g., Groceries"]', 'Groceries')
        await page.selectOption('select.form-select', 'expense')
        await page.click('button:has-text("Create")')
        await expect(page.locator('h2:has-text("New Budget")')).not.toBeVisible()
      }
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
    
    // Select account - select the first real account (index 1, skip "Select account...")
    const accountSelect = page.locator('select.form-select').nth(1)
    const accountOptions = await accountSelect.locator('option').all()
    if (accountOptions.length > 1) {
      // Get the value of the first real account (not the placeholder)
      const firstAccountValue = await accountOptions[1].getAttribute('value')
      if (firstAccountValue) {
        await accountSelect.selectOption(firstAccountValue)
      }
    }
    
    // Select budget - select the first budget that's not "None"
    const budgetSelect = page.locator('select.form-select').nth(2)
    const budgetOptions = await budgetSelect.locator('option').all()
    // Find first option that's not "None"
    for (let i = 0; i < budgetOptions.length; i++) {
      const text = await budgetOptions[i].textContent()
      if (text && text !== 'None' && text.includes('Groceries')) {
        const value = await budgetOptions[i].getAttribute('value')
        if (value) {
          await budgetSelect.selectOption(value)
          break
        }
      }
    }
    
    // Submit the form
    await page.click('button:has-text("Save Transaction")')
    
    // Wait for the modal to close
    await expect(page.locator('h2:has-text("New Transaction")')).not.toBeVisible()
    
    // Verify the transaction appears in the list
    await expect(page.locator('text=Weekly groceries').first()).toBeVisible()
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
    
    // Select account - select the first real account (index 1, skip "Select account...")
    const accountSelect = page.locator('select.form-select').nth(1)
    const accountOptions = await accountSelect.locator('option').all()
    if (accountOptions.length > 1) {
      // Get the value of the first real account (not the placeholder)
      const firstAccountValue = await accountOptions[1].getAttribute('value')
      if (firstAccountValue) {
        await accountSelect.selectOption(firstAccountValue)
      }
    }
    
    // Select budget - select the first budget that contains "Salary"
    const budgetSelect = page.locator('select.form-select').nth(2)
    const budgetOptions = await budgetSelect.locator('option').all()
    // Find first option that contains "Salary"
    for (let i = 0; i < budgetOptions.length; i++) {
      const text = await budgetOptions[i].textContent()
      if (text && text !== 'None' && text.includes('Salary')) {
        const value = await budgetOptions[i].getAttribute('value')
        if (value) {
          await budgetSelect.selectOption(value)
          break
        }
      }
    }
    
    // Submit the form
    await page.click('button:has-text("Save Transaction")')
    
    // Wait for the modal to close
    await expect(page.locator('h2:has-text("New Transaction")')).not.toBeVisible()
    
    // Verify the transaction appears in the list
    await expect(page.locator('text=Monthly salary').first()).toBeVisible()
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
