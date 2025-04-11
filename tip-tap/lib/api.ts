export class API {
  public static uploadImage = async (file: File): Promise<string> => {
    try {
      console.log("Uploading in API CLASS image:", file);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      return data.url; // Returns the URL of the uploaded image
    } catch (error) {
      console.error("Upload failed:", error);
      throw new Error("Image upload failed");
    }
  };
}

export default API;
