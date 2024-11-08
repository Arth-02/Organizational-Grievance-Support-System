const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFiles = async (file, organization_id, logo = false) => {
  const b64 = Buffer.from(file.buffer).toString("base64");
  let dataURI = "data:" + file.mimetype + ";base64," + b64;
  const options = {
    folder: organization_id,
    resource_type: "auto",
  };
  if (logo) {
    options["public_id"] = "logo";
  }
  const result = await cloudinary.uploader.upload(dataURI, options);
  return result;
};

// cloudinary.v2.api
// .delete_resources(['66db3ed76a6806adf5ed7fba/vpysrvx1bwg1chijrub5', '66db3ed76a6806adf5ed7fba/bzk8znnluvzlpl0kachb'], 
//   { type: 'upload', resource_type: 'image' })
// .then(console.log);

module.exports = uploadFiles;
