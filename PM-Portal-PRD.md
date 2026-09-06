# Product Requirements Document: Preventive Maintenance Portal

## 1. Overview

### 1.1 Purpose
A web-based Preventive Maintenance (PM) Portal that allows a maintenance team to track equipment, schedule and document preventive maintenance, manage parts inventory, and maintain a full service history for every asset — replacing spreadsheets, paper logs, and email requests with a single source of truth.

### 1.2 Problem Statement
Maintenance teams often rely on disconnected tools (spreadsheets, binders of manuals, whiteboards, verbal requests) to track equipment health. This leads to missed PM tasks, lost service manuals, no visibility into parts stock, no audit trail for compliance, and no data to spot recurring failures or budget for replacement parts.

### 1.3 Goals
- Centralize all equipment data (vendor, serials, models, warranty, location) in one place
- Automate PM scheduling so tasks are never missed
- Give technicians easy access to manuals and service history, including on mobile devices in the field
- Track parts inventory and let staff request/reorder parts without leaving the platform
- Produce reporting/KPIs (compliance rate, downtime, cost) for management
- Create an audit trail for compliance/regulatory purposes

### 1.4 Success Metrics
- % of PM tasks completed on time (target: >95%)
- Reduction in unplanned downtime (measurable after 90 days of use)
- Mean time to repair (MTTR) trending down
- 100% of active equipment has documentation on file
- Parts stockouts reduced by X% (baseline TBD)

---

## 2. Users & Roles

| Role | Description | Key Permissions |
|---|---|---|
| **Admin** | IT/ops manager who configures the system | Full access: manage users, equipment, locations, vendors, system settings |
| **Maintenance Manager** | Oversees PM program and team | Create/edit PM schedules, approve parts requests, view all reports, assign work orders |
| **Technician** | Performs the actual maintenance | View assigned work orders, complete PM checklists, log parts used, request parts, view manuals, log downtime/failures |
| **Operator** | Runs one or more machines on the floor, not a maintenance staff member | View and submit parts requests **only for their assigned equipment**, view that equipment's status/manuals, report a problem. No visibility into other equipment, other operators' requests, cost data, or admin functions |
| **Requester/Viewer** | e.g. floor supervisor, other departments | Submit maintenance requests, view equipment status, no edit rights |
| **Vendor/External (optional, future)** | Outside contractor | Limited view of specific work orders assigned to them |

Role-based access control (RBAC) should gate both UI visibility and API access, not just UI hiding.

### 2.1 Operator Equipment Assignment
Operators are scoped to specific equipment, and an operator may be responsible for more than one machine, so this is a **many-to-many** relationship (`operator_equipment`), not a single field on either the user or the equipment record:
- An admin or manager assigns/unassigns equipment to an operator
- An operator's entire experience of the app (equipment list, parts request form, dashboard tiles) is filtered to only the equipment they're assigned to — enforced at the API layer, not just hidden in the UI, since a determined user could otherwise call the API directly and see equipment they shouldn't
- One machine can also have more than one operator (e.g. shift-based coverage), so the relationship is many-to-many in both directions
- When an operator submits a parts request, the system already knows which equipment it's for from this assignment — no need for the operator to search/browse equipment they don't have access to

### 2.2 Language Preference
Every user has a language preference stored on their account (English or Spanish),
set at first login and changeable anytime from account settings. This is a **user-level
setting, not a system-wide one** — one operator can run the interface in Spanish while
a manager runs it in English, simultaneously, without affecting each other. See 3.11
for how translation is implemented.

---

## 3. Core Modules & Features

