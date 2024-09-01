const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFiles = async (file, organization_id) => {
  const b64 = Buffer.from(file.buffer).toString("base64");
  let dataURI = "data:" + file.mimetype + ";base64," + b64;
  const options = {
    folder: organization_id,
    resource_type: "auto",
  };
  const result = await cloudinary.uploader.upload(dataURI, options);
  return result;
};

module.exports = uploadFiles;
