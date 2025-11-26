import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  ZoomIn,
  Trash2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

interface ImageUploadProps {
  orderItemId: string;
  existingImages?: string[];
  onImagesChange?: (images: string[]) => void;
  maxImages?: number;
  readonly?: boolean;
}

export function ImageUpload({
  orderItemId,
  existingImages = [],
  onImagesChange,
  maxImages = 10,
  readonly = false,
}: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        toast.error(`สามารถอัปโหลดได้สูงสุด ${maxImages} รูปเท่านั้น`);
        return;
      }

      const selectedFiles = Array.from(files).slice(0, remainingSlots);

      // Validate file types
      const validFiles = selectedFiles.filter((file) => {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} ไม่ใช่ไฟล์รูปภาพ`);
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} มีขนาดเกิน 5MB`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setUploading(true);

      try {
        const formData = new FormData();
        validFiles.forEach((file) => {
          formData.append('images', file);
        });

        const response = await api.post(
          `/api/v1/upload/order-item-images/${orderItemId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.data.success) {
          const newImages = response.data.data.allImages;
          setImages(newImages);
          onImagesChange?.(newImages);
          toast.success(`อัปโหลดสำเร็จ ${validFiles.length} รูป`);
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error(error.response?.data?.error?.message || 'อัปโหลดไม่สำเร็จ');
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [orderItemId, images.length, maxImages, onImagesChange]
  );

  const handleRemoveImage = async (imageUrl: string) => {
    if (readonly) return;

    try {
      await api.delete(`/api/v1/upload/order-item-image/${orderItemId}`, {
        data: { imageUrl },
      });

      const newImages = images.filter((img) => img !== imageUrl);
      setImages(newImages);
      onImagesChange?.(newImages);
      toast.success('ลบรูปภาพสำเร็จ');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('ลบรูปภาพไม่สำเร็จ');
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (readonly) return;
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect, readonly]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {!readonly && images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            uploading
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="mt-2 text-sm text-blue-600">กำลังอัปโหลด...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-10 h-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                ลากไฟล์มาวางที่นี่ หรือ{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  เลือกไฟล์
                </button>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                PNG, JPG, GIF สูงสุด 5MB ({images.length}/{maxImages} รูป)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((imageUrl, index) => (
            <div
              key={`${imageUrl}-${index}`}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
            >
              <img
                src={imageUrl}
                alt={`รูปสินค้า ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext fill="%239ca3af" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPreviewImage(imageUrl)}
                  className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 shadow-lg"
                  title="ดูรูปขนาดใหญ่"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(imageUrl)}
                    className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg"
                    title="ลบรูป"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Image number badge */}
              <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}

          {/* Add more button */}
          {!readonly && images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
              disabled={uploading}
            >
              <Plus className="w-8 h-8" />
              <span className="text-xs mt-1">เพิ่มรูป</span>
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && readonly && (
        <div className="text-center py-8 text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2" />
          <p>ไม่มีรูปสินค้า</p>
        </div>
      )}

      {/* Preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// Compact gallery view (read-only)
interface ImageGalleryProps {
  images: string[];
  maxDisplay?: number;
}

export function ImageGallery({ images, maxDisplay = 4 }: ImageGalleryProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const displayImages = images.slice(0, maxDisplay);
  const remainingCount = images.length - maxDisplay;

  if (images.length === 0) {
    return (
      <span className="text-gray-400 text-sm flex items-center">
        <ImageIcon className="w-4 h-4 mr-1" />
        ไม่มีรูป
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {displayImages.map((imageUrl, index) => (
          <button
            key={`${imageUrl}-${index}`}
            type="button"
            onClick={() => setPreviewImage(imageUrl)}
            className="w-8 h-8 rounded overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
          >
            <img
              src={imageUrl}
              alt={`รูป ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-gray-500 ml-1">+{remainingCount}</span>
        )}
      </div>

      {/* Preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default ImageUpload;
