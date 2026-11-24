/*
 * SAYNTRA portfolio demo: a self-contained, in-browser stand-in for the
 * Laravel API. It answers the same endpoints with the same response shapes,
 * using entirely fictional sample data stored only in the visitor's browser
 * (localStorage). It never contacts a server and never touches real data.
 *
 * The real API client (src/lib/api.ts) routes here only while a demo
 * session is active, so the production Laravel/Sanctum path is unchanged.
 */

/** Set at build time on the public portfolio deployment. */
export const DEMO_BUILD = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const SESSION_KEY = "sayntra-demo-session";
const STATE_KEY = "sayntra-demo-state-v1";

export function isDemoSession() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function startDemo() {
  window.localStorage.setItem(SESSION_KEY, "1");
  if (!window.localStorage.getItem(STATE_KEY)) save(seed());
}

export function endDemo() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function resetDemo() {
  save(seed());
}

/* ------------------------------- Model ---------------------------------- */

type Status =
  | "received"
  | "awaiting_diagnosis"
  | "diagnosing"
  | "awaiting_customer_approval"
  | "approved"
  | "in_repair"
  | "awaiting_parts"
  | "quality_check"
  | "ready_for_pickup"
  | "delivered"
  | "cancelled"
  | "unrepairable"
  | "estimate_rejected"
  | "returned_without_repair";

interface Person {
  id: number;
  name: string;
  email: string;
}
interface Member {
  id: number;
  role: string;
  active: boolean;
  user_id: number;
}
interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}
interface Device {
  id: number;
  customer_id: number;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  description: string;
}
interface History {
  id: number;
  repair_id: number;
  from_status: Status | null;
  to_status: Status;
  note: string | null;
  created_at: string;
}
interface Diagnosis {
  id: number;
  repair_id: number;
  findings: string;
  recommended_work: string;
  created_at: string;
}
interface Repair {
  id: number;
  reference: string;
  customer_id: number;
  device_id: number;
  status: Status;
  priority: string;
  reported_problem: string;
  device_condition: string;
  accessories: string;
  customer_notes: string;
  internal_notes: string;
  received_at: string;
  expected_at: string | null;
  completed_at: string | null;
  delivered_at: string | null;
  assigned_technician_id: number | null;
}
interface Activity {
  id: number;
  event: string;
  subject_id: number;
  created_at: string;
}
interface State {
  version: 1;
  nextId: number;
  people: Person[];
  members: Member[];
  organization: Record<string, string | number>;
  customers: Customer[];
  devices: Device[];
  repairs: Repair[];
  histories: History[];
  diagnoses: Diagnosis[];
  activity: Activity[];
}

const TERMINAL: Status[] = [
  "delivered",
  "cancelled",
  "returned_without_repair",
];

/*
 * Demo workflow. It follows the real RepairWorkflow and also lets visitors
 * walk the steps whose backend modules are still planned (customer approval
 * of an estimate, final delivery). Those steps are simulated here.
 */
const TRANSITIONS: Record<Status, Status[]> = {
  received: ["awaiting_diagnosis", "cancelled"],
  awaiting_diagnosis: ["diagnosing", "cancelled"],
  diagnosing: ["awaiting_customer_approval", "unrepairable", "cancelled"],
  awaiting_customer_approval: ["approved", "estimate_rejected", "cancelled"],
  approved: ["in_repair", "cancelled"],
  in_repair: ["awaiting_parts", "quality_check", "unrepairable"],
  awaiting_parts: ["in_repair", "cancelled"],
  quality_check: ["in_repair", "ready_for_pickup"],
  ready_for_pickup: ["delivered"],
  estimate_rejected: ["returned_without_repair"],
  unrepairable: ["returned_without_repair"],
  delivered: [],
  cancelled: [],
  returned_without_repair: [],
};

const OWNER_PERMISSIONS = [
  "organization.manage",
  "team.manage",
  "customers.read",
  "customers.write",
  "devices.read",
  "devices.write",
  "repairs.read",
  "repairs.write",
  "repairs.assign",
  "repairs.diagnose",
  "repairs.transition",
  "repairs.deliver",
];

/* -------------------------------- Seed ---------------------------------- */

const DAY = 86_400_000;
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

