const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../client/src/locales/en.json');
const esPath = path.join(__dirname, '../client/src/locales/es.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));

// Augment common section
enData.common = {
  ...enData.common,
  help: "Help & Guides",
  quick_ref: "Quick-Ref Card",
  open_help: "Open Help",
  tour: "Guided Tour",
  restart_tour: "Restart Guided Tour",
  print: "Print",
  all: "All",
  step: "Step",
  of: "of"
};

esData.common = {
  ...esData.common,
  help: "Ayuda y Guías",
  quick_ref: "Guía Rápida",
  open_help: "Abrir Ayuda",
  tour: "Recorrido Guiado",
  restart_tour: "Reiniciar Recorrido",
  print: "Imprimir",
  all: "Todos",
  step: "Paso",
  of: "de"
};

// Help section
enData.help = {
  panel_title: "Help & How-To Guides",
  panel_subtitle: "Task-oriented walkthroughs, procedures, and plant reference cards",
  select_module: "Select Module Guide:",
  your_role: "Your Current Role:",
  role_operator: "Operator: View your assigned machinery, log runtime hours, review work orders, and submit spare parts requisitions.",
  role_technician: "Technician: Execute work orders, complete checklist steps, log labor hours & downtime, auto-deduct parts from inventory, and order parts.",
  role_manager: "Manager/Admin: Supervise plant uptime, configure calendar/meter PM triggers, manage inventory thresholds, and assign equipment to operators.",
  role_viewer: "Viewer: Read-only access to equipment records, maintenance history, and parts catalog.",
  actions_heading: "Quick Learning Actions",
  tour_button: "Interactive Walkthrough",
  tour_button_sub: "Guided spotlight of key buttons & features on this screen",
  quickref_button: "Print Role Quick-Ref Card",
  quickref_button_sub: "One-page printable cheat sheet for shop floor or workstation",
  tasks_heading: "How Do I... (Task Procedures)",
  step_label: "Step",
  tip_label: "Pro Tip:",
  all_roles_badge: "All Roles",
  operator_badge: "Operator",
  technician_badge: "Technician",
  manager_badge: "Manager / Admin",
  modules: {
    dashboard: {
      name: "Shop Wallboard",
      summary: "The central shop-floor command center. Monitors real-time machine uptime, current equipment outages, open maintenance work orders, and aging parts requisitions.",
      tasks: [
        {
          title: "How to monitor shop uptime and machine status",
          target_roles: ["all"],
          steps: [
            "Check the top KPI banner for current plant uptime percentage and total active vs down machines.",
            "Review the machinery grid to see color-coded status badges: Green (Active), Red (Down), Yellow (In Storage), or Slate (Retired).",
            "Use the auto-refresh toggle (30s) or click 'Refresh Grid' anytime to load the latest machine states.",
            "Toggle time windows (Today, Last 7 Days, Last 30 Days) to analyze uptime trends."
          ],
          tip: "Keep this screen visible on wallboards and tablet stands near the production lines for instant shift visibility."
        },
        {
          title: "How to respond to an active machine outage",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Locate the machine in the 'Active Equipment Outages & Downtime' panel on the left.",
            "Observe the live running timer showing exactly how long the machine has been down.",
            "Click 'View Machine' to open the equipment details and review OEM manuals, or go to Work Orders to create a corrective repair ticket."
          ],
          tip: "Recording accurate failure reasons during work order execution directly feeds the plant's MTBF/MTTR reliability reports."
        },
        {
          title: "How to monitor aging parts requisitions",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Inspect the 'Open Parts Requisitions Aging Queue' panel on the right.",
            "Look for items tagged with red 'URGENT' badges indicating machinery is impaired or halted.",
            "Click 'Review Requisition' on any card to update its purchasing status or add supervisor notes."
          ],
          tip: "Parts requested with 'Urgent' status automatically trigger priority webhook notifications."
        }
      ]
    },
    equipment: {
      name: "Equipment Registry",
      summary: "Master directory of plant machinery, parent/child relationships, runtime operating hours, criticalities, and digital OEM service manuals.",
      tasks: [
        {
          title: "How to find your assigned machines (Operators)",
          target_roles: ["operator"],
          steps: [
            "Your view is automatically filtered to show only the machines assigned to your shift by plant supervisors.",
            "Review machine status, category, asset tag, and serial number on each machine card.",
            "Use the search bar at the top to filter by machine name or asset ID (e.g., 'CNC-01' or 'Bystronic')."
          ],
          tip: "If a machine is missing from your screen, ask your Maintenance Supervisor to assign it in User Management."
        },
        {
          title: "How to view and download equipment manuals",
          target_roles: ["all"],
          steps: [
            "Click 'Documents & Manuals' on any equipment card to open the document drawer.",
            "Click 'View / Download' to open the OEM service manual, electrical schematic, or parts diagram in a new tab.",
            "Supervisors can click 'Upload Manual' to attach newly released PDF documentation directly to the asset."
          ],
          tip: "Manuals are stored securely on the server and are accessible from any tablet on the plant Wi-Fi."
        },
        {
          title: "How to add a new piece of equipment (Admins/Managers)",
          target_roles: ["manager", "admin"],
          steps: [
            "Click '+ Add Equipment' in the top right corner of the screen.",
            "Enter the Asset Tag (must be unique, e.g. 'CUT-01'), machine name, category, serial number, and vendor.",
            "Set the location (Building and Department Area), operating hours, criticality rating, and initial operational status.",
            "Click 'Save Equipment' to register the machine and generate its system record."
          ],
          tip: "The system automatically prevents duplicate Asset Tags and Serial Numbers to preserve database integrity."
        }
      ]
    },
    work_orders: {
      name: "Work Orders",
      summary: "The maintenance execution workspace. Technicians follow interactive checklist steps, log actual labor hours, record downtime minutes, and auto-deduct consumed parts from inventory.",
      tasks: [
        {
          title: "How to execute a work order and complete checklists",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Click 'Open / Execute' on any work order card to launch the Execution Modal.",
            "Review work order type (Preventive, Corrective Repair, Inspection) and due date.",
            "Check off checklist tasks as you perform them and add measurement notes in the field provided.",
            "Click 'Save Progress' anytime to record partial work without closing the ticket."
          ],
          tip: "Saving progress lets multiple shifts collaborate on complex repairs without losing checklist history."
        },
        {
          title: "How to record consumed parts with automatic stock deduction",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Scroll down to 'Parts Consumed & Inventory Deduction' inside the Execution Modal.",
            "Select the replacement part from the catalog dropdown and specify the quantity used.",
            "Click '+ Add Used Part'. The system instantly checks current stock and deducts the quantity from the parts inventory table.",
            "Unit costs and total parts spend roll up automatically to the asset's total maintenance cost."
          ],
          tip: "If an admin later deletes a work order, the consumed parts are automatically refunded back into inventory stock."
        },
        {
          title: "How to close and sign off a completed work order",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Enter total actual labor hours logged and total machine downtime minutes.",
            "Select or enter the failure root cause and provide corrective resolution notes.",
            "For supervisor sign-off, enter the supervisor's name and click 'Approve & Sign Off'.",
            "Click 'Complete Work Order' to transition status to Closed and record completion timestamp."
          ],
          tip: "Completed PM work orders automatically reset the next due date and meter threshold on the parent PM schedule."
        }
      ]
    },
    pm_schedules: {
      name: "PM Schedules",
      summary: "The automated preventive maintenance engine. Defines maintenance cycles based on calendar intervals (days), runtime operating meters (hours), or whichever comes first.",
      tasks: [
        {
          title: "How calendar and runtime meter triggers work",
          target_roles: ["manager", "admin", "technician"],
          steps: [
            "When creating or editing a schedule, choose 'Trigger Method': Calendar (e.g. 30 days), Meter (e.g. 250 operating hours), or Whichever Comes First.",
            "Calendar triggers compare the current date against 'Next Due Date'.",
            "Meter triggers compare the machine's current operating hours against the 'Next Due Meter' threshold.",
            "When either threshold is reached, the schedule's status turns yellow ('DUE SOON') or red ('OVERDUE')."
          ],
          tip: "Use 'Whichever Comes First' for high-production cutting and edging lines that run double shifts."
        },
        {
          title: "How to scan due PMs and auto-generate work orders",
          target_roles: ["manager", "admin", "technician"],
          steps: [
            "Click 'Scan Due PMs & Auto-Generate WOs' in the top action bar.",
            "The backend scans all configured PM schedules against current calendar dates and machine meters.",
            "Any schedule currently due or overdue automatically generates a new open Work Order with pre-populated checklist items and estimated labor hours.",
            "To force a work order immediately for an individual schedule, click the lightning bolt 'Generate WO Now' icon."
          ],
          tip: "The auto-scan can be run every morning at shift start to queue up the day's preventive maintenance jobs."
        },
        {
          title: "How to configure custom maintenance checklists",
          target_roles: ["manager", "admin"],
          steps: [
            "In the Create or Edit PM Schedule modal, scroll to 'Maintenance Checklist Items'.",
            "Click '+ Add Checklist Step' to add items (e.g., 'Check water filtration pressure', 'Grease linear guide bearings').",
            "Use the trash icon to remove unnecessary steps.",
            "Checklist steps are automatically embedded into every work order generated by this schedule."
          ],
          tip: "Specific, numbered checklist steps ensure consistent preventative maintenance across all technician shifts."
        }
      ]
    },
    parts_requests: {
      name: "Parts Requests",
      summary: "Shop floor requisition queue for replacement parts, tooling, and consumables. Features direct mobile photo capture with server-side compression and urgency alerts.",
      tasks: [
        {
          title: "How to submit a replacement part request with photos",
          target_roles: ["all"],
          steps: [
            "Click '+ Request Part' in the top right corner of the screen.",
            "Select the machine that requires the part from the dropdown.",
            "Select an existing item from the Parts Catalog, or type a custom part description if it is not cataloged.",
            "Enter quantity needed and describe the symptoms or reason (e.g. 'Cracked vacuum pad leaking air').",
            "Click 'Attach Photo' to capture a live photo with your mobile camera or upload an image file.",
            "Select Urgency: Low (Preventive/Future), Normal (Standard Restock), or Urgent (Machine Impaired/Down).",
            "Click 'Submit Requisition' to save and alert maintenance supervisors."
          ],
          tip: "Attaching a photo speeds up supervisor approvals significantly by verifying exact part geometry and wear."
        },
        {
          title: "Why urgency levels matter",
          target_roles: ["all"],
          steps: [
            "Urgent: Machine is actively down or unable to hold tolerance. Requests are flagged with bright red tags and prioritized at the top of the queue.",
            "Normal: Machine is running but part is worn or near end of life. Standard restock lead time applies.",
            "Low: Scheduled consumable restocking or spare backup for future maintenance."
          ],
          tip: "Only select 'Urgent' if production is actively interrupted or immediate breakdown is imminent."
        },
        {
          title: "How supervisors review and approve requisitions",
          target_roles: ["manager", "admin"],
          steps: [
            "Click 'Review / Status' on any requisition card.",
            "Review requester name, timestamp, failure symptoms, and high-resolution compressed photo.",
            "Update the status: 'Approved', 'Ordered', 'Received', or 'Rejected'.",
            "Add supervisor notes to notify the requester (e.g., 'PO #4920 placed with CR Laurence, ETA Wednesday').",
            "Click 'Save Decision' to update the ticket and record an audit log entry."
          ],
          tip: "Approved parts can be quickly cross-referenced against storage bins in the Parts Inventory module."
        }
      ]
    },
    parts_catalog: {
      name: "Parts Inventory",
      summary: "Plant spare parts and tooling catalog. Tracks stock levels, storage bin locations, unit costs, preferred suppliers, and reorder minimums.",
      tasks: [
        {
          title: "How to locate parts by storage bin and part number",
          target_roles: ["all"],
          steps: [
            "Use the search box to filter by part number (e.g., 'WH-01'), part name, or category.",
            "Inspect the 'Storage Bin' column to find the physical bin location in the maintenance parts room (e.g., 'Bin A-12' or 'Cabinet 3').",
            "Check the 'In Stock' column to verify current on-hand availability before starting a repair."
          ],
          tip: "Always check bin locations before requesting parts to avoid ordering items already in the tool room."
        },
        {
          title: "How min/max thresholds and low-stock alerts work",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Every catalog item has a 'Min / Reorder' threshold set by management.",
            "When current stock drops below or equal to the minimum, the row is flagged with a red 'LOW STOCK' badge.",
            "Items with low stock appear on supervisor replenishment summaries to trigger purchase orders before stockouts occur."
          ],
          tip: "Consuming parts on work orders immediately recalculates stock levels against min thresholds."
        },
        {
          title: "How to add or edit catalog items (Admins/Managers)",
          target_roles: ["manager", "admin"],
          steps: [
            "Click '+ Add Catalog Item' to register a new part.",
            "Provide unique Part Number, descriptive Name, Category, initial On-Hand Stock, Min Reorder Level, and Storage Bin.",
            "Enter Unit Cost ($) and Preferred Supplier to ensure accurate cost rollups on maintenance work orders.",
            "Click 'Save Part' to add it to the active catalog."
          ],
          tip: "Unit costs are multiplied by consumed quantity on work orders to calculate total maintenance repair costs."
        }
      ]
    },
    analytics: {
      name: "Analytics & Reports",
      summary: "Executive reliability and cost intelligence. Tracks PM compliance rate (>95% target), MTBF, MTTR, technician labor hours, and maintenance cost rollups per machine.",
      tasks: [
        {
          title: "How to interpret MTBF and MTTR metrics",
          target_roles: ["manager", "admin", "technician"],
          steps: [
            "MTBF (Mean Time Between Failures): Average operating hours between breakdowns. Higher numbers indicate higher machine reliability.",
            "MTTR (Mean Time to Repair): Average hours required to diagnose and resolve an outage. Lower numbers indicate faster maintenance response.",
            "Review the 'Asset Reliability Metrics' table to identify chronic problem machines with high breakdown counts."
          ],
          tip: "Machines with low MTBF and high MTTR should be targeted for increased preventive maintenance or vendor overhaul."
        },
        {
          title: "How PM compliance rate is calculated",
          target_roles: ["manager", "admin"],
          steps: [
            "The top left gauge shows the plant's overall PM Compliance Rate percentage.",
            "Formula: (PMs Completed On or Before Due Date / Total Due PMs) × 100.",
            "Green indicators indicate meeting or exceeding the plant target (>95%). Yellow and red indicate overdue maintenance backlogs."
          ],
          tip: "Consistently maintaining >95% PM compliance is proven to reduce unscheduled breakdown downtime by over 40%."
        },
        {
          title: "How maintenance costs roll up per asset",
          target_roles: ["manager", "admin"],
          steps: [
            "Inspect the 'Maintenance Cost by Asset' table.",
            "Labor Cost is calculated automatically from actual labor hours logged on work orders at the plant labor rate ($65/hr).",
            "Parts Spend is calculated from actual catalog unit costs multiplied by consumed quantities.",
            "Total Spend rolls up both labor and parts to help management make data-driven repair-vs-replace decisions."
          ],
          tip: "Compare an asset's total yearly maintenance spend against replacement capital cost to justify equipment upgrades."
        }
      ]
    },
    users: {
      name: "User Management",
      summary: "Plant role-based access control (RBAC) and operator machine scoping. Controls permissions and scopes operators to their assigned shift equipment.",
      tasks: [
        {
          title: "How operator machine scoping works",
          target_roles: ["manager", "admin"],
          steps: [
            "Operators have scoped access enforced directly at the API layer for plant safety and simplicity.",
            "When an operator logs in, they only see machines assigned to them, and can only submit parts requests for those specific assets.",
            "Managers, Admins, and Technicians retain plant-wide visibility across all machinery."
          ],
          tip: "Scoped views prevent operators from accidentally requesting parts or reporting status on machinery outside their department."
        },
        {
          title: "How to assign machines to an operator",
          target_roles: ["manager", "admin"],
          steps: [
            "Find the operator in the User Directory table.",
            "Click the 'Assign Machines' button in their row.",
            "In the multi-select modal, check all machines the operator is qualified to run on their shift.",
            "Click 'Save Assignments' to persist the permissions to the database immediately."
          ],
          tip: "The operator's screen updates immediately upon their next action or page refresh."
        },
        {
          title: "How to reset passwords and manage roles",
          target_roles: ["admin"],
          steps: [
            "Click the key icon 'Reset Password' to set a new password for any user who forgot their credentials.",
            "Click the pencil icon 'Edit User' to update full name, email, default language preference, or system role.",
            "Admins cannot delete their own account, preventing accidental lockouts."
          ],
          tip: "Language preference set on a user profile loads automatically whenever that user logs into any plant device."
        }
      ]
    }
  }
};

