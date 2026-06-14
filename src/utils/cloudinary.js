import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


// function for uploading files such as videos, images or pdf on cloud with cloudinary 
// service
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath) // delete the local file after upload 
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteFromCloudinary = async (cloudinaryUrl) => {
    try {
        if(!cloudinaryUrl) return null;
        //1. Extract the public ID from the URL
        // Example: https://cloudinary.com -> folder/sample
        const urlParts = cloudinaryUrl.split('/');
        const fileWithExtension = urlParts.pop(); // "sample.jpg"
        const publicIdWithoutExtension = fileWithExtension.split('.')[0]; // "sample"
        
        // Find where 'upload/' is in the URL to capture nested folders if they exist
        const uploadIndex = urlParts.indexOf('upload');
        const folders = urlParts.slice(uploadIndex + 2).join('/');

        const publicId = folders ? `${folders}/${publicIdWithoutExtension}` : publicIdWithoutExtension;

        // 2. Determine resource type (images use default, videos/PDFs need explicit type)
        // If your URL contains '/video/', you must explicitly pass resource_type: "video"
        let resourceType = "image";
        if (cloudinaryUrl.includes("/video/")) {
            resourceType = "video";
        } else if (cloudinaryUrl.includes("/raw/")) {
            resourceType = "raw";
        }

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true
        });
        return response;

    } catch (error) {
        console.error("Cloudinary file deletion failed");
        return null;
    }
}



export {uploadOnCloudinary, deleteFromCloudinary};