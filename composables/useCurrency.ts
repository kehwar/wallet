/**
 * Currency Utilities
 * Functions for currency formatting, conversion, and display
 */

import Decimal from 'decimal.js'
import type { CurrencyCode, LedgerEntry } from '~/types/models'
import { findExchangeRate } from './useExchangeRates'

/**
 * Currency symbols mapping (common currencies)
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  CHF: 'CHF',
  CAD: 'CA$',
  AUD: 'A$',
  NZD: 'NZ$',
  INR: '₹',
  RUB: '₽',
  BRL: 'R$',
  ZAR: 'R',
  KRW: '₩',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  THB: '฿',
  MXN: 'MX$',
  SGD: 'S$',
  HKD: 'HK$',
  TRY: '₺',
  IDR: 'Rp',
  MYR: 'RM',
  PHP: '₱',
  CZK: 'Kč',
  ILS: '₪',
  CLP: 'CLP$',
  TWD: 'NT$',
  AED: 'د.إ',
  SAR: 'ر.س',
  ARS: 'ARS$'
}

/**
 * Get currency symbol for a currency code
 * Falls back to the currency code if symbol not found
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_SYMBOLS[currency] || currency
}

/**
 * Format amount with currency symbol
 * 
 * @param amount - The numeric amount
 * @param currency - The currency code (e.g., "USD")
 * @param locale - Optional locale for formatting (defaults to 'en-US')
 * @param options - Additional Intl.NumberFormat options
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...options
  })
  
  return formatter.format(amount)
}

/**
 * Format amount with custom symbol (doesn't use Intl)
 * Useful for consistent display regardless of locale
 */
export function formatCurrencyWithSymbol(
  amount: number,
  currency: CurrencyCode,
  decimals: number = 2
): string {
  const symbol = getCurrencySymbol(currency)
  const formatted = amount.toFixed(decimals)
  
  // For negative amounts, put the minus sign before the symbol
  if (amount < 0) {
    return `-${symbol}${formatted.substring(1)}`
  }
  
  return `${symbol}${formatted}`
}

/**
 * Parse currency input string to decimal
 * Handles various formats: $100, 100.50, 1,000.50, etc.
 * 
 * @param input - The input string
 * @returns Decimal value or null if invalid
 */
export function parseCurrencyInput(input: string): Decimal | null {
  // Remove currency symbols and whitespace
  const cleaned = input
    .replace(/[$€£¥₹₽R฿₺₪₩₱Rs?]/g, '')
    .replace(/\s/g, '')
    .trim()
  
  // Handle empty input
  if (!cleaned) return null
  
  // Remove thousand separators (commas)
  const normalized = cleaned.replace(/,/g, '')
  
  try {
    const decimal = new Decimal(normalized)
    return decimal
  } catch {
    return null
  }
}

/**
 * Convert amount between currencies using exchange rate
 * 
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @param date - Date for exchange rate lookup (YYYY-MM-DD)
 * @returns Converted amount or null if rate not found
 */
export async function convertAmount(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  date: string
): Promise<number | null> {
  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount
  }
  
  // Find exchange rate (returns number | null)
  const rate = await findExchangeRate(fromCurrency, toCurrency, date)
  
  if (rate === null) {
    return null
  }
  
  // Use Decimal.js for precise calculation
  const amountDecimal = new Decimal(amount)
  const rateDecimal = new Decimal(rate)
  const converted = amountDecimal.times(rateDecimal)
  
  return converted.toNumber()
}

/**
 * Get display amount from a ledger entry
 * This is the amount shown to the user in the display currency
 */
export function getDisplayAmount(entry: LedgerEntry): number {
  return entry.amount_display
}

/**
 * Get account amount from a ledger entry
 * This is the amount in the account's native currency
 */
export function getAccountAmount(entry: LedgerEntry): number {
  return entry.amount_account
}

/**
 * Get budget amount from a ledger entry
 * This is the amount in the budget's currency
 */
export function getBudgetAmount(entry: LedgerEntry): number | null {
  return entry.amount_budget
}

/**
 * Freeze exchange rates for a transaction
 * Captures the current exchange rates for future reference
 * 
 * @param displayCurrency - The display currency
 * @param accountCurrency - The account currency
 * @param budgetCurrency - The budget currency (optional)
 * @param date - Date for rate lookup
 * @returns Object with frozen rates
 */
export async function freezeExchangeRates(
  displayCurrency: CurrencyCode,
  accountCurrency: CurrencyCode,
  budgetCurrency: CurrencyCode | null,
  date: string
): Promise<{
  rate_display_to_account: number
  rate_display_to_budget: number | null
}> {
  // Get display to account rate
  let rateToAccount = 1
  if (displayCurrency !== accountCurrency) {
    const rate = await findExchangeRate(displayCurrency, accountCurrency, date)
    if (rate === null) {
      throw new Error(`Exchange rate not found for ${displayCurrency} to ${accountCurrency}`)
    }
    rateToAccount = rate
  }
  
  // Get display to budget rate if budget currency specified
  let rateToBudget: number | null = null
  if (budgetCurrency && displayCurrency !== budgetCurrency) {
    const rate = await findExchangeRate(displayCurrency, budgetCurrency, date)
    if (rate === null) {
      throw new Error(`Exchange rate not found for ${displayCurrency} to ${budgetCurrency}`)
    }
    rateToBudget = rate
  } else if (budgetCurrency && displayCurrency === budgetCurrency) {
    rateToBudget = 1
  }
  
  return {
    rate_display_to_account: rateToAccount,
    rate_display_to_budget: rateToBudget
  }
}

/**
 * List of commonly used currencies
 * Sorted by global usage
 */
export const COMMON_CURRENCIES: Array<{ code: CurrencyCode; name: string; symbol: string }> = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'ARS$' }
]

/**
 * Get all available currencies
 */
export function getAllCurrencies(): Array<{ code: CurrencyCode; name: string; symbol: string }> {
  return COMMON_CURRENCIES
}
