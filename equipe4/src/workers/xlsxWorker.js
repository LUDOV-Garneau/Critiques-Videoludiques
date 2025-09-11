import * as XLSX from 'xlsx'

self.onmessage = async (e) => {
  const { type, payload } = e.data || {}
  if (type === 'parse') {
    try {
      const { arrayBuffer } = payload
      const wb = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = wb.SheetNames[0]
      const sheet = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
      postMessage({ type: 'parsed', payload: { rows } })
    } catch (err) {
      postMessage({ type: 'error', payload: { message: err.message || String(err) } })
    }
  }
}


