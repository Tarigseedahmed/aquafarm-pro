# Aquafarm Pro API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
جميع الطلبات تتطلب رمز JWT في الرأس:
```
Authorization: Bearer <token>
```

## Endpoints

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-03T12:00:00.000Z"
}
```

---

### Farms

#### Get All Farms
```http
GET /api/farms
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "مزرعة النيل",
      "location": "أسوان، مصر",
      "area": 5000,
      "owner_id": 1,
      "created_at": "2025-10-03T12:00:00.000Z"
    }
  ]
}
```

#### Get Farm by ID
```http
GET /api/farms/:id
```

#### Create Farm
```http
POST /api/farms
```

**Request Body:**
```json
{
  "name": "مزرعة النيل",
  "location": "أسوان، مصر",
  "area": 5000,
  "owner_id": 1
}
```

#### Update Farm
```http
PUT /api/farms/:id
```

#### Delete Farm
```http
DELETE /api/farms/:id
```

---

### Water Quality

#### Get Water Quality Readings
```http
GET /api/water-quality/:pondId
```

**Query Parameters:**
- `from`: تاريخ البداية (ISO 8601)
- `to`: تاريخ النهاية (ISO 8601)
- `limit`: عدد النتائج (default: 100)

#### Add Water Quality Reading
```http
POST /api/water-quality
```

**Request Body:**
```json
{
  "pond_id": 1,
  "temperature": 24.5,
  "ph_level": 7.2,
  "dissolved_oxygen": 8.5,
  "ammonia": 0.1,
  "nitrite": 0.05,
  "nitrate": 10.0
}
```

---

### Feeding

#### Get Feeding Records
```http
GET /api/feeding/:pondId
```

#### Add Feeding Record
```http
POST /api/feeding
```

**Request Body:**
```json
{
  "pond_id": 1,
  "feed_type": "علف مركز",
  "amount": 50.5,
  "cost": 150.00,
  "notes": "تغذية صباحية"
}
```

---

### Harvest

#### Get Harvest Records
```http
GET /api/harvest/:pondId
```

#### Add Harvest Record
```http
POST /api/harvest
```

---

### Alerts

#### Get Active Alerts
```http
GET /api/alerts/active
```

#### Resolve Alert
```http
PUT /api/alerts/:id/resolve
```

---

## Error Responses

```json
{
  "success": false,
  "error": "وصف الخطأ",
  "message": "تفاصيل إضافية"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
