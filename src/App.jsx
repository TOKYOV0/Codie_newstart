import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  Filter,
  Globe2,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MapPin,
  MapPinned,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sheet,
  SlidersHorizontal,
  Sparkles,
  Target,
  UsersRound,
  X,
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { authActions } from './store'
import LeadMap from './LeadMap'
import LoginPage from './LoginPage'
import './App.css'

const FIELDS = [
  'Lead ID', 'Date Found', 'Search Niche/Keyword', 'Business Name', 'Google Maps Category',
  'City / Area', 'Full Address', 'Phone Number', 'Email', 'Contact Person', 'Google Rating',
  'Review Count', 'Existing Website URL', 'Website Status', 'Social Media Link', 'Lead Status',
  'Priority', 'Outreach Method', 'First Contact Date', 'Next Follow-up Date',
  'Assigned Marketing Rep', 'Marketing Notes', 'R&D Status', 'Current Platform/Tech',
  'Upgrade Scope / Technical Notes', 'Assigned R&D Person', 'Latitude', 'Longitude',
]

const SELECT_OPTIONS = {
  'Website Status': ['Has website', 'No website', 'Needs review'],
  'Lead Status': ['New', 'Qualified', 'Contacted', 'Follow-up', 'Won', 'Not interested'],
  Priority: ['High', 'Medium', 'Low'],
  'Outreach Method': ['Email', 'Phone', 'Social', 'In person', 'Not contacted'],
  'R&D Status': ['Not assessed', 'Researching', 'Proposal ready', 'In progress', 'Complete'],
}

const seedLeads = [
  { 'Lead ID': 'sample-01', 'Date Found': '2026-09-22', 'Search Niche/Keyword': 'independent bakery', 'Business Name': 'Flour & Finch Bakery', 'Google Maps Category': 'Bakery', 'City / Area': 'Brooklyn, NY', 'Full Address': '218 Wythe Ave, Brooklyn, NY 11249', Latitude: 40.7215, Longitude: -73.958, 'Phone Number': '(718) 555-0138', Email: 'hello@flourandfinch.example', 'Contact Person': '', 'Google Rating': '4.8', 'Review Count': '286', 'Existing Website URL': 'https://flourandfinch.example', 'Website Status': 'Has website', 'Social Media Link': '', 'Lead Status': 'New', Priority: 'High', 'Outreach Method': 'Not contacted', 'First Contact Date': '', 'Next Follow-up Date': '', 'Assigned Marketing Rep': '', 'Marketing Notes': '', 'R&D Status': 'Not assessed', 'Current Platform/Tech': 'Squarespace', 'Upgrade Scope / Technical Notes': '', 'Assigned R&D Person': '', _sample: true },
  { 'Lead ID': 'sample-02', 'Date Found': '2026-09-22', 'Search Niche/Keyword': 'independent bakery', 'Business Name': 'Juniper Crumb', 'Google Maps Category': 'Bakery', 'City / Area': 'Brooklyn, NY', 'Full Address': '91 Atlantic Ave, Brooklyn, NY 11201', Latitude: 40.689, Longitude: -73.995, 'Phone Number': '(718) 555-0172', Email: '', 'Contact Person': '', 'Google Rating': '4.6', 'Review Count': '154', 'Existing Website URL': '', 'Website Status': 'No website', 'Social Media Link': '', 'Lead Status': 'Qualified', Priority: 'High', 'Outreach Method': 'Not contacted', 'First Contact Date': '', 'Next Follow-up Date': '', 'Assigned Marketing Rep': '', 'Marketing Notes': 'No website listed on Maps', 'R&D Status': 'Not assessed', 'Current Platform/Tech': '', 'Upgrade Scope / Technical Notes': '', 'Assigned R&D Person': '', _sample: true },
  { 'Lead ID': 'sample-03', 'Date Found': '2026-09-21', 'Search Niche/Keyword': 'independent bakery', 'Business Name': 'Sunday Sourdough Co.', 'Google Maps Category': 'Bakery', 'City / Area': 'Queens, NY', 'Full Address': '44-18 23rd St, Queens, NY 11101', Latitude: 40.747, Longitude: -73.946, 'Phone Number': '(718) 555-0191', Email: '', 'Contact Person': '', 'Google Rating': '4.9', 'Review Count': '412', 'Existing Website URL': 'https://sundaysourdough.example', 'Website Status': 'Has website', 'Social Media Link': '', 'Lead Status': 'Contacted', Priority: 'Medium', 'Outreach Method': 'Email', 'First Contact Date': '2026-09-20', 'Next Follow-up Date': '2026-09-28', 'Assigned Marketing Rep': 'Jordan Lee', 'Marketing Notes': 'Interested in online ordering', 'R&D Status': 'Researching', 'Current Platform/Tech': 'Wix', 'Upgrade Scope / Technical Notes': '', 'Assigned R&D Person': '', _sample: true },
  { 'Lead ID': 'sample-04', 'Date Found': '2026-09-20', 'Search Niche/Keyword': 'independent bakery', 'Business Name': 'Little Hearth Bakehouse', 'Google Maps Category': 'Bakery', 'City / Area': 'Brooklyn, NY', 'Full Address': '603 Vanderbilt Ave, Brooklyn, NY 11238', Latitude: 40.681, Longitude: -73.968, 'Phone Number': '(718) 555-0124', Email: '', 'Contact Person': '', 'Google Rating': '4.4', 'Review Count': '97', 'Existing Website URL': 'https://littlehearth.example', 'Website Status': 'Has website', 'Social Media Link': '', 'Lead Status': 'Follow-up', Priority: 'Medium', 'Outreach Method': 'Phone', 'First Contact Date': '2026-09-18', 'Next Follow-up Date': '2026-09-26', 'Assigned Marketing Rep': 'Morgan Chen', 'Marketing Notes': 'Site is not mobile-friendly', 'R&D Status': 'Not assessed', 'Current Platform/Tech': 'WordPress', 'Upgrade Scope / Technical Notes': '', 'Assigned R&D Person': '', _sample: true },
  { 'Lead ID': 'sample-05', 'Date Found': '2026-09-19', 'Search Niche/Keyword': 'independent bakery', 'Business Name': 'Morrow Bake Shop', 'Google Maps Category': 'Bakery', 'City / Area': 'Brooklyn, NY', 'Full Address': '150 Court St, Brooklyn, NY 11201', Latitude: 40.684, Longitude: -73.993, 'Phone Number': '(718) 555-0166', Email: '', 'Contact Person': '', 'Google Rating': '4.7', 'Review Count': '203', 'Existing Website URL': 'https://morrowbakes.example', 'Website Status': 'Has website', 'Social Media Link': '', 'Lead Status': 'New', Priority: 'Low', 'Outreach Method': 'Not contacted', 'First Contact Date': '', 'Next Follow-up Date': '', 'Assigned Marketing Rep': '', 'Marketing Notes': '', 'R&D Status': 'Not assessed', 'Current Platform/Tech': '', 'Upgrade Scope / Technical Notes': '', 'Assigned R&D Person': '', _sample: true },
]