// Help section (Spanish)
esData.help = {
  panel_title: "Guías de Ayuda y Procedimientos",
  panel_subtitle: "Procedimientos paso a paso, guías prácticas y tarjetas de referencia de planta",
  select_module: "Seleccionar Guía del Módulo:",
  your_role: "Su Rol Actual:",
  role_operator: "Operador: Vea su maquinaria asignada, registre horas de uso, revise órdenes de trabajo y solicite repuestos.",
  role_technician: "Técnico: Ejecute órdenes de trabajo, complete listas de chequeo, registre mano de obra/paradas, descuente repuestos y solicite herramientas.",
  role_manager: "Gerente/Admin: Supervise disponibilidad de planta, configure activadores de MP, gestione umbrales de inventario y asigne maquinaria.",
  role_viewer: "Observador: Acceso de solo lectura al estado de planta, maquinaria y catálogo de repuestos.",
  actions_heading: "Acciones Rápidas de Aprendizaje",
  tour_button: "Recorrido Interactivo",
  tour_button_sub: "Explicación visual interactiva de los controles de esta pantalla",
  quickref_button: "Imprimir Tarjeta de Referencia Rápida",
  quickref_button_sub: "Guía de una página imprimible para la planta o estación de trabajo",
  tasks_heading: "¿Cómo puedo...? (Procedimientos Prácticos)",
  step_label: "Paso",
  tip_label: "Consejo Útil:",
  all_roles_badge: "Todos los Roles",
  operator_badge: "Operador",
  technician_badge: "Técnico",
  manager_badge: "Gerente / Admin",
  modules: {
    dashboard: {
      name: "Mural de Planta",
      summary: "El centro de control principal de la planta. Monitorea en tiempo real la disponibilidad operativa, paradas de maquinaria activas, órdenes de trabajo abiertas y solicitudes de repuestos pendientes.",
      tasks: [
        {
          title: "Cómo monitorear la disponibilidad y estado de maquinaria",
          target_roles: ["all"],
          steps: [
            "Revise el indicador superior para ver el porcentaje de disponibilidad de la planta y el total de máquinas activas vs fuera de servicio.",
            "Inspeccione la cuadrícula de maquinaria para ver el estado por colores: Verde (Operativa), Rojo (Fuera de Servicio), Amarillo (En Almacén) o Gris (Retirada).",
            "Utilice el interruptor de auto-actualización (30s) o haga clic en 'Actualizar Cuadrícula' en cualquier momento.",
            "Cambie entre ventanas de tiempo (Hoy, Últimos 7 Días, Últimos 30 Días) para evaluar tendencias de disponibilidad."
          ],
          tip: "Mantenga esta pantalla visible en pantallas de pared y soportes para tabletas cerca de las líneas de producción para visibilidad inmediata."
        },
        {
          title: "Cómo responder ante una avería o parada activa",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Localice la máquina en el panel 'Paradas Activas de Maquinaria e Inactividad' a la izquierda.",
            "Observe el cronómetro en vivo que muestra exactamente cuánto tiempo ha estado detenida la máquina.",
            "Haga clic en 'Ver Máquina' para abrir los detalles y manuales OEM, o diríjase a Órdenes de Trabajo para generar una orden de reparación correctiva."
          ],
          tip: "Registrar causas raíz precisas durante la ejecución de las órdenes de trabajo alimenta directamente los informes de confiabilidad MTBF/MTTR."
        },
        {
          title: "Cómo monitorear solicitudes de repuestos pendientes por antigüedad",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Inspeccione el panel 'Cola de Solicitudes de Repuestos Pendientes por Antigüedad' a la derecha.",
            "Identifique elementos marcados con la etiqueta roja 'URGENTE' que indican que una máquina está averiada o detenida.",
            "Haga clic en 'Revisar Solicitud' en cualquier tarjeta para actualizar su estado de compra o agregar notas de supervisión."
          ],
          tip: "Las solicitudes marcadas con urgencia 'Urgente' generan automáticamente notificaciones prioritarias por webhook."
        }
      ]
    },
    equipment: {
      name: "Registro de Maquinaria",
      summary: "Directorio maestro de maquinaria de la planta, relaciones padre/hijo, horómetros de uso, niveles de criticidad y manuales de servicio OEM digitalizados.",
      tasks: [
        {
          title: "Cómo encontrar sus máquinas asignadas (Operadores)",
          target_roles: ["operator"],
          steps: [
            "Su vista está filtrada automáticamente para mostrar únicamente la maquinaria asignada a su turno por los supervisores.",
            "Revise el estado operativo, categoría, placa de activo y número de serie en cada tarjeta.",
            "Use la barra de búsqueda superior para filtrar por nombre de máquina o placa (ej. 'CNC-01' o 'Bystronic')."
          ],
          tip: "Si falta alguna máquina en su pantalla, solicite a su Supervisor de Mantenimiento que se la asigne en Gestión de Usuarios."
        },
        {
          title: "Cómo ver y descargar manuales de servicio",
          target_roles: ["all"],
          steps: [
            "Haga clic en 'Documentos y Manuales' en la tarjeta de cualquier equipo para desplegar el panel de documentos.",
            "Haga clic en 'Ver / Descargar' para abrir el manual de servicio OEM, diagrama eléctrico o despiece en una nueva pestaña.",
            "Los supervisores pueden hacer clic en 'Subir Manual' para adjuntar documentación técnica en PDF directamente al activo."
          ],
          tip: "Los manuales se almacenan de forma segura en el servidor y son accesibles desde cualquier tableta conectada a la red Wi-Fi de la planta."
        },
        {
          title: "Cómo registrar un nuevo equipo (Admins/Gerentes)",
          target_roles: ["manager", "admin"],
          steps: [
            "Haga clic en '+ Agregar Equipo' en la esquina superior derecha de la pantalla.",
            "Ingrese la Placa de Activo (debe ser única, ej. 'CUT-01'), nombre de la máquina, categoría, número de serie y fabricante.",
            "Defina la ubicación (Edificio y Área de Departamento), horas de operación acumuladas, criticidad y estado inicial.",
            "Haga clic en 'Guardar Equipo' para dar de alta la máquina en el sistema."
          ],
          tip: "El sistema valida automáticamente que no existan duplicados en Placas de Activo ni Números de Serie para proteger la base de datos."
        }
      ]
    },
    work_orders: {
      name: "Órdenes de Trabajo",
      summary: "El centro de ejecución de mantenimiento. Los técnicos siguen listas de chequeo interactivas, registran horas de trabajo reales, minutos de parada y descuentan repuestos automáticamente del inventario.",
      tasks: [
        {
          title: "Cómo ejecutar una orden de trabajo y completar la lista de chequeo",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Haga clic en 'Abrir / Ejecutar' en cualquier orden de trabajo para abrir el modal de ejecución.",
            "Revise el tipo de trabajo (Preventivo, Reparación Correctiva, Inspección) y la fecha de vencimiento.",
            "Marque las casillas de verificación a medida que realiza cada tarea y agregue lecturas o notas en el campo correspondiente.",
            "Haga clic en 'Guardar Progreso' en cualquier momento para registrar avances sin cerrar la orden."
          ],
          tip: "Guardar el progreso permite que diferentes turnos colaboren en reparaciones extensas sin perder el historial."
        },
        {
          title: "Cómo registrar repuestos utilizados con descuento automático de inventario",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Desplácese a la sección 'Repuestos Utilizados y Descuento de Inventario' dentro del modal de ejecución.",
            "Seleccione el repuesto del catálogo desplegable e indique la cantidad consumida.",
            "Haga clic en '+ Agregar Repuesto Utilizado'. El sistema descuenta inmediatamente la cantidad del stock en la tabla de inventario.",
            "Los costos unitarios y gasto total se acumulan automáticamente en el costo de mantenimiento del activo."
          ],
          tip: "Si un administrador elimina una orden de trabajo posteriormente, los repuestos consumidos se devuelven automáticamente al inventario."
        },
        {
          title: "Cómo cerrar y firmar una orden de trabajo finalizada",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Ingrese el total de horas de mano de obra reales registradas y los minutos totales de parada de máquina.",
            "Seleccione o ingrese la causa raíz de la avería y describa las acciones correctivas de resolución.",
            "Para el visto bueno de supervisión, ingrese el nombre del supervisor y haga clic en 'Aprobar y Firmar'.",
            "Haga clic en 'Completar Orden de Trabajo' para cambiar el estado a Cerrada y registrar la fecha de finalización."
          ],
          tip: "Las órdenes de mantenimiento preventivo completadas reinician automáticamente la próxima fecha y el límite de horómetro en el programa de MP."
        }
      ]
    },
    pm_schedules: {
      name: "Programas de MP",
      summary: "El motor automatizado de mantenimiento preventivo. Define ciclos de mantenimiento basados en días de calendario, horómetros de operación acumulados o lo que ocurra primero.",
      tasks: [
        {
          title: "Cómo funcionan los activadores por calendario y horómetro",
          target_roles: ["manager", "admin", "technician"],
          steps: [
            "Al crear o editar un programa, elija el 'Método de Activación': Calendario (ej. 30 días), Horómetro (ej. 250 horas de operación) o Lo Que Ocurra Primero.",
            "Los activadores por calendario comparan la fecha actual con la 'Próxima Fecha de Vencimiento'.",
            "Los activadores por horómetro comparan las horas de operación acumuladas del equipo con el límite programado.",
            "Cuando se alcanza cualquiera de los dos límites, el estado del programa cambia a amarillo ('VENCE PRONTO') o rojo ('VENCIDO')."
          ],
          tip: "Use 'Lo Que Ocurra Primero' en líneas de corte y canteado de alta producción que operan en doble turno."
        },
        {
          title: "Cómo escanear programas vencidos y auto-generar órdenes de trabajo",
          target_roles: ["manager", "admin", "technician"],
          steps: [
            "Haga clic en 'Escanear MP Vencidos y Auto-Generar OT' en la barra de acciones superior.",
            "El servidor analiza todos los programas configurados comparando fechas actuales y horómetros de las máquinas.",
            "Cualquier programa vencido o próximo a vencer genera automáticamente una nueva Orden de Trabajo abierta con las tareas de verificación precargadas.",
            "Para generar una orden de trabajo inmediata para un programa individual, haga clic en el icono del rayo 'Generar OT Ahora'."
          ],
          tip: "Este escaneo automático puede ejecutarse al inicio de cada jornada para organizar el plan de trabajo del día."
        },
        {
          title: "Cómo configurar listas de verificación personalizadas",
          target_roles: ["manager", "admin"],
          steps: [
            "En el modal de Crear o Editar Programa de MP, desplácese a 'Pasos de la Lista de Verificación'.",
            "Haga clic en '+ Agregar Paso a la Lista' para añadir tareas (ej. 'Verificar presión de filtrado de agua', 'Engrasar guías lineales').",
            "Use el icono de papelera para eliminar pasos no deseados.",
            "Estos pasos se incorporan automáticamente a cada orden de trabajo que genera este programa."
          ],
          tip: "Definir pasos claros y numerados garantiza una calidad uniforme en el mantenimiento preventivo entre todos los técnicos."
        }
      ]
    },
    parts_requests: {
      name: "Solicitudes de Repuestos",
      summary: "Cola unificada de solicitudes de repuestos, herramientas y consumibles. Permite capturar fotos directamente desde dispositivos móviles con compresión en el servidor y alertas de urgencia.",
      tasks: [
        {
          title: "Cómo solicitar un repuesto con fotos y nivel de urgencia",
          target_roles: ["all"],
          steps: [
            "Haga clic en '+ Solicitar Repuesto' en la esquina superior derecha de la pantalla.",
            "Seleccione la máquina que requiere el repuesto en el menú desplegable.",
            "Seleccione un artículo existente del Catálogo de Repuestos o escriba una descripción personalizada si no está catalogado.",
            "Indique la cantidad requerida y describa los síntomas o motivo (ej. 'Ventosa agrietada con fuga de vacío').",
            "Haga clic en 'Adjuntar Foto' para tomar una fotografía con la cámara de su teléfono o seleccionar un archivo.",
            "Seleccione el nivel de urgencia: Baja (Preventivo/Futuro), Normal (Reposición Habitual) o Urgente (Máquina Afectada/Parada).",
            "Haga clic en 'Enviar Solicitud' para guardarla y notificar a los supervisores de mantenimiento."
          ],
          tip: "Adjuntar una fotografía agiliza considerablemente la aprobación del supervisor al verificar el modelo exacto y desgaste de la pieza."
        },
        {
          title: "Por qué es importante el nivel de urgencia",
          target_roles: ["all"],
          steps: [
            "Urgente: La máquina está detenida o no puede trabajar dentro de tolerancias. Se resalta con etiqueta roja y se ubica al principio de la lista.",
            "Normal: La máquina continúa operando pero la pieza presenta desgaste o está cerca del final de su vida útil.",
            "Baja: Reposición programada de consumibles o repuestos de reserva para mantenimiento futuro."
          ],
          tip: "Seleccione 'Urgente' únicamente si la producción está detenida o existe riesgo inminente de avería."
        },
        {
          title: "Cómo revisan y aprueban las solicitudes los supervisores",
          target_roles: ["manager", "admin"],
          steps: [
            "Haga clic en 'Revisar / Estado' en cualquier tarjeta de solicitud.",
            "Examine el nombre del solicitante, fecha y hora, síntomas de falla y la foto comprimida en alta resolución.",
            "Actualice el estado: 'Aprobada', 'Pedida', 'Recibida' o 'Rechazada'.",
            "Agregue notas de supervisión para informar al solicitante (ej. 'Orden de compra #4920 emitida, entrega prevista el miércoles').",
            "Haga clic en 'Guardar Decisión' para actualizar la solicitud y registrar la acción en el registro de auditoría."
          ],
          tip: "Las piezas aprobadas pueden cotejarse de inmediato con las ubicaciones de estantería en el Inventario de Repuestos."
        }
      ]
    },
    parts_catalog: {
      name: "Inventario de Repuestos",
      summary: "Catálogo de repuestos y herramientas de la planta. Monitorea niveles de stock, estanterías de almacenamiento, costos unitarios, proveedores preferidos y niveles mínimos de reorden.",
      tasks: [
        {
          title: "Cómo localizar repuestos por estantería y número de parte",
          target_roles: ["all"],
          steps: [
            "Utilice el cuadro de búsqueda para filtrar por número de parte (ej. 'WH-01'), nombre o categoría.",
            "Consulte la columna 'Estantería' para conocer la ubicación física en el pañol de mantenimiento (ej. 'Estante A-12' o 'Gabinete 3').",
            "Verifique la columna 'En Stock' para confirmar la disponibilidad física antes de comenzar una reparación."
          ],
          tip: "Verifique siempre la estantería antes de solicitar un repuesto para evitar ordenar piezas que ya están en existencia."
        },
        {
          title: "Cómo funcionan los umbrales mínimos y alertas de bajo stock",
          target_roles: ["technician", "manager", "admin"],
          steps: [
            "Cada artículo del catálogo tiene un umbral 'Mínimo / Reorden' configurado por la gerencia.",
            "Cuando el stock desciende por debajo o igual al mínimo, la fila se resalta con la etiqueta roja 'BAJO STOCK'.",
            "Los artículos con bajo stock aparecen en los informes de reabastecimiento para emitir órdenes de compra a tiempo."
          ],
          tip: "Consumir repuestos en órdenes de trabajo recalcula de inmediato los niveles de stock contra los umbrales mínimos."
        },
        {
          title: "Cómo agregar o editar repuestos en el catálogo (Admins/Gerentes)",
          target_roles: ["manager", "admin"],
          steps: [
            "Haga clic en '+ Agregar al Catálogo' para registrar una nueva pieza.",
            "Indique Número de Parte único, Nombre descriptivo, Categoría, Stock Inicial, Nivel Mínimo y Estantería.",
            "Ingrese el Costo Unitario ($) y Proveedor Preferido para garantizar un cálculo preciso en las órdenes de trabajo.",
            "Haga clic en 'Guardar Repuesto' para incorporarlo al catálogo activo."
          ],
          tip: "El costo unitario se multiplica por la cantidad consumida en las órdenes de trabajo para calcular el costo total de reparación."
        }
      ]
    },
    analytics: {
      name: "Análisis e Informes",
      summary: "Inteligencia operativa y costos de mantenimiento. Monitorea tasa de cumplimiento de MP (meta >95%), MTBF, MTTR, horas de trabajo de técnicos y costos acumulados por máquina.",
      tasks: [
        {
          title: "Cómo interpretar las métricas de confiabilidad MTBF y MTTR",
          target_roles: ["manager", "admin", "technician"],
          steps: [
            "MTBF (Tiempo Medio Entre Fallas): Promedio de horas de operación entre averías. Un número mayor indica mayor confiabilidad.",
            "MTTR (Tiempo Medio de Reparación): Promedio de horas requeridas para diagnosticar y solucionar una parada. Un número menor indica respuesta más rápida.",
            "Examine la tabla 'Métricas de Confiabilidad' para identificar máquinas con alto historial de averías."
          ],
          tip: "Los equipos con bajo MTBF y alto MTTR deben priorizarse para mayor mantenimiento preventivo o revisión con el fabricante."
        },
        {
          title: "Cómo se calcula la tasa de cumplimiento de MP",
          target_roles: ["manager", "admin"],
          steps: [
            "El indicador superior izquierdo muestra el porcentaje global de cumplimiento de mantenimiento preventivo de la planta.",
            "Fórmula: (MP Completados en o antes de la fecha límite / Total de MP vencidos) × 100.",
            "Los valores en verde indican cumplimiento de la meta de la planta (>95%). Amarillo y rojo advierten acumulación de mantenimientos atrasados."
          ],
          tip: "Mantener un cumplimiento superior al 95% reduce las paradas imprevistas por averías en más de un 40%."
        },
        {
          title: "Cómo se calculan los costos de mantenimiento por equipo",
          target_roles: ["manager", "admin"],
          steps: [
            "Consulte la tabla 'Costo de Mantenimiento por Activo'.",
            "El Costo de Mano de Obra se calcula automáticamente multiplicando las horas registradas en las órdenes de trabajo por la tarifa de planta ($65/h).",
            "El Gasto en Repuestos se calcula sumando el costo unitario por la cantidad de piezas consumidas.",
            "El Gasto Total consolida mano de obra y repuestos para ayudar a la gerencia a decidir entre reparar o reemplazar."
          ],
          tip: "Compare el gasto de mantenimiento anual de un activo frente a su costo de reemplazo para justificar inversiones en maquinaria nueva."
        }
      ]
    },
    users: {
      name: "Gestión de Usuarios",
      summary: "Control de acceso basado en roles (RBAC) y asignación de maquinaria para operadores. Administra permisos y restringe operadores a su equipo de turno asignado.",
      tasks: [
        {
          title: "Cómo funciona la asignación restringida de maquinaria para operadores",
          target_roles: ["manager", "admin"],
          steps: [
            "Los operadores tienen un alcance delimitado directamente a nivel de API para mayor seguridad y claridad operativa.",
            "Al iniciar sesión, un operador solo visualiza la maquinaria que le fue asignada y solo puede solicitar repuestos para esos activos.",
            "Los Gerentes, Administradores y Técnicos conservan visibilidad completa sobre todos los equipos de la planta."
          ],
          tip: "La asignación delimitada evita que los operadores soliciten repuestos o consulten maquinaria fuera de su sector de trabajo."
        },
        {
          title: "Cómo asignar maquinaria a un operador",
          target_roles: ["manager", "admin"],
          steps: [
            "Busque al operador en la tabla del Directorio de Usuarios.",
            "Haga clic en el botón 'Asignar Máquinas' en su fila correspondiente.",
            "En la ventana de selección múltiple, marque todas las máquinas que el operador está capacitado para operar en su turno.",
            "Haga clic en 'Guardar Asignaciones' para aplicar los cambios inmediatamente en la base de datos."
          ],
          tip: "La pantalla del operador se actualiza de inmediato en su siguiente acción o actualización de página."
        },
        {
          title: "Cómo restablecer contraseñas y administrar roles",
          target_roles: ["admin"],
          steps: [
            "Haga clic en el icono de llave 'Restablecer Contraseña' para definir una nueva contraseña si un usuario olvidó sus credenciales.",
            "Haga clic en el lápiz 'Editar Usuario' para modificar nombre, correo, idioma predeterminado o rol en el sistema.",
            "Los administradores no pueden eliminar su propia cuenta, previniendo bloqueos accidentales."
          ],
          tip: "El idioma configurado en el perfil de usuario se carga automáticamente cada vez que inicia sesión en cualquier dispositivo."
        }
      ]
    }
  }
};

