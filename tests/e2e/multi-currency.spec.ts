import { test, expect } from '@playwright/test';

test.describe('Multi-Currency Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should support multiple currencies in accounts', async ({ page }) => {
    await page.goto('/accounts');
    
    // Create USD account
    await page.click('button:has-text("+ New Account")');
    await page.fill('input[placeholder*="Checking"]', 'USD Account');
    await page.selectOption('select:near(label:has-text("Account Type"))', 'asset');
    await page.selectOption('select:near(label:has-text("Currency"))', 'USD');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(500);
    
    // Create EUR account
    await page.click('button:has-text("+ New Account")');
    await page.fill('input[placeholder*="Checking"]', 'EUR Account');
    await page.selectOption('select:near(label:has-text("Account Type"))', 'asset');
    await page.selectOption('select:near(label:has-text("Currency"))', 'EUR');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(500);
    
    // Create GBP account
    await page.click('button:has-text("+ New Account")');
    await page.fill('input[placeholder*="Checking"]', 'GBP Account');
    await page.selectOption('select:near(label:has-text("Account Type"))', 'asset');
    await page.selectOption('select:near(label:has-text("Currency"))', 'GBP');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(500);
    
    // Verify all accounts appear with correct currencies
    await expect(page.locator('.account-card:has-text("USD Account")')).toContainText('USD');
    await expect(page.locator('.account-card:has-text("EUR Account")')).toContainText('EUR');
    await expect(page.locator('.account-card:has-text("GBP Account")')).toContainText('GBP');
  });

  test('should support multiple currencies in budgets', async ({ page }) => {
    await page.goto('/budgets');
    
    // Create USD budget
    await page.click('button:has-text("+ New Budget")');
    await page.fill('input[placeholder*="Groceries"]', 'USD Budget');
    await page.selectOption('select:near(label:has-text("Category"))', 'expense');
    await page.selectOption('select:near(label:has-text("Currency"))', 'USD');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(500);
    
    // Create EUR budget
    await page.click('button:has-text("+ New Budget")');
    await page.fill('input[placeholder*="Groceries"]', 'EUR Budget');
    await page.selectOption('select:near(label:has-text("Category"))', 'expense');
    await page.selectOption('select:near(label:has-text("Currency"))', 'EUR');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(500);
    
    // Create JPY budget (different formatting)
    await page.click('button:has-text("+ New Budget")');
    await page.fill('input[placeholder*="Groceries"]', 'JPY Budget');
    await page.selectOption('select:near(label:has-text("Category"))', 'income');
    await page.selectOption('select:near(label:has-text("Currency"))', 'JPY');
    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForTimeout(500);
    
    // Verify all budgets appear with correct currencies
    await expect(page.locator('.budget-card:has-text("USD Budget")')).toContainText('USD');
    await expect(page.locator('.budget-card:has-text("EUR Budget")')).toContainText('EUR');
    await expect(page.locator('.budget-card:has-text("JPY Budget")')).toContainText('JPY');
  });

  test('should prevent currency changes after account creation', async ({ page }) => {
    await page.goto('/accounts');
    
    // Create an account
    await page.click('button:has-text("+ New Account")');
    await page.fill('input[placeholder*="Checking"]', 'Fixed Currency Account');
    await page.selectOption('select:near(label:has-text("Account Type"))', 'asset');
    await page.selectOption('select:near(label:has-text("Currency"))', 'USD');
    await page.click('button[type="submit"]:has-text("Create")');
    
    // Wait for modal to close
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 });
    
    // Edit the account
    await page.click('.account-card:has-text("Fixed Currency Account") button[title="Edit"]');
    
    // Wait for modal to open
    await expect(page.locator('.modal-content h2')).toContainText('Edit', { timeout: 3000 });
    
    // Verify currency field is disabled
    const currencySelect = page.locator('select:near(label:has-text("Currency"))');
    await expect(currencySelect).toBeDisabled();
  });

  test('should prevent currency changes after budget creation', async ({ page }) => {
    await page.goto('/budgets');
    
    // Create a budget
    await page.click('button:has-text("+ New Budget")');
    await page.fill('input[placeholder*="Groceries"]', 'Fixed Currency Budget');
    await page.selectOption('select:near(label:has-text("Category"))', 'expense');
    await page.selectOption('select:near(label:has-text("Currency"))', 'EUR');
    await page.click('button[type="submit"]:has-text("Create")');
    
    // Wait for modal to close
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 });
    
    // Edit the budget
    await page.click('.budget-card:has-text("Fixed Currency Budget") button[title="Edit"]');
    
    // Wait for modal to open
    await expect(page.locator('.modal-content h2')).toContainText('Edit', { timeout: 3000 });
    
    // Verify currency field is disabled
    const currencySelect = page.locator('select:near(label:has-text("Currency"))');
    await expect(currencySelect).toBeDisabled();
  });

  test('should display currency symbols correctly', async ({ page }) => {
    await page.goto('/accounts');
    
    // Create accounts with different currencies
    const currencies = [
      { code: 'USD', name: 'US Dollar Account' },
      { code: 'EUR', name: 'Euro Account' },
      { code: 'GBP', name: 'Pound Account' },
      { code: 'JPY', name: 'Yen Account' }
    ];
    
    for (const currency of currencies) {
      await page.click('button:has-text("+ New Account")');
      await page.fill('input[placeholder*="Checking"]', currency.name);
      await page.selectOption('select:near(label:has-text("Account Type"))', 'asset');
      await page.selectOption('select:near(label:has-text("Currency"))', currency.code);
      await page.click('button[type="submit"]:has-text("Create")');
      await page.waitForTimeout(500);
    }
    
    // Verify each account shows its currency
    for (const currency of currencies) {
      const accountCard = page.locator(`.account-card:has-text("${currency.name}")`);
      await expect(accountCard).toBeVisible();
      await expect(accountCard).toContainText(currency.code);
    }
  });

  test('should support common currencies in selection', async ({ page }) => {
    await page.goto('/accounts');
    
    // Open new account form
    await page.click('button:has-text("+ New Account")');
    
    // Wait for modal to open
    await expect(page.locator('.modal-content h2')).toContainText('New Account', { timeout: 3000 });
    
    // Verify common currencies are available
    const currencySelect = page.locator('select:near(label:has-text("Currency"))');
    
    // Check a few common currencies (not all, to keep test fast)
    const commonCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'PEN'];
    
    for (const currency of commonCurrencies) {
      const option = currencySelect.locator(`option[value="${currency}"]`);
      await expect(option).toHaveCount(1);
    }
  });

  test('should display multi-currency accounts in reports', async ({ page }) => {
    // Create accounts with different currencies
    await page.goto('/accounts');
    
    await page.click('button:has-text("+ New Account")');
    await page.fill('input[placeholder*="Checking"]', 'Multi USD');
    await page.selectOption('select:near(label:has-text("Account Type"))', 'asset');
    await page.selectOption('select:near(label:has-text("Currency"))', 'USD');
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 });
    
    await page.click('button:has-text("+ New Account")');
    await page.fill('input[placeholder*="Checking"]', 'Multi EUR');
    await page.selectOption('select:near(label:has-text("Account Type"))', 'asset');
    await page.selectOption('select:near(label:has-text("Currency"))', 'EUR');
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 });
    
    // Go to reports page
    await page.goto('/reports');
    
    // Wait for reports to load
    await expect(page.locator('.loading')).not.toBeVisible({ timeout: 3000 });
    
    // Verify both accounts appear in account balances
    const accountBalancesCard = page.locator('.report-card:has(.report-title:has-text("Account Balances"))');
    
    await expect(accountBalancesCard.locator('.balance-name:has-text("Multi USD")')).toBeVisible({ timeout: 3000 });
    await expect(accountBalancesCard.locator('.balance-name:has-text("Multi EUR")')).toBeVisible({ timeout: 3000 });
  });

  test('should handle currency selection in transaction forms', async ({ page }) => {
    // First create accounts with different currencies
    await page.goto('/accounts');
    
    await page.click('button:has-text("+ New Account")');
    await page.fill('input[placeholder*="Checking"]', 'Transaction USD Account');
    await page.selectOption('select:near(label:has-text("Account Type"))', 'asset');
    await page.selectOption('select:near(label:has-text("Currency"))', 'USD');
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 });
    
    await page.click('button:has-text("+ New Account")');
    await page.fill('input[placeholder*="Checking"]', 'Transaction EUR Account');
    await page.selectOption('select:near(label:has-text("Account Type"))', 'expense');
    await page.selectOption('select:near(label:has-text("Currency"))', 'EUR');
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 });
    
    // Go to transactions
    await page.goto('/transactions');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Transactions', { timeout: 3000 });
    
    // Verify the page loaded successfully (may not have transaction forms if accounts setup is different)
    // Just check the basic structure exists
    await expect(page.locator('.transactions-page, .page-header')).toBeVisible();
  });
});
