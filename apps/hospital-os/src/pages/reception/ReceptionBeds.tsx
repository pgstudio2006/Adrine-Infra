import { useMemo, useState, useEffect, useCallback } from "react";

import { BedDouble, Search, UserPlus, X } from "lucide-react";

import { useHospital } from "@/stores/hospitalStore";
import { useClinicalPlatformListSync } from "@/hooks/useClinicalPlatformListSync";

import { canUseBedRuntime, platformListBeds, type PlatformBed } from "@/runtime/bed-runtime";

import { canUseIpdRuntime, platformListActiveIpdCensus, type PlatformIpdCensusRow } from "@/runtime/ipd-runtime";

import { AppSelect } from "@/components/ui/app-select";

import { Badge } from "@/components/ui/badge";



interface BedSlot {

  ward: string;

  bedNo: string;

  floor: string;

  platformBedId?: string;

  platformState?: string;

}



const BED_TEMPLATE: BedSlot[] = [

  ...Array.from({ length: 12 }, (_, index) => ({ ward: "General Ward", bedNo: `GW-${String(index + 1).padStart(2, "0")}`, floor: "Ground Floor" })),

  ...Array.from({ length: 6 }, (_, index) => ({ ward: "ICU", bedNo: `ICU-${String(index + 1).padStart(2, "0")}`, floor: "Second Floor" })),

  ...Array.from({ length: 6 }, (_, index) => ({ ward: "Maternity Ward", bedNo: `MW-${String(index + 1).padStart(2, "0")}`, floor: "Third Floor" })),

  ...Array.from({ length: 6 }, (_, index) => ({ ward: "Surgical Ward", bedNo: `SW-${String(index + 1).padStart(2, "0")}`, floor: "Second Floor" })),

];



function inferFloor(ward: string) {

  if (ward.toLowerCase().includes("icu")) return "Second Floor";

  if (ward.toLowerCase().includes("maternity") || ward.toLowerCase().includes("newborn")) return "Third Floor";

  if (ward.toLowerCase().includes("surgical") || ward.toLowerCase().includes("cardiac") || ward.toLowerCase().includes("trauma")) return "Second Floor";

  return "Ground Floor";

}



function mapPlatformBed(b: PlatformBed): BedSlot {

  const ward = b.bedUnit?.name ?? "Unknown Ward";

  return {

    ward,

    bedNo: b.label,

    floor: inferFloor(ward),

    platformBedId: b.id,

    platformState: b.state,

  };

}



