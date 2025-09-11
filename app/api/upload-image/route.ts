import { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

export const runtime = 'nodejs';

const projectId = process.env.GCP_PROJECT_ID || 'cj-tech-381914';
const bucketName = process.env.GCS_BUCKET || 'mnemo';

function createStorage() {
  // Approach 1: Base64 encoded JSON credentials (most reliable for serverless)
  const base64Creds = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (base64Creds) {
    try {
      console.log('🔐 GCS auth: using base64 JSON credentials');
      const credentials = JSON.parse(
        Buffer.from(base64Creds, 'base64').toString()
      );
      return new Storage({
        projectId,
        credentials
      });
    } catch (error: any) {
      console.error('❌ Base64 JSON credentials failed:', error.message);
    }
  }

  // Approach 2: Explicit credentials with PEM headers
  const rawKey = process.env.PRIVATE_GCL || '';
  const client_email = process.env.GCP_CLIENT_EMAIL || '';
  const hasKey = rawKey && rawKey.trim().length > 0;
  const hasEmail = client_email && client_email.trim().length > 0;

  if (hasKey && hasEmail) {
    try {
      let private_key = rawKey.replace(/\\n/g, '\n');
      if (!private_key.includes('BEGIN PRIVATE KEY')) {
        private_key = `-----BEGIN PRIVATE KEY-----\n${private_key}\n-----END PRIVATE KEY-----\n`;
      }
      console.log('🔐 GCS auth: using explicit service account credentials');
      return new Storage({
        projectId,
        credentials: { client_email, private_key }
      });
    } catch (error: any) {
      console.error(
        '❌ Explicit credentials failed, falling back to ADC:',
        error.message
      );
    }
  }

  console.warn(
    '⚠️ GCS auth: using Application Default Credentials (no env creds found)'
  );
  return new Storage({ projectId });
}

const storage = createStorage();
const bucket = storage.bucket(bucketName);
const CDN_BASE_URL = 'https://cdn.communityjameel.io';

/**
 * Compress and convert an image to WebP format
 */
async function compressToWebP(fileBuffer: Buffer): Promise<Buffer> {
  return await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
}

/**
 * Upload a file to a folder in the bucket
 */
async function uploadToBucket(
  buffer: Buffer,
  destination: string,
  contentType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = bucket.file(destination); // Path inside the bucket
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: contentType
    });

    blobStream.on('error', (err) => {
      console.error(`🔴 Error uploading ${destination}:`, err);
      reject(new Error('Upload failed'));
    });

    blobStream.on('finish', () => {
      const publicUrl = `${CDN_BASE_URL}/${destination}`;
      resolve(publicUrl);
    });

    blobStream.end(buffer);
  });
}

