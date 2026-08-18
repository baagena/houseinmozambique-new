import { v2 as cloudinary } from 'cloudinary';

/**
 * Trim the values: a secret pasted into a hosting dashboard often carries a
 * trailing space or newline, which produces a valid-looking config that fails
 * every signed upload with "Invalid Signature".
 */
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const API_KEY = process.env.CLOUDINARY_API_KEY?.trim();
const API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim();

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

export const FOLDERS = {
  HOUSES: 'houseinmozambique/houses',
  PROFILES: 'houseinmozambique/profiles',
  BLOGS: 'houseinmozambique/blogs',
};

/** Which of the three Cloudinary variables are missing in this environment. */
export function missingCloudinaryConfig(): string[] {
  return [
    ['CLOUDINARY_CLOUD_NAME', CLOUD_NAME],
    ['CLOUDINARY_API_KEY', API_KEY],
    ['CLOUDINARY_API_SECRET', API_SECRET],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name as string);
}

/**
 * Turns a Cloudinary failure into something the person reading it can act on.
 * "Invalid Signature" in particular means the API secret does not belong to the
 * API key in this environment — a deployment problem, not a problem with the
 * photo, so it must not be reported to the user as a bad image.
 */
export function describeCloudinaryError(error: unknown): string {
  const raw =
    (error as { error?: { message?: string } })?.error?.message ||
    (error as { message?: string })?.message ||
    String(error);

  if (/invalid signature/i.test(raw)) {
    return 'Image hosting is misconfigured: the Cloudinary API secret does not match the API key for this environment. Update CLOUDINARY_API_SECRET where the site is deployed.';
  }
  if (/api_key|must supply/i.test(raw)) {
    return 'Image hosting is misconfigured: the Cloudinary credentials are missing where the site is deployed.';
  }
  if (/stale request/i.test(raw)) {
    return 'Image hosting rejected the request because the server clock is out of sync. Check the time on the deployment.';
  }
  if (/file size|too large|maximum/i.test(raw)) {
    return 'That photo is too large for the image host. Try a smaller picture.';
  }
  if (/invalid image|unsupported/i.test(raw)) {
    return 'That file could not be read as an image. Try a different photo.';
  }

  return raw;
}

/**
 * Uploads an image to Cloudinary in a specific folder.
 * @param file - The base64 string or file path to upload.
 * @param folder - One of FOLDERS constants.
 */
export async function uploadImage(file: string, folder: string) {
  const missing = missingCloudinaryConfig();
  if (missing.length > 0) {
    throw new Error(
      `Image hosting is not configured. Missing environment variable(s): ${missing.join(', ')}.`
    );
  }

  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    // Log the provider's own wording for debugging, surface the plain-English one.
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(describeCloudinaryError(error));
  }
}

export default cloudinary;
