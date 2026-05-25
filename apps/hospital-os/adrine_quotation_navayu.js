import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  PageBreak, Header, Footer, LevelFormat
} from 'docx';
import fs from 'fs';

const BLACK  = "000000";
const RED    = "E63946";
const WHITE  = "FFFFFF";
const LGRAY  = "888888";
const MGRAY  = "444444";
const BGRAY  = "F8F8F8";
const GREEN  = "166534";
const LGREEN = "DCFCE7";

const nb = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: nb, bottom: nb, left: nb, right: nb };
const thin = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
const thinB = { top: thin, bottom: thin, left: thin, right: thin };

const sp = (n=1) => new Paragraph({ spacing: { before: 70*n, after: 70*n }, children: [new TextRun("")] });

const today = new Date();
const dateStr = today.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
const validDate = new Date(today);
validDate.setDate(validDate.getDate() + 30);
const validStr = validDate.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

function infoRow(label, value, ri) {
  return new TableRow({ children: [
    new TableCell({
      borders: thinB,
      shading: { fill: ri%2===0 ? BGRAY : WHITE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 160, right: 80 },
      width: { size: 3200, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 19, bold: true, color: BLACK })] })]
    }),
    new TableCell({
      borders: thinB,
      shading: { fill: WHITE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 160, right: 160 },
      width: { size: 6160, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: value, font: "Arial", size: 19, color: MGRAY })] })]
    })
  ]});
}

function moduleRow(module, features, ri) {
  return new TableRow({ children: [
    new TableCell({
      borders: thinB,
      shading: { fill: ri%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 160, right: 80 },
      width: { size: 2800, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: module, font: "Arial", size: 18, bold: true, color: BLACK })] })]
    }),
    new TableCell({
      borders: thinB,
      shading: { fill: ri%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 160, right: 80 },
      width: { size: 5560, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: features, font: "Arial", size: 17, color: MGRAY })] })]
    }),
    new TableCell({
      borders: thinB,
      shading: { fill: LGREEN, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
      width: { size: 1000, type: WidthType.DXA },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "✓ Included", font: "Arial", size: 17, bold: true, color: GREEN })] })]
    })
  ]});
}

