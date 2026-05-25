import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin, Activity, TrendingUp, AlertTriangle, Filter, Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

const CENTER: [number, number] = [23.0225, 72.5714];

interface DiseaseCluster {
  name: string;
  coords: [number, number];
  diseases: { name: string; cases: number; trend: string }[];
  totalCases: number;
  density: 'high' | 'medium' | 'low';
}

const clusters: DiseaseCluster[] = [
  { name: 'Satellite', coords: [23.0275, 72.5170], totalCases: 342, density: 'high',
    diseases: [{ name: 'Diabetes', cases: 89, trend: '+12%' }, { name: 'Hypertension', cases: 112, trend: '+8%' }, { name: 'COPD', cases: 34, trend: '-2%' }] },
  { name: 'Navrangpura', coords: [23.0370, 72.5610], totalCases: 289, density: 'high',
    diseases: [{ name: 'Dengue', cases: 45, trend: '+65%' }, { name: 'Malaria', cases: 28, trend: '+15%' }, { name: 'Viral Fever', cases: 78, trend: '+30%' }] },
  { name: 'Vastrapur', coords: [23.0350, 72.5280], totalCases: 256, density: 'high',
    diseases: [{ name: 'CAD', cases: 67, trend: '+5%' }, { name: 'Diabetes', cases: 95, trend: '+10%' }, { name: 'CKD', cases: 32, trend: '+18%' }] },
  { name: 'Bopal', coords: [23.0280, 72.4680], totalCases: 156, density: 'medium',
    diseases: [{ name: 'Respiratory', cases: 45, trend: '+22%' }, { name: 'Allergies', cases: 52, trend: '+15%' }, { name: 'Asthma', cases: 28, trend: '+8%' }] },
  { name: 'Chandkheda', coords: [23.1080, 72.5850], totalCases: 89, density: 'low',
    diseases: [{ name: 'TB', cases: 18, trend: '-5%' }, { name: 'Anemia', cases: 34, trend: '+2%' }, { name: 'Malnutrition', cases: 12, trend: '-8%' }] },
  { name: 'Maninagar', coords: [22.9950, 72.6000], totalCases: 134, density: 'medium',
    diseases: [{ name: 'Gastro', cases: 45, trend: '+10%' }, { name: 'Hepatitis', cases: 22, trend: '-3%' }, { name: 'Typhoid', cases: 18, trend: '+5%' }] },
];

const seasonalData = [
  { month: 'Jan', dengue: 5, malaria: 3, respiratory: 45, gastro: 20 },
  { month: 'Feb', dengue: 3, malaria: 2, respiratory: 38, gastro: 18 },
  { month: 'Mar', dengue: 8, malaria: 5, respiratory: 30, gastro: 22 },
  { month: 'Apr', dengue: 12, malaria: 8, respiratory: 25, gastro: 28 },
  { month: 'May', dengue: 15, malaria: 12, respiratory: 20, gastro: 35 },
  { month: 'Jun', dengue: 35, malaria: 28, respiratory: 15, gastro: 42 },
  { month: 'Jul', dengue: 65, malaria: 45, respiratory: 12, gastro: 38 },
  { month: 'Aug', dengue: 78, malaria: 52, respiratory: 10, gastro: 30 },
];

const DENSITY_COLORS: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' };

export default function AdminDiseaseMapping() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<DiseaseCluster | null>(null);
  const [diseaseFilter, setDiseaseFilter] = useState('all');

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, { zoomControl: false }).setView(CENTER, 12);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
    }).addTo(map);

    clusters.forEach(cluster => {
      const color = DENSITY_COLORS[cluster.density];
      const size = cluster.density === 'high' ? 30 : cluster.density === 'medium' ? 22 : 16;

      const marker = L.circleMarker(cluster.coords, {
        radius: size,
        color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 2,
      }).addTo(map);

      const tooltip = `<div style="font-size:11px;min-width:140px">
        <strong>${cluster.name}</strong><br/>
        <span style="color:${color}">● ${cluster.totalCases} cases</span><br/>
        ${cluster.diseases.map(d => `${d.name}: ${d.cases} <span style="color:${d.trend.startsWith('+') ? '#ef4444' : '#22c55e'}">${d.trend}</span>`).join('<br/>')}
      </div>`;

      marker.bindPopup(tooltip);
      marker.on('click', () => setSelectedCluster(cluster));
    });

    // Heat circles
    clusters.forEach(c => {
      L.circle(c.coords, {
        radius: c.totalCases * 3,
        color: DENSITY_COLORS[c.density],
        fillColor: DENSITY_COLORS[c.density],
        fillOpacity: 0.08,
        weight: 0,
      }).addTo(map);
    });

    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  return (
    <div className="space-y-4">
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-destructive" /> Disease Cluster Mapping
          </h1>
          <p className="text-sm text-muted-foreground">Geospatial disease prevalence visualization & seasonal pattern analysis</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.success('Disease map report exported')}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </motion.div>

      {/* Alert Banner */}
      <motion.div {...fadeIn(1)}>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-xs font-medium text-destructive">Active Outbreak Alert</p>
              <p className="text-[10px] text-destructive/80">Dengue cases up 65% in Navrangpura zone. Seasonal surge detected in 3 localities.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <motion.div {...fadeIn(2)} className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div ref={mapRef} className="h-[400px] rounded-xl overflow-hidden" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Cluster Detail */}
        <motion.div {...fadeIn(3)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {selectedCluster ? selectedCluster.name : 'Select an Area'}
              </p>
              {selectedCluster ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedCluster.density === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {selectedCluster.density} density
                    </Badge>
                    <span className="text-xs font-bold">{selectedCluster.totalCases} total cases</span>
                  </div>
                  <div className="space-y-2">
                    {selectedCluster.diseases.map((d, i) => (
                      <div key={i} className="flex items-center justify-between border rounded-lg p-2">
                        <span className="text-xs font-medium">{d.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{d.cases}</span>
                          <span className={`text-[10px] font-medium ${d.trend.startsWith('+') ? 'text-destructive' : 'text-emerald-600'}`}>{d.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {clusters.map((c, i) => (
                    <button key={i} onClick={() => setSelectedCluster(c)}
                      className="w-full flex items-center justify-between border rounded-lg p-2.5 hover:bg-accent/50 transition-colors text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DENSITY_COLORS[c.density] }} />
                        <span className="text-xs font-medium">{c.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{c.totalCases}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Seasonal Pattern */}
      <motion.div {...fadeIn(4)}>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Seasonal Disease Pattern (Cases/Month)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={seasonalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))' }} />
                <Bar dataKey="dengue" fill="hsl(var(--destructive))" name="Dengue" radius={[2, 2, 0, 0]} />
                <Bar dataKey="malaria" fill="hsl(var(--primary))" name="Malaria" radius={[2, 2, 0, 0]} />
                <Bar dataKey="respiratory" fill="hsl(var(--muted-foreground))" name="Respiratory" radius={[2, 2, 0, 0]} />
                <Bar dataKey="gastro" fill="#f59e0b" name="Gastro" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
