import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const FOLDERS = {
  HOUSES: 'houseinmozambique/houses',
  PROFILES: 'houseinmozambique/profiles',
};

/**
 * Uploads an image to Cloudinary in a specific folder.
 * @param file - The base64 string or file path to upload.
 * @param folder - One of FOLDERS constants.
 */
export async function uploadImage(file: string, folder: string) {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

export default cloudinary;
