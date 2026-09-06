# Custom Glass Industries, Inc. — Preventive Maintenance (PM) Portal

Plant asset registry, preventive maintenance scheduler, spare parts requisition, work order execution engine, and service documentation system designed specifically for the **Custom Glass Industries, Inc.** architectural glass fabrication plant in Anaheim, CA.

---

## 📄 Project Specifications & Roadmap Tracking

The entire project is built directly to the specifications outlined in the Product Requirements Document (PRD). You can follow along with each section and implementation phase:

👉 **[Read the Full Product Requirements Document (PRD)](./PM-Portal-PRD.md)** *(Open in a new tab to follow along)*

### 🏆 Phased Implementation Progress

| Phase | Module | Status | Highlights |
| :--- | :--- | :---: | :--- |
| **Phase 1** | **Foundation & Auth** | ✅ **Complete** | Open-source JWT/bcrypt auth, RBAC (5 roles), many-to-many operator equipment scoping (`operator_equipment`), plant locations, equipment CRUD, document uploads, bilingual English/Spanish `i18next` foundation. |
| **Phase 2** | **Parts Requisitions & Catalog** | ✅ **Complete** | Spare parts inventory catalog with low-stock alerts, equipment BOM linking, parts requisition queue, server-side Sharp image compression (1920px WebP) for phone camera uploads, in-app approval workflow. |
| **Phase 3** | **PM Core & Work Orders** | ✅ **Complete** | Dual-trigger PM scheduler (calendar days & runtime meter hours), automated due-PM detection & idempotent work order generator, full work order lifecycle (`Open` &rarr; `In Progress` &rarr; `Completed`), interactive checklist execution, downtime minutes & root-cause logging, real-time parts inventory auto-deduction, automatic recurrence rescheduling upon completion, supervisor sign-offs. |
| **Phase 4** | **Dashboards & Reporting** | ✅ **Complete** | Real-time shop floor uptime wallboard (status grid grouped by plant area, 30s auto-refresh), live "recently down" equipment panel with stoppage timers, open parts requests aging queue, MTBF/MTTR analytics, and maintenance cost rollups. |
| **UI Polish** | **Brand Identity & Navigation Revamp** | ✅ **Complete** | Official **Custom Glass Industries, Inc.** brand asset integration, CGI Cyan (`#00b4f0`) & Oceanic Deep Blue theme, decluttered top navigation with dropdown groupings (**Maintenance**, **Parts & Supplies**, **Management**), and mobile drawer navigation. |
| **Phase 5** | **Localization & Guided Help** | 🔄 **In Progress** | Full Spanish coverage pass, contextual "How Do I..." in-app help panel per module, role-aware guided walkthroughs. |
| **Phase 6** | **Floor Utilities & Polish** | ⏳ *Scheduled* | Mobile QR code generation & camera scan-to-view, rapid quick-add equipment forms with duplicate serial detection, audit logging explorer. |

---

## 🎨 CGI Brand Identity & Decluttered Navigation Architecture

- **Visual Brand Palette:** Re-skinned with Custom Glass Industries, Inc.'s official corporate colors:
  - **CGI Cyan (`#00b4f0`):** Primary action buttons, active navigation markers, interactive filters, metric callouts, and glow accents.
  - **Oceanic Blue (`#0078be`):** Gradient header undertones and secondary interactive states.
  - **Architectural Glass Dark Slate (`#020617` / `#0f172a`):** High-contrast industrial shop-floor backdrop.
  - **High-Visibility Industrial Safety Standards:** Operational status indicators strictly adhere to plant safety conventions (Active = `emerald-500`, Outage/Down = `red-500`, Warning/Urgent = `amber-500`).
