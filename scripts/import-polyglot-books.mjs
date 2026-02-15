#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const BOOK_ENTRY_SIZE = 16

function fail(message) {
  throw new Error(message)
}

function normalizeToken(value) {
  return value.trim().toLowerCase()
}

function slugifyBookStem(stem) {
  return stem
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function tokenize(value) {
  return normalizeToken(value)
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function toBigUint64(buffer, offset) {
  return buffer.readBigUInt64BE(offset)
}

function parseArgs(argv) {
  const args = {
    source: '../scrypt/books',
    destination: 'public/books/general',
    openings: 'src/data/openings.json',
    booksIndex: 'src/data/books.index.json',
    openingsIndex: 'src/data/openings.index.json',
    dryRun: false,
    strict: true
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    if (current === '--source' && next) {
      args.source = next
      index += 1
      continue
    }
    if (current === '--destination' && next) {
      args.destination = next
      index += 1
      continue
    }
    if (current === '--openings' && next) {
      args.openings = next
      index += 1
      continue
    }
    if (current === '--books-index' && next) {
      args.booksIndex = next
      index += 1
      continue
    }
    if (current === '--openings-index' && next) {
      args.openingsIndex = next
      index += 1
      continue
    }
    if (current === '--dry-run') {
      args.dryRun = true
      continue
    }
    if (current === '--no-strict') {
      args.strict = false
      continue
    }
    if (current === '--help' || current === '-h') {
      printHelp()
      process.exit(0)
    }

    fail(`Unknown argument: ${current}`)
  }

  return args
}

function printHelp() {
  console.log(
    [
      'Import Polyglot books and rebuild extension indexes.',
      '',
      'Usage:',
      '  node scripts/import-polyglot-books.mjs [options]',
      '',
      'Options:',
      '  --source <path>         Source folder with *.bin files (default: ../scrypt/books)',
      '  --destination <path>    Destination folder for copied books (default: public/books/general)',
      '  --openings <path>       Openings metadata JSON (default: src/data/openings.json)',
      '  --books-index <path>    Output books index JSON (default: src/data/books.index.json)',
      '  --openings-index <path> Output openings search index JSON (default: src/data/openings.index.json)',
      '  --dry-run               Validate and print summary without writing files',
      '  --no-strict             Allow mismatches between books and openings ids',
      '  -h, --help              Show this message'
    ].join('\n')
  )
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

async function ensureDirectoryExists(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function listBinFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.bin'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

async function validatePolyglotFile(filePath) {
  const buffer = await fs.readFile(filePath)
  const size = buffer.length

  if (size === 0) {
    fail(`Book is empty: ${filePath}`)
  }
  if (size % BOOK_ENTRY_SIZE !== 0) {
    fail(`Book size is not multiple of 16 bytes: ${filePath}`)
  }

  const entries = size / BOOK_ENTRY_SIZE
  let previousKey = null

  for (let offset = 0; offset < size; offset += BOOK_ENTRY_SIZE) {
    const currentKey = toBigUint64(buffer, offset)
    if (previousKey !== null && currentKey < previousKey) {
      fail(`Polyglot keys are not sorted in ${filePath} at entry #${offset / BOOK_ENTRY_SIZE}`)
    }
    previousKey = currentKey
  }

  return { size, entries }
}

function buildBooksIndex(binFiles) {
  const index = {}
  for (const fileName of binFiles) {
    const stem = fileName.replace(/\.bin$/i, '')
    const id = slugifyBookStem(stem)
    if (!id) {
      fail(`Cannot build opening id from file name: ${fileName}`)
    }
    if (index[id]) {
      fail(`Duplicate opening id generated from file names: ${id}`)
    }
    index[id] = `books/general/${fileName}`
  }
  return index
}

function validateOpenings(openings) {
  if (!Array.isArray(openings)) {
    fail('Openings JSON must contain an array')
  }

  const ids = new Set()
  for (const opening of openings) {
    if (!opening || typeof opening !== 'object') {
      fail('Each opening must be an object')
    }
    if (typeof opening.id !== 'string' || opening.id.trim() === '') {
      fail('Each opening must have non-empty string id')
    }
    if (ids.has(opening.id)) {
      fail(`Duplicate opening id in openings.json: ${opening.id}`)
    }
    ids.add(opening.id)
  }
}

function buildOpeningsIndex(openings) {
  const byKey = new Map()

  for (const opening of openings) {
    const id = opening.id
    const keys = new Set()

    keys.add(normalizeToken(id))
    keys.add(normalizeToken(opening.name ?? ''))

    if (typeof opening.eco === 'string' && opening.eco.trim()) {
      keys.add(normalizeToken(opening.eco))
    }

    if (Array.isArray(opening.tags)) {
      for (const tag of opening.tags) {
        if (typeof tag === 'string' && tag.trim()) {
          keys.add(normalizeToken(tag))
        }
      }
    }

    const tokenSources = [opening.id, opening.name ?? '', opening.eco ?? '', ...(opening.tags ?? [])]
    for (const source of tokenSources) {
      if (typeof source !== 'string') {
        continue
      }
      for (const token of tokenize(source)) {
        keys.add(token)
      }
    }

    for (const key of keys) {
      if (!key) {
        continue
      }
      const current = byKey.get(key) ?? new Set()
      current.add(id)
      byKey.set(key, current)
    }
  }

  const sortedKeys = [...byKey.keys()].sort((a, b) => a.localeCompare(b))
  const result = {}

  for (const key of sortedKeys) {
    const ids = [...(byKey.get(key) ?? [])].sort((a, b) => a.localeCompare(b))
    result[key] = ids
  }

  return result
}

async function copyBooks({ sourceDir, destinationDir, binFiles, dryRun }) {
  await ensureDirectoryExists(destinationDir)

  const existingDestination = await listBinFiles(destinationDir)
  const sourceSet = new Set(binFiles)
  const stale = existingDestination.filter((name) => !sourceSet.has(name))

  if (!dryRun) {
    for (const staleName of stale) {
      await fs.unlink(path.join(destinationDir, staleName))
    }
    for (const fileName of binFiles) {
      await fs.copyFile(path.join(sourceDir, fileName), path.join(destinationDir, fileName))
    }
  }

  return { copied: binFiles.length, deleted: stale.length }
}

async function writeJson(filePath, value, dryRun) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`
  if (dryRun) {
    return
  }
  await fs.writeFile(filePath, serialized, 'utf8')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const cwd = process.cwd()

  const sourceDir = path.resolve(cwd, options.source)
  const destinationDir = path.resolve(cwd, options.destination)
  const openingsPath = path.resolve(cwd, options.openings)
  const booksIndexPath = path.resolve(cwd, options.booksIndex)
  const openingsIndexPath = path.resolve(cwd, options.openingsIndex)

  const sourceStat = await fs.stat(sourceDir).catch(() => null)
  if (!sourceStat || !sourceStat.isDirectory()) {
    fail(`Source directory does not exist: ${sourceDir}`)
  }

  const binFiles = await listBinFiles(sourceDir)
  if (binFiles.length === 0) {
    fail(`No .bin books found in source directory: ${sourceDir}`)
  }

  const validations = []
  for (const fileName of binFiles) {
    const fullPath = path.join(sourceDir, fileName)
    const report = await validatePolyglotFile(fullPath)
    validations.push({ fileName, ...report })
  }

  const booksIndex = buildBooksIndex(binFiles)
  const openings = await readJson(openingsPath)
  validateOpenings(openings)

  const openingIds = new Set(openings.map((entry) => entry.id))
  const bookIds = Object.keys(booksIndex)
  const missingInOpenings = bookIds.filter((id) => !openingIds.has(id))
  const staleInOpenings = [...openingIds].filter((id) => !Object.prototype.hasOwnProperty.call(booksIndex, id))

  if (options.strict && (missingInOpenings.length > 0 || staleInOpenings.length > 0)) {
    const lines = [
      'Books/Openings mismatch in strict mode.',
      `Missing in openings.json (${missingInOpenings.length}): ${missingInOpenings.join(', ') || '-'}`,
      `Stale openings without book (${staleInOpenings.length}): ${staleInOpenings.join(', ') || '-'}`
    ]
    fail(lines.join('\n'))
  }

  const openingsIndex = buildOpeningsIndex(openings)
  const copyReport = await copyBooks({
    sourceDir,
    destinationDir,
    binFiles,
    dryRun: options.dryRun
  })

  await writeJson(booksIndexPath, booksIndex, options.dryRun)
  await writeJson(openingsIndexPath, openingsIndex, options.dryRun)

  const totalEntries = validations.reduce((sum, report) => sum + report.entries, 0)
  const totalBytes = validations.reduce((sum, report) => sum + report.size, 0)

  console.log(`Import complete${options.dryRun ? ' (dry-run)' : ''}.`)
  console.log(`Books validated: ${validations.length}`)
  console.log(`Total polyglot entries: ${totalEntries}`)
  console.log(`Total bytes: ${totalBytes}`)
  console.log(`Copied books: ${copyReport.copied}`)
  console.log(`Removed stale books: ${copyReport.deleted}`)
  console.log(`books.index entries: ${Object.keys(booksIndex).length}`)
  console.log(`openings.index keys: ${Object.keys(openingsIndex).length}`)
  if (missingInOpenings.length > 0 || staleInOpenings.length > 0) {
    console.log(`Mismatch summary: missingInOpenings=${missingInOpenings.length}, staleInOpenings=${staleInOpenings.length}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
