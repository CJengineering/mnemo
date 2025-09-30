/**
 * Collection-specific API client for organized image uploads
 * Uses the folder structure: website/collections/[collection-type]/[slug]/image-name.extension
 */
export class CollectionAPI {
  /**
   * Upload image with organized folder structure for collections
   * @param file - The image file to upload
   * @param collectionType - Type of collection (e.g., 'team', 'events', 'news')
   * @param slug - The item slug for folder organization
   * @param preserveFormat - Whether to preserve original format (default: false)
   * @returns Promise<string> - The uploaded image URL
   */
  public static uploadCollectionImage = async (
    file: File,
    collectionType: string,
    slug: string,
    preserveFormat: boolean = false
  ): Promise<string> => {
    try {
      console.log(
        `Uploading collection image for ${collectionType}/${slug}:`,
        file
      );

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('collectionType', collectionType);
      formData.append('slug', slug);
      formData.append('preserveFormat', preserveFormat.toString());

      const response = await fetch('/api/upload-collection-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload collection image');
      }

      const data = await response.json();
      return data.url; // Returns the URL of the uploaded image
    } catch (error) {
      console.error('Collection image upload failed:', error);
      throw new Error('Collection image upload failed');
    }
  };

  /**
   * Upload multiple images for collections
   * @param files - Array of image files to upload
   * @param collectionType - Type of collection
   * @param slug - The item slug for folder organization
   * @param preserveFormat - Whether to preserve original format
   * @returns Promise<string[]> - Array of uploaded image URLs
   */
  public static uploadMultipleCollectionImages = async (
    files: File[],
    collectionType: string,
    slug: string,
    preserveFormat: boolean = false
  ): Promise<string[]> => {
    try {
      const uploadPromises = files.map((file) =>
        CollectionAPI.uploadCollectionImage(
          file,
          collectionType,
          slug,
          preserveFormat
        )
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple collection images upload failed:', error);
      throw new Error('Multiple collection images upload failed');
    }
  };
}

export default CollectionAPI;
