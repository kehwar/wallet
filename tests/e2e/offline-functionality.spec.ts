import { test, expect } from '@playwright/test'

test.describe('Offline Functionality', () => {
  test('should work offline - view cached pages', async ({ page, context }) => {
    // First, visit pages while online to cache them
    await page.goto('/')
    await page.goto('/accounts')
    await page.goto('/transactions')
    await page.goto('/budgets')
    
    // Go offline
    await context.setOffline(true)
    
    // Navigate to different pages - they should still load from cache
    await page.goto('/accounts')
    await expect(page.locator('h1')).toContainText('Accounts')
    
    await page.goto('/transactions')
    await expect(page.locator('h1')).toContainText('Transactions')
    
    // Check that offline indicator is shown
    await expect(page.locator('text=Offline')).toBeVisible()
  })
  
  test('should detect network status changes', async ({ page, context }) => {
    await page.goto('/')
    
    // Should show online status initially
    await expect(page.locator('text=Online')).toBeVisible()
    
    // Go offline
    await context.setOffline(true)
    await page.waitForTimeout(1000)
    
    // Should show offline status
    await expect(page.locator('text=Offline')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
    await page.waitForTimeout(1000)
    
    // Should show online status again
    await expect(page.locator('text=Online')).toBeVisible()
  })
  
  test('should store data locally (IndexedDB)', async ({ page }) => {
    await page.goto('/accounts')
    
    // Create an account
    await page.click('button:has-text("New Account")')
    await page.fill('input[placeholder*="name" i]', 'Offline Test Account')
    await page.selectOption('select', { label: 'Asset' })
    await page.fill('input[list="currency-list"]', 'USD')
    await page.click('button:has-text("Create")')
    await page.waitForTimeout(1000)
    
    // Verify it's visible
    await expect(page.locator('text=Offline Test Account')).toBeVisible()
    
    // Reload the page (data should persist from IndexedDB)
    await page.reload()
    await page.waitForTimeout(500)
    
    // Account should still be visible
    await expect(page.locator('text=Offline Test Account')).toBeVisible()
  })
})
