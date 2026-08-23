import { calculateSummary, priceSuggestions } from './calculations.js'

const currencies = { IDR: { symbol: 'Rp', locale: 'id-ID', decimals: 0 }, AUD: { symbol: '$', locale: 'en-AU', decimals: 2 }, USD: { symbol: '$', locale: 'en-US', decimals: 2 } }
const sectionInfo = {
  materials: { number: 1, title: 'Product / Material Costs', placeholder: 'Flour', subtotal: 'Materials Subtotal', count: 3 },
  packaging: { number: 2, title: 'Packaging', placeholder: 'Box', subtotal: 'Packaging Subtotal', count: 2, subtitle: 'Box, bottle, bag, label, sticker, wrapping, etc.' },
  other: { number: 3, title: 'Other Costs', placeholder: 'Labour', subtotal: 'Other Costs Subtotal', count: 2, subtitle: 'Labour, electricity, gas, transport, platform fees, delivery, and other costs.' },
}
const state = { currency: 'IDR', product: '', units: '1', sellingPrice: '', materials: [], packaging: [], other: [] }
let nextId = 1
const newRow = () => ({ id: nextId++, name: '', cost: '' })
Object.entries(sectionInfo).forEach(([key, info]) => { state[key] = Array.from({ length: info.count }, newRow) })

const app = document.querySelector('#root')
app.innerHTML = `<main>
  <header class="hero"><div class="brand-mark">BC</div><div><p class="eyebrow">Simple pricing, smarter business</p><h1>Business Cost Calculator</h1><p>Calculate your product cost, selling price, and profit instantly.</p></div></header>
  <div class="intro card"><label>Product Name <span>Optional</span><input id="product" placeholder="Brownies, Coffee, Candle, Bag, etc."></label><label>Currency<select id="currency">${Object.entries(currencies).map(([code, item]) => `<option value="${code}">${code} — ${item.symbol}</option>`).join('')}</select></label></div>
  <div class="flow"><span>Enter costs</span><b>→</b><span>Cost per unit</span><b>→</b><span>Choose price</span><b>→</b><span>See profit</span></div>
  <div id="cost-sections"></div>
  <section class="production card"><div class="section-heading"><span class="step">4</span><div><h2>Production Result</h2><p>Your total cost and cost for every unit.</p></div></div><div class="total-cost"><span>Total Cost</span><strong data-value="totalCost"></strong></div><label class="units-label">Number of Units Produced<input id="units" type="number" inputmode="numeric" min="1" value="1"></label><div class="unit-result"><span>Cost Per Unit</span><strong data-value="costPerUnit"></strong><small>Total cost ÷ number of units</small></div></section>
  <section class="card"><div class="section-heading"><span class="step">5</span><div><h2>Selling Price</h2><p>Tap a suggested price or enter your own.</p></div></div><div class="suggestions" id="suggestions"></div><label class="custom-price">Custom Selling Price<div class="money-input large"><span data-symbol></span><input id="selling-price" aria-label="Custom Selling Price" type="number" inputmode="decimal" min="0" placeholder="0"></div></label></section>
  <section class="results"><div class="results-title"><span class="step light">6</span><div><p>Your profit summary</p><h2><span id="result-product">Business</span> at a glance</h2></div></div><div class="result-grid"><div><span>Total Cost</span><strong data-value="totalCost"></strong></div><div><span>Number of Units</span><strong data-value="units"></strong></div><div><span>Cost Per Unit</span><strong data-value="costPerUnit"></strong></div><div><span>Selling Price</span><strong data-value="sellingPrice"></strong></div><div class="highlight"><span>Profit Per Unit</span><strong data-value="profitPerUnit"></strong></div><div class="highlight"><span>Profit Margin</span><strong data-value="profitMargin"></strong></div></div><div class="potential"><div><span>Total Potential Revenue</span><strong data-value="totalRevenue"></strong></div><div><span>Total Potential Profit</span><strong data-value="totalProfit"></strong></div></div><p class="results-note">Based on selling all <span id="note-units">1</span> units.</p></section>
  <footer>Made to help small businesses price with confidence.</footer>
</main>`

