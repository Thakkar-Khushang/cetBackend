const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config();

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

const upload = multer({
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, "files_from_node/" + Date.now().toString() + '_' + file.originalname);
    },
  }),
});

const uploadClubAvatar = multer({
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, "clubs/avatars/" + Date.now().toString() + '_' + file.originalname);
    },
  }),
});

const uploadClubBanner = multer({
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, "clubs/banners/" + Date.now().toString() + '_' + file.originalname);
    },
  }),
});

const uploadClubImages = multer({
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, "clubs/images/" + Date.now().toString() + '_' + file.originalname);
    },
  }),
});

const uploadQuestionMedia = multer({
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, "media/question/" + Date.now().toString() + '_' + file.originalname);
    },
  }),
});

const uploadAnswerMedia = multer({
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, "media/answer/" + Date.now().toString() + '_' + file.originalname);
    },
  }),
});

module.exports = {
  upload,
  uploadClubAvatar,
  uploadClubBanner,
  uploadClubImages,
  uploadQuestionMedia,
  uploadAnswerMedia,
};
