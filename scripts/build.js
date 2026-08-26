import { cp, mkdir, rm } from 'node:fs/promises'

await rm('dist', { recursive: true, force: true })
await mkdir('dist/src', { recursive: true })
await cp('index.html', 'dist/index.html')
await Promise.all([
  cp('src/main.js', 'dist/src/main.js'),
  cp('src/calculations.js', 'dist/src/calculations.js'),
  cp('src/styles.css', 'dist/src/styles.css'),
  cp('src/multi-product.css', 'dist/src/multi-product.css'),
])
console.log('Production files created in dist/')
