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
  onSelectShipment,
  onOpenLotDetails,
  includedCategories = { incheon: true, transit: true, kokomo: true, spe: true }
}) {
  return (
    <div className="relative w-full h-[680px] bg-[#070d1a] border-2 border-[#1c2d42] overflow-hidden select-none shadow-2xl">
      
      {/* 1. Tactical Grid & Lat/Lon Markings */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: \`
            linear-gradient(to right, #00f0ff 1px, transparent 1px),
            linear-gradient(to bottom, #00f0ff 1px, transparent 1px)
          \`,
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Coordinate HUD Labels */}
      <div className="absolute top-2 left-3 text-[11px] font-mono text-cyan-400 font-bold pointer-events-none z-10 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-400"></span>
        <span>PACIFIC LOGISTICS GRID // EQUIRECTANGULAR SECTOR 04 [120°E - 70°W]</span>
      </div>
      <div className="absolute top-2 right-4 text-[11px] font-mono text-slate-400 font-bold pointer-events-none z-10">
        USA MIDWEST LOGISTICS REGION // KOKOMO IN
      </div>

      {/* 2. Geographically Accurate Pacific-Centered World Map (1440 x 700) */}
      <svg 
        viewBox="0 0 1440 700" 
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
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="airRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Ocean Background Tint */}
        <rect width="1440" height="700" fill="#08101e" />

        {/* ======================================================== */}
        {/* GEOGRAPHICALLY PRECISE LANDMASSES (Reference Image Match)*/}
        {/* ======================================================== */}

        {/* 1. ASIAN MAINLAND (China, Russia/Siberia) */}
        <g fill="#0e1728" stroke="#1e3350" strokeWidth="1.5">
          {/* Main Asian continent (behind Yellow Sea) */}
          <path d="
            M -10,0 
            L 260,0 
            L 255,100 
            L 230,160 
            L 205,215 
            L 175,250 
            L 135,248 
            L 100,265 
            L 112,295 
            L 142,308 
            L 128,335 
            L 115,362 
            L 138,382 
            L 148,430 
            L 125,490 
            L 100,560 
            L 80,700 
            L -10,700 Z
          " />

          {/* Shandong Peninsula (Qingdao) */}
          <path d="M 112,295 Q 145,308 138,328 L 118,335 Z" fill="#122036" />

          {/* Shanghai / Yangtze Estuary */}
          <circle cx="140" cy="382" r="3" fill="#1e3350" />

          {/* Taiwan */}
          <path d="M 132,500 L 145,490 L 148,518 L 136,530 Z" fill="#122036" stroke="#223c60" strokeWidth="1.2" />

          {/* Russian Far East / Kamchatka */}
          <path d="M 390,110 L 440,100 L 460,160 L 430,190 L 415,140 Z" fill="#0f1a2c" stroke="#223c60" strokeWidth="1.2" />
        </g>

        {/* 2. THE KOREAN PENINSULA (Distinct, highly recognizable South Korea!) */}
        <g>
          {/* Korean Peninsula Body */}
          <path d="
            M 168,260 
            Q 185,255 210,256 
            L 216,280 
            L 218,312 
            L 226,348 
            L 222,368 
            L 200,375 
            L 185,365 
            L 178,350 
            L 182,330 
            L 186,312 
            L 172,290 
            L 168,270 Z
          " fill="#1b3558" stroke="#00f0ff" strokeWidth="2.2" />

          {/* Gyeonggi Bay / Incheon Port Indentation Line */}
          <path d="M 186,312 Q 180,312 178,322" stroke="#00f0ff" strokeWidth="1.5" fill="none" />

          {/* Jeju Island (South Sea) */}
          <ellipse cx="185" cy="402" rx="9" ry="5.5" fill="#1b3558" stroke="#00f0ff" strokeWidth="1.5" />

          {/* Ulleungdo & Dokdo (East Sea) */}
          <circle cx="242" cy="318" r="3" fill="#00f0ff" />
          <circle cx="254" cy="322" r="2" fill="#00f0ff" />

          {/* Clear Country Badges */}
          <rect x="172" y="278" width="60" height="15" fill="#0c182a" rx="2" stroke="#00f0ff" strokeWidth="0.8" />
          <text x="202" y="289" fill="#00f0ff" fontSize="9.5" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
            대한민국
          </text>
          <text x="240" y="348" fill="#38bdf8" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" opacity="0.8">
            동해
          </text>
          <text x="145" y="340" fill="#38bdf8" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" opacity="0.8">
            서해(황해)
          </text>
        </g>

        {/* 3. JAPANESE ARCHIPELAGO (Accurate proportions & islands) */}
        <g fill="#14243b" stroke="#26436b" strokeWidth="1.5">
          {/* Tsushima Island (Strait) */}
          <ellipse cx="238" cy="390" rx="3" ry="5" fill="#1b3558" stroke="#00f0ff" strokeWidth="1" />

          {/* Kyushu */}
          <path d="M 245,395 L 268,390 L 275,418 L 255,425 Z" />
          {/* Shikoku */}
          <path d="M 280,390 L 305,385 L 308,402 L 285,405 Z" />
          {/* Honshu (Curved Main Island) */}
          <path d="
            M 265,378 
            L 295,372 
            L 325,365 
            L 358,355 
            L 375,325 
            L 372,285 
            L 360,295 
            L 340,340 
            L 305,355 
            L 275,370 Z
          " />
          {/* Hokkaido */}
          <path d="M 370,270 L 400,240 L 420,245 L 405,280 L 378,282 Z" />

          <text x="320" y="380" fill="#94a3b8" fontSize="9" fontFamily="sans-serif" fontWeight="bold">
            일본
          </text>
        </g>

        {/* 4. NORTH PACIFIC OCEAN FEATURES */}
        <g stroke="#1b304c" strokeWidth="1" fill="#152438">
          {/* Hawaiian Islands */}
          <ellipse cx="730" cy="445" rx="5" ry="3" fill="#1d3554" stroke="#38bdf8" />
          <ellipse cx="750" cy="452" rx="6" ry="3.5" fill="#1d3554" stroke="#38bdf8" />
          <ellipse cx="770" cy="460" rx="7" ry="4.5" fill="#1d3554" stroke="#38bdf8" />
          <text x="785" y="465" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            HAWAII
          </text>

          {/* Aleutian Chain */}
          <circle cx="510" cy="180" r="2.5" />
          <circle cx="570" cy="165" r="3" />
          <circle cx="640" cy="155" r="3" />
          <circle cx="720" cy="150" r="3.5" />
          <circle cx="810" cy="155" r="3.5" />
          <circle cx="890" cy="165" r="4" />
        </g>

        {/* 5. NORTH AMERICAN CONTINENT (USA & State Geography from Image 5) */}
        <g fill="#101c30" stroke="#294875" strokeWidth="1.5">
          {/* Alaska & Canadian Coast */}
          <path d="
            M 890,165 
            L 960,110 
            L 1010,80 
            L 1045,140 
            L 1020,180 
            L 950,195 Z
          " />

          {/* Contiguous United States Mainland (Accurate Western Coastline) */}
          <path d="
            M 1045,140 
            L 1450,140 
            L 1450,700 
            L 1280,700 
            L 1325,540 
            L 1350,470 
            L 1290,450 
            L 1240,460 
            L 1180,450 
            L 1140,500 
            L 1105,445 
            L 1090,410 
            L 1075,410 
            L 1065,388 
            L 1052,365 
            L 1042,330 
            L 1040,295 
            L 1048,260 
            L 1055,220 
            L 1030,190 
            L 1045,140 Z
          " />

          {/* Baja California (Mexico) */}
          <path d="M 1090,410 L 1120,490 L 1128,515 L 1112,505 L 1098,440 Z" fill="#0c1626" stroke="#223c60" />

          {/* Florida Peninsula */}
          <path d="M 1335,450 L 1360,485 L 1355,515 L 1340,510 L 1330,465 Z" fill="#122036" />

          {/* GREAT LAKES (Superior, Michigan, Huron, Erie) */}
          {/* Lake Superior */}
          <ellipse cx="1225" cy="225" rx="26" ry="11" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />
          {/* Lake Michigan (North-South elongation to Chicago) */}
          <path d="M 1250,240 Q 1256,265 1258,285 Q 1246,285 1242,255 Z" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />
          {/* Lake Huron */}
          <ellipse cx="1285" cy="245" rx="16" ry="14" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />
          {/* Lake Erie */}
          <ellipse cx="1310" cy="278" rx="18" ry="7" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />

          {/* US State Borders (WA, OR, CA, NV, AZ, UT, ID) based on Image 5 */}
          <g stroke="#1e3555" strokeWidth="1" strokeDasharray="2 2">
            {/* WA/OR Border */}
            <line x1="1052" y1="242" x2="1140" y2="242" />
            {/* OR/CA Border (42°N) */}
            <line x1="1040" y1="282" x2="1140" y2="282" />
            {/* CA/NV Diagonal Border */}
            <line x1="1140" y1="282" x2="1140" y2="330" />
            <line x1="1140" y1="330" x2="1080" y2="400" />
            {/* NV/UT Border */}
            <line x1="1140" y1="282" x2="1195" y2="282" />
            <line x1="1195" y1="282" x2="1195" y2="365" />
            {/* AZ/UT Border */}
            <line x1="1140" y1="365" x2="1220" y2="365" />
            {/* CA/AZ Border (Colorado River) */}
            <line x1="1080" y1="400" x2="1105" y2="445" />
          </g>

          {/* Region Label */}
          <text x="1100" y="440" fill="#2d527c" fontSize="12" fontFamily="sans-serif" fontWeight="bold">
            미합중국 (USA)
          </text>
        </g>

        {/* Tactical Latitude/Longitude Lines */}
        <g stroke="#112238" strokeWidth="1" strokeDasharray="3 3">
          <line x1="0" y1="180" x2="1440" y2="180" />
          <line x1="0" y1="350" x2="1440" y2="350" />
          <line x1="0" y1="520" x2="1440" y2="520" />
          <line x1="330" y1="0" x2="330" y2="700" />
          <line x1="650" y1="0" x2="650" y2="700" />
          <line x1="970" y1="0" x2="970" y2="700" />
          <line x1="1250" y1="0" x2="1250" y2="700" />
        </g>

        <text x="580" y="370" fill="#182d47" fontSize="24" fontFamily="monospace" fontWeight="900" letterSpacing="10">
          NORTH PACIFIC OCEAN (북태평양)
        </text>

        {/* ======================================================== */}
        {/* PURE WATER MARITIME & AVIATION ROUTES                    */}
        {/* ======================================================== */}

        {/* 1. Pure Sea Route: Incheon -> Yellow Sea -> Korea Strait -> Pacific -> Long Beach Harbor */}
        <g opacity={includedCategories.transit ? 1 : 0.2}>
          <path 
            d={ROUTE_PATHS.SEA_PACIFIC} 
            fill="none" 
            stroke="#00f0ff" 
            strokeWidth="3.5" 
            strokeOpacity="0.15" 
          />
          <path 
            d={ROUTE_PATHS.SEA_PACIFIC} 
            fill="none" 
            stroke="url(#oceanRouteGrad)" 
            strokeWidth="2.2" 
            strokeDasharray="6 4" 
          />
        </g>

        {/* 2. US Inland Rail Route: Long Beach (Coast) -> Kokomo */}
        <g opacity={includedCategories.transit || includedCategories.kokomo ? 1 : 0.2}>
          <path 
            d={ROUTE_PATHS.INLAND_RAIL} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="4" 
            strokeOpacity="0.2" 
          />
          <path 
            d={ROUTE_PATHS.INLAND_RAIL} 
            fill="none" 
            stroke="url(#inlandRouteGrad)" 
            strokeWidth="2.2" 
            strokeDasharray="5 3" 
          />
        </g>

        {/* 3. Air Cargo Route: Incheon Airport -> Aleutian Arc -> Chicago ORD */}
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

        {/* Route Guidance Text (Placed strictly on the open ocean) */}
        <text x="560" y="340" fill="#00f0ff" opacity="0.8" fontSize="11" fontFamily="monospace" fontWeight="bold">
          해상 운송로 (황해 ➔ 대한해협 ➔ 북태평양 ➔ 롱비치항) ➔
        </text>
        <text x="560" y="125" fill="#38bdf8" opacity="0.8" fontSize="11" fontFamily="monospace" fontWeight="bold">
          대권비행 항공화물로 (인천공항 ➔ 시카고 ORD ➔ 코코모) ➔
        </text>
        <text x="1130" y="335" fill="#10b981" opacity="0.85" fontSize="10" fontFamily="monospace" fontWeight="bold">
          미국 내륙 철도/트럭
        </text>
      </svg>

      {/* ======================================================== */}
      {/* 3. DYNAMIC TRANSIT CARRIERS                              */}
      {/* ======================================================== */}
      <div className={\`absolute inset-0 pointer-events-auto transition-opacity duration-200 \${includedCategories.transit ? 'opacity-100' : 'opacity-25'}\`}>
        {shipments.map((shipment) => {
          const pos = getShipmentPosition(shipment);
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
          onOpenLotDetails={onOpenLotDetails}
          includedCategories={includedCategories}
        />
      </div>

      {/* Map Legend at Bottom Left */}
      <div className="absolute bottom-3 left-3 bg-[#0a111e]/95 border border-slate-700 p-2.5 rounded font-mono text-[11px] text-slate-200 space-y-1 backdrop-blur-sm z-20 shadow-lg">
        <div className="font-bold text-cyan-400 border-b border-slate-700 pb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-cyan-400 inline-block"></span>
          <span>물류 운송 모드 범례</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 bg-cyan-400 inline-block"></span>
          <span>해상 운송로 (황해 ➔ 대한해협 ➔ 태평양 ➔ 롱비치)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 bg-sky-400 inline-block border-t border-dotted"></span>
          <span>항공 운송로 (인천 ➔ 시카고 ➔ 코코모)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 bg-emerald-400 inline-block"></span>
          <span>미 내륙 화물철도 (롱비치 ➔ 코코모 법인)</span>
        </div>
      </div>

    </div>
  );
}
`;

fs.writeFileSync(path.resolve('./src/components/RetroWorldMap.jsx'), mapContent, 'utf8');
console.log('RetroWorldMap.jsx completely updated with precision map.');
