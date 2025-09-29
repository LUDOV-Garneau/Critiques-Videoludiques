import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'

describe('Build Process', () => {
  let distDir

  beforeAll(() => {
    // Run the build command and capture output
    try {
      execSync('npm run build', { stdio: 'pipe' })
      distDir = join(process.cwd(), 'dist')
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`)
    }
  })

  afterAll(() => {
    // Clean up dist folder after tests (optional, comment out if you want to keep it)
    // execSync('rm -rf dist', { stdio: 'ignore' })
  })

  it('generates dist directory', () => {
    expect(existsSync(distDir)).toBe(true)
  })

  it('includes index.html in dist', () => {
    const indexPath = join(distDir, 'index.html')
    expect(existsSync(indexPath)).toBe(true)
    const content = readFileSync(indexPath, 'utf-8')
    expect(content).toContain('<html') // Basic check for HTML structure
  })

  it('includes assets (e.g., ludovlogo.jpg)', () => {
    const assetsDir = join(distDir, 'assets')
    expect(existsSync(assetsDir)).toBe(true)
    const files = readdirSync(assetsDir)
    expect(files.some(file => file.includes('ludovlogo'))).toBe(true) // Check for logo
  })

  it('contains valid JavaScript files', () => {
    const assetsDir = join(distDir, 'assets')
    const jsFiles = readdirSync(assetsDir).filter(file => file.endsWith('.js'))
    expect(jsFiles.length).toBeGreaterThan(0)
    jsFiles.forEach(file => {
      const content = readFileSync(join(assetsDir, file), 'utf-8')
      expect(content).toContain('function') // Basic check for JS content
    })
  })

  it('matches expected file count', () => {
    const files = readdirSync(distDir)
    // Expect at least index.html and an assets folder, adjust based on your project
    expect(files.length).toBeGreaterThanOrEqual(2)
  })
})