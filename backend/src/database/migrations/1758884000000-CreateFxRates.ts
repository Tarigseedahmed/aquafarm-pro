import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateFxRates1758884000000 implements MigrationInterface {
  name = 'CreateFxRates1758884000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'fx_rates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          { name: 'base', type: 'varchar', length: '3', isNullable: false },
          { name: 'quote', type: 'varchar', length: '3', isNullable: false },
          { name: 'rateDate', type: 'date', isNullable: false },
          { name: 'rate', type: 'decimal', precision: 18, scale: 8, isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        uniques: [{ name: 'UQ_fx_rate_symbol_date', columnNames: ['base', 'quote', 'rateDate'] }],
      }),
    );

    await queryRunner.createIndex(
      'fx_rates',
      new TableIndex({
        name: 'IDX_fx_rates_base_quote_date',
        columnNames: ['base', 'quote', 'rateDate'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('fx_rates');
  }
}
