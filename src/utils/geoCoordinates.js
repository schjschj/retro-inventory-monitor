// Geographically Precise Pacific-Centered Coordinates (1600 x 700 SVG canvas)
// Modeled after actual satellite/Google Maps Pacific projection with wide US margins
export const MAP_DIMENSIONS = {
  width: 1600,
  height: 700
};

export const KEY_NODES = {
  INCHEON: {
    id: 'INCHEON',
    name: '인천 사업장 (KR)',
    shortName: '인천',
    // Gyeonggi Bay on northwest coast of South Korea
    x: 180,
    y: 325,
    type: 'HUB_KR',
    region: '대한민국 인천'
  },
  WEST_COAST_PORT: {
    id: 'WEST_COAST_PORT',
    name: 'LA / 롱비치 항만 (US)',
    shortName: 'LA/롱비치항',
    // Southern California coastline on shifted US map
    x: 1150,
    y: 275,
    type: 'PORT',
    region: '미국 캘리포니아 연안'
  },
  MIDWEST_AIRPORT: {
    id: 'MIDWEST_AIRPORT',
    name: '시카고 오헤어 공항 (ORD)',
    shortName: '시카고(ORD)',
    // Near south tip of Lake Michigan, widely separated from Kokomo
    x: 1395,
    y: 145,
    type: 'AIRPORT',
    region: '미국 중서부 일리노이'
  },
  KOKOMO: {
    id: 'KOKOMO',
    name: '미주법인 (코코모, 인디애나)',
    shortName: '코코모 법인',
    // Indiana: endpoint of the inland rail route, separated south of ORD
    x: 1425,
    y: 230,
    type: 'HUB_US',
    region: '미국 인디애나 코코모'
  },
  SPE: {
    id: 'SPE',
    name: '고객 SPE 사업장',
    shortName: '고객 SPE',
    // Positioned in Mid-Atlantic / Northeast customer cluster well above Kokomo
    x: 1485,
    y: 115,
    type: 'CUSTOMER',
    region: '미국 고객사 생산라인'
  }
};

// Pure Maritime Waypoints: Incheon Port -> West Sea -> South of Japan -> Pacific -> Long Beach Harbor
export const SEA_WAYPOINTS = [
  { x: 180, y: 325 }, // Incheon Port (sea level)
  { x: 165, y: 360 }, // West Sea (Yellow Sea) offshore
  { x: 165, y: 395 }, // West Sea south of Mokpo
  { x: 195, y: 430 }, // South Sea / Jeju Strait
  { x: 235, y: 448 }, // South of Korea, rounding cleanly below Kyushu
  { x: 290, y: 450 }, // Pacific waters south of Shikoku
  { x: 360, y: 445 }, // Pacific waters south of Honshu (clear of land)
  { x: 470, y: 415 }, // North Pacific maritime highway
  { x: 700, y: 380 }, // Mid-Pacific
  { x: 940, y: 370 }, // East Pacific
  { x: 1100, y: 290 }, // California offshore waters
  { x: 1150, y: 275 }  // Long Beach Harbor dock (on ocean shoreline!)
];

// Inland Rail Waypoints: Long Beach Harbor -> Cajon Pass -> Southwest -> Rockies -> Kokomo, IN (Route termination!)
export const RAIL_WAYPOINTS = [
  { x: 1150, y: 275 }, // Long Beach Harbor (Dock)
  { x: 1200, y: 260 }, // Cajon Pass / Mojave
  { x: 1270, y: 240 }, // New Mexico / Colorado
  { x: 1350, y: 235 }, // Illinois / Midwest
  { x: 1425, y: 230 }  // Kokomo Facility (Indiana - EXACT ROUTE ENDPOINT)
];

// Air Waypoints: Incheon Airport -> Aleutians -> Chicago ORD -> Kokomo
export const AIR_WAYPOINTS = [
  { x: 180, y: 320 }, // Incheon Airport
  { x: 440, y: 190 }, // North of Japan
  { x: 720, y: 130 }, // Aleutian Islands Great Circle Arc
  { x: 1040, y: 100 }, // Western Canada high arc
  { x: 1290, y: 125 }, // Upper Midwest
  { x: 1395, y: 145 }, // Chicago O'Hare (ORD)
  { x: 1425, y: 230 }  // Kokomo Facility (Indiana)
];

