import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  PageBreak, Header, Footer
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

function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: BLACK })]
  });
}

function para(text, color = MGRAY, bold = false, size = 19) {
  return new Paragraph({
    spacing: { before: 70, after: 70 },
    children: [new TextRun({ text, font: "Arial", size, color, bold })]
  });
}

function checkRow(text, sub = "") {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({ text: "✓  ", font: "Arial", size: 19, bold: true, color: GREEN }),
      new TextRun({ text, font: "Arial", size: 19, bold: true, color: BLACK }),
      ...(sub ? [new TextRun({ text: "  —  " + sub, font: "Arial", size: 19, color: MGRAY })] : [])
    ]
  });
}

function phaseCard(phase, dates, items) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({ children: [new TableCell({
        borders: noBorders,
        shading: { fill: BLACK, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 220, right: 220 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: phase + "  ", font: "Arial", size: 20, bold: true, color: WHITE }),
              new TextRun({ text: "  |  " + dates, font: "Arial", size: 18, color: RED, bold: true })
            ]
          })
        ]
      })]
      }),
      new TableRow({ children: [new TableCell({
        borders: thinB,
        shading: { fill: BGRAY, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 220, right: 220 },
        children: items.map(item => new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({ text: "•  ", font: "Arial", size: 19, color: RED, bold: true }),
            new TextRun({ text: item, font: "Arial", size: 19, color: MGRAY })
          ]
        }))
      })]
      })
    ]
  });
}

function infoRow(label, value, ri) {
  return new TableRow({ children: [
    new TableCell({
      borders: thinB,
      shading: { fill: ri%2===0 ? BGRAY : WHITE, type: ShadingType.CLEAR },
      margins: { top: 90, bottom: 90, left: 160, right: 80 },
      width: { size: 3000, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: label, font: "Arial", size: 19, bold: true, color: BLACK })] })]
    }),
    new TableCell({
      borders: thinB,
      shading: { fill: WHITE, type: ShadingType.CLEAR },
      margins: { top: 90, bottom: 90, left: 160, right: 160 },
      width: { size: 6360, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: value, font: "Arial", size: 19, color: MGRAY })] })]
    })
  ]});
}

