const QRCode = require("qrcode");
const s3 = require("../config/s3");

const generateAndUploadQRCode = async (text) => {
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error("AWS_S3_BUCKET is missing in environment variables");
  }

  const buffer = await QRCode.toBuffer(text, {
    type: "png",
    width: 300,
    margin: 2,
  });

  const key = `qr-codes/${text}.png`;

  const result = await s3.upload({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: "image/png",
  }).promise();

  return result.Location;
};

module.exports = generateAndUploadQRCode;
