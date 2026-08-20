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
