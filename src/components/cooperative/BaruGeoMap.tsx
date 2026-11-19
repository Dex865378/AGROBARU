import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  ShieldCheck, 
  Layers, 
  Eye, 
  Sprout, 
  Building2, 
  Maximize2, 
  Minimize2,
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Compass, 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain, 
  MessageSquare, 
  ShoppingBag, 
  Award, 
  CheckCircle2, 
  ExternalLink,
  Activity,
  Ruler,
  Truck
} from 'lucide-react';
import { useAppState } from '@/context/AppStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { Farm } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChatContact } from '@/components/chat/DirectMessageModal';
import { FARMER_DIRECTORY, ENTERPRISE_DIRECTORY } from '@/services/directoryData';

interface BaruGeoMapProps {
  onNavigateToChat?: (contact: ChatContact) => void;
  onNavigateToMarketplace?: () => void;
}

// Corregimientos center points in Barú District (Chiriquí)
const CORREGIMIENTOS_DATA = [
  { id: 'all', name: 'Todo el Distrito de Barú', lat: 8.3050, lng: -82.8550, zoom: 12 },
  { id: 'armuelles', name: 'Puerto Armuelles (FOB Port)', lat: 8.2831, lng: -82.8624, zoom: 14 },
  { id: 'progreso', name: 'Progreso (Frontera Paso Canoas)', lat: 8.3610, lng: -82.8420, zoom: 14 },
  { id: 'baco', name: 'Baco (Río Chiriquí Viejo)', lat: 8.3120, lng: -82.7950, zoom: 14 },
  { id: 'limones', name: 'Limones (Península de Burica)', lat: 8.2415, lng: -82.8850, zoom: 14 },
  { id: 'rodolfo', name: 'Rodolfo Aguilar Delgado', lat: 8.3450, lng: -82.9100, zoom: 14 },
];

// Puerto Armuelles Deepwater Port FOB coordinates
const PUERTO_ARMUELLES_PORT = {
  name: 'Terminal Marítima de Exportación Puerto Armuelles (FOB)',
  lat: 8.2745,
  lng: -82.8590
};

