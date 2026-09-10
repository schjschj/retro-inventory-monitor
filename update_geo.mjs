import fs from 'fs';
import path from 'path';

const geoContent = `// Pacific-Centered Accurate Geographic Coordinates (1240 x 660 SVG canvas)
export const MAP_DIMENSIONS = {
  width: 1240,
  height: 660
};

export const KEY_NODES = {
  INCHEON: {
    id: 'INCHEON',
    name: '인천 사업장 (KR)',
    shortName: '인천',
    x: 165,
    y: 305,
    type: 'HUB_KR',
    region: '대한민국 인천'
  },
  WEST_COAST_PORT: {
    id: 'WEST_COAST_PORT',
    name: 'LA / 롱비치 항만 (US)',
    shortName: 'LA/롱비치항',
    x: 900,
    y: 375,
    type: 'PORT',
    region: '미국 캘리포니아'
  },
  MIDWEST_AIRPORT: {
    id: 'MIDWEST_AIRPORT',
    name: '시카고 오헤어 / 인디애나폴리스 공항',
    shortName: '시카고(ORD)',
    x: 1060,
    y: 275,
    type: 'AIRPORT',
    region: '미국 중서부'
  },
  KOKOMO: {
    id: 'KOKOMO',
    name: '미주법인 (코코모, 인디애나)',
    shortName: '코코모 법인',
    x: 1075,
    y: 298,
    type: 'HUB_US',
    region: '인디애나 코코모'
  },
  SPE: {
    id: 'SPE',
    name: '고객 SPE 사업장',
    shortName: '고객 SPE',
    x: 1120,
    y: 312,
    type: 'CUSTOMER',
    region: '고객사 생산라인'
  }
};

// Route SVG path definitions
export const ROUTE_PATHS = {
  // Pacific Maritime: Incheon -> Tsushima Strait -> North Pacific Arc -> LA Port
  SEA_PACIFIC: 'M 165 305 Q 210 370 320 340 Q 550 250 820 320 T 900 375',
  // US Inland Rail: LA Port -> Southwest / Rockies -> Midwest -> Kokomo
  INLAND_RAIL: 'M 900 375 Q 960 360 1020 325 T 1075 298',
  // Pacific Aviation: Incheon -> Aleutian Great Circle Arc -> Chicago -> Kokomo
  AIR_FLIGHT: 'M 165 305 Q 540 140 1060 275 L 1075 298',
  // Kokomo to SPE: Regional Highway Truck
  KOKOMO_TO_SPE: 'M 1075 298 Q 1100 302 1120 312'
};

// Bezier interpolation
export function getInterpolatedPoint(x1, y1, cx, cy, x2, y2, t) {
  const invT = 1 - t;
  const x = invT * invT * x1 + 2 * invT * t * cx + t * t * x2;
  const y = invT * invT * y1 + 2 * invT * t * cy + t * t * y2;
  return { x, y };
}

/**
 * Calculates current real-time position, heading, and dynamic sprite mode
 * Multi-modal leg transitions smoothly at designated realistic thresholds.
 */
export function getShipmentPosition(shipment, customSpeCoords = null) {
  const progress = Math.max(0, Math.min(100, Number(shipment.progress) || 0)) / 100;
  const speX = customSpeCoords?.x ?? KEY_NODES.SPE.x;
  const speY = customSpeCoords?.y ?? KEY_NODES.SPE.y;

  if (shipment.type === 'SEA') {
    // 0% ~ 75%: Pacific Ocean voyage (Vessel)
    // 75% ~ 100%: US Inland Rail/Truck (Train/Truck)
    if (progress <= 0.75) {
      const localT = progress / 0.75;
      const pt = getInterpolatedPoint(165, 305, 540, 240, 900, 375, localT);
      return {
        x: pt.x,
        y: pt.y,
        mode: 'SHIP',
        stageLabel: '태평양 해상 횡단 중 (선박)',
        leg: 'OCEAN'
      };
    } else {
      const localT = (progress - 0.75) / 0.25;
      const pt = getInterpolatedPoint(900, 375, 980, 335, 1075, 298, localT);
      return {
        x: pt.x,
        y: pt.y,
        mode: 'TRAIN',
        stageLabel: '미 서부항만 ➔ 코코모 내륙 철도/트럭 운송 중',
        leg: 'INLAND'
      };
    }
  }

  if (shipment.type === 'AIR') {
    // 0% ~ 85%: Great circle air cargo flight (Plane)
    // 85% ~ 100%: Airport to Kokomo facility shuttle truck
    if (progress <= 0.85) {
      const localT = progress / 0.85;
      const pt = getInterpolatedPoint(165, 305, 540, 140, 1060, 275, localT);
      return {
        x: pt.x,
        y: pt.y,
        mode: 'PLANE',
        stageLabel: '북태평양 상공 항공 운송 중 (화물기)',
        leg: 'AIR'
      };
    } else {
      const localT = (progress - 0.85) / 0.15;
      const pt = getInterpolatedPoint(1060, 275, 1068, 285, 1075, 298, localT);
      return {
        x: pt.x,
        y: pt.y,
        mode: 'TRUCK',
        stageLabel: '공항 ➔ 코코모 법인 직송 트럭 이송 중',
        leg: 'INLAND'
      };
    }
  }

  if (shipment.type === 'TRUCK') {
    // Kokomo to SPE Customer
    const pt = getInterpolatedPoint(1075, 298, 1095, 302, speX, speY, progress);
    return {
      x: pt.x,
      y: pt.y,
      mode: 'TRUCK',
      stageLabel: '코코모 ➔ SPE 납품 라인 직송 트럭 운송 중',
      leg: 'SPE_DELIVERY'
    };
  }

  return { x: 165, y: 305, mode: 'SHIP', stageLabel: '출항 대기', leg: 'PRE_DEPARTURE' };
}
`;

fs.writeFileSync(path.resolve('./src/utils/geoCoordinates.js'), geoContent, 'utf8');
console.log('geoCoordinates.js updated with accurate geographic mapping.');
