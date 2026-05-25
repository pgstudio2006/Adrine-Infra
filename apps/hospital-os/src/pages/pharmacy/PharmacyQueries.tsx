import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MessageSquare, AlertTriangle, Send, Clock, CheckCircle, User, Stethoscope } from "lucide-react";

interface Query {
  id: string;
  from: string;
  fromRole: "Doctor" | "Nurse";
  patient: string;
  uhid: string;
  subject: string;
  message: string;
  timestamp: string;
  status: "Open" | "Replied" | "Resolved";
  priority: "Normal" | "Urgent";
  replies: { from: string; message: string; time: string }[];
}

const queries: Query[] = [
  {
    id: "QRY-101", from: "Dr. Patel", fromRole: "Doctor", patient: "Ravi Sharma", uhid: "UH-10042",
    subject: "Alternative for Amoxicillin — allergy noted",
    message: "Patient has reported penicillin allergy. Please suggest an alternative antibiotic for upper respiratory infection.",
    timestamp: "2026-03-08 10:15", status: "Open", priority: "Urgent",
    replies: [],
  },
  {
    id: "QRY-100", from: "Dr. Mehta", fromRole: "Doctor", patient: "Anita Desai", uhid: "UH-10038",
    subject: "Atorvastatin availability in 10mg",
    message: "Patient requires 10mg dose but I see only 20mg in the system. Is 10mg available or should I prescribe half-tablet?",
    timestamp: "2026-03-08 09:30", status: "Replied", priority: "Normal",
    replies: [
      { from: "Pharmacist Anil", message: "10mg Atorvastatin is available in Batch B-4431. I've updated the catalog. You can prescribe 10mg directly.", time: "09:45" },
    ],
  },
  {
    id: "QRY-099", from: "Nurse Priya", fromRole: "Nurse", patient: "Suresh Kumar", uhid: "UH-10035",
    subject: "Diclofenac injection vs oral",
    message: "Patient is having severe pain post-surgery. Doctor ordered oral Diclofenac but patient cannot swallow. Can we get injection form?",
    timestamp: "2026-03-07 16:20", status: "Resolved", priority: "Urgent",
    replies: [
      { from: "Pharmacist Anil", message: "Diclofenac 75mg/3ml injection available. Sending to ward. Please confirm with the prescribing doctor for route change.", time: "16:30" },
      { from: "Nurse Priya", message: "Confirmed with Dr. Rao. Route changed to IM. Thanks!", time: "16:35" },
    ],
  },
  {
    id: "QRY-098", from: "Dr. Shah", fromRole: "Doctor", patient: "Meena Joshi", uhid: "UH-10029",
    subject: "Fluticasone nasal spray stock",
    message: "Is Fluticasone nasal spray 50mcg available? Patient needs 14-day course.",
    timestamp: "2026-03-07 14:00", status: "Replied", priority: "Normal",
    replies: [
      { from: "Pharmacist Meera", message: "Currently out of stock. Expected delivery on March 9th via PO-301. Alternative: Budesonide nasal spray available.", time: "14:15" },
    ],
  },
];

const statusColor: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Replied: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Open: Clock,
  Replied: MessageSquare,
  Resolved: CheckCircle,
};

export default function PharmacyQueries() {
  const [selected, setSelected] = useState<Query | null>(null);
  const [replyText, setReplyText] = useState("");
  const [tab, setTab] = useState("all");

  const filtered = queries.filter(q => {
    if (tab === "all") return true;
    return q.status === tab;
  });

  const openCount = queries.filter(q => q.status === "Open").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Doctor & Nurse Queries</h1>
        <p className="text-muted-foreground text-sm">Respond to medication queries, drug availability, and alternatives</p>
      </div>

      {openCount > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-foreground">{openCount} open {openCount === 1 ? "query" : "queries"} awaiting response</span>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({queries.length})</TabsTrigger>
          <TabsTrigger value="Open">Open ({queries.filter(q => q.status === "Open").length})</TabsTrigger>
          <TabsTrigger value="Replied">Replied ({queries.filter(q => q.status === "Replied").length})</TabsTrigger>
          <TabsTrigger value="Resolved">Resolved ({queries.filter(q => q.status === "Resolved").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filtered.map(q => {
          const Icon = statusIcon[q.status];
          return (
            <Card key={q.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(q)}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {q.fromRole === "Doctor" ? <Stethoscope className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-primary" />}
                      <span className="font-medium text-sm text-foreground">{q.from}</span>
                      <span className="text-xs text-muted-foreground">• {q.patient} ({q.uhid})</span>
                      {q.priority === "Urgent" && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                    </div>
                    <p className="font-medium text-foreground">{q.subject}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{q.message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusColor[q.status]}`}>
                      <Icon className="h-3 w-3" /> {q.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{q.timestamp}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Query Detail */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setReplyText(""); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.subject}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selected.status]}`}>{selected.status}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">From:</span> {selected.from} ({selected.fromRole})</div>
                  <div><span className="text-muted-foreground">Patient:</span> {selected.patient}</div>
                  <div><span className="text-muted-foreground">UHID:</span> {selected.uhid}</div>
                  <div><span className="text-muted-foreground">Time:</span> {selected.timestamp}</div>
                </div>

                {/* Conversation thread */}
                <div className="space-y-3">
                  <div className="border border-border rounded-lg p-3 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{selected.from}</p>
                    <p className="text-sm text-foreground">{selected.message}</p>
                  </div>
                  {selected.replies.map((r, i) => (
                    <div key={i} className={`border border-border rounded-lg p-3 ${r.from.startsWith("Pharmacist") ? "bg-primary/5 ml-4" : "bg-muted/30"}`}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium text-muted-foreground">{r.from}</p>
                        <span className="text-xs text-muted-foreground">{r.time}</span>
                      </div>
                      <p className="text-sm text-foreground">{r.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                {selected.status !== "Resolved" && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <Label>Reply</Label>
                    <Textarea placeholder="Type your response..." value={replyText} onChange={e => setReplyText(e.target.value)} rows={3} />
                    <div className="flex gap-2">
                      <Button className="flex-1" disabled={!replyText.trim()} onClick={() => { setReplyText(""); setSelected(null); }}>
                        <Send className="h-4 w-4 mr-2" /> Send Reply
                      </Button>
                      <Button variant="outline" onClick={() => setSelected(null)}>Mark Resolved</Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