export default function ReceptionBeds() {

  const { admissions, assignAdmissionBed } = useHospital();
  useClinicalPlatformListSync({ ipd: true, departmentWorklists: false });

  const [search, setSearch] = useState("");

  const [selectedWard, setSelectedWard] = useState<string>("all");

  const [selectedBedNo, setSelectedBedNo] = useState<string | null>(null);

  const [allocationAdmissionId, setAllocationAdmissionId] = useState("");

  const [platformBeds, setPlatformBeds] = useState<PlatformBed[]>([]);

  const [platformCensus, setPlatformCensus] = useState<PlatformIpdCensusRow[]>([]);



  const usePlatformGrid = canUseBedRuntime();



  const refreshPlatformInventory = useCallback(async () => {

    if (!usePlatformGrid) {

      setPlatformBeds([]);

      setPlatformCensus([]);

      return;

    }

    try {

      const [beds, census] = await Promise.all([

        platformListBeds(),

        canUseIpdRuntime() ? platformListActiveIpdCensus() : Promise.resolve([]),

      ]);

      setPlatformBeds(beds);

      setPlatformCensus(census);

    } catch {

      /* keep last good snapshot */

    }

  }, [usePlatformGrid]);



  useEffect(() => {

    void refreshPlatformInventory();

    if (!usePlatformGrid) return;

    const timer = setInterval(() => void refreshPlatformInventory(), 25_000);

    return () => clearInterval(timer);

  }, [refreshPlatformInventory, usePlatformGrid]);



  const activeAdmissions = useMemo(

    () => admissions.filter((admission) => admission.status !== "discharged"),

    [admissions],

  );



  const censusByBedLabel = useMemo(() => {

    const map = new Map<string, PlatformIpdCensusRow>();

    platformCensus.forEach((row) => {

      const label = row.bed?.label?.trim().toLowerCase();

      if (label) map.set(label, row);

    });

    return map;

  }, [platformCensus]);



  const bedSlots = useMemo(() => {

    if (usePlatformGrid && platformBeds.length > 0) {

      return platformBeds.map(mapPlatformBed).sort((left, right) => {

        if (left.ward !== right.ward) return left.ward.localeCompare(right.ward);

        return left.bedNo.localeCompare(right.bedNo);

      });

    }



    const map = new Map<string, BedSlot>();

    BED_TEMPLATE.forEach((slot) => map.set(slot.bedNo, slot));



    activeAdmissions.forEach((admission) => {

      if (!map.has(admission.bed)) {

        map.set(admission.bed, {

          ward: admission.ward,

          bedNo: admission.bed,

          floor: inferFloor(admission.ward),

        });

      }

    });



    return Array.from(map.values()).sort((left, right) => {

      if (left.ward !== right.ward) return left.ward.localeCompare(right.ward);

      return left.bedNo.localeCompare(right.bedNo);

    });

  }, [activeAdmissions, platformBeds, usePlatformGrid]);



  const enrichedBeds = useMemo(() => {

    return bedSlots.map((slot) => {

      const censusRow = censusByBedLabel.get(slot.bedNo.trim().toLowerCase());

      const occupantFromCensus = censusRow

        ? activeAdmissions.find(

            (a) =>

              a.platformAdmissionId === censusRow.id

              || a.bed === slot.bedNo

              || a.uhid === censusRow.patient?.mrn,

          ) ?? (censusRow.patient

            ? {

                id: censusRow.externalRef ?? censusRow.id,

                uhid: censusRow.patient.mrn ?? censusRow.patient.id.slice(0, 8),

                patientName: censusRow.patient.fullName,

                attendingDoctor: "—",

                status: censusRow.state,

              }

            : undefined)

        : undefined;



      const occupant =

        occupantFromCensus

        ?? activeAdmissions.find((admission) => admission.bed === slot.bedNo);



      const platformOccupied =

        slot.platformState === "occupied" || slot.platformState === "reserved";

      const status =

        occupant || platformOccupied ? ("occupied" as const) : ("available" as const);



      return {

        ...slot,

        occupant,

        status,

      };

    });

  }, [activeAdmissions, bedSlots, censusByBedLabel]);



  const filteredBeds = useMemo(() => {

    const query = search.toLowerCase();

    return enrichedBeds.filter((bed) => {

      const wardMatches = selectedWard === "all" || bed.ward === selectedWard;

      const searchMatches =

        bed.bedNo.toLowerCase().includes(query)

        || bed.ward.toLowerCase().includes(query)

        || bed.occupant?.patientName.toLowerCase().includes(query)

        || bed.occupant?.uhid.toLowerCase().includes(query);

      return wardMatches && searchMatches;

    });

  }, [enrichedBeds, search, selectedWard]);



  const wards = useMemo(() => ["all", ...Array.from(new Set(enrichedBeds.map((bed) => bed.ward)))], [enrichedBeds]);



  const summary = {

    total: enrichedBeds.length,

    occupied: enrichedBeds.filter((bed) => bed.status === "occupied").length,

    available: enrichedBeds.filter((bed) => bed.status === "available").length,

    occupancy: enrichedBeds.length > 0

      ? Math.round((enrichedBeds.filter((bed) => bed.status === "occupied").length / enrichedBeds.length) * 100)

      : 0,

  };



  const selectedBed = filteredBeds.find((bed) => bed.bedNo === selectedBedNo) || null;



  const allocatableAdmissions = useMemo(() => {

    if (!selectedBed || selectedBed.status !== "available") {

      return [];

    }



    return activeAdmissions.filter((admission) => admission.bed !== selectedBed.bedNo);

  }, [activeAdmissions, selectedBed]);



  const handleAllocateBed = () => {

    if (!selectedBed || selectedBed.status !== "available" || !allocationAdmissionId) {

      return;

    }



    assignAdmissionBed(allocationAdmissionId, selectedBed.ward, selectedBed.bedNo);

    setAllocationAdmissionId("");

    setSelectedBedNo(null);

  };



  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold tracking-tight">Bed Management</h1>

          <p className="text-sm text-muted-foreground mt-1">

            {usePlatformGrid && platformBeds.length > 0

              ? "Bed inventory from platform · census from branch active admissions"

              : "Real-time bed availability from local admissions (platform inventory when runtime on)"}

          </p>

        </div>

        {usePlatformGrid && platformBeds.length > 0 ? (

          <Badge variant="outline" className="text-xs">Platform inventory</Badge>

        ) : null}

      </div>



      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        <div className="rounded-xl border bg-card p-4 text-center">

          <p className="text-xl font-bold">{summary.total}</p>

          <p className="text-xs text-muted-foreground">Total Beds</p>

        </div>

        <div className="rounded-xl border bg-card p-4 text-center">

          <p className="text-xl font-bold">{summary.occupied}</p>

          <p className="text-xs text-muted-foreground">Occupied</p>

        </div>

        <div className="rounded-xl border bg-card p-4 text-center">

          <p className="text-xl font-bold">{summary.available}</p>

          <p className="text-xs text-muted-foreground">Available</p>

        </div>

        <div className="rounded-xl border bg-card p-4 text-center">

          <p className="text-xl font-bold">{summary.occupancy}%</p>

          <p className="text-xs text-muted-foreground">Occupancy</p>

        </div>

      </div>



      <div className="flex items-center gap-3 flex-wrap">

        <div className="relative flex-1 min-w-[280px] max-w-xl">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <input

            value={search}

            onChange={(event) => setSearch(event.target.value)}

            className="w-full pl-10 pr-4 py-2 rounded-xl border bg-card text-sm"

            placeholder="Search by bed, ward, patient, or UHID..."

          />

        </div>



        <div className="flex gap-1.5 overflow-x-auto">

          {wards.map((ward) => (

            <button

              key={ward}

              onClick={() => setSelectedWard(ward)}

              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedWard === ward ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}

            >

              {ward === "all" ? "All Wards" : ward}

            </button>

          ))}

        </div>

      </div>



      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

        {filteredBeds.map((bed) => (

          <button

            key={bed.bedNo}

            onClick={() => {

              setSelectedBedNo(bed.bedNo);

              setAllocationAdmissionId("");

            }}

            className={`rounded-xl border p-3 text-left transition-all hover:shadow-md ${bed.status === "occupied" ? "bg-destructive/5 border-destructive/30" : "bg-success/5 border-success/30"}`}

          >

            <div className="flex items-center justify-between mb-2">

              <p className="text-sm font-semibold">{bed.bedNo}</p>

              <BedDouble className="w-4 h-4 text-muted-foreground" />

            </div>

            <p className="text-xs text-muted-foreground">{bed.ward}</p>

            <p className="text-xs text-muted-foreground">{bed.floor}</p>

            {bed.occupant ? (

              <div className="mt-2">

                <p className="text-xs font-medium truncate">{bed.occupant.patientName}</p>

                <p className="text-[11px] text-muted-foreground truncate">{bed.occupant.id} · {bed.occupant.uhid}</p>

              </div>

            ) : (

              <p className="mt-2 text-xs text-success font-medium">Available</p>

            )}

          </button>

        ))}

      </div>



      {selectedBed && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedBedNo(null)}>

          <div className="bg-card border rounded-xl w-full max-w-lg p-6 space-y-4" onClick={(event) => event.stopPropagation()}>

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-lg font-bold">{selectedBed.bedNo}</h2>

                <p className="text-xs text-muted-foreground">{selectedBed.ward} · {selectedBed.floor}</p>

              </div>

              <button onClick={() => setSelectedBedNo(null)} className="p-1 rounded hover:bg-accent"><X className="w-5 h-5" /></button>

            </div>



            {selectedBed.occupant ? (

              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2 text-sm">

                <p><span className="text-muted-foreground">Patient:</span> {selectedBed.occupant.patientName}</p>

                <p><span className="text-muted-foreground">UHID:</span> {selectedBed.occupant.uhid}</p>

                <p><span className="text-muted-foreground">Admission:</span> {selectedBed.occupant.id}</p>

                <p><span className="text-muted-foreground">Doctor:</span> {selectedBed.occupant.attendingDoctor}</p>

                <p><span className="text-muted-foreground">Status:</span> {selectedBed.occupant.status}</p>

              </div>

            ) : (

              <div className="space-y-3">

                <p className="text-sm font-semibold flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> Room Allocation View</p>

                <AppSelect

                  value={allocationAdmissionId || undefined}

                  onValueChange={setAllocationAdmissionId}

                  placeholder="Select admission to allocate"

                  options={allocatableAdmissions.map((admission) => ({

                    value: admission.id,

                    label: `${admission.patientName} (${admission.id}) · Current: ${admission.ward} ${admission.bed}`,

                  }))}

                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"

                />

                <button

                  onClick={handleAllocateBed}

                  disabled={!allocationAdmissionId}

                  className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"

                >

                  Assign Bed

                </button>

                {allocatableAdmissions.length === 0 && (

                  <p className="text-xs text-muted-foreground">No active admissions available for reassignment.</p>

                )}

              </div>

            )}

          </div>

        </div>

      )}

    </div>

  );

}

