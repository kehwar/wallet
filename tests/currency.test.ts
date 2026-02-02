/**
 * Tests for Currency Utilities
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getCurrencySymbol,
  formatCurrency,
  formatCurrencyWithSymbol,
  parseCurrencyInput,
  convertAmount,
  freezeExchangeRates,
  getAllCurrencies,
  getDisplayAmount,
  getAccountAmount,
  getBudgetAmount
} from '~/composables/useCurrency'
import { setExchangeRate } from '~/composables/useExchangeRates'
import { useDatabase } from '~/composables/useDatabase'
import type { LedgerEntry } from '~/types/models'

describe('Currency Utilities', () => {
  beforeEach(async () => {
    const db = useDatabase()
    await db.delete()
    await db.open()
  })

  describe('getCurrencySymbol', () => {
    it('returns correct symbols for common currencies', () => {
      expect(getCurrencySymbol('USD')).toBe('$')
      expect(getCurrencySymbol('EUR')).toBe('€')
      expect(getCurrencySymbol('GBP')).toBe('£')
      expect(getCurrencySymbol('JPY')).toBe('¥')
      expect(getCurrencySymbol('INR')).toBe('₹')
    })

    it('returns currency code for unknown currencies', () => {
      expect(getCurrencySymbol('XXX')).toBe('XXX')
    })
  })

  describe('formatCurrency', () => {
    it('formats currency with Intl.NumberFormat', () => {
      const formatted = formatCurrency(1234.56, 'USD', 'en-US')
      expect(formatted).toContain('1,234.56')
      expect(formatted).toContain('$')
    })

    it('handles negative amounts', () => {
      const formatted = formatCurrency(-100, 'USD', 'en-US')
      expect(formatted).toContain('-')
      expect(formatted).toContain('100')
    })

    it('formats different currencies', () => {
      const usd = formatCurrency(100, 'USD', 'en-US')
      const eur = formatCurrency(100, 'EUR', 'en-US')
      const gbp = formatCurrency(100, 'GBP', 'en-US')

      expect(usd).toContain('$')
      expect(eur).toContain('€')
      expect(gbp).toContain('£')
    })
  })

  describe('formatCurrencyWithSymbol', () => {
    it('formats with custom symbol', () => {
      expect(formatCurrencyWithSymbol(100, 'USD')).toBe('$100.00')
      expect(formatCurrencyWithSymbol(50.5, 'EUR')).toBe('€50.50')
    })

    it('handles negative amounts correctly', () => {
      expect(formatCurrencyWithSymbol(-100, 'USD')).toBe('-$100.00')
    })

    it('respects decimal places', () => {
      expect(formatCurrencyWithSymbol(100, 'USD', 0)).toBe('$100')
      expect(formatCurrencyWithSymbol(100.123, 'USD', 3)).toBe('$100.123')
    })
  })

  describe('parseCurrencyInput', () => {
    it('parses simple numbers', () => {
      expect(parseCurrencyInput('100')?.toNumber()).toBe(100)
      expect(parseCurrencyInput('50.50')?.toNumber()).toBe(50.5)
    })

    it('removes currency symbols', () => {
      expect(parseCurrencyInput('$100')?.toNumber()).toBe(100)
      expect(parseCurrencyInput('€50.50')?.toNumber()).toBe(50.5)
      expect(parseCurrencyInput('£25')?.toNumber()).toBe(25)
    })

    it('handles thousand separators', () => {
      expect(parseCurrencyInput('1,000')?.toNumber()).toBe(1000)
      expect(parseCurrencyInput('1,234.56')?.toNumber()).toBe(1234.56)
      expect(parseCurrencyInput('$10,000.00')?.toNumber()).toBe(10000)
    })

    it('returns null for invalid input', () => {
      expect(parseCurrencyInput('')).toBeNull()
      expect(parseCurrencyInput('abc')).toBeNull()
      expect(parseCurrencyInput('12.34.56')).toBeNull()
    })

    it('handles negative amounts', () => {
      expect(parseCurrencyInput('-100')?.toNumber()).toBe(-100)
      expect(parseCurrencyInput('-$50.50')?.toNumber()).toBe(-50.5)
    })
  })

  describe('convertAmount', () => {
    it('returns same amount for same currency', async () => {
      const result = await convertAmount(100, 'USD', 'USD', '2026-02-01')
      expect(result).toBe(100)
    })

    it('converts between currencies using exchange rate', async () => {
      await setExchangeRate('USD', 'EUR', 0.85, '2026-02-01', 'manual')

      const result = await convertAmount(100, 'USD', 'EUR', '2026-02-01')
      expect(result).toBe(85)
    })

    it('returns null if exchange rate not found', async () => {
      const result = await convertAmount(100, 'USD', 'XXX', '2026-02-01')
      expect(result).toBeNull()
    })

    it('uses precise decimal calculation', async () => {
      await setExchangeRate('USD', 'EUR', 0.851234, '2026-02-01', 'manual')

      const result = await convertAmount(100, 'USD', 'EUR', '2026-02-01')
      expect(result).toBeCloseTo(85.1234, 4)
    })
  })

  describe('freezeExchangeRates', () => {
    it('returns 1 for same currencies', async () => {
      const rates = await freezeExchangeRates('USD', 'USD', null, '2026-02-01')
      
      expect(rates.rate_display_to_account).toBe(1)
      expect(rates.rate_display_to_budget).toBeNull()
    })

    it('captures rates for different currencies', async () => {
      await setExchangeRate('USD', 'EUR', 0.85, '2026-02-01', 'manual')
      await setExchangeRate('USD', 'GBP', 0.75, '2026-02-01', 'manual')

      const rates = await freezeExchangeRates('USD', 'EUR', 'GBP', '2026-02-01')
      
      expect(rates.rate_display_to_account).toBe(0.85)
      expect(rates.rate_display_to_budget).toBe(0.75)
    })

    it('handles budget currency same as display', async () => {
      await setExchangeRate('USD', 'EUR', 0.85, '2026-02-01', 'manual')

      const rates = await freezeExchangeRates('USD', 'EUR', 'USD', '2026-02-01')
      
      expect(rates.rate_display_to_account).toBe(0.85)
      expect(rates.rate_display_to_budget).toBe(1)
    })

    it('throws error if rate not found', async () => {
      await expect(
        freezeExchangeRates('USD', 'XXX', null, '2026-02-01')
      ).rejects.toThrow()
    })
  })

  describe('ledger entry amount getters', () => {
    it('extracts display amount', () => {
      const entry: Partial<LedgerEntry> = {
        amount_display: 100
      }
      
      expect(getDisplayAmount(entry as LedgerEntry)).toBe(100)
    })

    it('extracts account amount', () => {
      const entry: Partial<LedgerEntry> = {
        amount_account: 85
      }
      
      expect(getAccountAmount(entry as LedgerEntry)).toBe(85)
    })

    it('extracts budget amount', () => {
      const entry: Partial<LedgerEntry> = {
        amount_budget: 75
      }
      
      expect(getBudgetAmount(entry as LedgerEntry)).toBe(75)
    })

    it('handles null budget amount', () => {
      const entry: Partial<LedgerEntry> = {
        amount_budget: null
      }
      
      expect(getBudgetAmount(entry as LedgerEntry)).toBeNull()
    })
  })

  describe('getAllCurrencies', () => {
    it('returns list of common currencies', () => {
      const currencies = getAllCurrencies()
      
      expect(currencies).toBeInstanceOf(Array)
      expect(currencies.length).toBeGreaterThan(0)
      
      // Check structure of first currency
      expect(currencies[0]).toHaveProperty('code')
      expect(currencies[0]).toHaveProperty('name')
      expect(currencies[0]).toHaveProperty('symbol')
      
      // Check for common currencies
      const codes = currencies.map(c => c.code)
      expect(codes).toContain('USD')
      expect(codes).toContain('EUR')
      expect(codes).toContain('GBP')
    })
  })
})