export async function POST(req: Request) {
  try {
    console.log('🟢 Received request at /api/upload-image');

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const folder = formData.get('folder') as string | null; // Optional folder
    const preserveFormat = formData.get('preserveFormat') as string | null; // New flag for preserving original format

    if (!file || !fileName) {
      return new Response(
        JSON.stringify({ error: 'File and fileName are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(
      `🟢 Processing file: ${fileName}, preserveFormat: ${preserveFormat}`
    );

    // Convert to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Generate file paths with sanitized filename
    const timestamp = Date.now();
    let folderPath = '';

    // Create proper folder structure for programmes
    if (folder && preserveFormat === 'true') {
      folderPath = `website/programmes/${folder}/`;
    } else if (folder) {
      folderPath = `${folder}/`;
    }

    // Sanitize filename: remove spaces, special chars, convert to lowercase
    const sanitizedFileName = fileName
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9.-]/g, '') // Remove special characters except dots and hyphens
      .toLowerCase(); // Convert to lowercase

    // If preserveFormat is true, keep original format and name
    if (preserveFormat === 'true') {
      const originalFileName = `${folderPath}${sanitizedFileName}`;

      console.log(`🟢 Uploading original file to: ${originalFileName}`);
      const originalUrl = await uploadToBucket(
        fileBuffer,
        originalFileName,
        file.type
      );

      return new Response(JSON.stringify({ url: originalUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Legacy behavior: convert to WebP
      const originalFileName = `${folderPath}${timestamp}-${sanitizedFileName}`;
      const webpFileName = `${folderPath}${timestamp}-${sanitizedFileName.replace(/\.[^/.]+$/, '')}.webp`;

      // Compress and convert to WebP
      const webpBuffer = await compressToWebP(fileBuffer);

      // Upload original and WebP files
      console.log('🟢 Uploading original file...');
      await uploadToBucket(fileBuffer, originalFileName, file.type);

      console.log('🟢 Uploading WebP file...');
      const webpUrl = await uploadToBucket(
        webpBuffer,
        webpFileName,
        'image/webp'
      );

      return new Response(JSON.stringify({ url: webpUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('🔴 Unexpected server error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// /**
//  * Compress and convert an image to WebP format
//  * @param fileBuffer - The original file buffer
//  * @returns {Promise<Buffer>} - The converted WebP buffer
//  */
// async function compressToWebP(fileBuffer: Buffer): Promise<Buffer> {
//   try {
//     return await sharp(fileBuffer)
//       .webp({ quality: 80 }) // Adjust quality (80 is a good balance)
//       .toBuffer();
//   } catch (error) {
//     console.error("🔴 Error during image compression:", error);
//     throw new Error("Image compression failed");
//   }
// }

// /**
//  * Upload a file to Google Cloud Storage
//  * @param buffer - File buffer
//  * @param destination - Destination filename
//  * @param contentType - MIME type of file
//  * @returns {Promise<string>} - Public URL of the uploaded file
//  */
// async function uploadToBucket(buffer: Buffer, destination: string, contentType: string): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const blob = bucket.file(destination);
//     const blobStream = blob.createWriteStream({
//       resumable: false,
//       contentType: contentType,
//     });

//     blobStream.on("error", (err) => {
//       console.error(`🔴 Error uploading ${destination}:`, err);
//       reject(new Error("Upload failed"));
//     });

//     blobStream.on("finish", () => {
//       const publicUrl = `${CDN_BASE_URL}/${destination}`;
//       resolve(publicUrl);
//     });

//     blobStream.end(buffer);
//   });
// }

// export async function POST(req: Request) {
//   try {
//     console.log("🟢 Received request at /api/upload-image");

//     const formData = await req.formData();
//     const file = formData.get("file") as File;
//     const fileName = formData.get("fileName") as string;

//     if (!file || !fileName) {
//       console.error("🔴 Missing file or fileName in request");
//       return new Response(JSON.stringify({ error: "File data and file name are required" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     console.log(`🟢 Processing file: ${fileName}`);

//     // Convert file to buffer
//     const fileBuffer = Buffer.from(await file.arrayBuffer());

//     // Generate unique filenames
//     const timestamp = Date.now();
//     const originalFileName = `${timestamp}-${fileName}`;
//     const webpFileName = `${timestamp}-${fileName.replace(/\.[^/.]+$/, "")}.webp`;

//     // Compress and convert to WebP
//     const webpBuffer = await compressToWebP(fileBuffer);

//     // Upload both original and WebP files
//     console.log("🟢 Uploading original file...");
//     await uploadToBucket(fileBuffer, originalFileName, file.type);

//     console.log("🟢 Uploading WebP file...");
//     const webpUrl = await uploadToBucket(webpBuffer, webpFileName, "image/webp");

//     console.log("🟢 Upload successful!");

//     return new Response(JSON.stringify({ url: webpUrl }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("🔴 Unexpected server error:", error);
//     return new Response(JSON.stringify({ error: "Upload failed" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }

// import { NextApiRequest, NextApiResponse } from "next";
// import { Storage } from "@google-cloud/storage";

// const storage = new Storage({
//     projectId: 'cj-tech-381914', // Replace with your project ID
//     credentials: {
//       client_email: 'todo-test@cj-tech-381914.iam.gserviceaccount.com', // Replace with your client email
//       private_key:  "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDrA6xL2pfXBn9s\nVLbPWwZrCzUdXqaagKWGiWeSyuzwUzfJVb3/osWYbP3MBF/1MUihdXKbR5z1ofBk\nxPQ1ex1PIUwRKXQEummH5KSeBrfZu6A3yy5wf34wXB3+zvzsesGm1fU5se7ZYB1R\n1YEdi4KQ5Z7X7H40jD78V2svJr4SGyQmHY8WJWVfp1zVLkFMgJLTanCFCF9jrPHi\n1qd6fVzvjhPVam0vogLFF1Pw/LpJdzSSr+aHV4N34MvQ3uDWsMwl8IDNkKUSaBBX\noAVmTFxBjKhD8UXi7lBbw8aM86HOsOTB8uDKmL7VvmZ0CSLScbPy8UlTOWaLOZ/N\nU8ZAqRj7AgMBAAECggEAHkONUwFVz1djXlh0aDRxGaTKVLtlGf1aE36rS1B9fZ9B\nzlgPzRUxe+UBM94WW1Va5Ivi09M/h7QwaFGinyZ5CkEf8g/UBG3a/Ch5+G2mDFBo\nm/a6xrrsTZ73L+KI2I0gVfM0jpb2yqBhdjHX3C2khTNEpsqqH+s1izpYr6w+Cseb\nzfG6zKpeGiFicYmuPyLQ+KydHWh6YTjLeK7q6CUNiarBoHa749xmq7DNcikGbKah\nOFkJKJvmJ6QmqSu3u/512uM3M+f4khJSMOjUeTTpaHHlKF7qw4ifjcRGPzovf70H\nb8griGvvb+lpIvXxvlFu2F81zsddhdHYH0xRTcoxOQKBgQD2u5Q6hkiuUhg1c4B8\nGy1tguvONKFyeXuWncWP9GTaMik7LXjdtsHEhNLeR8YzRl4B6C/NFxhR+fN0L83+\nIpm0l80jkKAAmUbeqO6hlQHcdJlWd+7rSmufMLeSd1jmdzzaq975x0+HqmC7gvLj\nn3aRFPMG22xT9OLLt8jnmt8ryQKBgQDz12rtv+PpQUsg7ED8TJPb8BeRKOeq32OF\nuOYXYqrZcQz2CuVXJ7HNMfNney7GTDc/SROQ07GSuZGav19zzC8uck4SNE4KSVPI\nT9L5AxJk0sAJnDOFPwer9EFc0oI3JnqZ7wUitNwMoZhz4+eOriUgx7JExg5uqL2R\n6D26eLp4owKBgQCCgKTeb7hxu6piWz1SZ22Xxu/CmcPrMKZV/A1LHxFY978nNd4A\nJ3JF55tBRuVmqYl/qLff2p9afMJwafiiutph0wkGDrESoAAENYZCoPXjDSktuzH7\n8dkK0lHGfqne/KKLZu0BYJKIR23ywEiIbQfhpRsGPXkGzzhGWGdDWX9BQQKBgCl4\nd50bx51CF47v31WJiJQdT0TG2i+7cmepvKg5hakZiwTFcZ/TBnBJkIYG8zuSdsry\nmLtG5ap4mQTii09caKHTmueJscQaGH+248Cp/xTaqwJ3aGO/BoT+M6efvbm3d556\ngjsW213ildUP66/eej4K+IytyoKTfDo2b1kpcz1VAoGAID6nXn7O/PJX7yIWP1xE\nl48109kmZ1CZPAlFx3gKBwAV8r92UuktodBX5BJQD/I89hTycbiD0wF/Rf9yzze9\nxQa0xBCdmNa+3ZJ7s/vhFsmYs0qpR2r7N8YQFVFfT2oTefZqOI/NRO+amb1kjHwA\nAW+RU+lacMnnjeSq2aOe1j4=\n-----END PRIVATE KEY-----\n"
//     },
//   });

//   const bucket = storage.bucket("mnemo");
//   const CDN_BASE_URL = "http://cdn.communityjameel.io/";
//   export async function POST(req: Request) {
//     try {
//       console.log("🟢 Received request at /api/upload-image");

//       const formData = await req.formData();
//       const file = formData.get("file") as File;
//       const fileName = formData.get("fileName") as string;

//       if (!file || !fileName) {
//         console.error("🔴 Missing file or fileName in request");
//         return new Response(JSON.stringify({ error: "File data and file name are required" }), {
//           status: 400,
//           headers: { "Content-Type": "application/json" },
//         });
//       }

//       console.log(`🟢 Uploading file: ${fileName}`);

//       const fileBuffer = Buffer.from(await file.arrayBuffer());
//       const blob = bucket.file(`${Date.now()}-${fileName}`);

//       const blobStream = blob.createWriteStream({
//         resumable: false,
//       });

//       console.log("🟢 Stream initialized, starting upload...");

//       return new Promise<Response>((resolve, reject) => {
//         blobStream.on("error", (err) => {
//           console.error("🔴 Blob stream error:", err);
//           reject(
//             new Response(JSON.stringify({ error: err.message }), {
//               status: 500,
//               headers: { "Content-Type": "application/json" },
//             })
//           );
//         });

//         blobStream.on("finish", () => {
//           console.log("🟢 File uploaded successfully!");
//           const publicUrl = `${CDN_BASE_URL}/${blob.name}`;
//           resolve(
//             new Response(JSON.stringify({ url: publicUrl }), {
//               status: 200,
//               headers: { "Content-Type": "application/json" },
//             })
//           );
//         });

//         blobStream.end(fileBuffer);
//       });
//     } catch (error) {
//       console.error("🔴 Unexpected server error:", error);
//       return new Response(JSON.stringify({ error: "Upload failed" }), {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       });
//     }
//   }
