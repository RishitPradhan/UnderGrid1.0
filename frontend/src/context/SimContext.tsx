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

export interface MinerVitals {
    heartRate: number;
    coreTemp: number;
    o2Level: number;
    fatigue: number;
    stressIndex: number;
}

export interface SeismicEvent {
    id: string;
    timestamp: string;
    epicenter: { lat: number; lng: number };
    magnitude: number;
    depth: number;
    type: string;
}

export interface HazardPoint {
    lat: number;
    lng: number;
    intensity: number;
}

export interface FanState {
    id: string;
    name: string;
    location: [number, number];
    active: boolean;
    reversed: boolean;
    rpm: number;
}

export interface EvacRoute {
    minerId: string;
    minerName: string;
    path: [number, number][];
}

interface SimContextValue {
    simMiners: SimMiner[];
    simAlerts: SimAlertEntry[];
    simZones: DangerZone[];
    simDrones: SimDrone[];
    simBiometrics: Record<string, MinerVitals>;
    simSeismicEvents: SeismicEvent[];
    simHazardGrid: HazardPoint[];
    simEvacRoutes: EvacRoute[];
    simFans: FanState[];
    simPurgeActive: boolean;
    simDronePlaying: boolean;
    setSimMiners: (m: SimMiner[]) => void;
    setSimAlerts: (a: SimAlertEntry[]) => void;
    setSimZones: (z: DangerZone[]) => void;
    setSimDrones: (d: SimDrone[]) => void;
    setSimBiometrics: (b: Record<string, MinerVitals>) => void;
    setSimSeismicEvents: (e: SeismicEvent[]) => void;
    setSimHazardGrid: (g: HazardPoint[]) => void;
    setSimEvacRoutes: (r: EvacRoute[]) => void;
    setSimFans: (f: FanState[]) => void;
    setSimPurgeActive: (p: boolean) => void;
    setSimDronePlaying: (v: boolean) => void;
}

const SimContext = createContext<SimContextValue>({
    simMiners: [], simAlerts: [], simZones: [], simDrones: [],
    simBiometrics: {}, simSeismicEvents: [], simHazardGrid: [], simEvacRoutes: [], simFans: [], simPurgeActive: false,
    simDronePlaying: false,
    setSimMiners: () => { }, setSimAlerts: () => { }, setSimZones: () => { }, setSimDrones: () => { },
    setSimBiometrics: () => { }, setSimSeismicEvents: () => { }, setSimHazardGrid: () => { },
    setSimEvacRoutes: () => { }, setSimFans: () => { }, setSimPurgeActive: () => { }, setSimDronePlaying: () => { },
});

export function SimProvider({ children }: { children: ReactNode }) {
    const [simMiners, setSimMiners] = useState<SimMiner[]>([]);
    const [simAlerts, setSimAlerts] = useState<SimAlertEntry[]>([]);
    const [simZones, setSimZones] = useState<DangerZone[]>([]);
    const [simDrones, setSimDrones] = useState<SimDrone[]>([]);
    const [simBiometrics, setSimBiometrics] = useState<Record<string, MinerVitals>>({});
    const [simSeismicEvents, setSimSeismicEvents] = useState<SeismicEvent[]>([]);
    const [simHazardGrid, setSimHazardGrid] = useState<HazardPoint[]>([]);
    const [simEvacRoutes, setSimEvacRoutes] = useState<EvacRoute[]>([]);
    const [simFans, setSimFans] = useState<FanState[]>([]);
    const [simPurgeActive, setSimPurgeActive] = useState(false);
    const [simDronePlaying, setSimDronePlaying] = useState(false);

    return (
        <SimContext.Provider value={{
            simMiners, simAlerts, simZones, simDrones,
            simBiometrics, simSeismicEvents, simHazardGrid, simEvacRoutes, simFans, simPurgeActive, simDronePlaying,
            setSimMiners, setSimAlerts, setSimZones, setSimDrones,
            setSimBiometrics, setSimSeismicEvents, setSimHazardGrid, setSimEvacRoutes, setSimFans, setSimPurgeActive, setSimDronePlaying,
        }}>
            {children}
        </SimContext.Provider>
    );
}

export function useSimContext() {
    return useContext(SimContext);
}
