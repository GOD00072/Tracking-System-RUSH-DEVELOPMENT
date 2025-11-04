import { Search, Ship } from 'lucide-react';
import { useState } from 'react';

const ShipTrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement tracking logic
    console.log('Tracking:', trackingNumber);
  };

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Ship className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">ติดตามสินค้าทางเรือ</h1>
          <p className="text-gray-600">ระบุหมายเลขติดตามเพื่อตรวจสอบสถานะพัสดุของคุณ</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <div className="flex gap-4">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="ใส่หมายเลขติดตาม (เช่น SHIP-2025-001)"
              className="input-field flex-grow"
            />
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Search className="w-5 h-5" />
              ค้นหา
            </button>
          </div>
        </form>

        <div className="mt-12 card">
          <h2 className="text-xl font-bold mb-4">ตัวอย่างหมายเลขติดตาม</h2>
          <div className="space-y-2 text-gray-600">
            <p>• SHIP-2025-001</p>
            <p>• SHIP-2025-002</p>
            <p>• SHIP-2025-003</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipTrackingPage;
