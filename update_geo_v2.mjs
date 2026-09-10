import fs from 'fs';
import path from 'path';

const geoContent = `// Geographically Precise Pacific-Centered Coordinates (1440 x 700 SVG canvas)
// Modeled after actual satellite/Google Maps Pacific projection
export const MAP_DIMENSIONS = {
  width: 1440,
  height: 700
};

export const KEY_NODES = {
  INCHEON: {
    id: 'INCHEON',
    name: '인천 사업장 (KR)',
    shortName: '인천',
    // Exact location: Gyeonggi Bay on northwest coast of South Korea
    x: 186,
    y: 312,
    type: 'HUB_KR',
    region: '대한민국 인천'
  },
  WEST_COAST_PORT: {
    id: 'WEST_COAST_PORT',
    name: 'LA / 롱비치 항만 (US)',
    shortName: 'LA/롱비치항',
    // Exact location: Southern California ocean coastline (Touching water, NOT inland!)
    x: 1065,
    y: 388,
    type: 'PORT',
    region: '미국 캘리포니아 연안'
  },
  MIDWEST_AIRPORT: {
    id: 'MIDWEST_AIRPORT',
    name: '시카고 오헤어 공항 (ORD)',
    shortName: '시카고(ORD)',
    x: 1258,
    y: 282,
    type: 'AIRPORT',
    region: '미국 중서부 일리노이'
  },
  KOKOMO: {
    id: 'KOKOMO',
    name: '미주법인 (코코모, 인디애나)',
    shortName: '코코모 법인',
    // Exact location: Indiana, just south of Lake Michigan/Chicago
    x: 1272,
    y: 298,
    type: 'HUB_US',
    region: '미국 인디애나 코코모'
  },
  SPE: {
    id: 'SPE',
    name: '고객 SPE 사업장',
    shortName: '고객 SPE',
    // Exact location: Midwest / Customer cluster (Static inventory hub)
    x: 1325,
    y: 310,
    type: 'CUSTOMER',
    region: '미국 고객사 생산라인'
  }
};

// Pure Maritime & Aviation Waypoints (Zero land cutting!)
// Sea route: Incheon Port -> South through Yellow Sea -> Korea/Tsushima Strait -> Pacific -> Long Beach Harbor
export const SEA_WAYPOINTS = [
  { x: 186, y: 312 }, // Incheon Port
  { x: 172, y: 345 }, // West Sea (Yellow Sea) offshore
  { x: 172, y: 382 }, // West Sea south of Mokpo
  { x: 198, y: 412 }, // South Sea / Jeju Strait
  { x: 238, y: 405 }, // Korea/Tsushima Strait (between Busan and Kyushu)
  { x: 330, y: 415 }, // South of Japan into Pacific
  { x: 440, y: 405 }, // North Pacific maritime highway
  { x: 650, y: 365 }, // Mid-Pacific
  { x: 880, y: 375 }, // East Pacific
  { x: 1025, y: 395 }, // California offshore waters
  { x: 1065, y: 388 }  // Long Beach Harbor dock (at coastal shoreline!)
];

// Inland Rail Waypoints: Long Beach Port -> Inland across Southwest -> Kokomo, IN
export const RAIL_WAYPOINTS = [
  { x: 1065, y: 388 }, // Long Beach Harbor
  { x: 1105, y: 375 }, // Cajon Pass / Mojave
  { x: 1165, y: 345 }, // Rocky Mountain pass / New Mexico
  { x: 1220, y: 315 }, // Great Plains / Illinois
  { x: 1272, y: 298 }  // Kokomo, Indiana
];

// Air Waypoints: Incheon Airport -> Aleutian Arc -> Chicago ORD -> Kokomo
export const AIR_WAYPOINTS = [
  { x: 186, y: 308 }, // Incheon Airport
  { x: 400, y: 195 }, // North of Japan
  { x: 620, y: 135 }, // Aleutian Islands Great Circle Arc
  { x: 920, y: 155 }, // Western Canada high arc
  { x: 1150, y: 225 }, // Upper Midwest
  { x: 1258, y: 282 }, // Chicago O'Hare (ORD)
  { x: 1272, y: 298 }  // Kokomo Facility
];

// Calculate point along multi-point polyline by progress (0 to 1)
function getPointOnPolyline(waypoints, t) {
  if (waypoints.length === 0) return { x: 0, y: 0 };
  if (waypoints.length === 1 || t <= 0) return waypoints[0];
  if (t >= 1) return waypoints[waypoints.length - 1];

  // Total length calculation
  let totalLength = 0;
  const segmentLengths = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1].x - waypoints[i].x;
    const dy = waypoints[i + 1].y - waypoints[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(len);
    totalLength += len;
  }

  const targetDist = t * totalLength;
  let accumulated = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    if (accumulated + segmentLengths[i] >= targetDist) {
      const segT = (targetDist - accumulated) / segmentLengths[i];
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      return {
        x: p1.x + segT * (p2.x - p1.x),
        y: p1.y + segT * (p2.y - p1.y)
      };
    }
    accumulated += segmentLengths[i];
  }

  return waypoints[waypoints.length - 1];
}

// Convert waypoints array into smooth SVG path d attribute
export function waypointsToSvgPath(waypoints) {
  if (!waypoints || waypoints.length === 0) return '';
  let d = \`M \${waypoints[0].x} \${waypoints[0].y}\`;
  for (let i = 1; i < waypoints.length; i++) {
    d += \` L \${waypoints[i].x} \${waypoints[i].y}\`;
  }
  return d;
}

export const ROUTE_PATHS = {
  SEA_PACIFIC: waypointsToSvgPath(SEA_WAYPOINTS),
  INLAND_RAIL: waypointsToSvgPath(RAIL_WAYPOINTS),
  AIR_FLIGHT: waypointsToSvgPath(AIR_WAYPOINTS)
};

/**
 * Calculates current real-time position along the pure maritime or air route.
 * Strictly navigates within the ocean and coastal ports!
 */
export function getShipmentPosition(shipment) {
  const progress = Math.max(0, Math.min(100, Number(shipment.progress) || 0)) / 100;

  if (shipment.type === 'SEA') {
    // 0% ~ 76%: Pure ocean voyage from Incheon to Long Beach
    // 76% ~ 100%: Inland rail from Long Beach to Kokomo
    if (progress <= 0.76) {
      const oceanT = progress / 0.76;
      const pt = getPointOnPolyline(SEA_WAYPOINTS, oceanT);
      return {
        x: pt.x,
        y: pt.y,
        mode: 'SHIP',
        stageLabel: oceanT <= 0.15 ? '서해(황해) 출항 남하 중' : oceanT <= 0.3 ? '대한해협(쓰시마) 통과 중' : '태평양 해상 횡단 중 (선박)',
        leg: 'OCEAN'
      };
    } else {
      const railT = (progress - 0.76) / 0.24;
      const pt = getPointOnPolyline(RAIL_WAYPOINTS, railT);
      return {
        x: pt.x,
        y: pt.y,
        mode: 'TRAIN',
        stageLabel: '롱비치항 통관 후 내륙 철도 운송 중',
        leg: 'INLAND'
      };
    }
  }

  if (shipment.type === 'AIR') {
    // 0% ~ 88%: High altitude flight arc to Chicago
    // 88% ~ 100%: Chicago to Kokomo shuttle
    if (progress <= 0.88) {
      const airT = progress / 0.88;
      const pt = getPointOnPolyline(AIR_WAYPOINTS.slice(0, 6), airT);
      return {
        x: pt.x,
        y: pt.y,
        mode: 'PLANE',
        stageLabel: '북태평양 상공 항공 운송 중 (화물기)',
        leg: 'AIR'
      };
    } else {
      const groundT = (progress - 0.88) / 0.12;
      const pt = getPointOnPolyline([AIR_WAYPOINTS[5], AIR_WAYPOINTS[6]], groundT);
      return {
        x: pt.x,
        y: pt.y,
        mode: 'TRUCK',
        stageLabel: '시카고 공항 ➔ 코코모 법인 직송 중',
        leg: 'INLAND'
      };
    }
  }

  // Fallback
  return { x: 186, y: 312, mode: 'SHIP', stageLabel: '인천 출항 대기', leg: 'PRE_DEPARTURE' };
}
`;

fs.writeFileSync(path.resolve('./src/utils/geoCoordinates.js'), geoContent, 'utf8');
console.log('geoCoordinates.js updated with pure maritime waypoints.');