### 3.1 Equipment / Asset Registry
The core object in the system. Each piece of equipment should have:
- Asset ID / tag number (unique, ideally supports barcode/QR code generation)
- Name & description
- Category/type (e.g. HVAC, conveyor, pump, forklift)
- Location hierarchy: **Building → Area/Department → Specific location** (single-site deployment, but still worth structuring rather than a flat text field — makes filtering/reporting by area much easier, and gives you room to add a site later without a rebuild)
- Manufacturer / vendor
- Model number
- Serial number
- Asset tag / QR code image (auto-generated, printable)
- Install date
- Purchase date & cost
- Warranty expiration date (with alerting — see 3.7)
- Criticality rating (e.g. Low/Medium/High/Critical) — drives PM priority and escalation
- Status (Active, Down, Retired, In Storage)
- Meter tracking (runtime hours, cycle counts, mileage — for usage-based PM, not just calendar-based)
- Photos (multiple, e.g. nameplate photo, overall unit photo)
- Linked documents (see 3.4)
- Linked parts (bill of materials — which parts this equipment typically uses)
- Full history: PM completed, work orders, failures, parts consumed
- Parent/child relationships (e.g. a motor that belongs to a larger pump skid)

**You'll want bulk import** (CSV/Excel) for the initial load of existing equipment — nobody wants to hand-enter hundreds of assets.

### 3.2 Vendor Management
- Vendor name, contact info (phone, email, account rep)
- Vendor type (equipment manufacturer, parts supplier, service contractor)
- Linked equipment (which assets they supply/service)
- Service contracts/warranties on file (with expiration alerts)
- Preferred vendor flag for parts ordering
- Notes/performance history (response time, quality issues)

### 3.3 Preventive Maintenance (PM) Scheduling
This is the heart of the system.
- PM template/task list per equipment (checklist of steps, e.g. "check belt tension," "replace filter," "lubricate bearings")
- Trigger types:
  - **Calendar-based** (every 30/60/90 days, monthly, quarterly, annually)
  - **Meter/usage-based** (every 500 operating hours, every 10,000 cycles)
  - **Whichever comes first** (common in real-world CMMS — combine both)
