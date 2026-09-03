DASHBOARD PORTAL
================

FILES
-----
index.html                 Home page
dashboards.html            Page containing 20 dashboard entry cards
viewer.html                Dashboard launch page and image viewer
css/styles.css             Website colours, layout and responsive design
js/dashboard-config.js     Dashboard names, descriptions and dashboard URLs
js/app.js                  Dashboard cards, search and launch behaviour
snapshot.html              Smart TV snapshot viewer
snapshot-config.json       Snapshot capture, image and refresh settings
scripts/capture-snapshots.js
                           Playwright snapshot capture script
.github/workflows/update-snapshots.yml
                           Daily/manual GitHub Actions automation
snapshots/metadata.json    Generated snapshot status and timestamps

AUTOMATED SMART TV SNAPSHOTS
----------------------------
The portal can generate lightweight dashboard preview images for Smart TVs.
GitHub Actions runs Playwright in Chromium, reads the existing dashboard list
from js/dashboard-config.js, opens each dashboard that has a public URL, waits
for Power BI to render, and saves one fixed image per dashboard in:

snapshots/

The workflow also updates:

snapshots/metadata.json

This metadata contains each dashboard ID, name, snapshot path, capture time,
status, and any capture error. The website reads this file to show "Last
updated" beside the TV Preview button. Snapshot URLs include the capture
timestamp as a cache-busting query string so Smart TVs do not keep an old image
after a new capture is published.

The snapshot viewer is:

snapshot.html?id=1

It displays the latest image full-screen on a dark background and reloads
periodically using the interval in snapshot-config.json.

HOW TO MANUALLY RUN SNAPSHOT AUTOMATION
---------------------------------------
1. Open the GitHub repository.
2. Go to Actions.
3. Select "Update Smart TV Snapshot Previews".
4. Choose "Run workflow".
5. Leave dashboard_id empty to capture every dashboard, or enter one dashboard
   ID to test a single dashboard.

MANUAL GENERATE SNAPSHOT OPTION
-------------------------------
Use this when you want to refresh snapshots immediately instead of waiting for
the daily schedule.

On the Dashboards page, use the Generate Snapshots button. It opens the GitHub
Actions workflow page in a new tab. GitHub will ask you to sign in if needed.

In GitHub:
Actions
-> Update Smart TV Snapshot Previews
-> Run workflow
-> enter dashboard ID 1, or leave blank for all dashboards
-> Run workflow

For local testing with Node.js installed:

npm install
npx playwright install chromium
npm run generate:snapshot -- 1

To manually generate every configured public dashboard locally:

npm run generate:snapshots

HOW TO CHANGE THE DAILY SCHEDULE
--------------------------------
Edit the cron value in:

.github/workflows/update-snapshots.yml

The current schedule is:

15 18 * * *

GitHub Actions cron times are UTC. The same value is also recorded in
snapshot-config.json as documentation beside the other snapshot settings.

HOW TO TEST ONE DASHBOARD LOCALLY
---------------------------------
Install Node.js, then run:

npm install
npx playwright install chromium
npm run capture:snapshots:one -- 1

Replace 1 with the dashboard ID you want to test. The script preserves metadata
for other dashboards when testing one dashboard.

TROUBLESHOOTING FAILED POWER BI CAPTURES
----------------------------------------
- Confirm the URL in js/dashboard-config.js opens without Microsoft login in a
  private/incognito browser window.
- Confirm the URL is a Power BI "Publish to web" or other public no-login URL.
- Increase capture.finalRenderDelayMs in snapshot-config.json if visuals load
  slowly.
- Increase capture.navigationTimeoutMs or capture.visualWaitTimeoutMs for very
  slow reports.
- Open the failed GitHub Actions run and check the capture log. The script logs
  each failed dashboard ID, name and error.
- If a dashboard fails, the workflow continues with the remaining dashboards.

LIVE IMAGE OPTION
-----------------
1. Open dashboards.html.
2. Open the required dashboard launch page.
3. Use the small Create Image control and select a PNG, JPG, or WEBP file.
4. The selected image opens in viewer.html as a full-screen Live Image.
5. Selecting a new image for the same dashboard replaces the previous image in that browser.

For a separate Smart TV browser, browser-uploaded images are not shared from your PC.
Upload the image file to your hosting folder and add an image path in js/dashboard-config.js, for example:
{ id: 1, name: "Pasting Machine Dashboard", ..., image: "images/pasting-machine-dashboard.png" }

HOW TO ADD A DASHBOARD URL
--------------------------
1. Open the folder in Visual Studio Code.
2. Open: js/dashboard-config.js
3. Find the dashboard you want.
4. Paste the Power BI, Google Looker, or other dashboard URL between the quotation marks.

Example:
{ id: 1, name: "Pasting Machine Dashboard", ..., url: "https://app.powerbi.com/view?r=YOUR_LINK" }

5. Save the file.
6. Refresh dashboards.html in your browser.
7. The status will change from "Not available" to "Available".

IMPORTANT DASHBOARD NOTE
------------------------
- "Publish to web" URLs can normally be viewed by anyone who has the link. Do not use this option for confidential company information.
- Secure dashboard links may require each viewer to sign in and have permission.
- This portal opens dashboard links directly in the browser. It does not try to display blocked providers inside the page.

SMART TV DISPLAY NOTE
---------------------
- The portal JavaScript is written to avoid newer browser features so older Smart TV browsers have a better chance of loading the viewer.
- If a dashboard does not open on an Abans Smart TV, the TV browser may not support the dashboard web application itself.
- For the most reliable TV display, use a device with a modern browser, such as a mini PC, Android TV box, Chromecast, Fire TV device, or laptop connected by HDMI.
- If the TV cannot run the dashboard application, use exported dashboard images or PDFs and display those in the website.

HOW TO OPEN LOCALLY
-------------------
Double-click index.html, or right-click it and open with a web browser.

For the most reliable test in Visual Studio Code:
1. Install the "Live Server" extension.
2. Right-click index.html.
3. Select "Open with Live Server".

HOW TO PUBLISH
--------------
Upload all files and folders to your web hosting public folder, usually:
- public_html
- www
- htdocs

Keep the same folder structure.
