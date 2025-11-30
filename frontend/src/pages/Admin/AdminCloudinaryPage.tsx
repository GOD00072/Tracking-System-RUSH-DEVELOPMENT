import { useState } from 'react';
import {
  Cloud,
  Trash2,
  RefreshCw,
  Image,
  HardDrive,
  AlertTriangle,
  Check,
  FolderOpen,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../components/LoadingSpinner';

interface OrphanedImage {
  public_id: string;
  url: string;
  folder: string;
  created_at: string;
  bytes: number;
  format: string;
  reason: string;
}

interface ScanResult {
  cloudinaryTotal: number;
  databaseTotal: number;
  orphanedTotal: number;
  orphanedImages: OrphanedImage[];
  totalCloudinarySize: number;
  totalOrphanedSize: number;
  byFolder: {
    products: number;
    schedules: number;
    reviews: number;
    payments: number;
  };
}

interface CloudinaryStats {
  plan: string;
  credits: { usage: number; limit: number; usedPercent: number };
  storage: { usage: number; limit: number; usedPercent: number };
  bandwidth: { usage: number; limit: number; usedPercent: number };
  transformations: { usage: number; limit: number; usedPercent: number };
  resources: number;
  derivedResources: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AdminCloudinaryPage = () => {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [stats, setStats] = useState<CloudinaryStats | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await api.get('/cloudinary-cleanup/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to fetch stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    setSelectedImages(new Set());
    try {
      const response = await api.get('/cloudinary-cleanup/scan');
      if (response.data.success) {
        setScanResult(response.data.data);
        toast.success(t('admin.cloudinary.scanComplete'));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) {
      toast.error(t('admin.cloudinary.selectImages'));
      return;
    }

    if (!confirm(t('admin.cloudinary.confirmDelete', { count: selectedImages.size }))) {
      return;
    }

    setDeleting(true);
    try {
      const response = await api.delete('/cloudinary-cleanup/delete', {
        data: { imageUrls: Array.from(selectedImages) },
      });
      if (response.data.success) {
        toast.success(t('admin.cloudinary.deleteSuccess', { count: response.data.data.deletedCount }));
        setSelectedImages(new Set());
        await handleScan();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!scanResult || scanResult.orphanedTotal === 0) {
      toast.error(t('admin.cloudinary.noOrphaned'));
      return;
    }

    if (!confirm(t('admin.cloudinary.confirmDeleteAll', { count: scanResult.orphanedTotal }))) {
      return;
    }

    setDeleting(true);
    try {
      const response = await api.delete('/cloudinary-cleanup/delete-all');
      if (response.data.success) {
        toast.success(t('admin.cloudinary.deleteAllSuccess', {
          count: response.data.data.deletedCount,
          size: formatBytes(response.data.data.freedBytes || 0)
        }));
        setScanResult(null);
        setSelectedImages(new Set());
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Delete all failed');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectImage = (url: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedImages(newSelected);
  };

  const toggleSelectAll = () => {
    if (!scanResult) return;
    if (selectedImages.size === scanResult.orphanedImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(scanResult.orphanedImages.map((img) => img.url)));
    }
  };

  const getFolderColor = (folder: string) => {
    const colors: Record<string, string> = {
      products: 'bg-blue-100 text-blue-700',
      schedules: 'bg-green-100 text-green-700',
      reviews: 'bg-purple-100 text-purple-700',
      payments: 'bg-amber-100 text-amber-700',
    };
    return colors[folder] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Cloud className="w-8 h-8 text-blue-500" />
              {t('admin.cloudinary.title')}
            </h1>
            <p className="text-gray-600 mt-2">{t('admin.cloudinary.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchStats}
              disabled={loadingStats}
              className="btn-secondary flex items-center gap-2"
            >
              <HardDrive className="w-4 h-4" />
              {loadingStats ? t('admin.cloudinary.loading') : t('admin.cloudinary.viewStats')}
            </button>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? t('admin.cloudinary.scanning') : t('admin.cloudinary.scan')}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Storage Stats */}
          {stats && (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold">{t('admin.cloudinary.storageStats')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('admin.cloudinary.storage')}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.storage.usage)}</p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(stats.storage.usedPercent, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats.storage.usedPercent.toFixed(1)}% used</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('admin.cloudinary.bandwidth')}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.bandwidth.usage)}</p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min(stats.bandwidth.usedPercent, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats.bandwidth.usedPercent.toFixed(1)}% used</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('admin.cloudinary.resources')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resources.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('admin.cloudinary.totalImages')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('admin.cloudinary.transformations')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.transformations.usage.toLocaleString()}</p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.min(stats.transformations.usedPercent, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats.transformations.usedPercent.toFixed(1)}% used</p>
                </div>
              </div>
            </div>
          )}

          {/* Scan Results Summary */}
          {scanResult && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold">{t('admin.cloudinary.scanResults')}</h2>
                </div>
                {scanResult.orphanedTotal > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    disabled={deleting}
                    className="btn-danger flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? t('admin.cloudinary.deleting') : t('admin.cloudinary.deleteAll')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Cloud className="w-5 h-5" />
                    <span className="font-medium">Cloudinary</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{scanResult.cloudinaryTotal}</p>
                  <p className="text-sm text-blue-600">{formatBytes(scanResult.totalCloudinarySize)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <Database className="w-5 h-5" />
                    <span className="font-medium">{t('admin.cloudinary.inDatabase')}</span>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mt-2">{scanResult.databaseTotal}</p>
                  <p className="text-sm text-green-600">{t('admin.cloudinary.activeImages')}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">{t('admin.cloudinary.orphaned')}</span>
                  </div>
                  <p className="text-3xl font-bold text-amber-900 mt-2">{scanResult.orphanedTotal}</p>
                  <p className="text-sm text-amber-600">{formatBytes(scanResult.totalOrphanedSize)}</p>
                </div>
              </div>

              {/* By Folder Breakdown */}
              {scanResult.orphanedTotal > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">{t('admin.cloudinary.byFolder')}</h3>
                  <div className="flex flex-wrap gap-3">
                    <div className="px-3 py-2 bg-blue-100 rounded-lg">
                      <span className="text-sm text-blue-700">products: {scanResult.byFolder.products}</span>
                    </div>
                    <div className="px-3 py-2 bg-green-100 rounded-lg">
                      <span className="text-sm text-green-700">schedules: {scanResult.byFolder.schedules}</span>
                    </div>
                    <div className="px-3 py-2 bg-purple-100 rounded-lg">
                      <span className="text-sm text-purple-700">reviews: {scanResult.byFolder.reviews}</span>
                    </div>
                    <div className="px-3 py-2 bg-amber-100 rounded-lg">
                      <span className="text-sm text-amber-700">payments: {scanResult.byFolder.payments}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Orphaned Images List */}
          {scanResult && scanResult.orphanedImages.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Image className="w-6 h-6 text-amber-600" />
                  <h2 className="text-xl font-bold">{t('admin.cloudinary.orphanedImages')}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedImages.size === scanResult.orphanedImages.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-600">{t('admin.cloudinary.selectAll')}</span>
                  </label>
                  {selectedImages.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      disabled={deleting}
                      className="btn-danger flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('admin.cloudinary.deleteSelected', { count: selectedImages.size })}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[600px] overflow-y-auto p-2">
                {scanResult.orphanedImages.map((img) => (
                  <div
                    key={img.public_id}
                    className={`relative group rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                      selectedImages.has(img.url)
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleSelectImage(img.url)}
                  >
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={img.url}
                        alt={img.public_id}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getFolderColor(img.folder)}`}>
                        {img.folder}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedImages.has(img.url)
                            ? 'bg-primary-500 text-white'
                            : 'bg-white/80 text-gray-400'
                        }`}
                      >
                        {selectedImages.has(img.url) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{formatBytes(img.bytes)}</p>
                      <p className="text-white/70 text-xs truncate">
                        {new Date(img.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No orphaned images */}
          {scanResult && scanResult.orphanedTotal === 0 && (
            <div className="card text-center py-12">
              <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('admin.cloudinary.noOrphanedTitle')}
              </h3>
              <p className="text-gray-600">
                {t('admin.cloudinary.noOrphanedDesc')}
              </p>
            </div>
          )}

          {/* Initial state */}
          {!scanResult && !scanning && (
            <div className="card text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('admin.cloudinary.readyToScan')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('admin.cloudinary.readyToScanDesc')}
              </p>
              <button
                onClick={handleScan}
                className="btn-primary inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t('admin.cloudinary.startScan')}
              </button>
            </div>
          )}

          {/* Scanning state */}
          {scanning && (
            <div className="card text-center py-12">
              <LoadingSpinner size={100} text={t('admin.cloudinary.scanningDesc')} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCloudinaryPage;