// Guided Tour translations
enData.tour = {
  step_counter: "Step {{current}} of {{total}}",
  skip: "Skip Tour",
  back: "Back",
  next: "Next",
  finish: "Got It / Finish",
  dont_show_again: "Don't show this tour on first visit",
  modules: {
    dashboard: [
      {
        title: "Plant Uptime & KPIs",
        description: "The top status bar tracks live plant uptime %, total operational machinery count, active breakdown outages, and open work orders across the Anaheim facility."
      },
      {
        title: "Active Equipment Outages",
        description: "The left panel logs all currently down machinery in real time with running outage stopwatches and failure reasons to accelerate response."
      },
      {
        title: "Parts Requisition Queue",
        description: "The right panel tracks aging parts requests awaiting review or delivery, highlighting urgent breakdown requisitions in red."
      },
      {
        title: "Auto-Refresh & Time Windows",
        description: "Toggle auto-refresh (30s) for live wallboard displays, or switch time windows between Today, Last 7 Days, and Last 30 Days to analyze operational trends."
      }
    ],
    equipment: [
      {
        title: "Machinery Registry",
        description: "Browse all plant machines with their unique asset tags, locations, serial numbers, operating hours, and operational status."
      },
      {
        title: "Operator Scoping",
        description: "Operators automatically see only machines assigned to their shift, while technicians and managers see the entire plant fleet."
      },
      {
        title: "Digital Service Manuals",
        description: "Click 'Documents & Manuals' on any machine to view OEM PDF documentation, electrical schematics, and parts breakdown diagrams."
      },
      {
        title: "Equipment Administration",
        description: "Admins and Managers can add new machinery, update runtime meters, edit serial numbers, or upload technical documentation."
      }
    ],
    work_orders: [
      {
        title: "Work Order Queue",
        description: "View and filter all maintenance work orders by status: Open, In Progress, On Hold for parts, or Completed."
      },
      {
        title: "Execution & Checklists",
        description: "Click 'Open / Execute' on any work order to follow step-by-step checklist tasks, enter sensor readings, and record progress."
      },
      {
        title: "Parts Consumption & Auto-Deduction",
        description: "Select consumed spare parts directly inside the execution modal. Stock is automatically deducted from inventory in real time."
      },
      {
        title: "Downtime & Root Cause Logging",
        description: "Record actual labor hours, machine downtime duration, and root causes before supervisor approval and final sign-off."
      }
    ],
    pm_schedules: [
      {
        title: "Preventive Maintenance Cadence",
        description: "Manage maintenance routines configured to trigger based on calendar intervals (days) or runtime operating meters (hours)."
      },
      {
        title: "Upcoming & Overdue Triggers",
        description: "Track next due dates and meter targets. Schedules turn yellow when due soon and red when overdue."
      },
      {
        title: "Automated Work Order Scanner",
        description: "Click 'Scan Due PMs & Auto-Generate WOs' to scan all equipment schedules and generate ready-to-execute work orders with checklists."
      },
      {
        title: "Instant Manual Generation",
        description: "Click the lightning bolt 'Generate WO Now' icon on any schedule to trigger an immediate work order on demand."
      }
    ],
    parts_requests: [
      {
        title: "Parts Requisition Queue",
        description: "Review all replacement parts requested by machine operators and technicians on the shop floor."
      },
      {
        title: "Submitting Requests with Photos",
        description: "Click '+ Request Part' to submit a requisition with mobile camera photos automatically compressed on the server."
      },
      {
        title: "Urgency Flags",
        description: "Requests are classified as Urgent (machine down), Normal, or Low. Urgent items appear prominently at the top of the queue."
      },
      {
        title: "Supervisor Purchasing Review",
        description: "Managers can approve, mark as ordered, add purchase order notes, and mark parts as received when delivered."
      }
    ],
    parts_catalog: [
      {
        title: "Spare Parts Catalog",
        description: "Search parts by part number, name, or category to check current on-hand stock and physical tool-room bin locations."
      },
      {
        title: "Low Stock Indicators",
        description: "Items that fall below minimum reorder thresholds are automatically highlighted with red 'LOW STOCK' badges."
      },
      {
        title: "Automatic Inventory Sync",
        description: "When technicians complete work orders, parts consumed are automatically deducted from stock without manual spreadsheets."
      },
      {
        title: "Catalog Maintenance",
        description: "Managers and Admins can add new replacement parts, adjust unit costs, and update preferred suppliers."
      }
    ],
    analytics: [
      {
        title: "Plant Reliability Metrics",
        description: "Analyze Mean Time Between Failures (MTBF) and Mean Time to Repair (MTTR) across all plant machinery."
      },
      {
        title: "PM Compliance Target (>95%)",
        description: "Monitor the percentage of preventive maintenance completed on time against the plant's 95% reliability benchmark."
      },
      {
        title: "Maintenance Cost Rollup",
        description: "Track total spend per asset broken down by actual technician labor hours ($65/hr) and catalog parts costs."
      },
      {
        title: "Top Consumed Parts",
        description: "Identify high-wear consumables and tooling driving the highest maintenance expenditures."
      }
    ],
    users: [
      {
        title: "User Directory & RBAC",
        description: "Manage plant personnel across five role levels: Administrator, Maintenance Manager, Technician, Operator, and Viewer."
      },
      {
        title: "Operator Machine Scoping",
        description: "Click 'Assign Machines' to configure which specific equipment each operator can see and request parts for on the shop floor."
      },
      {
        title: "Password Resets & Security",
        description: "Quickly reset forgotten passwords or update user language preferences without affecting existing maintenance records."
      },
      {
        title: "Immutable Audit Trail",
        description: "All user creations, role updates, and deletions are permanently logged to the system audit trail."
      }
    ]
  }
};

