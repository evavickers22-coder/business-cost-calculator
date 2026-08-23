import { calculateSummary, priceSuggestions } from './calculations.js'

const currencies = {
  IDR: { symbol: 'Rp', locale: 'id-ID', decimals: 0 },
  AUD: { symbol: '$', locale: 'en-AU', decimals: 2 },
  USD: { symbol: '$', locale: 'en-US', decimals: 2 },
}

const sectionInfo = {
  materials: { number: 1, title: 'Product / Material Costs', placeholder: 'Flour', subtotal: 'Materials Subtotal', count: 3 },
  packaging: { number: 2, title: 'Packaging', placeholder: 'Box', subtotal: 'Packaging Subtotal', count: 2, subtitle: 'Box, bottle, bag, label, sticker, wrapping, etc.' },
  other: { number: 3, title: 'Other Costs', placeholder: 'Labour', subtotal: 'Other Costs Subtotal', count: 2, subtitle: 'Labour, electricity, gas, transport, platform fees, delivery, and other costs.' },
}

const STORAGE_KEY = 'business-cost-calculator-products-v2'
let nextRowId = 1
let nextProductId = 1
const newRow = () => ({ id: nextRowId++, name: '', cost: '' })
const makeProduct = (name = '') => ({
  id: nextProductId++,
  name,
  currency: 'IDR',
  units: '1',
  sellingPrice: '',
  materials: Array.from({ length: 3 }, newRow),
  packaging: Array.from({ length: 2 }, newRow),
  other: Array.from({ length: 2 }, newRow),
})

function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(saved) || !saved.length) return [makeProduct('')]
    let maxProduct = 0; let maxRow = 0
    saved.forEach(p => {
      maxProduct = Math.max(maxProduct, Number(p.id) || 0)
      ;['materials', 'packaging', 'other'].forEach(k => (p[k] || []).forEach(r => { maxRow = Math.max(maxRow, Number(r.id) || 0) }))
    })
    nextProductId = maxProduct + 1
    nextRowId = maxRow + 1
    return saved
  } catch { return [makeProduct('')] }
}

let products = loadProducts()
let activeId = products[0].id
const app = document.querySelector('#root')
const active = () => products.find(p => p.id === activeId) || products[0]
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(products))

function moneyFor(product, value, symbolOnly = false) {
  const c = currencies[product.currency] || currencies.IDR
  return symbolOnly ? c.symbol : `${c.symbol} ${Number(value || 0).toLocaleString(c.locale, { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals })}`
}

function summary(product) {
  return calculateSummary({
    materialCosts: product.materials,
    packagingCosts: product.packaging,
    otherCosts: product.other,
    units: product.units,
    sellingPrice: product.sellingPrice,
  })
}

