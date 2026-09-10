import type { AppData } from './types'
import { rupeesToPaise } from './money'

const typeIds = {
  ps5: 'type-ps5',
  controller: 'type-controller',
  wheel: 'type-wheel',
  vr: 'type-vr',
}

function asset(
  id: string,
  typeId: string,
  code: string,
  name: string,
): AppData['assets'][number] {
  return {
    id,
    assetTypeId: typeId,
    code,
    name,
    description: '',
    operationalStatus: 'available',
    retiredAt: null,
    isDeleted: false,
  }
}

export function createSeedData(): AppData {
  return {
    settings: {
      name: 'Phoenix Gaming Zone',
      tagline: 'PLAY | COMPETE | WIN',
      currencyCode: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      billingIncrementMinutes: 30,
      minimumDurationMinutes: 60,
      roundingMode: 'up',
      openTime: '12:00',
      closeTime: '00:00',
      closesNextDay: true,
      warningYellowPercent: 90,
      warningOrangePercent: 95,
      warningRedPercent: 100,
      warningFirstPeriodMinutes: 60,
      warningExtendMinutes: 30,
    },
    assetTypes: [
      {
        id: typeIds.ps5,
        name: 'PS5',
        slug: 'ps5',
        isStation: true,
        iconKey: 'joystick',
        imagePath: '/images/packages/ps5.webp',
        sortOrder: 1,
        status: 'active',
      },
      {
        id: typeIds.controller,
        name: 'Controller',
        slug: 'controller',
        isStation: false,
        iconKey: 'gamepad',
        imagePath: '/images/asset-types/controller.webp',
        sortOrder: 2,
        status: 'active',
      },
      {
        id: typeIds.wheel,
        name: 'Racing Wheel',
        slug: 'racing-wheel',
        isStation: false,
        iconKey: 'wheel',
        imagePath: '/images/asset-types/racing-wheel.webp',
        sortOrder: 3,
        status: 'active',
      },
      {
        id: typeIds.vr,
        name: 'VR Headset',
        slug: 'vr2',
        isStation: false,
        iconKey: 'vr',
        imagePath: '/images/asset-types/vr2.webp',
        sortOrder: 4,
        status: 'active',
      },
    ],
    assets: [
      asset('asset-ps5-1', typeIds.ps5, 'PS5-001', 'PS5 #1'),
      asset('asset-ps5-2', typeIds.ps5, 'PS5-002', 'PS5 #2'),
      asset('asset-ps5-3', typeIds.ps5, 'PS5-003', 'PS5 #3'),
      asset('asset-ps5-4', typeIds.ps5, 'PS5-004', 'PS5 #4'),
      asset('asset-pad-1', typeIds.controller, 'PAD-001', 'Controller #1'),
      asset('asset-pad-2', typeIds.controller, 'PAD-002', 'Controller #2'),
      asset('asset-pad-3', typeIds.controller, 'PAD-003', 'Controller #3'),
      asset('asset-pad-4', typeIds.controller, 'PAD-004', 'Controller #4'),
      asset('asset-wheel-1', typeIds.wheel, 'WHEEL-001', 'Racing Wheel #1'),
      asset('asset-vr-1', typeIds.vr, 'VR-001', 'VR #1'),
    ],
    customers: [],
    packages: [
      {
        id: 'pkg-1p',
        name: '1 PS5',
        hourlyRatePaise: rupeesToPaise(100),
        status: 'active',
        imagePath: '/images/packages/ps5.webp',
        items: [{ assetTypeId: typeIds.ps5, quantity: 1 }],
      },
      {
        id: 'pkg-2p',
        name: '1 PS5 + Extra Controller',
        hourlyRatePaise: rupeesToPaise(150),
        status: 'active',
        imagePath: '/images/packages/ps5-extra-controller.webp',
        items: [
          { assetTypeId: typeIds.ps5, quantity: 1 },
          { assetTypeId: typeIds.controller, quantity: 1 },
        ],
      },
      {
        id: 'pkg-3p',
        name: '1 PS5 + 2 Extra Controllers',
        hourlyRatePaise: rupeesToPaise(200),
        status: 'active',
        imagePath: '/images/packages/ps5-2-extra-controllers.webp',
        items: [
          { assetTypeId: typeIds.ps5, quantity: 1 },
          { assetTypeId: typeIds.controller, quantity: 2 },
        ],
      },
      {
        id: 'pkg-4p',
        name: '1 PS5 + 3 Extra Controllers',
        hourlyRatePaise: rupeesToPaise(250),
        status: 'active',
        imagePath: '/images/packages/ps5-3-extra-controllers.webp',
        items: [
          { assetTypeId: typeIds.ps5, quantity: 1 },
          { assetTypeId: typeIds.controller, quantity: 3 },
        ],
      },
      {
        id: 'pkg-wheel',
        name: 'Racing Wheel',
        hourlyRatePaise: rupeesToPaise(150),
        status: 'active',
        imagePath: '/images/packages/ps5-racing-wheel.webp',
        items: [
          { assetTypeId: typeIds.ps5, quantity: 1 },
          { assetTypeId: typeIds.wheel, quantity: 1 },
        ],
      },
      {
        id: 'pkg-vr',
        name: '1 PS5 + VR2',
        hourlyRatePaise: rupeesToPaise(150),
        status: 'active',
        imagePath: '/images/packages/ps5-vr2.webp',
        items: [
          { assetTypeId: typeIds.ps5, quantity: 1 },
          { assetTypeId: typeIds.vr, quantity: 1 },
        ],
      },
      {
        id: 'pkg-wheel-vr',
        name: 'Racing Wheel with VR',
        hourlyRatePaise: rupeesToPaise(200),
        status: 'active',
        imagePath: '/images/packages/ps5-racing-wheel-vr2.webp',
        items: [
          { assetTypeId: typeIds.ps5, quantity: 1 },
          { assetTypeId: typeIds.wheel, quantity: 1 },
          { assetTypeId: typeIds.vr, quantity: 1 },
        ],
      },
    ],
    sessions: [],
    sessionAssets: [],
    charges: [],
  }
}

export const STORAGE_KEY = 'phoenix-zone-v1'
export const AUTH_KEY = 'phoenix-zone-auth'
