import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1758872808218 implements MigrationInterface {
  name = 'InitialSchema1758872808218';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "role" varchar NOT NULL DEFAULT ('user'), "company" varchar, "phone" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "code" varchar NOT NULL, "status" varchar NOT NULL DEFAULT ('active'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_3021c18db2b363ae9324c826c5a" UNIQUE ("code"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ponds" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" varchar, "area" decimal(10,2) NOT NULL, "depth" decimal(8,2) NOT NULL, "volume" decimal(12,2) NOT NULL, "maxCapacity" integer NOT NULL, "currentStockCount" integer NOT NULL DEFAULT (0), "shape" varchar NOT NULL DEFAULT ('rectangular'), "status" varchar NOT NULL DEFAULT ('active'), "equipment" json, "coordinates" json, "notes" varchar, "farmId" varchar NOT NULL, "managedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE "farms" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" varchar, "location" varchar NOT NULL, "totalArea" decimal(10,2), "farmType" varchar NOT NULL, "status" varchar NOT NULL DEFAULT ('active'), "coordinates" json, "contactPhone" varchar, "licenseNumber" varchar, "facilities" json, "ownerId" varchar NOT NULL, "tenantId" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "water_quality_readings" ("id" varchar PRIMARY KEY NOT NULL, "temperature" decimal(4,2) NOT NULL, "ph" decimal(4,2) NOT NULL, "dissolvedOxygen" decimal(6,2) NOT NULL, "ammonia" decimal(6,2) NOT NULL, "nitrite" decimal(6,2) NOT NULL, "nitrate" decimal(6,2) NOT NULL, "salinity" decimal(6,2), "turbidity" decimal(6,2), "alkalinity" decimal(8,2), "hardness" decimal(8,2), "readingMethod" varchar NOT NULL DEFAULT ('manual'), "notes" varchar, "status" varchar NOT NULL DEFAULT ('normal'), "alerts" json, "pondId" varchar, "recordedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE "feeding_records" ("id" varchar PRIMARY KEY NOT NULL, "feedAmount" decimal(8,2) NOT NULL, "feedType" varchar NOT NULL, "feedBrand" varchar, "proteinPercentage" decimal(6,2), "feedingMethod" varchar NOT NULL DEFAULT ('manual'), "feedingTime" time NOT NULL, "waterTemperature" decimal(8,2), "weatherConditions" varchar, "fishAppetite" varchar NOT NULL DEFAULT ('good'), "notes" varchar, "cost" decimal(10,2), "fishBatchId" varchar NOT NULL, "recordedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE "fish_batches" ("id" varchar PRIMARY KEY NOT NULL, "batchNumber" varchar NOT NULL, "species" varchar NOT NULL, "variety" varchar NOT NULL, "initialCount" integer NOT NULL, "currentCount" integer NOT NULL, "averageWeight" decimal(8,2) NOT NULL, "totalBiomass" decimal(10,2) NOT NULL, "stockingDate" datetime NOT NULL, "expectedHarvestDate" datetime, "actualHarvestDate" datetime, "status" varchar NOT NULL DEFAULT ('active'), "survivalRate" decimal(5,2), "feedConversionRatio" decimal(8,2), "targetWeight" decimal(8,2), "supplier" varchar, "notes" varchar, "healthStatus" json, "pondId" varchar, "managedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "message" text NOT NULL, "type" varchar NOT NULL DEFAULT ('info'), "category" varchar NOT NULL DEFAULT ('water_quality'), "isRead" boolean NOT NULL DEFAULT (0), "priority" varchar NOT NULL DEFAULT ('low'), "data" json, "actions" json, "sourceType" varchar, "sourceId" varchar, "userId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_ponds" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" varchar, "area" decimal(10,2) NOT NULL, "depth" decimal(8,2) NOT NULL, "volume" decimal(12,2) NOT NULL, "maxCapacity" integer NOT NULL, "currentStockCount" integer NOT NULL DEFAULT (0), "shape" varchar NOT NULL DEFAULT ('rectangular'), "status" varchar NOT NULL DEFAULT ('active'), "equipment" json, "coordinates" json, "notes" varchar, "farmId" varchar NOT NULL, "managedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar, CONSTRAINT "FK_3207589124723ddc81ebbbc29b0" FOREIGN KEY ("farmId") REFERENCES "farms" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_5feeff5e1ce9aa16617b1a9329c" FOREIGN KEY ("managedById") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_6fc40190497cac23589b9796f93" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_ponds"("id", "name", "description", "area", "depth", "volume", "maxCapacity", "currentStockCount", "shape", "status", "equipment", "coordinates", "notes", "farmId", "managedById", "createdAt", "updatedAt", "tenantId") SELECT "id", "name", "description", "area", "depth", "volume", "maxCapacity", "currentStockCount", "shape", "status", "equipment", "coordinates", "notes", "farmId", "managedById", "createdAt", "updatedAt", "tenantId" FROM "ponds"`,
    );
    await queryRunner.query(`DROP TABLE "ponds"`);
    await queryRunner.query(`ALTER TABLE "temporary_ponds" RENAME TO "ponds"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_farms" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" varchar, "location" varchar NOT NULL, "totalArea" decimal(10,2), "farmType" varchar NOT NULL, "status" varchar NOT NULL DEFAULT ('active'), "coordinates" json, "contactPhone" varchar, "licenseNumber" varchar, "facilities" json, "ownerId" varchar NOT NULL, "tenantId" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_2c9880c922f2211e47c3f074d5b" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_23ade99e401e94c36f1a2e57fc2" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_farms"("id", "name", "description", "location", "totalArea", "farmType", "status", "coordinates", "contactPhone", "licenseNumber", "facilities", "ownerId", "tenantId", "createdAt", "updatedAt") SELECT "id", "name", "description", "location", "totalArea", "farmType", "status", "coordinates", "contactPhone", "licenseNumber", "facilities", "ownerId", "tenantId", "createdAt", "updatedAt" FROM "farms"`,
    );
    await queryRunner.query(`DROP TABLE "farms"`);
    await queryRunner.query(`ALTER TABLE "temporary_farms" RENAME TO "farms"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_water_quality_readings" ("id" varchar PRIMARY KEY NOT NULL, "temperature" decimal(4,2) NOT NULL, "ph" decimal(4,2) NOT NULL, "dissolvedOxygen" decimal(6,2) NOT NULL, "ammonia" decimal(6,2) NOT NULL, "nitrite" decimal(6,2) NOT NULL, "nitrate" decimal(6,2) NOT NULL, "salinity" decimal(6,2), "turbidity" decimal(6,2), "alkalinity" decimal(8,2), "hardness" decimal(8,2), "readingMethod" varchar NOT NULL DEFAULT ('manual'), "notes" varchar, "status" varchar NOT NULL DEFAULT ('normal'), "alerts" json, "pondId" varchar, "recordedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar, CONSTRAINT "FK_29804c1813fba8d8296db5ea4a4" FOREIGN KEY ("recordedById") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_9fbaebd949447d967af63e00c75" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_water_quality_readings"("id", "temperature", "ph", "dissolvedOxygen", "ammonia", "nitrite", "nitrate", "salinity", "turbidity", "alkalinity", "hardness", "readingMethod", "notes", "status", "alerts", "pondId", "recordedById", "createdAt", "updatedAt", "tenantId") SELECT "id", "temperature", "ph", "dissolvedOxygen", "ammonia", "nitrite", "nitrate", "salinity", "turbidity", "alkalinity", "hardness", "readingMethod", "notes", "status", "alerts", "pondId", "recordedById", "createdAt", "updatedAt", "tenantId" FROM "water_quality_readings"`,
    );
    await queryRunner.query(`DROP TABLE "water_quality_readings"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_water_quality_readings" RENAME TO "water_quality_readings"`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_feeding_records" ("id" varchar PRIMARY KEY NOT NULL, "feedAmount" decimal(8,2) NOT NULL, "feedType" varchar NOT NULL, "feedBrand" varchar, "proteinPercentage" decimal(6,2), "feedingMethod" varchar NOT NULL DEFAULT ('manual'), "feedingTime" time NOT NULL, "waterTemperature" decimal(8,2), "weatherConditions" varchar, "fishAppetite" varchar NOT NULL DEFAULT ('good'), "notes" varchar, "cost" decimal(10,2), "fishBatchId" varchar NOT NULL, "recordedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar, CONSTRAINT "FK_1f535a060158d1067e68a755d48" FOREIGN KEY ("fishBatchId") REFERENCES "fish_batches" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_a7f0d0def615260ecfbf68bd8e7" FOREIGN KEY ("recordedById") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_f16afaa859c3d0b1e01fb1503d3" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_feeding_records"("id", "feedAmount", "feedType", "feedBrand", "proteinPercentage", "feedingMethod", "feedingTime", "waterTemperature", "weatherConditions", "fishAppetite", "notes", "cost", "fishBatchId", "recordedById", "createdAt", "tenantId") SELECT "id", "feedAmount", "feedType", "feedBrand", "proteinPercentage", "feedingMethod", "feedingTime", "waterTemperature", "weatherConditions", "fishAppetite", "notes", "cost", "fishBatchId", "recordedById", "createdAt", "tenantId" FROM "feeding_records"`,
    );
    await queryRunner.query(`DROP TABLE "feeding_records"`);
    await queryRunner.query(`ALTER TABLE "temporary_feeding_records" RENAME TO "feeding_records"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_fish_batches" ("id" varchar PRIMARY KEY NOT NULL, "batchNumber" varchar NOT NULL, "species" varchar NOT NULL, "variety" varchar NOT NULL, "initialCount" integer NOT NULL, "currentCount" integer NOT NULL, "averageWeight" decimal(8,2) NOT NULL, "totalBiomass" decimal(10,2) NOT NULL, "stockingDate" datetime NOT NULL, "expectedHarvestDate" datetime, "actualHarvestDate" datetime, "status" varchar NOT NULL DEFAULT ('active'), "survivalRate" decimal(5,2), "feedConversionRatio" decimal(8,2), "targetWeight" decimal(8,2), "supplier" varchar, "notes" varchar, "healthStatus" json, "pondId" varchar, "managedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar, CONSTRAINT "FK_e9092325866ba3ad90a9c3d4a4b" FOREIGN KEY ("managedById") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_aa983f87f35b77f2ef9873a2161" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_fish_batches"("id", "batchNumber", "species", "variety", "initialCount", "currentCount", "averageWeight", "totalBiomass", "stockingDate", "expectedHarvestDate", "actualHarvestDate", "status", "survivalRate", "feedConversionRatio", "targetWeight", "supplier", "notes", "healthStatus", "pondId", "managedById", "createdAt", "updatedAt", "tenantId") SELECT "id", "batchNumber", "species", "variety", "initialCount", "currentCount", "averageWeight", "totalBiomass", "stockingDate", "expectedHarvestDate", "actualHarvestDate", "status", "survivalRate", "feedConversionRatio", "targetWeight", "supplier", "notes", "healthStatus", "pondId", "managedById", "createdAt", "updatedAt", "tenantId" FROM "fish_batches"`,
    );
    await queryRunner.query(`DROP TABLE "fish_batches"`);
    await queryRunner.query(`ALTER TABLE "temporary_fish_batches" RENAME TO "fish_batches"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_notifications" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "message" text NOT NULL, "type" varchar NOT NULL DEFAULT ('info'), "category" varchar NOT NULL DEFAULT ('water_quality'), "isRead" boolean NOT NULL DEFAULT (0), "priority" varchar NOT NULL DEFAULT ('low'), "data" json, "actions" json, "sourceType" varchar, "sourceId" varchar, "userId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar, CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_d5b86bc522af7cc9e3e13960ffb" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_notifications"("id", "title", "message", "type", "category", "isRead", "priority", "data", "actions", "sourceType", "sourceId", "userId", "createdAt", "tenantId") SELECT "id", "title", "message", "type", "category", "isRead", "priority", "data", "actions", "sourceType", "sourceId", "userId", "createdAt", "tenantId" FROM "notifications"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`ALTER TABLE "temporary_notifications" RENAME TO "notifications"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" RENAME TO "temporary_notifications"`);
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "message" text NOT NULL, "type" varchar NOT NULL DEFAULT ('info'), "category" varchar NOT NULL DEFAULT ('water_quality'), "isRead" boolean NOT NULL DEFAULT (0), "priority" varchar NOT NULL DEFAULT ('low'), "data" json, "actions" json, "sourceType" varchar, "sourceId" varchar, "userId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "notifications"("id", "title", "message", "type", "category", "isRead", "priority", "data", "actions", "sourceType", "sourceId", "userId", "createdAt", "tenantId") SELECT "id", "title", "message", "type", "category", "isRead", "priority", "data", "actions", "sourceType", "sourceId", "userId", "createdAt", "tenantId" FROM "temporary_notifications"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_notifications"`);
    await queryRunner.query(`ALTER TABLE "fish_batches" RENAME TO "temporary_fish_batches"`);
    await queryRunner.query(
      `CREATE TABLE "fish_batches" ("id" varchar PRIMARY KEY NOT NULL, "batchNumber" varchar NOT NULL, "species" varchar NOT NULL, "variety" varchar NOT NULL, "initialCount" integer NOT NULL, "currentCount" integer NOT NULL, "averageWeight" decimal(8,2) NOT NULL, "totalBiomass" decimal(10,2) NOT NULL, "stockingDate" datetime NOT NULL, "expectedHarvestDate" datetime, "actualHarvestDate" datetime, "status" varchar NOT NULL DEFAULT ('active'), "survivalRate" decimal(5,2), "feedConversionRatio" decimal(8,2), "targetWeight" decimal(8,2), "supplier" varchar, "notes" varchar, "healthStatus" json, "pondId" varchar, "managedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "fish_batches"("id", "batchNumber", "species", "variety", "initialCount", "currentCount", "averageWeight", "totalBiomass", "stockingDate", "expectedHarvestDate", "actualHarvestDate", "status", "survivalRate", "feedConversionRatio", "targetWeight", "supplier", "notes", "healthStatus", "pondId", "managedById", "createdAt", "updatedAt", "tenantId") SELECT "id", "batchNumber", "species", "variety", "initialCount", "currentCount", "averageWeight", "totalBiomass", "stockingDate", "expectedHarvestDate", "actualHarvestDate", "status", "survivalRate", "feedConversionRatio", "targetWeight", "supplier", "notes", "healthStatus", "pondId", "managedById", "createdAt", "updatedAt", "tenantId" FROM "temporary_fish_batches"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_fish_batches"`);
    await queryRunner.query(`ALTER TABLE "feeding_records" RENAME TO "temporary_feeding_records"`);
    await queryRunner.query(
      `CREATE TABLE "feeding_records" ("id" varchar PRIMARY KEY NOT NULL, "feedAmount" decimal(8,2) NOT NULL, "feedType" varchar NOT NULL, "feedBrand" varchar, "proteinPercentage" decimal(6,2), "feedingMethod" varchar NOT NULL DEFAULT ('manual'), "feedingTime" time NOT NULL, "waterTemperature" decimal(8,2), "weatherConditions" varchar, "fishAppetite" varchar NOT NULL DEFAULT ('good'), "notes" varchar, "cost" decimal(10,2), "fishBatchId" varchar NOT NULL, "recordedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "feeding_records"("id", "feedAmount", "feedType", "feedBrand", "proteinPercentage", "feedingMethod", "feedingTime", "waterTemperature", "weatherConditions", "fishAppetite", "notes", "cost", "fishBatchId", "recordedById", "createdAt", "tenantId") SELECT "id", "feedAmount", "feedType", "feedBrand", "proteinPercentage", "feedingMethod", "feedingTime", "waterTemperature", "weatherConditions", "fishAppetite", "notes", "cost", "fishBatchId", "recordedById", "createdAt", "tenantId" FROM "temporary_feeding_records"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_feeding_records"`);
    await queryRunner.query(
      `ALTER TABLE "water_quality_readings" RENAME TO "temporary_water_quality_readings"`,
    );
    await queryRunner.query(
      `CREATE TABLE "water_quality_readings" ("id" varchar PRIMARY KEY NOT NULL, "temperature" decimal(4,2) NOT NULL, "ph" decimal(4,2) NOT NULL, "dissolvedOxygen" decimal(6,2) NOT NULL, "ammonia" decimal(6,2) NOT NULL, "nitrite" decimal(6,2) NOT NULL, "nitrate" decimal(6,2) NOT NULL, "salinity" decimal(6,2), "turbidity" decimal(6,2), "alkalinity" decimal(8,2), "hardness" decimal(8,2), "readingMethod" varchar NOT NULL DEFAULT ('manual'), "notes" varchar, "status" varchar NOT NULL DEFAULT ('normal'), "alerts" json, "pondId" varchar, "recordedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "water_quality_readings"("id", "temperature", "ph", "dissolvedOxygen", "ammonia", "nitrite", "nitrate", "salinity", "turbidity", "alkalinity", "hardness", "readingMethod", "notes", "status", "alerts", "pondId", "recordedById", "createdAt", "updatedAt", "tenantId") SELECT "id", "temperature", "ph", "dissolvedOxygen", "ammonia", "nitrite", "nitrate", "salinity", "turbidity", "alkalinity", "hardness", "readingMethod", "notes", "status", "alerts", "pondId", "recordedById", "createdAt", "updatedAt", "tenantId" FROM "temporary_water_quality_readings"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_water_quality_readings"`);
    await queryRunner.query(`ALTER TABLE "farms" RENAME TO "temporary_farms"`);
    await queryRunner.query(
      `CREATE TABLE "farms" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" varchar, "location" varchar NOT NULL, "totalArea" decimal(10,2), "farmType" varchar NOT NULL, "status" varchar NOT NULL DEFAULT ('active'), "coordinates" json, "contactPhone" varchar, "licenseNumber" varchar, "facilities" json, "ownerId" varchar NOT NULL, "tenantId" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `INSERT INTO "farms"("id", "name", "description", "location", "totalArea", "farmType", "status", "coordinates", "contactPhone", "licenseNumber", "facilities", "ownerId", "tenantId", "createdAt", "updatedAt") SELECT "id", "name", "description", "location", "totalArea", "farmType", "status", "coordinates", "contactPhone", "licenseNumber", "facilities", "ownerId", "tenantId", "createdAt", "updatedAt" FROM "temporary_farms"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_farms"`);
    await queryRunner.query(`ALTER TABLE "ponds" RENAME TO "temporary_ponds"`);
    await queryRunner.query(
      `CREATE TABLE "ponds" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" varchar, "area" decimal(10,2) NOT NULL, "depth" decimal(8,2) NOT NULL, "volume" decimal(12,2) NOT NULL, "maxCapacity" integer NOT NULL, "currentStockCount" integer NOT NULL DEFAULT (0), "shape" varchar NOT NULL DEFAULT ('rectangular'), "status" varchar NOT NULL DEFAULT ('active'), "equipment" json, "coordinates" json, "notes" varchar, "farmId" varchar NOT NULL, "managedById" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "tenantId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "ponds"("id", "name", "description", "area", "depth", "volume", "maxCapacity", "currentStockCount", "shape", "status", "equipment", "coordinates", "notes", "farmId", "managedById", "createdAt", "updatedAt", "tenantId") SELECT "id", "name", "description", "area", "depth", "volume", "maxCapacity", "currentStockCount", "shape", "status", "equipment", "coordinates", "notes", "farmId", "managedById", "createdAt", "updatedAt", "tenantId" FROM "temporary_ponds"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_ponds"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "fish_batches"`);
    await queryRunner.query(`DROP TABLE "feeding_records"`);
    await queryRunner.query(`DROP TABLE "water_quality_readings"`);
    await queryRunner.query(`DROP TABLE "farms"`);
    await queryRunner.query(`DROP TABLE "ponds"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
