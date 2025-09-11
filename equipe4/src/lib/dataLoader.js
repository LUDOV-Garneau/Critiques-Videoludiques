import * as XLSX from 'xlsx'

async function fetchArrayBuffer(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.arrayBuffer()
}

function detectColumns(headers) {
  const lower = headers.map(h => String(h || '').toLowerCase())
  function findOne(cands) { return lower.findIndex(h => cands.some(l => h.includes(l))) }
  return {
    title: findOne(['title','game','name','titre','jeu']),
    platform: findOne(['platform','console','system','plateforme']),
    score: findOne(['score','rating','note']),
    year: findOne(['year','release year','annee','année','date']),
  }
}

export async function loadLatestFromXlsx(path, limit = 3) {
  const buf = await fetchArrayBuffer(path)
  const wb = XLSX.read(buf, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
  if (!rows.length) return []
  const headers = rows[0]
  const idx = detectColumns(headers)
  const dataRows = rows.slice(1)
  const mapped = dataRows.map(r => ({
    title: idx.title >= 0 ? r[idx.title] : undefined,
    platform: idx.platform >= 0 ? r[idx.platform] : undefined,
    score: idx.score >= 0 ? Number(r[idx.score]) : undefined,
    year: idx.year >= 0 ? Number(String(r[idx.year]).slice(0,4)) : undefined,
  })).filter(x => x.title)

  const sorted = mapped.sort((a,b) => (b.year||0) - (a.year||0))
  return sorted.slice(0, limit)
}

export async function loadByTitlesFromXlsx(path, wantedTitles = []) {
  const buf = await fetchArrayBuffer(path)
  const wb = XLSX.read(buf, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
  if (!rows.length) return []
  const headers = rows[0]
  const idx = detectColumns(headers)
  const dataRows = rows.slice(1)
  const wantedLower = new Set(wantedTitles.map(t => String(t).toLowerCase()))
  const mapped = dataRows.map(r => ({
    title: idx.title >= 0 ? r[idx.title] : undefined,
    platform: idx.platform >= 0 ? r[idx.platform] : undefined,
    score: idx.score >= 0 ? Number(r[idx.score]) : undefined,
    year: idx.year >= 0 ? Number(String(r[idx.year]).slice(0,4)) : undefined,
  })).filter(x => x.title && wantedLower.has(String(x.title).toLowerCase()))
  const order = new Map(wantedTitles.map((t,i)=>[t.toLowerCase(), i]))
  mapped.sort((a,b) => (order.get(String(a.title).toLowerCase()) ?? 0) - (order.get(String(b.title).toLowerCase()) ?? 0))
  return mapped
}