- Auto-generation of work orders when a PM comes due
- Assignment to a technician or team
- Estimated time/labor required
- Required parts pre-listed (pulled from equipment's bill of materials)
- Instructions/reference to relevant manual section
- Recurrence handling (auto-reschedule the next occurrence on completion)
- Calendar view (month/week) + list view of upcoming PMs
- Overdue escalation (notify manager if a PM is X days overdue)

### 3.4 Document Management (Manuals & Files)
- Upload/store service manuals, user manuals, wiring diagrams, warranty docs, safety data sheets (SDS)
- Attach documents to specific equipment (many-to-many — one manual may apply to multiple identical units)
- Version control (track manual revisions over time)
- Search by equipment, keyword, or document type
- File preview in-browser (PDF viewer) — technicians in the field shouldn't have to download files
- Support common types: PDF, images, Word/Excel

### 3.5 Work Orders (Maintenance Records)
Broader than just PM — this is where all maintenance work is documented.
- Types: Preventive (auto-generated), Corrective/Reactive (something broke), Inspection, Request-based
- Status workflow: Open → Assigned → In Progress → On Hold (waiting on parts) → Completed → Closed
- Assigned technician(s)
- Priority level
- Description of work / checklist completion
- Time tracking (labor hours logged, start/stop)
- Parts used (deducts from inventory automatically — see 3.6)
- Cost tracking (labor + parts = total cost per work order, rolls up to cost-per-asset)
- Downtime logged (start/end of equipment downtime, root cause/failure code)
- Photos/attachments (before/after, evidence of completion)
- Sign-off/approval (supervisor confirms completion)
- Comments/notes thread

### 3.6 Parts Inventory
- Part number, description, category
- Linked to equipment (which assets use this part)
- Quantity on hand
- Min/max stock thresholds and reorder point
- Storage location/bin
- Unit cost & preferred vendor
- Auto-deduction when parts are logged against a work order
- Low-stock alerts
- Purchase order tracking (basic — vendor, date ordered, expected delivery, received date)
- Parts usage history/reporting (which parts get consumed most, cost trends)

### 3.6.1 Parts Requests (including Operator-Submitted Requests)
Parts requests can be raised by technicians (against any equipment) or by operators
(only against their assigned equipment — see 2.1). Both flow through the same
underlying table and review process, so management has one queue to work from
rather than two.

**Request fields:**
- Requesting user (auto-filled, not editable)
- Equipment (auto-filled for operators from their assignment; selectable for technicians)
- Part (select from catalog) or free-text description if the part isn't catalogued yet
- Quantity needed
- Reason/notes (e.g. "worn," "broken," "leaking")
- Urgency (Low / Normal / Urgent — Urgent should stand out visually in the queue)
- Photo attachment(s) — see 3.6.2
- Status: Submitted → Under Review → Approved → Ordered → Received → Fulfilled (or Denied, with a reason)

**Review workflow:**
- Manager/purchasing sees all pending requests in one queue, sorted by urgency then date
- Approve/deny with an optional note back to the requester
- Approved requests can be converted straight into a purchase order or matched against existing stock if enough is on hand
- Requester gets a status update (in-app notification at minimum; email is a natural extension of the same notification system)

**Webhook + email on submission:**
- The moment a request is submitted (by an operator or technician), the backend fires an internal webhook event
- That webhook triggers an email to management/purchasing (a configurable distribution list, not hard-coded to one person) with the equipment name/tag, part, quantity, urgency, requester, and a link straight into the request in the portal
- Build this as a generic **outgoing webhook on the `parts_request.created` event** rather than an email-only integration — that way you can later add a second subscriber (e.g. a Slack/Teams webhook) without touching the request-submission code at all
- Use an SMTP relay you control (e.g. your existing company mail server, or a transactional email service) — self-hosted email delivery from scratch is a rabbit hole worth avoiding

### 3.6.2 Photo Uploads on Parts Requests
- Operators/technicians can attach one or more photos to a request (e.g. a photo of the worn/broken part) directly from a phone camera
- **Photos are compressed server-side before being written to disk** — resize to a reasonable max dimension (e.g. 1920px on the long edge) and re-encode as JPEG/WebP at a moderate quality setting. This is done automatically on upload, not left to the client, since phone camera photos can be 5–15MB each and that adds up fast in a self-hosted volume
- Store the compressed file only; there's no need to keep the original multi-megabyte camera file once a readable compressed copy exists
- Same document-storage volume/pattern as equipment manuals (3.4), just a different `doc_type`

### 3.7 Notifications & Alerts
- PM due soon / PM overdue
- Work order assigned to you
- **New parts request submitted** (to management/purchasing, via the webhook + email described in 3.6.1)
- Parts request approved/denied (back to the requester, including operators)
- Low stock alert
- Warranty expiring soon
- Equipment marked "down"
- Delivery channels: in-app, email, and optionally SMS/push for mobile
- Outgoing notifications should be built on a small internal event system (e.g. `parts_request.created`, `equipment.status_changed`, `pm.overdue`) with subscribers (email, webhook) attached to events, rather than each feature hard-coding its own "send an email" call. This keeps it simple to add a new event or a new notification channel later without touching unrelated code.

### 3.8 Uptime / Shop Status Dashboard
A single screen for management giving a real-time read on the whole shop — this is
the "walk up and see everything at a glance" view, distinct from the deeper
historical reporting in 3.9.

- **Equipment status grid** — every piece of active equipment shown as a tile or row, color-coded by status (Active/Running, Down, In Storage), grouped by location/area
- **Current uptime %** — for the shop overall and per-equipment, calculated from the equipment status history (time spent Active vs Down over a selectable window: today, this week, this month)
- **Open parts requests panel** — pending review, approved-but-not-ordered, and ordered-but-not-received, each with age (how long it's been sitting) so nothing silently stalls
- **Recently down equipment** — a short list of what's currently marked Down and how long it's been down, so the most urgent items are visible without digging
- **Click-through** — clicking any equipment tile or parts request goes straight to that record's detail page
- This dashboard should be the default landing page for Manager and Admin roles after login; Operators land on their own scoped equipment/request view instead (see 2.1)
- Auto-refresh (e.g. every 30–60 seconds) or a manual refresh button — this is meant to be left open on a shop-floor monitor or office screen

### 3.9 Reporting & Dashboards (Historical)
- PM compliance rate (% completed on time)
- Open/overdue work orders by technician or equipment
- MTBF (mean time between failures) and MTTR (mean time to repair)
- Downtime by equipment/location
- Maintenance cost by asset, by category, by month
- Parts spend and consumption trends
- Technician productivity (hours logged, work orders closed)
- Exportable reports (CSV/PDF) for management review

### 3.10 Search & Navigation
- Global search across equipment, work orders, parts, documents
- Filters by location, status, criticality, category
- QR code scan-to-view (technician scans asset tag with phone camera → jumps straight to that equipment's page, history, and manual)

### 3.11 Full Site Translation (English / Spanish)
The entire interface — not just a handful of labels — needs to be usable end to end
in either English or Spanish, selectable per-user (see 2.2).

- **Scope:** every screen, button, form label, validation/error message, email
  notification, and status value (e.g. "Down" / "Fuera de servicio") the system
  generates. This is a real i18n implementation, not a browser-translate bolt-on.
- **What does *not* get translated:** user-entered data — equipment names, vendor
  notes, work order descriptions someone typed, part numbers, etc. Translating the
  interface chrome around content is very different from translating content
  itself, and attempting the latter (e.g. auto-translating a technician's freeform
  notes) would be unreliable for something as important as a maintenance record.
  If real-time translation of freeform notes is ever wanted, treat that as a
  separate, explicitly-scoped future feature — not bundled into this one.
- **Implementation approach:** use a standard i18n library (`i18next` pairs well
  with React) with all interface strings pulled from translation files
  (`en.json` / `es.json`) rather than hardcoded in components. This is far easier
  to build correctly from the start than to retrofit later — every new screen
  built from Phase 1 onward should pull its strings from the translation files,
  even while only English exists yet, so Spanish becomes "translate the JSON
  file" rather than "rewrite every screen."
- **Switching languages** takes effect immediately without a page reload or logout,
  and persists as part of the user's profile so it's remembered on their next login.
- **Emails** (e.g. the parts-request notification in 3.6.1) should render in the
  recipient's saved language preference too.
- **Date, number, and currency formatting** should follow standard conventions for
  the selected language even though this is a single-country deployment — it costs
  little to do correctly up front and reads oddly otherwise (e.g. decimal/thousands
  separators differ between English and Spanish-language conventions).

### 3.12 In-App Guided Help ("How Do I…" per Module)
Each module should teach the logged-in user how to actually perform its task,
not just present a form and assume they know what to do — especially important
given the mix of office staff, technicians, and floor operators who'll use this
with varying comfort levels with software.

- **Contextual help panel**, available from every screen (a persistent "?" icon or
  similar), that explains what the current screen is for and walks through the
  steps for the task most people come to that screen to do — e.g. on the parts
  request form: "How to request a part," step by step, including where the photo
  attachment button is and why urgency matters.
- **First-visit walkthroughs** — the first time a user (or a user in a given role)
  lands on a module, a short guided tour highlights the key actions available
  there. Dismissible, and re-triggerable later from the help panel for anyone who
  wants to see it again.
- **Written in plain, task-oriented language** — "How to log a completed PM," "How
  to request a part for your machine," "How to check if a part order has shipped,"
  not abstract feature descriptions. Match this to what that role actually does:
  an operator's help content should never mention screens they can't access.
- **Localized** — help content lives in the same translation files as everything
  else in 3.11, so it's available in both English and Spanish automatically.
- **Content source:** these can start as static, well-written markdown/JSON content
  per module (fast to build, easy to keep accurate) rather than anything dynamic —
  this isn't a chatbot, it's documentation surfaced at the point of need.
- Consider a short **printable one-page quick-reference** per role (Operator,
  Technician, Manager) as a companion to the in-app help, useful for posting near
  a workstation or handing to a new hire on day one.

---

## 4. Things Commonly Missed (Included Here)

- **Location hierarchy**, not a flat text field — matters as soon as you have multiple buildings/sites
- **Meter/usage-based PM triggers**, not just calendar-based (critical for vehicles, motors, high-cycle equipment)
- **QR/barcode scanning** for fast equipment lookup in the field
- **Downtime and failure/root-cause tracking**, separate from just "work order completed" — this is what lets you calculate MTBF/MTTR and spot chronic problem equipment
- **Warranty expiration tracking and alerts** — easy to forget an asset is still under warranty when ordering a paid repair
- **Labor and cost tracking** roll-up to cost-per-asset — needed to justify repair-vs-replace decisions
- **Audit trail/history log** of who changed what and when (important if you're ever audited, e.g. OSHA, ISO, FDA)
- **Mobile-responsive or dedicated mobile view** — technicians are on the shop floor, not at a desk
- **Bulk data import** for initial equipment load
- **Document version control** for manuals (revisions happen)
- **Parts requisition approval workflow**, not just a flat inventory list
- **Escalation rules** for overdue PMs based on criticality
- **Bill of materials per equipment** (which parts it typically needs) to pre-populate PM/work order parts lists
- **Offline consideration** — if Wi-Fi is spotty in the facility, technicians may need to complete checklists offline and sync later (worth flagging even if you defer it to a later phase)
- **Retired/decommissioned equipment** — don't delete, archive with full history retained
- **Multi-technician work orders** — some jobs need more than one person; the system should support that rather than assuming 1:1
- **Scoped access for non-maintenance users** — operators need to see and act on their own equipment without a way to browse or query anyone else's, enforced server-side
- **Image compression on upload**, not just at request/manual upload time generally — phone photos add up fast on a self-hosted disk if stored raw
- **A generic event/webhook layer** rather than one-off "send this email here" calls scattered through the code — makes it far easier to add a Slack notification, a second distribution list, or a new event type later
- **Building i18n in from the start**, even before Spanish content exists — pulling every UI string from a translation file from day one is dramatically cheaper than retrofitting it after dozens of screens are built with hardcoded English text
- **In-app task guidance**, since a mixed audience of office staff, technicians, and floor operators won't all be equally comfortable navigating a new system — a help panel per module reduces training time and support questions more than most feature work would

---

## 5. Non-Functional Requirements

- **Security:** role-based access control, encrypted storage of documents, secure authentication (consider SSO if part of a larger org)
- **Performance:** equipment/work-order lists should load fast even with thousands of records (pagination, indexing)
- **Mobile:** responsive design at minimum; technicians will use phones/tablets on the floor
- **Data retention:** maintenance history should never be deleted, only archived
- **Backup:** regular automated backups of the database and uploaded documents
- **Audit logging:** who did what, when, across equipment, work orders, and parts
- **Accessibility:** reasonable contrast/readability for shop-floor use (gloves, poor lighting, glare)
- **Localization:** every user-facing string in the interface (and outbound emails) sourced from translation files from the first screen built, supporting English and Spanish per-user (see 3.11) — not retrofitted later

---

## 6. Out of Scope (Phase 1) / Future Considerations

- Full ERP/accounting system integration (may want a lightweight export instead)
- Predictive maintenance / IoT sensor integration (future phase — vibration, temperature sensors feeding into meter-based triggers)
- Native mobile apps (start with responsive web; consider native later if offline support becomes essential)
- Automated PO transmission to vendors (start with manual PO creation/email)
- Multi-language support

---

## 7. Suggested Data Model (Simplified)

```
Location/Building (1) ── (many) Area
Area (1) ── (many) Equipment
Equipment (many) ── (many) Vendor
Equipment (1) ── (many) Document
Equipment (1) ── (many) PM_Schedule
Equipment (many) ── (many) User [via operator_equipment, role=operator]
Equipment (1) ── (many) EquipmentStatusHistory [for uptime calculation]
PM_Schedule (1) ── (many) WorkOrder [generated instances]
WorkOrder (many) ── (many) PartUsed
WorkOrder (many) ── (1) Technician (User)
Part (1) ── (many) PartUsed
Part (many) ── (1) PreferredVendor
Equipment (1) ── (many) PartsRequest
PartsRequest (many) ── (1) User [requester]
PartsRequest (1) ── (many) PartsRequestPhoto
PartsRequest (1) ── (many) WebhookEvent [parts_request.created, etc.]
User (1) ── (many) WorkOrder [assigned]
```

Key tables: `locations` (buildings/areas), `equipment`, `equipment_status_history`, `operator_equipment`, `vendors`, `documents`, `pm_schedules`, `work_orders`, `work_order_parts`, `parts`, `parts_requests`, `parts_request_photos`, `purchase_orders`, `users` (includes `language_preference`), `audit_log`, `notifications`, `webhook_subscriptions`, `help_content` (module-keyed, per-locale).

---

## 8. Recommended Approach for AI-Assisted Build

Since you're building this with AI assistance, here's a suggested phased build order rather than trying to build everything at once:

### Suggested Tech Stack (adjust to your comfort level)
Given self-hosting on a Linux server via Docker Compose, with only 3–10 users:
- **Frontend:** React (with shadcn/ui or Material UI) for a clean, responsive UI — served as static files by the backend or via a lightweight nginx container
- **Backend:** Node.js/Express or Python/FastAPI — either works well with AI coding assistants and containerizes cleanly
- **Database:** PostgreSQL, run as its own container — relational fits this data model well given all the linked entities (equipment, vendors, parts, work orders). Comfortably handles 3–10 users with room to grow
- **File storage:** Local disk via a Docker **named volume** (e.g. `/data/documents`) for manuals/photos/attachments — no need for S3 at this scale, just make sure the volume is included in your backup routine
- **Image processing:** a server-side library (e.g. `sharp` for Node, or `Pillow` for Python) to resize/re-encode photos on upload before they hit disk — this is what makes the parts-request photo compression (3.6.2) actually happen
- **Email:** an SMTP library (e.g. `nodemailer` for Node) pointed at whatever mail relay you already have access to, for the parts-request notification emails
- **Internationalization:** `i18next` (with `react-i18next`) for the frontend, plus a matching approach on the backend for emails — all user-facing strings sourced from `en.json` / `es.json` translation files from the very first screen built, not retrofitted later
- **Auth:** Simple email/password + roles is sufficient for a small internal team; no SSO needed given your scale and single-site deployment
- **Reverse proxy / access:** Since you're using a Cloudflare Tunnel for optional remote access, run a lightweight reverse proxy container (Caddy or nginx) in front of the app — this also gives you free HTTPS termination if the tunnel doesn't handle it end-to-end. On-site users hit `http://<server-ip>:<port>` directly; remote users go through the tunnel's hostname

### Suggested `docker-compose.yml` Structure
```
services:
  db:        # PostgreSQL, with a named volume for data persistence
  backend:   # API server, depends_on db
  frontend:  # React app (or served by backend as static build)
  # optional: cloudflared service if you want the tunnel itself managed in-stack
volumes:
  db_data:
  document_storage:
```
Ask your AI coding assistant to scaffold this compose file early — before writing app code — so you can validate the container plumbing (env vars, volume mounts, networking between backend/db) works before building features on top of it.

### Suggested Build Phases

**Phase 1 — Foundation**
1. User auth + roles (Admin, Manager, Technician, Operator, Viewer), including a `language_preference` field on the user record from the start
2. i18n scaffolding (`i18next` + `en.json`/`es.json` files, even with only English content initially) — set this up before building screens, not after, so every screen from here on pulls strings from the translation files by default
3. Location hierarchy (Building → Area)
4. Equipment registry (CRUD, including vendor/serial/model fields)
5. Operator-equipment assignment (many-to-many) + API-level scoping so operators only ever see their own equipment
6. Document upload & attach to equipment

**Phase 2 — Parts Requests (pulled forward — high value, doesn't depend on PM/work orders)**
7. Parts catalog (basic — can start thin and grow)
8. Parts request submission (technicians: any equipment; operators: assigned equipment only)
9. Photo upload on requests, with server-side compression before writing to disk
10. Internal event/webhook layer (`parts_request.created`, etc.) + email notification to management/purchasing (in the recipient's language preference)
11. Request review queue (approve/deny/order/receive) for managers

**Phase 3 — PM Core**
12. PM schedule creation (calendar-based first, add meter-based next)
13. Auto-generation of work orders from PM schedules
14. Work order detail view + completion workflow
15. Equipment status history tracking (needed for the uptime dashboard's % calculation)
16. Basic notifications (PM due/overdue) reusing the event layer from Phase 2

**Phase 4 — Dashboards & Reporting**
17. Uptime/shop status dashboard (equipment grid, open parts requests panel, recently-down list) — the default landing page for Managers/Admins
18. Historical reporting (compliance rate, MTBF/MTTR, cost)
19. Parts consumption on work order completion (auto-deduct stock)

**Phase 5 — Localization & Guided Help**
20. Complete Spanish translation file (`es.json`) covering every screen built so far — this is largely a translation pass, not new engineering, *because* i18n was built in from Phase 1
21. In-app contextual help panel (per-module "how do I…" content, localized, role-aware)
22. First-visit guided walkthroughs per module
23. Printable one-page quick-reference per role (optional but low-effort given the help content already exists)

**Phase 6 — Polish**
24. QR code generation/scanning for equipment
25. Audit log
26. Mobile responsiveness pass
27. A simple "add equipment" flow that's fast enough for manual entry — since you're compiling equipment data by hand rather than importing a spreadsheet, prioritize a quick-add form (with duplicate-detection on serial number) over a bulk CSV importer

### Instructions to Give Your AI Coding Assistant
When you start building, give it this PRD directly plus:
- "Build Phase 1 first as a working vertical slice — I want to log in, add a piece of equipment, and upload a manual before we do anything else."
- Ask it to set up the database schema first and review it with you before generating UI.
- Build one module fully (backend + frontend) before moving to the next, rather than scaffolding everything at once — this keeps things testable and avoids a huge tangle of half-finished features.
- Ask for seed/sample data so you can test with realistic equipment records early.

---

## 9. Deployment & Environment Decisions

These are settled based on your environment — noted here so they carry through into the build:

- **Single site.** Location hierarchy simplified to Building → Area (no site-level entity needed). Easy to extend later if that changes.
- **3–10 users.** Simple email/password auth with roles is sufficient; no SSO. Postgres and a single backend container will handle this load without any special scaling work.
- **No data to import initially.** Skip building a bulk CSV importer in Phase 1 — invest instead in a fast, low-friction manual "add equipment" form, since you'll be entering records by hand. Revisit bulk import later if useful.
- **Self-hosted via Docker Compose on a Linux server.** All services (db, backend, frontend, optional reverse proxy) run in containers on one host. Use named volumes for both the Postgres data and the document/manual storage so nothing lives only inside a container's writable layer.
- **Access:** on-site via `http://<server-ip>:<port>`; remote access (if/when needed) via Cloudflare Tunnel, so no ports need to be forwarded on your router/firewall.
- **No regulatory compliance driver.** The audit log is still worth keeping (useful for "who changed this schedule" troubleshooting and general accountability), but you don't need to over-engineer it for audit purposes — a simple append-only log table is enough.
- **Primary focus areas confirmed:** equipment tracking, parts spend, spare parts storage/low-quantity alerts, full maintenance history, and cost of maintenance/operation per asset. These should be the modules that get the most attention in the reporting/dashboard work (Phase 4) — cost-per-asset and low-stock views in particular are your core value-add over a spreadsheet.

### A Note on Backups
Since this will be self-hosted with no cloud redundancy by default, build in a backup habit from day one:
- A simple `pg_dump` cron job (inside or alongside the db container) writing to a location outside the Docker host — or at minimum outside the same disk — on a daily schedule
- Back up the document storage volume (manuals, photos) on the same schedule
- Test a restore at least once after setup, not just after something breaks
