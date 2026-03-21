import { createContext, useContext, useState, type ReactNode } from "react";
import type { SimMiner, SimAlertEntry, DangerZone } from "@/components/LiveMinerSimulation";

export interface SimDrone {
    id: string;
    name: string;
    color: string;
    lat: number;
    lng: number;
    status: "patrolling" | "emergency" | "idle" | "returning";
}

interface SimContextValue {
    simMiners: SimMiner[];
    simAlerts: SimAlertEntry[];
    simZones: DangerZone[];
    simDrones: SimDrone[];
    setSimMiners: (m: SimMiner[]) => void;
    setSimAlerts: (a: SimAlertEntry[]) => void;
    setSimZones: (z: DangerZone[]) => void;
    setSimDrones: (d: SimDrone[]) => void;
}

const SimContext = createContext<SimContextValue>({
    simMiners: [], simAlerts: [], simZones: [], simDrones: [],
    setSimMiners: () => { }, setSimAlerts: () => { }, setSimZones: () => { }, setSimDrones: () => { },
});

export function SimProvider({ children }: { children: ReactNode }) {
    const [simMiners, setSimMiners] = useState<SimMiner[]>([]);
    const [simAlerts, setSimAlerts] = useState<SimAlertEntry[]>([]);
    const [simZones, setSimZones] = useState<DangerZone[]>([]);
    const [simDrones, setSimDrones] = useState<SimDrone[]>([]);

    return (
        <SimContext.Provider value={{ simMiners, simAlerts, simZones, simDrones, setSimMiners, setSimAlerts, setSimZones, setSimDrones }}>
            {children}
        </SimContext.Provider>
    );
}

export function useSimContext() {
    return useContext(SimContext);
}
