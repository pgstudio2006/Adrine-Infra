import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useBillingPackagesData } from "@/hooks/useBillingDeptData";
import { BillingDeptShell } from "@/components/billing/BillingDeptShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Edit, Package, IndianRupee, CheckCircle, AlertTriangle } from "lucide-react";

interface PackageService {
  service: string;
  dept: string;
  included: boolean;
}

interface BillingPackage {
  id: string;
  name: string;
  category: string;
  price: number;
  validity: string;
  services: PackageService[];
  active: boolean;
  usageCount: number;
}

interface RateCard {
  id: string;
  name: string;
  type: "General" | "Insurance" | "Corporate" | "Government";
  services: number;
  modifier: string;
  active: boolean;
}

const packages: BillingPackage[] = [
  {
    id: "PKG-001", name: "Appendectomy Package", category: "Surgery", price: 45000, validity: "5 days stay", active: true, usageCount: 12,
    services: [
      { service: "General Ward — 5 days", dept: "IPD", included: true },
      { service: "Appendectomy Surgery", dept: "Surgery", included: true },
      { service: "General Anesthesia", dept: "OT", included: true },
      { service: "Pre-op investigations", dept: "Laboratory", included: true },
      { service: "Post-op medications — 5 days", dept: "Pharmacy", included: true },
      { service: "Nursing care", dept: "Nursing", included: true },
      { service: "X-ray Chest PA (if needed)", dept: "Radiology", included: false },
    ],
  },
  {
    id: "PKG-002", name: "Normal Delivery Package", category: "Maternity", price: 35000, validity: "3 days stay", active: true, usageCount: 28,
    services: [
      { service: "Maternity Ward — 3 days", dept: "IPD", included: true },
      { service: "Normal Delivery charges", dept: "OB-GYN", included: true },
      { service: "Routine lab investigations", dept: "Laboratory", included: true },
      { service: "Medications — 3 days", dept: "Pharmacy", included: true },
      { service: "Newborn care — basic", dept: "Pediatrics", included: true },
    ],
  },
  {
    id: "PKG-003", name: "Premium Health Checkup", category: "Preventive", price: 5999, validity: "1 day", active: true, usageCount: 85,
    services: [
      { service: "Complete Blood Count", dept: "Laboratory", included: true },
      { service: "Lipid Profile", dept: "Laboratory", included: true },
      { service: "Liver Function Test", dept: "Laboratory", included: true },
      { service: "Kidney Function Test", dept: "Laboratory", included: true },
      { service: "Thyroid Profile", dept: "Laboratory", included: true },
      { service: "X-ray Chest PA", dept: "Radiology", included: true },
      { service: "Ultrasound Abdomen", dept: "Radiology", included: true },
      { service: "ECG", dept: "Cardiology", included: true },
      { service: "Doctor Consultation", dept: "Medicine", included: true },
    ],
  },
  {
    id: "PKG-004", name: "Knee Replacement Package", category: "Surgery", price: 250000, validity: "7 days stay", active: true, usageCount: 5,
    services: [
      { service: "Semi-Private Room — 7 days", dept: "IPD", included: true },
      { service: "Total Knee Replacement", dept: "Orthopedics", included: true },
      { service: "Anesthesia — Spinal/General", dept: "OT", included: true },
      { service: "Implant — Standard", dept: "OT", included: true },
      { service: "Physiotherapy — 7 sessions", dept: "Rehab", included: true },
      { service: "Medications", dept: "Pharmacy", included: true },
      { service: "Lab investigations", dept: "Laboratory", included: true },
    ],
  },
];

const rateCards: RateCard[] = [
  { id: "RC-001", name: "General Rate Card", type: "General", services: 245, modifier: "Base price (1x)", active: true },
  { id: "RC-002", name: "Insurance Rate Card", type: "Insurance", services: 245, modifier: "CGHS/NABH rates", active: true },
  { id: "RC-003", name: "Corporate — TCS", type: "Corporate", services: 180, modifier: "15% discount on base", active: true },
  { id: "RC-004", name: "Corporate — Infosys", type: "Corporate", services: 180, modifier: "12% discount on base", active: true },
  { id: "RC-005", name: "ECHS / Government", type: "Government", services: 200, modifier: "Government schedule rates", active: true },
  { id: "RC-006", name: "Ayushman Bharat", type: "Government", services: 150, modifier: "PMJAY package rates", active: true },
];

