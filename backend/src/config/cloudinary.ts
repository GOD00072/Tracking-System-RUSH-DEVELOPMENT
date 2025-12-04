import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Cloudinary configuration - MUST use environment variables in production
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Cloudinary environment variables not set! Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary configured with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);

// Upload preset for unsigned uploads (if using upload preset method)
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

// File filter for images
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

// Use memory storage for multer (we'll upload to Cloudinary manually)
const memoryStorage = multer.memoryStorage();

// Helper function to upload buffer to Cloudinary (SDK v2)
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `pakkuneko/${folder}`,
        public_id: `${folder}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto:good' }],
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve(result);
        else reject(new Error('Upload failed'));
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

// Custom storage engine for Cloudinary SDK v2
class CloudinaryStorageV2 implements multer.StorageEngine {
  private folder: string;

  constructor(folder: string) {
    this.folder = folder;
  }

  _handleFile(
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void
  ): void {
    const chunks: Buffer[] = [];
    file.stream.on('data', (chunk) => chunks.push(chunk));
    file.stream.on('error', (err) => cb(err));
    file.stream.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const result = await uploadToCloudinary(buffer, this.folder, file.originalname);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        } as any);
      } catch (error) {
        cb(error);
      }
    });
  }

  _removeFile(
    req: Express.Request,
    file: Express.Multer.File & { filename?: string },
    cb: (error: Error | null) => void
  ): void {
    if (file.filename) {
      cloudinary.uploader.destroy(file.filename, (error) => cb(error || null));
    } else {
      cb(null);
    }
  }
}

// Create multer upload instances for different purposes
export const productUpload = multer({
  storage: new CloudinaryStorageV2('products'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const paymentUpload = multer({
  storage: new CloudinaryStorageV2('payments'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const scheduleUpload = multer({
  storage: new CloudinaryStorageV2('schedules'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const reviewUpload = multer({
  storage: new CloudinaryStorageV2('reviews'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const profileUpload = multer({
  storage: new CloudinaryStorageV2('customer-profiles'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Dynamic folder upload - creates storage on-demand
export const createDynamicUpload = (folder: string) => {
  return multer({
    storage: new CloudinaryStorageV2(folder),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });
};

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = async (imageUrl: string): Promise<boolean> => {
  try {
    console.log('[Cloudinary] Attempting to delete:', imageUrl);

    // Extract public_id from the URL
    // Cloudinary URLs look like: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/public_id.ext
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');

    if (uploadIndex === -1) {
      console.warn('[Cloudinary] Not a Cloudinary URL:', imageUrl);
      return false;
    }

    // Get everything after 'upload/v{version}/' and remove extension
    const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, ''); // Remove file extension

    console.log('[Cloudinary] Extracted public_id:', publicId);

    // Use invalidate: true to clear CDN cache immediately
    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    console.log('[Cloudinary] Delete result:', result);

    return result.result === 'ok';
  } catch (error) {
    console.error('[Cloudinary] Error deleting:', error);
    return false;
  }
};

// Helper function to check if URL is a Cloudinary URL
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

// Helper function to check if URL is a local upload URL
export const isLocalUploadUrl = (url: string): boolean => {
  return url.startsWith('/uploads/');
};

export { cloudinary, UPLOAD_PRESET };
export default cloudinary;
