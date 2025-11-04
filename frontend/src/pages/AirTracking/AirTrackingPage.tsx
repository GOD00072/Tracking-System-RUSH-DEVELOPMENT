import { Search, Plane } from 'lucide-react';
import { useState } from 'react';

const AirTrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Tracking:', trackingNumber);
  };

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Plane className="w-16 h-16 text-secondary-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">ติดตามสินค้าทางอากาศ</h1>
          <p className="text-gray-600">ตรวจสอบสถานะพัสดุทางเครื่องบินได้ทันที</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <div className="flex gap-4">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="ใส่หมายเลขติดตาม (เช่น AIR-2025-001)"
              className="input-field flex-grow"
            />
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Search className="w-5 h-5" />
              ค้นหา
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AirTrackingPage;