function seed(): State {
  const people: Person[] = [
    { id: 1, name: "Demo Owner", email: "owner@demo.sayntra.example" },
    { id: 2, name: "Omar Hassan", email: "omar@demo.sayntra.example" },
    { id: 3, name: "Mariam Adel", email: "mariam@demo.sayntra.example" },
    { id: 4, name: "Karim Fathy", email: "karim@demo.sayntra.example" },
    { id: 5, name: "Salma Nabil", email: "salma@demo.sayntra.example" },
  ];
  const members: Member[] = [
    { id: 1, user_id: 1, role: "owner", active: true },
    { id: 2, user_id: 2, role: "technician", active: true },
    { id: 3, user_id: 3, role: "technician", active: true },
    { id: 4, user_id: 4, role: "technician", active: true },
    { id: 5, user_id: 5, role: "receptionist", active: true },
  ];
  const names = [
    "Youssef Samir",
    "Nour Khaled",
    "Ahmed Tarek",
    "Laila Mostafa",
    "Hana Ibrahim",
    "Mostafa Reda",
    "Dina Ashraf",
    "Tamer Wagdy",
    "Rania Soliman",
    "Hesham Nabil",
    "Farida Gamal",
    "Sherif Lotfy",
    "Mona Anwar",
    "Ziad Mahmoud",
  ];
  const areas = [
    "Nasr City, Cairo",
    "Dokki, Giza",
    "Heliopolis, Cairo",
    "Smouha, Alexandria",
    "Maadi, Cairo",
    "Sheikh Zayed, Giza",
  ];
  const customers: Customer[] = names.map((name, i) => ({
    id: i + 1,
    name,
    phone: `+20 10 5555 ${String(1000 + i * 37).slice(-4)}`,
    email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    address: areas[i % areas.length],
    notes: i % 4 === 0 ? "Prefers WhatsApp updates." : "",
  }));
  const deviceSpecs: Array<[string, string, string]> = [
    ["phone", "Nimbus", "X12 Pro"],
    ["computer", "Arcbook", "Air 14"],
    ["phone", "Kestrel", "K9"],
    ["tablet", "Slate", "Tab 11"],
    ["computer", "Vertex", "Gaming 16"],
    ["phone", "Nimbus", "X10"],
    ["appliance", "Coolflow", "Inverter AC 1.5HP"],
    ["console", "Pulse", "Station 5"],
    ["phone", "Orbit", "Fold 3"],
    ["computer", "Arcbook", "Pro 16"],
    ["appliance", "Washwell", "Front Load 8kg"],
    ["phone", "Kestrel", "K7 Lite"],
    ["tablet", "Slate", "Tab Mini"],
    ["computer", "Vertex", "Office 15"],
    ["phone", "Orbit", "S22"],
    ["appliance", "Brewmaster", "Espresso 2"],
    ["phone", "Nimbus", "X12"],
    ["computer", "Arcbook", "Air 13"],
  ];
  const devices: Device[] = deviceSpecs.map(([category, brand, model], i) => ({
    id: i + 1,
    customer_id: (i % customers.length) + 1,
    category,
    brand,
    model,
    serial_number: `DEMO-${String(48120 + i * 113)}`,
    description: "",
  }));
  const problems: Array<[string, string, string]> = [
    [
      "Cracked screen after a fall; touch unresponsive on the left edge.",
      "Display assembly damaged; digitizer fails on left side.",
      "Replace display assembly and recalibrate touch.",
    ],
    [
      "Battery drains within two hours and the device gets hot.",
      "Battery health 61%, swelling detected.",
      "Replace battery and check charging circuit.",
    ],
    [
      "Laptop does not power on.",
      "No power at DC jack; damaged charging port.",
      "Replace DC jack and test power rail.",
    ],
    [
      "Water damage, phone restarts randomly.",
      "Corrosion on logic board near charging IC.",
      "Ultrasonic clean and replace charging IC.",
    ],
    [
      "Keyboard keys not responding.",
      "Liquid residue under keyboard.",
      "Replace keyboard module.",
    ],
    [
      "AC unit not cooling.",
      "Low refrigerant pressure; small leak at joint.",
      "Fix leak, recharge refrigerant.",
    ],
    [
      "Console overheating and shutting down.",
      "Dust buildup, dried thermal paste.",
      "Deep clean and replace thermal paste.",
    ],
    [
      "Camera shows black screen.",
      "Rear camera module failure.",
      "Replace rear camera module.",
    ],
    [
      "Washing machine leaks during spin cycle.",
      "Door seal torn.",
      "Replace door seal gasket.",
    ],
    [
      "No sound from speakers.",
      "Speaker flex cable disconnected.",
      "Reseat and replace flex cable.",
    ],
    [
      "Phone stuck on boot logo.",
      "Firmware corruption.",
      "Reflash firmware and restore settings.",
    ],
    [
      "Espresso machine not heating.",
      "Heating element open circuit.",
      "Replace heating element.",
    ],
  ];
  const plan: Array<[Status, number, string]> = [
    ["received", 0.2, "normal"],
    ["received", 0.6, "high"],
    ["awaiting_diagnosis", 1, "normal"],
    ["awaiting_diagnosis", 1.5, "urgent"],
    ["diagnosing", 2, "high"],
    ["diagnosing", 2.5, "normal"],
    ["awaiting_customer_approval", 3, "normal"],
    ["awaiting_customer_approval", 4, "low"],
    ["approved", 4, "normal"],
    ["in_repair", 5, "high"],
    ["in_repair", 5.5, "urgent"],
    ["awaiting_parts", 6, "normal"],
    ["quality_check", 6.5, "normal"],
    ["ready_for_pickup", 7, "normal"],
    ["ready_for_pickup", 8, "low"],
    ["delivered", 10, "normal"],
    ["delivered", 12, "normal"],
    ["delivered", 15, "high"],
    ["delivered", 19, "normal"],
    ["delivered", 23, "low"],
    ["cancelled", 9, "low"],
    ["unrepairable", 11, "normal"],
    ["returned_without_repair", 14, "normal"],
    ["delivered", 27, "normal"],
  ];
  const path: Status[] = [
    "received",
    "awaiting_diagnosis",
    "diagnosing",
    "awaiting_customer_approval",
    "approved",
    "in_repair",
    "quality_check",
    "ready_for_pickup",
    "delivered",
  ];
  const repairs: Repair[] = [];
  const histories: History[] = [];
  const diagnoses: Diagnosis[] = [];
  const activity: Activity[] = [];
  let hid = 1;
  let aid = 1;
  plan.forEach(([status, daysAgo, priority], i) => {
    const id = i + 1;
    const device = devices[i % devices.length];
    const [problem, findings, work] = problems[i % problems.length];
    const received = daysAgo * DAY + (i % 5) * 3_600_000;
    const reached =
      status === "cancelled"
        ? ["received", "cancelled"]
        : status === "awaiting_parts"
          ? [...path.slice(0, 6), "awaiting_parts"]
          : status === "unrepairable"
            ? [...path.slice(0, 3), "unrepairable"]
            : status === "returned_without_repair"
              ? [
                  ...path.slice(0, 4),
                  "estimate_rejected",
                  "returned_without_repair",
                ]
              : path.slice(0, path.indexOf(status) + 1);
    const technician =
      reached.length > 1 && status !== "cancelled" ? 2 + (i % 3) : null;
    const step = received / Math.max(reached.length, 1);
    reached.forEach((to, k) => {
      histories.push({
        id: hid++,
        repair_id: id,
        from_status: k === 0 ? null : (reached[k - 1] as Status),
        to_status: to as Status,
        note:
          to === "ready_for_pickup"
            ? "Quality check passed: all functions tested."
            : null,
        created_at: iso(received - step * k),
      });
    });
    if (reached.includes("diagnosing")) {
      diagnoses.push({
        id: diagnoses.length + 1,
        repair_id: id,
        findings,
        recommended_work: work,
        created_at: iso(received - step * 2.5),
      });
    }
    repairs.push({
      id,
      reference: `SYN-DEMO-${String(id).padStart(4, "0")}`,
      customer_id: device.customer_id,
      device_id: device.id,
      status,
      priority,
      reported_problem: problem,
      device_condition:
        i % 3 === 0
          ? "Minor scratches on the back cover."
          : "Good overall condition.",
      accessories: i % 2 === 0 ? "Charger" : "None",
      customer_notes: "",
      internal_notes: "",
      received_at: iso(received),
      expected_at: TERMINAL.includes(status) ? null : iso(-(2 + (i % 4)) * DAY),
      completed_at:
        status === "ready_for_pickup" || status === "delivered"
          ? iso(received / 3)
          : null,
      delivered_at: status === "delivered" ? iso(received / 4) : null,
      assigned_technician_id: technician,
    });
    activity.push({
      id: aid++,
      event: "repair.created",
      subject_id: id,
      created_at: iso(received),
    });
    if (technician)
      activity.push({
        id: aid++,
        event: "repair.assigned",
        subject_id: id,
        created_at: iso(received - step),
      });
    if (reached.length > 2)
      activity.push({
        id: aid++,
        event: "repair.status_changed",
        subject_id: id,
        created_at: iso(received - step * (reached.length - 1)),
      });
  });
  activity.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return {
    version: 1,
    nextId: 1000,
    people,
    members,
    organization: {
      id: 1,
      name: "Nile Fix Lab (Demo)",
      currency: "EGP",
      timezone: "Africa/Cairo",
      tax_basis_points: 1400,
      warranty_days: 90,
      email: "hello@demo.sayntra.example",
      phone: "+20 2 5555 0100",
      address: "Fictional address, Cairo",
      category: "general",
    },
    customers,
    devices,
    repairs,
    histories,
    diagnoses,
    activity,
  };
}

