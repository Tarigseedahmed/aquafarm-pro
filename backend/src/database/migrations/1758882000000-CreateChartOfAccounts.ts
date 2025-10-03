import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateChartOfAccounts1758882000000 implements MigrationInterface {
  name = 'CreateChartOfAccounts1758882000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create chart_of_accounts table
    await queryRunner.createTable(
      new Table({
        name: 'chart_of_accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '32',
            isNullable: false,
            comment: 'ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE',
          },
          {
            name: 'parentId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'level',
            type: 'integer',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isSystem',
            type: 'boolean',
            default: false,
            comment: 'System accounts cannot be deleted',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'chart_of_accounts',
      new TableIndex({
        name: 'IDX_chart_of_accounts_tenant_code',
        columnNames: ['tenantId', 'code'],
      }),
    );
    await queryRunner.createIndex(
      'chart_of_accounts',
      new TableIndex({
        name: 'IDX_chart_of_accounts_tenant_type',
        columnNames: ['tenantId', 'type'],
      }),
    );
    await queryRunner.createIndex(
      'chart_of_accounts',
      new TableIndex({
        name: 'IDX_chart_of_accounts_parent',
        columnNames: ['parentId'],
      }),
    );

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE chart_of_accounts 
      ADD CONSTRAINT FK_chart_of_accounts_parent 
      FOREIGN KEY (parentId) REFERENCES chart_of_accounts(id) ON DELETE SET NULL
    `);

    // Insert default chart of accounts structure
    await queryRunner.query(`
      INSERT INTO chart_of_accounts (code, name, type, level, isSystem, description) VALUES
      -- Assets (Level 1)
      ('1000', 'ASSETS', 'ASSET', 1, true, 'All company assets'),
      
      -- Current Assets (Level 2)
      ('1100', 'CURRENT ASSETS', 'ASSET', 2, true, 'Assets expected to be converted to cash within one year'),
      ('1110', 'Cash and Cash Equivalents', 'ASSET', 3, true, 'Cash, bank accounts, and short-term investments'),
      ('1120', 'Accounts Receivable', 'ASSET', 3, true, 'Amounts owed by customers'),
      ('1130', 'Inventory', 'ASSET', 3, true, 'Raw materials, work in progress, and finished goods'),
      ('1140', 'Prepaid Expenses', 'ASSET', 3, true, 'Expenses paid in advance'),
      
      -- Fixed Assets (Level 2)
      ('1200', 'FIXED ASSETS', 'ASSET', 2, true, 'Long-term assets used in business operations'),
      ('1210', 'Land and Buildings', 'ASSET', 3, true, 'Real estate owned by the company'),
      ('1220', 'Equipment', 'ASSET', 3, true, 'Machinery and equipment'),
      ('1230', 'Vehicles', 'ASSET', 3, true, 'Company vehicles'),
      ('1240', 'Accumulated Depreciation', 'ASSET', 3, true, 'Depreciation accumulated on fixed assets'),
      
      -- Liabilities (Level 1)
      ('2000', 'LIABILITIES', 'LIABILITY', 1, true, 'All company liabilities'),
      
      -- Current Liabilities (Level 2)
      ('2100', 'CURRENT LIABILITIES', 'LIABILITY', 2, true, 'Liabilities due within one year'),
      ('2110', 'Accounts Payable', 'LIABILITY', 3, true, 'Amounts owed to suppliers'),
      ('2120', 'Accrued Expenses', 'LIABILITY', 3, true, 'Expenses incurred but not yet paid'),
      ('2130', 'Short-term Debt', 'LIABILITY', 3, true, 'Debt due within one year'),
      ('2140', 'Tax Payable', 'LIABILITY', 3, true, 'Taxes owed to government'),
      
      -- Long-term Liabilities (Level 2)
      ('2200', 'LONG-TERM LIABILITIES', 'LIABILITY', 2, true, 'Liabilities due after one year'),
      ('2210', 'Long-term Debt', 'LIABILITY', 3, true, 'Debt due after one year'),
      
      -- Equity (Level 1)
      ('3000', 'EQUITY', 'EQUITY', 1, true, 'Owner equity and retained earnings'),
      ('3100', 'Share Capital', 'EQUITY', 2, true, 'Capital contributed by owners'),
      ('3200', 'Retained Earnings', 'EQUITY', 2, true, 'Accumulated profits retained in business'),
      
      -- Revenue (Level 1)
      ('4000', 'REVENUE', 'REVENUE', 1, true, 'Income from business operations'),
      ('4100', 'Sales Revenue', 'REVENUE', 2, true, 'Revenue from sales of goods and services'),
      ('4110', 'Fish Sales', 'REVENUE', 3, true, 'Revenue from fish sales'),
      ('4120', 'Feed Sales', 'REVENUE', 3, true, 'Revenue from feed sales'),
      ('4200', 'Other Revenue', 'REVENUE', 2, true, 'Other sources of income'),
      
      -- Expenses (Level 1)
      ('5000', 'EXPENSES', 'EXPENSE', 1, true, 'All business expenses'),
      
      -- Cost of Goods Sold (Level 2)
      ('5100', 'COST OF GOODS SOLD', 'EXPENSE', 2, true, 'Direct costs of producing goods'),
      ('5110', 'Feed Costs', 'EXPENSE', 3, true, 'Cost of fish feed'),
      ('5120', 'Fingerling Costs', 'EXPENSE', 3, true, 'Cost of fish fingerlings'),
      ('5130', 'Labor Costs', 'EXPENSE', 3, true, 'Direct labor costs'),
      
      -- Operating Expenses (Level 2)
      ('5200', 'OPERATING EXPENSES', 'EXPENSE', 2, true, 'General operating expenses'),
      ('5210', 'Salaries and Wages', 'EXPENSE', 3, true, 'Employee compensation'),
      ('5220', 'Utilities', 'EXPENSE', 3, true, 'Electricity, water, gas'),
      ('5230', 'Maintenance', 'EXPENSE', 3, true, 'Equipment and facility maintenance'),
      ('5240', 'Insurance', 'EXPENSE', 3, true, 'Business insurance premiums'),
      ('5250', 'Professional Services', 'EXPENSE', 3, true, 'Legal, accounting, consulting fees'),
      ('5260', 'Marketing', 'EXPENSE', 3, true, 'Advertising and marketing expenses'),
      ('5270', 'Travel', 'EXPENSE', 3, true, 'Business travel expenses'),
      ('5280', 'Office Supplies', 'EXPENSE', 3, true, 'Office materials and supplies'),
      
      -- Depreciation (Level 2)
      ('5300', 'DEPRECIATION', 'EXPENSE', 2, true, 'Depreciation of fixed assets'),
      ('5310', 'Equipment Depreciation', 'EXPENSE', 3, true, 'Depreciation of equipment'),
      ('5320', 'Building Depreciation', 'EXPENSE', 3, true, 'Depreciation of buildings'),
      
      -- Interest and Finance (Level 2)
      ('5400', 'INTEREST AND FINANCE', 'EXPENSE', 2, true, 'Interest and financing costs'),
      ('5410', 'Interest Expense', 'EXPENSE', 3, true, 'Interest on loans and debt'),
      ('5420', 'Bank Charges', 'EXPENSE', 3, true, 'Banking fees and charges')
    `);

    // Update parent relationships
    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '1000') WHERE code IN ('1100', '1200')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '1100') WHERE code IN ('1110', '1120', '1130', '1140')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '1200') WHERE code IN ('1210', '1220', '1230', '1240')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '2000') WHERE code IN ('2100', '2200')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '2100') WHERE code IN ('2110', '2120', '2130', '2140')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '2200') WHERE code IN ('2210')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '3000') WHERE code IN ('3100', '3200')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '4000') WHERE code IN ('4100', '4200')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '4100') WHERE code IN ('4110', '4120')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '5000') WHERE code IN ('5100', '5200', '5300', '5400')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '5100') WHERE code IN ('5110', '5120', '5130')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '5200') WHERE code IN ('5210', '5220', '5230', '5240', '5250', '5260', '5270', '5280')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '5300') WHERE code IN ('5310', '5320')
    `);

    await queryRunner.query(`
      UPDATE chart_of_accounts SET parentId = (SELECT id FROM chart_of_accounts WHERE code = '5400') WHERE code IN ('5410', '5420')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('chart_of_accounts');
  }
}
