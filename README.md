# CGI Preventive Maintenance (PM) Portal

Plant asset registry, preventive maintenance scheduler, spare parts requisition, and service documentation system designed specifically for the **CGI Glass Solutions** architectural glass fabrication plant in Anaheim, CA.

---

## 🚀 Key Capabilities (Phase 1 MVP)

- **Strict Role-Based Access Control (RBAC):**
  - **Admin:** Full system configuration & user management.
  - **Maintenance Manager:** Asset creation, PM schedule control, and operator machine assignments.
  - **Technician:** Equipment service status updates, manual viewing, work logs.
  - **Operator:** **Scoped Access** — operators are strictly restricted at the API level (`operator_equipment`) to viewing and requesting parts only for their assigned machinery.
  - **Viewer:** Read-only plant equipment status.
- **Bilingual i18n from Day 1:** Complete English and Spanish interface translation (`i18next`), selectable per user profile and remembered across sessions.
- **Equipment & Document Hub:** Track asset status (Active, Down, In Storage), runtime meter hours, criticality, and upload/preview technical manuals and schematics.
- **Audit Trail:** Immutable append-only audit log tracking user logins, equipment creations, and status modifications.

---

## 🛠️ Tech Stack & Architecture

- **Database:** PostgreSQL 16 (Docker container with persistent named volume `pm_portal_db_data`)
- **Backend:** Node.js & Express (Docker container `pm_portal_backend`, port `5050`)
  - Open Source Safe Auth: `bcryptjs` password hashing + signed `jsonwebtoken` session tokens stored in secure `httpOnly` cookies.
  - Multipart upload handler: `multer` (documents stored in volume `pm_portal_doc_storage`).
- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons (Docker container `pm_portal_frontend`, port `3001`).

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
All pre-seeded accounts have default passwords ready for testing:

| Role | Username / Email | Password | Scope & Language |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` (`admin@cgi.internal`) | `admin123` | Full access (EN) |
| **Manager** | `manager` (`manager@cgi.internal`) | `manager123` | Full access (ES) |
| **Technician** | `technician` (`tech@cgi.internal`) | `tech123` | Plant-wide equipment & manuals (EN) |
| **Operator** | `operator1` (`operator1@cgi.internal`) | `operator123` | **Scoped** to `EQ-CUT-01` & `EQ-EDGE-01` (ES) |
| **Viewer** | `viewer` (`viewer@cgi.internal`) | `viewer123` | Read-only supervisor view (EN) |
