import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('home page should not have accessibility violations', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('accounts page should not have accessibility violations', async ({ page }) => {
    await page.goto('/accounts')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('transactions page should not have accessibility violations', async ({ page }) => {
    await page.goto('/transactions')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('budgets page should not have accessibility violations', async ({ page }) => {
    await page.goto('/budgets')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('reports page should not have accessibility violations', async ({ page }) => {
    await page.goto('/reports')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('settings page should not have accessibility violations', async ({ page }) => {
    await page.goto('/settings')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
})

test.describe('Keyboard Navigation', () => {
  test('should be able to navigate with keyboard', async ({ page }) => {
    await page.goto('/')
    
    // Press Tab multiple times to ensure we focus on a clickable element
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Check if there's a focused element that's not the body
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      return {
        tag: el.tagName,
        text: el.textContent?.substring(0, 50)
      }
    })
    
    // Verify that something other than body is focused
    expect(focusedElement).not.toBeNull()
    // Also verify it's an interactive element
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement?.tag)
  })
  
  test('should be able to activate buttons with Enter/Space', async ({ page }) => {
    await page.goto('/accounts')
    
    // Focus on "New Account" button
    await page.locator('button:has-text("New Account")').focus()
    
    // Press Enter to activate
    await page.keyboard.press('Enter')
    
    // Modal should open
    await expect(page.locator('h2:has-text("New Account")')).toBeVisible()
    
    // Press Escape to close
    await page.keyboard.press('Escape')
    
    // Modal should close
    await expect(page.locator('h2:has-text("New Account")')).not.toBeVisible()
  })
})
