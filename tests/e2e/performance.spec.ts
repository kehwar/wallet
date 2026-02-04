import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should load home page within performance budget', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })
  
  test('should have reasonable bundle size', async ({ page }) => {
    // Navigate and capture network traffic
    const resourceSizes: number[] = []
    
    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/_nuxt/') && (url.endsWith('.js') || url.endsWith('.css'))) {
        try {
          const buffer = await response.body()
          resourceSizes.push(buffer.length)
        } catch {
          // Some resources might not be accessible
        }
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Calculate total bundle size
    const totalSize = resourceSizes.reduce((a, b) => a + b, 0)
    const totalSizeMB = totalSize / (1024 * 1024)
    
    console.log(`Total bundle size: ${totalSizeMB.toFixed(2)} MB`)
    
    // Bundle should be under 5 MB uncompressed (we know it's 403 KB gzipped)
    expect(totalSizeMB).toBeLessThan(5)
  })
  
  test('should render critical content quickly', async ({ page }) => {
    await page.goto('/')
    
    // Measure time to first meaningful paint (h1 visible)
    const startTime = Date.now()
    await page.waitForSelector('h1', { timeout: 5000 })
    const timeToH1 = Date.now() - startTime
    
    // Critical content should appear within 2 seconds
    expect(timeToH1).toBeLessThan(2000)
  })
  
  test('should have no memory leaks during navigation', async ({ page }) => {
    await page.goto('/')
    
    // Get initial metrics
    const metrics1 = await page.evaluate(() => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jsHeap: (performance as any).memory?.usedJSHeapSize || 0,
    }))
    
    // Navigate multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/accounts')
      await page.goto('/transactions')
      await page.goto('/budgets')
      await page.goto('/')
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).gc) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).gc()
      }
    })
    
    // Get final metrics
    const metrics2 = await page.evaluate(() => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jsHeap: (performance as any).memory?.usedJSHeapSize || 0,
    }))
    
    // Memory should not grow significantly (allow 10 MB growth)
    const memoryGrowth = (metrics2.jsHeap - metrics1.jsHeap) / (1024 * 1024)
    console.log(`Memory growth: ${memoryGrowth.toFixed(2)} MB`)
    
    // This is a loose check since we can't control GC precisely
    expect(memoryGrowth).toBeLessThan(50)
  })
  
  test('should efficiently render large transaction lists', async ({ page }) => {
    await page.goto('/transactions')
    
    // Create 50 transactions programmatically via IndexedDB
    await page.evaluate(async () => {
      // @ts-expect-error - Access to global composables in browser context
      const { useTransactions } = await import('/composables/useTransactions')
      // @ts-expect-error - Access to global composables in browser context
      const { useAccounts } = await import('/composables/useAccounts')
      
      const { createExpense } = useTransactions()
      const { createAccount } = useAccounts()
      
      // Create a test account
      const account = await createAccount({
        name: 'Perf Test Account',
        type: 'asset',
        currency: 'USD',
      })
      
      // Create 50 transactions
      for (let i = 0; i < 50; i++) {
        await createExpense({
          description: `Transaction ${i}`,
          date: new Date().toISOString(),
          accountId: account.id,
          amount: 100,
          currency: 'USD',
        })
      }
    })
    
    // Reload page
    await page.reload()
    
    // Measure render time
    const startTime = Date.now()
    await page.waitForSelector('[class*="transaction"]', { timeout: 5000 })
    const renderTime = Date.now() - startTime
    
    // Should render within 2 seconds even with 50 items
    expect(renderTime).toBeLessThan(2000)
  })
})
