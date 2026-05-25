import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, MapPin, TrendingUp, Building2, Download, Navigation, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ahmedabad center
const CENTER: [number, number] = [23.0225, 72.5714];

interface AreaData {
  name: string;
  coords: [number, number];
  patients: number;
  growth: string;
  revenue: string;
  topService: string;
  density: 'high' | 'growing' | 'medium' | 'emerging';
}

const AREAS: AreaData[] = [
  { name: 'Satellite', coords: [23.0275, 72.5170], patients: 342, growth: '+18%', revenue: '₹2,90,700', topService: 'OPD Consult', density: 'high' },
  { name: 'Navrangpura', coords: [23.0370, 72.5610], patients: 312, growth: '+10%', revenue: '₹2,65,000', topService: 'Diagnostics', density: 'high' },
  { name: 'Vastrapur', coords: [23.0350, 72.5280], patients: 287, growth: '+12%', revenue: '₹3,45,000', topService: 'Cardiology', density: 'high' },
  { name: 'SG Highway', coords: [23.0410, 72.5050], patients: 245, growth: '+15%', revenue: '₹2,20,000', topService: 'General Med', density: 'high' },
  { name: 'Thaltej', coords: [23.0520, 72.4980], patients: 198, growth: '+20%', revenue: '₹2,78,000', topService: 'Orthopedics', density: 'growing' },
  { name: 'Maninagar', coords: [22.9950, 72.6000], patients: 134, growth: '+8%', revenue: '₹1,85,000', topService: 'Gen Surgery', density: 'medium' },
  { name: 'Bopal', coords: [23.0280, 72.4680], patients: 156, growth: '+45%', revenue: '₹1,42,000', topService: 'Pediatrics', density: 'growing' },
  { name: 'Chandkheda', coords: [23.1080, 72.5850], patients: 89, growth: '+22%', revenue: '₹78,000', topService: 'General Med', density: 'medium' },
  { name: 'Gota', coords: [23.1020, 72.5430], patients: 112, growth: '+30%', revenue: '₹92,000', topService: 'Pediatrics', density: 'growing' },
  { name: 'Narol', coords: [22.9620, 72.6150], patients: 45, growth: '+12%', revenue: '₹38,000', topService: 'Emergency', density: 'emerging' },
  { name: 'Vastral', coords: [22.9880, 72.6420], patients: 67, growth: '+15%', revenue: '₹55,000', topService: 'OPD Consult', density: 'medium' },
  { name: 'Hathijan', coords: [22.9400, 72.6500], patients: 28, growth: '+8%', revenue: '₹22,000', topService: 'General Med', density: 'emerging' },
];

const DENSITY_COLORS: Record<string, string> = {
  high: '#10b981',
  growing: '#3b82f6',
  medium: '#a855f7',
  emerging: '#f59e0b',
};

const DENSITY_SIZES: Record<string, number> = {
  high: 18,
  growing: 14,
  medium: 11,
  emerging: 8,
};

