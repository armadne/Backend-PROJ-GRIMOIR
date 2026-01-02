const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const dir = 'images';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// Configuration du stockage Multer
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, dir);
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

// Filtrage des fichiers acceptés
const fileFilter = (req, file, callback) => {
  if (MIME_TYPES[file.mimetype]) {
    callback(null, true);
  } else {
    callback(new Error('Format de fichier non supporté'), false);
  }
};

const upload = multer({ storage, fileFilter }).single('image');

// Middleware de conversion en webp
const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const originalPath = req.file.path;
    const filenameWithoutExt = path.parse(originalPath).name;
    const webpFile = `${filenameWithoutExt}.webp`;
    const outputPath = path.join(dir, webpFile);

    await sharp(originalPath)
  .resize({
    width: 700,
    height: 1000,
    fit: 'contain',
    background: { r: 255, g: 255, b: 255 }
  })
  .webp({ quality: 80 })
  .toFile(tempPath);


    // On met à jour req.file pour utiliser le fichier webp
    req.file.webPath = outputPath;
    req.file.filename = webpFile;
    req.file.mimetype = 'image/webp';

    // NE PAS supprimer le fichier original ici
    // La suppression sera faite dans le controller après enregistrement dans MongoDB
    next();
  } catch (error) {
    console.error("Erreur traitement image :", error);
    next(error);
  }
};

module.exports = { upload, processImage };
