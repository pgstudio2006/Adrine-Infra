import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Search, Clock, CheckCircle } from 'lucide-react';

const doctors = [
  { id: 'DOC-001', name: 'Dr. Rajesh Kumar', dept: 'Cardiology', slots: ['10:00 AM', '10:30 AM', '11:00 AM', '2:00 PM', '2:30 PM'] },
  { id: 'DOC-002', name: 'Dr. Ananya Mishra', dept: 'Cardiology', slots: ['9:00 AM', '9:30 AM', '11:30 AM', '3:00 PM'] },
  { id: 'DOC-003', name: 'Dr. Vikram Singh', dept: 'Orthopedics', slots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'] },
  { id: 'DOC-004', name: 'Dr. Sharma', dept: 'General Medicine', slots: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '2:00 PM', '2:30 PM', '3:00 PM'] },
  { id: 'DOC-005', name: 'Dr. Gupta', dept: 'ENT', slots: ['10:00 AM', '11:00 AM', '2:00 PM'] },
];

const appointmentTypes = ['OPD Consultation', 'Follow-up', 'Teleconsultation', 'Specialist Referral', 'Diagnostic', 'Surgery Pre-Assessment'];

export default function SchedulingBook() {
  const [date, setDate] = useState<Date>();
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  const filteredDoctors = selectedDept ? doctors.filter(d => d.dept === selectedDept) : doctors;
  const selectedDoc = doctors.find(d => d.id === selectedDoctor);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Book Appointment</h1>
        <p className="text-sm text-muted-foreground mt-1">Schedule a new patient appointment</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Patient */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Patient Details</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by UHID, name, or phone..." className="pl-9 text-sm" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
            </div>
            {patientSearch.length > 2 && (
              <div className="space-y-1">
                {[
                  { uhid: 'UHID-10045', name: 'Amit Shah', age: '52M', phone: '+91 98765 11111' },
                  { uhid: 'UHID-10102', name: 'Amit Kumar', age: '34M', phone: '+91 98765 22222' },
                ].map(p => (
                  <Card key={p.uhid} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.uhid} · {p.age} · {p.phone}</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">Select</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {/* Appointment Details */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Appointment Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Appointment Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Booking Source</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reception">Reception Desk</SelectItem>
                    <SelectItem value="portal">Patient Portal</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="teleconsult">Telemedicine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Department</Label>
                <Select value={selectedDept} onValueChange={v => { setSelectedDept(v); setSelectedDoctor(''); setSelectedSlot(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {[...new Set(doctors.map(d => d.dept))].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Doctor</Label>
                <Select value={selectedDoctor} onValueChange={v => { setSelectedDoctor(v); setSelectedSlot(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {filteredDoctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Slot Selection */}
            {selectedDoc && (
              <div className="space-y-2">
                <Label className="text-xs">Available Slots</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedDoc.slots.map(slot => (
                    <Button
                      key={slot}
                      variant={selectedSlot === slot ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <Clock className="w-3 h-3 mr-1" />{slot}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs">Notes (Optional)</Label>
              <Textarea placeholder="Additional notes..." className="text-sm min-h-[60px]" />
            </div>
          </Card>

          <Button className="w-full gap-2" disabled={!selectedSlot || !selectedDoctor}>
            <CheckCircle className="w-4 h-4" />Confirm Appointment
          </Button>
        </div>

        {/* Summary Sidebar */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Booking Summary</h2>
          <Card className="p-4 space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-foreground font-medium">{selectedType || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="text-foreground font-medium">{selectedDept || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Doctor</span><span className="text-foreground font-medium">{selectedDoc?.name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground font-medium">{date ? format(date, 'PP') : '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="text-foreground font-medium">{selectedSlot || '—'}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}