// Guided Tour translations (Spanish)
esData.tour = {
  step_counter: "Paso {{current}} de {{total}}",
  skip: "Omitir Recorrido",
  back: "Anterior",
  next: "Siguiente",
  finish: "Entendido / Finalizar",
  dont_show_again: "No volver a mostrar en la primera visita",
  modules: {
    dashboard: [
      {
        title: "Disponibilidad y Métricas de Planta",
        description: "La barra superior monitorea el % de disponibilidad en vivo, total de máquinas operativas, paradas por avería y órdenes de trabajo abiertas en la planta de Anaheim."
      },
      {
        title: "Paradas Activas de Maquinaria",
        description: "El panel izquierdo registra en tiempo real las máquinas fuera de servicio con cronómetros de inactividad y motivos de falla para acelerar la respuesta."
      },
      {
        title: "Cola de Solicitudes de Repuestos",
        description: "El panel derecho muestra las solicitudes de repuestos pendientes por antigüedad, destacando en rojo las requisiciones urgentes por máquina detenida."
      },
      {
        title: "Auto-actualización y Períodos de Tiempo",
        description: "Active la auto-actualización (30s) para pantallas de pared o cambie entre Hoy, Últimos 7 Días y Últimos 30 Días para evaluar tendencias."
      }
    ],
    equipment: [
      {
        title: "Registro de Maquinaria",
        description: "Consulte todas las máquinas de la planta con su placa de activo única, ubicación, número de serie, horas de uso y estado operativo."
      },
      {
        title: "Alcance Delimitado para Operadores",
        description: "Los operadores visualizan únicamente la maquinaria asignada a su turno, mientras que técnicos y gerentes tienen acceso a toda la planta."
      },
      {
        title: "Manuales de Servicio Digitales",
        description: "Haga clic en 'Documentos y Manuales' en cualquier equipo para consultar diagramas eléctricos, despieces y manuales de servicio OEM en PDF."
      },
      {
        title: "Administración de Equipos",
        description: "Los Administradores y Gerentes pueden agregar nueva maquinaria, actualizar horómetros, editar datos o adjuntar documentación técnica."
      }
    ],
    work_orders: [
      {
        title: "Cola de Órdenes de Trabajo",
        description: "Consulte y filtre todas las órdenes de trabajo de mantenimiento por estado: Abierta, En Progreso, En Espera de Repuestos o Completada."
      },
      {
        title: "Ejecución y Listas de Chequeo",
        description: "Haga clic en 'Abrir / Ejecutar' en cualquier orden para seguir los pasos de la lista de verificación, registrar lecturas y guardar avances."
      },
      {
        title: "Consumo de Repuestos y Descuento Automático",
        description: "Seleccione los repuestos utilizados directamente dentro del modal de ejecución. El stock se descuenta automáticamente del inventario."
      },
      {
        title: "Registro de Inactividad y Causa Raíz",
        description: "Registre horas de trabajo reales, minutos de parada y causa raíz de la falla antes de la firma de aprobación y cierre de la orden."
      }
    ],
    pm_schedules: [
      {
        title: "Frecuencias de Mantenimiento Preventivo",
        description: "Administre rutinas de mantenimiento configuradas para activarse por intervalos de calendario (días) o por horómetros de operación (horas)."
      },
      {
        title: "Activadores Próximos y Vencidos",
        description: "Monitoree fechas y horas límite. Los programas cambian a amarillo cuando vencen pronto y a rojo cuando están vencidos."
      },
      {
        title: "Escaneo Automático de Órdenes de Trabajo",
        description: "Haga clic en 'Escanear MP Vencidos y Auto-Generar OT' para analizar los programas y generar órdenes de trabajo listas para ejecutar."
      },
      {
        title: "Generación Inmediata a Demanda",
        description: "Haga clic en el rayo 'Generar OT Ahora' en cualquier programa para emitir una orden de trabajo inmediata."
      }
    ],
    parts_requests: [
      {
        title: "Cola de Solicitudes de Repuestos",
        description: "Revise todos los repuestos y consumibles solicitados por operadores de máquina y técnicos en la planta."
      },
      {
        title: "Envío de Solicitudes con Fotografías",
        description: "Haga clic en '+ Solicitar Repuesto' para enviar un pedido con fotos tomadas con el teléfono, comprimidas automáticamente en el servidor."
      },
      {
        title: "Niveles de Urgencia",
        description: "Las solicitudes se clasifican en Urgente (máquina detenida), Normal o Baja. Los pedidos urgentes se ubican primero en la lista."
      },
      {
        title: "Revisión de Compras por Supervisores",
        description: "Los gerentes pueden aprobar pedidos, indicar números de orden de compra, agregar notas y registrar la recepción de piezas."
      }
    ],
    parts_catalog: [
      {
        title: "Catálogo de Repuestos y Herramientas",
        description: "Busque piezas por número de parte, nombre o categoría para verificar existencias y ubicaciones en el pañol de mantenimiento."
      },
      {
        title: "Alertas de Bajo Stock",
        description: "Los artículos cuyas existencias caen por debajo del nivel mínimo se resaltan automáticamente con la etiqueta roja 'BAJO STOCK'."
      },
      {
        title: "Sincronización Automática de Inventario",
        description: "Cuando los técnicos finalizan órdenes de trabajo, los repuestos utilizados se descuentan automáticamente sin planillas manuales."
      },
      {
        title: "Mantenimiento del Catálogo",
        description: "Los Administradores y Gerentes pueden dar de alta repuestos, actualizar costos unitarios y definir proveedores preferidos."
      }
    ],
    analytics: [
      {
        title: "Métricas de Confiabilidad de Planta",
        description: "Analice el Tiempo Medio Entre Fallas (MTBF) y el Tiempo Medio de Reparación (MTTR) de toda la maquinaria de la planta."
      },
      {
        title: "Meta de Cumplimiento de MP (>95%)",
        description: "Supervise el porcentaje de mantenimientos preventivos realizados a tiempo frente al objetivo de confiabilidad del 95%."
      },
      {
        title: "Consolidación de Costos de Mantenimiento",
        description: "Monitoree el gasto total por máquina desglosado en mano de obra de técnicos ($65/h) y costo de repuestos consumidos."
      },
      {
        title: "Repuestos de Mayor Consumo",
        description: "Identifique las herramientas y consumibles de mayor desgaste que representan los mayores costos de mantenimiento."
      }
    ],
    users: [
      {
        title: "Directorio de Usuarios y Roles (RBAC)",
        description: "Administre el personal de la planta en cinco niveles: Administrador, Gerente de Mantenimiento, Técnico, Operador y Observador."
      },
      {
        title: "Asignación Delimitada para Operadores",
        description: "Haga clic en 'Asignar Máquinas' para definir qué equipos específicos puede ver y solicitar repuestos cada operador."
      },
      {
        title: "Restablecimiento de Contraseñas",
        description: "Restablezca contraseñas olvidadas o configure el idioma predeterminado de cada usuario con un solo clic."
      },
      {
        title: "Registro Inmutable de Auditoría",
        description: "Todas las creaciones de usuarios, cambios de roles y bajas quedan registradas permanentemente en el historial de auditoría."
      }
    ]
  }
};

