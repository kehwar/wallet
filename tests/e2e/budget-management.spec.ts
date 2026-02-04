import { test, expect } from '@playwright/test';

test.describe('Budget Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to budgets page
    await page.goto('/budgets');
  });

  test('should display the budgets page', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1')).toContainText('Budgets');
    
    // Verify new budget button exists
    await expect(page.locator('button', { hasText: '+ New Budget' })).toBeVisible();
  });

  test('should create a new budget', async ({ page }) => {
    // Click new budget button
    await page.click('button:has-text("+ New Budget")');
    
    // Verify modal appears
    await expect(page.locator('.modal-content h2')).toContainText('New Budget');
    
    // Fill in the form
    await page.fill('input[placeholder*="Groceries"]', 'Monthly Groceries');
    await page.selectOption('select:near(label:has-text("Category"))', 'expense');
    await page.selectOption('select:near(label:has-text("Currency"))', 'USD');
    await page.fill('textarea[placeholder*="Budget details"]', 'Budget for monthly grocery shopping');
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Create")');
    
    // Wait for modal to close
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 });
    
    // Verify budget appears in the list
    await expect(page.locator('.budget-card')).toContainText('Monthly Groceries');
    await expect(page.locator('.budget-card')).toContainText('Budget for monthly grocery shopping');
    await expect(page.locator('.budget-card')).toContainText('USD');
  });

  test('should edit an existing budget', async ({ page }) => {
    // First create a budget
    await page.click('button:has-text("+ New Budget")');
    await page.fill('input[placeholder*="Groceries"]', 'Test Budget');
    await page.selectOption('select:near(label:has-text("Category"))', 'expense');
    await page.selectOption('select:near(label:has-text("Currency"))', 'USD');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(500);
    
    // Click edit button on the budget
    await page.click('.budget-card:has-text("Test Budget") button[title="Edit"]');
    
    // Verify edit modal appears
    await expect(page.locator('.modal-content h2')).toContainText('Edit Budget');
    
    // Update the name
    await page.fill('input[placeholder*="Groceries"]', 'Updated Test Budget');
    await page.fill('textarea[placeholder*="Budget details"]', 'Updated description');
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Update")');
    
    // Wait for modal to close
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 });
    
    // Verify updated budget appears
    await expect(page.locator('.budget-card')).toContainText('Updated Test Budget');
    await expect(page.locator('.budget-card')).toContainText('Updated description');
  });

  test('should delete a budget', async ({ page }) => {
    // First create a budget
    await page.click('button:has-text("+ New Budget")');
    await page.fill('input[placeholder*="Groceries"]', 'Budget to Delete');
    await page.selectOption('select:near(label:has-text("Category"))', 'expense');
    await page.selectOption('select:near(label:has-text("Currency"))', 'USD');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(500);
    
    // Verify budget exists
    await expect(page.locator('.budget-card')).toContainText('Budget to Delete');
    
    // Set up dialog handler before clicking delete
    page.on('dialog', dialog => dialog.accept());
    
    // Click delete button
    await page.click('.budget-card:has-text("Budget to Delete") button[title="Delete"]');
    
    // Wait a moment for deletion to process
    await page.waitForTimeout(500);
    
    // Verify budget is removed
    const budgetCards = page.locator('.budget-card:has-text("Budget to Delete")');
    await expect(budgetCards).toHaveCount(0);
  });

  test('should cancel budget creation', async ({ page }) => {
    // Click new budget button
    await page.click('button:has-text("+ New Budget")');
    
    // Verify modal appears
    await expect(page.locator('.modal-content h2')).toContainText('New Budget');
    
    // Fill in some data
    await page.fill('input[placeholder*="Groceries"]', 'Cancel Test');
    
    // Click cancel button
    await page.click('button:has-text("Cancel")');
    
    // Verify modal closes
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
    
    // Verify budget was not created
    await expect(page.locator('.budget-card:has-text("Cancel Test")')).toHaveCount(0);
  });

  test('should show budgets grouped by category', async ({ page }) => {
    // Create an expense budget
    await page.click('button:has-text("+ New Budget")');
    await page.fill('input[placeholder*="Groceries"]', 'Expense Budget');
    await page.selectOption('select:near(label:has-text("Category"))', 'expense');
    await page.selectOption('select:near(label:has-text("Currency"))', 'USD');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(500);
    
    // Create an income budget
    await page.click('button:has-text("+ New Budget")');
    await page.fill('input[placeholder*="Groceries"]', 'Income Budget');
    await page.selectOption('select:near(label:has-text("Category"))', 'income');
    await page.selectOption('select:near(label:has-text("Currency"))', 'USD');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(500);
    
    // Verify both category groups exist
    await expect(page.locator('.group-title:has-text("Expense")')).toBeVisible();
    await expect(page.locator('.group-title:has-text("Income")')).toBeVisible();
    
    // Verify budgets appear in correct groups
    const expenseGroup = page.locator('.budget-group:has(.group-title:has-text("Expense"))');
    await expect(expenseGroup.locator('.budget-card')).toContainText('Expense Budget');
    
    const incomeGroup = page.locator('.budget-group:has(.group-title:has-text("Income"))');
    await expect(incomeGroup.locator('.budget-card')).toContainText('Income Budget');
  });
});
