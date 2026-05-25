import { useState } from 'react';
import {
  FileText, Lock, Eye, EyeOff, Calendar, Sparkles,
  BedDouble, Award, BookOpen, ArrowRightLeft, FileSearch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AdmissionBedType = 'General' | 'Semi-Private' | 'Private' | 'ICU';
type AdmissionPriority = 'Routine' | 'Urgent' | 'Emergency';
type AdmissionJourneyType = 'IPD' | 'ICU' | 'Surgery' | 'Maternity' | 'Dialysis' | 'Trauma';

export interface AdmissionRecommendationPayload {
  department: string;
  bedType: AdmissionBedType;
  priority: AdmissionPriority;
  reason: string;
  journeyType: AdmissionJourneyType;
}

interface Props {
  advice: string;
  onAdviceChange: (v: string) => void;
  privateNotes: string;
  onPrivateNotesChange: (v: string) => void;
  followUpDays: string;
  onFollowUpDaysChange: (v: string) => void;
  followUpUnit: string;
  onFollowUpUnitChange: (v: string) => void;
  treatmentPlan: string;
  onTreatmentPlanChange: (v: string) => void;
  onSave: () => void;
  onDraft: () => void;
  onPreview?: () => void;
  onRecommendAdmission?: (payload: AdmissionRecommendationPayload) => void;
  saveDisabled?: boolean;
  saveDisabledReason?: string;
}

export default function ConsultationRightPanel({
  advice, onAdviceChange, privateNotes, onPrivateNotesChange,
  followUpDays, onFollowUpDaysChange, followUpUnit, onFollowUpUnitChange,
  treatmentPlan, onTreatmentPlanChange, onSave, onDraft, onPreview, onRecommendAdmission,
  saveDisabled,
  saveDisabledReason,
}: Props) {
  const [showPrivateNotes, setShowPrivateNotes] = useState(false);
  const [showAdmission, setShowAdmission] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const [admissionData, setAdmissionData] = useState<AdmissionRecommendationPayload>({
    department: '',
    bedType: 'General',
    priority: 'Routine',
    reason: '',
    journeyType: 'IPD',
  });
  const [referralData, setReferralData] = useState({ doctor: '', department: '', reason: '' });
  const [certificateType, setCertificateType] = useState('medical-leave');

  const handleSubmitAdmission = () => {
    if (!admissionData.reason.trim()) {
      return;
    }

    onRecommendAdmission?.(admissionData);
    setShowAdmission(false);
  };

  return (
    <div className="space-y-3">
      {/* Treatment Plan */}
      <div className="border rounded-xl bg-card p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-2">
          <BookOpen className="w-3.5 h-3.5" /> Treatment Plan
        </p>
        <Textarea
          placeholder="Treatment objective, therapy plan, monitoring instructions..."
          value={treatmentPlan}
          onChange={e => onTreatmentPlanChange(e.target.value)}
          className="text-xs min-h-[60px] resize-none"
        />
      </div>

      {/* Advice / Patient Education */}
      <div className="border rounded-xl bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Advice & Patient Education
          </p>
          <button className="text-muted-foreground hover:text-foreground">
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
        <Textarea
          placeholder="Diet, lifestyle, medication adherence, rehabilitation instructions..."
          value={advice}
          onChange={e => onAdviceChange(e.target.value)}
          className="text-xs min-h-[60px] resize-none"
        />
      </div>

      {/* Private Notes */}
      <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Private Notes
          </p>
          <button onClick={() => setShowPrivateNotes(!showPrivateNotes)} className="text-amber-600 hover:text-amber-700">
            {showPrivateNotes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        {showPrivateNotes ? (
          <Textarea placeholder="Private clinical notes..." value={privateNotes} onChange={e => onPrivateNotesChange(e.target.value)} className="text-xs min-h-[50px] resize-none border-amber-500/20" />
        ) : (
          <p className="text-xs text-amber-600">Hidden (click eye to view)</p>
        )}
      </div>

      {/* Follow Up */}
      <div className="border rounded-xl bg-card p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-2">
          <Calendar className="w-3.5 h-3.5" /> Follow Up
        </p>
        <div className="flex gap-2">
          <Input value={followUpDays} onChange={e => onFollowUpDaysChange(e.target.value)} className="h-7 text-xs w-14" />
          <Select value={followUpUnit} onValueChange={onFollowUpUnitChange}>
            <SelectTrigger className="h-7 text-xs w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Days">Days</SelectItem>
              <SelectItem value="Weeks">Weeks</SelectItem>
              <SelectItem value="Months">Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-1.5">
        <button onClick={() => setShowAdmission(!showAdmission)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-accent transition-colors text-left">
          <BedDouble className="w-3.5 h-3.5 text-muted-foreground" /> Recommend Admission
        </button>
        {showAdmission && (
          <div className="border rounded-lg p-3 space-y-2 bg-accent/30">
            <Select value={admissionData.journeyType} onValueChange={(value) => setAdmissionData({ ...admissionData, journeyType: value as AdmissionJourneyType })}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Admission Journey" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IPD">IPD</SelectItem>
                <SelectItem value="ICU">ICU</SelectItem>
                <SelectItem value="Surgery">Surgery</SelectItem>
                <SelectItem value="Maternity">Maternity</SelectItem>
                <SelectItem value="Dialysis">Dialysis</SelectItem>
                <SelectItem value="Trauma">Trauma</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Department" value={admissionData.department} onChange={e => setAdmissionData({ ...admissionData, department: e.target.value })} className="h-7 text-xs" />
            <div className="flex gap-1.5">
              <Select value={admissionData.bedType} onValueChange={(value) => setAdmissionData({ ...admissionData, bedType: value as AdmissionBedType })}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Bed Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Semi-Private">Semi-Private</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                </SelectContent>
              </Select>
              <Select value={admissionData.priority} onValueChange={(value) => setAdmissionData({ ...admissionData, priority: value as AdmissionPriority })}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Routine">Routine</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Reason" value={admissionData.reason} onChange={e => setAdmissionData({ ...admissionData, reason: e.target.value })} className="h-7 text-xs" />
            <Button
              size="sm"
              className="h-7 text-xs w-full"
              onClick={handleSubmitAdmission}
              disabled={!admissionData.reason.trim() || !onRecommendAdmission}
            >
              Transfer OPD To IPD
            </Button>
          </div>
        )}

        <button onClick={() => setShowReferral(!showReferral)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-accent transition-colors text-left">
          <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" /> Refer to Specialist
        </button>
        {showReferral && (
          <div className="border rounded-lg p-3 space-y-2 bg-accent/30">
            <Input placeholder="Doctor name" value={referralData.doctor} onChange={e => setReferralData({ ...referralData, doctor: e.target.value })} className="h-7 text-xs" />
            <Input placeholder="Department" value={referralData.department} onChange={e => setReferralData({ ...referralData, department: e.target.value })} className="h-7 text-xs" />
            <Input placeholder="Referral reason" value={referralData.reason} onChange={e => setReferralData({ ...referralData, reason: e.target.value })} className="h-7 text-xs" />
            <Button size="sm" className="h-7 text-xs w-full">Create Referral</Button>
          </div>
        )}

        <button onClick={() => setShowCertificate(!showCertificate)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-accent transition-colors text-left">
          <Award className="w-3.5 h-3.5 text-muted-foreground" /> Issue Certificate
        </button>
        {showCertificate && (
          <div className="border rounded-lg p-3 space-y-2 bg-accent/30">
            <Select value={certificateType} onValueChange={setCertificateType}>
              <SelectTrigger className="h-7 text-xs w-full">
                <SelectValue placeholder="Certificate Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical-leave">Medical Leave Certificate</SelectItem>
                <SelectItem value="fitness">Fitness Certificate</SelectItem>
                <SelectItem value="illness">Illness Certificate</SelectItem>
                <SelectItem value="fitness-to-work">Fitness to Work</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-7 text-xs w-full">Generate Certificate</Button>
          </div>
        )}
      </div>

      {/* Save Actions */}
      <div className="space-y-2 pt-2">
        {onPreview && (
          <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={onPreview}>
            <FileSearch className="w-3.5 h-3.5" /> Preview Prescription
          </Button>
        )}
        {saveDisabled && saveDisabledReason ? (
          <p className="text-[10px] text-destructive leading-snug">{saveDisabledReason}</p>
        ) : null}
        <Button
          size="sm"
          className="w-full bg-foreground text-background hover:bg-foreground/90"
          onClick={onSave}
          disabled={saveDisabled}
        >
          Save & Print Prescription
        </Button>
        <Button variant="outline" size="sm" className="w-full" onClick={onDraft}>
          Save Draft
        </Button>
      </div>
    </div>
  );
}
