const LEAD_HEADERS = [
  'Lead ID', 'Date Found', 'Search Niche/Keyword', 'Business Name', 'Google Maps Category',
  'City / Area', 'Full Address', 'Phone Number', 'Email', 'Contact Person', 'Google Rating',
  'Review Count', 'Existing Website URL', 'Website Status', 'Social Media Link', 'Lead Status',
  'Priority', 'Outreach Method', 'First Contact Date', 'Next Follow-up Date',
  'Assigned Marketing Rep', 'Marketing Notes', 'R&D Status', 'Current Platform/Tech',
  'Upgrade Scope / Technical Notes', 'Assigned R&D Person', 'Latitude', 'Longitude', 'Discovery Source',
]

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || '{}')
    let result
    if (body.action === 'register') result = registerUser_(body)
    else if (body.action === 'login') result = loginUser_(body)
    else if (body.action === 'validate') result = { user: validateSession_(body.token) }
    else if (body.action === 'sync') result = syncLeads_(body)
    else throw new Error('Unsupported request.')
    return jsonResponse_(result)
  } catch (error) {
    return jsonResponse_({ error: error.message || 'Request failed.' })
  }
}

function registerUser_(body) {
  const email = normalizeEmail_(body.email)
  const password = String(body.password || '')
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.')
  if (password.length < 10) throw new Error('Use a password with at least 10 characters.')

  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const accounts = accountsSpreadsheet_()
    const usersSheet = accounts.getSheetByName('Users')
    const values = usersSheet.getDataRange().getValues()
    const users = values.slice(1).filter((row) => row[1])
    if (users.some((row) => normalizeEmail_(row[1]) === email)) throw new Error('An account with this email already exists.')
    if (users.length > 0) {
      const requiredCode = PropertiesService.getScriptProperties().getProperty('ADMIN_INVITE_CODE')
      if (!requiredCode || String(body.inviteCode || '') !== requiredCode) throw new Error('A valid workspace invite code is required. Ask your admin to set ADMIN_INVITE_CODE in Apps Script project settings.')
    }

    const salt = Utilities.getUuid() + Utilities.getUuid()
    usersSheet.appendRow([Utilities.getUuid(), email, salt, passwordHash_(salt, password), new Date().toISOString()])
    return createSession_(email)
  } finally {
    lock.releaseLock()
  }
}

function loginUser_(body) {
  const email = normalizeEmail_(body.email)
  const password = String(body.password || '')
  const usersSheet = accountsSpreadsheet_().getSheetByName('Users')
  const values = usersSheet.getDataRange().getValues()
  const account = values.slice(1).find((row) => normalizeEmail_(row[1]) === email)
  if (!account || passwordHash_(String(account[2]), password) !== String(account[3])) throw new Error('Email or password is incorrect.')
  return createSession_(email)
}

function createSession_(email) {
  const accounts = accountsSpreadsheet_()
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '')
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000
  accounts.getSheetByName('Sessions').appendRow([hashToken_(token), email, expiresAt, new Date().toISOString()])
  return { token: token, user: { email: email }, accountSpreadsheetUrl: accounts.getUrl() }
}

function validateSession_(token) {
  if (!token) throw new Error('Your session has expired. Please sign in again.')
  const sessions = accountsSpreadsheet_().getSheetByName('Sessions').getDataRange().getValues()
  const tokenHash = hashToken_(String(token))
  const session = sessions.slice(1).find((row) => String(row[0]) === tokenHash)
  if (!session || Number(session[2]) < Date.now()) throw new Error('Your session has expired. Please sign in again.')
  return { email: String(session[1]) }
}

function syncLeads_(body) {
  validateSession_(body.token)
  const spreadsheetUrl = String(body.spreadsheetUrl || '')
  if (!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(spreadsheetUrl)) throw new Error('Enter a valid Google Sheets URL.')
  if (!Array.isArray(body.leads) || body.leads.length === 0) throw new Error('There are no leads to sync.')

  const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl)
  const sheet = spreadsheet.getSheets()[0]
  let width = Math.max(sheet.getLastColumn(), LEAD_HEADERS.length)
  let headers = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, width).getDisplayValues()[0] : []
  while (headers.length < LEAD_HEADERS.length) headers.push('')
  LEAD_HEADERS.forEach((header) => {
    if (!headers.includes(header)) headers.push(header)
  })
  width = headers.length
  sheet.getRange(1, 1, 1, width).setValues([headers])
  sheet.setFrozenRows(1)

  const existingRows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues()
    : []
  const rowByLeadId = new Map()
  existingRows.forEach((row, index) => {
    const leadId = row[headers.indexOf('Lead ID')]
    if (leadId) rowByLeadId.set(String(leadId), { rowNumber: index + 2, values: row })
  })

  let inserted = 0
  let updated = 0
  body.leads.forEach((lead) => {
    if (!lead['Lead ID']) return
    const existing = rowByLeadId.get(String(lead['Lead ID']))
    const row = existing ? existing.values.slice() : new Array(width).fill('')
    headers.forEach((header, index) => {
      if (Object.prototype.hasOwnProperty.call(lead, header)) row[index] = lead[header]
    })
    const rowNumber = existing ? existing.rowNumber : sheet.getLastRow() + 1
    sheet.getRange(rowNumber, 1, 1, width).setValues([row])
    rowByLeadId.set(String(lead['Lead ID']), { rowNumber: rowNumber, values: row })
    if (existing) updated += 1
    else inserted += 1
  })

  return { synced: inserted + updated, inserted: inserted, updated: updated, spreadsheetUrl: spreadsheet.getUrl() }
}

function accountsSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties()
  let id = properties.getProperty('ACCOUNTS_SPREADSHEET_ID')
  let spreadsheet
  if (id) {
    spreadsheet = SpreadsheetApp.openById(id)
  } else {
    spreadsheet = SpreadsheetApp.create('Fieldnotes Accounts - Private')
    const users = spreadsheet.getSheets()[0]
    users.setName('Users')
    users.appendRow(['User ID', 'Email', 'Password Salt', 'Password SHA-256', 'Created At'])
    const sessions = spreadsheet.insertSheet('Sessions')
    sessions.appendRow(['Token SHA-256', 'Email', 'Expires At (ms)', 'Created At'])
    properties.setProperty('ACCOUNTS_SPREADSHEET_ID', spreadsheet.getId())
  }
  if (!spreadsheet.getSheetByName('Users') || !spreadsheet.getSheetByName('Sessions')) throw new Error('The private accounts spreadsheet is missing its Users or Sessions sheet.')
  return spreadsheet
}

function passwordHash_(salt, password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password, Utilities.Charset.UTF_8)
  return Utilities.base64Encode(digest)
}

function hashToken_(token) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token, Utilities.Charset.UTF_8)
  return Utilities.base64Encode(digest)
}

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase()
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON)
}
