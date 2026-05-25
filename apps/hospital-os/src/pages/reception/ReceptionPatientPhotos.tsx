import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, X, ZoomIn, ZoomOut, Search, ChevronLeft, ChevronRight,
  Trash2, Circle, RotateCcw, ImagePlus, Zap, SwitchCamera,
  VideoOff,
} from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// ── Persistent storage ──
const PHOTOS_KEY = 'adrine_patient_photos';

interface PatientPhoto {
  id: string;
  uhid: string;
  patientName: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  source: 'camera' | 'upload';
  markers: PhotoMarker[];
}

interface PhotoMarker {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
}

function loadPhotos(): PatientPhoto[] {
  try { return JSON.parse(localStorage.getItem(PHOTOS_KEY) || '[]'); } catch { return []; }
}
function persistPhotos(photos: PatientPhoto[]) {
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
}

const MARKER_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

// ── Camera modal ──
function CameraModal({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedCount, setCapturedCount] = useState(0);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setReady(false);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setReady(true);
      }
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : err?.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : `Camera error: ${err?.message ?? 'Unknown error'}`;
      setError(msg);
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);// eslint-disable-line

  const switchCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    await startCamera(next);
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !ready) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    setCapturedCount(c => c + 1);
    onCapture(dataUrl);
    toast.success('Photo captured!');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-black/80">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-white text-sm font-medium">Live Camera</p>
          {capturedCount > 0 && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
              {capturedCount} captured
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Switch camera (front/back) */}
          <button
            onClick={switchCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
            title={facingMode === 'environment' ? 'Switch to front camera' : 'Switch to rear camera'}
          >
            <SwitchCamera className="w-4 h-4" />
            {facingMode === 'environment' ? 'Rear' : 'Front'}
          </button>
          <button
            onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onClose(); }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video feed */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {/* Flash overlay */}
        {flash && (
          <div className="absolute inset-0 bg-white z-10 pointer-events-none animate-ping" style={{ animationDuration: '0.15s', animationIterationCount: 1 }} />
        )}

        {error ? (
          <div className="flex flex-col items-center gap-4 text-center px-8">
            <VideoOff className="w-16 h-16 text-white/30" />
            <p className="text-white/70 text-sm">{error}</p>
            <p className="text-white/40 text-xs">
              On Chrome: click the camera icon in the address bar and allow access.<br />
              On Safari (iOS): go to Settings → Safari → Camera → Allow.
            </p>
            <Button variant="outline" onClick={() => startCamera(facingMode)} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`max-h-full max-w-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        )}

        {/* Guide overlay (subtle crosshair) */}
        {ready && !error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-white/20 rounded-2xl" />
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 bg-black/80 px-4 py-6 flex items-center justify-center gap-8">
        {/* Tip text */}
        <p className="text-white/40 text-xs hidden sm:block">
          Click capture for each angle
        </p>

        {/* Shutter button */}
        <button
          onClick={capture}
          disabled={!ready || !!error}
          className="w-20 h-20 rounded-full border-4 border-white bg-white/10 hover:bg-white/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <div className="w-14 h-14 rounded-full bg-white" />
        </button>

        <p className="text-white/40 text-xs hidden sm:block">
          {capturedCount > 0 ? `${capturedCount} photo${capturedCount > 1 ? 's' : ''} saved` : 'Photos save instantly'}
        </p>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}

// ── Main page ──
export default function ReceptionPatientPhotos() {
  const { patients } = useHospital();
  const [search, setSearch] = useState('');
  const [selectedUhid, setSelectedUhid] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PatientPhoto[]>(loadPhotos);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [markerColor, setMarkerColor] = useState(MARKER_COLORS[0]);
  const [markerMode, setMarkerMode] = useState(false);
  const [markerLabel, setMarkerLabel] = useState('');
  const [zoom, setZoom] = useState(1);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return patients.slice(0, 30);
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    ).slice(0, 30);
  }, [patients, search]);

  const selectedPatient = patients.find(p => p.uhid === selectedUhid);
  const patientPhotos = photos.filter(ph => ph.uhid === selectedUhid);
  const currentLightboxPhoto = lightboxIdx !== null ? patientPhotos[lightboxIdx] : null;

  // ── Add photo from any source ──
  const addPhoto = useCallback((url: string, source: 'camera' | 'upload') => {
    if (!selectedUhid || !selectedPatient) return;
    const photo: PatientPhoto = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      uhid: selectedUhid,
      patientName: selectedPatient.name,
      url,
      uploadedAt: new Date().toLocaleString('en-IN'),
      uploadedBy: 'Reception',
      source,
      markers: [],
    };
    setPhotos(prev => {
      const updated = [...prev, photo];
      persistPhotos(updated);
      return updated;
    });
  }, [selectedUhid, selectedPatient]);

  // ── Handle camera capture ──
  const handleCameraCapture = useCallback((dataUrl: string) => {
    addPhoto(dataUrl, 'camera');
  }, [addPhoto]);

  // ── Handle file upload ──
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || !selectedUhid || !selectedPatient) return;
    let done = 0;
    const total = Array.from(files).filter(f => f.type.startsWith('image/')).length;
    if (total === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        addPhoto(e.target?.result as string, 'upload');
        done++;
        if (done === total) {
          toast.success(`${total} photo${total > 1 ? 's' : ''} uploaded for ${selectedPatient.name}`);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [addPhoto, selectedUhid, selectedPatient]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== id);
      persistPhotos(updated);
      return updated;
    });
    if (lightboxIdx !== null) setLightboxIdx(null);
    toast.success('Photo deleted');
  };

  // ── Marker handlers ──
  const addMarker = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!markerMode || !currentLightboxPhoto || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const marker: PhotoMarker = { id: Date.now().toString(), x, y, color: markerColor, label: markerLabel || 'Mark' };
    setPhotos(prev => {
      const updated = prev.map(p =>
        p.id === currentLightboxPhoto.id ? { ...p, markers: [...p.markers, marker] } : p
      );
      persistPhotos(updated);
      return updated;
    });
  };

  const removeMarker = (photoId: string, markerId: string) => {
    setPhotos(prev => {
      const updated = prev.map(p =>
        p.id === photoId ? { ...p, markers: p.markers.filter(m => m.id !== markerId) } : p
      );
      persistPhotos(updated);
      return updated;
    });
  };

  const clearAllMarkers = (photoId: string) => {
    setPhotos(prev => {
      const updated = prev.map(p => p.id === photoId ? { ...p, markers: [] } : p);
      persistPhotos(updated);
      return updated;
    });
    toast.success('All markers cleared');
  };

  return (
    <div className="space-y-6">
      {/* Camera modal */}
      <AnimatePresence>
        {showCamera && (
          <CameraModal
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pre-Consultation Photos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture or upload patient photos before the appointment — doctors see them instantly in their module
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Patient list */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 text-sm" placeholder="Search patient…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
            {filteredPatients.map(p => {
              const photoCount = photos.filter(ph => ph.uhid === p.uhid).length;
              return (
                <button
                  key={p.uhid}
                  onClick={() => { setSelectedUhid(p.uhid); setLightboxIdx(null); }}
                  className={`w-full text-left rounded-lg border p-3 transition-all flex items-center gap-3 ${
                    selectedUhid === p.uhid
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-accent/30'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    selectedUhid === p.uhid ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.uhid}</p>
                  </div>
                  {photoCount > 0 && (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {photoCount} 📷
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Photo area */}
        <div className="space-y-4">
          {!selectedUhid ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10 flex flex-col items-center justify-center min-h-[400px] text-center gap-2">
              <Camera className="w-10 h-10 text-muted-foreground opacity-30 mb-1" />
              <p className="text-sm text-muted-foreground">Select a patient to capture or upload photos</p>
            </div>
          ) : (
            <>
              {/* Action bar */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-base font-semibold">{selectedPatient?.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedUhid} · {patientPhotos.length} photo{patientPhotos.length !== 1 ? 's' : ''}
                    {patientPhotos.filter(p => p.source === 'camera').length > 0 && (
                      <span className="ml-2 text-emerald-600">
                        📷 {patientPhotos.filter(p => p.source === 'camera').length} from camera
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* Live camera button */}
                  <Button
                    onClick={() => setShowCamera(true)}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Camera className="w-4 h-4" /> Open Camera
                  </Button>

                  {/* Mobile native camera (fallback) */}
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => mobileInputRef.current?.click()}
                    title="Use device camera directly (mobile)"
                  >
                    <Zap className="w-4 h-4" /> Quick Snap
                  </Button>

                  {/* File upload */}
                  <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4" /> Upload
                  </Button>
                </div>
              </div>

              {/* Camera description */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>Open Camera</strong> — live webcam/phone camera with capture button (front & rear switching) ·{' '}
                  <strong>Quick Snap</strong> — opens device camera app directly (best on mobile) ·{' '}
                  <strong>Upload</strong> — select files from gallery or folder
                </span>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center ${
                  dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/20'
                }`}
              >
                <ImagePlus className={`w-8 h-8 mb-2 transition-colors ${dragging ? 'text-primary' : 'text-muted-foreground opacity-40'}`} />
                <p className="text-sm font-medium text-muted-foreground">
                  {dragging ? 'Drop photos here…' : 'Drag & drop photos or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Multiple files supported · JPG, PNG, WEBP, HEIC</p>
              </div>

              {/* Hidden inputs */}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
              {/* Mobile native camera (capture attribute) */}
              <input ref={mobileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />

              {/* Photo grid */}
              {patientPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {patientPhotos.map((photo, idx) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative rounded-xl overflow-hidden border bg-muted aspect-square cursor-pointer"
                      onClick={() => setLightboxIdx(idx)}
                    >
                      <img src={photo.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />

                      {/* Source badge */}
                      <div className={`absolute top-1.5 left-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                        photo.source === 'camera'
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-black/60 text-white/80'
                      }`}>
                        {photo.source === 'camera' ? '📷 Camera' : '📁 Upload'}
                      </div>

                      {/* Marker dots */}
                      {photo.markers.map(m => (
                        <div key={m.id} className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md"
                          style={{ left: `${m.x}%`, top: `${m.y}%`, backgroundColor: m.color, transform: 'translate(-50%,-50%)' }} />
                      ))}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <div className="flex-1">
                          <p className="text-[10px] text-white/80">{photo.uploadedAt}</p>
                          {photo.markers.length > 0 && (
                            <p className="text-[10px] text-white/70">{photo.markers.length} marker{photo.markers.length > 1 ? 's' : ''}</p>
                          )}
                        </div>
                        <button onClick={e => { e.stopPropagation(); deletePhoto(photo.id); }}
                          className="p-1 rounded-full bg-destructive/80 text-white hover:bg-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Lightbox with annotation tools ── */}
      <AnimatePresence>
        {currentLightboxPhoto && lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={() => { setLightboxIdx(null); setMarkerMode(false); }}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0 flex-wrap gap-2" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-medium">{currentLightboxPhoto.patientName}</p>
                <span className="text-white/50 text-xs">{lightboxIdx + 1} / {patientPhotos.length}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  currentLightboxPhoto.source === 'camera' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'
                }`}>
                  {currentLightboxPhoto.source === 'camera' ? '📷 Camera' : '📁 Upload'}
                </span>
                <span className="text-white/40 text-xs">{currentLightboxPhoto.uploadedAt}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-white/60 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"><ZoomIn className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button onClick={() => setMarkerMode(m => !m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${markerMode ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  <Circle className="w-3.5 h-3.5" /> {markerMode ? 'Marking ON' : 'Mark'}
                </button>
                {currentLightboxPhoto.markers.length > 0 && (
                  <button onClick={() => clearAllMarkers(currentLightboxPhoto.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-destructive/60 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Clear Marks
                  </button>
                )}
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button onClick={() => { setLightboxIdx(null); setMarkerMode(false); setZoom(1); }} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Marker color / label row */}
            <AnimatePresence>
              {markerMode && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-3 px-4 pb-3 shrink-0 flex-wrap" onClick={e => e.stopPropagation()}>
                  <span className="text-white/60 text-xs">Color:</span>
                  {MARKER_COLORS.map(c => (
                    <button key={c} onClick={() => setMarkerColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${markerColor === c ? 'border-white scale-125' : 'border-white/30'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                  <input className="ml-2 bg-white/10 text-white text-xs rounded-lg px-2 py-1 border border-white/20 focus:outline-none w-32"
                    placeholder="Marker label…" value={markerLabel} onChange={e => setMarkerLabel(e.target.value)} />
                  <span className="text-white/40 text-xs">Click on the image to place a marker</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center overflow-hidden relative" onClick={e => e.stopPropagation()}>
              {lightboxIdx > 0 && (
                <button onClick={() => setLightboxIdx(lightboxIdx - 1)} className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {lightboxIdx < patientPhotos.length - 1 && (
                <button onClick={() => setLightboxIdx(lightboxIdx + 1)} className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10">
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s' }}>
                <img
                  ref={imgRef}
                  src={currentLightboxPhoto.url}
                  alt=""
                  className={`max-h-[70vh] max-w-full object-contain rounded-lg select-none ${markerMode ? 'cursor-crosshair' : 'cursor-default'}`}
                  onClick={markerMode ? addMarker : undefined}
                  draggable={false}
                />
                {currentLightboxPhoto.markers.map(m => (
                  <div key={m.id} className="absolute group"
                    style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%,-50%)' }}>
                    <div className="w-5 h-5 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
                      style={{ backgroundColor: m.color }}
                      onClick={e => { e.stopPropagation(); removeMarker(currentLightboxPhoto.id, m.id); }} />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {m.label} · click to remove
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Marker legend */}
            {currentLightboxPhoto.markers.length > 0 && (
              <div className="px-4 py-3 flex items-center gap-3 flex-wrap" onClick={e => e.stopPropagation()}>
                <span className="text-white/50 text-xs">Markers:</span>
                {currentLightboxPhoto.markers.map(m => (
                  <span key={m.id} className="flex items-center gap-1.5 text-xs text-white/70">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: m.color }} />
                    {m.label}
                    <button onClick={() => removeMarker(currentLightboxPhoto.id, m.id)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