/* ------------------------------ Storage --------------------------------- */

function load(): State {
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === 1) return parsed;
    }
  } catch {
    /* fall through to a fresh seed */
  }
  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(state: State) {
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: the demo keeps working in memory */
  }
}

/* ------------------------------ Responses ------------------------------- */

export class DemoError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

function page<T>(items: T[], pageNumber: number) {
  const per = 20;
  const last = Math.max(1, Math.ceil(items.length / per));
  const current = Math.min(Math.max(1, pageNumber), last);
  return {
    data: items.slice((current - 1) * per, current * per),
    current_page: current,
    last_page: last,
    total: items.length,
    meta: { current_page: current, last_page: last, total: items.length },
  };
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => Number(v) || 0;

function required(body: Record<string, unknown>, fields: string[]) {
  const errors: Record<string, string[]> = {};
  for (const f of fields)
    if (!text(body[f])) errors[f] = ["This field is required."];
  if (Object.keys(errors).length)
    throw new DemoError(422, "Please complete the required fields.", errors);
}

function personName(s: State, id: number | null) {
  const p = s.people.find((x) => x.id === id);
  return p ? { id: p.id, name: p.name } : null;
}

function repairView(s: State, r: Repair, full = false) {
  const customer = s.customers.find((c) => c.id === r.customer_id);
  const device = s.devices.find((d) => d.id === r.device_id);
  return {
    ...r,
    public_id: `demo-${r.id}`,
    customer: customer && {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    },
    device: device && {
      id: device.id,
      category: device.category,
      brand: device.brand,
      model: device.model,
      serial_number: device.serial_number,
    },
    technician: personName(s, r.assigned_technician_id),
    allowed_transitions: TRANSITIONS[r.status],
    ...(full
      ? {
          histories: s.histories
            .filter((h) => h.repair_id === r.id)
            .sort((a, b) => b.created_at.localeCompare(a.created_at)),
          diagnoses: s.diagnoses.filter((d) => d.repair_id === r.id),
        }
      : {}),
  };
}

function record(s: State, event: string, subject: number) {
  s.activity.unshift({
    id: s.nextId++,
    event,
    subject_id: subject,
    created_at: new Date().toISOString(),
  });
  s.activity = s.activity.slice(0, 200);
}

function move(s: State, r: Repair, to: Status, note: string | null) {
  s.histories.push({
    id: s.nextId++,
    repair_id: r.id,
    from_status: r.status,
    to_status: to,
    note,
    created_at: new Date().toISOString(),
  });
  r.status = to;
  if (to === "ready_for_pickup") r.completed_at = new Date().toISOString();
  if (to === "delivered") r.delivered_at = new Date().toISOString();
  record(s, "repair.status_changed", r.id);
}

/* ---------------------------- Arabic sample ----------------------------- */

/** Arabic versions of the fictional seed strings (edited text is shown as typed). */
const AR: Record<string, string> = {
  "Demo Owner": "مالك العرض التجريبي",
  "Omar Hassan": "عمر حسن",
  "Mariam Adel": "مريم عادل",
  "Karim Fathy": "كريم فتحي",
  "Salma Nabil": "سلمى نبيل",
  "Youssef Samir": "يوسف سمير",
  "Nour Khaled": "نور خالد",
  "Ahmed Tarek": "أحمد طارق",
  "Laila Mostafa": "ليلى مصطفى",
  "Hana Ibrahim": "هنا إبراهيم",
  "Mostafa Reda": "مصطفى رضا",
  "Dina Ashraf": "دينا أشرف",
  "Tamer Wagdy": "تامر وجدي",
  "Rania Soliman": "رانيا سليمان",
  "Hesham Nabil": "هشام نبيل",
  "Farida Gamal": "فريدة جمال",
  "Sherif Lotfy": "شريف لطفي",
  "Mona Anwar": "منى أنور",
  "Ziad Mahmoud": "زياد محمود",
  "Nasr City, Cairo": "مدينة نصر، القاهرة",
  "Dokki, Giza": "الدقي، الجيزة",
  "Heliopolis, Cairo": "مصر الجديدة، القاهرة",
  "Smouha, Alexandria": "سموحة، الإسكندرية",
  "Maadi, Cairo": "المعادي، القاهرة",
  "Sheikh Zayed, Giza": "الشيخ زايد، الجيزة",
  "Prefers WhatsApp updates.": "يفضّل التحديثات عبر واتساب.",
  "Nile Fix Lab (Demo)": "مختبر النيل للصيانة (تجريبي)",
  "Fictional address, Cairo": "عنوان وهمي، القاهرة",
  "Minor scratches on the back cover.": "خدوش بسيطة في الغطاء الخلفي.",
  "Good overall condition.": "حالة عامة جيدة.",
  Charger: "شاحن",
  None: "لا يوجد",
  "Quality check passed: all functions tested.":
    "اجتاز فحص الجودة: تم اختبار كل الوظائف.",
  "Cracked screen after a fall; touch unresponsive on the left edge.":
    "شاشة مكسورة بعد سقوط، واللمس لا يستجيب في الحافة اليسرى.",
  "Display assembly damaged; digitizer fails on left side.":
    "تلف في وحدة الشاشة، وطبقة اللمس معطلة في الجانب الأيسر.",
  "Replace display assembly and recalibrate touch.":
    "استبدال وحدة الشاشة وإعادة معايرة اللمس.",
  "Battery drains within two hours and the device gets hot.":
    "البطارية تفرغ خلال ساعتين والجهاز يسخن.",
  "Battery health 61%, swelling detected.": "صحة البطارية 61% مع انتفاخ واضح.",
  "Replace battery and check charging circuit.":
    "استبدال البطارية وفحص دائرة الشحن.",
  "Laptop does not power on.": "اللابتوب لا يعمل.",
  "No power at DC jack; damaged charging port.":
    "لا توجد كهرباء عند مدخل الشحن، والمدخل تالف.",
  "Replace DC jack and test power rail.":
    "استبدال مدخل الشحن واختبار خط الطاقة.",
  "Water damage, phone restarts randomly.":
    "تعرض للمياه، والهاتف يعيد التشغيل عشوائيًا.",
  "Corrosion on logic board near charging IC.":
    "تآكل في اللوحة الأم بجوار شريحة الشحن.",
  "Ultrasonic clean and replace charging IC.":
    "تنظيف بالموجات فوق الصوتية واستبدال شريحة الشحن.",
  "Keyboard keys not responding.": "مفاتيح لوحة المفاتيح لا تستجيب.",
  "Liquid residue under keyboard.": "بقايا سائل أسفل لوحة المفاتيح.",
  "Replace keyboard module.": "استبدال لوحة المفاتيح.",
  "AC unit not cooling.": "التكييف لا يبرّد.",
  "Low refrigerant pressure; small leak at joint.":
    "ضغط الفريون منخفض مع تسريب بسيط عند الوصلة.",
  "Fix leak, recharge refrigerant.": "إصلاح التسريب وإعادة شحن الفريون.",
  "Console overheating and shutting down.": "جهاز الألعاب يسخن ويفصل.",
  "Dust buildup, dried thermal paste.": "تراكم أتربة ومعجون حراري جاف.",
  "Deep clean and replace thermal paste.": "تنظيف عميق وتغيير المعجون الحراري.",
  "Camera shows black screen.": "الكاميرا تعرض شاشة سوداء.",
  "Rear camera module failure.": "عطل في وحدة الكاميرا الخلفية.",
  "Replace rear camera module.": "استبدال وحدة الكاميرا الخلفية.",
  "Washing machine leaks during spin cycle.":
    "الغسالة تسرّب المياه أثناء العصر.",
  "Door seal torn.": "جلدة الباب مقطوعة.",
  "Replace door seal gasket.": "استبدال جلدة الباب.",
  "No sound from speakers.": "لا يوجد صوت من السماعات.",
  "Speaker flex cable disconnected.": "كابل السماعة مفصول.",
  "Reseat and replace flex cable.": "إعادة تركيب الكابل واستبداله.",
  "Phone stuck on boot logo.": "الهاتف متوقف على شعار التشغيل.",
  "Firmware corruption.": "تلف في نظام التشغيل.",
  "Reflash firmware and restore settings.":
    "إعادة تثبيت النظام واستعادة الإعدادات.",
  "Espresso machine not heating.": "ماكينة الإسبريسو لا تسخّن.",
  "Heating element open circuit.": "عنصر التسخين مفتوح الدائرة.",
  "Replace heating element.": "استبدال عنصر التسخين.",
};

function localize<T>(value: T, ar: boolean): T {
  if (!ar) return value;
  if (typeof value === "string") return (AR[value] ?? value) as T;
  if (Array.isArray(value)) return value.map((v) => localize(v, ar)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value))
      out[k] = k === "email" ? v : localize(v, ar);
    return out as T;
  }
  return value;
}

