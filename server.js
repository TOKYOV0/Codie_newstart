import 'dotenv/config'
import express from 'express'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = Number(process.env.PORT || 3001)
const appDirectory = path.dirname(fileURLToPath(import.meta.url))
const placesApiKey = process.env.GOOGLE_MAPS_API_KEY
const webSearchApiKey = process.env.GOOGLE_CSE_API_KEY
const webSearchEngineId = process.env.GOOGLE_CSE_ID
const authScriptUrl = process.env.AUTH_SCRIPT_URL || ''

app.use(express.json({ limit: '2mb' }))

function validScriptUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && parsed.hostname === 'script.google.com' && /^\/macros\/s\/[^/]+\/exec$/.test(parsed.pathname)
  } catch {
    return false
  }
}

function validSpreadsheetUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && parsed.hostname === 'docs.google.com' && /^\/spreadsheets\/d\/[^/]+/.test(parsed.pathname)
  } catch {
    return false
  }
}

function requireAuthScriptUrl() {
  if (!validScriptUrl(authScriptUrl)) throw new Error('Sign-in is not configured on this server yet. Ask the site owner to set AUTH_SCRIPT_URL in the server .env file.')
  return authScriptUrl
}

async function callAppsScript(scriptUrl, payload) {
  if (!validScriptUrl(scriptUrl)) throw new Error('Enter a valid deployed Apps Script web app URL.')
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  })
  const responseText = await response.text()
  let result
  try {
    result = JSON.parse(responseText)
  } catch {
    throw new Error('Apps Script returned an unexpected response. Confirm the deployment is active and accessible to anyone.')
  }
  if (!response.ok || result.error) throw new Error(result.error || `Apps Script returned HTTP ${response.status}.`)
  return result
}

async function verifySession(scriptUrl, token) {
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  const result = await callAppsScript(scriptUrl, { action: 'validate', token })
  if (!result.user) throw new Error('Your session has expired. Please sign in again.')
  return result.user
}

function makeId(prefix, value) {
  return `${prefix}-${createHash('sha1').update(String(value)).digest('hex').slice(0, 20)}`
}

function normaliseUrl(value) {
  try {
    const url = new URL(value)
    return `${url.protocol}//${url.hostname}${url.pathname}`.replace(/\/$/, '').toLowerCase()
  } catch {
    return String(value || '').toLowerCase()
  }
}

function titleToBusinessName(title = '') {
  return String(title)
    .replace(/\s*[|·—–-]\s*(official website|home|homepage|official site).*$/i, '')
    .replace(/\s*[|·—–-]\s*.*$/i, '')
    .trim()
    .slice(0, 180)
}

async function searchGoogleMaps(keyword, location, target) {
  if (!placesApiKey) return []
  const leads = []
  let pageToken = ''
  const maxPages = Math.min(3, Math.ceil(target / 20))

  for (let page = 0; page < maxPages && leads.length < target; page += 1) {
    const body = {
      textQuery: location ? `${keyword} in ${location}` : keyword,
      pageSize: Math.min(20, target - leads.length),
    }
    if (pageToken) body.pageToken = pageToken

    const placesResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': placesApiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.primaryTypeDisplayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,nextPageToken',
      },
      body: JSON.stringify(body),
    })
    const placesResult = await placesResponse.json()
    if (!placesResponse.ok) {
      throw new Error(placesResult.error?.message || 'Google Places search failed.')
    }

    const dateFound = new Date().toISOString().slice(0, 10)
    for (const place of placesResult.places || []) {
      if (leads.length >= target) break
      leads.push({
        'Lead ID': place.id,
        'Date Found': dateFound,
        'Search Niche/Keyword': keyword,
        'Business Name': place.displayName?.text || '',
        'Google Maps Category': place.primaryTypeDisplayName?.text || '',
        'City / Area': location || place.formattedAddress || '',
        'Full Address': place.formattedAddress || '',
        Latitude: place.location?.latitude ?? '',
        Longitude: place.location?.longitude ?? '',
        'Phone Number': place.nationalPhoneNumber || '',
        Email: '',
        'Contact Person': '',
        'Google Rating': place.rating ?? '',
        'Review Count': place.userRatingCount ?? '',
        'Existing Website URL': place.websiteUri || '',
        'Website Status': place.websiteUri ? 'Has website' : 'No website',
        'Social Media Link': '',
        'Lead Status': 'New',
        Priority: 'Medium',
        'Outreach Method': 'Not contacted',
        'First Contact Date': '',
        'Next Follow-up Date': '',
        'Assigned Marketing Rep': '',
        'Marketing Notes': '',
        'R&D Status': 'Not assessed',
        'Current Platform/Tech': '',
        'Upgrade Scope / Technical Notes': '',
        'Assigned R&D Person': '',
        'Discovery Source': 'Google Maps',
        _sample: false,
      })
    }
    pageToken = placesResult.nextPageToken || ''
    if (!pageToken) break
    // Google may require a short delay before a newly issued page token is usable.
    await new Promise((resolve) => setTimeout(resolve, 800))
  }
  return leads
}