- **Streamlined Top Navigation (`Navbar.jsx`):**
  - Eliminated the cluttered 8-tab horizontal layout that overflowed on smaller screens.
  - **Direct Access:** Shop Wallboard (`Dashboard`) and Machinery Registry (`Equipment`).
  - **Maintenance Dropdown:** Work Orders & PM Schedules.
  - **Parts & Supplies Dropdown:** Requisitions Queue & Parts Catalog.
  - **Management Dropdown:** Plant Analytics & Team / Operator Scoping (role-restricted).
  - **Responsive Mobile Drawer:** Clean hamburger drawer providing quick touch access on floor tablets and mobile devices.

---

## 🚀 Live Capabilities (Phases 1 – 4)

### 1. Equipment Registry & Operator Scoping
- **Machine Hierarchy:** Structured by Building &rarr; Area &rarr; Specific Location (Cutting Bay, Tempering Furnace Line, Lamination Cleanroom, Edging Station).
- **Strict Operator Scoping (PRD 2.1):** Floor operators are restricted at the database and API layer (`operator_equipment`) to viewing only their assigned machines and submitting parts requests or viewing maintenance for those machines alone.
- **Document Management:** Service manuals, wiring schematics, and warranties attached directly to assets.

### 2. Spare Parts Catalog & Server-Side Image Compression
- **Catalog Management:** Tracks part numbers, categories (cutting consumables, tempering ceramics, diamond tooling, pneumatics), storage bins, reorder thresholds, and preferred OEM suppliers.
- **Requisition Workflow:** Floor operators and technicians submit parts requests with urgency flags (`Low`, `Normal`, `Urgent`). Managers review, approve, deny, order, and receive parts in a unified queue.
- **Zero Disk Bloat Photo Compression:** High-res mobile phone photos (5–15MB) are re-encoded and downsampled in-memory using `sharp` into optimized WebP images (max 1920px, 80% quality, ~6–50KB) before saving to disk.

### 3. Preventive Maintenance Core & Work Order Engine
- **Dual Triggers:** PM schedules support calendar-based triggers (e.g. every 7, 14, 30, 90 days), meter-based triggers (e.g. every 500 runtime hours), or "whichever comes first".
- **Automated Work Order Generation:** The engine scans active PMs, checks due dates and current operating hours, and auto-spawns work orders with pre-filled task checklists and priority flags without duplicating open orders.
- **Checklist Execution:** Technicians check off steps in real-time and attach technical readings or notes per item.
- **Downtime & Root Cause Tracking:** Log stoppage minutes and root-cause failure codes (e.g. glass particulate slurry clogging coolant lines).
- **Inventory Auto-Deduction:** Consuming spare parts on a work order immediately decrements stock from the warehouse catalog and fires low-stock alerts if hitting reorder thresholds.
- **Auto-Rescheduling:** Completing a PM work order automatically stamps `last_performed_date = CURRENT_DATE` and advances the schedule to the next due date and runtime meter threshold.
- **Supervisor Sign-Off:** Restricted to Managers and Administrators for quality assurance.

### 4. Shop Floor Uptime Wallboard & Maintenance Analytics (PRD 3.8 & 3.9)
- **Live Plant Uptime Wallboard:** Designed for shop-floor monitor displays with 30-second auto-refresh, selectable time windows (Today, Last 7 Days, Last 30 Days), and live shop-wide availability % calculation.
- **Machinery Status Grid:** Grouped by plant area (Cutting Area, Tempering Furnace, Lamination Line, Fabrication & Edging) with real-time status pulses (Active/Running, Down, In Storage) and runtime meters.
- **Active Outages & Downtime Tracker:** Automatically surfaces currently offline machines with running downtime timers, failure reasons, and immediate click-through to work orders.
- **Parts Requisition Aging Queue:** Ranks pending parts orders by urgency and elapsed age in hours and days so critical tooling orders never stall.
- **Asset Reliability Analytics:** Computes MTBF (Mean Time Between Failures) and MTTR (Mean Time to Repair) per machine.
- **Maintenance Cost Rollup:** Aggregates technician labor costs ($65/hr standard rate) and consumed parts spend per asset.
- **Technician Productivity & Parts Consumption:** Tracks closed work orders and labor hours per technician, and highlights top consumed spare parts by total spend.