export default function AdminGeoIntelligence() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaData | null>(AREAS[0]);

  const totalPatients = AREAS.reduce((s, a) => s + a.patients, 0);
  const avgGrowth = Math.round(AREAS.reduce((s, a) => s + parseInt(a.growth), 0) / AREAS.length);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: CENTER,
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Catchment zone circles
    [3000, 7000, 15000].forEach((radius, i) => {
      L.circle(CENTER, {
        radius,
        color: 'hsl(217, 91%, 60%)',
        weight: 1,
        fillColor: 'hsl(217, 91%, 60%)',
        fillOpacity: i === 0 ? 0.08 : 0.03,
        dashArray: i > 0 ? '6 4' : undefined,
      }).addTo(map);
    });

    // Hospital marker
    const hospitalIcon = L.divIcon({
      html: `<div style="width:20px;height:20px;background:hsl(0,0%,8%);border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    L.marker(CENTER, { icon: hospitalIcon }).addTo(map).bindTooltip('Adrine Hospital', { permanent: false });

    // Area markers
    AREAS.forEach(area => {
      const size = DENSITY_SIZES[area.density];
      const color = DENSITY_COLORS[area.density];
      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"></div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker(area.coords, { icon }).addTo(map);
      marker.bindTooltip(`${area.name} — ${area.patients} patients`, { direction: 'top', offset: [0, -size / 2] });
      marker.on('click', () => setSelectedArea(area));
    });

    // City label
    L.marker(CENTER, {
      icon: L.divIcon({
        html: `<div style="font-size:11px;font-weight:600;color:hsl(0,0%,40%);letter-spacing:0.15em;text-transform:uppercase;white-space:nowrap;">AHMEDABAD</div>`,
        className: '',
        iconAnchor: [-15, 25],
      }),
    }).addTo(map);

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Patients', value: totalPatients.toLocaleString() },
          { icon: MapPin, label: 'Areas Covered', value: AREAS.length.toString() },
          { icon: TrendingUp, label: 'Avg Growth', value: `+${avgGrowth}%` },
          { icon: Building2, label: 'Primary Zone', value: 'West' },
        ].map(s => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <s.icon className="h-4 w-4 text-muted-foreground mb-2" strokeWidth={1.5} />
              <p className="text-xl font-bold tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-[320px_1fr] gap-0 border rounded-lg overflow-hidden bg-card" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
        {/* Left sidebar */}
        <div className="border-r flex flex-col">
          {/* Patient Distribution List */}
          <div className="p-4 border-b">
            <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Patient Distribution</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {AREAS.sort((a, b) => b.patients - a.patients).map(area => (
              <button
                key={area.name}
                onClick={() => {
                  setSelectedArea(area);
                  leafletMap.current?.flyTo(area.coords, 14, { duration: 0.8 });
                }}
                className={`w-full text-left px-4 py-3 border-b border-border/40 hover:bg-muted/50 transition-colors ${selectedArea?.name === area.name ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: DENSITY_COLORS[area.density] }}
                    />
                    <span className="text-sm font-medium">{area.name}</span>
                  </div>
                  <span className={`text-xs font-semibold ${selectedArea?.name === area.name ? 'text-primary-foreground/80' : 'text-success'}`}>
                    {area.growth}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ml-[18px] ${selectedArea?.name === area.name ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {area.patients} patients
                </p>
              </button>
            ))}
          </div>
          {/* Export button */}
          <div className="p-3 border-t">
            <Button variant="default" className="w-full" size="sm">
              <Download className="h-3.5 w-3.5 mr-2" /> Export Report
            </Button>
          </div>
        </div>

        {/* Map area */}
        <div className="relative">
          {/* Map title overlay */}
          <div className="absolute top-4 left-4 z-[1000] bg-card/95 backdrop-blur-sm border rounded-lg px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-foreground" />
              <div>
                <p className="text-sm font-bold">Ahmedabad Patient Intelligence</p>
                <p className="text-xs text-muted-foreground">Real-time geographic distribution</p>
              </div>
            </div>
          </div>

          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-card/95 backdrop-blur-sm border rounded-lg px-4 py-3 shadow-sm">
            <p className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground mb-2">Patient Density</p>
            <div className="space-y-1.5">
              {[
                { color: DENSITY_COLORS.high, label: 'High (200+ patients)' },
                { color: DENSITY_COLORS.growing, label: 'Growing (100–200)' },
                { color: DENSITY_COLORS.medium, label: 'Medium (50–100)' },
                { color: DENSITY_COLORS.emerging, label: 'Emerging (<50)' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected area panel */}
          <AnimatePresence>
            {selectedArea && (
              <motion.div
                key={selectedArea.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="absolute top-4 right-4 z-[1000] w-56 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold">{selectedArea.name}</h3>
                    <button onClick={() => setSelectedArea(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Patients', value: selectedArea.patients.toString() },
                      { label: 'Growth', value: selectedArea.growth, highlight: true },
                      { label: 'Revenue', value: selectedArea.revenue },
                      { label: 'Top Service', value: selectedArea.topService },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className={`font-semibold ${r.highlight ? 'text-success' : ''}`}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" size="sm">View Full Analytics</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Leaflet map */}
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
