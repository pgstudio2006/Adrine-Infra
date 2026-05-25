const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Adrine — SSIP 2.0 Pitch";

// Design system
const BLACK = "111111";
const WHITE = "FFFFFF";
const GRAY = "888888";
const LIGHT = "F4F4F4";
const MID = "DDDDDD";

// ─── HELPERS ───────────────────────────────────────────────

function titleSlide(title, sub) {
  const s = pres.addSlide();
  s.background = { color: "0A0A0A" };
  s.addText("ADRINE", {
    x: 0.6, y: 1.6, w: 8.8, h: 0.7,
    fontSize: 11, bold: true, color: "999999",
    charSpacing: 6, fontFace: "Calibri"
  });
  s.addText(title, {
    x: 0.6, y: 2.2, w: 8.8, h: 1.4,
    fontSize: 38, bold: true, color: WHITE,
    fontFace: "Calibri", lineSpacingMultiple: 1.1
  });
  if (sub) {
    s.addText(sub, {
      x: 0.6, y: 3.7, w: 7, h: 0.5,
      fontSize: 13, color: "777777", fontFace: "Calibri"
    });
  }
  return s;
}

function sectionLabel(s, label) {
  s.addText(label.toUpperCase(), {
    x: 0.6, y: 0.32, w: 8.8, h: 0.28,
    fontSize: 8, color: "AAAAAA", charSpacing: 3,
    fontFace: "Calibri", bold: false
  });
}

function divider(s) {
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 0.72, w: 8.8, h: 0.012,
    fill: { color: "E5E5E5" }, line: { color: "E5E5E5" }
  });
}

function slideTitle(s, text) {
  s.addText(text, {
    x: 0.6, y: 0.92, w: 8.8, h: 0.72,
    fontSize: 26, bold: true, color: BLACK,
    fontFace: "Calibri"
  });
}

function body(s, text, opts = {}) {
  s.addText(text, {
    x: opts.x ?? 0.6,
    y: opts.y ?? 1.8,
    w: opts.w ?? 8.8,
    h: opts.h ?? 0.4,
    fontSize: opts.fs ?? 13,
    color: opts.color ?? "444444",
    fontFace: "Calibri",
    bold: opts.bold ?? false,
    align: opts.align ?? "left"
  });
}

function statBox(s, stat, label, x, y, w = 2.0) {
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: 1.1,
    fill: { color: LIGHT }, line: { color: MID, width: 0.5 }
  });
  s.addText(stat, {
    x, y: y + 0.1, w, h: 0.55,
    fontSize: 28, bold: true, color: BLACK,
    fontFace: "Calibri", align: "center"
  });
  s.addText(label, {
    x, y: y + 0.65, w, h: 0.35,
    fontSize: 10, color: GRAY,
    fontFace: "Calibri", align: "center"
  });
}

function card(s, title, desc, x, y, w = 2.7, h = 1.3) {
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: LIGHT }, line: { color: MID, width: 0.5 }
  });
  s.addText(title, {
    x: x + 0.18, y: y + 0.17, w: w - 0.3, h: 0.3,
    fontSize: 11, bold: true, color: BLACK, fontFace: "Calibri"
  });
  s.addText(desc, {
    x: x + 0.18, y: y + 0.5, w: w - 0.3, h: h - 0.55,
    fontSize: 10, color: "555555", fontFace: "Calibri", lineSpacingMultiple: 1.2
  });
}

// ─── SLIDE 1: COVER ────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: "0A0A0A" };
  s.addText("ADRINE", {
    x: 0.6, y: 1.5, w: 9, h: 0.5,
    fontSize: 9, bold: true, color: "666666",
    charSpacing: 8, fontFace: "Calibri"
  });
  s.addText("Hospital Operating System", {
    x: 0.6, y: 2.0, w: 9, h: 1.2,
    fontSize: 40, bold: true, color: WHITE, fontFace: "Calibri"
  });
  s.addText("AI Infrastructure for Indian Healthcare", {
    x: 0.6, y: 3.25, w: 9, h: 0.45,
    fontSize: 15, color: "888888", fontFace: "Calibri"
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 4.0, w: 1.4, h: 0.04,
    fill: { color: "FFFFFF" }, line: { color: "FFFFFF" }
  });
  s.addText("SSIP 2.0 — Grant Proposal  |  Quadrat Technologies  |  Gandhinagar, Gujarat", {
    x: 0.6, y: 4.5, w: 9, h: 0.3,
    fontSize: 9, color: "555555", fontFace: "Calibri"
  });
}

