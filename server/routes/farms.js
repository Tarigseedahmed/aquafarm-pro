const express = require('express');
const router = express.Router();
const Farm = require('../models/Farm');

// الحصول على جميع المزارع
router.get('/', async (req, res) => {
  try {
    const farms = await Farm.getAll();
    res.json({
      success: true,
      data: farms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في جلب المزارع',
      message: error.message
    });
  }
});

// الحصول على مزرعة واحدة
router.get('/:id', async (req, res) => {
  try {
    const farm = await Farm.getById(req.params.id);
    if (!farm) {
      return res.status(404).json({
        success: false,
        error: 'المزرعة غير موجودة'
      });
    }
    res.json({
      success: true,
      data: farm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في جلب المزرعة',
      message: error.message
    });
  }
});

// إنشاء مزرعة جديدة
router.post('/', async (req, res) => {
  try {
    const farm = await Farm.create(req.body);
    res.status(201).json({
      success: true,
      data: farm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في إنشاء المزرعة',
      message: error.message
    });
  }
});

// تحديث مزرعة
router.put('/:id', async (req, res) => {
  try {
    const farm = await Farm.update(req.params.id, req.body);
    if (!farm) {
      return res.status(404).json({
        success: false,
        error: 'المزرعة غير موجودة'
      });
    }
    res.json({
      success: true,
      data: farm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في تحديث المزرعة',
      message: error.message
    });
  }
});

// حذف مزرعة
router.delete('/:id', async (req, res) => {
  try {
    const farm = await Farm.delete(req.params.id);
    if (!farm) {
      return res.status(404).json({
        success: false,
        error: 'المزرعة غير موجودة'
      });
    }
    res.json({
      success: true,
      message: 'تم حذف المزرعة بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في حذف المزرعة',
      message: error.message
    });
  }
});

module.exports = router;