const readSaved = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function App() {
  const auth = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const [leads, setLeads] = useState(() => readSaved('fieldnotes.leads', seedLeads))
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(() => readSaved('fieldnotes.sheet', ''))
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [leadTarget, setLeadTarget] = useState(25)
  const [sourceMode, setSourceMode] = useState('all')
  const [textFilter, setTextFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [priorityFilter, setPriorityFilter] = useState('All priorities')
  const [isSearching, setIsSearching] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [selectedLead, setSelectedLead] = useState(() => readSaved('fieldnotes.selectedLead', seedLeads[0]))
  const [notice, setNotice] = useState({ text: '', type: '' })
  const [lastSynced, setLastSynced] = useState(() => readSaved('fieldnotes.synced', ''))

  useEffect(() => localStorage.setItem('fieldnotes.leads', JSON.stringify(leads)), [leads])
  useEffect(() => localStorage.setItem('fieldnotes.sheet', JSON.stringify(spreadsheetUrl)), [spreadsheetUrl])
  useEffect(() => localStorage.setItem('fieldnotes.selectedLead', JSON.stringify(selectedLead)), [selectedLead])

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const query = textFilter.trim().toLowerCase()
    const matchesText = !query || FIELDS.some((field) => String(lead[field] ?? '').toLowerCase().includes(query))
    const matchesStatus = statusFilter === 'All statuses' || lead['Lead Status'] === statusFilter
    const matchesPriority = priorityFilter === 'All priorities' || lead.Priority === priorityFilter
    return matchesText && matchesStatus && matchesPriority
  }), [leads, textFilter, statusFilter, priorityFilter])

  const liveLeads = leads.filter((lead) => !lead._sample)
  const followUps = liveLeads.filter((lead) => lead['Next Follow-up Date']).length
  const highPriority = liveLeads.filter((lead) => lead.Priority === 'High').length
  const showNotice = (text, type = 'error') => setNotice({ text, type })

  async function syncLeadRows(rows) {
    if (!spreadsheetUrl.trim() || !rows.length) return null
    const response = await fetch('/api/leads/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadsheetUrl: spreadsheetUrl.trim(), token: auth.token, leads: rows.map(toSheetRow) }),
    })
    const result = await response.json()
    if (!response.ok || result.error) throw new Error(result.error || 'Google Sheets sync failed.')
    const syncedAt = new Date().toISOString()
    setLastSynced(syncedAt)
    localStorage.setItem('fieldnotes.synced', JSON.stringify(syncedAt))
    return result
  }

  async function searchMaps(event) {
    event.preventDefault()
    if (!keyword.trim()) {
      showNotice('Add a niche or keyword to start a search.')
      return
    }
    if (!location.trim() && sourceMode !== 'web') {
      showNotice('Add a city, country, or area for location-based discovery.')
      return
    }
    setIsSearching(true)
    setNotice({ text: '', type: '' })
    try {
      const response = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim(),
          target: Math.min(200, Math.max(1, Number(leadTarget) || 25)),
          source: sourceMode,
          token: auth.token,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Search failed. Check your search API setup.')
      const found = result.leads ?? []
      if (found.length) setSelectedLead(found[0])
      setLeads((current) => {
        const existing = new Map(current.filter((lead) => !lead._sample).map((lead) => [lead['Lead ID'], lead]))
        return [...found.map((lead) => ({ ...lead, ...existing.get(lead['Lead ID']), _sample: false })), ...current.filter((lead) => !lead._sample && !found.some((item) => item['Lead ID'] === lead['Lead ID']))]
      })

      let syncedText = ''
      if (found.length && spreadsheetUrl.trim()) {
        const syncResult = await syncLeadRows(found)
        syncedText = ` ${syncResult?.synced ?? found.length} rows synced to Google Sheets.`
      } else if (found.length) {
        syncedText = ' Connect Google Sheets below to make this a one-click search-and-sync.'
      }

      const sourceLabel = result.sources?.length ? result.sources.join(' + ') : 'web'
      showNotice(`${found.length} ${found.length === 1 ? 'lead' : 'leads'} found from ${sourceLabel}.${syncedText}`, 'success')
    } catch (error) {
      showNotice(error.message)
    } finally {
      setIsSearching(false)
    }
  }

  async function syncSpreadsheet() {
    if (!spreadsheetUrl.trim()) {
      showNotice('Add your Google Sheet URL first.')
      return
    }
    if (!liveLeads.length) {
      showNotice('Search for leads first. Preview rows are not synced.')
      return
    }
    setIsSyncing(true)
    setNotice({ text: '', type: '' })
    try {
      const result = await syncLeadRows(liveLeads)
      showNotice(`${result?.synced ?? liveLeads.length} leads synced to Google Sheets.`, 'success')
    } catch (error) {
      showNotice(`Could not sync. Check the Apps Script deployment and spreadsheet access. ${error.message}`, 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  function exportCsv() {
    const csv = [FIELDS, ...filteredLeads.map((lead) => FIELDS.map((field) => lead[field] ?? ''))]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'fieldnotes-leads.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function saveLead(event) {
    event.preventDefault()
    const updated = Object.fromEntries(new FormData(event.currentTarget).entries())
    setLeads((current) => current.map((lead) => lead['Lead ID'] === updated['Lead ID'] ? { ...lead, ...updated } : lead))
    setEditingLead(null)
    showNotice('Lead updated.', 'success')
  }

  const allSample = leads.every((lead) => lead._sample)

  if (!auth.token || !auth.user) {
    return <LoginPage onLogin={(session) => dispatch(authActions.signedIn(session))} />
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Fieldnotes home">
          <span className="brand-mark"><MapPinned size={19} strokeWidth={2.1} /></span>
          <span>fieldnotes<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-switch">
          <span className="workspace-avatar">S</span>
          <span className="workspace-name">Studio North<small>Lead workspace</small></span>
          <ChevronDown size={15} />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav className="main-nav" aria-label="Workspace">
          <a className="nav-item nav-item-active" href="#leads"><LayoutDashboard size={17} /> Lead pipeline <span>{liveLeads.length || '—'}</span></a>
          <a className="nav-item" href="#search"><MapPin size={17} /> Find businesses</a>
          <a className="nav-item" href="#map"><MapPinned size={17} /> Lead map</a>
          <a className="nav-item" href="#integrations"><Sheet size={17} /> Integrations</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="quota-card">
            <span className="quota-icon"><Target size={16} /></span>
            <div><strong>Good leads start local.</strong><p>Find your next best client.</p></div>
            <div className="quota-line"><span /></div>
            <small>{liveLeads.length} live leads in this workspace</small>
          </div>
          <button type="button" className="nav-item help-link" onClick={() => showNotice('Ask your workspace admin to add the Google Maps and search API keys on the server to enable live discovery.', 'info')}><CircleHelp size={17} /> Help & setup</button>
          <div className="user-profile"><span className="user-avatar">{auth.user.email.slice(0, 1).toUpperCase()}</span><span>{auth.user.email}<small>Marketing team</small></span><button type="button" className="signout-button" aria-label="Sign out" title="Sign out" onClick={() => dispatch(authActions.signedOut())}><LogOut size={16} /></button></div>
        </div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar">
          <div className="breadcrumb">Workspace <ChevronRight size={14} /> <strong>Lead pipeline</strong></div>
          <div className="topbar-actions"><span className="connection-state"><span /> Workspace saved</span><button type="button" className="icon-button" aria-label="Workspace settings" title="Workspace settings" onClick={() => document.getElementById('sheet-url')?.focus()}><Settings2 size={18} /></button><button type="button" className="icon-button" aria-label="Sign out" title="Sign out" onClick={() => dispatch(authActions.signedOut())}><LogOut size={16} /></button><span className="user-avatar top-avatar" aria-label={auth.user.email}>{auth.user.email.slice(0, 1).toUpperCase()}</span></div>
        </header>

        <div className="page-content">
          <section className="page-heading" id="leads">
            <div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR LOCAL PROSPECTING DESK</div><h1>Lead pipeline<span>.</span></h1><p>Discover local businesses, spot opportunities, and keep your outreach moving.</p></div>
            <button type="button" className="button button-secondary export-button" onClick={exportCsv}><ArrowDownToLine size={16} /> Export CSV</button>
          </section>

          <section className="search-panel" id="search">
            <div className="search-panel-heading"><div className="search-heading-icon"><MapPin size={18} /></div><div><h2>Find leads from the internet</h2><p>Set a lead count, choose your sources, and run the whole discovery + Google Sheets workflow in one click.</p></div><span className="places-badge"><span /> MAPS + WEB</span></div>
            <form className="search-form" onSubmit={searchMaps}>
              <label className="search-field"><span>NICHE OR KEYWORD</span><div><Search size={17} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="e.g. web design agency" /></div></label>
              <label className="search-field location-field"><span>CITY, COUNTRY OR AREA</span><div><MapPin size={17} /><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Delhi, India · leave blank for web" /></div></label>
              <label className="search-field"><span>NUMBER OF LEADS</span><div><Target size={16} /><input type="number" min="1" max="200" value={leadTarget} onChange={(event) => setLeadTarget(Math.min(200, Math.max(1, Number(event.target.value) || 1)))} /></div></label>
              <label className="search-field"><span>DISCOVERY SOURCES</span><div><Globe2 size={16} /><select className="search-select" value={sourceMode} onChange={(event) => setSourceMode(event.target.value)}><option value="all">Google Maps + Internet</option><option value="maps">Google Maps</option><option value="web">Internet / websites</option></select></div></label>
              <button type="submit" className="button button-primary search-submit" disabled={isSearching}>{isSearching ? <LoaderCircle size={17} className="spin" /> : <Sparkles size={17} />}{isSearching ? 'Finding & syncing…' : 'Find & sync leads'}<ArrowUpRight size={15} /></button>
            </form>
            <div className="search-footnote"><Sparkles size={14} /> One click searches the selected sources, targets your lead count, deduplicates results, and syncs them to your Google Sheet when connected.</div>
          </section>

          <section className="metrics-row" aria-label="Lead summary">
            <article className="metric"><span className="metric-icon metric-green"><UsersRound size={17} /></span><div><span className="metric-label">LIVE LEADS</span><strong>{liveLeads.length}</strong><small>{allSample ? 'No live searches yet' : 'Saved in this workspace'}</small></div></article>
            <article className="metric"><span className="metric-icon metric-blue"><Clock3 size={17} /></span><div><span className="metric-label">FOLLOW-UPS DUE</span><strong>{followUps}</strong><small>Leads with a follow-up date</small></div></article>
            <article className="metric"><span className="metric-icon metric-orange"><Target size={17} /></span><div><span className="metric-label">HIGH PRIORITY</span><strong>{highPriority}</strong><small>Ready for focused outreach</small></div></article>
            <div className="metrics-date"><span className="status-live" /> Local prospecting <span className="metrics-divider" /> {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}</div>
          </section>

          <section className="sheet-panel" id="integrations">
            <div className="sheet-heading"><span className="sheet-icon"><Sheet size={17} /></span><div><strong>Google Sheets</strong><small>{lastSynced ? `Last synced ${new Date(lastSynced).toLocaleString()}` : 'Connect a spreadsheet to keep your team in sync'}</small></div><span className={`sync-indicator ${lastSynced ? 'synced' : ''}`}><span />{lastSynced ? 'Connected' : 'Not connected'}</span></div>
            <label className="sheet-input"><span>SPREADSHEET URL</span><input id="sheet-url" type="url" value={spreadsheetUrl} onChange={(event) => setSpreadsheetUrl(event.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." /></label>
            <button type="button" className="button button-sync" onClick={syncSpreadsheet} disabled={isSyncing}><Sheet size={16} />{isSyncing ? 'Syncing…' : 'Sync leads'}{isSyncing ? <LoaderCircle size={15} className="spin" /> : <ArrowUpRight size={14} />}</button>
          </section>

          {notice.text && <div className={`notice notice-${notice.type}`} role="status"><span>{notice.type === 'success' ? <Check size={16} /> : <CircleHelp size={16} />}{notice.text}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice({ text: '', type: '' })}><X size={16} /></button></div>}

          <section className="leads-section">
            <div className="table-heading"><div><div className="table-title-row"><h2>All leads</h2><span className="lead-count">{filteredLeads.length}</span>{allSample && <span className="sample-badge">SAMPLE DATA</span>}</div><p>{allSample ? 'A few example records to get you oriented.' : 'Your prospects, all in one place.'}</p></div><button type="button" className="button button-quiet" onClick={exportCsv}><ArrowDownToLine size={15} /> Export</button></div>
            <div className="filter-toolbar">
              <label className="table-search"><Search size={16} /><input value={textFilter} onChange={(event) => setTextFilter(event.target.value)} placeholder="Search leads..." /><kbd>⌘ K</kbd></label>
              <label className="select-wrap"><Filter size={15} /><select aria-label="Filter by lead status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option>{SELECT_OPTIONS['Lead Status'].map((value) => <option key={value}>{value}</option>)}</select><ChevronDown size={13} /></label>
              <label className="select-wrap"><SlidersHorizontal size={15} /><select aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option>All priorities</option>{SELECT_OPTIONS.Priority.map((value) => <option key={value}>{value}</option>)}</select><ChevronDown size={13} /></label>
              {(textFilter || statusFilter !== 'All statuses' || priorityFilter !== 'All priorities') && <button className="clear-filters" type="button" onClick={() => { setTextFilter(''); setStatusFilter('All statuses'); setPriorityFilter('All priorities') }}><X size={13} /> Clear</button>}
              <button className="filter-icon-button" type="button" aria-label="Clear filters" title="Reset filters" onClick={() => { setTextFilter(''); setStatusFilter('All statuses'); setPriorityFilter('All priorities') }}><Settings2 size={16} /></button>
            </div>
            <div className="table-scroll"><table className="leads-table"><thead><tr><th className="check-col"><input type="checkbox" aria-label="Select all leads" onChange={(event) => showNotice(event.target.checked ? 'Bulk selection is ready for the next workflow.' : 'Selection cleared.', 'info')} /></th><th>BUSINESS NAME</th><th>LOCATION</th><th>RATING</th><th>WEBSITE</th><th>LEAD STATUS</th><th>PRIORITY</th><th>ADDED</th><th aria-label="Edit" /></tr></thead>
              <tbody>{filteredLeads.map((lead) => <tr key={lead['Lead ID']} onDoubleClick={() => setEditingLead(lead)}>
                <td className="check-col"><input type="checkbox" aria-label={`Select ${lead['Business Name']}`} /></td>
                <td><button type="button" className="business-cell" onClick={() => { setSelectedLead(lead); document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} aria-label={`Show ${lead['Business Name']} on map`}><span className="business-avatar" style={{ '--avatar-color': avatarColor(lead['Business Name']) }}>{lead['Business Name']?.trim().charAt(0) || '?'}</span><span><strong>{lead['Business Name']}</strong><small>{lead['Google Maps Category'] || 'Business'}{lead._sample ? ' · Sample' : ''}</small></span></button></td>
                <td className="location-cell"><span>{lead['City / Area']}</span><small>{lead['Full Address']}</small></td>
                <td><span className="rating"><span>★</span>{lead['Google Rating'] || '—'}<small>({lead['Review Count'] || 0})</small></span></td>
                <td>{lead['Existing Website URL'] ? <a className="website-link" href={safeUrl(lead['Existing Website URL'])} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}><Globe2 size={14} /> Live <ExternalLink size={11} /></a> : <span className="no-website">No website</span>}</td>
                <td><span className={`status-pill status-${slug(lead['Lead Status'] || 'New')}`}><span />{lead['Lead Status'] || 'New'}</span></td>
                <td><span className={`priority-label priority-${slug(lead.Priority || 'Medium')}`}><span />{lead.Priority || 'Medium'}</span></td>
                <td className="date-cell">{formatDate(lead['Date Found'])}</td>
                <td><button type="button" className="row-edit" aria-label={`Edit ${lead['Business Name']}`} title="Edit lead" onClick={() => setEditingLead(lead)}><Pencil size={15} /></button></td>
              </tr>)}</tbody></table>
              {filteredLeads.length === 0 && <div className="empty-state"><div className="empty-icon"><MapPinned size={22} /></div><h3>{leads.length ? 'No leads match those filters' : 'Your next client is out there'}</h3><p>{leads.length ? 'Try adjusting your search or filters.' : 'Search a niche and a location above to bring local businesses into your pipeline.'}</p></div>}
            </div>
            <div className="table-footer"><span>Showing <strong>{filteredLeads.length ? 1 : 0}–{filteredLeads.length}</strong> of <strong>{filteredLeads.length}</strong> leads</span><div className="pagination"><button type="button" aria-label="Previous page" disabled><ChevronLeft size={16} /></button><span>1</span><button type="button" aria-label="Next page" disabled><ChevronRight size={16} /></button></div><span className="footer-fields"><Plus size={13} /> {FIELDS.length} data fields</span></div>
          </section>
          <section className="map-section" id="map">
            <div className="map-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> GEOGRAPHIC VIEW</div><h2>Lead locations</h2><p>Select a business in the table or a marker to see its location.</p></div><span className="map-data-source"><MapPin size={14} /> Google Places coordinates</span></div>
            <LeadMap leads={filteredLeads} selectedLead={selectedLead} onSelect={setSelectedLead} />
          </section>
          <footer className="page-footer"><span>FIELDNOTES <span>·</span> LOCAL LEAD WORKSPACE</span><span>Search the web, organize, grow.</span></footer>
        </div>
      </main>

      {editingLead && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingLead(null) }}><section className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title"><header className="modal-header"><div><span className="modal-icon"><Pencil size={16} /></span><div><h2 id="edit-title">Edit lead</h2><p>Update business details and pipeline fields.</p></div></div><button type="button" className="icon-button" aria-label="Close dialog" onClick={() => setEditingLead(null)}><X size={19} /></button></header><form onSubmit={saveLead}><div className="modal-fields">{FIELDS.map((field) => <label key={field} className={field.includes('Notes') || field.includes('Technical Notes') ? 'modal-field wide-field' : 'modal-field'}><span>{field}</span>{SELECT_OPTIONS[field] ? <select name={field} defaultValue={editingLead[field] || SELECT_OPTIONS[field][0]}>{SELECT_OPTIONS[field].map((option) => <option key={option}>{option}</option>)}</select> : <input name={field} type={field.includes('Date') ? 'date' : field.includes('URL') || field.includes('Link') ? 'url' : 'text'} defaultValue={editingLead[field] || ''} readOnly={field === 'Lead ID'} />}</label>)}</div><div className="modal-footer"><button type="button" className="button button-secondary" onClick={() => setEditingLead(null)}>Cancel</button><button type="submit" className="button button-primary"><Check size={16} /> Save changes</button></div></form></section></div>}
    </div>
  )
}

function toSheetRow(lead) {
  return Object.fromEntries(FIELDS.map((field) => [field, lead[field] ?? '']))
}

function safeUrl(value) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

function slug(value) {
  return String(value || '').toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')
}

function avatarColor(name = '') {
  const colors = ['#e4eee8', '#e8e9f3', '#f4e8dc', '#e4edf2', '#efe6ef', '#eff0dd']
  return colors[name.charCodeAt(0) % colors.length]
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

export default App