const money = (value, symbolOnly = false) => { const c = currencies[state.currency]; return symbolOnly ? c.symbol : `${c.symbol} ${Number(value || 0).toLocaleString(c.locale, { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals })}` }
const escapeAttribute = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
function rowMarkup(section, row, index) { const info = sectionInfo[section]; return `<div class="cost-row" data-row="${row.id}"><input data-field="name" aria-label="${info.title} item ${index + 1} name" placeholder="${index ? 'Item name' : info.placeholder}" value="${escapeAttribute(row.name)}"><div class="money-input"><span data-symbol>${money(0, true)}</span><input data-field="cost" aria-label="${info.title} item ${index + 1} cost" inputmode="decimal" type="number" min="0" placeholder="0" value="${escapeAttribute(row.cost)}"></div><button class="delete" type="button" aria-label="Delete ${info.title} item ${index + 1}">×</button></div>` }
function renderSection(section) { const info = sectionInfo[section]; return `<section class="card cost-section" data-section="${section}"><div class="section-heading"><span class="step">${info.number}</span><div><h2>${info.title}</h2>${info.subtitle ? `<p>${info.subtitle}</p>` : ''}</div></div><div class="row-labels" aria-hidden="true"><span>Item name</span><span>Cost</span><span></span></div><div class="cost-rows">${state[section].map((row, i) => rowMarkup(section, row, i)).join('')}</div><button class="add-button" type="button"><span>＋</span> Add Item</button><div class="subtotal"><span>${info.subtotal}</span><strong data-subtotal="${section}"></strong></div></section>` }
function renderSections() { document.querySelector('#cost-sections').innerHTML = Object.keys(sectionInfo).map(renderSection).join('') }
function updateResults() {
  const result = calculateSummary({ materialCosts: state.materials, packagingCosts: state.packaging, otherCosts: state.other, units: state.units, sellingPrice: state.sellingPrice })
  const keys = ['totalCost', 'costPerUnit', 'sellingPrice', 'profitPerUnit', 'totalRevenue', 'totalProfit']
  keys.forEach(key => document.querySelectorAll(`[data-value="${key}"]`).forEach(el => { el.textContent = money(result[key]); if (key === 'totalProfit') el.classList.toggle('negative', result[key] < 0) }))
  document.querySelector('[data-value="units"]').textContent = result.units.toLocaleString()
  document.querySelector('[data-value="profitMargin"]').textContent = `${result.profitMargin.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
  document.querySelector('[data-subtotal="materials"]').textContent = money(result.materialsSubtotal)
  document.querySelector('[data-subtotal="packaging"]').textContent = money(result.packagingSubtotal)
  document.querySelector('[data-subtotal="other"]').textContent = money(result.otherCostsSubtotal)
  document.querySelectorAll('[data-symbol]').forEach(el => { el.textContent = money(0, true) })
  document.querySelector('#note-units').textContent = result.units.toLocaleString()
  document.querySelector('#suggestions').innerHTML = priceSuggestions(result.costPerUnit).map(({ label, value }) => `<button type="button" data-price="${value}" class="${Number(state.sellingPrice) === Number(value.toFixed(currencies[state.currency].decimals)) ? 'selected' : ''}"><span>${label}</span><strong>${money(value)}</strong></button>`).join('')
}
renderSections(); updateResults()

app.addEventListener('input', (event) => {
  if (event.target.id === 'product') { state.product = event.target.value; document.querySelector('#result-product').textContent = state.product || 'Business' }
  if (event.target.id === 'units') state.units = event.target.value
  if (event.target.id === 'selling-price') state.sellingPrice = event.target.value
  const sectionEl = event.target.closest('[data-section]'); const rowEl = event.target.closest('[data-row]')
  if (sectionEl && rowEl && event.target.dataset.field) { const row = state[sectionEl.dataset.section].find(item => item.id === Number(rowEl.dataset.row)); row[event.target.dataset.field] = event.target.value }
  updateResults()
})
app.addEventListener('change', (event) => { if (event.target.id === 'currency') { state.currency = event.target.value; updateResults() } })
app.addEventListener('click', (event) => {
  const priceButton = event.target.closest('[data-price]'); if (priceButton) { const value = Number(priceButton.dataset.price); state.sellingPrice = String(Number(value.toFixed(currencies[state.currency].decimals))); document.querySelector('#selling-price').value = state.sellingPrice; updateResults(); return }
  const sectionEl = event.target.closest('[data-section]'); if (!sectionEl) return; const section = sectionEl.dataset.section
  if (event.target.closest('.add-button')) state[section].push(newRow())
  else if (event.target.closest('.delete')) { const rowId = Number(event.target.closest('[data-row]').dataset.row); state[section] = state[section].filter(row => row.id !== rowId) }
  else return
  renderSections(); updateResults()
})
