const db = require('../config/database');

class Farm {
  // إنشاء مزرعة جديدة
  static async create(farmData) {
    const { name, location, area, owner_id } = farmData;
    const query = `
      INSERT INTO farms (name, location, area, owner_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await db.query(query, [name, location, area, owner_id]);
    return result.rows[0];
  }

  // الحصول على جميع المزارع
  static async getAll() {
    const query = 'SELECT * FROM farms ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  // الحصول على مزرعة بالمعرف
  static async getById(id) {
    const query = 'SELECT * FROM farms WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // تحديث مزرعة
  static async update(id, farmData) {
    const { name, location, area } = farmData;
    const query = `
      UPDATE farms 
      SET name = $1, location = $2, area = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const result = await db.query(query, [name, location, area, id]);
    return result.rows[0];
  }

  // حذف مزرعة
  static async delete(id) {
    const query = 'DELETE FROM farms WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Farm;
