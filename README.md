# powerbi-dashboard-portal
Company Power BI Dashboard Portal

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
