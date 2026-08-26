export function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

export function calculateSummary({ materialCosts = [], packagingCosts = [], otherCosts = [], units, sellingPrice }) {
  const safeUnits = toNumber(units)
  const sum = (items) => (Array.isArray(items) ? items : []).reduce((total, item) => {
    const cost = toNumber(item?.cost)
    return total + (item?.costMode === 'perUnit' ? cost * safeUnits : cost)
  }, 0)
  const materialsSubtotal = sum(materialCosts)
  const packagingSubtotal = sum(packagingCosts)
  const otherCostsSubtotal = sum(otherCosts)
  const totalCost = materialsSubtotal + packagingSubtotal + otherCostsSubtotal
  const costPerUnit = safeUnits ? totalCost / safeUnits : 0
  const price = toNumber(sellingPrice)
  const profitPerUnit = price - costPerUnit
  const profitMargin = price ? (profitPerUnit / price) * 100 : 0
  const totalRevenue = price * safeUnits
  const totalProfit = totalRevenue - totalCost

  return { materialsSubtotal, packagingSubtotal, otherCostsSubtotal, totalCost, units: safeUnits, costPerUnit, sellingPrice: price, profitPerUnit, profitMargin, totalRevenue, totalProfit }
}

export const priceSuggestions = (costPerUnit) => [
  { label: '30% markup', value: costPerUnit * 1.3 },
  { label: '50% markup', value: costPerUnit * 1.5 },
  { label: '100% markup', value: costPerUnit * 2 },
  { label: 'Cost × 3', value: costPerUnit * 3 },
]