export const BaruGeoMap: React.FC<BaruGeoMapProps> = ({ 
  onNavigateToChat,
  onNavigateToMarketplace 
}) => {
  const { farms, batches } = useAppState();
  const { language } = useLanguage();
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const parcelLayersRef = useRef<L.LayerGroup | null>(null);
  const riskLayersRef = useRef<L.LayerGroup | null>(null);

  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(farms[0] || null);
  const [mapLayer, setMapLayer] = useState<'SATELLITE' | 'OSM' | 'TOPO'>('SATELLITE');
  const [showSigatokaHeatmap, setShowSigatokaHeatmap] = useState(true);
  const [showParcels, setShowParcels] = useState(true);
  const [activeCorregimiento, setActiveCorregimiento] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 8.2831,
    lng: -82.8624
  });

  // Calculate distance & transit to port for selected farm
  const getPortDistanceKm = (farm: Farm): number => {
    const lat1 = farm.coordinates.lat;
    const lon1 = farm.coordinates.lng;
    const lat2 = PUERTO_ARMUELLES_PORT.lat;
    const lon2 = PUERTO_ARMUELLES_PORT.lng;
    
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Switch Tile Layer
  const setTileLayer = (layerType: 'SATELLITE' | 'OSM' | 'TOPO') => {
    if (!mapInstanceRef.current) return;
    setMapLayer(layerType);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let attribution = 'Tiles &copy; Esri World Imagery';

    if (layerType === 'OSM') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    } else if (layerType === 'TOPO') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenTopoMap (Relieve Cuencas Chiriquí)';
    }

    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 19,
      attribution
    }).addTo(mapInstanceRef.current);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent duplicate instantiation

    // Base map centered at Barú, Chiriquí
    const map = L.map(mapContainerRef.current, {
      center: [8.3050, -82.8550],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });
    mapInstanceRef.current = map;

    // Default tile layer: Esri World Imagery
    tileLayerRef.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Esri World Imagery' }
    ).addTo(map);

    // Layer groups for parcels & risk
    parcelLayersRef.current = L.layerGroup().addTo(map);
    riskLayersRef.current = L.layerGroup().addTo(map);

    // Mouse movement coordinate tracker
    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: parseFloat(e.latlng.lat.toFixed(5)),
        lng: parseFloat(e.latlng.lng.toFixed(5))
      });
    });

    // Add FOB Terminal port marker
    const portIcon = L.divIcon({
      className: 'custom-fob-marker',
      html: `
        <div style="
          background: #7C3AED;
          border: 2px solid #FACC15;
          color: white;
          padding: 3px 6px;
          border-radius: 0px;
          font-family: monospace;
          font-weight: 900;
          font-size: 10px;
          white-space: nowrap;
          box-shadow: 3px 3px 0px 0px #000;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          🚢 PUERTO ARMUELLES (FOB)
        </div>
      `,
      iconSize: [180, 26],
      iconAnchor: [90, 13]
    });

    L.marker([PUERTO_ARMUELLES_PORT.lat, PUERTO_ARMUELLES_PORT.lng], { icon: portIcon })
      .bindPopup(`
        <div style="font-family: monospace; padding: 4px; color: #111;">
          <strong style="color: #7C3AED; font-size: 13px;">🚢 Terminal Marítima Puerto Armuelles</strong>
          <p style="margin: 4px 0; font-size: 11px;">Muelle de exportación de banano y carga refrigerada hacia el Pacífico.</p>
          <div style="background: #f3f4f6; padding: 4px; font-size: 10px; font-weight: bold;">
            Calado: 14.5m | Zona Portuaria WGS84
          </div>
        </div>
      `)
      .addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Parcels, Polygons, and Sigatoka Heatmaps
  useEffect(() => {
    if (!mapInstanceRef.current || !parcelLayersRef.current || !riskLayersRef.current) return;

    parcelLayersRef.current.clearLayers();
    riskLayersRef.current.clearLayers();

    // 1. Sigatoka Heatmap Circles
    if (showSigatokaHeatmap) {
      const riskZones = [
        { lat: 8.3610, lng: -82.8420, radius: 1800, level: 'MEDIO', color: '#F97316', desc: 'Progreso: Humedad 88% - Esporulación Moderada' },
        { lat: 8.3120, lng: -82.7950, radius: 2400, level: 'BAJO', color: '#15803D', desc: 'Baco: Drenajes Óptimos - Control Biológico Activo' },
        { lat: 8.2831, lng: -82.8624, radius: 1500, level: 'BAJO', color: '#15803D', desc: 'Puerto Armuelles: Brisa Marina - Baja Incidencia' },
        { lat: 8.3450, lng: -82.9100, radius: 2100, level: 'ALTO', color: '#EF4444', desc: 'Rodolfo Aguilar: Alta Precipitación Reciente (Alerta)' },
      ];

      riskZones.forEach(zone => {
        L.circle([zone.lat, zone.lng], {
          radius: zone.radius,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.18,
          weight: 1.5,
          dashArray: '4 4'
        })
          .bindPopup(`
            <div style="font-family: monospace; font-size: 11px; color: #111;">
              <strong>🔥 Zona Sigatoka: ${zone.level}</strong><br/>
              <span>${zone.desc}</span>
            </div>
          `)
          .addTo(riskLayersRef.current!);
      });
    }

    // 2. Farm Parcels and Polygons
    if (showParcels) {
      farms.forEach((farm) => {
        const isSelected = selectedFarm?.id === farm.id;
        const lat = farm.coordinates.lat;
        const lng = farm.coordinates.lng;

        // Simulated Cadastral Polygon based on farm area (hectares)
        const offset = Math.sqrt(farm.areaHectares) * 0.00065;
        const polygonCoords: [number, number][] = [
          [lat - offset * 0.8, lng - offset],
          [lat + offset * 1.1, lng - offset * 0.7],
          [lat + offset * 0.9, lng + offset * 1.2],
          [lat - offset * 0.9, lng + offset * 0.8],
        ];

        // Polygon perimeter
        const polygon = L.polygon(polygonCoords, {
          color: isSelected ? '#FACC15' : '#15803D',
          fillColor: isSelected ? '#FACC15' : '#15803D',
          fillOpacity: isSelected ? 0.45 : 0.25,
          weight: isSelected ? 3 : 1.5,
          dashArray: isSelected ? undefined : '3 3'
        });

        polygon.on('click', () => {
          setSelectedFarm(farm);
        });

        polygon.addTo(parcelLayersRef.current!);

        // Pin Marker with Badges
        const farmLabel = farm.name.length > 22 ? `${farm.name.slice(0, 21)}…` : farm.name;
        const farmIcon = L.divIcon({
          className: 'custom-farm-pin',
          html: `
            <div style="
              background: ${isSelected ? '#FACC15' : '#0E0E0E'};
              border: 2px solid ${isSelected ? '#000000' : '#15803D'};
              color: ${isSelected ? '#000000' : '#E5E5E5'};
              padding: 2px 6px;
              font-family: monospace;
              font-weight: 800;
              font-size: 10px;
              white-space: nowrap;
              box-shadow: ${isSelected ? '0 0 14px #FACC15' : '3px 3px 0px 0px #15803D'};
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span style="display: inline-block; width: 6px; height: 6px; background: ${isSelected ? '#000' : '#15803D'}; border-radius: 50%;"></span>
              ${farmLabel} (${farm.areaHectares} Ha)
            </div>
          `,
          iconSize: [160, 24],
          iconAnchor: [80, 12]
        });

        const marker = L.marker([lat, lng], { icon: farmIcon });
        marker.on('click', () => {
          setSelectedFarm(farm);
        });

        marker.addTo(parcelLayersRef.current!);
      });
    }
  }, [farms, selectedFarm, showSigatokaHeatmap, showParcels]);

  // Jump to specific Corregimiento
  const handleCorregimientoSelect = (id: string) => {
    setActiveCorregimiento(id);
    const target = CORREGIMIENTOS_DATA.find(c => c.id === id);
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.lat, target.lng], target.zoom, {
        duration: 1.2
      });
    }
  };

  // Fly to selected farm
  const handleFlyToFarm = (farm: Farm) => {
    setSelectedFarm(farm);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([farm.coordinates.lat, farm.coordinates.lng], 15, {
        duration: 1.0
      });
    }
  };

  // Find contact in directory for direct chat
  const handleStartChatWithProducer = (farm: Farm) => {
    if (!onNavigateToChat) return;

    const matchedFarmer = FARMER_DIRECTORY.find(f => f.name.toLowerCase() === farm.ownerName.toLowerCase() || f.id === farm.ownerId);
    const matchedEnterprise = ENTERPRISE_DIRECTORY.find(e => e.name.toLowerCase() === farm.ownerName.toLowerCase() || e.brandName.toLowerCase() === farm.name.toLowerCase());

    const contact: ChatContact = {
      id: farm.ownerId,
      name: farm.ownerName,
      corregimiento: farm.corregimiento,
      avatar: matchedFarmer?.avatar || matchedEnterprise?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      reputation: 99.4,
      phone: matchedFarmer?.phone || matchedEnterprise?.phone || '+507 6789-1234',
      badge: `Productor ${farm.primaryCrops[0] || 'Banano'}`
    };

    onNavigateToChat(contact);
  };

  return (
    <div className={`space-y-6 font-mono ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0A0A0A] p-6 overflow-y-auto' : ''}`}>
      {/* Top Header & Satellite Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#15803D] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="live-green" pulse>GIS MIDA BARÚ V3.0</Badge>
            <Badge variant="outline">DATUM WGS84 • EPSG:4326</Badge>
            <Badge variant="yellow">SATÉLITE EN VIVO</Badge>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-[#E5E5E5] uppercase tracking-tight mt-1">
            {language === 'en' ? 'Geospatial Satellite & Cadastral Map // Barú' : 'Mapa Satelital & Catastro Geoespacial de Barú'}
          </h2>
          <p className="text-xs text-[#9E9E9E] font-sans">
            Inspección fotogramétrica de alta resolución de parcelas agrícolas certificadas, microclimas y rutas logísticas al Puerto de Aguas Profundas.
          </p>
        </div>

        {/* Map View & Layer Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer switcher */}
          <div className="flex items-center gap-1 bg-[#141414] p-1 border border-[#15803D]">
            <button
              onClick={() => setTileLayer('SATELLITE')}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-all ${
                mapLayer === 'SATELLITE'
                  ? 'bg-[#15803D] text-black shadow-[1px_1px_0px_0px_#FACC15]'
                  : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
              }`}
            >
              🛰️ Satelital Esri
            </button>
            <button
              onClick={() => setTileLayer('OSM')}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-all ${
                mapLayer === 'OSM'
                  ? 'bg-[#FACC15] text-black shadow-[1px_1px_0px_0px_#15803D]'
                  : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
              }`}
            >
              🗺️ Calles & Vial
            </button>
            <button
              onClick={() => setTileLayer('TOPO')}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-all ${
                mapLayer === 'TOPO'
                  ? 'bg-[#7C3AED] text-white shadow-[1px_1px_0px_0px_#FACC15]'
                  : 'text-[#9E9E9E] hover:text-[#E5E5E5]'
              }`}
            >
              🌿 Cuencas / Topo
            </button>
          </div>

          {/* Toggle Sigatoka Heatmap */}
          <button
            onClick={() => setShowSigatokaHeatmap(!showSigatokaHeatmap)}
            className={`px-2.5 py-1 text-[11px] font-bold border transition-all ${
              showSigatokaHeatmap
                ? 'bg-[#F97316] text-black border-[#F97316]'
                : 'bg-[#141414] text-[#9E9E9E] border-[#1E293B]'
            }`}
          >
            🔥 {showSigatokaHeatmap ? 'Ocultar Sigatoka' : 'Ver Sigatoka'}
          </button>

          {/* Toggle Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#15803D] text-[#E5E5E5] transition-all"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-[#FACC15]" /> : <Maximize2 className="w-4 h-4 text-[#15803D]" />}
          </button>
        </div>
      </div>

      {/* Barú Real-time Meteorological Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#0E0E0E] p-3 border border-[#1E293B] text-xs">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-[#FACC15]" />
          <div>
            <div className="text-[9px] text-[#666666] uppercase">Temperatura</div>
            <div className="font-bold text-[#E5E5E5]">29.4°C (Cálido)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-[#38BDF8]" />
          <div>
            <div className="text-[9px] text-[#666666] uppercase">Humedad Relativa</div>
            <div className="font-bold text-[#38BDF8]">86% (Alta)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-[#15803D]" />
          <div>
            <div className="text-[9px] text-[#666666] uppercase">Precipitación 24h</div>
            <div className="font-bold text-[#E5E5E5]">14.2 mm</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-[#A78BFA]" />
          <div>
            <div className="text-[9px] text-[#666666] uppercase">Viento Pacífico</div>
            <div className="font-bold text-[#A78BFA]">8.5 kt SO</div>
          </div>
        </div>
        <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
          <Activity className="w-4 h-4 text-[#15803D]" />
          <div>
            <div className="text-[9px] text-[#666666] uppercase">Índice NDVI Promedio</div>
            <div className="font-bold text-[#15803D]">0.84 (Vigoroso)</div>
          </div>
        </div>
      </div>

      {/* Corregimiento Quick-Jump Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto md:flex-wrap md:overflow-visible pb-1 text-xs">
        <span className="text-[10px] text-[#666666] uppercase font-bold shrink-0 mr-1 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-[#15803D]" />
          Zona Barú:
        </span>
        {CORREGIMIENTOS_DATA.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCorregimientoSelect(c.id)}
            className={`px-2.5 py-1 text-[11px] font-bold uppercase shrink-0 border transition-all ${
              activeCorregimiento === c.id
                ? 'bg-[#15803D] text-black border-[#15803D] shadow-[2px_2px_0px_0px_#FACC15]'
                : 'bg-[#141414] text-[#9E9E9E] border-[#1E293B] hover:text-[#E5E5E5]'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Main Map Viewer + Sidebar Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Leaflet Live Map Canvas */}
        <div className="lg:col-span-2 bg-[#0E0E0E] border-2 border-[#15803D] p-3 space-y-3 shadow-[6px_6px_0px_0px_#15803D]">
          {/* Map Top Bar with Quick Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#15803D]" />
              <span className="font-bold text-[#E5E5E5] uppercase">
                Visor Satelital WGS84 • {farms.length} Fincas Georreferenciadas
              </span>
            </div>

            {/* Custom On-Map Zoom & Reset Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="p-1 bg-[#141414] hover:bg-[#1A1A1A] border border-[#15803D] text-[#E5E5E5]"
                title="Acercar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="p-1 bg-[#141414] hover:bg-[#1A1A1A] border border-[#15803D] text-[#E5E5E5]"
                title="Alejar"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCorregimientoSelect('all')}
                className="p-1 bg-[#141414] hover:bg-[#1A1A1A] border border-[#15803D] text-[#E5E5E5]"
                title="Restablecer Vista Completa de Barú"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#FACC15]" />
              </button>
            </div>
          </div>

          {/* Leaflet Map Div */}
          <div className="relative w-full h-[480px] bg-[#050505] border-2 border-[#1E293B] overflow-hidden">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Live GPS Coordinates Telemetry Overlay */}
            <div className="absolute top-2 left-2 z-10 bg-[#0A0A0A]/90 backdrop-blur-sm border border-[#15803D] px-2.5 py-1 text-[10px] text-[#9E9E9E] pointer-events-none">
              <span className="text-[#15803D] font-bold">GPS: </span>
              <span className="text-[#E5E5E5]">
                {cursorCoords ? `${cursorCoords.lat.toFixed(5)}°N, ${cursorCoords.lng.toFixed(5)}°W` : '8.28310°N, 82.86240°W'}
              </span>
              <span className="text-[#666666] ml-2">| ALT: 14m s.n.m.</span>
            </div>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-2 left-2 z-10 bg-[#0A0A0A]/95 backdrop-blur-sm border border-[#15803D] p-2 text-[10px] text-[#9E9E9E] space-y-1">
              <div className="text-[#E5E5E5] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#15803D]"></span>
                Polígono Parcela Certificada MIDA
              </div>
              <div className="text-[#FACC15] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FACC15]"></span>
                Parcela Seleccionada en Inspección
              </div>
              <div className="text-[#7C3AED] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
                Puerto de Aguas Profundas Armuelles (FOB)
              </div>
              {showSigatokaHeatmap && (
                <div className="text-[#F97316] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F97316]"></span>
                  Microclima de Riesgo Fitosanitario (Sigatoka)
                </div>
              )}
            </div>
          </div>

          {/* Quick Farm Carousel below the map */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] text-[#666666] uppercase font-bold">Fincas Auditadas en Barú (Click para centrar):</div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {farms.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFlyToFarm(f)}
                  className={`px-2.5 py-1 text-xs shrink-0 border transition-all text-left ${
                    selectedFarm?.id === f.id
                      ? 'bg-[#15803D] text-black border-[#15803D] shadow-[2px_2px_0px_0px_#FACC15]'
                      : 'bg-[#141414] text-[#E5E5E5] border-[#1E293B] hover:border-[#15803D]'
                  }`}
                >
                  <div className="font-bold">{f.name}</div>
                  <div className="text-[9px] opacity-80">{f.corregimiento} • {f.areaHectares} Ha</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Farm Detailed Dossier Card */}
        {selectedFarm ? (
          <div className="bg-[#0E0E0E] border-2 border-[#15803D] p-5 space-y-4 shadow-[6px_6px_0px_0px_#15803D] flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-[#1E293B] pb-3">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <Badge variant="live-green" pulse>{selectedFarm.primaryCrops.join(', ')}</Badge>
                  <span className="text-[10px] font-mono text-[#FACC15] font-bold uppercase bg-[#141414] px-2 py-0.5 border border-[#1E293B]">
                    {selectedFarm.corregimiento}
                  </span>
                </div>
                <h3 className="font-display font-black text-xl text-[#E5E5E5] uppercase">
                  {selectedFarm.name}
                </h3>
                <div className="text-xs text-[#9E9E9E] mt-0.5">
                  Titular Productor: <strong className="text-[#E5E5E5]">{selectedFarm.ownerName}</strong>
                </div>
              </div>

              {/* Technical Cadastral Details */}
              <div className="bg-[#141414] border border-[#1E293B] p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#666666]">Registro MIDA:</span>
                  <span className="text-[#15803D] font-bold">{selectedFarm.registrationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Área Catastral:</span>
                  <span className="text-[#E5E5E5] font-bold">{selectedFarm.areaHectares} Hectáreas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Coordenadas WGS84:</span>
                  <span className="text-[#FACC15] font-bold">
                    {selectedFarm.coordinates.lat.toFixed(4)}, {selectedFarm.coordinates.lng.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Tipo de Suelo:</span>
                  <span className="text-[#E5E5E5]">Aluvial Volcánico Rico (pH 6.2)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Riego y Drenaje:</span>
                  <span className="text-[#15803D] font-bold">Por Gravedad & Goteo Barú</span>
                </div>
              </div>

              {/* Logistics & Transit to Puerto Armuelles FOB */}
              <div className="bg-[#0A0A0A] border border-[#7C3AED] p-3 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-[#7C3AED] font-bold text-[11px] uppercase">
                  <Truck className="w-4 h-4" />
                  <span>Logística hacia Muelle FOB Puerto Armuelles:</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9E9E9E]">Distancia por Carretera:</span>
                  <span className="text-[#E5E5E5] font-bold">{getPortDistanceKm(selectedFarm)} km</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9E9E9E]">Tiempo de Tránsito Reefer:</span>
                  <span className="text-[#FACC15] font-bold">~{Math.round(getPortDistanceKm(selectedFarm) * 1.5 + 10)} min</span>
                </div>
              </div>

              {/* Certifications Badges */}
              <div>
                <div className="text-[10px] text-[#666666] uppercase font-bold mb-1.5">
                  Certificaciones Sanitarias y Buenas Prácticas:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFarm.certificaciones.map((cert) => (
                    <span 
                      key={cert}
                      className="inline-flex items-center gap-1 text-[10px] bg-[#141414] border border-[#15803D] px-2 py-0.5 text-[#15803D] font-bold"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#15803D]" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Batches of this farm */}
              <div>
                <div className="text-[10px] text-[#666666] uppercase font-bold mb-1.5">
                  Lotes de Cosecha Asociados:
                </div>
                {batches.filter(b => b.farmId === selectedFarm.id).length > 0 ? (
                  <div className="space-y-1.5">
                    {batches.filter(b => b.farmId === selectedFarm.id).map(b => (
                      <div key={b.id} className="p-2 bg-[#141414] border border-[#1E293B] flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-[#E5E5E5]">{b.cropName} ({b.variety})</div>
                          <div className="text-[10px] text-[#9E9E9E]">{b.batchCode} • {b.quantityKg.toLocaleString()} kg</div>
                        </div>
                        <span className="text-[#FACC15] font-bold">${b.pricePerKgUsd.toFixed(2)}/kg</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-[#9E9E9E] bg-[#141414] p-2 border border-[#1E293B]">
                    Lote en fase de crecimiento agronómico. Próxima cosecha proyectada.
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Contact in Chat & View Marketplace */}
            <div className="pt-4 border-t border-[#1E293B] space-y-2">
              <Button
                variant="default"
                className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-[#15803D] hover:bg-[#16a34a] text-black"
                onClick={() => handleStartChatWithProducer(selectedFarm)}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Privado con {selectedFarm.ownerName.split(' ')[0]}</span>
              </Button>

              {onNavigateToMarketplace && (
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold border-[#FACC15] text-[#FACC15] hover:bg-[#FACC15] hover:text-black"
                  onClick={onNavigateToMarketplace}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ver Ofertas en el Mercado</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#0E0E0E] border-2 border-[#1E293B] p-6 flex flex-col items-center justify-center text-center space-y-3">
            <MapPin className="w-10 h-10 text-[#666666]" />
            <h3 className="font-display font-bold text-lg text-[#E5E5E5] uppercase">
              Selecciona una Parcela
            </h3>
            <p className="text-xs text-[#9E9E9E]">
              Haz clic en cualquier finca del mapa o carrusel para inspeccionar su catastro MIDA, coordenadas WGS84 y contactar al productor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
