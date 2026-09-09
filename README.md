# powerbi-dashboard-portal
Company Power BI Dashboard Portal

## Admin management

Run with Node.js 22 or newer. In PowerShell:

```powershell
$env:ADMIN_PASSWORD = 'your-unique-admin-password'
npm start
```

Choose an admin password of at least 12 characters, different from the existing user password. Open `http://localhost:3000/login.html`. Both roles use this same password-only login screen, with no username or role selector. The admin password enables editing directly on the dashboard page; the existing user password opens the normal viewing interface with no editing controls. Log out to switch roles. The old `admin.html` address redirects to the portal.

When logged in as admin, the dashboard page shows the dashboard form and cards with Edit, Delete, Publish / Hide, and Move up / Move down controls. Admins see all drafts, hidden, and published dashboards. New dashboards default to Draft. Add an HTTPS Power BI report or embed link before publishing. Users see published entries in saved order across the portal, viewer, snapshot page, and slideshow. Existing placeholder entries are retained during initial migration. Power BI permissions still apply to secure reports. Snapshot capture uses the saved published configuration when available.

Changes persist in `data/dashboards.json`, initialized from `js/dashboard-config.js` on first start. Back up this file. `DATA_DIR` can point to a persistent storage directory. Use a single server instance; admin sessions expire after eight hours or a restart. Concurrent edits are rejected until the administrator reloads.

Deploy the Node server to use admin management for all viewers; GitHub Pages/static hosting cannot run the admin API or persist edits. Serve production traffic over HTTPS and set `COOKIE_SECURE=true` behind your HTTPS proxy. Set `PORT` to override port 3000. Keep `ADMIN_PASSWORD` in the hosting environment, outside source control.

The server verifies both passwords and assigns a role in an HttpOnly session cookie. Admin writes reject user sessions, with login rate limiting and request-origin checks. Sessions expire after eight hours or a server restart. Static hosting retains only the lightweight user login described below. Published dashboard links and snapshot assets remain publicly served; hiding does not revoke external Power BI permissions or remove previously generated snapshot files.

## Shared Password Access

This GitHub Pages site uses a lightweight client-side password screen before the dashboard portal loads. It is intended only as a casual access barrier. Because GitHub Pages is static hosting, this is not strong server-side security and it does not hide files from someone who inspects the public repository or site source.

The password hash is configured in `js/auth-config.js`. The original password is not stored in the repository.

To generate a new password hash:

```bash
npm run auth:hash -- "your new password"
```

Copy the generated hash into `js/auth-config.js`:

```js
passwordHash: "paste-new-sha256-hash-here"
```

By default, login is saved only for the current browser/tab session. After the browser or tab is closed, the next visit asks for the password again. This is controlled by `storageType: "session"` in `js/auth-config.js`.

To keep a Smart TV logged in for a longer time, change `storageType` to `"local"` and set `sessionDurationDays`, for example `30`.

To logout or reset a TV session, use the `Logout` button on the dashboard, TV Preview, slideshow, or live viewer page. You can also clear the browser site data for the GitHub Pages site.
