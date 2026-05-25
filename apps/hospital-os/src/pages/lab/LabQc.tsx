import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity } from "lucide-react";

type QcControl = {
  code: string;
  analyte: string;
  level: string;
  mean: number;
  sd: number;
  unit: string;
  runs: number[];
};

const QC_CONTROLS: QcControl[] = [
  {
    code: "QC-GLU-N",
    analyte: "Glucose",
    level: "Normal (L1)",
    mean: 95,
    sd: 4,
    unit: "mg/dL",
    runs: [94, 96, 97, 95, 99, 92, 95, 98, 103, 96, 94, 97],
  },
  {
    code: "QC-CREAT-H",
    analyte: "Creatinine",
    level: "High (L2)",
    mean: 4.0,
    sd: 0.2,
    unit: "mg/dL",
    runs: [4.0, 3.9, 4.1, 4.2, 4.0, 3.8, 4.0, 4.1, 4.0, 4.5, 4.0, 3.9],
  },
  {
    code: "QC-TSH-N",
    analyte: "TSH",
    level: "Normal (L1)",
    mean: 2.5,
    sd: 0.3,
    unit: "µIU/mL",
    runs: [2.5, 2.6, 2.4, 2.5, 2.7, 2.5, 2.3, 2.5, 2.6, 2.5, 2.4, 2.5],
  },
];

function westgard(runs: number[], mean: number, sd: number): { index: number; rule: string }[] {
  const flags: { index: number; rule: string }[] = [];
  runs.forEach((v, i) => {
    const z = (v - mean) / sd;
    if (Math.abs(z) > 3) flags.push({ index: i, rule: "1-3s (reject)" });
    else if (Math.abs(z) > 2) flags.push({ index: i, rule: "1-2s (warning)" });
  });
  return flags;
}

export default function LabQc() {
  const [code, setCode] = useState(QC_CONTROLS[0].code);
  const control = QC_CONTROLS.find((c) => c.code === code) ?? QC_CONTROLS[0];

  const flags = useMemo(() => westgard(control.runs, control.mean, control.sd), [control]);

  // Chart geometry
  const W = 640;
  const H = 220;
  const padX = 36;
  const padY = 20;
  const lo = control.mean - 3.5 * control.sd;
  const hi = control.mean + 3.5 * control.sd;
  const x = (i: number) => padX + (i * (W - 2 * padX)) / (control.runs.length - 1);
  const y = (v: number) => padY + ((hi - v) / (hi - lo)) * (H - 2 * padY);

  const sdLines = [-3, -2, -1, 0, 1, 2, 3].map((k) => ({
    k,
    val: control.mean + k * control.sd,
    color: k === 0 ? "currentColor" : Math.abs(k) === 3 ? "#dc2626" : Math.abs(k) === 2 ? "#d97706" : "#9ca3af",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quality control</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Levey-Jennings charts and Westgard rule flags for control materials.
          </p>
        </div>
        <Select value={code} onValueChange={setCode}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QC_CONTROLS.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.analyte} · {c.level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Alert>
        <AlertTitle className="text-sm">QC scope</AlertTitle>
        <AlertDescription className="text-xs">
          Control data is illustrative. A production QC module ingests analyzer control runs, supports full Westgard
          multi-rules, calibration, and EQAS (lab W9).
        </AlertDescription>
      </Alert>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" /> {control.analyte} — {control.level}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">x̄ {control.mean} {control.unit}</Badge>
            <Badge variant="outline" className="text-xs">SD {control.sd}</Badge>
            <Badge variant={flags.some((f) => f.rule.includes("reject")) ? "destructive" : flags.length ? "secondary" : "outline"} className="text-xs">
              {flags.length ? `${flags.length} flag(s)` : "In control"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-foreground" role="img" aria-label="Levey-Jennings chart">
            {sdLines.map((l) => (
              <g key={l.k}>
                <line x1={padX} y1={y(l.val)} x2={W - padX} y2={y(l.val)} stroke={l.color} strokeWidth={l.k === 0 ? 1.5 : 1} strokeDasharray={l.k === 0 ? "" : "4 3"} opacity={0.7} />
                <text x={4} y={y(l.val) + 3} fontSize="9" fill="#6b7280">
                  {l.k === 0 ? "x̄" : `${l.k > 0 ? "+" : ""}${l.k}SD`}
                </text>
              </g>
            ))}
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth={1.5}
              points={control.runs.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            />
            {control.runs.map((v, i) => {
              const z = Math.abs((v - control.mean) / control.sd);
              const fill = z > 3 ? "#dc2626" : z > 2 ? "#d97706" : "#2563eb";
              return <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={fill} />;
            })}
          </svg>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Run 1</span>
            <span>Run {control.runs.length}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rule flags</CardTitle>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">All runs within ±2SD — control accepted.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {flags.map((f) => (
                <li key={f.index} className="flex items-center gap-2">
                  <Badge variant={f.rule.includes("reject") ? "destructive" : "secondary"} className="text-xs">
                    Run {f.index + 1}
                  </Badge>
                  <span className="text-muted-foreground">
                    {control.runs[f.index]} {control.unit} · {f.rule}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