// Quick Reference Card translations
enData.quickref = {
  modal_title: "Role Quick-Reference Guide",
  print_btn: "Print Reference Card (8.5x11)",
  close_btn: "Close Guide",
  switch_role: "Preview / Print Guide for Role:",
  plant_header: "Custom Glass Industries, Inc. • Anaheim Glass Fabrication Plant",
  emergency_notice: "Keep this sheet posted at your workstation or tool chest for quick daily reference.",
  roles: {
    operator: {
      title: "Machine Operator Quick-Reference Guide",
      badge: "Plant Floor Operator",
      shift_checklist_title: "Shift Routine Checklist",
      shift_checklist: [
        "1. Shift Start: Log into PM Portal on your line tablet and verify your assigned machinery is listed.",
        "2. Pre-Check: Perform visual and pneumatic inspection before starting the line (vacuum pads, air pressure, glass guides).",
        "3. Mid-Shift: If strange noises, vibration, or glass chipping occurs, immediately submit a Parts Request.",
        "4. Machine Stoppage: If the machine halts, notify your supervisor immediately so the outage is logged on the Wallboard.",
        "5. Shift End: Clean cutting/washing debris, check oil levels, and ensure work area is clear."
      ],
      sections: [
        {
          heading: "How to Request a Replacement Part",
          steps: [
            "Open 'Parts Requests' from the top navigation bar or machine card.",
            "Click '+ Request Part' and select your machine.",
            "Choose a catalog part OR type a description of the damaged component.",
            "Attach a photo using the tablet camera — clear photos verify part model instantly.",
            "Select Urgency: Urgent (machine down), Normal (running with wear), or Low (future spare).",
            "Click 'Submit Requisition' — supervisors are alerted immediately."
          ]
        },
        {
          heading: "How to Access Equipment Manuals",
          steps: [
            "Navigate to 'My Assigned Equipment'.",
            "Click 'Documents & Manuals' on your machine card.",
            "Click 'View / Download' on any OEM manual or schematic to open it on your tablet."
          ]
        }
      ],
      urgency_guide_title: "Parts Request Urgency Matrix",
      urgency_guide: [
        { level: "URGENT", desc: "Machine is completely stopped or producing defective glass out of spec. Line halted." },
        { level: "NORMAL", desc: "Machine is operating safely but part shows wear, air seepage, or nearing end of life." },
        { level: "LOW", desc: "Routine replacement consumable or spare backup for future maintenance cycles." }
      ],
      contacts_title: "Plant Floor Contacts",
      contacts: [
        { role: "Maintenance Supervisor", ext: "Ext. 204 / Radio Channel 2" },
        { role: "Parts Room / Tool Crib", ext: "Ext. 210 / Bay 3" },
        { role: "Plant Operations Manager", ext: "Ext. 101 / Office" }
      ]
    },
    technician: {
      title: "Maintenance Technician Quick-Reference Guide",
      badge: "Maintenance & Reliability",
      shift_checklist_title: "Shift Maintenance Workflow",
      shift_checklist: [
        "1. Start of Shift: Review the Wallboard for active machine outages and open high-priority work orders.",
        "2. Parts Verification: Verify availability in the Parts Inventory catalog before disassembling equipment.",
        "3. Work Order Execution: Complete each checklist step and record sensor/gauge measurements.",
        "4. Parts Deduction: Record consumed parts inside the work order so stock auto-deducts.",
        "5. Sign-Off & Close: Log actual labor hours, downtime duration, and root cause before closing."
      ],
      sections: [
        {
          heading: "Executing Work Orders & Recording Parts",
          steps: [
            "Open 'Work Orders' and filter by 'Open & Assigned'.",
            "Click 'Open / Execute' on the scheduled ticket to open the execution dialog.",
            "Perform tasks in sequence and check off items as completed.",
            "Under 'Parts Consumed', select each part used from the catalog and enter quantity.",
            "Click '+ Add Used Part' — inventory stock is deducted automatically in real time."
          ]
        },
        {
          heading: "Logging Downtime & Root Cause",
          steps: [
            "Enter exact machine downtime in minutes and your logged technician labor hours.",
            "Select or enter the root cause (e.g. 'Bearing seizure', 'Solenoid valve burnout').",
            "Provide brief corrective notes on adjustments made to prevent recurrence.",
            "Click 'Complete Work Order' to close ticket and reset the PM schedule's next due date."
          ]
        }
      ],
      urgency_guide_title: "Work Order Priority Classification",
      urgency_guide: [
        { level: "CRITICAL", desc: "Active plant stoppage, safety hazard, or production bottleneck. Immediate response." },
        { level: "HIGH", desc: "Impaired machine running at reduced speed or overdue preventive maintenance." },
        { level: "MEDIUM", desc: "Standard scheduled PM routine or minor non-halting corrective repair." },
        { level: "LOW", desc: "Cosmetic adjustment, general cleaning, or optional tooling inspection." }
      ],
      contacts_title: "Maintenance Escalations",
      contacts: [
        { role: "Maintenance Lead", ext: "Ext. 205 / Radio Ch 1" },
        { role: "Tooling & Purchasing", ext: "Ext. 215 / Purchasing Office" },
        { role: "Safety Director", ext: "Ext. 112 / First Aid Room" }
      ]
    },
    manager: {
      title: "Plant Manager & Administrator Quick-Reference Guide",
      badge: "Plant Operations & Administration",
      shift_checklist_title: "Management & Reliability Cadence",
      shift_checklist: [
        "1. Morning Wallboard Review: Check overall plant uptime %, active machine outages, and aging parts queue.",
        "2. Daily PM Auto-Scan: Click 'Scan Due PMs' in PM Schedules to generate today's preventive tickets.",
        "3. Parts Requisitions: Review pending parts requests, verify supplier lead times, and approve POs.",
        "4. Inventory Auditing: Review low-stock indicators in Parts Catalog and trigger restock orders.",
        "5. Weekly KPI Audit: Review MTBF, MTTR, and PM compliance rate (>95% plant standard) in Analytics."
      ],
      sections: [
        {
          heading: "PM Schedule Automation & Triggers",
          steps: [
            "Open 'PM Schedules' to inspect active calendar and meter maintenance routines.",
            "Set triggers to 'Whichever Comes First' for high-cycle machines (e.g. 30 days OR 250 hours).",
            "Click 'Scan Due PMs & Auto-Generate WOs' to generate work orders for due schedules automatically.",
            "Click the lightning icon on any schedule to trigger an ad-hoc work order instantly."
          ]
        },
        {
          heading: "User Administration & Operator Scoping",
          steps: [
            "Open 'User Management' to oversee plant staff, passwords, and access levels.",
            "Click 'Assign Machines' on any operator to scope their visibility to specific lines.",
            "Scoped operators can only view and request parts for their assigned equipment."
          ]
        }
      ],
      urgency_guide_title: "Core Plant Reliability Benchmarks",
      urgency_guide: [
        { level: "PM Compliance >95%", desc: "Target 95%+ of PM routines completed within grace window to prevent breakdowns." },
        { level: "MTBF Target", desc: "Mean Time Between Failures: Higher hours = lower unexpected stoppage." },
        { level: "MTTR Target", desc: "Mean Time to Repair: Minimize average hours from breakdown to operational return." }
      ],
      contacts_title: "Plant Key Personnel",
      contacts: [
        { role: "Anaheim Plant Director", ext: "Ext. 100 / Executive Office" },
        { role: "Operations Lead", ext: "Ext. 105 / Shop Floor Office" },
        { role: "IT & Systems Admin", ext: "Ext. 300 / Server Room" }
      ]
    }
  }
};