---

## 🛠️ Tech Stack & Architecture

- **Database:** PostgreSQL 16 (Alpine container `pm_portal_db`, port `5432`, volume `pm_portal_db_data`)
- **Backend:** Node.js & Express (Container `pm_portal_backend`, port `5050`)
  - Safe Open-Source Auth: `bcryptjs` password hashing + signed `jsonwebtoken` in secure `httpOnly` cookies.
  - Image Processing: `sharp` for in-memory upload compression.
  - Storage: Persistent Docker volume `pm_portal_doc_storage` mounted at `/data/documents`.
- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons (Container `pm_portal_frontend`, port `3001`).
- **Internationalization:** `i18next` with full English (`en.json`) and Spanish (`es.json`) dictionaries.

---

## ⚡ Quick Start

### 1. Launch with Docker Compose
```bash
docker compose up -d
```

### 2. Access the Application
- **Frontend Web Portal:** `http://localhost:3001`
- **Backend REST API:** `http://localhost:5050/api`
- **Health Endpoint:** `http://localhost:5050/health`

### 3. Pre-Seeded Demo Accounts
One-click demo login buttons are built right into the login screen:

| Role | Username / Email | Password | Scope & Language |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` (`admin@cgi.internal`) | `admin123` | Full plant configuration & user control (EN) |
| **Manager** | `manager` (`manager@cgi.internal`) | `manager123` | PM scheduling, request approvals, sign-offs (ES) |
| **Technician** | `technician` (`tech@cgi.internal`) | `tech123` | Work order execution, checklist sign-off, parts logging (EN) |
| **Operator** | `operator1` (`operator1@cgi.internal`) | `operator123` | **Scoped** to `EQ-CUT-01` & `EQ-EDGE-01` (ES) |
| **Viewer** | `viewer` (`viewer@cgi.internal`) | `viewer123` | Read-only plant equipment status (EN) |

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue httpOnly cookie | Public |
| `GET` | `/api/auth/me` | Fetch authenticated profile & scope | Authenticated |
| `POST` | `/api/auth/logout` | Invalidate session | Authenticated |
| `GET` | `/api/equipment` | List equipment (scoped for operators) | Authenticated |
| `POST` | `/api/equipment` | Create equipment asset | Admin, Manager |
| `GET` | `/api/pm-schedules` | List PM schedules (with overdue flags) | Authenticated |
| `POST` | `/api/pm-schedules` | Create PM schedule & checklist | Admin, Manager |
| `POST` | `/api/pm-schedules/check-due` | Scan due PMs & auto-generate work orders | Admin, Manager, Tech |
| `POST` | `/api/pm-schedules/:id/trigger` | Manually spawn work order from schedule | Admin, Manager, Tech |
| `GET` | `/api/work-orders` | List work orders (scoped for operators) | Authenticated |
| `POST` | `/api/work-orders` | Create manual work order (Corrective/Inspection) | Admin, Manager, Tech |
| `PUT` | `/api/work-orders/:id` | Update status, checklist, hours, downtime, sign-off | Admin, Manager, Tech |
| `POST` | `/api/work-orders/:id/parts` | Log parts used (auto-deducts inventory) | Admin, Manager, Tech |
| `GET` | `/api/parts` | List parts catalog with stock levels | Authenticated |
| `POST` | `/api/parts` | Add new spare part to inventory | Admin, Manager |
| `GET` | `/api/parts-requests` | List parts requests (scoped for operators) | Authenticated |
| `POST` | `/api/parts-requests` | Submit request with compressed photo | Authenticated |
| `PUT` | `/api/parts-requests/:id/status` | Approve / Order / Receive parts request | Admin, Manager |
