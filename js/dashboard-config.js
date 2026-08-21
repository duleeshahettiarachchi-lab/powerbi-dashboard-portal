/*
  DASHBOARD SETTINGS
  ---------------------------
  1. Open this file in Visual Studio Code.
  2. Paste each Power BI, Looker, or other dashboard URL inside the matching url: "..." field.
  3. Leave url: "" empty when a dashboard is not yet available.
  4. Optional: add image: "images/file-name.png" to any dashboard to show
     a hosted full-screen Live Image on TVs that cannot open the dashboard.

  URL notes:
  - Power BI "Publish to web" URLs can normally open directly.
  - Google Looker and other secure dashboard URLs may require each viewer to sign in.
  - This portal opens dashboard links directly instead of embedding them.
*/

window.DASHBOARD_CONFIG = [
  { id: 1,  name: "Pasting Machine Dashboard",  description: "Production, quality, downtime and OEE monitoring for the pasting process.", icon: "PM", url: "https://app.powerbi.com/view?r=eyJrIjoiMjkwNjAzMjAtMjEyMi00ODc2LWFjZmItNDE3YzdmNTdiNzE1IiwidCI6ImJkMGIxZmU0LTcwZmEtNGE5MS1iMDI4LWE2MDA1NGQ5MTYyNSIsImMiOjEwfQ%3D%3D" },
  { id: 2,  name: "Casting Machine Dashboard", description: "Casting output, defects, process performance and machine status.", icon: "CM", url: "https://app.powerbi.com/view?r=eyJrIjoiODA0ODdjZDYtMzkwNi00OTI0LWJiZjAtOWFjMDE0OWJiYmRiIiwidCI6ImJkMGIxZmU0LTcwZmEtNGE5MS1iMDI4LWE2MDA1NGQ5MTYyNSIsImMiOjEwfQ%3D%3D" },
  { id: 3,  name: "Assembly Line Dashboard",   description: "Assembly line 01 performance, productivity, quality and daily targets.", icon: "AL", url: "https://app.powerbi.com/view?r=eyJrIjoiZGExYjVmMWEtZGY5OC00NDliLTg2M2ItMmQwZGRhMzIxODgyIiwidCI6ImJkMGIxZmU0LTcwZmEtNGE5MS1iMDI4LWE2MDA1NGQ5MTYyNSIsImMiOjEwfQ%3D%3D"},
  { id: 4,  name: "Formation Dashboard",       description: "Formation process monitoring and operational performance.", icon: "FD", url: "" },
  { id: 5,  name: "Charging Dashboard",        description: "Charging process status, capacity and production indicators.", icon: "CH", url: "" },
  { id: 6,  name: "Quality Dashboard",         description: "Quality results, defects, trends and corrective-action visibility.", icon: "QD", url: "" },
  { id: 7,  name: "Maintenance Dashboard",     description: "Breakdowns, preventive maintenance, MTBF and MTTR indicators.", icon: "MD", url: "" },
  { id: 8,  name: "OEE Dashboard",             description: "Availability, performance, quality and overall equipment effectiveness.", icon: "OE", url: "" },
  { id: 9,  name: "Production Dashboard",      description: "Plant production plan, actual output, variance and trend analysis.", icon: "PD", url: "" },
  { id: 10, name: "Safety Dashboard",          description: "Safety observations, incidents, actions and compliance status.", icon: "SD", url: "" },
  { id: 11, name: "Energy Dashboard",          description: "Energy usage, trends, losses and efficiency indicators.", icon: "ED", url: "" },
  { id: 12, name: "Warehouse Dashboard",       description: "Inventory, stock movements, ageing and warehouse performance.", icon: "WD", url: "" },
  { id: 13, name: "Supply Chain Dashboard",    description: "Supplier, material availability, delivery and logistics performance.", icon: "SC", url: "" },
  { id: 14, name: "Sales Dashboard",           description: "Sales performance, product mix, targets and customer trends.", icon: "SL", url: "" },
  { id: 15, name: "Finance Dashboard",         description: "Financial performance, cost, budget and management indicators.", icon: "FN", url: "" },
  { id: 16, name: "Human Resources Dashboard",description: "Workforce, attendance, training and people-related KPIs.", icon: "HR", url: "" },
  { id: 17, name: "Customer Service Dashboard",description: "Customer requests, complaints, service level and response tracking.", icon: "CS", url: "" },
  { id: 18, name: "TPM Dashboard",             description: "Total Productive Maintenance pillar progress and action monitoring.", icon: "TP", url: "" },
  { id: 19, name: "KPI Management Dashboard",  description: "Company, department and individual KPI performance overview.", icon: "KP", url: "" },
  { id: 20, name: "Management Dashboard",      description: "Executive-level summary of key operational and business results.", icon: "MG", url: "" }
];
