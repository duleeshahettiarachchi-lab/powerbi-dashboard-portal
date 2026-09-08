window.PORTAL_AUTH_CONFIG = {
  // Change the shared password by replacing this SHA-256 hash.
  // Generate a new hash with: npm run auth:hash -- "your new password"
  passwordHash: "bd4eaf6c8bda3f1bd5289137b52276fde0a2cd9a8eb4c2ef5a797bd1513b86fb",
  // Use session storage so the password is requested again after the browser/tab session ends.
  // To keep a TV logged in for days, change storageType to "local" and set sessionDurationDays.
  storageType: "session",
  sessionDurationDays: 0,
  storageKey: "powerbi-dashboard-portal-auth"
};
