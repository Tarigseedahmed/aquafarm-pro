/**
 * AquaFarm Pro - Simple Farms Service for Testing
 */

import { Injectable } from '@nestjs/common';

// In-memory DTOs & enum (previously in test-farm.entity.ts)
export enum FarmStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export class CreateTestFarmDto {
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  area?: number;
  description?: string;
}

export class UpdateTestFarmDto {
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  area?: number;
  description?: string;
  status?: FarmStatus;
}

export interface SimpleFarm {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  area?: number;
  description?: string;
  status: FarmStatus;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SimpleFarmsService {
  private farms: SimpleFarm[] = [
    {
      id: '1',
      tenantId: 'default-tenant',
      ownerId: 'default-user',
      name: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø£Ø³Ù…Ø§Ùƒ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©',
      location: 'Ø§Ù„Ø±ÙŠØ§Ø¶ØŒ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©',
      latitude: 24.7136,
      longitude: 46.6753,
      area: 50000,
      description:
        'Ù…Ø²Ø±Ø¹Ø© Ø£Ø³Ù…Ø§Ùƒ Ù…ØªØ·ÙˆØ±Ø© Ù…ØªØ®ØµØµØ© ÙÙŠ ØªØ±Ø¨ÙŠØ© Ø£Ø³Ù…Ø§Ùƒ Ø§Ù„Ù…ÙŠØ§Ù‡ Ø§Ù„Ø¹Ø°Ø¨Ø©',
      status: FarmStatus.ACTIVE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      tenantId: 'default-tenant',
      ownerId: 'default-user',
      name: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø²Ø±Ù‚',
      location: 'Ø¬Ø¯Ø©ØŒ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©',
      latitude: 21.3891,
      longitude: 39.8579,
      area: 75000,
      description:
        'Ù…Ø²Ø±Ø¹Ø© Ø³Ø§Ø­Ù„ÙŠØ© Ù„ØªØ±Ø¨ÙŠØ© Ø£Ø³Ù…Ø§Ùƒ Ø§Ù„Ù…ÙŠØ§Ù‡ Ø§Ù„Ù…Ø§Ù„Ø­Ø©',
      status: FarmStatus.ACTIVE,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '3',
      tenantId: 'default-tenant',
      ownerId: 'default-user',
      name: 'Ù…Ø²Ø±Ø¹Ø© Ø§Ù„Ø®Ù„ÙŠØ¬ Ø§Ù„Ø£Ø®Ø¶Ø±',
      location: 'Ø§Ù„Ø¯Ù…Ø§Ù…ØŒ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©',
      latitude: 26.4207,
      longitude: 50.0888,
      area: 30000,
      description: 'Ù…Ø²Ø±Ø¹Ø© Ø­Ø¯ÙŠØ«Ø© Ù„ØªØ±Ø¨ÙŠØ© Ø§Ù„Ø¬Ù…Ø¨Ø±ÙŠ ÙˆØ§Ù„Ø£Ø³Ù…Ø§Ùƒ',
      status: FarmStatus.MAINTENANCE,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    },
  ];

  async findAll(tenantId?: string): Promise<SimpleFarm[]> {
    if (tenantId) {
      return this.farms.filter((farm) => farm.tenantId === tenantId);
    }
    return this.farms;
  }

  async findOne(id: string): Promise<SimpleFarm | undefined> {
    return this.farms.find((farm) => farm.id === id);
  }

  async create(
    createFarmDto: CreateTestFarmDto,
    tenantId = 'default-tenant',
    ownerId = 'default-user',
  ): Promise<SimpleFarm> {
    const newFarm: SimpleFarm = {
      id: Date.now().toString(),
      tenantId,
      ownerId,
      ...createFarmDto,
      status: FarmStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.farms.push(newFarm);
    return newFarm;
  }

  async update(id: string, updateFarmDto: UpdateTestFarmDto): Promise<SimpleFarm | undefined> {
    const farmIndex = this.farms.findIndex((farm) => farm.id === id);

    if (farmIndex === -1) {
      return undefined;
    }

    this.farms[farmIndex] = {
      ...this.farms[farmIndex],
      ...updateFarmDto,
      updatedAt: new Date(),
    };

    return this.farms[farmIndex];
  }

  async remove(id: string): Promise<boolean> {
    const farmIndex = this.farms.findIndex((farm) => farm.id === id);

    if (farmIndex === -1) {
      return false;
    }

    this.farms.splice(farmIndex, 1);
    return true;
  }

  // Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø¨Ø³ÙŠØ·Ø©
  async getStats(tenantId?: string): Promise<{
    totalFarms: number;
    activeFarms: number;
    inactiveFarms: number;
    maintenanceFarms: number;
    totalArea: number;
    farmsByLocation: Array<{ location: string; count: number }>;
  }> {
    const farmsList = tenantId
      ? this.farms.filter((farm) => farm.tenantId === tenantId)
      : this.farms;

    const activeFarms = farmsList.filter((farm) => farm.status === FarmStatus.ACTIVE);
    const inactiveFarms = farmsList.filter((farm) => farm.status === FarmStatus.INACTIVE);
    const maintenanceFarms = farmsList.filter((farm) => farm.status === FarmStatus.MAINTENANCE);

    // ØªØ¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø²Ø§Ø±Ø¹ Ø­Ø³Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹
    const locationMap = new Map<string, number>();
    farmsList.forEach((farm) => {
      if (farm.location) {
        const count = locationMap.get(farm.location) || 0;
        locationMap.set(farm.location, count + 1);
      }
    });

    const farmsByLocation = Array.from(locationMap.entries()).map(([location, count]) => ({
      location,
      count,
    }));

    return {
      totalFarms: farmsList.length,
      activeFarms: activeFarms.length,
      inactiveFarms: inactiveFarms.length,
      maintenanceFarms: maintenanceFarms.length,
      totalArea: farmsList.reduce((sum, farm) => sum + (farm.area || 0), 0),
      farmsByLocation,
    };
  }

  // Ø§Ù„Ø¨Ø­Ø« ÙÙŠ Ø§Ù„Ù…Ø²Ø§Ø±Ø¹
  async search(query: string, tenantId?: string): Promise<SimpleFarm[]> {
    const farmsList = tenantId
      ? this.farms.filter((farm) => farm.tenantId === tenantId)
      : this.farms;

    const searchTerm = query.toLowerCase();

    return farmsList.filter(
      (farm) =>
        farm.name.toLowerCase().includes(searchTerm) ||
        farm.location?.toLowerCase().includes(searchTerm) ||
        farm.description?.toLowerCase().includes(searchTerm),
    );
  }
}
