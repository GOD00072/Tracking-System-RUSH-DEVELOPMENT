import { useState } from 'react';
import {
  Package,
  CreditCard,
  ShoppingCart,
  Warehouse,
  Ship,
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// 8 status steps definition
export const STATUS_STEPS = [
  {
    step: 1,
    name: 'รับออเดอร์',
    nameEN: 'Order Received',
    icon: Package,
    color: 'blue',
  },
  {
    step: 2,
    name: 'ชำระเงินงวดแรก',
    nameEN: 'First Payment',
    icon: CreditCard,
    color: 'green',
  },
  {
    step: 3,
    name: 'สั่งซื้อจากญี่ปุ่น',
    nameEN: 'Ordered from JP',
    icon: ShoppingCart,
    color: 'purple',
  },
  {
    step: 4,
    name: 'ของถึงโกดัง JP',
    nameEN: 'Arrived JP Warehouse',
    icon: Warehouse,
    color: 'orange',
  },
  {
    step: 5,
    name: 'ส่งออกจาก JP',
    nameEN: 'Shipped from JP',
    icon: Ship,
    color: 'cyan',
  },
  {
    step: 6,
    name: 'ของถึงไทย',
    nameEN: 'Arrived Thailand',
    icon: MapPin,
    color: 'pink',
  },
  {
    step: 7,
    name: 'กำลังจัดส่ง',
    nameEN: 'Out for Delivery',
    icon: Truck,
    color: 'yellow',
  },
  {
    step: 8,
    name: 'ส่งมอบสำเร็จ',
    nameEN: 'Delivered',
    icon: CheckCircle,
    color: 'emerald',
  },
];

interface StatusHistoryItem {
  id: string;
  statusStep: number;
  statusName: string;
  description?: string;
  changedBy?: string;
  timestamp: string;
}

interface StatusTimelineProps {
  currentStep: number;
  statusHistory?: StatusHistoryItem[];
  onStepChange?: (step: number) => void;
  readonly?: boolean;
  compact?: boolean;
}

export function StatusTimeline({
  currentStep,
  statusHistory = [],
  onStepChange,
  readonly = false,
  compact = false,
}: StatusTimelineProps) {
  const [showHistory, setShowHistory] = useState(false);

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const getHistoryForStep = (step: number) => {
    return statusHistory.filter((h) => h.statusStep === step);
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        {STATUS_STEPS.map((stepInfo) => {
          const status = getStepStatus(stepInfo.step);
          const Icon = stepInfo.icon;
          return (
            <div
              key={stepInfo.step}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                status === 'completed'
                  ? 'bg-green-500 text-white'
                  : status === 'current'
                  ? 'bg-blue-500 text-white animate-pulse'
                  : 'bg-gray-200 text-gray-400'
              }`}
              title={`${stepInfo.name} (${stepInfo.step}/8)`}
            >
              <Icon className="w-4 h-4" />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          สถานะการดำเนินการ
        </h3>
        <span className="text-sm text-gray-500">
          ขั้นตอน {currentStep} / 8
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div
          className="absolute left-4 top-0 w-0.5 bg-green-500 transition-all duration-500"
          style={{
            height: `${((currentStep - 1) / 7) * 100}%`,
          }}
        />

        {/* Steps */}
        <div className="space-y-4">
          {STATUS_STEPS.map((stepInfo) => {
            const status = getStepStatus(stepInfo.step);
            const Icon = stepInfo.icon;
            const history = getHistoryForStep(stepInfo.step);

            return (
              <div
                key={stepInfo.step}
                className={`relative flex items-start pl-10 ${
                  !readonly && 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 -ml-2'
                }`}
                onClick={() => {
                  if (!readonly && onStepChange) {
                    onStepChange(stepInfo.step);
                  }
                }}
              >
                {/* Step icon */}
                <div
                  className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : status === 'current'
                      ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`font-medium ${
                          status === 'completed'
                            ? 'text-green-700'
                            : status === 'current'
                            ? 'text-blue-700'
                            : 'text-gray-500'
                        }`}
                      >
                        {stepInfo.name}
                      </p>
                      <p className="text-xs text-gray-400">{stepInfo.nameEN}</p>
                    </div>

                    {status === 'current' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Clock className="w-3 h-3 mr-1" />
                        กำลังดำเนินการ
                      </span>
                    )}

                    {status === 'completed' && history.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {new Date(history[0].timestamp).toLocaleDateString(
                          'th-TH',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                    )}
                  </div>

                  {/* History for this step */}
                  {history.length > 0 && status !== 'pending' && (
                    <div className="mt-1 text-xs text-gray-500">
                      {history[0].description && (
                        <p className="italic">{history[0].description}</p>
                      )}
                      {history[0].changedBy && (
                        <p>โดย: {history[0].changedBy}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History toggle */}
      {statusHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            {showHistory ? (
              <ChevronUp className="w-4 h-4 mr-1" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1" />
            )}
            ดูประวัติการเปลี่ยนสถานะ ({statusHistory.length} รายการ)
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {statusHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {item.statusName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.timestamp).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-gray-600 mt-1">{item.description}</p>
                  )}
                  {item.changedBy && (
                    <p className="text-xs text-gray-400 mt-1">
                      เปลี่ยนโดย: {item.changedBy}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Mini version for table rows
export function StatusBadge({ step }: { step: number }) {
  const stepInfo = STATUS_STEPS.find((s) => s.step === step) || STATUS_STEPS[0];
  const Icon = stepInfo.icon;

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    cyan: 'bg-cyan-100 text-cyan-700',
    pink: 'bg-pink-100 text-pink-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colorClasses[stepInfo.color] || 'bg-gray-100 text-gray-700'
      }`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {stepInfo.name}
    </span>
  );
}

export default StatusTimeline;