/* ------------------------------- Router --------------------------------- */

export async function demoRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // A short, realistic latency keeps loading states honest without dragging.
  await new Promise((r) => setTimeout(r, 120));
  const method = (options.method || "GET").toUpperCase();
  const url = new URL(path, "https://demo.local");
  const parts = url.pathname.split("/").filter(Boolean);
  const query = url.searchParams;
  const body: Record<string, unknown> =
    typeof options.body === "string"
      ? (JSON.parse(options.body) as Record<string, unknown>)
      : {};
  const s = load();
  const result = route(s, method, parts, query, body);
  save(s);
  const ar = document.documentElement.lang === "ar";
  return localize(result, ar) as T;
}

function route(
  s: State,
  method: string,
  [head, id, action]: string[],
  query: URLSearchParams,
  body: Record<string, unknown>,
): unknown {
  const search = (query.get("search") || "").toLowerCase();
  const pageNumber = num(query.get("page")) || 1;
  const user = s.people[0];

  if (head === "auth") {
    if (id === "user")
      return {
        data: { ...user, email_verified_at: "2026-01-01T00:00:00.000Z" },
      };
    if (id === "logout") {
      endDemo();
      return {};
    }
    if (id === "profile") {
      required(body, ["name"]);
      user.name = text(body.name);
      return { data: user };
    }
    if (id === "password")
      throw new DemoError(
        422,
        "Password changes are disabled in the portfolio demo.",
        {
          current_password: [
            "Password changes are disabled in the portfolio demo.",
          ],
        },
      );
    throw new DemoError(404, "Not available in the demo.");
  }

  if (head === "organization") {
    if (method === "PATCH") {
      required(body, ["name"]);
      for (const k of ["name", "email", "phone", "address", "timezone"])
        if (typeof body[k] === "string") s.organization[k] = text(body[k]);
      record(s, "organization.updated", 1);
    }
    return {
      data: s.organization,
      role: "owner",
      permissions: OWNER_PERMISSIONS,
    };
  }

  if (head === "dashboard") {
    const active = s.repairs.filter((r) => !TERMINAL.includes(r.status));
    const counts = new Map<string, number>();
    s.repairs.forEach((r) =>
      counts.set(r.status, (counts.get(r.status) || 0) + 1),
    );
    return {
      data: {
        metrics: {
          total_repairs: s.repairs.length,
          active_repairs: active.length,
          awaiting_approval: s.repairs.filter(
            (r) => r.status === "awaiting_customer_approval",
          ).length,
          ready_for_pickup: s.repairs.filter(
            (r) => r.status === "ready_for_pickup",
          ).length,
          customers: s.customers.length,
        },
        status_counts: [...counts].map(([status, count]) => ({
          status,
          count,
        })),
        volume: [],
        recent_repairs: [...s.repairs]
          .sort((a, b) => b.id - a.id)
          .slice(0, 6)
          .map((r) => repairView(s, r)),
        activity: s.activity
          .slice(0, 8)
          .map(({ id: aid, event, created_at }) => ({
            id: aid,
            event,
            created_at,
          })),
      },
    };
  }

  if (head === "technicians")
    return {
      data: s.members
        .filter((m) => m.role === "technician" && m.active)
        .map((m) => ({
          id: m.user_id,
          name: s.people.find((p) => p.id === m.user_id)?.name || "",
          active_repairs: s.repairs.filter(
            (r) =>
              r.assigned_technician_id === m.user_id &&
              !TERMINAL.includes(r.status),
          ).length,
        })),
    };

  if (head === "team") {
    if (id === "invitations") {
      required(body, ["email", "role"]);
      return {
        data: {
          id: s.nextId++,
          email: text(body.email),
          role: text(body.role),
          note: "No email is sent in the demo.",
        },
      };
    }
    if (id && method === "PATCH") {
      const m = s.members.find((x) => x.id === num(id));
      if (!m) throw new DemoError(404, "Member not found.");
      if (
        m.role === "owner" &&
        (body.role !== "owner" || body.active === false)
      )
        throw new DemoError(422, "The demo workspace keeps one active owner.", {
          role: ["The demo workspace keeps one active owner."],
        });
      if (typeof body.role === "string") m.role = body.role;
      if (typeof body.active === "boolean") m.active = body.active;
      return { data: memberView(s, m) };
    }
    return {
      data: s.members.map((m) => memberView(s, m)),
      roles: [
        "owner",
        "manager",
        "receptionist",
        "technician",
        "inventory_manager",
        "accountant",
      ],
    };
  }

  if (head === "customers") {
    if (!id) {
      if (method === "POST") {
        required(body, ["name", "phone"]);
        if (
          s.customers.some(
            (c) =>
              c.phone.replace(/\D/g, "") ===
              text(body.phone).replace(/\D/g, ""),
          )
        )
          throw new DemoError(
            422,
            "A customer with this phone already exists.",
            { phone: ["A customer with this phone already exists."] },
          );
        const c: Customer = {
          id: s.nextId++,
          name: text(body.name),
          phone: text(body.phone),
          email: text(body.email),
          address: text(body.address),
          notes: text(body.notes),
        };
        s.customers.unshift(c);
        record(s, "customer.created", c.id);
        return { data: c };
      }
      const list = s.customers
        .filter(
          (c) =>
            !search ||
            c.name.toLowerCase().includes(search) ||
            c.phone.includes(search),
        )
        .map((c) => ({
          ...c,
          devices_count: s.devices.filter((d) => d.customer_id === c.id).length,
          repairs_count: s.repairs.filter((r) => r.customer_id === c.id).length,
        }));
      return page(list, pageNumber);
    }
    const c = s.customers.find((x) => x.id === num(id));
    if (!c) throw new DemoError(404, "This record does not exist in the demo.");
    if (method === "PATCH") {
      required(body, ["name", "phone"]);
      for (const k of ["name", "phone", "email", "address", "notes"] as const)
        if (typeof body[k] === "string") c[k] = text(body[k]);
      record(s, "customer.updated", c.id);
      return { data: c };
    }
    if (method === "DELETE")
      throw new DemoError(422, "Archiving is disabled in the demo.");
    return {
      data: {
        ...c,
        devices: s.devices.filter((d) => d.customer_id === c.id),
        repairs: s.repairs
          .filter((r) => r.customer_id === c.id)
          .map((r) => ({
            id: r.id,
            reference: r.reference,
            status: r.status,
            received_at: r.received_at,
          })),
      },
    };
  }

  if (head === "devices") {
    if (!id) {
      if (method === "POST") {
        required(body, ["customer_id", "category", "model"]);
        const d: Device = {
          id: s.nextId++,
          customer_id: num(body.customer_id),
          category: text(body.category),
          brand: text(body.brand),
          model: text(body.model),
          serial_number: text(body.serial_number),
          description: text(body.description),
        };
        s.devices.unshift(d);
        record(s, "device.created", d.id);
        return { data: d };
      }
      const customerFilter = num(query.get("customer_id"));
      const list = s.devices
        .filter((d) => !customerFilter || d.customer_id === customerFilter)
        .filter(
          (d) =>
            !search || `${d.brand} ${d.model}`.toLowerCase().includes(search),
        )
        .map((d) => ({
          ...d,
          customer: {
            id: d.customer_id,
            name: s.customers.find((c) => c.id === d.customer_id)?.name || "",
          },
        }));
      return page(list, pageNumber);
    }
    const d = s.devices.find((x) => x.id === num(id));
    if (!d) throw new DemoError(404, "This record does not exist in the demo.");
    if (method === "PATCH") {
      required(body, ["model"]);
      for (const k of [
        "category",
        "brand",
        "model",
        "serial_number",
        "description",
      ] as const)
        if (typeof body[k] === "string") d[k] = text(body[k]);
      record(s, "device.updated", d.id);
      return { data: d };
    }
    return {
      data: {
        ...d,
        customer: s.customers.find((c) => c.id === d.customer_id),
        repairs: s.repairs
          .filter((r) => r.device_id === d.id)
          .map((r) => ({
            id: r.id,
            reference: r.reference,
            status: r.status,
            received_at: r.received_at,
          })),
      },
    };
  }

  if (head === "repairs") {
    if (!id) {
      if (method === "POST") {
        required(body, ["device_id", "reported_problem"]);
        const device = s.devices.find((d) => d.id === num(body.device_id));
        if (!device)
          throw new DemoError(422, "Choose a registered device.", {
            device_id: ["Choose a registered device."],
          });
        const rid = s.nextId++;
        const r: Repair = {
          id: rid,
          reference: `SYN-DEMO-${String(rid).padStart(4, "0")}`,
          customer_id: device.customer_id,
          device_id: device.id,
          status: "received",
          priority: text(body.priority) || "normal",
          reported_problem: text(body.reported_problem),
          device_condition: text(body.device_condition),
          accessories: text(body.accessories),
          customer_notes: "",
          internal_notes: "",
          received_at: new Date().toISOString(),
          expected_at: text(body.expected_at) || null,
          completed_at: null,
          delivered_at: null,
          assigned_technician_id: null,
        };
        s.repairs.unshift(r);
        s.histories.push({
          id: s.nextId++,
          repair_id: r.id,
          from_status: null,
          to_status: "received",
          note: null,
          created_at: r.received_at,
        });
        record(s, "repair.created", r.id);
        return { data: repairView(s, r) };
      }
      const status = query.get("status") || "";
      const list = [...s.repairs]
        .sort((a, b) => b.id - a.id)
        .filter((r) => !status || r.status === status)
        .filter((r) => {
          if (!search) return true;
          const c = s.customers.find((x) => x.id === r.customer_id);
          return (
            r.reference.toLowerCase().includes(search) ||
            (c?.name.toLowerCase().includes(search) ?? false)
          );
        })
        .map((r) => repairView(s, r));
      return page(list, pageNumber);
    }
    const r = s.repairs.find((x) => x.id === num(id));
    if (!r) throw new DemoError(404, "This record does not exist in the demo.");
    if (action === "assign") {
      if (TERMINAL.includes(r.status))
        throw new DemoError(422, "Closed repairs cannot be reassigned.");
      const techId = num(body.technician_id);
      if (
        !s.members.some(
          (m) => m.user_id === techId && m.role === "technician" && m.active,
        )
      )
        throw new DemoError(422, "Choose an active technician.", {
          technician_id: ["Choose an active technician."],
        });
      r.assigned_technician_id = techId;
      record(s, "repair.assigned", r.id);
      return { data: repairView(s, r) };
    }
    if (action === "diagnosis") {
      required(body, ["findings", "recommended_work"]);
      if (
        !["awaiting_diagnosis", "diagnosing"].includes(r.status) ||
        !r.assigned_technician_id
      )
        throw new DemoError(
          422,
          "Assign this repair and start diagnosis first.",
          { repair: ["Assign this repair and start diagnosis first."] },
        );
      if (r.status === "awaiting_diagnosis") move(s, r, "diagnosing", null);
      const dg: Diagnosis = {
        id: s.nextId++,
        repair_id: r.id,
        findings: text(body.findings),
        recommended_work: text(body.recommended_work),
        created_at: new Date().toISOString(),
      };
      s.diagnoses.push(dg);
      record(s, "repair.diagnosed", r.id);
      return { data: dg };
    }
    if (action === "transition") {
      const to = text(body.status) as Status;
      if (body.expected_status && body.expected_status !== r.status)
        throw new DemoError(409, "This repair changed. Refresh and try again.");
      if (!TRANSITIONS[r.status].includes(to))
        throw new DemoError(422, "This status transition is not allowed.", {
          status: ["This status transition is not allowed."],
        });
      if (["diagnosing", "in_repair"].includes(to) && !r.assigned_technician_id)
        throw new DemoError(422, "Assign a technician first.", {
          note: ["Assign a technician first."],
        });
      if (to === "ready_for_pickup" && !text(body.quality_check_notes))
        throw new DemoError(422, "Record the quality check results.", {
          quality_check_notes: ["Record the quality check results."],
        });
      move(s, r, to, text(body.quality_check_notes) || text(body.note) || null);
      return { data: repairView(s, r) };
    }
    if (action === "timeline")
      return { data: s.activity.filter((a) => a.subject_id === r.id) };
    if (method === "PATCH") {
      for (const k of [
        "internal_notes",
        "customer_notes",
        "reported_problem",
        "device_condition",
        "accessories",
        "priority",
      ] as const)
        if (typeof body[k] === "string") r[k] = text(body[k]);
      return { data: repairView(s, r, true) };
    }
    return { data: repairView(s, r, true) };
  }

  if (head === "invitations")
    throw new DemoError(404, "Invitations are not available in the demo.");
  throw new DemoError(
    404,
    "This feature is not available in the portfolio demo.",
  );
}

function memberView(s: State, m: Member) {
  const p = s.people.find((x) => x.id === m.user_id);
  return {
    id: m.id,
    role: m.role,
    active: m.active,
    user_id: m.user_id,
    user: { id: p?.id, name: p?.name || "", email: p?.email || "" },
  };
}