// ─── SLIDE 2: PROBLEM ──────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  sectionLabel(s, "Problem");
  divider(s);
  slideTitle(s, "Every hospital works differently.\nNo software adapts to that.");

  body(s, "India has 70,000+ private hospitals. 85% are still running on paper or outdated tools — not because they don't want to digitize, but because every software forces them to change how they work to fit the software.", {
    y: 1.85, h: 0.65, fs: 13, color: "444444"
  });

  // 4 pain cards
  card(s, "Rigid workflows", "Software demands hospitals follow fixed flows — doctors, nurses, billing all resist adoption.", 0.6, 2.72, 2.1, 1.25);
  card(s, "Constant custom dev", "Every hospital requests changes. Builds become fragmented. No two deployments are alike.", 2.85, 2.72, 2.1, 1.25);
  card(s, "No scalability", "A solution built for one hospital doesn't work for another. The business can't grow.", 5.1, 2.72, 2.1, 1.25);
  card(s, "85% undigitized", "The market is massive and waiting — but current solutions are too rigid to serve it.", 7.35, 2.72, 2.1, 1.25);

  body(s, "The market need is proven — 128,000+ organic impressions on Google Search without a single rupee in marketing.", {
    y: 4.2, h: 0.35, fs: 11, color: GRAY
  });
}

// ─── SLIDE 3: SOLUTION ─────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  sectionLabel(s, "Solution");
  divider(s);
  slideTitle(s, "Adrine — software that adapts\nto the hospital, not the other way.");

  body(s, "Adrine is an AI-native Hospital Operating System — covering clinical operations, HR, and finance on a single platform. But the breakthrough is the infrastructure underneath: an adaptive AI system that learns how each hospital works and generates their software automatically.", {
    y: 1.85, h: 0.75, fs: 13, color: "444444"
  });

  // Three pillars
  card(s, "HIMS", "Patient registration, OPD, IPD, lab, radiology, pharmacy — end-to-end clinical operations.", 0.6, 2.8, 2.9, 1.3);
  card(s, "HRMS", "Staff records, biometric attendance, payroll, PF/ESI/TDS, performance appraisal.", 3.65, 2.8, 2.9, 1.3);
  card(s, "Finance / ERP", "Billing, accounts, TPA/insurance, procurement — SAP-equivalent for hospitals.", 6.7, 2.8, 2.9, 1.3);

  body(s, "ABDM verified  ·  ABHA ready  ·  PMJAY compliant  ·  Tally integration", {
    y: 4.32, h: 0.32, fs: 10, color: "999999"
  });
}

// ─── SLIDE 4: HOW IT WORKS (AI INFRA) ─────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  sectionLabel(s, "Technology");
  divider(s);
  slideTitle(s, "The AI infrastructure — what makes\nAdrine fundamentally different.");

  body(s, "We are transitioning Adrine from a hospital management system to an AI infrastructure platform — a system that generates hospital software from intent, not code.", {
    y: 1.88, h: 0.55, fs: 13, color: "444444"
  });

  // Layer boxes — vertical stack style
  const layers = [
    ["Expression layer", "Auto-generated UI, workflows, and logic — unique per hospital, built by AI"],
    ["AI expression engine", "Onboards each hospital via conversation. Generates their software surface. Adapts continuously."],
    ["Meaning layer (core)", "Universal healthcare knowledge engine — the fixed intelligence shared across all hospitals"],
    ["Universal event ledger", "Every action, structured identically across hospitals — foundation for India's healthcare data layer"],
  ];

  const colors = ["F9F9F9", "F2F2F2", "EAEAEA", "E2E2E2"];
  layers.forEach(([title, desc], i) => {
    const y = 2.6 + i * 0.68;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y, w: 8.8, h: 0.6,
      fill: { color: colors[i] }, line: { color: MID, width: 0.5 }
    });
    s.addText(`L${3 - i}  `, {
      x: 0.75, y: y + 0.08, w: 0.55, h: 0.36,
      fontSize: 9, bold: true, color: "AAAAAA", fontFace: "Calibri"
    });
    s.addText(title, {
      x: 1.25, y: y + 0.08, w: 2.6, h: 0.36,
      fontSize: 11, bold: true, color: BLACK, fontFace: "Calibri"
    });
    s.addText(desc, {
      x: 3.9, y: y + 0.08, w: 5.3, h: 0.42,
      fontSize: 10, color: "555555", fontFace: "Calibri"
    });
  });
}

