import { useState } from 'react';
import { PreviewWireBanner } from '@/components/PreviewWireBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  FileText,
  Headphones,
  Link,
  Mic,
  MonitorSmartphone,
  PhoneCall,
  PlayCircle,
  Radio,
  ScreenShare,
  Settings2,
  ShieldCheck,
  Video,
  VideoOff,
  Users,
} from 'lucide-react';

const topStats = [
  { label: 'Sessions today', value: '18', detail: '6 upcoming, 2 live', icon: CalendarClock },
  { label: 'Average wait time', value: '04m', detail: 'Below teleconsult SLA', icon: PhoneCall },
  { label: 'Completed consults', value: '10', detail: '94% documentation closed', icon: CheckCircle2 },
  { label: 'Patient readiness', value: '89%', detail: 'Device test passed before call', icon: Headphones },
];

const waitingRoom = [
  { patient: 'Fatima Begum', uhid: 'UHID-10456', doctor: 'Dr. Sharma', slot: '11:30 AM', readiness: 'Ready', reason: 'General medicine follow-up' },
  { patient: 'Rohit Kapoor', uhid: 'UHID-10789', doctor: 'Dr. Rajesh Kumar', slot: '12:00 PM', readiness: 'Camera issue', reason: 'Cardiology review' },
  { patient: 'Kavita Nair', uhid: 'UHID-11001', doctor: 'Dr. Patel', slot: '02:00 PM', readiness: 'Ready', reason: 'Dermatology revisit' },
];

const participants = [
  { name: 'Dr. Sharma', role: 'Host', state: 'Speaking' },
  { name: 'Fatima Begum', role: 'Patient', state: 'Connected' },
  { name: 'Nurse Anita', role: 'Care Assistant', state: 'Muted' },
];

const deviceChecklist = [
  { label: 'Camera', status: 'Healthy', progress: 96 },
  { label: 'Microphone', status: 'Healthy', progress: 91 },
  { label: 'Speaker', status: 'Healthy', progress: 94 },
  { label: 'Network', status: 'Stable', progress: 88 },
];

const recentSessions = [
  { id: 'TC-004', patient: 'Suresh Yadav', doctor: 'Dr. Gupta', dept: 'ENT', duration: '15 min', outcome: 'Prescription shared', recording: 'Available' },
  { id: 'TC-005', patient: 'Neha Patel', doctor: 'Dr. Ananya Mishra', dept: 'Cardiology', duration: '20 min', outcome: 'Follow-up booked', recording: 'Available' },
  { id: 'TC-006', patient: 'Anil Joshi', doctor: 'Dr. Sharma', dept: 'General Medicine', duration: '12 min', outcome: 'Lab order raised', recording: 'Pending upload' },
];

const stateStyles: Record<string, string> = {
  Ready: 'bg-success/10 text-success border-success/20',
  'Camera issue': 'bg-warning/10 text-warning border-warning/20',
  Healthy: 'bg-success/10 text-success border-success/20',
  Stable: 'bg-info/10 text-info border-info/20',
  Speaking: 'bg-success/10 text-success border-success/20',
  Connected: 'bg-info/10 text-info border-info/20',
  Muted: 'bg-muted text-muted-foreground border-border',
  Available: 'bg-success/10 text-success border-success/20',
  'Pending upload': 'bg-warning/10 text-warning border-warning/20',
};

