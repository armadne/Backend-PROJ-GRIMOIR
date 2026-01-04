const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGE_DIR = path.resolve('images');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR);
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGE_DIR),
  filename: (req, file, cb) => {
    const name = path.parse(file.originalname).name.replace(/\s+/g, '_');
    const ext = MIME_TYPES[file.mimetype];
    cb(null, `${name}_${Date.now()}.${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  MIME_TYPES[file.mimetype] ? cb(null, true) : cb(new Error('Format non supporté'), false);
};

const upload = multer({ storage, fileFilter }).single('image');


const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const originalPath = req.file.path;
    const baseName = path.parse(originalPath).name;
    const webpName = `${baseName}.webp`;
    const webpPath = path.join(IMAGE_DIR, webpName);

    await sharp(originalPath)
      .resize(700, 1000, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
      .webp({ quality: 80 })
      .toFile(webpPath);

    
    if (originalPath !== webpPath) fs.unlink(originalPath, () => {});

    
    req.file.filename = webpName;
    req.file.path = webpPath;
    req.file.mimetype = 'image/webp';

    next();
  } catch (err) {
    console.error('Erreur traitement image ❌', err);
    next(err);
  }
};

module.exports = { upload, processImage };