async function searchWeb(keyword, location, target) {
  if (!webSearchApiKey || !webSearchEngineId || target <= 0) return []
  const leads = []
  const seen = new Set()
  const dateFound = new Date().toISOString().slice(0, 10)
  const query = location
    ? `${keyword} businesses companies websites ${location}`
    : `${keyword} businesses companies websites`
  const maxPages = Math.min(10, Math.ceil(target / 10))

  for (let page = 0; page < maxPages && leads.length < target; page += 1) {
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', webSearchApiKey)
    url.searchParams.set('cx', webSearchEngineId)
    url.searchParams.set('q', query)
    url.searchParams.set('num', '10')
    url.searchParams.set('start', String(page * 10 + 1))
    const webResponse = await fetch(url)
    const webResult = await webResponse.json()
    if (!webResponse.ok) {
      throw new Error(webResult.error?.message || 'Internet search failed.')
    }

    for (const item of webResult.items || []) {
      if (leads.length >= target) break
      const website = normaliseUrl(item.link)
      if (!website || seen.has(website)) continue
      seen.add(website)
      const host = (() => {
        try { return new URL(item.link).hostname.replace(/^www\./, '') } catch { return '' }
      })()
      leads.push({
        'Lead ID': makeId('web', website),
        'Date Found': dateFound,
        'Search Niche/Keyword': keyword,
        'Business Name': titleToBusinessName(item.title) || host,
        'Google Maps Category': '',
        'City / Area': location || 'Global web',
        'Full Address': '',
        Latitude: '',
        Longitude: '',
        'Phone Number': '',
        Email: '',
        'Contact Person': '',
        'Google Rating': '',
        'Review Count': '',
        'Existing Website URL': item.link || '',
        'Website Status': 'Has website',
        'Social Media Link': '',
        'Lead Status': 'New',
        Priority: 'Medium',
        'Outreach Method': 'Not contacted',
        'First Contact Date': '',
        'Next Follow-up Date': '',
        'Assigned Marketing Rep': '',
        'Marketing Notes': item.snippet || '',
        'R&D Status': 'Not assessed',
        'Current Platform/Tech': host,
        'Upgrade Scope / Technical Notes': 'Discovered from internet search',
        'Assigned R&D Person': '',
        'Discovery Source': 'Internet Search',
        _sample: false,
      })
    }

    if (!webResult.queries?.nextPage || !webResult.items?.length) break
  }
  return leads
}

