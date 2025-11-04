import express, { Request, Response } from 'express';

const router = express.Router();

// In-memory storage for air tracking data (replace with database later)
let airTrackingData: any[] = [];

/**
 * GET /api/v1/air-tracking
 * Get all air tracking records
 */
router.get('/', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: airTrackingData,
      total: airTrackingData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch air tracking data'
      }
    });
  }
});

/**
 * GET /api/v1/air-tracking/:trackingNumber
 * Get specific air tracking record by tracking number
 */
router.get('/:trackingNumber', (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    const record = airTrackingData.find(
      (item) => item.trackingNumber === trackingNumber
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Tracking number not found'
        }
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch air tracking record'
      }
    });
  }
});

/**
 * POST /api/v1/air-tracking/import
 * Import multiple air tracking records from Excel
 */
router.post('/import', (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Data must be an array'
        }
      });
    }

    // Validate required fields
    const invalidRecords: number[] = [];
    data.forEach((record, index) => {
      if (!record.trackingNumber || !record.flightNumber) {
        invalidRecords.push(index);
      }
    });

    if (invalidRecords.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: `Invalid records at indices: ${invalidRecords.join(', ')}`,
          invalidRecords
        }
      });
    }

    // Add timestamps and IDs
    const processedData = data.map((record, index) => ({
      id: `air-${Date.now()}-${index}`,
      ...record,
      importedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Merge with existing data (update if tracking number exists)
    processedData.forEach((newRecord) => {
      const existingIndex = airTrackingData.findIndex(
        (item) => item.trackingNumber === newRecord.trackingNumber
      );

      if (existingIndex >= 0) {
        // Update existing record
        airTrackingData[existingIndex] = {
          ...airTrackingData[existingIndex],
          ...newRecord,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new record
        airTrackingData.push(newRecord);
      }
    });

    res.json({
      success: true,
      message: `Successfully imported ${data.length} records`,
      data: {
        imported: data.length,
        total: airTrackingData.length
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to import air tracking data'
      }
    });
  }
});

/**
 * PUT /api/v1/air-tracking/:trackingNumber
 * Update specific air tracking record
 */
router.put('/:trackingNumber', (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    const updates = req.body;

    const index = airTrackingData.findIndex(
      (item) => item.trackingNumber === trackingNumber
    );

    if (index < 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Tracking number not found'
        }
      });
    }

    airTrackingData[index] = {
      ...airTrackingData[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Air tracking record updated successfully',
      data: airTrackingData[index]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update air tracking record'
      }
    });
  }
});

/**
 * DELETE /api/v1/air-tracking/:trackingNumber
 * Delete specific air tracking record
 */
router.delete('/:trackingNumber', (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;

    const index = airTrackingData.findIndex(
      (item) => item.trackingNumber === trackingNumber
    );

    if (index < 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Tracking number not found'
        }
      });
    }

    airTrackingData.splice(index, 1);

    res.json({
      success: true,
      message: 'Air tracking record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete air tracking record'
      }
    });
  }
});

export default router;
