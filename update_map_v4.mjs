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
      
      {/* 1. Tactical Retro Background Grid */}
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
        <span>PACIFIC STRATEGIC GRID [120°E - 65°W] // FULL CONTINENTAL OVERVIEW</span>
      </div>
      <div className="absolute top-2 right-4 text-[11px] font-mono text-emerald-400 font-bold pointer-events-none z-10 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>미국 전역 공급망 개방 뷰</span>
      </div>

      {/* 2. Scaled Pacific-Centered World Map (1600 x 700) */}
      <svg 
        viewBox="0 0 1600 700" 
        className="w-full h-full absolute inset-0 preserve-3d"
      >
        <defs>
          <linearGradient id="oceanRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="inlandRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="airRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Deep Ocean Water Tint */}
        <rect width="1600" height="700" fill="#08101e" />

        {/* ======================================================== */}
        {/* 1. ASIAN MAINLAND (China, Russia/Siberia)                */}
        {/* ======================================================== */}
        <g fill="#0e1728" stroke="#1e3350" strokeWidth="1.5">
          <path d="
            M -10,0 
            L 260,0 
            L 255,100 
            L 225,160 
            L 200,215 
            L 170,250 
            L 130,248 
            L 95,265 
            L 108,295 
            L 138,308 
            L 122,335 
            L 110,362 
            L 132,382 
            L 142,430 
            L 120,490 
            L 95,560 
            L 75,700 
            L -10,700 Z
          " />
          {/* Shandong Peninsula */}
          <path d="M 108,295 Q 140,308 135,328 L 115,335 Z" fill="#122036" />
          {/* Taiwan */}
          <path d="M 128,500 L 140,490 L 144,518 L 132,530 Z" fill="#122036" stroke="#223c60" strokeWidth="1.2" />
          {/* Kamchatka */}
          <path d="M 400,110 L 450,100 L 470,160 L 440,190 L 425,140 Z" fill="#0f1a2c" stroke="#223c60" strokeWidth="1.2" />
        </g>

        {/* ======================================================== */}
        {/* 2. THE KOREAN PENINSULA (Precise & Recognizable)         */}
        {/* ======================================================== */}
        <g>
          {/* Korean Peninsula Body */}
          <path d="
            M 164,270 
            Q 180,265 205,268 
            L 212,295 
            L 214,325 
            L 222,360 
            L 216,380 
            L 194,388 
            L 180,378 
            L 172,362 
            L 176,342 
            L 180,325 
            L 168,302 
            L 164,280 Z
          " fill="#1b3558" stroke="#00f0ff" strokeWidth="2.2" />

          {/* Gyeonggi Bay Incheon indentation */}
          <path d="M 180,325 Q 174,325 172,335" stroke="#00f0ff" strokeWidth="1.5" fill="none" />

          {/* Jeju Island */}
          <ellipse cx="180" cy="415" rx="9" ry="5.5" fill="#1b3558" stroke="#00f0ff" strokeWidth="1.5" />
          {/* Ulleungdo & Dokdo */}
          <circle cx="238" cy="330" r="3" fill="#00f0ff" />
          <circle cx="250" cy="334" r="2" fill="#00f0ff" />

          {/* Korean Country Label */}
          <rect x="166" y="285" width="60" height="15" fill="#0c182a" rx="2" stroke="#00f0ff" strokeWidth="0.8" />
          <text x="196" y="296" fill="#00f0ff" fontSize="9.5" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
            대한민국
          </text>
          <text x="235" y="360" fill="#38bdf8" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" opacity="0.8">
            동해
          </text>
          <text x="140" y="350" fill="#38bdf8" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" opacity="0.8">
            서해(황해)
          </text>
        </g>

        {/* ======================================================== */}
        {/* 3. JAPANESE ARCHIPELAGO                                  */}
        {/* ======================================================== */}
        <g fill="#14243b" stroke="#26436b" strokeWidth="1.5">
          <ellipse cx="235" cy="402" rx="3" ry="5" fill="#1b3558" stroke="#00f0ff" strokeWidth="1" />
          {/* Kyushu */}
          <path d="M 242,408 L 265,402 L 272,430 L 252,438 Z" />
          {/* Shikoku */}
          <path d="M 276,402 L 302,398 L 305,415 L 282,418 Z" />
          {/* Honshu */}
          <path d="
            M 262,390 
            L 292,385 
            L 322,378 
            L 355,368 
            L 372,338 
            L 368,298 
            L 356,308 
            L 336,352 
            L 302,368 
            L 272,382 Z
          " />
          {/* Hokkaido */}
          <path d="M 368,282 L 398,252 L 418,258 L 402,292 L 375,295 Z" />
          <text x="315" y="395" fill="#94a3b8" fontSize="9" fontFamily="sans-serif" fontWeight="bold">
            일본
          </text>
        </g>

        {/* ======================================================== */}
        {/* 4. NORTH PACIFIC OCEAN FEATURES                          */}
        {/* ======================================================== */}
        <g stroke="#1b304c" strokeWidth="1" fill="#152438">
          {/* Hawaiian Islands */}
          <ellipse cx="680" cy="455" rx="5" ry="3" fill="#1d3554" stroke="#38bdf8" />
          <ellipse cx="700" cy="462" rx="6" ry="3.5" fill="#1d3554" stroke="#38bdf8" />
          <ellipse cx="720" cy="470" rx="7" ry="4.5" fill="#1d3554" stroke="#38bdf8" />
          <text x="735" y="475" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            HAWAII
          </text>

          {/* Aleutian Chain */}
          <circle cx="510" cy="180" r="2.5" />
          <circle cx="580" cy="165" r="3" />
          <circle cx="650" cy="155" r="3" />
          <circle cx="730" cy="150" r="3.5" />
          <circle cx="820" cy="155" r="3.5" />
          <circle cx="910" cy="165" r="4" />
        </g>

        {/* ======================================================== */}
        {/* 5. UNITED STATES OF AMERICA (FULL CONTINENT SCALE)       */}
        {/* Comfortably proportioned with wide margins on the right! */}
        {/* ======================================================== */}
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

          {/* Mainland United States (West Coast -> Midwest -> Atlantic East Coast) */}
          <path d="
            M 1045,140 
            L 1460,140 
            L 1460,250 
            L 1445,300 
            L 1415,360 
            L 1385,420 
            L 1380,480 
            L 1360,520 
            L 1345,510 
            L 1335,465 
            L 1285,455 
            L 1235,465 
            L 1175,455 
            L 1130,500 
            L 1095,445 
            L 1080,410 
            L 1065,405 
            L 1055,378 
            L 1045,355 
            L 1032,320 
            L 1035,290 
            L 1038,255 
            L 1042,210 
            L 1025,185 
            L 1045,140 Z
          " />

          {/* Baja California (Mexico) */}
          <path d="M 1080,410 L 1110,490 L 1118,515 L 1102,505 L 1088,440 Z" fill="#0c1626" stroke="#223c60" />

          {/* GREAT LAKES (Superior, Michigan, Huron, Erie) */}
          {/* Lake Superior */}
          <ellipse cx="1240" cy="215" rx="28" ry="11" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />
          {/* Lake Michigan (North-South elongation to Chicago) */}
          <path d="M 1270,230 Q 1276,255 1278,280 Q 1266,280 1262,250 Z" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />
          {/* Lake Huron */}
          <ellipse cx="1305" cy="240" rx="16" ry="14" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />
          {/* Lake Erie */}
          <ellipse cx="1335" cy="272" rx="18" ry="7" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />

          {/* US State Borders (WA, OR, CA, NV, AZ, UT, ID) based on Image 5 */}
          <g stroke="#1e3555" strokeWidth="1" strokeDasharray="2 2">
            <line x1="1042" y1="235" x2="1125" y2="235" />
            <line x1="1038" y1="275" x2="1125" y2="275" />
            <line x1="1125" y1="275" x2="1125" y2="320" />
            <line x1="1125" y1="320" x2="1070" y2="390" />
            <line x1="1125" y1="275" x2="1175" y2="275" />
            <line x1="1175" y1="275" x2="1175" y2="355" />
            <line x1="1125" y1="355" x2="1200" y2="355" />
          </g>

          {/* Country & Regional Labels */}
          <text x="1100" y="440" fill="#2d527c" fontSize="12" fontFamily="sans-serif" fontWeight="bold">
            미합중국 (USA)
          </text>
          <text x="1310" y="240" fill="#3b6394" fontSize="9" fontFamily="sans-serif" fontWeight="bold">
            오대호 (Great Lakes)
          </text>
        </g>

        {/* Tactical Longitude Grid Lines */}
        <g stroke="#112238" strokeWidth="1" strokeDasharray="3 3">
          <line x1="0" y1="180" x2="1600" y2="180" />
          <line x1="0" y1="350" x2="1600" y2="350" />
          <line x1="0" y1="520" x2="1600" y2="520" />
          <line x1="330" y1="0" x2="330" y2="700" />
          <line x1="700" y1="0" x2="700" y2="700" />
          <line x1="1050" y1="0" x2="1050" y2="700" />
          <line x1="1350" y1="0" x2="1350" y2="700" />
        </g>

        <text x="580" y="370" fill="#182d47" fontSize="26" fontFamily="monospace" fontWeight="900" letterSpacing="10">
          NORTH PACIFIC OCEAN (북태평양)
        </text>

        {/* ======================================================== */}
        {/* LOGISTICS ROUTES                                         */}
        {/* ======================================================== */}

        {/* 1. Sea Route: Incheon -> Yellow Sea -> Korea Strait -> Pacific -> Long Beach Harbor */}
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

        {/* 2. US Inland Rail: Long Beach Harbor -> Cajon Pass -> Kokomo Facility (Exact termination!) */}
        <g opacity={includedCategories.transit || includedCategories.kokomo ? 1 : 0.2}>
          <path 
            d={ROUTE_PATHS.INLAND_RAIL} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="4" 
            strokeOpacity="0.25" 
          />
          <path 
            d={ROUTE_PATHS.INLAND_RAIL} 
            fill="none" 
            stroke="url(#inlandRouteGrad)" 
            strokeWidth="2.4" 
            strokeDasharray="5 3" 
          />
        </g>

        {/* 3. Air Cargo: Incheon -> Aleutians -> Chicago -> Kokomo */}
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

        {/* Guidance Text */}
        <text x="560" y="340" fill="#00f0ff" opacity="0.8" fontSize="11" fontFamily="monospace" fontWeight="bold">
          해상 운송로 (황해 ➔ 대한해협 ➔ 북태평양 ➔ 롱비치항) ➔
        </text>
        <text x="560" y="125" fill="#38bdf8" opacity="0.8" fontSize="11" fontFamily="monospace" fontWeight="bold">
          대권비행 항공화물로 (인천공항 ➔ 시카고 ORD ➔ 코코모) ➔
        </text>
        <text x="1115" y="325" fill="#10b981" opacity="0.9" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
          미국 내륙 화물철도 (롱비치 ➔ 코코모 직결) ➔
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
          <span>미 내륙 화물철도 (롱비치항 ➔ 코코모 법인 종점)</span>
        </div>
      </div>

    </div>
  );
}
`;

fs.writeFileSync(path.resolve('./src/components/RetroWorldMap.jsx'), mapContent, 'utf8');
console.log('RetroWorldMap.jsx successfully updated with 1600x700 scaled map.');
