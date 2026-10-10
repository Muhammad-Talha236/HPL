import { v2 as cloudinary } from "cloudinary";
import { ENV } from "./env.js";

// This is the only place credentials are read. Controllers receive the client,
// never the secret or a hand-built Cloudinary URL.
cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
