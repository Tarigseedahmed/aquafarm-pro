import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCountryCodeToTaxRates1758891000000 implements MigrationInterface {
  name = 'AddCountryCodeToTaxRates1758891000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.driver.options.type;
    if (driver === 'sqlite') {
      // SQLite: simple ADD COLUMN (no NOT NULL first to avoid table rebuild)
      await queryRunner.query('ALTER TABLE tax_rates ADD COLUMN countryCode varchar(2)');
    } else {
      await queryRunner.query('ALTER TABLE tax_rates ADD COLUMN "countryCode" varchar(2)');
      await queryRunner.query(
        'CREATE INDEX IF NOT EXISTS IDX_tax_rates_countryCode ON tax_rates ("countryCode")',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.driver.options.type;
    if (driver === 'sqlite') {
      // SQLite: cannot drop column easily without table recreation; perform table rebuild
      await queryRunner.query(
        'CREATE TABLE tmp_tax_rates AS SELECT id, code, description, ratePercent, validFrom, isCompound FROM tax_rates',
      );
      await queryRunner.query('DROP TABLE tax_rates');
      await queryRunner.query('ALTER TABLE tmp_tax_rates RENAME TO tax_rates');
    } else {
      await queryRunner.query('DROP INDEX IF EXISTS IDX_tax_rates_countryCode');
      await queryRunner.query('ALTER TABLE tax_rates DROP COLUMN "countryCode"');
    }
  }
}
