import React from 'react';
import TransitCarrier from './TransitCarrier';
import NodeOverlay from './NodeOverlay';
import { ROUTE_PATHS, getShipmentPosition, KEY_NODES } from '../utils/geoCoordinates';
import { t } from '../utils/i18n';

export default function RetroWorldMap({
  shipments,
  incheonInventory,
  kokomoInventory,
  speInventory,
  onSelectShipment,
  onOpenLotDetails,
  includedCategories = { incheon: true, transit: true, kokomo: true, spe: true },
  lang = 'ko',
  showPhotos = true,
  commanderPhotos
}) {
  return (
    <div className="relative w-full h-[680px] bg-[#070d1a] border-2 border-[#1c2d42] overflow-hidden select-none shadow-2xl">
      
      {/* 1. Tactical Retro Background Grid */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00f0ff 1px, transparent 1px),
            linear-gradient(to bottom, #00f0ff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Coordinate HUD Labels */}
      <div className="absolute top-2 left-3 text-[11px] font-mono text-cyan-400 font-bold pointer-events-none z-10 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-400"></span>
        <span>{t('gridHeader', lang)}</span>
      </div>
      <div className="absolute top-2 right-4 text-[11px] font-mono text-emerald-400 font-bold pointer-events-none z-10 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>{t('supplyChainView', lang)}</span>
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
        {/* 5. NORTH AMERICA (CANADA & UNITED STATES FULL CONTINENT) */}
        {/* Shifted UPWARDS by 120px to provide ample space above HUD */}
        {/* ======================================================== */}
        <g id="north-america-continent" transform="translate(0, -120)" fill="#101c30" stroke="#294875" strokeWidth="1.5">
          {/* Alaska & North Pacific Coast */}
          <path d="
            M 890,165 
            L 960,110 
            L 1010,80 
            L 1045,140 
            L 1020,180 Z
          " />

          {/* Mainland United States (Shifted Eastward to eliminate empty space, East Coast stretches to X:1580) */}
          <path d="
            M 1140,140 
            L 1575,140 
            L 1580,250 
            L 1565,300 
            L 1540,365 
            L 1515,420 
            L 1500,480 
            L 1480,535 
            L 1460,530 
            L 1450,480 
            L 1400,470 
            L 1350,480 
            L 1290,470 
            L 1245,515 
            L 1210,460 
            L 1195,425 
            L 1175,420 
            L 1150,395 
            L 1140,370 
            L 1130,330 
            L 1132,295 
            L 1135,255 
            L 1138,210 
            L 1125,185 
            L 1140,140 Z
          " />

          {/* Baja California (Mexico) */}
          <path d="M 1175,420 L 1205,500 L 1212,525 L 1198,515 L 1182,450 Z" fill="#0c1626" stroke="#223c60" />

          {/* GREAT LAKES (Superior, Michigan, Huron, Erie) - Shifted with US continent */}
          {/* Lake Superior */}
          <ellipse cx="1355" cy="215" rx="30" ry="12" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />
          {/* Lake Michigan (North-South elongation to Chicago) */}
          <path d="M 1385,225 Q 1393,250 1395,275 Q 1383,275 1378,245 Z" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />
          {/* Lake Huron */}
          <ellipse cx="1425" cy="235" rx="18" ry="15" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />
          {/* Lake Erie */}
          <ellipse cx="1460" cy="265" rx="20" ry="8" fill="#08101e" stroke="#1e385c" strokeWidth="1.2" />

          {/* US State Borders shifted eastward */}
          <g stroke="#1e3555" strokeWidth="1" strokeDasharray="2 2">
            <line x1="1138" y1="235" x2="1225" y2="235" />
            <line x1="1135" y1="275" x2="1225" y2="275" />
            <line x1="1225" y1="275" x2="1225" y2="330" />
            <line x1="1225" y1="330" x2="1165" y2="400" />
            <line x1="1225" y1="275" x2="1290" y2="275" />
            <line x1="1290" y1="275" x2="1290" y2="370" />
            <line x1="1225" y1="370" x2="1320" y2="370" />
          </g>

          {/* Country & Regional Labels */}
          <text x="1200" y="440" fill="#2d527c" fontSize="12" fontFamily="sans-serif" fontWeight="bold">
            {t('usaMainland', lang)}
          </text>
          <text x="1425" y="225" fill="#3b6394" fontSize="9" fontFamily="sans-serif" fontWeight="bold">
            {t('greatLakes', lang)}
          </text>
        </g>

        {/* Tactical Longitude Grid Lines */}
        <g stroke="#112238" strokeWidth="1" strokeDasharray="3 3">
          <line x1="0" y1="180" x2="1600" y2="180" />
          <line x1="0" y1="350" x2="1600" y2="350" />
          <line x1="0" y1="520" x2="1600" y2="520" />
          <line x1="330" y1="0" x2="330" y2="700" />
          <line x1="700" y1="0" x2="700" y2="700" />
          <line x1="1140" y1="0" x2="1140" y2="700" />
          <line x1="1450" y1="0" x2="1450" y2="700" />
        </g>

        <text x="580" y="370" fill="#182d47" fontSize="24" fontFamily="monospace" fontWeight="900" letterSpacing="8">
          {t('pacificOcean', lang)}
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
        <text x="560" y="340" fill="#00f0ff" opacity="0.85" fontSize="11" fontFamily="monospace" fontWeight="bold">
          {t('routeSea', lang)}
        </text>
        <text x="560" y="125" fill="#38bdf8" opacity="0.85" fontSize="11" fontFamily="monospace" fontWeight="bold">
          {t('routeAir', lang)}
        </text>
        <text x="1115" y="265" fill="#10b981" opacity="0.95" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
          {t('routeRail', lang)}
        </text>
      </svg>

      {/* ======================================================== */}
      {/* 3. DYNAMIC TRANSIT CARRIERS                              */}
      {/* ======================================================== */}
      <div className={`absolute inset-0 pointer-events-auto transition-opacity duration-200 ${includedCategories.transit ? 'opacity-100' : 'opacity-25'}`}>
        {shipments.map((shipment) => {
          const pos = getShipmentPosition(shipment);
          return (
            <TransitCarrier
              key={shipment.id}
              shipment={shipment}
              position={pos}
              onSelectShipment={onSelectShipment}
              lang={lang}
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
          lang={lang}
          showPhotos={showPhotos}
          commanderPhotos={commanderPhotos}
        />
      </div>

      {/* Map Legend at Bottom Left */}
      <div className="absolute bottom-3 left-3 bg-[#0a111e]/95 border border-slate-700 p-2.5 rounded font-mono text-[11px] text-slate-200 space-y-1 backdrop-blur-sm z-20 shadow-lg">
        <div className="font-bold text-cyan-400 border-b border-slate-700 pb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-cyan-400 inline-block"></span>
          <span>{lang === 'en' ? 'Logistics Transport Mode Legend' : '물류 운송 모드 범례'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 bg-cyan-400 inline-block"></span>
          <span>{lang === 'en' ? 'Maritime Highway (Yellow Sea ➔ Pacific ➔ Long Beach)' : '해상 운송로 (황해 ➔ 대한해협 ➔ 태평양 ➔ 롱비치)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 bg-sky-400 inline-block border-t border-dotted"></span>
          <span>{lang === 'en' ? 'Air Cargo Route (Incheon ➔ ORD Chicago ➔ Kokomo)' : '항공 운송로 (인천 ➔ 시카고 ➔ 코코모)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 bg-emerald-400 inline-block"></span>
          <span>{lang === 'en' ? 'US Inland Freight Rail (Long Beach Port ➔ Kokomo Facility)' : '미 내륙 화물철도 (롱비치항 ➔ 코코모 법인 종점)'}</span>
        </div>
      </div>

    </div>
  );
}
