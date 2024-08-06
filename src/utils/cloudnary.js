import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDNARY_CLOUD_NAME,
  api_key: process.env.CLOUDNARY_API_KEY,
  api_secret: process.env.CLOUDNARY_CLOUD_SECRET_KEY, // Click 'View Credentials' below to copy your API secret
});

// Upload an image
const uploadOnCloudnary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file is upload on cludnary successfylly
    console.log("file uploaded successfully", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved teporory files as the upload operation failed
    return null;
  }
};

// cloudinary.uploader
//   .upload(
//     "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
//     {
//       public_id: "shoes",
//     }
//   )
//   .catch((error) => {
//     console.log(error);
//   });

// console.log(uploadResult);

// Optimize delivery by resizing and applying auto-format and auto-quality
const optimizeUrl = cloudinary.url("shoes", {
  fetch_format: "auto",
  quality: "auto",
});

console.log(optimizeUrl);

// Transform the image: auto-crop to square aspect_ratio
const autoCropUrl = cloudinary.url("shoes", {
  crop: "auto",
  gravity: "auto",
  width: 500,
  height: 500,
});

console.log(autoCropUrl);
