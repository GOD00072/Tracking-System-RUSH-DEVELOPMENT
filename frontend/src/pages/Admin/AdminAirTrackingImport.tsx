import { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { parseExcelFile, validateExcelData, downloadExcelTemplate } from '../../utils/excelParser';
import type { AirTrackingData } from '../../utils/excelParser';
import { pageTransition, staggerContainer, staggerItem } from '../../lib/animations';
import api from '../../lib/api';

const AdminAirTrackingImport = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<AirTrackingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)');
        return;
      }
      setSelectedFile(file);
      setParsedData([]);
      setValidationErrors([]);
    }
  };

  const handleParseFile = async () => {
    if (!selectedFile) {
      toast.error('กรุณาเลือกไฟล์ก่อน');
      return;
    }

    setIsLoading(true);
    try {
      const data = await parseExcelFile(selectedFile);
      setParsedData(data);

      // Validate data
      const validation = validateExcelData(data);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        toast.warning(`พบข้อผิดพลาด ${validation.errors.length} รายการ`);
      } else {
        toast.success(`อ่านข้อมูลสำเร็จ ${data.length} รายการ`);
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = async () => {
    if (parsedData.length === 0) {
      toast.error('ไม่มีข้อมูลให้นำเข้า');
      return;
    }

    if (validationErrors.length > 0) {
      toast.error('กรุณาแก้ไขข้อผิดพลาดก่อนนำเข้าข้อมูล');
      return;
    }

    setIsLoading(true);
    try {
      // Send data to API
      const response = await api.post('/air-tracking/import', { data: parsedData });

      toast.success(response.data.message || `นำเข้าข้อมูล ${parsedData.length} รายการสำเร็จ`);

      // Reset form
      setSelectedFile(null);
      setParsedData([]);
      setValidationErrors([]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล';
      toast.error(errorMessage);
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setParsedData([]);
    setValidationErrors([]);
  };

  return (
    <motion.div
      className="p-8"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">นำเข้าข้อมูลพัสดุทางอากาศ</h1>
          <p className="text-gray-600 mt-2">อัปโหลดไฟล์ Excel เพื่อนำเข้าข้อมูล Air Tracking</p>
        </motion.div>

        <motion.div
          className="space-y-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Upload Section */}
          <motion.div className="card" variants={staggerItem}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">อัปโหลดไฟล์</h2>
              <button
                onClick={downloadExcelTemplate}
                className="btn-outline flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                ดาวน์โหลด Template
              </button>
            </div>

            <div className="space-y-4">
              {/* File Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">
                    {selectedFile ? selectedFile.name : 'คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวาง'}
                  </p>
                  <p className="text-sm text-gray-500">รองรับไฟล์ .xlsx, .xls</p>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleParseFile}
                  disabled={!selectedFile || isLoading}
                  className="btn-primary flex items-center gap-2 flex-1"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  {isLoading ? 'กำลังอ่านไฟล์...' : 'อ่านไฟล์'}
                </button>
                <button
                  onClick={handleClear}
                  disabled={!selectedFile && parsedData.length === 0}
                  className="btn-outline flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  ล้างข้อมูล
                </button>
              </div>
            </div>
          </motion.div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <motion.div
              className="card bg-red-50 border-red-200"
              variants={staggerItem}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 mb-2">พบข้อผิดพลาด</h3>
                  <ul className="space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Preview Data */}
          {parsedData.length > 0 && (
            <motion.div className="card" variants={staggerItem}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <div>
                    <h2 className="text-xl font-bold">ข้อมูลที่อ่านได้</h2>
                    <p className="text-sm text-gray-600">ทั้งหมด {parsedData.length} รายการ</p>
                  </div>
                </div>
                <button
                  onClick={handleImportData}
                  disabled={isLoading || validationErrors.length > 0}
                  className="btn-primary flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  {isLoading ? 'กำลังนำเข้า...' : 'นำเข้าข้อมูล'}
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">#</th>
                      <th className="px-4 py-3 text-left font-semibold">Tracking Number</th>
                      <th className="px-4 py-3 text-left font-semibold">Flight</th>
                      <th className="px-4 py-3 text-left font-semibold">Origin</th>
                      <th className="px-4 py-3 text-left font-semibold">Destination</th>
                      <th className="px-4 py-3 text-left font-semibold">Departure</th>
                      <th className="px-4 py-3 text-left font-semibold">Arrival</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {parsedData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{row.trackingNumber}</td>
                        <td className="px-4 py-3">{row.flightNumber}</td>
                        <td className="px-4 py-3">{row.origin}</td>
                        <td className="px-4 py-3">{row.destination}</td>
                        <td className="px-4 py-3">{row.departureDate}</td>
                        <td className="px-4 py-3">{row.arrivalDate}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    แสดง 10 รายการแรกจากทั้งหมด {parsedData.length} รายการ
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Instructions */}
          <motion.div className="card bg-blue-50 border-blue-200" variants={staggerItem}>
            <h3 className="font-bold text-blue-900 mb-3">คำแนะนำการใช้งาน</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>ดาวน์โหลด Template เพื่อดูตัวอย่างรูปแบบข้อมูล</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>กรอกข้อมูลในไฟล์ Excel ตามรูปแบบที่กำหนด</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>อัปโหลดไฟล์และคลิก "อ่านไฟล์" เพื่อตรวจสอบข้อมูล</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span>
                <span>หากไม่มีข้อผิดพลาด คลิก "นำเข้าข้อมูล" เพื่อบันทึกลงระบบ</span>
              </li>
            </ol>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminAirTrackingImport;