function dedupeLeads(leads, target) {
  const seen = new Set()
  return leads.filter((lead) => {
    const key = lead['Lead ID'] || normaliseUrl(lead['Existing Website URL']) || lead['Business Name']
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, target)
}

app.post('/api/auth', async (request, response) => {
  try {
    const { action, email, password, inviteCode } = request.body || {}
    if (!['login', 'register'].includes(action)) return response.status(400).json({ error: 'Choose sign in or create account.' })
    const result = await callAppsScript(requireAuthScriptUrl(), { action, email, password, inviteCode })
    response.json(result)
  } catch (error) {
    response.status(400).json({ error: error.message || 'Sign-in request failed.' })
  }
})

app.post('/api/leads/search', async (request, response) => {
  try {
    const { keyword, location, token } = request.body || {}
    const target = Math.min(200, Math.max(1, Number(request.body?.target) || 25))
    const source = ['all', 'maps', 'web'].includes(request.body?.source) ? request.body.source : 'all'
    if (!keyword?.trim()) return response.status(400).json({ error: 'Enter a search niche or keyword.' })
    if (source !== 'web' && !location?.trim()) return response.status(400).json({ error: 'Enter a city, country, or area for Google Maps discovery.' })
    await verifySession(requireAuthScriptUrl(), token)

    const sources = []
    let leads = []

    if (source === 'maps' || source === 'all') {
      if (!placesApiKey) {
        if (source === 'maps') throw new Error('Google Maps is not configured. Add GOOGLE_MAPS_API_KEY to .env.')
      } else {
        const mapsLeads = await searchGoogleMaps(keyword.trim(), location?.trim() || '', target)
        leads.push(...mapsLeads)
        if (mapsLeads.length) sources.push('Google Maps')
      }
    }

    if (source === 'web' || source === 'all') {
      const remaining = target - leads.length
      if (remaining > 0) {
        if (!webSearchApiKey || !webSearchEngineId) {
          if (source === 'web') throw new Error('Internet discovery is not configured. Add GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID to .env.')
        } else {
          const webLeads = await searchWeb(keyword.trim(), location?.trim() || '', remaining)
          leads.push(...webLeads)
          if (webLeads.length) sources.push('Internet Search')
        }
      }
    }

    leads = dedupeLeads(leads, target)
    if (!leads.length) {
      throw new Error('No leads were found. Check your API keys, query, location, or search quota.')
    }
    response.json({ leads, sources })
  } catch (error) {
    response.status(error.message?.includes('session') ? 401 : 400).json({ error: error.message || 'Search request failed.' })
  }
})

app.post('/api/leads/sync', async (request, response) => {
  try {
    const { spreadsheetUrl, token, leads } = request.body || {}
    if (!validSpreadsheetUrl(spreadsheetUrl)) return response.status(400).json({ error: 'Enter a valid Google Sheets spreadsheet URL.' })
    if (!Array.isArray(leads) || leads.length === 0) return response.status(400).json({ error: 'There are no live leads to sync.' })
    const scriptUrl = requireAuthScriptUrl()
    await verifySession(scriptUrl, token)
    const result = await callAppsScript(scriptUrl, { action: 'sync', token, spreadsheetUrl, leads })
    response.json(result)
  } catch (error) {
    response.status(error.message?.includes('session') ? 401 : 400).json({ error: error.message || 'Google Sheets sync failed.' })
  }
})

app.get('/api/health', (_request, response) => response.json({ ok: true }))

const staticDirectory = path.join(appDirectory, 'dist')
app.use(express.static(staticDirectory))
app.get(/.*/, async (_request, response) => {
  try {
    response.type('html').send(await readFile(path.join(staticDirectory, 'index.html')))
  } catch {
    response.status(404).send('Build the frontend with npm run build first.')
  }
})

app.listen(port, () => {
  console.log(`Fieldnotes API listening on http://localhost:${port}`)
  if (!authScriptUrl) console.warn('AUTH_SCRIPT_URL is not set; sign-in, registration, and Google Sheets sync are disabled until it is configured in .env.')
  if (!placesApiKey) console.warn('GOOGLE_MAPS_API_KEY is not set; Google Maps discovery is disabled.')
  if (!webSearchApiKey || !webSearchEngineId) console.warn('GOOGLE_CSE_API_KEY/GOOGLE_CSE_ID are not set; Internet discovery is disabled.')
})