// ─── SLIDE 5: USP / INNOVATION ─────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  sectionLabel(s, "Innovation");
  divider(s);
  slideTitle(s, "What no other HMS has done.");

  const points = [
    ["AI onboarding agent", "Hospitals configure their entire system through a conversation — no developers, no manual setup."],
    ["Adaptive surface", "The system watches real usage and evolves the UI automatically. Nurses don't train the software — it trains itself."],
    ["Agentic-as-a-service", "We are developing AI agents that autonomously handle hospital workflows — billing reminders, lab alerts, supply reorders."],
    ["Meaning vs expression separation", "Universal healthcare logic at the core. Infinite workflow variations at the surface. First time this has been done in healthtech."],
    ["ABDM verified", "Fully compliant with Ayushman Bharat Digital Mission — ABHA ID creation, PHR connectivity, consent framework."],
  ];

  points.forEach(([title, desc], i) => {
    const y = 1.82 + i * 0.65;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y, w: 0.06, h: 0.38,
      fill: { color: BLACK }, line: { color: BLACK }
    });
    s.addText(title, {
      x: 0.85, y: y + 0.01, w: 2.5, h: 0.3,
      fontSize: 11, bold: true, color: BLACK, fontFace: "Calibri"
    });
    s.addText(desc, {
      x: 3.4, y: y + 0.01, w: 6.0, h: 0.36,
      fontSize: 11, color: "555555", fontFace: "Calibri"
    });
  });
}

// ─── SLIDE 6: MARKET & VALIDATION ──────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  sectionLabel(s, "Market & Validation");
  divider(s);
  slideTitle(s, "Large market. Proven demand.\nEarly traction.");

  statBox(s, "70,000+", "Private hospitals in India", 0.6, 1.75);
  statBox(s, "85%", "Not yet digitized", 2.75, 1.75);
  statBox(s, "128K+", "Google impressions (organic)", 4.9, 1.75);
  statBox(s, "₹8,400 Cr", "Addressable market", 7.1, 1.75);

  body(s, "Pilot phase — hospitals currently evaluating Adrine:", {
    y: 3.1, h: 0.32, fs: 11, bold: true, color: BLACK
  });

  // Placeholder space for screenshot / pilot logos
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 3.5, w: 8.8, h: 1.55,
    fill: { color: "F8F8F8" }, line: { color: "DDDDDD", width: 0.5, dashType: "dash" }
  });
  s.addText("[Insert Google Search Console screenshot — 128K impressions]", {
    x: 0.6, y: 3.5, w: 8.8, h: 1.55,
    fontSize: 10, color: "BBBBBB", fontFace: "Calibri", align: "center", valign: "middle"
  });
}

// ─── SLIDE 7: COST BREAKUP ─────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  sectionLabel(s, "Funding Request");
  divider(s);
  slideTitle(s, "Development cost breakup\n(SSIP 2.0 — ₹2.5 Lakhs)");

  const rows = [
    ["Claude Max API plan (Anthropic)", "AI engine for onboarding agent, expression generator, agentic workflows", "₹1,40,000"],
    ["Cloud infrastructure (AWS / GCP)", "Hosting, event ledger, database, backups for pilot phase", "₹50,000"],
    ["ABDM integration & compliance testing", "API testing, ABHA flow validation, sandbox certification", "₹30,000"],
    ["Prototyping & field trials", "Hospital visits, hardware testing, deployment support", "₹30,000"],
  ];

  // Table header
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.85, w: 8.8, h: 0.38,
    fill: { color: "111111" }, line: { color: "111111" }
  });
  s.addText("Component", { x: 0.75, y: 1.88, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: WHITE, fontFace: "Calibri" });
  s.addText("Purpose", { x: 3.3, y: 1.88, w: 4.5, h: 0.3, fontSize: 10, bold: true, color: WHITE, fontFace: "Calibri" });
  s.addText("Amount", { x: 7.85, y: 1.88, w: 1.3, h: 0.3, fontSize: 10, bold: true, color: WHITE, fontFace: "Calibri", align: "right" });

  rows.forEach(([comp, purpose, amt], i) => {
    const y = 2.28 + i * 0.52;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y, w: 8.8, h: 0.48,
      fill: { color: i % 2 === 0 ? "F8F8F8" : WHITE }, line: { color: "E5E5E5", width: 0.5 }
    });
    s.addText(comp, { x: 0.75, y: y + 0.08, w: 2.45, h: 0.32, fontSize: 10, bold: true, color: BLACK, fontFace: "Calibri" });
    s.addText(purpose, { x: 3.3, y: y + 0.08, w: 4.45, h: 0.32, fontSize: 10, color: "555555", fontFace: "Calibri" });
    s.addText(amt, { x: 7.85, y: y + 0.08, w: 1.3, h: 0.32, fontSize: 10, bold: true, color: BLACK, fontFace: "Calibri", align: "right" });
  });

  // Total row
  const ty = 2.28 + rows.length * 0.52;
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: ty, w: 8.8, h: 0.42,
    fill: { color: "EFEFEF" }, line: { color: "CCCCCC", width: 0.5 }
  });
  s.addText("Total", { x: 0.75, y: ty + 0.08, w: 7, h: 0.28, fontSize: 11, bold: true, color: BLACK, fontFace: "Calibri" });
  s.addText("₹2,50,000", { x: 7.85, y: ty + 0.08, w: 1.3, h: 0.28, fontSize: 11, bold: true, color: BLACK, fontFace: "Calibri", align: "right" });
}

