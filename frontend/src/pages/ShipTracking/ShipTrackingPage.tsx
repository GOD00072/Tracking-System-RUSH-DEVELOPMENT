import { Search, Ship, Package, MapPin, Calendar, Truck } from 'lucide-react';
import { useState } from 'react';
import { useOrders } from '../../hooks/useOrders';
import LoadingSpinner from '../../components/LoadingSpinner';

const ShipTrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<string | null>(null);

  // Fetch all orders to demonstrate API usage
  const { data: ordersData, isLoading, error } = useOrders(1, 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      setSearchedOrder(trackingNumber);
      // In real implementation, this would search by tracking number
      console.log('Tracking:', trackingNumber);
    }
  };

  const foundOrder = ordersData?.data.find(
    (order) => order.orderNumber === searchedOrder
  );

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
              placeholder="ใส่หมายเลขติดตาม (เช่น TEST-001)"
              className="input-field flex-grow"
            />
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Search className="w-5 h-5" />
              ค้นหา
            </button>
          </div>
        </form>

        {/* Search Results */}
        {searchedOrder && (
          <div className="mt-8 card">
            {isLoading ? (
              <LoadingSpinner />
            ) : foundOrder ? (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-primary-600">
                  ข้อมูลการจัดส่ง
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-700">หมายเลขคำสั่ง</p>
                      <p className="text-gray-900">{foundOrder.orderNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-700">สถานะ</p>
                      <p className="text-gray-900 capitalize">{foundOrder.status}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-700">ต้นทาง</p>
                      <p className="text-gray-900">{foundOrder.origin || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-700">ปลายทาง</p>
                      <p className="text-gray-900">{foundOrder.destination || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Ship className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-700">วิธีการจัดส่ง</p>
                      <p className="text-gray-900 capitalize">{foundOrder.shippingMethod}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary-500 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-700">วันที่สร้าง</p>
                      <p className="text-gray-900">
                        {new Date(foundOrder.createdAt).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </div>
                </div>

                {foundOrder.shipments && foundOrder.shipments.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-bold text-lg mb-4">ข้อมูลการขนส่ง</h3>
                    {foundOrder.shipments.map((shipment) => (
                      <div key={shipment.id} className="bg-gray-50 p-4 rounded-lg">
                        <p><span className="font-semibold">Tracking:</span> {shipment.trackingNumber}</p>
                        <p><span className="font-semibold">สถานะ:</span> {shipment.currentStatus || 'N/A'}</p>
                        <p><span className="font-semibold">ตำแหน่ง:</span> {shipment.currentLocation || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">ไม่พบข้อมูลหมายเลขติดตามนี้</p>
                <p className="text-gray-500 text-sm mt-2">กรุณาตรวจสอบหมายเลขอีกครั้ง</p>
              </div>
            )}
          </div>
        )}

        {/* Available Orders List */}
        <div className="mt-12 card">
          <h2 className="text-xl font-bold mb-4">คำสั่งซื้อที่มีในระบบ</h2>

          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          ) : ordersData && ordersData.data.length > 0 ? (
            <div className="space-y-2">
              {ordersData.data.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {order.origin || 'N/A'} → {order.destination || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">ยังไม่มีคำสั่งซื้อในระบบ</p>
          )}

          {ordersData && ordersData.pagination && (
            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
              แสดง {ordersData.data.length} จาก {ordersData.pagination.total} รายการ
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipTrackingPage;
