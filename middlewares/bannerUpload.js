

const multer = require("multer");
const path = require("path");

const storageBanner = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/banners/images"));
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadBanner = multer({ storage: storageBanner });

module.exports = {
  uploadBanner,
};
