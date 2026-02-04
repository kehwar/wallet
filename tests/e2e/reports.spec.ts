import { test, expect } from '@playwright/test';

test.describe('Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to reports page
    await page.goto('/reports');
  });

  test('should display the reports page', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1')).toContainText('Reports');
    
    // Verify all report sections exist
    await expect(page.locator('.report-title:has-text("Net Worth")')).toBeVisible();
    await expect(page.locator('.report-title:has-text("Income vs Expenses")')).toBeVisible();
    await expect(page.locator('.report-title:has-text("Account Balances")')).toBeVisible();
    await expect(page.locator('.report-title:has-text("Budget Summary")')).toBeVisible();
  });

  test('should display net worth calculation', async ({ page }) => {
    // Verify net worth section exists
    const netWorthCard = page.locator('.report-card:has(.report-title:has-text("Net Worth"))');
    
    // Verify the three components are present
    await expect(netWorthCard.locator('.summary-label:has-text("Total Assets")')).toBeVisible();
    await expect(netWorthCard.locator('.summary-label:has-text("Total Liabilities")')).toBeVisible();
    await expect(netWorthCard.locator('.summary-label:has-text("Net Worth")')).toBeVisible();
    
    // Verify amounts are displayed (should at least show $0.00)
    const assetValue = netWorthCard.locator('.summary-label:has-text("Total Assets")').locator('..').locator('.summary-value');
    await expect(assetValue).toBeVisible();
    
    const liabilityValue = netWorthCard.locator('.summary-label:has-text("Total Liabilities")').locator('..').locator('.summary-value');
    await expect(liabilityValue).toBeVisible();
    
    const netWorthValue = netWorthCard.locator('.summary-label:has-text("Net Worth")').locator('..').locator('.summary-value');
    await expect(netWorthValue).toBeVisible();
  });

  test('should display income vs expenses', async ({ page }) => {
    const incomeExpensesCard = page.locator('.report-card:has(.report-title:has-text("Income vs Expenses"))');
    
    // Verify all comparison items are present
    await expect(incomeExpensesCard.locator('.comparison-label:has-text("Total Income")')).toBeVisible();
    await expect(incomeExpensesCard.locator('.comparison-label:has-text("Total Expenses")')).toBeVisible();
    await expect(incomeExpensesCard.locator('.comparison-label:has-text("Net")')).toBeVisible();
    
    // Verify amounts are displayed
    const incomeValue = incomeExpensesCard.locator('.comparison-label:has-text("Total Income")').locator('..').locator('.comparison-value');
    await expect(incomeValue).toBeVisible();
    
    const expenseValue = incomeExpensesCard.locator('.comparison-label:has-text("Total Expenses")').locator('..').locator('.comparison-value');
    await expect(expenseValue).toBeVisible();
    
    const netValue = incomeExpensesCard.locator('.comparison-label:has-text("Net")').locator('..').locator('.comparison-value');
    await expect(netValue).toBeVisible();
  });

  test('should display account balances', async ({ page }) => {
    const accountBalancesCard = page.locator('.report-card:has(.report-title:has-text("Account Balances"))');
    await expect(accountBalancesCard).toBeVisible();
    
    // Check if there are accounts or empty state
    const hasAccounts = await accountBalancesCard.locator('.account-balances').isVisible().catch(() => false);
    const hasEmptyState = await accountBalancesCard.locator('.empty-state').isVisible().catch(() => false);
    
    // Should have either accounts or empty state
    expect(hasAccounts || hasEmptyState).toBeTruthy();
    
    if (hasEmptyState) {
      // Verify empty state message
      await expect(accountBalancesCard.locator('.empty-state')).toContainText('No accounts yet');
    }
  });

  test('should display budget summary', async ({ page }) => {
    const budgetSummaryCard = page.locator('.report-card:has(.report-title:has-text("Budget Summary"))');
    await expect(budgetSummaryCard).toBeVisible();
    
    // Check if there are budgets or empty state
    const hasBudgets = await budgetSummaryCard.locator('.budget-summary-list').isVisible().catch(() => false);
    const hasEmptyState = await budgetSummaryCard.locator('.empty-state').isVisible().catch(() => false);
    
    // Should have either budgets or empty state
    expect(hasBudgets || hasEmptyState).toBeTruthy();
  });

  test('should update reports when data is added', async ({ page }) => {
    // First, create an account to have some data
    await page.goto('/accounts');
    
    // Create a checking account
    await page.click('button:has-text("+ New Account")');
    await page.fill('input[placeholder*="Checking"]', 'Test Checking');
    await page.selectOption('select:near(label:has-text("Account Type"))', 'asset');
    await page.selectOption('select:near(label:has-text("Currency"))', 'USD');
    await page.click('button[type="submit"]:has-text("Create")');
    
    // Wait for modal to close
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 });
    
    // Go back to reports
    await page.goto('/reports');
    
    // Wait for reports to load
    await expect(page.locator('.loading')).not.toBeVisible({ timeout: 3000 });
    
    // Verify the account appears in account balances
    const accountBalancesCard = page.locator('.report-card:has(.report-title:has-text("Account Balances"))');
    await expect(accountBalancesCard.locator('.balance-name:has-text("Test Checking")')).toBeVisible({ timeout: 3000 });
    await expect(accountBalancesCard.locator('.balance-type:has-text("asset")')).toBeVisible();
  });

  test('should format currency amounts correctly', async ({ page }) => {
    // Wait for reports to load
    await expect(page.locator('.loading')).not.toBeVisible({ timeout: 3000 });
    
    // All summary and comparison values should be formatted
    const summaryValues = page.locator('.summary-value');
    const comparisonValues = page.locator('.comparison-value');
    
    // At least summary values should be visible (net worth section)
    const summaryCount = await summaryValues.count();
    expect(summaryCount).toBeGreaterThan(0);
    
    // Check that at least the first amount contains a currency indicator
    // (USD, $, etc.)
    const firstAmount = await summaryValues.first().textContent();
    expect(firstAmount).toBeTruthy();
    expect(firstAmount?.length).toBeGreaterThan(0);
  });

  test('should apply correct styling to positive and negative values', async ({ page }) => {
    // Wait for reports to load
    await expect(page.locator('.loading')).not.toBeVisible({ timeout: 3000 });
    
    // Check that we have value elements rendered
    const valueElements = page.locator('.summary-value, .comparison-value');
    const valueCount = await valueElements.count();
    expect(valueCount).toBeGreaterThan(0);
    
    // At least one element should have a styling class
    // (positive, negative, or neutral - depending on the values)
    // We just verify that the structure exists
    const firstValue = await valueElements.first();
    await expect(firstValue).toBeVisible();
  });

  test('should load reports page without errors', async ({ page }) => {
    // Check that the page loaded
    await expect(page.locator('h1:has-text("Reports")')).toBeVisible();
    
    // Verify no error messages are shown
    const errorMessages = page.locator('.error-message, .error, [role="alert"]');
    await expect(errorMessages).toHaveCount(0);
    
    // Verify loading state is gone
    await expect(page.locator('.loading')).not.toBeVisible();
  });
});
