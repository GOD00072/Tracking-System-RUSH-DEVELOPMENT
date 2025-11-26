import { useState } from 'react';
import {
  Package,
  Copy,
  ExternalLink,
  Check,
  MapPin,
  Plane,
  Ship,
} from 'lucide-react';
import { toast } from 'sonner';

interface TrackingNumbersProps {
  trackingNumberJP?: string;
  trackingNumberTH?: string;
  trackingNumber?: string; // Legacy field
  onTrackingChange?: (field: string, value: string) => void;
  readonly?: boolean;
  compact?: boolean;
}

// Common Japanese carriers and their tracking URLs
const JP_CARRIERS = [
  {
    name: 'Japan Post',
    pattern: /^[A-Z]{2}\d{9}[A-Z]{2}$/,
    url: (tracking: string) =>
      `https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${tracking}&locale=en`,
  },
  {
    name: 'Yamato',
    pattern: /^\d{12}$/,
    url: (tracking: string) =>
      `https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number01=${tracking}`,
  },
  {
    name: 'Sagawa',
    pattern: /^\d{10,12}$/,
    url: (tracking: string) =>
      `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${tracking}`,
  },
];

// Common Thai carriers and their tracking URLs
const TH_CARRIERS = [
  {
    name: 'Thailand Post',
    pattern: /^[A-Z]{2}\d{9}[A-Z]{2}$/,
    url: (tracking: string) =>
      `https://track.thailandpost.co.th/?trackNumber=${tracking}`,
  },
  {
    name: 'Kerry Express',
    pattern: /^KERDO\d{13}|KEX\d+$/i,
    url: (tracking: string) =>
      `https://th.kerryexpress.com/th/track/?track=${tracking}`,
  },
  {
    name: 'Flash Express',
    pattern: /^TH\d{13}[A-Z]?$/i,
    url: (tracking: string) =>
      `https://www.flashexpress.co.th/tracking/?se=${tracking}`,
  },
  {
    name: 'J&T Express',
    pattern: /^\d{12,15}$/,
    url: (tracking: string) =>
      `https://www.jtexpress.co.th/index/query/gzquery.html?billcode=${tracking}`,
  },
];

function detectCarrier(tracking: string, carriers: typeof JP_CARRIERS) {
  for (const carrier of carriers) {
    if (carrier.pattern.test(tracking)) {
      return carrier;
    }
  }
  return null;
}

