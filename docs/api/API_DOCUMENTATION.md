# API Documentation - Ship Tracking System

## Base URL
- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://your-api.render.com/api/v1`

---

## Authentication

### Google Sign-In
```
POST /auth/google
```
**Request Body**:
```json
{
  "token": "google_oauth_token"
}
```
**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "customer"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### Logout
```
POST /auth/logout
```

### Refresh Token
```
POST /auth/refresh
```

---

## Orders

### Get All Orders
```
GET /orders
```
**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status
- `shipping_method` (string): Filter by shipping method

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": "ORD-2025-001",
      "customer_id": "uuid",
      "shipping_method": "sea",
      "status": "shipped",
      "origin": "China",
      "destination": "Thailand",
      "total_weight": 500.00,
      "estimated_delivery": "2025-11-15",
      "created_at": "2025-11-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Get Order by ID
```
GET /orders/:id
```

### Create Order
```
POST /orders
```
**Request Body**:
```json
{
  "customer_id": "uuid",
  "shipping_method": "sea",
  "origin": "China",
  "destination": "Thailand",
  "total_weight": 500.00,
  "total_volume": 2.5,
  "estimated_delivery": "2025-11-15",
  "notes": "Fragile items"
}
```

### Update Order
```
PATCH /orders/:id
```

### Delete Order
```
DELETE /orders/:id
```

---

## Shipments

### Get Shipment by Tracking Number
```
GET /shipments/track/:tracking_number
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tracking_number": "SHIP-2025-001",
    "carrier": "Maersk",
    "vessel_name": "MSC Oscar",
    "departure_port": "Shanghai",
    "arrival_port": "Bangkok",
    "departure_date": "2025-11-01",
    "arrival_date": "2025-11-15",
    "current_status": "In Transit",
    "current_location": "Singapore",
    "latitude": 1.3521,
    "longitude": 103.8198,
    "order": {
      "order_number": "ORD-2025-001",
      "customer_name": "ABC Company"
    }
  }
}
```

### Get Tracking History
```
GET /shipments/:id/history
```
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "Departed",
      "location": "Shanghai Port",
      "latitude": 31.2304,
      "longitude": 121.4737,
      "description": "Vessel departed from Shanghai Port",
      "timestamp": "2025-11-01T08:00:00Z"
    },
    {
      "id": "uuid",
      "status": "In Transit",
      "location": "Singapore",
      "latitude": 1.3521,
      "longitude": 103.8198,
      "description": "Vessel arrived at Singapore Port for transit",
      "timestamp": "2025-11-05T14:30:00Z"
    }
  ]
}
```

### Create Shipment
```
POST /shipments
```

### Update Shipment Location
```
PATCH /shipments/:id/location
```
**Request Body**:
```json
{
  "status": "In Transit",
  "location": "Singapore",
  "latitude": 1.3521,
  "longitude": 103.8198,
  "description": "Vessel at Singapore Port"
}
```

---

## Schedules

### Get Schedules
```
GET /schedules
```
**Query Parameters**:
- `type` (string): 'sea' or 'air'
- `departure_port` (string): Filter by departure port
- `arrival_port` (string): Filter by arrival port
- `from_date` (string): Start date (YYYY-MM-DD)
- `to_date` (string): End date (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "schedule_type": "sea",
      "carrier": "Maersk",
      "vessel_name": "MSC Oscar",
      "route": "Shanghai - Bangkok",
      "departure_port": "Shanghai",
      "arrival_port": "Bangkok",
      "departure_date": "2025-11-01",
      "arrival_date": "2025-11-15",
      "frequency": "weekly",
      "status": "active"
    }
  ]
}
```

### Get Schedule by ID
```
GET /schedules/:id
```

### Create Schedule (Admin Only)
```
POST /schedules
```

### Update Schedule (Admin Only)
```
PATCH /schedules/:id
```

### Delete Schedule (Admin Only)
```
DELETE /schedules/:id
```

---

## Reviews

### Get Reviews
```
GET /reviews
```
**Query Parameters**:
- `is_approved` (boolean): Filter approved reviews
- `is_featured` (boolean): Filter featured reviews
- `rating` (number): Filter by rating

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "customer": {
        "name": "John Doe",
        "company": "ABC Company"
      },
      "rating": 5,
      "comment": "Excellent service! Fast delivery.",
      "is_featured": true,
      "created_at": "2025-11-01T00:00:00Z"
    }
  ]
}
```

### Create Review
```
POST /reviews
```
**Request Body**:
```json
{
  "order_id": "uuid",
  "rating": 5,
  "comment": "Great service!"
}
```

### Approve Review (Admin Only)
```
PATCH /reviews/:id/approve
```

---

## Rate Calculator

### Calculate Shipping Rate
```
POST /calculator/calculate
```
**Request Body**:
```json
{
  "shipping_method": "sea",
  "origin": "China",
  "destination": "Thailand",
  "weight": 500,
  "volume": 2.5
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "shipping_method": "sea",
    "weight": 500,
    "volume": 2.5,
    "base_fee": 1000,
    "rate_per_kg": 5,
    "weight_charge": 2500,
    "total_cost": 3500,
    "estimated_days": 14,
    "currency": "THB"
  }
}
```

---

## Statistics

### Get Dashboard Statistics
```
GET /statistics/dashboard
```
**Response**:
```json
{
  "success": true,
  "data": {
    "total_orders": 1250,
    "active_shipments": 45,
    "delivered_this_month": 120,
    "average_delivery_days": 12,
    "customer_satisfaction": 4.7,
    "revenue_this_month": 1500000
  }
}
```

### Get Shipment Statistics
```
GET /statistics/shipments
```
**Query Parameters**:
- `period` (string): 'week', 'month', 'year'
- `shipping_method` (string): Filter by method

**Response**:
```json
{
  "success": true,
  "data": {
    "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
    "sea_shipments": [25, 30, 28, 32],
    "air_shipments": [15, 18, 20, 17]
  }
}
```

---

## Notifications (LINE OA)

### Send Notification
```
POST /notifications/send
```
**Request Body**:
```json
{
  "customer_id": "uuid",
  "type": "line",
  "message": "Your shipment SHIP-2025-001 has arrived!"
}
```

### Get Notification History
```
GET /notifications
```

---

## Contact

### Submit Contact Form
```
POST /contact
```
**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0812345678",
  "subject": "Inquiry about shipping",
  "message": "I would like to know about shipping rates to Thailand."
}
```

### Get Contact Messages (Admin Only)
```
GET /contact/messages
```

### Mark as Read (Admin Only)
```
PATCH /contact/messages/:id/read
```

---

## Portfolio

### Get Portfolio Items
```
GET /portfolio
```
**Query Parameters**:
- `category` (string): Filter by category
- `is_featured` (boolean): Filter featured items

### Get Portfolio Item by ID
```
GET /portfolio/:id
```

### Create Portfolio Item (Admin Only)
```
POST /portfolio
```

---

## Airtable Integration

### Sync from Airtable
```
POST /airtable/sync
```
**Request Body**:
```json
{
  "table": "customers",
  "force": false
}
```

### Get Airtable Data
```
GET /airtable/:table
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting
- **Rate**: 100 requests per 15 minutes per IP
- **Header**: `X-RateLimit-Remaining`

## CORS
- **Allowed Origins**: Configure in environment variables
- **Methods**: GET, POST, PATCH, DELETE, OPTIONS

---

**Last Updated**: November 2, 2025
