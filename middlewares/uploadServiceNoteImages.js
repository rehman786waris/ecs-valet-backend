const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");

const uploadServiceNoteImages = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const noteId = req.params.id || "new";
      const fileName = `service-notes/${req.user.company}/${noteId}/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = uploadServiceNoteImages;
