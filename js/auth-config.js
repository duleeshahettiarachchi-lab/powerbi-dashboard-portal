window.PORTAL_AUTH_CONFIG = {
  // Change the shared password by replacing this SHA-256 hash.
  // Generate a new hash with: npm run auth:hash -- "your new password"
  passwordHash: "703c7415d9bdded706f704ae2aa70a44f6fde495144884e8ea39639b28b0650c",
  // Use session storage so the password is requested again after the browser/tab session ends.
  // To keep a TV logged in for days, change storageType to "local" and set sessionDurationDays.
  storageType: "session",
  sessionDurationDays: 0,
  storageKey: "powerbi-dashboard-portal-auth"
};
