import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateSummary, priceSuggestions, toNumber } from './calculations.js'

test('calculates all cost, price, and profit totals', () => {
  const result = calculateSummary({
    materialCosts: [{ cost: '50000' }, { cost: 25000 }],
    packagingCosts: [{ cost: '10000' }],
    otherCosts: [{ cost: '15000' }],
    units: 10,
    sellingPrice: 15000,
  })
  assert.deepEqual({ ...result, profitMargin: 0 }, { materialsSubtotal: 75000, packagingSubtotal: 10000, otherCostsSubtotal: 15000, totalCost: 100000, units: 10, costPerUnit: 10000, sellingPrice: 15000, profitPerUnit: 5000, profitMargin: 0, totalRevenue: 150000, totalProfit: 50000 })
  assert.ok(Math.abs(result.profitMargin - (100 / 3)) < 1e-10)
})

test('handles zero, empty, negative, and invalid inputs safely', () => {
  const result = calculateSummary({ materialCosts: [{ cost: '' }, { cost: -4 }, { cost: 'nope' }], units: 0, sellingPrice: '' })
  assert.equal(result.costPerUnit, 0)
  assert.equal(result.profitMargin, 0)
  assert.ok(Object.values(result).every(Number.isFinite))
  assert.equal(toNumber(Infinity), 0)
})

test('returns the requested selling-price suggestions', () => {
  assert.deepEqual(priceSuggestions(10000).map(({ value }) => value), [13000, 15000, 20000, 30000])
})