// Quick Reference Card translations (Spanish)
esData.quickref = {
  modal_title: "Guía de Referencia Rápida por Rol",
  print_btn: "Imprimir Tarjeta (8.5x11)",
  close_btn: "Cerrar Guía",
  switch_role: "Vista / Imprimir Guía para Rol:",
  plant_header: "Custom Glass Industries, Inc. • Planta de Fabricación Anaheim",
  emergency_notice: "Mantenga esta hoja visible en su estación de trabajo o caja de herramientas para referencia diaria.",
  roles: {
    operator: {
      title: "Guía Rápida para Operadores de Máquina",
      badge: "Operador de Planta",
      shift_checklist_title: "Lista de Verificación de Turno",
      shift_checklist: [
        "1. Inicio de Turno: Inicie sesión en el Portal de MP en su tableta y verifique su maquinaria asignada.",
        "2. Inspección Previa: Realice inspección visual y neumática antes de arrancar (ventosas, presión de aire, guías).",
        "3. Durante el Turno: Si nota ruidos anormales, vibración o astillado de vidrio, solicite repuestos de inmediato.",
        "4. Parada de Máquina: Si la máquina se detiene, avise de inmediato al supervisor para registrarla en el Mural.",
        "5. Fin de Turno: Limpie viruta de vidrio y restos de corte, revise niveles de aceite y ordene el área."
      ],
      sections: [
        {
          heading: "Cómo Solicitar un Repuesto de Recambio",
          steps: [
            "Abra 'Solicitudes de Repuestos' en la barra de navegación o desde la tarjeta de la máquina.",
            "Haga clic en '+ Solicitar Repuesto' y seleccione su máquina.",
            "Elija una pieza del catálogo O escriba una descripción del componente averiado.",
            "Adjunte una fotografía usando la cámara de la tableta — una foto clara agiliza la validación.",
            "Seleccione Urgencia: Urgente (máquina parada), Normal (operativa con desgaste) o Baja (reserva futura).",
            "Haga clic en 'Enviar Solicitud' — los supervisores reciben la alerta de inmediato."
          ]
        },
        {
          heading: "Cómo Consultar los Manuales de Servicio",
          steps: [
            "Diríjase a 'Mi Maquinaria Asignada'.",
            "Haga clic en 'Documentos y Manuales' en la tarjeta de su equipo.",
            "Haga clic en 'Ver / Descargar' en cualquier manual o diagrama OEM para abrirlo en su tableta."
          ]
        }
      ],
      urgency_guide_title: "Matriz de Urgencia en Solicitudes de Repuestos",
      urgency_guide: [
        { level: "URGENTE", desc: "Máquina totalmente detenida o produciendo vidrio defectuoso fuera de tolerancia. Línea parada." },
        { level: "NORMAL", desc: "La máquina opera con seguridad pero la pieza muestra desgaste, fuga de aire o fin de vida útil." },
        { level: "BAJA", desc: "Consumibles de reposición rutinaria o piezas de reserva para ciclos de mantenimiento futuros." }
      ],
      contacts_title: "Contactos en Planta",
      contacts: [
        { role: "Supervisor de Mantenimiento", ext: "Ext. 204 / Radio Canal 2" },
        { role: "Pañol de Repuestos / Herramientas", ext: "Ext. 210 / Bahía 3" },
        { role: "Gerente de Operaciones", ext: "Ext. 101 / Oficina" }
      ]
    },
    technician: {
      title: "Guía Rápida para Técnicos de Mantenimiento",
      badge: "Mantenimiento y Confiabilidad",
      shift_checklist_title: "Flujo de Trabajo del Técnico",
      shift_checklist: [
        "1. Inicio de Turno: Revise el Mural para identificar averías activas y órdenes de trabajo de alta prioridad.",
        "2. Verificación de Repuestos: Compruebe disponibilidad en el Catálogo de Repuestos antes de desarmar.",
        "3. Ejecución de Órdenes: Complete cada tarea de la lista de verificación y registre lecturas de sensores.",
        "4. Descuento de Repuestos: Registre los repuestos utilizados en la orden para descontar el stock automáticamente.",
        "5. Cierre y Visto Bueno: Registre horas de trabajo reales, tiempo de parada y causa raíz antes de cerrar."
      ],
      sections: [
        {
          heading: "Ejecución de Órdenes y Registro de Repuestos",
          steps: [
            "Abra 'Órdenes de Trabajo' y filtre por 'Abiertas y Asignadas'.",
            "Haga clic en 'Abrir / Ejecutar' en la orden para abrir el modal de ejecución.",
            "Realice las tareas en secuencia y marque las casillas a medida que las completa.",
            "En 'Repuestos Utilizados', seleccione cada pieza del catálogo e indique la cantidad consumida.",
            "Haga clic en '+ Agregar Repuesto Utilizado' — el inventario se descuenta automáticamente en tiempo real."
          ]
        },
        {
          heading: "Registro de Tiempo de Inactividad y Causa Raíz",
          steps: [
            "Ingrese el tiempo exacto de inactividad de la máquina en minutos y las horas de mano de obra dedicadas.",
            "Seleccione o ingrese la causa raíz de la avería (ej. 'Agarrotamiento de rodamiento', 'Bobina quemada').",
            "Agregue notas sobre los ajustes correctivos efectuados para evitar recurrencias.",
            "Haga clic en 'Completar Orden de Trabajo' para cerrar el ticket y actualizar el programa de MP."
          ]
        }
      ],
      urgency_guide_title: "Clasificación de Prioridad de Órdenes de Trabajo",
      urgency_guide: [
        { level: "CRÍTICA", desc: "Parada total de planta, riesgo de seguridad o cuello de botella crítico. Respuesta inmediata." },
        { level: "ALTA", desc: "Máquina operando a velocidad reducida o mantenimiento preventivo vencido." },
        { level: "MEDIA", desc: "Rutina programada de MP estándar o reparación correctiva menor sin parada de línea." },
        { level: "BAJA", desc: "Ajuste estético, limpieza general o inspección opcional de herramental." }
      ],
      contacts_title: "Escalamientos de Mantenimiento",
      contacts: [
        { role: "Jefe de Mantenimiento", ext: "Ext. 205 / Radio Canal 1" },
        { role: "Compras y Herramental", ext: "Ext. 215 / Oficina de Compras" },
        { role: "Director de Seguridad", ext: "Ext. 112 / Primeros Auxilios" }
      ]
    },
    manager: {
      title: "Guía Rápida para Gerentes y Administradores",
      badge: "Operaciones y Administración de Planta",
      shift_checklist_title: "Cadencia de Supervisión y Confiabilidad",
      shift_checklist: [
        "1. Revisión Matutina del Mural: Verifique % de disponibilidad, paradas activas y cola de repuestos pendientes.",
        "2. Escaneo Diario de MP: Haga clic en 'Escanear MP Vencidos' para generar las órdenes preventivas del día.",
        "3. Solicitudes de Repuestos: Revise pedidos pendientes, confirme tiempos de entrega y apruebe órdenes de compra.",
        "4. Auditoría de Inventario: Revise las alertas de bajo stock en el Catálogo y emita órdenes de reabastecimiento.",
        "5. Auditoría Semanal de Confiabilidad: Evalúe MTBF, MTTR y cumplimiento de MP (meta >95%) en Análisis."
      ],
      sections: [
        {
          heading: "Automatización de Programas de MP y Activadores",
          steps: [
            "Abra 'Programas de MP' para inspeccionar rutinas activas por calendario y horómetro.",
            "Configure activadores en 'Lo Que Ocurra Primero' para equipos de alto uso (ej. 30 días O 250 horas).",
            "Haga clic en 'Escanear MP Vencidos y Auto-Generar OT' para generar las órdenes de trabajo del día.",
            "Haga clic en el rayo en cualquier programa para generar una orden preventiva a demanda."
          ]
        },
        {
          heading: "Gestión de Usuarios y Delimitación de Operadores",
          steps: [
            "Abra 'Gestión de Usuarios' para administrar personal, contraseñas y permisos del sistema.",
            "Haga clic en 'Asignar Máquinas' en cualquier operador para delimitar su acceso a líneas específicas.",
            "Los operadores delimitados solo visualizan y solicitan repuestos para su maquinaria asignada."
          ]
        }
      ],
      urgency_guide_title: "Objetivos Clave de Confiabilidad de Planta",
      urgency_guide: [
        { level: "Cumplimiento MP >95%", desc: "Completar más del 95% de rutinas de MP dentro de su plazo evita paradas imprevistas." },
        { level: "Meta MTBF", desc: "Tiempo Medio Entre Fallas: Más horas de operación = mayor estabilidad operativa." },
        { level: "Meta MTTR", desc: "Tiempo Medio de Reparación: Minimizar las horas requeridas para solucionar una avería." }
      ],
      contacts_title: "Personal Clave de Planta",
      contacts: [
        { role: "Director de Planta Anaheim", ext: "Ext. 100 / Dirección General" },
        { role: "Líder de Operaciones", ext: "Ext. 105 / Oficina de Planta" },
        { role: "Administrador de Sistemas TI", ext: "Ext. 300 / Sala de Servidores" }
      ]
    }
  }
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');
fs.writeFileSync(esPath, JSON.stringify(esData, null, 2) + '\n', 'utf8');

console.log('Successfully updated en.json and es.json with Phase 5 translations!');