export function TrackingNumbers({
  trackingNumberJP,
  trackingNumberTH,
  trackingNumber,
  onTrackingChange,
  readonly = false,
  compact = false,
}: TrackingNumbersProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('คัดลอกแล้ว');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('คัดลอกไม่สำเร็จ');
    }
  };

  const openTracking = (tracking: string, isJP: boolean) => {
    const carriers = isJP ? JP_CARRIERS : TH_CARRIERS;
    const carrier = detectCarrier(tracking, carriers);

    if (carrier) {
      window.open(carrier.url(tracking), '_blank');
    } else {
      // Fallback to Google search
      window.open(
        `https://www.google.com/search?q=tracking+${tracking}`,
        '_blank'
      );
    }
  };

  // Compact view for tables
  if (compact) {
    return (
      <div className="space-y-1">
        {trackingNumberJP && (
          <div className="flex items-center gap-1 text-xs">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-100 text-red-700">
              <Plane className="w-3 h-3 mr-0.5" />
              JP
            </span>
            <code className="font-mono text-gray-700">{trackingNumberJP}</code>
            <button
              onClick={() => copyToClipboard(trackingNumberJP, 'jp')}
              className="p-0.5 hover:bg-gray-100 rounded"
            >
              {copiedField === 'jp' ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-gray-400" />
              )}
            </button>
          </div>
        )}
        {trackingNumberTH && (
          <div className="flex items-center gap-1 text-xs">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
              <Ship className="w-3 h-3 mr-0.5" />
              TH
            </span>
            <code className="font-mono text-gray-700">{trackingNumberTH}</code>
            <button
              onClick={() => copyToClipboard(trackingNumberTH, 'th')}
              className="p-0.5 hover:bg-gray-100 rounded"
            >
              {copiedField === 'th' ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-gray-400" />
              )}
            </button>
          </div>
        )}
        {!trackingNumberJP && !trackingNumberTH && trackingNumber && (
          <div className="flex items-center gap-1 text-xs">
            <code className="font-mono text-gray-700">{trackingNumber}</code>
          </div>
        )}
        {!trackingNumberJP && !trackingNumberTH && !trackingNumber && (
          <span className="text-xs text-gray-400">-</span>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          หมายเลขพัสดุ (Tracking)
        </h3>
      </div>

      <div className="space-y-4">
        {/* Japan Tracking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="inline-flex items-center">
              <Plane className="w-4 h-4 mr-1 text-red-500" />
              Tracking จากญี่ปุ่น (JP)
            </span>
          </label>
          <div className="flex items-center gap-2">
            {readonly ? (
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                {trackingNumberJP || (
                  <span className="text-gray-400">ไม่มีข้อมูล</span>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={trackingNumberJP || ''}
                onChange={(e) =>
                  onTrackingChange?.('trackingNumberJP', e.target.value)
                }
                placeholder="เช่น JP123456789TH"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
              />
            )}
            {trackingNumberJP && (
              <>
                <button
                  type="button"
                  onClick={() => copyToClipboard(trackingNumberJP, 'jp')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="คัดลอก"
                >
                  {copiedField === 'jp' ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => openTracking(trackingNumberJP, true)}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                  title="ติดตามพัสดุ"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {trackingNumberJP && (
            <p className="mt-1 text-xs text-gray-400">
              {detectCarrier(trackingNumberJP, JP_CARRIERS)?.name ||
                'ไม่ทราบขนส่ง'}
            </p>
          )}
        </div>

        {/* Thailand Tracking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="inline-flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-blue-500" />
              Tracking ในไทย (TH)
            </span>
          </label>
          <div className="flex items-center gap-2">
            {readonly ? (
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                {trackingNumberTH || (
                  <span className="text-gray-400">ไม่มีข้อมูล</span>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={trackingNumberTH || ''}
                onChange={(e) =>
                  onTrackingChange?.('trackingNumberTH', e.target.value)
                }
                placeholder="เช่น TH123456789AB"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
              />
            )}
            {trackingNumberTH && (
              <>
                <button
                  type="button"
                  onClick={() => copyToClipboard(trackingNumberTH, 'th')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="คัดลอก"
                >
                  {copiedField === 'th' ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => openTracking(trackingNumberTH, false)}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                  title="ติดตามพัสดุ"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {trackingNumberTH && (
            <p className="mt-1 text-xs text-gray-400">
              {detectCarrier(trackingNumberTH, TH_CARRIERS)?.name ||
                'ไม่ทราบขนส่ง'}
            </p>
          )}
        </div>

        {/* Legacy tracking (if exists and no new tracking) */}
        {trackingNumber && !trackingNumberJP && !trackingNumberTH && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tracking (เดิม)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg font-mono text-sm">
                {trackingNumber}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(trackingNumber, 'legacy')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {copiedField === 'legacy' ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-yellow-600">
              แนะนำให้ย้ายไปยัง Tracking JP หรือ TH ตามประเภท
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Badge for showing tracking status in tables
export function TrackingBadge({
  trackingNumberJP,
  trackingNumberTH,
}: {
  trackingNumberJP?: string;
  trackingNumberTH?: string;
}) {
  const hasJP = Boolean(trackingNumberJP);
  const hasTH = Boolean(trackingNumberTH);

  if (!hasJP && !hasTH) {
    return <span className="text-xs text-gray-400">ไม่มี tracking</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {hasJP && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
          JP
        </span>
      )}
      {hasTH && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          TH
        </span>
      )}
    </div>
  );
}

export default TrackingNumbers;
