/**
 * Data Access Layer for Exchange Rates
 * CRUD operations and rate lookup logic
 */

import type { ExchangeRate, CurrencyCode } from '~/types/models'
import { useDatabase } from './useDatabase'
import { validateExchangeRate } from '~/utils/validation'

/**
 * Create composite ID for exchange rate
 */
function createRateId(from: CurrencyCode, to: CurrencyCode, date: string): string {
  return `${from}_${to}_${date}`
}

/**
 * Create or update an exchange rate
 */
export async function setExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  rate: number,
  date: string, // YYYY-MM-DD
  source: 'manual' | 'api' = 'manual'
): Promise<ExchangeRate> {
  const db = useDatabase()
  
  // Validate
  if (from === to) {
    throw new Error('From and to currencies must be different')
  }
  
  validateExchangeRate(rate)
  
  const now = new Date().toISOString()
  const id = createRateId(from, to, date)
  
  const exchangeRate: ExchangeRate = {
    id,
    from,
    to,
    rate,
    date,
    source,
    updated_at: now
  }
  
  await db.rates.put(exchangeRate)
  return exchangeRate
}

/**
 * Get exchange rate by ID
 */
export async function getExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  date: string
): Promise<ExchangeRate | undefined> {
  const db = useDatabase()
  const id = createRateId(from, to, date)
  return await db.rates.get(id)
}

/**
 * Find most recent exchange rate for a currency pair on or before a date
 */
export async function findExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  date: string
): Promise<number | null> {
  const db = useDatabase()
  
  // If same currency, rate is 1
  if (from === to) {
    return 1
  }
  
  // Query rates where from/to match and date <= transaction_date
  const rates = await db.rates
    .where('date')
    .belowOrEqual(date)
    .filter(rate => rate.from === from && rate.to === to)
    .reverse()
    .limit(1)
    .toArray()
  
  if (rates.length > 0) {
    return rates[0].rate
  }
  
  return null
}

/**
 * Get all exchange rates for a date
 */
export async function getExchangeRatesForDate(date: string): Promise<ExchangeRate[]> {
  const db = useDatabase()
  return await db.rates
    .where('date')
    .equals(date)
    .toArray()
}

/**
 * Get all exchange rates between two dates
 */
export async function getExchangeRatesInRange(
  startDate: string,
  endDate: string
): Promise<ExchangeRate[]> {
  const db = useDatabase()
  return await db.rates
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray()
}

/**
 * Delete an exchange rate
 */
export async function deleteExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  date: string
): Promise<void> {
  const db = useDatabase()
  const id = createRateId(from, to, date)
  await db.rates.delete(id)
}

/**
 * Get all unique currency pairs
 */
export async function getAvailableCurrencyPairs(): Promise<Array<{ from: CurrencyCode; to: CurrencyCode }>> {
  const db = useDatabase()
  const rates = await db.rates.toArray()
  
  const pairs = new Map<string, { from: CurrencyCode; to: CurrencyCode }>()
  
  for (const rate of rates) {
    const key = `${rate.from}_${rate.to}`
    if (!pairs.has(key)) {
      pairs.set(key, { from: rate.from, to: rate.to })
    }
  }
  
  return Array.from(pairs.values())
}
