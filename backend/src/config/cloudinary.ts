import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dywvxbk4w',
  api_key: process.env.CLOUDINARY_API_KEY || '674739978726566',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'fkaMEt5nMnaSIgc6AW-JACEbWOk',
});

console.log('Cloudinary configured with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME || 'dywvxbk4w');

// Upload preset for unsigned uploads (if using upload preset method)
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'mediaflows_7e7376cd-b460-4db1-8d47-d182307d7a3e';

// Helper to create cloudinary storage for different folders
const createCloudinaryStorage = (folder: string) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `pakkuneko/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ quality: 'auto:good' }],
      public_id: (req: any, file: any) => `${folder}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    } as any,
  });
};

// File filter for images
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

// Create multer upload instances for different purposes
export const productUpload = multer({
  storage: createCloudinaryStorage('products'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const paymentUpload = multer({
  storage: createCloudinaryStorage('payments'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const scheduleUpload = multer({
  storage: createCloudinaryStorage('schedules'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const reviewUpload = multer({
  storage: createCloudinaryStorage('reviews'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const profileUpload = multer({
  storage: createCloudinaryStorage('customer-profiles'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Dynamic folder upload - creates storage on-demand
export const createDynamicUpload = (folder: string) => {
  return multer({
    storage: createCloudinaryStorage(folder),
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