const doc = new Document({
  styles: { default: { document: { run: { font: "Arial", size: 19 } } } },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    headers: { default: new Header({ children: [
      new Table({ width: { size: 10080, type: WidthType.DXA }, columnWidths: [5040, 5040],
        rows: [new TableRow({ children: [
          new TableCell({ borders: noBorders, shading: { fill: BLACK, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 160, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: "ADRINE  |  Implementation & Onboarding Plan", font: "Arial", size: 16, bold: true, color: WHITE })] })] }),
          new TableCell({ borders: noBorders, shading: { fill: BLACK, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 60, right: 160 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Quadrat Technologies  |  Confidential", font: "Arial", size: 16, color: LGRAY, italics: true })] })] })
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
          margins: { top: 420, bottom: 420, left: 500, right: 500 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:60},
              children: [new TextRun({ text: "ADRINE", font: "Arial", size: 64, bold: true, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:40},
              children: [new TextRun({ text: "by Quadrat Technologies", font: "Arial", size: 19, color: LGRAY, italics: true })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:60,after:40},
              children: [new TextRun({ text: "─────────────────────────────", font: "Arial", size: 18, color: RED })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:40,after:20},
              children: [new TextRun({ text: "IMPLEMENTATION &", font: "Arial", size: 32, bold: true, color: RED })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:60},
              children: [new TextRun({ text: "ONBOARDING PLAN", font: "Arial", size: 32, bold: true, color: WHITE })] }),
            sp(),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:20},
              children: [new TextRun({ text: "Prepared exclusively for", font: "Arial", size: 17, color: LGRAY, italics: true })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:20},
              children: [new TextRun({ text: "Navayuhealth", font: "Arial", size: 30, bold: true, color: WHITE })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:40},
              children: [new TextRun({ text: "Mr. Kamal  ·  Gurgaon, Haryana", font: "Arial", size: 18, color: LGRAY })] }),
            sp(),
            new Table({ width: { size: 6000, type: WidthType.DXA }, columnWidths: [2000, 2000, 2000],
              rows: [new TableRow({ children: [
                ...[ ["6 May 2026", "Start Date"], ["1 July 2026", "Go-Live Date"], ["2 Months", "Implementation"] ]
                  .map(([v,l]) => new TableCell({
                    borders: noBorders, shading: { fill: "1A1A1A", type: ShadingType.CLEAR },
                    margins: { top: 140, bottom: 140, left: 100, right: 100 },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:0,after:30}, children: [new TextRun({ text: v, font: "Arial", size: 20, bold: true, color: RED })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: l, font: "Arial", size: 15, color: LGRAY })] })
                    ]
                  }))
              ]})]
            }),
            sp(),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing:{before:40,after:0},
              children: [new TextRun({ text: "Document Date:  " + dateStr, font: "Arial", size: 17, color: LGRAY, italics: true })] }),
          ]
        })]})]}),

      sp(2),
      new Paragraph({ children: [new PageBreak()] }),

      // ── SECTION 1: OVERVIEW ──
      sectionTitle("1. Project Overview"),
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders, shading: { fill: "FFF1F2", type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 240, right: 240 },
          children: [
            para("This document outlines the complete implementation and onboarding plan for Adrine — India's first AI-powered Hospital Operating System — at Navayuhealth, Gurgaon."),
            sp(),
            para("Adrine will be fully customised to match Navayuhealth's exact operational workflows across their health centre and mini hospital. The plan covers a structured 2-month customisation and training period, culminating in a complete go-live on 1st July 2026.", MGRAY),
          ]
        })]})]}),

      sp(),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 6360],
        rows: [
          infoRow("Client", "Navayuhealth", 0),
          infoRow("Contact", "Mr. Kamal", 1),
          infoRow("Location", "Gurgaon, Haryana", 0),
          infoRow("Scope", "1 Health Centre + 1 Mini Hospital (15 Beds)", 1),
          infoRow("Plan Duration", "2 Months — 6th May 2026 to 5th July 2026", 0),
          infoRow("Go-Live Date", "1st July 2026", 1),
          infoRow("Daily Meetings", "15 minutes every day — starting 6th May 2026", 0),
          infoRow("Implementation By", "Adrine — Quadrat Technologies, Gandhinagar", 1),
        ]
      }),

      sp(2),

      // ── SECTION 2: MODULES ──
      sectionTitle("2. Modules & Features Included"),
      para("The following modules will be fully configured and activated for Navayuhealth as part of this implementation:"),
      sp(),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [
          // Clinical
          new TableRow({ children: [new TableCell({ borders: noBorders, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 200, right: 200 }, columnSpan: 1,
            children: [new Paragraph({ children: [new TextRun({ text: "CLINICAL MODULES", font: "Arial", size: 17, bold: true, color: RED, characterSpacing: 30 })] })] })
          ]}),
          new TableRow({ children: [new TableCell({ borders: thinB, shading: { fill: BGRAY, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              checkRow("OPD & Patient Registration", "30-sec UHID, appointment calendar, queue & token, digital KYC, Patient 360"),
              checkRow("IPD Management", "Bed allocation, admission, room management, day care, discharge processing"),
              checkRow("Nursing Module", "Ward patient list, vitals, MAR tracking, shift handover, care plans"),
              checkRow("Basic Billing & Invoicing", "OP & IP billing, package pricing, discounts, payment modes, invoice generation"),
              checkRow("Pharmacy & Inventory", "Prescription queue, drug interaction checks, stock & batch tracking, expiry alerts"),
              checkRow("Laboratory Module", "Order-to-result workflow, sample tracking, result entry, PDF report generation"),
              checkRow("Radiology Module", "Modality worklists, technician workflow, radiologist reporting, critical escalation"),
            ]
          })] })
        ]
      }),
      sp(),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [
          new TableRow({ children: [new TableCell({ borders: noBorders, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 200, right: 200 },
            children: [new Paragraph({ children: [new TextRun({ text: "BOOKING & CRM", font: "Arial", size: 17, bold: true, color: RED, characterSpacing: 30 })] })] })
          ]}),
          new TableRow({ children: [new TableCell({ borders: thinB, shading: { fill: BGRAY, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              checkRow("Online Booking System", "High-scale portal, real-time slots, confirmations, multi-centre, website & YouTube integration ready"),
              checkRow("CRM — Patient Management", "Patient profiles, lead tracking, follow-up workflows, re-engagement, centre-wise analytics"),
            ]
          })] })
        ]
      }),
      sp(),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [
          new TableRow({ children: [new TableCell({ borders: noBorders, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 200, right: 200 },
            children: [new Paragraph({ children: [new TextRun({ text: "HRMS — STAFF MANAGEMENT", font: "Arial", size: 17, bold: true, color: RED, characterSpacing: 30 })] })] })
          ]}),
          new TableRow({ children: [new TableCell({ borders: thinB, shading: { fill: BGRAY, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              checkRow("Attendance Management", "Biometric integration, shift & roster, leave management, real-time dashboard"),
              checkRow("Payroll Processing", "Auto calculation, PF/ESI/TDS compliance, salary slips, bank file export"),
            ]
          })] })
        ]
      }),
      sp(),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [
          new TableRow({ children: [new TableCell({ borders: noBorders, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 200, right: 200 },
            children: [new Paragraph({ children: [new TextRun({ text: "AI INTELLIGENCE FEATURES", font: "Arial", size: 17, bold: true, color: RED, characterSpacing: 30 })] })] })
          ]}),
          new TableRow({ children: [new TableCell({ borders: thinB, shading: { fill: BGRAY, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              checkRow("AI Morning Briefing", "Daily AI summary — collection, patient count, OPD forecast, staff presence, action items"),
              checkRow("AI Revenue Leakage Detection", "Scans all bills for unbilled services, missed charges — alerts before revenue is lost"),
              checkRow("AI OPD Load Prediction", "Predicts next day/week OPD volume — enables proactive staff planning"),
              checkRow("WhatsApp / SMS / Email API", "Connect your own API keys — appointment reminders, booking confirmations, patient communication"),
            ]
          })] })
        ]
      }),

      sp(2),
      new Paragraph({ children: [new PageBreak()] }),

      // ── SECTION 3: IMPLEMENTATION TIMELINE ──
      sectionTitle("3. Implementation Timeline — 8 Weeks"),
      para("A structured 15-minute daily customisation meeting will be held every day starting 6th May 2026. Each phase has clear deliverables and milestones."),
      sp(),

      phaseCard("WEEK 1–2  |  DISCOVERY & FOUNDATION", "6th May – 18th May 2026", [
        "In-depth workflow discovery — understanding Navayuhealth's exact processes",
        "Hospital profile setup — departments, locations, centre configuration",
        "User roles and access permissions configured for all staff types",
        "Room and bed configuration for the mini hospital (15 beds)",
        "Doctor and staff profiles created in the system",
        "Rate cards and service master configured as per Navayuhealth's pricing",
      ]),
      sp(),

      phaseCard("WEEK 3–4  |  CLINICAL CORE & BILLING", "19th May – 31st May 2026", [
        "OPD registration workflow fully configured and tested",
        "Online booking portal live — integrated with website and YouTube channel",
        "Pharmacy stock loaded — medicines, batches, expiry tracking",
        "Laboratory module setup — test panels, report templates",
        "Billing system configured — OP, IP, package billing, invoice formats",
        "IPD admission and discharge workflow tested end-to-end",
      ]),
      sp(),

      phaseCard("WEEK 5–6  |  HRMS, CRM & AI ACTIVATION", "1st June – 14th June 2026", [
        "HRMS configured — biometric integration, attendance, shift roster",
        "Payroll setup — salary structure, PF/ESI/TDS as per Navayuhealth requirements",
        "CRM activated — patient records, lead tracking, follow-up automation",
        "WhatsApp / SMS / Email API connected using Navayuhealth's own keys",
        "AI Morning Briefing activated and dashboard configured for leadership",
        "AI Revenue Leakage Detection and OPD Load Prediction live and tested",
      ]),
      sp(),

      phaseCard("WEEK 7–8  |  TRAINING, PILOT & GO-LIVE", "15th June – 1st July 2026", [
        "Full staff training — reception, billing, pharmacy, lab, nursing teams",
        "Doctor training — EMR, prescription workflow, patient 360 view",
        "Live pilot phase — real patients onboarded on the Adrine system",
        "Workflow refinements based on live feedback from Navayuhealth team",
        "Final system audit and quality check by Adrine implementation team",
        "Official go-live and full system handover — 1st July 2026",
      ]),

      sp(2),

      // ── SECTION 4: DAILY MEETING STRUCTURE ──
      sectionTitle("4. Daily Customisation Meeting Structure"),
      para("Every day from 6th May 2026 — a focused 15-minute session at a mutually agreed time."),
      sp(),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [2000, 7360],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, width: { size: 2000, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Duration", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, width: { size: 7360, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Agenda", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
          ]}),
          ...[
            ["Minutes 1–3", "Review of previous day's configuration — any corrections or feedback"],
            ["Minutes 4–10", "Today's customisation task — live configuration on Adrine with Navayuhealth team"],
            ["Minutes 11–13", "Testing and sign-off on today's deliverable"],
            ["Minutes 14–15", "Next day plan — what will be configured tomorrow"],
          ].map(([t, a], i) => new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, width: { size: 2000, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: t, font: "Arial", size: 18, bold: true, color: RED })] })] }),
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, width: { size: 7360, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: a, font: "Arial", size: 18, color: MGRAY })] })] }),
          ]}))
        ]
      }),

      sp(2),
      new Paragraph({ children: [new PageBreak()] }),

      // ── SECTION 5: WHAT ADRINE COMMITS ──
      sectionTitle("5. Adrine's Commitments to Navayuhealth"),
      sp(),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 4680],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Commitment", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Standard", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
          ]}),
          ...[
            ["Daily 15-min customisation meetings", "Every day — 6th May to 5th July 2026"],
            ["Full workflow customisation", "Configured exactly as Navayuhealth operates"],
            ["Staff training", "All departments — reception, billing, nursing, pharmacy, lab"],
            ["Go-live support", "Adrine team on standby for 7 days post go-live"],
            ["Zero hidden charges", "All customisation included — no extra costs ever"],
            ["24×7 Support", "Dedicated relationship manager assigned"],
            ["99.9% Uptime SLA", "Enterprise cloud infrastructure"],
            ["Data ownership", "All data belongs entirely to Navayuhealth"],
            ["Software updates", "All future updates included at no extra charge"],
            ["Unlimited customisation", "Rate cards, templates, workflows — change anytime"],
          ].map(([c,s], i) => new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: c, font: "Arial", size: 18, bold: true, color: BLACK })] })] }),
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 160, right: 80 }, width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: s, font: "Arial", size: 18, color: MGRAY })] })] }),
          ]}))
        ]
      }),

      sp(2),

      // ── SECTION 6: NEXT STEPS ──
      sectionTitle("6. Next Steps"),
      sp(),

      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [800, 2400, 6160],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 80 }, width: { size: 800, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "#", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, width: { size: 2400, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "When", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
            new TableCell({ borders: thinB, shading: { fill: BLACK, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 140, right: 80 }, width: { size: 6160, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Action", font: "Arial", size: 18, bold: true, color: WHITE })] })] }),
          ]}),
          ...[
            ["1", "This Tuesday", "Service agreement signed by both parties"],
            ["2", "This Tuesday", "Setup fee of ₹40,000 collected — onboarding process begins"],
            ["3", "6th May 2026", "First daily 15-minute customisation meeting"],
            ["4", "6th May – 5th July", "Daily meetings — full system configuration and training"],
            ["5", "1st July 2026", "Official go-live — Navayuhealth fully live on Adrine"],
          ].map(([n,w,a], i) => new TableRow({ children: [
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 100, right: 80 }, width: { size: 800, type: WidthType.DXA },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: n, font: "Arial", size: 19, bold: true, color: RED })] })] }),
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 140, right: 80 }, width: { size: 2400, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: w, font: "Arial", size: 19, bold: true, color: BLACK })] })] }),
            new TableCell({ borders: thinB, shading: { fill: i%2===0 ? WHITE : BGRAY, type: ShadingType.CLEAR }, margins: { top: 90, bottom: 90, left: 140, right: 80 }, width: { size: 6160, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: a, font: "Arial", size: 19, color: MGRAY })] })] }),
          ]}))
        ]
      }),

      sp(2),

      // ── CLOSING BOX ──
      new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: thinB, shading: { fill: LGREEN, type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 240, right: 240 },
          children: [
            new Paragraph({ spacing:{before:0,after:80}, children: [new TextRun({ text: "Our Commitment", font: "Arial", size: 20, bold: true, color: GREEN })] }),
            new Paragraph({ children: [new TextRun({ text: "We are committed to making this implementation smooth, fast, and exactly as Navayuhealth needs it. Our daily meetings ensure your team is always informed, involved, and confident. We will not go live until you are fully satisfied.", font: "Arial", size: 19, color: MGRAY })] }),
          ]
        })]})]}),

      sp(2),

      // SIGNATURE BLOCK
      new Paragraph({ spacing:{before:0,after:100}, children: [new TextRun({ text: "Acknowledged & Agreed", font: "Arial", size: 24, bold: true, color: BLACK })] }),

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
                new Paragraph({ spacing:{before:0,after:120}, children: [new TextRun({ text: "Organisation:  Navayuhealth", font: "Arial", size: 18, color: MGRAY })] }),
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

      // FOOTER BOX
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
  const outputPath = './Adrine_Onboarding_Plan_NYH.docx';
  fs.writeFileSync(outputPath, b);
  console.log('DOCX generated successfully at:', outputPath);
});