export default function BillingPackages() {
  const [selected, setSelected] = useState<BillingPackage | null>(null);
  const [showAddPkg, setShowAddPkg] = useState(false);
  const { data: platformData, platformOn } = useBillingPackagesData();

  const packageRows = useMemo((): BillingPackage[] => {
    if (!platformOn || !platformData?.packages?.length) return packages;
    return (platformData.packages as {
      code: string;
      name: string;
      category: string;
      price: number;
      validity: string;
      active: boolean;
      services: PackageService[];
    }[]).map((p) => ({
      id: p.code,
      name: p.name,
      category: p.category,
      price: p.price,
      validity: p.validity,
      services: p.services,
      active: p.active,
      usageCount: 0,
    }));
  }, [platformOn, platformData]);

  return (
    <BillingDeptShell
      title="Packages & Rate Cards"
      subtitle="Treatment packages, rate card management, and pricing tiers"
      showPlatformStrip={false}
    >
      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Treatment Packages</TabsTrigger>
          <TabsTrigger value="ratecards">Rate Cards</TabsTrigger>
        </TabsList>

        {/* Packages */}
        <TabsContent value="packages" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddPkg(true)}><Plus className="h-4 w-4 mr-2" /> Create Package</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packageRows.map(pkg => (
              <Card key={pkg.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(pkg)}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <span className="font-medium text-foreground">{pkg.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{pkg.category} • {pkg.validity}</p>
                    </div>
                    <Badge variant={pkg.active ? "default" : "secondary"} className="text-xs">{pkg.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">₹{pkg.price.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{pkg.services.length} services • {pkg.usageCount} used</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pkg.services.filter(s => s.included).slice(0, 4).map(s => (
                      <Badge key={s.service} variant="outline" className="text-xs">{s.dept}</Badge>
                    ))}
                    {pkg.services.filter(s => s.included).length > 4 && <Badge variant="outline" className="text-xs">+{pkg.services.filter(s => s.included).length - 4} more</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Rate Cards */}
        <TabsContent value="ratecards" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Rate Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rate Card</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Pricing Rule</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateCards.map(rc => (
                    <TableRow key={rc.id}>
                      <TableCell className="font-medium">{rc.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{rc.type}</Badge></TableCell>
                      <TableCell>{rc.services}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{rc.modifier}</TableCell>
                      <TableCell><Badge variant={rc.active ? "default" : "secondary"} className="text-xs">{rc.active ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Package Detail */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> {selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Category:</span> {selected.category}</div>
                  <div><span className="text-muted-foreground">Validity:</span> {selected.validity}</div>
                  <div><span className="text-muted-foreground">Price:</span> <span className="font-bold">₹{selected.price.toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Times Used:</span> {selected.usageCount}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Included Services</p>
                  <div className="space-y-1">
                    {selected.services.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${s.included ? "text-green-600" : "text-muted-foreground"}`} />
                          <span className={s.included ? "text-foreground" : "text-muted-foreground line-through"}>{s.service}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{s.dept}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border border-border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-muted-foreground">Services not included in the package will be billed separately at applicable rate card prices.</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Package */}
      <Dialog open={showAddPkg} onOpenChange={setShowAddPkg}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Treatment Package</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Package Name</Label><Input placeholder="e.g. Appendectomy Package" /></div>
              <div><Label>Category</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="surgery">Surgery</SelectItem>
                    <SelectItem value="maternity">Maternity</SelectItem>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Price (₹)</Label><Input type="number" placeholder="0" /></div>
              <div><Label>Validity / Stay Duration</Label><Input placeholder="e.g. 5 days stay" /></div>
            </div>
            <div><Label>Add Services</Label><Input placeholder="Search and add services..." /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddPkg(false)}>Cancel</Button>
              <Button onClick={() => { setShowAddPkg(false); toast.success("Package created successfully"); }}>Create Package</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </BillingDeptShell>
  );
}
