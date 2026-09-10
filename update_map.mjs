import fs from 'fs';
import path from 'path';

const mapContent = `import React from 'react';
import TransitCarrier from './TransitCarrier';
import NodeOverlay from './NodeOverlay';
import { ROUTE_PATHS, getShipmentPosition, KEY_NODES } from '../utils/geoCoordinates';

export default function RetroWorldMap({
  shipments,
  incheonInventory,
  kokomoInventory,
  speInventory,
  customSpeCoords,
  onSelectShipment,
  onOpenLotDetails,
  includedCategories = { incheon: true, transit: true, kokomo: true, spe: true }
}) {
  return (
    <div className="relative w-full h-[660px] bg-[#070c18] border-2 border-[#1c2d42] overflow-hidden select-none shadow-2xl">
      
      {/* 1. Tactical Retro Background Grid (Crisp fine lines, no blur) */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: \`
            linear-gradient(to right, #00f0ff 1px, transparent 1px),
            linear-gradient(to bottom, #00f0ff 1px, transparent 1px)
          \`,
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Coordinate Ticks at Borders */}
      <div className="absolute top-1.5 left-3 text-[10px] font-mono text-cyan-400 font-bold pointer-events-none">
        PACIFIC STRATEGIC SECTOR 04 // LAT 15°N - 65°N, LON 115°E - 65°W
      </div>
      <div className="absolute bottom-1.5 right-3 text-[10px] font-mono text-cyan-400 font-bold pointer-events-none">
        MIDWEST HUB // KOKOMO IN 40.4864° N, 86.1336° W
      </div>

      {/* 2. Geographically Accurate Pacific-Centered World Map */}
      <svg 
        viewBox="0 0 1240 660" 
        className="w-full h-full absolute inset-0 preserve-3d"
      >
        <defs>
          <linearGradient id="oceanRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="inlandRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="airRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Ocean Background Tint */}
        <rect width="1240" height="660" fill="#080e1b" />

        {/* ======================================================== */}
        {/* GEOGRAPHICALLY ACCURATE CONTINENTS (Pacific-Centered)    */}
        {/* ======================================================== */}

        {/* EAST ASIA (China, Russia, Korean Peninsula, Japan) */}
        <g fill="#0f192b" stroke="#243b59" strokeWidth="1.5">
          {/* Asian Mainland Body (China, Siberia, Russian Far East) */}
          <path d="
            M -10,0 
            L 240,0 
            L 250,90 
            L 225,140 
            L 200,195 
            L 180,240 
            L 145,250 
            L 125,255 
            L 95,270 
            L 105,295 
            L 135,305 
            L 120,335 
            L 110,360 
            L 125,380 
            L 135,420 
            L 115,480 
            L 90,540 
            L 70,660 
            L -10,660 Z
          " />

          {/* Shandong Peninsula (China) */}
          <path d="M 105,295 Q 135,305 130,320 L 112,328 Z" fill="#132338" />

          {/* KOREAN PENINSULA (Proportionate, recognizable geography) */}
          <path d="
            M 152,252 
            Q 165,250 185,250 
            L 192,275 
            L 194,310 
            L 198,348 
            L 188,365 
            L 172,362 
            L 160,345 
            L 158,325 
            L 165,305 
            L 155,285 
            L 152,265 Z
          " fill="#162a45" stroke="#00f0ff" strokeWidth="1.6" />

          {/* Jeju Island */}
          <ellipse cx="165" cy="385" rx="6" ry="3.5" fill="#162a45" stroke="#00f0ff" strokeWidth="1" />

          {/* Ulleungdo & Dokdo */}
          <circle cx="206" cy="315" r="2" fill="#00f0ff" />
          <circle cx="214" cy="318" r="1.5" fill="#00f0ff" />

          {/* Taiwan */}
          <path d="M 128,470 L 138,460 L 142,485 L 132,498 Z" fill="#122033" stroke="#223a59" strokeWidth="1" />

          {/* JAPANESE ARCHIPELAGO */}
          {/* Kyushu */}
          <path d="M 205,370 L 222,365 L 226,388 L 210,395 Z" fill="#14243b" stroke="#223a59" strokeWidth="1.2" />
          {/* Shikoku */}
          <path d="M 230,365 L 248,362 L 250,375 L 232,378 Z" fill="#14243b" stroke="#223a59" strokeWidth="1.2" />
          {/* Honshu (Main Island Curve) */}
          <path d="
            M 218,355 
            L 240,348 
            L 260,342 
            L 282,338 
            L 295,310 
            L 292,275 
            L 282,282 
            L 268,320 
            L 245,335 
            L 225,348 Z
          " fill="#14243b" stroke="#223a59" strokeWidth="1.2" />
          {/* Hokkaido */}
          <path d="M 292,260 L 315,235 L 332,240 L 318,270 L 298,272 Z" fill="#14243b" stroke="#223a59" strokeWidth="1.2" />

          {/* Kamchatka Peninsula (Russian Far East) */}
          <path d="M 330,120 L 360,110 L 375,170 L 350,195 L 340,150 Z" fill="#101b2d" stroke="#223a59" strokeWidth="1.2" />
        </g>

        {/* PACIFIC ISLANDS & ALEUTIAN CHAIN */}
        <g stroke="#1b304c" strokeWidth="1" fill="#152438">
          {/* Aleutian Chain (Sub-arctic Arc) */}
          <circle cx="410" cy="188" r="2.5" />
          <circle cx="455" cy="175" r="2.5" />
          <circle cx="505" cy="165" r="3" />
          <circle cx="560" cy="158" r="3" />
          <circle cx="620" cy="155" r="3.5" />
          <circle cx="680" cy="158" r="3.5" />
          <circle cx="735" cy="168" r="4" />

          {/* Hawaiian Islands (Mid-Pacific) */}
          <ellipse cx="585" cy="425" rx="4" ry="2.5" fill="#1d3554" stroke="#38bdf8" />
          <ellipse cx="602" cy="432" rx="5" ry="3" fill="#1d3554" stroke="#38bdf8" />
          <ellipse cx="618" cy="440" rx="6" ry="4" fill="#1d3554" stroke="#38bdf8" />
          <text x="630" y="445" fill="#38bdf8" fontSize="9" fontFamily="monospace">HAWAII</text>
        </g>

        {/* NORTH AMERICAN CONTINENT (Proportionate, realistic geography) */}
        <g fill="#101a2c" stroke="#264063" strokeWidth="1.5">
          {/* Alaska Mainland */}
          <path d="
            M 730,110 
            L 810,80 
            L 845,130 
            L 820,165 
            L 760,175 
            L 730,150 Z
          " />

          {/* Contiguous United States & Canada Mainland */}
          <path d="
            M 845,130 
            L 1250,130 
            L 1250,660 
            L 1090,660 
            L 1125,520 
            L 1140,460 
            L 1080,440 
            L 1040,450 
            L 990,440 
            L 955,480 
            L 925,430 
            L 910,390 
            L 900,375 
            L 880,345 
            L 875,320 
            L 885,280 
            L 890,250 
            L 865,200 
            L 845,130 Z
          " />

          {/* Baja California Peninsula */}
          <path d="M 910,390 L 935,465 L 942,485 L 928,475 L 918,420 Z" fill="#0d1624" stroke="#223a59" />

          {/* Florida Peninsula */}
          <path d="M 1120,430 L 1145,465 L 1140,495 L 1125,490 L 1115,445 Z" fill="#122035" />

          {/* Great Lakes (Superior, Michigan, Huron, Erie, Ontario) */}
          {/* Lake Superior */}
          <ellipse cx="1035" cy="225" rx="22" ry="9" fill="#080e1b" stroke="#1d334f" strokeWidth="1.2" />
          {/* Lake Michigan (North-South elongation towards Chicago) */}
          <path d="M 1055,240 Q 1060,265 1063,288 Q 1054,288 1050,255 Z" fill="#080e1b" stroke="#1d334f" strokeWidth="1.2" />
          {/* Lake Huron */}
          <ellipse cx="1085" cy="245" rx="14" ry="12" fill="#080e1b" stroke="#1d334f" strokeWidth="1.2" />
          {/* Lake Erie */}
          <ellipse cx="1105" cy="275" rx="15" ry="6" fill="#080e1b" stroke="#1d334f" strokeWidth="1.2" />
          {/* Lake Ontario */}
          <ellipse cx="1130" cy="260" rx="12" ry="5" fill="#080e1b" stroke="#1d334f" strokeWidth="1.2" />
        </g>

        {/* Tactical Geographic Grid Lines */}
        <g stroke="#14243a" strokeWidth="1" strokeDasharray="3 3">
          <line x1="0" y1="180" x2="1240" y2="180" />
          <line x1="0" y1="330" x2="1240" y2="330" />
          <line x1="0" y1="480" x2="1240" y2="480" />
          <line x1="300" y1="0" x2="300" y2="660" />
          <line x1="550" y1="0" x2="550" y2="660" />
          <line x1="800" y1="0" x2="800" y2="660" />
          <line x1="1050" y1="0" x2="1050" y2="660" />
        </g>

        {/* Tactical Region Labels */}
        <text x="500" y="340" fill="#1b2f4a" fontSize="22" fontFamily="monospace" fontWeight="900" letterSpacing="8">
          NORTH PACIFIC OCEAN
        </text>
        <text x="145" y="420" fill="#294d75" fontSize="11" fontFamily="monospace" fontWeight="bold">
          [대한민국 / 동아시아 허브]
        </text>
        <text x="960" y="410" fill="#294d75" fontSize="11" fontFamily="monospace" fontWeight="bold">
          [미합중국 / 북미 본토 물류망]
        </text>

        {/* ======================================================== */}
        {/* LOGISTICS ROUTES                                         */}
        {/* ======================================================== */}

        {/* 1. Sea Route Path: Incheon -> Pacific Ocean -> LA Port */}
        <g opacity={includedCategories.transit ? 1 : 0.2}>
          <path 
            d={ROUTE_PATHS.SEA_PACIFIC} 
            fill="none" 
            stroke="#00f0ff" 
            strokeWidth="3" 
            strokeOpacity="0.15" 
          />
          <path 
            d={ROUTE_PATHS.SEA_PACIFIC} 
            fill="none" 
            stroke="url(#oceanRouteGrad)" 
            strokeWidth="2" 
            strokeDasharray="6 4" 
          />
        </g>

        {/* 2. US Inland Rail/Truck Route: LA Port -> Kokomo */}
        <g opacity={includedCategories.transit || includedCategories.kokomo ? 1 : 0.2}>
          <path 
            d={ROUTE_PATHS.INLAND_RAIL} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="3.5" 
            strokeOpacity="0.2" 
          />
          <path 
            d={ROUTE_PATHS.INLAND_RAIL} 
            fill="none" 
            stroke="url(#inlandRouteGrad)" 
            strokeWidth="2" 
            strokeDasharray="5 3" 
          />
        </g>

        {/* 3. Air Cargo Great Circle Route: Incheon -> Aleutians -> Chicago */}
        <g opacity={includedCategories.transit ? 1 : 0.2}>
          <path 
            d={ROUTE_PATHS.AIR_FLIGHT} 
            fill="none" 
            stroke="#38bdf8" 
            strokeWidth="2.5" 
            strokeOpacity="0.2" 
          />
          <path 
            d={ROUTE_PATHS.AIR_FLIGHT} 
            fill="none" 
            stroke="url(#airRouteGrad)" 
            strokeWidth="1.5" 
            strokeDasharray="4 5" 
          />
        </g>

        {/* 4. Kokomo -> SPE Customer Final Leg */}
        <g opacity={includedCategories.spe ? 1 : 0.2}>
          <path 
            d={\`M 1075 298 Q 1100 302 \${customSpeCoords?.x ?? KEY_NODES.SPE.x} \${customSpeCoords?.y ?? KEY_NODES.SPE.y}\`}
            fill="none" 
            stroke="#f59e0b" 
            strokeWidth="2" 
            strokeDasharray="3 3" 
          />
        </g>

        {/* Route Labels */}
        <text x="470" y="235" fill="#00f0ff" opacity="0.75" fontSize="10" fontFamily="monospace">
          태평양 해상 항로 (컨테이너선) ➔
        </text>
        <text x="480" y="130" fill="#38bdf8" opacity="0.75" fontSize="10" fontFamily="monospace">
          대권비행 항공 화물로 ➔
        </text>
        <text x="960" y="340" fill="#10b981" opacity="0.85" fontSize="9" fontFamily="monospace">
          미 내륙 철도/트럭
        </text>
      </svg>

      {/* ======================================================== */}
      {/* 3. DYNAMIC TRANSIT CARRIERS                              */}
      {/* ======================================================== */}
      <div className={\`absolute inset-0 pointer-events-auto transition-opacity duration-200 \${includedCategories.transit ? 'opacity-100' : 'opacity-25'}\`}>
        {shipments.map((shipment) => {
          const pos = getShipmentPosition(shipment, customSpeCoords);
          return (
            <TransitCarrier
              key={shipment.id}
              shipment={shipment}
              position={pos}
              onSelectShipment={onSelectShipment}
            />
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 4. LOCATION NODES OVERLAY                                */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-auto">
        <NodeOverlay
          incheonInventory={incheonInventory}
          kokomoInventory={kokomoInventory}
          speInventory={speInventory}
          customSpeCoords={customSpeCoords}
          onOpenLotDetails={onOpenLotDetails}
          includedCategories={includedCategories}
        />
      </div>

      {/* Map Legend at Bottom Left */}
      <div className="absolute bottom-3 left-3 bg-[#0a111e]/95 border border-slate-700 p-2.5 rounded font-mono text-[11px] text-slate-300 space-y-1 backdrop-blur-sm z-20">
        <div className="font-bold text-cyan-400 border-b border-slate-700 pb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-cyan-400 inline-block"></span>
          <span>물류 운송 모드 범례</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
          <span>해상 운송로 (태평양 컨테이너선)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-sky-400 inline-block border-t border-dotted"></span>
          <span>항공 운송로 (화물기)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
          <span>미 내륙 철도/트럭</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
          <span>SPE 고객 납품 직송</span>
        </div>
      </div>

    </div>
  );
}
`;

fs.writeFileSync(path.resolve('./src/components/RetroWorldMap.jsx'), mapContent, 'utf8');
console.log('RetroWorldMap.jsx updated with geographically accurate paths.');