function priceRow(item, amount, bold = false, fill = WHITE, color = MGRAY) {
  return new TableRow({ children: [
    new TableCell({
      borders: thinB,
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 90, bottom: 90, left: 160, right: 80 },
      width: { size: 6760, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: item, font: "Arial", size: 19, bold, color: bold ? BLACK : MGRAY })] })]
    }),
    new TableCell({
      borders: thinB,
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 90, bottom: 90, left: 80, right: 160 },
      width: { size: 2600, type: WidthType.DXA },
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: amount, font: "Arial", size: 19, bold, color: bold ? RED : color })] })]
    })
  ]});
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 19 } } }
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    headers: { default: new Header({ children: [
      new Table({ width: { size: 10080, type: WidthType.DXA }, columnWidths: [5040, 5040],
        rows: [new TableRow({ children: [
          new TableCell({ borders: noBorders, shading: { fill: BLACK, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 160, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: "ADRINE  |  Service Quotation", font: "Arial", size: 16, bold: true, color: WHITE })] })] }),
          new TableCell({ borders: noBorders, shading: { fill: BLACK, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 60, right: 160 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Quadrat Technologies  |  " + dateStr, font: "Arial", size: 16, color: LGRAY, italics: true })] })] })
        ]})]})
    ]})},
    footers: { default: new Footer({ children: [
      new Paragraph({ alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "EEEEEE", space: 4 } },
        children: [new TextRun({ text: "Adrine by Quadrat Technologies  |  hello@adrine.in  |  adrine.in  |  Gandhinagar, Gujarat", font: "Arial", size: 16, color: LGRAY })] })
    ]})},

    children: [

      // ── COVER ──
      new Table({ width: { size: 10080, type: WidthType.DXA }, columnWidths: [10080],
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders, shading: { fill: BLACK, type: ShadingType.CLEAR },
          margins: { top: 440, bottom: 440, left: 500, right: 500 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:60},
              children: [new TextRun({ text: "ADRINE", font: "Arial", size: 64, bold: true, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:40},
              children: [new TextRun({ text: "by Quadrat Technologies", font: "Arial", size: 19, color: LGRAY, italics: true })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:60,after:40},
              children: [new TextRun({ text: "─────────────────────────────", font: "Arial", size: 18, color: RED })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:40,after:20},
              children: [new TextRun({ text: "SERVICE QUOTATION", font: "Arial", size: 34, bold: true, color: RED })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:60},
              children: [new TextRun({ text: "Multi-Centre Health Platform — Unlimited Branch Plan", font: "Arial", size: 20, color: "AAAAAA" })] }),
            sp(1),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:40},
              children: [new TextRun({ text: "Prepared exclusively for", font: "Arial", size: 17, color: LGRAY, italics: true })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:20},
              children: [new TextRun({ text: "Navayuhealth", font: "Arial", size: 28, bold: true, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:0},
              children: [new TextRun({ text: "Mr. Kamal  ·  Gurgaon, Haryana", font: "Arial", size: 18, color: LGRAY })] }),
          ]
        })]})]}),

      sp(2),

      // ── QUOTATION DETAILS ──
      new Paragraph({ spacing:{before:0,after:100}, children: [new TextRun({ text: "Quotation Details", font: "Arial", size: 24, bold: true, color: BLACK })] }),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3200, 6160],
        rows: [
          infoRow("Quotation No.", "ADR-QT-2604-NYH001", 0),
          infoRow("Date", dateStr, 1),
          infoRow("Valid Until", validStr, 0),
          infoRow("Prepared For", "Mr. Kamal", 1),
          infoRow("Organisation", "Navayuhealth", 0),
          infoRow("Location", "Gurgaon, Haryana", 1),
          infoRow("Plan Type", "Multi-Centre — Unlimited Branch Addition", 0),
          infoRow("Prepared By", "Parthrajsinh Gohil — Founder & CEO, Adrine", 1),
          infoRow("Contact", "hello@adrine.in  |  adrine.in", 0),
        ]
      }),

      sp(2),
      new Paragraph({ children: [new PageBreak()] }),

      // ── EXECUTIVE SUMMARY ──
      new Paragraph({ spacing:{before:0,after:100}, children: [new TextRun({ text: "Executive Summary", font: "Arial", size: 24, bold: true, color: BLACK })] }),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders,
          shading: { fill: "FFF1F2", type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 240, right: 240 },
          children: [
            new Paragraph({ spacing:{before:0,after:80}, children: [new TextRun({ text: "Dear Mr. Kamal,", font: "Arial", size: 20, bold: true, color: BLACK })] }),
            new Paragraph({ spacing:{before:0,after:80}, children: [new TextRun({ text: "Thank you for your continued interest in Adrine. This quotation is designed specifically for Navayuhealth's multi-centre model — giving you a single flat annual fee that covers all your current and future branches with no additional per-branch charges.", font: "Arial", size: 19, color: MGRAY })] }),
            new Paragraph({ spacing:{before:0,after:80}, children: [new TextRun({ text: "As your network grows — whether 2 centres today or 10 centres tomorrow — your annual fee stays the same. One price. Unlimited scale. No surprises.", font: "Arial", size: 19, color: MGRAY })] }),
            new Paragraph({ spacing:{before:0,after:0}, children: [new TextRun({ text: "The plan includes all core clinical, AI, booking, and operational modules tailored for your health centre and mini hospital model.", font: "Arial", size: 19, color: MGRAY })] }),
          ]
        })]})]}),

      sp(2),

      // ── KEY HIGHLIGHT BOX ──
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3120, 3120, 3120],
        rows: [new TableRow({ children: [
          ...[ ["₹50,000", "One-Time Setup Fee", "All branches included"], ["₹1,99,000", "Annual Fee /year", "Unlimited branches"], ["∞", "Branches", "Add anytime, no extra charge"] ]
            .map(([v, l, sub]) => new TableCell({
              borders: noBorders,
              shading: { fill: BLACK, type: ShadingType.CLEAR },
              margins: { top: 180, bottom: 180, left: 120, right: 120 },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:30}, children: [new TextRun({ text: v, font: "Arial", size: 32, bold: true, color: RED })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:20}, children: [new TextRun({ text: l, font: "Arial", size: 17, bold: true, color: WHITE })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sub, font: "Arial", size: 15, color: LGRAY, italics: true })] }),
              ]
            }))
        ]})]
      }),

      sp(2),

      // ── MODULES ──
      new Paragraph({ spacing:{before:0,after:100}, children: [new TextRun({ text: "Modules & Features Included", font: "Arial", size: 24, bold: true, color: BLACK })] }),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [2800, 5560, 1000],
        rows: [
          // Header
          new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 2800, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Module", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 5560, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Features Included", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, width: { size: 1000, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Status", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
          ]}),

          // Section label — Clinical
          new TableRow({ children: [new TableCell({ borders: thinB, shading: { fill: "1A1A1A", type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 160, right: 80 }, columnSpan: 3,
            children: [new Paragraph({ children: [new TextRun({ text: "CLINICAL MODULES", font: "Arial", size: 17, bold: true, color: RED, characterSpacing: 40 })] })] })
          ]}),
          moduleRow("OPD & Patient Registration", "30-sec UHID registration, appointment calendar, OPD queue & token display, digital KYC, emergency mode, Patient 360 history", 0),
          moduleRow("IPD Management", "Bed allocation, admission workflow, room management, day care admissions, discharge processing, IPD billing", 1),
          moduleRow("Nursing Module", "Ward patient list, vitals recording, MAR medication tracking, shift handover notes, care plans, discharge checklist", 0),
          moduleRow("Basic Billing", "OP & IP billing, package pricing, discount workflow, advance & refunds, payment modes (Cash/Card/UPI/NEFT), invoice generation", 1),
          moduleRow("Pharmacy", "Prescription queue, drug interaction checks, stock & batch tracking, expiry management, auto stock deduction, low stock alerts", 0),
          moduleRow("Laboratory", "Order-to-result workflow, sample tracking, result entry, normal auto-approval, critical value alerts, PDF report generation", 1),
          moduleRow("Radiology", "Modality worklists, technician workflow, radiologist reporting, template-based reports, critical findings escalation", 0),

          // Section label — Booking & CRM
          new TableRow({ children: [new TableCell({ borders: thinB, shading: { fill: "1A1A1A", type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 160, right: 80 }, columnSpan: 3,
            children: [new Paragraph({ children: [new TextRun({ text: "BOOKING & CRM", font: "Arial", size: 17, bold: true, color: RED, characterSpacing: 40 })] })] })
          ]}),
          moduleRow("Online Booking System", "High-scale booking portal, real-time slot management, appointment confirmations, cancellation & reschedule, multi-centre booking, YouTube/website integration ready", 1),
          moduleRow("CRM — Patient Management", "Patient profiles, lead tracking, follow-up management, patient communication history, re-engagement workflows, centre-wise patient analytics", 0),

          // Section label — HRMS
          new TableRow({ children: [new TableCell({ borders: thinB, shading: { fill: "1A1A1A", type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 160, right: 80 }, columnSpan: 3,
            children: [new Paragraph({ children: [new TextRun({ text: "HRMS — STAFF MANAGEMENT", font: "Arial", size: 17, bold: true, color: RED, characterSpacing: 40 })] })] })
          ]}),
          moduleRow("Attendance Management", "Biometric integration, shift & roster management, leave management, overtime tracking, real-time attendance dashboard", 1),
          moduleRow("Payroll Processing", "Auto payroll calculation, PF/ESI/TDS compliance, salary slips, loan & advance management, bank file export", 0),

          // Section label — AI
          new TableRow({ children: [new TableCell({ borders: thinB, shading: { fill: "1A1A1A", type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 160, right: 80 }, columnSpan: 3,
            children: [new Paragraph({ children: [new TextRun({ text: "AI INTELLIGENCE FEATURES", font: "Arial", size: 17, bold: true, color: RED, characterSpacing: 40 })] })] })
          ]}),
          moduleRow("AI Morning Briefing", "Daily AI-generated leadership summary — collection figures, patient count, OPD forecast, staff presence, action items requiring attention", 1),
          moduleRow("Revenue Leakage Detection", "AI scans all bills for unbilled services, missed charges, under-billed procedures — alerts management before revenue is lost", 0),
          moduleRow("OPD Load Prediction", "AI predicts tomorrow's and next week's OPD patient volume by centre — enables proactive staff planning and slot management", 1),
          moduleRow("API Connectivity", "Connect your own SMS, WhatsApp, and Email APIs — appointment reminders, booking confirmations, and patient communication via your preferred providers", 0),
        ]
      }),

      sp(2),
      new Paragraph({ children: [new PageBreak()] }),

      // ── UNLIMITED BRANCH ADVANTAGE ──
      new Paragraph({ spacing:{before:0,after:100}, children: [new TextRun({ text: "The Unlimited Branch Advantage", font: "Arial", size: 24, bold: true, color: BLACK })] }),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders,
          shading: { fill: "FFF1F2", type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 240, right: 240 },
          children: [
            new Paragraph({ spacing:{before:0,after:80}, children: [new TextRun({ text: "Most software vendors charge per branch or per user — costs that multiply as you grow. Adrine's Unlimited Branch Plan is different.", font: "Arial", size: 19, color: MGRAY })] }),
            ...[ "Add a new health centre — no extra charge", "Expand to Mumbai, Noida, Bangalore — same annual fee", "Add more staff users — no per-user pricing", "Scale your booking volume — no per-booking fees", "Your software cost stays flat as your business grows" ]
              .map(t => new Paragraph({ spacing:{before:40,after:40}, children: [
                new TextRun({ text: "✓  ", font: "Arial", size: 19, bold: true, color: GREEN }),
                new TextRun({ text: t, font: "Arial", size: 19, color: MGRAY })
              ]})),
            sp(),
            new Paragraph({ children: [new TextRun({ text: "One price. Unlimited scale. Built for Navayuhealth's growth ambition.", font: "Arial", size: 19, bold: true, color: BLACK, italics: true })] }),
          ]
        })]})]}),

      sp(2),

      // ── PRICING ──
      new Paragraph({ spacing:{before:0,after:100}, children: [new TextRun({ text: "Pricing Summary", font: "Arial", size: 24, bold: true, color: BLACK })] }),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [6760, 2600],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 6760, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Description", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 160 }, width: { size: 2600, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Amount", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
          ]}),
          priceRow("One-Time Setup Fee", "₹50,000", false, WHITE),
          priceRow("  → Complete system configuration for all current centres", "", false, BGRAY),
          priceRow("  → Staff onboarding and training (online + on-site)", "", false, WHITE),
          priceRow("  → Data migration and system integration setup", "", false, BGRAY),
          priceRow("  → API connectivity setup (SMS / WhatsApp / Email)", "", false, WHITE),
          priceRow("  → Unlimited future branch additions — no additional setup fee", "", false, BGRAY),
          priceRow("Annual Service Fee", "₹1,99,000 / year", false, WHITE),
          priceRow("  → All modules as listed above — fully activated", "", false, BGRAY),
          priceRow("  → Unlimited branches under one licence", "", false, WHITE),
          priceRow("  → All 3 AI Intelligence features included", "", false, BGRAY),
          priceRow("  → Software updates and new feature releases", "", false, WHITE),
          priceRow("  → 24×7 support with dedicated relationship manager", "", false, BGRAY),
          priceRow("  → 99.9% uptime on enterprise cloud infrastructure", "", false, WHITE),
          priceRow("  → Full customisation — rate cards, templates, workflows", "", false, BGRAY),
          priceRow("TOTAL FIRST YEAR INVESTMENT", "₹2,49,000", true, "FFF1F2"),
          priceRow("Annual Renewal (Year 2 onwards)", "₹1,99,000 / year", false, WHITE),
        ]
      }),

      sp(),

      // No hidden costs note
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: thinB, shading: { fill: LGREEN, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 240, right: 240 },
          children: [new Paragraph({ children: [
            new TextRun({ text: "✓  No hidden costs. No per-branch fees. No per-user charges. No booking volume limits. Full customisation included at no extra charge. What you see is what you pay.", font: "Arial", size: 18, color: GREEN, bold: true })
          ]})]
        })]})]}),

      sp(2),

      // ── PAYMENT TERMS ──
      new Paragraph({ spacing:{before:0,after:100}, children: [new TextRun({ text: "Payment Terms", font: "Arial", size: 24, bold: true, color: BLACK })] }),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [1400, 2800, 5160],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, width: { size: 1400, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Milestone", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, width: { size: 2800, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Amount", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, width: { size: 5160, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "When", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
          ]}),
          ...[
            ["1", "₹1,24,500 (50% of total)", "On agreement signing — to begin configuration immediately"],
            ["2", "₹1,24,500 (50% of total)", "On go-live date — system fully handed over"],
          ].map(([m,a,w], i) => new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, width: { size: 1400, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: m, font: "Arial", size: 19, bold: true, color: RED })] })] }),
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, width: { size: 2800, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: a, font: "Arial", size: 19, bold: true, color: BLACK })] })] }),
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, width: { size: 5160, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: w, font: "Arial", size: 19, color: MGRAY })] })] }),
          ]}))
        ]
      }),

      sp(2),
      new Paragraph({ children: [new PageBreak()] }),

      // ── PLATFORM HIGHLIGHTS ──
      new Paragraph({ spacing:{before:0,after:100}, children: [new TextRun({ text: "Platform Highlights", font: "Arial", size: 24, bold: true, color: BLACK })] }),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Feature", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Detail", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
          ]}),
          ...[
            ["Deployment", "Cloud-based — accessible from any device, any location"],
            ["Offline Mode", "Works without internet, auto-syncs when connection restores"],
            ["Multi-Centre", "All branches on one dashboard — unified view across locations"],
            ["Security", "Role-based access, encrypted data, complete audit trails"],
            ["Uptime", "99.9% SLA — enterprise-grade infrastructure"],
            ["Customisation", "Rate cards, templates, workflows — all fully customisable"],
            ["Support", "24×7 dedicated support + relationship manager"],
            ["Booking Scale", "Handles thousands of bookings — built for high-volume health brands"],
            ["API Ready", "Connect your own WhatsApp, SMS, Email APIs seamlessly"],
            ["Updates", "All future features and updates included in annual fee"],
          ].map(([f,d], i) => new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: f, font: "Arial", size: 18, bold: true, color: BLACK })] })] }),
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: d, font: "Arial", size: 18, color: MGRAY })] })] }),
          ]}))
        ]
      }),

      sp(2),

      // ── TERMS ──
      new Paragraph({ spacing:{before:0,after:100}, children: [new TextRun({ text: "Terms & Conditions", font: "Arial", size: 24, bold: true, color: BLACK })] }),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: thinB, shading: { fill: BGRAY, type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 240, right: 240 },
          children: [
            ...[ "1.  This quotation is valid for 30 days from the date of issue.",
              "2.  The Unlimited Branch Plan covers all current and future branches of Navayuhealth under one annual licence — no additional setup or annual fees per branch.",
              "3.  All customisations — rate cards, templates, workflows, reports — are included at no additional charge.",
              "4.  There are no hidden costs. Pricing stated is final and fully transparent.",
              "5.  Annual renewal fee is payable on the anniversary date of go-live.",
              "6.  Data belongs entirely to Navayuhealth at all times. Adrine does not share or use client data.",
              "7.  Software updates and new feature releases are included in the annual service fee at no extra charge.",
              "8.  Support is available 24×7 with a dedicated relationship manager assigned to Navayuhealth.",
              "9.  Payment to be made via NEFT/RTGS/UPI to Quadrat Technologies bank account details shared separately.",
              "10. This agreement does not transfer any ownership of the Adrine software or intellectual property.",
            ].map(t => new Paragraph({ spacing:{before:55,after:55}, children: [new TextRun({ text: t, font: "Arial", size: 18, color: MGRAY })] }))
          ]
        })]})]}),

      sp(2),

      // ── ACCEPTANCE ──
      new Paragraph({ spacing:{before:0,after:100}, children: [new TextRun({ text: "Acceptance & Authorisation", font: "Arial", size: 24, bold: true, color: BLACK })] }),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "For Navayuhealth", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 80, right: 160 }, width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "For Quadrat Technologies (Adrine)", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 200, bottom: 200, left: 160, right: 80 }, width: { size: 4680, type: WidthType.DXA },
              children: [
                new Paragraph({ spacing:{before:0,after:120}, children: [new TextRun({ text: "Signature:  _______________________", font: "Arial", size: 18, color: MGRAY })] }),
                new Paragraph({ spacing:{before:0,after:120}, children: [new TextRun({ text: "Name:  Mr. Kamal", font: "Arial", size: 18, color: MGRAY })] }),
                new Paragraph({ spacing:{before:0,after:120}, children: [new TextRun({ text: "Designation:  ____________________", font: "Arial", size: 18, color: MGRAY })] }),
                new Paragraph({ spacing:{before:0,after:0}, children: [new TextRun({ text: "Date:  ___________________________", font: "Arial", size: 18, color: MGRAY })] }),
              ]
            }),
            new TableCell({ borders: thinB, shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 200, bottom: 200, left: 80, right: 160 }, width: { size: 4680, type: WidthType.DXA },
              children: [
                new Paragraph({ spacing:{before:0,after:120}, children: [new TextRun({ text: "Signature:  _______________________", font: "Arial", size: 18, color: MGRAY })] }),
                new Paragraph({ spacing:{before:0,after:120}, children: [new TextRun({ text: "Name:  Parthrajsinh Gohil", font: "Arial", size: 18, color: MGRAY })] }),
                new Paragraph({ spacing:{before:0,after:120}, children: [new TextRun({ text: "Designation:  Founder & CEO", font: "Arial", size: 18, color: MGRAY })] }),
                new Paragraph({ spacing:{before:0,after:0}, children: [new TextRun({ text: "Date:  ___________________________", font: "Arial", size: 18, color: MGRAY })] }),
              ]
            }),
          ]}),
        ]
      }),

      sp(2),

      // ── FOOTER BOX ──
      new Table({ width: { size: 10080, type: WidthType.DXA }, columnWidths: [10080],
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders, shading: { fill: BLACK, type: ShadingType.CLEAR },
          margins: { top: 240, bottom: 240, left: 400, right: 400 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:60}, children: [new TextRun({ text: "ADRINE", font: "Arial", size: 40, bold: true, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:60}, children: [new TextRun({ text: "The Hospital Operating System  ·  by Quadrat Technologies", font: "Arial", size: 18, color: "2EC4B6" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "hello@adrine.in  |  adrine.in  |  Gandhinagar, Gujarat", font: "Arial", size: 17, color: LGRAY })] }),
          ]
        })]})]}),
    ]
  }]
});

Packer.toBuffer(doc).then(b => {
  const outputPath = './Adrine_Quotation_NYH.docx';
  fs.writeFileSync(outputPath, b);
  console.log('DOCX generated successfully at:', outputPath);
});