export default function SchedulingTeleconsult() {
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(waitingRoom[0]);

  const sessionId = `ADR-TM-2026-0314-${selectedPatient.uhid.slice(-3)}`;

  return (
    <div className="space-y-6">
      <PreviewWireBanner
        title="Teleconsult (preview)"
        description="Room UX is wired for demos. Live teleconsult sessions will bind to scheduling appointments with modality=teleconsult once the telemedicine domain module ships."
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Adrine Telemedicine</h1>
          <p className="text-sm text-muted-foreground">Preview waiting room and session shell — book teleconsults from Central Calendar when platform runtime is on</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline">
            <Link className="mr-2 h-4 w-4" />
            Copy Room Link
          </Button>
          <Button onClick={() => setMeetingStarted(true)}>
            <Video className="mr-2 h-4 w-4" />
            {meetingStarted ? 'Meeting Live' : 'Start New Session'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr,0.95fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Live Consultation Room</CardTitle>
            <Badge
              variant="outline"
              className={meetingStarted ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}
            >
              {meetingStarted ? 'Live now' : 'Ready to start'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="rounded-xl border bg-slate-950 p-4 text-slate-50">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400">Session ID</p>
                    <p className="mt-1 font-medium">{sessionId}</p>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${meetingStarted ? 'text-emerald-300' : 'text-amber-300'}`}>
                    <Radio className="h-3.5 w-3.5" />
                    {meetingStarted ? 'Encrypted consultation active' : 'Session staged and ready'}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex min-h-[250px] flex-col justify-between rounded-xl bg-slate-900 p-4 ring-1 ring-white/10">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-white/10 text-white hover:bg-white/10">Doctor view</Badge>
                      <span className="text-xs text-slate-400">HD</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Dr. Sharma</p>
                      <p className="text-sm text-slate-400">General Medicine</p>
                    </div>
                  </div>
                  <div className="flex min-h-[250px] flex-col justify-between rounded-xl bg-slate-800 p-4 ring-1 ring-white/10">
                    <div className="flex items-center justify-between">
                      <Badge className={meetingStarted ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15' : 'bg-white/10 text-white hover:bg-white/10'}>
                        {meetingStarted ? 'Patient connected' : selectedPatient.readiness}
                      </Badge>
                      <span className="text-xs text-slate-400">{selectedPatient.slot} slot</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{selectedPatient.patient}</p>
                      <p className="text-sm text-slate-400">{selectedPatient.reason}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" className="bg-white text-slate-950 hover:bg-white/90" onClick={() => setMicEnabled((value) => !value)}>
                    <Mic className="mr-2 h-4 w-4" />
                    {micEnabled ? 'Mute' : 'Unmute'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setCameraEnabled((value) => !value)}>
                    <Video className="mr-2 h-4 w-4" />
                    {cameraEnabled ? 'Camera On' : 'Camera Off'}
                  </Button>
                  <Button size="sm" variant="secondary">
                    <ScreenShare className="mr-2 h-4 w-4" />
                    Share Screen
                  </Button>
                  <Button size="sm" variant="secondary">
                    <FileText className="mr-2 h-4 w-4" />
                    Open Notes
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setMeetingStarted(false)}>
                    <VideoOff className="mr-2 h-4 w-4" />
                    End Consult
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Session Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">Recording</p>
                        <p className="text-xs text-muted-foreground">Consent captured, start cloud recording</p>
                      </div>
                      <Button size="sm" variant="outline" disabled={!meetingStarted}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        {meetingStarted ? 'Record' : 'Start after live'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">Invite caregiver</p>
                        <p className="text-xs text-muted-foreground">Share secure room access</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Invite
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">Settings</p>
                        <p className="text-xs text-muted-foreground">Video, audio and screen configuration</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Settings2 className="mr-2 h-4 w-4" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Participants</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {participants.map((participant) => (
                      <div key={participant.name} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-xs text-muted-foreground">{participant.role}</p>
                        </div>
                        <Badge variant="outline" className={stateStyles[participant.state]}>
                          {participant.state}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deviceChecklist.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <Badge variant="outline" className={stateStyles[item.status]}>
                      {item.status}
                    </Badge>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              ))}
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                Patient device test was completed 8 minutes before room entry.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clinical Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                'Verify consent and patient identity',
                'Review pre-uploaded reports and attachments',
                'Capture notes and prescription live',
                'Close consultation with follow-up slot or lab order',
              ].map((step) => (
                <div key={step} className="flex items-start gap-3 rounded-lg border p-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="waiting-room" className="space-y-4">
        <TabsList>
          <TabsTrigger value="waiting-room">Waiting Room</TabsTrigger>
          <TabsTrigger value="recent">Recent Sessions</TabsTrigger>
          <TabsTrigger value="documentation">Documentation Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="waiting-room">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Patient Waiting Room</CardTitle>
              <Button variant="outline" size="sm">
                <MonitorSmartphone className="mr-2 h-4 w-4" />
                Send Device Test
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>UHID</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Readiness</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitingRoom.map((item) => (
                    <TableRow
                      key={`${item.patient}-${item.slot}`}
                      className="cursor-pointer"
                      onClick={() => setSelectedPatient(item)}
                    >
                      <TableCell className="font-medium">{item.patient}</TableCell>
                      <TableCell>{item.uhid}</TableCell>
                      <TableCell>{item.doctor}</TableCell>
                      <TableCell>{item.slot}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={stateStyles[item.readiness]}>
                          {item.readiness}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => setMeetingStarted(true)}>
                  <Video className="mr-2 h-4 w-4" />
                  Start Meeting With {selectedPatient.patient}
                </Button>
                <Button variant="outline">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Invite Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Telemedicine Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Recording</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-xs">{session.id}</TableCell>
                      <TableCell className="font-medium">{session.patient}</TableCell>
                      <TableCell>{session.doctor}</TableCell>
                      <TableCell>{session.dept}</TableCell>
                      <TableCell>{session.duration}</TableCell>
                      <TableCell>{session.outcome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={stateStyles[session.recording]}>
                          {session.recording}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pre-Call</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border p-3">Consent form and ID verification</div>
                <div className="rounded-lg border p-3">Patient device and network test</div>
                <div className="rounded-lg border p-3">Reports and attachments preloaded</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">In Call</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border p-3">Live notes and digital prescription drafting</div>
                <div className="rounded-lg border p-3">Screen share for reports or imaging</div>
                <div className="rounded-lg border p-3">Invite caregiver or translator securely</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Post-Call</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border p-3">Prescription and summary shared instantly</div>
                <div className="rounded-lg border p-3">Orders, labs and follow-up slot created</div>
                <div className="rounded-lg border p-3">Recording and audit trail stored compliantly</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
