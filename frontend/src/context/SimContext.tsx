import { createContext, useContext, useState, type ReactNode } from "react";
import type { SimMiner, SimAlertEntry, DangerZone } from "@/components/LiveMinerSimulation";

interface SimContextValue {
    simMiners: SimMiner[];
    simAlerts: SimAlertEntry[];
    simZones: DangerZone[];
    setSimMiners: (m: SimMiner[]) => void;
    setSimAlerts: (a: SimAlertEntry[]) => void;
    setSimZones: (z: DangerZone[]) => void;
}

const SimContext = createContext<SimContextValue>({
    simMiners: [], simAlerts: [], simZones: [],
    setSimMiners: () => { }, setSimAlerts: () => { }, setSimZones: () => { },
});

export function SimProvider({ children }: { children: ReactNode }) {
    const [simMiners, setSimMiners] = useState<SimMiner[]>([]);
    const [simAlerts, setSimAlerts] = useState<SimAlertEntry[]>([]);
    const [simZones, setSimZones] = useState<DangerZone[]>([]);

    return (
        <SimContext.Provider value={{ simMiners, simAlerts, simZones, setSimMiners, setSimAlerts, setSimZones }}>
            {children}
        </SimContext.Provider>
    );
}

export function useSimContext() {
    return useContext(SimContext);
}
