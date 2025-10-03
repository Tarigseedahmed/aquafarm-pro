import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaxProfilesAndRates1758883000000 implements MigrationInterface {
  name = 'CreateTaxProfilesAndRates1758883000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert default tax profiles for common countries
    await queryRunner.query(`
      INSERT INTO tax_profiles (id, "countryCode", "taxIdNumber", regime, "isActive") VALUES
      (gen_random_uuid(), 'SA', '123456789012345', 'STANDARD', true),
      (gen_random_uuid(), 'AE', '123456789012345', 'STANDARD', true),
      (gen_random_uuid(), 'EG', '123456789012345', 'STANDARD', true),
      (gen_random_uuid(), 'KW', '123456789012345', 'STANDARD', true),
      (gen_random_uuid(), 'QA', '123456789012345', 'STANDARD', true),
      (gen_random_uuid(), 'BH', '123456789012345', 'STANDARD', true),
      (gen_random_uuid(), 'OM', '123456789012345', 'STANDARD', true),
      (gen_random_uuid(), 'JO', '123456789012345', 'STANDARD', true),
      (gen_random_uuid(), 'LB', '123456789012345', 'STANDARD', true),
      (gen_random_uuid(), 'IQ', '123456789012345', 'STANDARD', true)
    `);

    // Insert default tax rates for Saudi Arabia (VAT)
    await queryRunner.query(`
      INSERT INTO tax_rates (id, code, description, "ratePercent", "validFrom", "isCompound") VALUES
      (gen_random_uuid(), 'VAT_STANDARD', 'Standard VAT Rate', '15.0000', '2018-01-01', false),
      (gen_random_uuid(), 'VAT_ZERO', 'Zero-rated VAT', '0.0000', '2018-01-01', false),
      (gen_random_uuid(), 'VAT_EXEMPT', 'VAT Exempt', '0.0000', '2018-01-01', false)
    `);

    // Insert default tax rates for UAE (VAT)
    await queryRunner.query(`
      INSERT INTO tax_rates (id, code, description, "ratePercent", "validFrom", "isCompound") VALUES
      (gen_random_uuid(), 'VAT_STANDARD', 'Standard VAT Rate', '5.0000', '2018-01-01', false),
      (gen_random_uuid(), 'VAT_ZERO', 'Zero-rated VAT', '0.0000', '2018-01-01', false),
      (gen_random_uuid(), 'VAT_EXEMPT', 'VAT Exempt', '0.0000', '2018-01-01', false)
    `);

    // Insert default tax rates for Egypt (VAT)
    await queryRunner.query(`
      INSERT INTO tax_rates (id, code, description, "ratePercent", "validFrom", "isCompound") VALUES
      (gen_random_uuid(), 'VAT_STANDARD', 'Standard VAT Rate', '14.0000', '2017-07-01', false),
      (gen_random_uuid(), 'VAT_REDUCED', 'Reduced VAT Rate', '5.0000', '2017-07-01', false),
      (gen_random_uuid(), 'VAT_ZERO', 'Zero-rated VAT', '0.0000', '2017-07-01', false),
      (gen_random_uuid(), 'VAT_EXEMPT', 'VAT Exempt', '0.0000', '2017-07-01', false)
    `);

    // Insert default tax rates for Kuwait (No VAT, but other taxes)
    await queryRunner.query(`
      INSERT INTO tax_rates (id, code, description, "ratePercent", "validFrom", "isCompound") VALUES
      (gen_random_uuid(), 'CORPORATE_TAX', 'Corporate Income Tax', '15.0000', '2008-01-01', false),
      (gen_random_uuid(), 'WITHHOLDING_TAX', 'Withholding Tax', '5.0000', '2008-01-01', false)
    `);

    // Insert default tax rates for Qatar (VAT)
    await queryRunner.query(`
      INSERT INTO tax_rates (id, code, description, "ratePercent", "validFrom", "isCompound") VALUES
      (gen_random_uuid(), 'VAT_STANDARD', 'Standard VAT Rate', '5.0000', '2020-01-01', false),
      (gen_random_uuid(), 'VAT_ZERO', 'Zero-rated VAT', '0.0000', '2020-01-01', false),
      (gen_random_uuid(), 'VAT_EXEMPT', 'VAT Exempt', '0.0000', '2020-01-01', false)
    `);

    // Insert default tax rates for Bahrain (VAT)
    await queryRunner.query(`
      INSERT INTO tax_rates (id, code, description, "ratePercent", "validFrom", "isCompound") VALUES
      (gen_random_uuid(), 'VAT_STANDARD', 'Standard VAT Rate', '10.0000', '2019-01-01', false),
      (gen_random_uuid(), 'VAT_ZERO', 'Zero-rated VAT', '0.0000', '2019-01-01', false),
      (gen_random_uuid(), 'VAT_EXEMPT', 'VAT Exempt', '0.0000', '2019-01-01', false)
    `);

    // Insert default tax rates for Oman (VAT)
    await queryRunner.query(`
      INSERT INTO tax_rates (id, code, description, "ratePercent", "validFrom", "isCompound") VALUES
      (gen_random_uuid(), 'VAT_STANDARD', 'Standard VAT Rate', '5.0000', '2021-04-01', false),
      (gen_random_uuid(), 'VAT_ZERO', 'Zero-rated VAT', '0.0000', '2021-04-01', false),
      (gen_random_uuid(), 'VAT_EXEMPT', 'VAT Exempt', '0.0000', '2021-04-01', false)
    `);

    // Insert default tax rates for Jordan (VAT)
    await queryRunner.query(`
      INSERT INTO tax_rates (id, code, description, "ratePercent", "validFrom", "isCompound") VALUES
      (gen_random_uuid(), 'VAT_STANDARD', 'Standard VAT Rate', '16.0000', '2016-01-01', false),
      (gen_random_uuid(), 'VAT_REDUCED', 'Reduced VAT Rate', '4.0000', '2016-01-01', false),
      (gen_random_uuid(), 'VAT_ZERO', 'Zero-rated VAT', '0.0000', '2016-01-01', false),
      (gen_random_uuid(), 'VAT_EXEMPT', 'VAT Exempt', '0.0000', '2016-01-01', false)
    `);

    // Insert default tax rates for Lebanon (VAT)
    await queryRunner.query(`
      INSERT INTO tax_rates (id, code, description, "ratePercent", "validFrom", "isCompound") VALUES
      (gen_random_uuid(), 'VAT_STANDARD', 'Standard VAT Rate', '11.0000', '2002-01-01', false),
      (gen_random_uuid(), 'VAT_REDUCED', 'Reduced VAT Rate', '4.0000', '2002-01-01', false),
      (gen_random_uuid(), 'VAT_ZERO', 'Zero-rated VAT', '0.0000', '2002-01-01', false),
      (gen_random_uuid(), 'VAT_EXEMPT', 'VAT Exempt', '0.0000', '2002-01-01', false)
    `);

    // Insert default tax rates for Iraq (VAT)
    await queryRunner.query(`
      INSERT INTO tax_rates (id, code, description, "ratePercent", "validFrom", "isCompound") VALUES
      (gen_random_uuid(), 'VAT_STANDARD', 'Standard VAT Rate', '15.0000', '2023-01-01', false),
      (gen_random_uuid(), 'VAT_ZERO', 'Zero-rated VAT', '0.0000', '2023-01-01', false),
      (gen_random_uuid(), 'VAT_EXEMPT', 'VAT Exempt', '0.0000', '2023-01-01', false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all tax rates
    await queryRunner.query(`DELETE FROM tax_rates WHERE code IN (
      'VAT_STANDARD', 'VAT_REDUCED', 'VAT_ZERO', 'VAT_EXEMPT',
      'CORPORATE_TAX', 'WITHHOLDING_TAX'
    )`);

    // Remove all tax profiles
    await queryRunner.query(`DELETE FROM tax_profiles WHERE "countryCode" IN (
      'SA', 'AE', 'EG', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'IQ'
    )`);
  }
}