const esc = v => String(v ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

function productCard(product) {
  const s = summary(product)
  return `<button class="product-card ${product.id === activeId ? 'active' : ''}" data-product-id="${product.id}">
    <span class="product-card-name">${esc(product.name || `Product ${products.indexOf(product) + 1}`)}</span>
    <span>${moneyFor(product, s.costPerUnit)} / unit</span>
    <span>Sell ${moneyFor(product, s.sellingPrice)} · Profit ${moneyFor(product, s.profitPerUnit)}</span>
  </button>`
}

function rowMarkup(section, row, index, product) {
  const info = sectionInfo[section]
  return `<div class="cost-row" data-row="${row.id}">
    <input data-field="name" aria-label="${info.title} item ${index + 1} name" placeholder="${index ? 'Item name' : info.placeholder}" value="${esc(row.name)}">
    <div class="money-input"><span data-symbol>${moneyFor(product, 0, true)}</span><input data-field="cost" aria-label="${info.title} item ${index + 1} cost" inputmode="decimal" type="number" min="0" placeholder="0" value="${esc(row.cost)}"></div>
    <button class="delete" type="button" aria-label="Delete item">×</button>
  </div>`
}

function sectionMarkup(section, product) {
  const info = sectionInfo[section]
  return `<section class="card cost-section" data-section="${section}">
    <div class="section-heading"><span class="step">${info.number}</span><div><h2>${info.title}</h2>${info.subtitle ? `<p>${info.subtitle}</p>` : ''}</div></div>
    <div class="row-labels"><span>Item name</span><span>Cost</span><span></span></div>
    <div class="cost-rows">${product[section].map((r, i) => rowMarkup(section, r, i, product)).join('')}</div>
    <button class="add-button" type="button"><span>＋</span> Add Item</button>
    <div class="subtotal"><span>${info.subtotal}</span><strong data-subtotal="${section}"></strong></div>
  </section>`
}

function render() {
  const p = active()
  app.innerHTML = `<main>
    <header class="hero"><div class="brand-mark">BC</div><div><p class="eyebrow">Simple pricing, smarter business</p><h1>Business Cost Calculator</h1><p>Save and compare multiple products in one place.</p></div></header>

    <section class="product-manager card">
      <div class="manager-head"><div><p class="manager-kicker">MY PRODUCTS</p><h2>Products</h2></div><button id="add-product" class="primary-action" type="button">＋ Add New Product</button></div>
      <div class="product-list">${products.map(productCard).join('')}</div>
      <p class="autosave-note">Saved automatically on this device.</p>
    </section>

    <div class="intro card">
      <label>Product Name<input id="product" placeholder="Brownies, Coffee, Candle, Bag, etc." value="${esc(p.name)}"></label>
      <label>Currency<select id="currency">${Object.entries(currencies).map(([code, c]) => `<option value="${code}" ${p.currency === code ? 'selected' : ''}>${code} — ${c.symbol}</option>`).join('')}</select></label>
    </div>

    <div class="product-actions"><button id="duplicate-product" type="button">Duplicate Product</button><button id="delete-product" class="danger-action" type="button" ${products.length === 1 ? 'disabled' : ''}>Delete Product</button></div>
    <div class="flow"><span>Enter costs</span><b>→</b><span>Cost per unit</span><b>→</b><span>Choose price</span><b>→</b><span>See profit</span></div>
    <div id="cost-sections">${Object.keys(sectionInfo).map(k => sectionMarkup(k, p)).join('')}</div>

    <section class="production card"><div class="section-heading"><span class="step">4</span><div><h2>Production Result</h2><p>Your total cost and cost for every unit.</p></div></div><div class="total-cost"><span>Total Cost</span><strong data-value="totalCost"></strong></div><label class="units-label">Number of Units Produced<input id="units" type="number" inputmode="numeric" min="1" value="${esc(p.units)}"></label><div class="unit-result"><span>Cost Per Unit</span><strong data-value="costPerUnit"></strong><small>Total cost ÷ number of units</small></div></section>

    <section class="card"><div class="section-heading"><span class="step">5</span><div><h2>Selling Price</h2><p>Tap a suggested price or enter your own.</p></div></div><div class="suggestions" id="suggestions"></div><label class="custom-price">Custom Selling Price<div class="money-input large"><span data-symbol></span><input id="selling-price" type="number" inputmode="decimal" min="0" placeholder="0" value="${esc(p.sellingPrice)}"></div></label></section>

    <section class="results"><div class="results-title"><span class="step light">6</span><div><p>Your profit summary</p><h2><span id="result-product">${esc(p.name || 'Business')}</span> at a glance</h2></div></div><div class="result-grid"><div><span>Total Cost</span><strong data-value="totalCost"></strong></div><div><span>Number of Units</span><strong data-value="units"></strong></div><div><span>Cost Per Unit</span><strong data-value="costPerUnit"></strong></div><div><span>Selling Price</span><strong data-value="sellingPrice"></strong></div><div class="highlight"><span>Profit Per Unit</span><strong data-value="profitPerUnit"></strong></div><div class="highlight"><span>Profit Margin</span><strong data-value="profitMargin"></strong></div></div><div class="potential"><div><span>Total Potential Revenue</span><strong data-value="totalRevenue"></strong></div><div><span>Total Potential Profit</span><strong data-value="totalProfit"></strong></div></div><p class="results-note">Based on selling all <span id="note-units">1</span> units.</p></section>
    <footer>Made to help small businesses price with confidence.</footer>
  </main>`
  updateResults()
}

function updateProductCards() {
  document.querySelector('.product-list').innerHTML = products.map(productCard).join('')
}

function updateResults() {
  const p = active(); const s = summary(p)
  ;['totalCost','costPerUnit','sellingPrice','profitPerUnit','totalRevenue','totalProfit'].forEach(key => {
    document.querySelectorAll(`[data-value="${key}"]`).forEach(el => { el.textContent = moneyFor(p, s[key]); if (key === 'totalProfit') el.classList.toggle('negative', s[key] < 0) })
  })
  document.querySelector('[data-value="units"]').textContent = s.units.toLocaleString()
  document.querySelector('[data-value="profitMargin"]').textContent = `${s.profitMargin.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
  document.querySelector('[data-subtotal="materials"]').textContent = moneyFor(p, s.materialsSubtotal)
  document.querySelector('[data-subtotal="packaging"]').textContent = moneyFor(p, s.packagingSubtotal)
  document.querySelector('[data-subtotal="other"]').textContent = moneyFor(p, s.otherCostsSubtotal)
  document.querySelectorAll('[data-symbol]').forEach(el => { el.textContent = moneyFor(p, 0, true) })
  document.querySelector('#note-units').textContent = s.units.toLocaleString()
  document.querySelector('#suggestions').innerHTML = priceSuggestions(s.costPerUnit).map(({ label, value }) => `<button type="button" data-price="${value}" class="${Number(p.sellingPrice) === Number(value.toFixed(currencies[p.currency].decimals)) ? 'selected' : ''}"><span>${label}</span><strong>${moneyFor(p, value)}</strong></button>`).join('')
  updateProductCards()
}

function persistAndUpdate() { save(); updateResults() }

app.addEventListener('input', event => {
  const p = active()
  if (event.target.id === 'product') { p.name = event.target.value; document.querySelector('#result-product').textContent = p.name || 'Business' }
  if (event.target.id === 'units') p.units = event.target.value
  if (event.target.id === 'selling-price') p.sellingPrice = event.target.value
  const sectionEl = event.target.closest('[data-section]'); const rowEl = event.target.closest('[data-row]')
  if (sectionEl && rowEl && event.target.dataset.field) {
    const row = p[sectionEl.dataset.section].find(item => item.id === Number(rowEl.dataset.row))
    if (row) row[event.target.dataset.field] = event.target.value
  }
  persistAndUpdate()
})

app.addEventListener('change', event => {
  if (event.target.id === 'currency') { active().currency = event.target.value; persistAndUpdate() }
})

app.addEventListener('click', event => {
  const productButton = event.target.closest('[data-product-id]')
  if (productButton) { activeId = Number(productButton.dataset.productId); render(); return }

  if (event.target.closest('#add-product')) {
    const product = makeProduct(`Product ${products.length + 1}`)
    products.push(product); activeId = product.id; save(); render(); return
  }

  if (event.target.closest('#duplicate-product')) {
    const source = active(); const clone = JSON.parse(JSON.stringify(source))
    clone.id = nextProductId++; clone.name = `${source.name || 'Product'} Copy`
    ;['materials','packaging','other'].forEach(k => clone[k].forEach(r => { r.id = nextRowId++ }))
    products.push(clone); activeId = clone.id; save(); render(); return
  }

  if (event.target.closest('#delete-product') && products.length > 1) {
    const current = active(); if (!confirm(`Delete ${current.name || 'this product'}?`)) return
    products = products.filter(p => p.id !== activeId); activeId = products[0].id; save(); render(); return
  }

  const priceButton = event.target.closest('[data-price]')
  if (priceButton) {
    const p = active(); const value = Number(priceButton.dataset.price); p.sellingPrice = String(Number(value.toFixed(currencies[p.currency].decimals)))
    document.querySelector('#selling-price').value = p.sellingPrice; persistAndUpdate(); return
  }

  const sectionEl = event.target.closest('[data-section]'); if (!sectionEl) return
  const p = active(); const section = sectionEl.dataset.section
  if (event.target.closest('.add-button')) p[section].push(newRow())
  else if (event.target.closest('.delete')) {
    const rowId = Number(event.target.closest('[data-row]').dataset.row)
    p[section] = p[section].filter(row => row.id !== rowId)
    if (!p[section].length) p[section].push(newRow())
  } else return
  save(); render()
})

render()
