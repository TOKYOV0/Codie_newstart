# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:


## React Compiler

## Fieldnotes

A local-business prospecting workspace with Places search, a lead pipeline, a clickable map, and Google Sheets sync.

## Start locally

1. Create `.env` in this folder. The app supports Google Maps discovery plus internet-wide website discovery through Google Programmable Search:

	```env
	GOOGLE_MAPS_API_KEY=your_places_api_key
	GOOGLE_CSE_API_KEY=your_google_custom_search_api_key
	GOOGLE_CSE_ID=your_programmable_search_engine_id
	PORT=3001
	```

	Enable Places API (New) and billing for Google Maps discovery. Create a Google Programmable Search Engine and Custom Search JSON API credentials for internet discovery. Keep all keys server-side.
2. Run `npm install`.
3. Run `npm run dev` and open the Vite URL shown in the terminal.

The development command starts Express and Vite together. Live search needs the API key; the map uses OpenStreetMap tiles and coordinates returned by Places.

## Deploy the Google Apps Script

The complete script is in [`google-apps-script/Code.gs`](google-apps-script/Code.gs).

1. Open [script.google.com](https://script.google.com), create a project, replace its starter code with `Code.gs`, and save.
2. In **Project Settings → Script Properties**, optionally add `ADMIN_INVITE_CODE`. The first account can register without an invite; later accounts need this code.
3. Select **Deploy → New deployment → Web app**. Set **Execute as** to your account and **Who has access** to **Anyone**, authorize the Google Sheets permissions, deploy, and copy the URL ending in `/exec`.
4. Paste the web app URL into Fieldnotes sign-in. On first registration, the script creates a separate private `Fieldnotes Accounts - Private` spreadsheet for salted password hashes and expiring session hashes, never plaintext passwords.
5. Create or choose the leads spreadsheet, paste its URL into the Google Sheets panel, and click **Sync leads**. The script adds the requested 26 headers and updates rows by Lead ID.

The Apps Script deployment must be accessible as **Anyone** so the server can call it; access to app data is enforced by session tokens. Keep the account spreadsheet private.

## Notes

- Redux Persist remembers the signed-in session in this browser; sign out removes it. Sessions expire after 30 days.
- Lead edits are kept in this browser until synced. Google Places does not supply email addresses or contact names, so those fields remain editable.
- Review Google Maps Platform Places policies for storage, attribution, and retention before using Places results in a production CRM.
- For production, serve over HTTPS and use secure, HttpOnly cookies instead of browser storage for session tokens.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## One-click lead discovery

The search panel now has:
- **Number of leads**: request 1–200 leads.
- **Discovery sources**: Google Maps, Internet/websites, or both.
- **Find & sync leads**: one button runs discovery and automatically syncs the returned rows to the configured Google Sheet.
- **Pagination**: Google Maps is paged automatically (up to 60 Places results per run); internet search fills the remaining requested count when a web-search key is configured.
- **Deduplication**: results are de-duplicated before being sent to the sheet.

The internet source uses Google Programmable Search results. It is not literally a crawl of the entire public internet; it searches the web index available to the configured search engine. Search-provider quotas and Google Maps Platform storage/attribution policies still apply.
