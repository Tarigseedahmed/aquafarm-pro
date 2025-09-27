import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

export class AddAccountingCoreTables1758882000000 implements MigrationInterface {
  name = 'AddAccountingCoreTables1758882000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.driver.options.type === 'postgres') {
      await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    }

    await queryRunner.createTable(
      new Table({
        name: 'tax_profiles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'tenantId', type: 'uuid', isNullable: true },
          { name: 'countryCode', type: 'varchar', length: '2' },
          { name: 'taxIdNumber', type: 'varchar', length: '64' },
          { name: 'regime', type: 'varchar', length: '64', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createUniqueConstraint(
      'tax_profiles',
      new TableUnique({ columnNames: ['tenantId', 'countryCode'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tax_rates',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'tenantId', type: 'uuid', isNullable: true },
          { name: 'code', type: 'varchar', length: '32' },
          { name: 'description', type: 'varchar', length: '128', isNullable: true },
          { name: 'ratePercent', type: 'numeric', precision: 6, scale: 4 },
          { name: 'validFrom', type: 'date' },
          { name: 'validTo', type: 'date', isNullable: true },
          { name: 'isCompound', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createUniqueConstraint(
      'tax_rates',
      new TableUnique({ columnNames: ['tenantId', 'code', 'validFrom'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'invoice_series',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'tenantId', type: 'uuid', isNullable: true },
          { name: 'prefix', type: 'varchar', length: '16' },
          { name: 'currentNumber', type: 'int', default: 0 },
          { name: 'padding', type: 'int', default: 6 },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createUniqueConstraint(
      'invoice_series',
      new TableUnique({ columnNames: ['tenantId', 'prefix'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'fx_rates',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'baseCurrency', type: 'varchar', length: '3' },
          { name: 'quoteCurrency', type: 'varchar', length: '3' },
          { name: 'rate', type: 'numeric', precision: 18, scale: 8 },
          { name: 'source', type: 'varchar', length: '32', default: `'MANUAL'` },
          { name: 'effectiveDate', type: 'date' },
          { name: 'retrievedAt', type: 'timestamptz', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'now()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'fx_rates',
      new TableIndex({
        columnNames: ['baseCurrency', 'quoteCurrency', 'effectiveDate'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('fx_rates');
    await queryRunner.dropTable('invoice_series');
    await queryRunner.dropTable('tax_rates');
    await queryRunner.dropTable('tax_profiles');
  }
}