// Calculate point along waypoints polyline
function getPointOnPolyline(waypoints, t) {
  if (waypoints.length === 0) return { x: 0, y: 0 };
  if (waypoints.length === 1 || t <= 0) return waypoints[0];
  if (t >= 1) return waypoints[waypoints.length - 1];

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

export function waypointsToSvgPath(waypoints) {
  if (!waypoints || waypoints.length === 0) return '';
  let d = `M ${waypoints[0].x} ${waypoints[0].y}`;
  for (let i = 1; i < waypoints.length; i++) {
    d += ` L ${waypoints[i].x} ${waypoints[i].y}`;
  }
  return d;
}

export const ROUTE_PATHS = {
  SEA_PACIFIC: waypointsToSvgPath(SEA_WAYPOINTS),
  INLAND_RAIL: waypointsToSvgPath(RAIL_WAYPOINTS),
  AIR_FLIGHT: waypointsToSvgPath(AIR_WAYPOINTS)
};

export function isNearAnyNode(x, y, radius = 45) {
  for (const key of Object.keys(KEY_NODES)) {
    const node = KEY_NODES[key];
    const dx = node.x - x;
    const dy = node.y - y;
    if (Math.sqrt(dx * dx + dy * dy) <= radius) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates current real-time position along maritime or air route.
 * At Long Beach (ocean threshold ~70%), the icon automatically switches to TRAIN!
 * The train terminates exactly inside Kokomo at progress = 100%!
 * Returns isNearNode so the vehicle dims and stays behind hub cards!
 */
export function getShipmentPosition(shipment) {
  const progress = Math.max(0, Math.min(100, Number(shipment.progress) || 0)) / 100;

  if (shipment.type === 'SEA') {
    // 0% ~ 70%: Ocean vessel from Incheon to Long Beach Harbor
    // 70% ~ 100%: Freight train from Long Beach Harbor to Kokomo (Route Endpoint)
    if (progress < 0.70) {
      const oceanT = progress / 0.70;
      const pt = getPointOnPolyline(SEA_WAYPOINTS, oceanT);
      const near = isNearAnyNode(pt.x, pt.y, 45) || progress <= 0.04 || progress >= 0.67;
      return {
        x: pt.x,
        y: pt.y,
        mode: 'SHIP',
        stageLabel: oceanT <= 0.15 ? '서해(황해) 출항 남하 중' : oceanT <= 0.3 ? '대한해협(쓰시마) 통과 중' : '태평양 해상 횡단 중 (선박)',
        leg: 'OCEAN',
        isNearNode: near
      };
    } else {
      const railT = Math.min(1, (progress - 0.70) / 0.30);
      const pt = getPointOnPolyline(RAIL_WAYPOINTS, railT);
      const near = isNearAnyNode(pt.x, pt.y, 45) || progress >= 0.96 || (progress >= 0.69 && progress <= 0.73);
      const isTruck = shipment.inlandMode === 'TRUCK';
      return {
        x: pt.x,
        y: pt.y,
        mode: isTruck ? 'TRUCK' : 'TRAIN', // Automatically switch from SHIP to TRAIN or TRUCK at Long Beach!
        stageLabel: progress >= 1 
          ? '코코모 법인 입고 완료' 
          : isTruck 
            ? '롱비치항 환적 ➔ 코코모 육로 트럭 운송 중' 
            : '롱비치항 환적 ➔ 코코모 내륙 철도 운송 중',
        leg: 'INLAND',
        isNearNode: near
      };
    }
  }

  if (shipment.type === 'AIR') {
    // 0% ~ 85%: Cargo Flight to Chicago
    // 85% ~ 100%: Truck from Chicago to Kokomo
    if (progress < 0.85) {
      const airT = progress / 0.85;
      const pt = getPointOnPolyline(AIR_WAYPOINTS.slice(0, 6), airT);
      const near = isNearAnyNode(pt.x, pt.y, 45) || progress <= 0.04 || progress >= 0.82;
      return {
        x: pt.x,
        y: pt.y,
        mode: 'PLANE',
        stageLabel: '북태평양 상공 항공 운송 중 (화물기)',
        leg: 'AIR',
        isNearNode: near
      };
    } else {
      const groundT = Math.min(1, (progress - 0.85) / 0.15);
      const pt = getPointOnPolyline([AIR_WAYPOINTS[5], AIR_WAYPOINTS[6]], groundT);
      const near = isNearAnyNode(pt.x, pt.y, 45) || progress >= 0.96;
      return {
        x: pt.x,
        y: pt.y,
        mode: 'TRUCK',
        stageLabel: progress >= 1 ? '코코모 법인 입고 완료' : '시카고 공항 ➔ 코코모 법인 직송 중',
        leg: 'INLAND',
        isNearNode: near
      };
    }
  }

  return { x: 180, y: 325, mode: 'SHIP', stageLabel: '인천 출항 대기', leg: 'PRE_DEPARTURE', isNearNode: true };
}
