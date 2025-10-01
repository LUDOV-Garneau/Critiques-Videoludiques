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
const rows = data.slice(1, 500) // Prendre 500 lignes d'exemple

console.log('=== MOYENNES AVEC DONNÉES RÉELLES ===')
const averageColumns = [
  { index: 35, name: 'Moyenne des critères généraux' },
  { index: 39, name: 'Moyenne des critères visuels' },
  { index: 43, name: 'Moyenne des critères sonores' },
  { index: 47, name: 'Moyenne des critères de contenu' },
  { index: 51, name: 'Moyenne des critères de jouabilité' },
  { index: 55, name: 'Moyenne des critères d\'originalité' },
  { index: 59, name: 'Moyenne des critères de potentiel' },
  { index: 63, name: 'Moyenne des critères sur le temps de jeu' },
  { index: 67, name: 'Moyenne des critères sur la difficulté' },
  { index: 71, name: 'Moyenne des critères sur la matérialité' },
  { index: 75, name: 'Moyenne des critères sur le prix' },
  { index: 79, name: 'Moyenne des critères sur le multijoueur' },
  { index: 83, name: 'Moyenne des autres critères' }
]

const validAverages = []

averageColumns.forEach(col => {
  const values = rows.map(row => row[col.index])
    .filter(v => v !== null && v !== undefined && v !== '' && v !== 0)
  
  if (values.length > 0) {
    const numericValues = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v))
    if (numericValues.length > 0) {
      const min = Math.min(...numericValues.map(v => parseFloat(v)))
      const max = Math.max(...numericValues.map(v => parseFloat(v)))
      console.log(`✓ ${col.name}: ${values.length} valeurs, plage ${min}-${max}`)
      console.log(`  Exemples: [${values.slice(0, 10).join(', ')}]`)
      
      validAverages.push({
        ...col,
        count: values.length,
        min: min,
        max: max,
        examples: values.slice(0, 10)
      })
    }
  } else {
    console.log(`✗ ${col.name}: Aucune donnée`)
  }
})

console.log(`\n=== RÉSUMÉ ===`)
console.log(`Moyennes avec données: ${validAverages.length}`)
validAverages.forEach(avg => {
  console.log(`- ${avg.name}: ${avg.count} critiques notées (${avg.min}-${avg.max})`)
})

// Chercher d'autres colonnes de notes possibles
console.log('\n=== AUTRES COLONNES DE NOTES POSSIBLES ===')
headers.forEach((header, index) => {
  if (header && (
    header.toLowerCase().includes('note') ||
    header.toLowerCase().includes('score') ||
    header.toLowerCase().includes('rating')
  ) && !header.toLowerCase().includes('commentaire') && !header.toLowerCase().includes('moyenne')) {
    
    const values = rows.map(row => row[index])
      .filter(v => v !== null && v !== undefined && v !== '' && v !== 0)
    
    if (values.length > 0) {
      const numericValues = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v))
      if (numericValues.length > 0) {
        const min = Math.min(...numericValues.map(v => parseFloat(v)))
        const max = Math.max(...numericValues.map(v => parseFloat(v)))
        console.log(`${index}: ${header} - ${values.length} valeurs (${min}-${max})`)
        console.log(`  Exemples: [${values.slice(0, 5).join(', ')}]`)
      }
    }
  }
})
