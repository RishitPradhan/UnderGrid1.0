import { useEffect, useRef, useState } from "react";
import { useSimContext, type HazardPoint } from "@/context/SimContext";
import axios from "axios";

const SERVER = "http://localhost:3000";

/* Renders a canvas-based heat overlay on the Leaflet map */
export default function HazardHeatmap({ mapObj }: { mapObj: any }) {
    const { simHazardGrid, setSimHazardGrid } = useSimContext();
    const canvasLayerRef = useRef<any>(null);

    // Fetch hazard grid every 5s
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${SERVER}/hazard/grid`);
                setSimHazardGrid(res.data.grid);
            } catch { }
        };
        fetch();
        const interval = setInterval(fetch, 5000);
        return () => clearInterval(interval);
    }, []);

    // Render onto Leaflet map using canvas overlay
    useEffect(() => {
        if (!mapObj || simHazardGrid.length === 0) return;
        const L = (window as any).L;
        if (!L) return;

        // Remove old layer
        if (canvasLayerRef.current) {
            mapObj.removeLayer(canvasLayerRef.current);
            canvasLayerRef.current = null;
        }

        // Create circle markers for each hazard point (lightweight heat dots)
        const group = L.layerGroup();

        simHazardGrid.forEach((pt: HazardPoint) => {
            if (pt.intensity < 0.15) return; // skip low-intensity
            const radius = 40 + pt.intensity * 120; // 40-160m
            const opacity = Math.min(0.5, pt.intensity * 0.6);
            const color =
                pt.intensity > 0.7 ? "#ff3333" :
                    pt.intensity > 0.4 ? "#ff8800" :
                        "#ffcc00";

            L.circle([pt.lat, pt.lng], {
                radius,
                color: "transparent",
                fillColor: color,
                fillOpacity: opacity,
                className: "hazard-heat-dot",
            }).addTo(group);
        });

        group.addTo(mapObj);
        canvasLayerRef.current = group;

        return () => {
            if (canvasLayerRef.current) {
                mapObj.removeLayer(canvasLayerRef.current);
                canvasLayerRef.current = null;
            }
        };
    }, [simHazardGrid, mapObj]);

    return null; // Pure side-effect component
}
