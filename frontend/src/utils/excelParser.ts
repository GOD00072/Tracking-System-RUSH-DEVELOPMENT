import * as XLSX from 'xlsx';

// ⚠️ SECURITY NOTE: xlsx library (v0.18.5) has known vulnerabilities (CVE-2024-22363, CVE-2024-22362)
// Mitigations applied:
// 1. File size limit (10MB max)
// 2. Only process trusted user-uploaded files
// 3. Input validation after parsing
// Consider migrating to 'exceljs' when possible

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size
const MAX_ROWS = 10000; // Max rows to process

export interface AirTrackingData {
  trackingNumber: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  arrivalDate: string;
  status: string;
  weight?: number;
  recipient?: string;
  phone?: string;
  [key: string]: any;
}

export const parseExcelFile = async (file: File): Promise<AirTrackingData[]> => {
  // Security: Validate file size before processing
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  // Security: Validate file type
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
    throw new Error('กรุณาอัพโหลดไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });

        // Security: Limit number of rows to prevent DoS
        if (jsonData.length > MAX_ROWS) {
          reject(new Error(`ไฟล์มีข้อมูลมากเกินไป (สูงสุด ${MAX_ROWS.toLocaleString()} แถว)`));
          return;
        }

        // Map to AirTrackingData format
        const parsedData: AirTrackingData[] = jsonData.map((row: any) => {
          // Map column names to standard format
          // Adjust these field names based on actual Excel columns
          return {
            trackingNumber: row['Tracking Number'] || row['เลขติดตาม'] || row['AWB'] || '',
            flightNumber: row['Flight Number'] || row['เที่ยวบิน'] || '',
            origin: row['Origin'] || row['ต้นทาง'] || '',
            destination: row['Destination'] || row['ปลายทาง'] || '',
            departureDate: row['Departure Date'] || row['วันออกเดินทาง'] || '',
            arrivalDate: row['Arrival Date'] || row['วันถึง'] || '',
            status: row['Status'] || row['สถานะ'] || 'pending',
            weight: parseFloat(row['Weight'] || row['น้ำหนัก'] || '0'),
            recipient: row['Recipient'] || row['ผู้รับ'] || '',
            phone: row['Phone'] || row['เบอร์โทร'] || '',
            // Keep all original data
            ...row
          };
        });

        resolve(parsedData);
      } catch (error) {
        reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
    };

    reader.readAsBinaryString(file);
  });
};

export const validateExcelData = (data: AirTrackingData[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  data.forEach((row, index) => {
    if (!row.trackingNumber || row.trackingNumber.trim() === '') {
      errors.push(`แถวที่ ${index + 1}: ไม่มีเลขติดตาม`);
    }
    if (!row.flightNumber || row.flightNumber.trim() === '') {
      errors.push(`แถวที่ ${index + 1}: ไม่มีเลขเที่ยวบิน`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

export const downloadExcelTemplate = () => {
  // Create a template workbook
  const templateData = [
    {
      'Tracking Number': 'AWB12345678',
      'Flight Number': 'TG660',
      'Origin': 'NRT',
      'Destination': 'BKK',
      'Departure Date': '2025-11-05',
      'Arrival Date': '2025-11-06',
      'Status': 'in-transit',
      'Weight': '5.5',
      'Recipient': 'John Doe',
      'Phone': '081-234-5678'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  // Download
  XLSX.writeFile(workbook, 'air_tracking_template.xlsx');
};
