import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

// Lire le fichier Excel
const filePath = './public/data/datareviews.xlsx'
const fileBuffer = readFileSync(filePath)
const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
const sheetName = workbook.SheetNames[0]
const worksheet = workbook.Sheets[sheetName]

// Convertir en JSON avec les headers
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
const headers = data[0]
const rows = data.slice(1, 20) // Prendre 20 lignes d'exemple

console.log('=== ANALYSE DU SYSTÈME DE NOTATION ===')
console.log(`Total de colonnes: ${headers.length}`)
console.log('')

// Chercher toutes les colonnes liées aux notes et moyennes
console.log('=== COLONNES LIÉES AUX NOTES ET MOYENNES ===')
const scoreColumns = []

headers.forEach((header, index) => {
  if (header && (
    header.toLowerCase().includes('note') ||
    header.toLowerCase().includes('score') ||
    header.toLowerCase().includes('moyenne') ||
    header.toLowerCase().includes('critère') ||
    header.toLowerCase().includes('évaluation') ||
    header.toLowerCase().includes('système')
  )) {
    scoreColumns.push({
      index: index,
      name: header
    })
    console.log(`${index}: ${header}`)
  }
})

console.log(`\nTotal colonnes de notation trouvées: ${scoreColumns.length}`)
console.log('')

// Analyser les valeurs pour chaque colonne de notation
console.log('=== ANALYSE DES VALEURS DE NOTATION ===')
scoreColumns.forEach(col => {
  const sampleValues = rows.map(row => row[col.index])
    .filter(v => v !== null && v !== undefined && v !== '' && v !== 0)
    .slice(0, 10) // Prendre 10 exemples
  
  const uniqueValues = [...new Set(sampleValues)]
  
  console.log(`\n${col.name} (index ${col.index}):`)
  console.log(`  Exemples: [${sampleValues.slice(0, 5).join(', ')}]`)
  console.log(`  Valeurs uniques (${uniqueValues.length}): [${uniqueValues.slice(0, 10).join(', ')}]`)
  
  // Vérifier si c'est numérique
  const numericValues = sampleValues.filter(v => !isNaN(parseFloat(v)) && isFinite(v))
  if (numericValues.length > 0) {
    const min = Math.min(...numericValues.map(v => parseFloat(v)))
    const max = Math.max(...numericValues.map(v => parseFloat(v)))
    console.log(`  Plage numérique: ${min} - ${max}`)
  }
})

// Chercher spécifiquement les colonnes de moyennes par critères
console.log('\n=== MOYENNES PAR CRITÈRES SPÉCIFIQUES ===')
const criteriaAverages = headers.map((header, index) => ({ header, index }))
  .filter(item => item.header && item.header.toLowerCase().includes('moyenne'))

criteriaAverages.forEach(item => {
  const sampleValues = rows.map(row => row[item.index])
    .filter(v => v !== null && v !== undefined && v !== '' && v !== 0)
    .slice(0, 5)
  
  console.log(`${item.index}: ${item.header}`)
  console.log(`  Exemples: [${sampleValues.join(', ')}]`)
})

// Analyser le système d'évaluation
console.log('\n=== SYSTÈME D\'ÉVALUATION ===')
const evaluationSystemIndex = headers.findIndex(h => 
  h && h.toLowerCase().includes('système') && h.toLowerCase().includes('évaluation')
)

if (evaluationSystemIndex !== -1) {
  console.log(`Colonne système d'évaluation trouvée: ${headers[evaluationSystemIndex]} (index ${evaluationSystemIndex})`)
  const systemValues = rows.map(row => row[evaluationSystemIndex])
    .filter(v => v !== null && v !== undefined && v !== '')
  const uniqueSystems = [...new Set(systemValues)]
  console.log(`Systèmes d'évaluation: [${uniqueSystems.join(', ')}]`)
}

// Analyser les échelles
console.log('\n=== ÉCHELLES DE NOTATION ===')
const scaleIndex = headers.findIndex(h => 
  h && h.toLowerCase().includes('échelle')
)

if (scaleIndex !== -1) {
  console.log(`Colonne échelle trouvée: ${headers[scaleIndex]} (index ${scaleIndex})`)
  const scaleValues = rows.map(row => row[scaleIndex])
    .filter(v => v !== null && v !== undefined && v !== '')
  const uniqueScales = [...new Set(scaleValues)]
  console.log(`Échelles: [${uniqueScales.join(', ')}]`)
}