// ─── SLIDE 8: ROADMAP ─────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  sectionLabel(s, "Plan");
  divider(s);
  slideTitle(s, "12-month development plan.");

  const phases = [
    ["Q1", "AI onboarding agent (v1)\nExpression engine prototype\nClaude API integration"],
    ["Q2", "Agentic workflow layer\nPilot deployment at 3 hospitals\nEvent ledger architecture"],
    ["Q3", "Adaptive surface (behavior loop)\nABDM full certification\nHRMS + Finance AI layer"],
    ["Q4", "Cross-hospital intelligence layer\nScale to 10+ hospitals\nGujarat market expansion"],
  ];

  phases.forEach(([q, text], i) => {
    const x = 0.6 + i * 2.25;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.82, w: 2.05, h: 2.8,
      fill: { color: i === 0 ? "111111" : LIGHT },
      line: { color: i === 0 ? "111111" : MID, width: 0.5 }
    });
    s.addText(q, {
      x, y: 1.98, w: 2.05, h: 0.4,
      fontSize: 18, bold: true,
      color: i === 0 ? WHITE : BLACK,
      fontFace: "Calibri", align: "center"
    });
    s.addText(text, {
      x: x + 0.15, y: 2.52, w: 1.75, h: 1.9,
      fontSize: 10.5,
      color: i === 0 ? "CCCCCC" : "555555",
      fontFace: "Calibri", lineSpacingMultiple: 1.4
    });
  });

  body(s, "Current status: pilot phase — system live in evaluation at multiple hospitals across Gujarat.", {
    y: 4.85, h: 0.35, fs: 10, color: GRAY
  });
}

// ─── SLIDE 9: TEAM ─────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  sectionLabel(s, "Team");
  divider(s);
  slideTitle(s, "The team.");

  card(s, "Parthrajsinh", "Founder & CEO\nAge 19 · Quadrat Technologies\nProduct, strategy, sales", 0.6, 1.82, 2.8, 1.5);

  // Placeholder cards for other team members
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.65, y: 1.82, w: 2.8, h: 1.5,
    fill: { color: "F8F8F8" }, line: { color: "DDDDDD", width: 0.5, dashType: "dash" }
  });
  s.addText("[Team member 2]", {
    x: 3.65, y: 1.82, w: 2.8, h: 1.5,
    fontSize: 10, color: "CCCCCC", fontFace: "Calibri", align: "center", valign: "middle"
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.7, y: 1.82, w: 2.8, h: 1.5,
    fill: { color: "F8F8F8" }, line: { color: "DDDDDD", width: 0.5, dashType: "dash" }
  });
  s.addText("[Team member 3]", {
    x: 6.7, y: 1.82, w: 2.8, h: 1.5,
    fontSize: 10, color: "CCCCCC", fontFace: "Calibri", align: "center", valign: "middle"
  });

  body(s, "Faculty Advisor", { y: 3.55, fs: 10, bold: true, color: BLACK });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 3.78, w: 8.8, h: 0.8,
    fill: { color: "F8F8F8" }, line: { color: "DDDDDD", width: 0.5, dashType: "dash" }
  });
  s.addText("[Faculty advisor name & department]", {
    x: 0.6, y: 3.78, w: 8.8, h: 0.8,
    fontSize: 10, color: "CCCCCC", fontFace: "Calibri", align: "center", valign: "middle"
  });
}

// ─── SLIDE 10: CLOSE ───────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: "0A0A0A" };
  s.addText("ADRINE", {
    x: 0.6, y: 1.4, w: 9, h: 0.45,
    fontSize: 9, bold: true, color: "555555",
    charSpacing: 8, fontFace: "Calibri"
  });
  s.addText("The OS layer for\nIndian healthcare.", {
    x: 0.6, y: 1.85, w: 9, h: 1.8,
    fontSize: 38, bold: true, color: WHITE, fontFace: "Calibri", lineSpacingMultiple: 1.15
  });
  s.addText("We are not building hospital software.\nWe are building the infrastructure that generates hospital software.", {
    x: 0.6, y: 3.7, w: 8.5, h: 0.7,
    fontSize: 13, color: "777777", fontFace: "Calibri", lineSpacingMultiple: 1.5
  });
  s.addText("parthrajsinh@adrine.in  ·  adrine.in  ·  Gandhinagar, Gujarat", {
    x: 0.6, y: 4.9, w: 9, h: 0.3,
    fontSize: 9, color: "444444", fontFace: "Calibri"
  });
}

pres.writeFile({ fileName: "Adrine_SSIP.pptx" });
console.log("Done.");
