POWER BI DASHBOARD PORTAL
=========================

FILES
-----
index.html                 Home page
dashboards.html            Page containing 20 dashboard entry cards
viewer.html                Full-page Power BI viewer
css/styles.css             Website colours, layout and responsive design
js/dashboard-config.js     Dashboard names, descriptions and Power BI URLs
js/app.js                  Dashboard cards, search and viewer behaviour

HOW TO ADD A POWER BI DASHBOARD URL
----------------------------------
1. Open the folder in Visual Studio Code.
2. Open: js/dashboard-config.js
3. Find the dashboard you want.
4. Paste the Power BI URL between the quotation marks.

Example:
{ id: 1, name: "Pasting Machine Dashboard", ..., url: "https://app.powerbi.com/view?r=YOUR_LINK" }

5. Save the file.
6. Refresh dashboards.html in your browser.
7. The status will change from "Not available" to "Available".

IMPORTANT POWER BI NOTE
-----------------------
- "Publish to web" URLs can normally be viewed by anyone who has the link. Do not use this option for confidential company information.
- Secure Power BI embed links may require each viewer to sign in and have permission.
- A normal report-sharing URL may be blocked inside an iframe. Use an official Power BI embed URL.

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
