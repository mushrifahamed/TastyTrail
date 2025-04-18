const multer = require('multer');
const path = require('path');

// Set up storage for images (in the 'uploads' directory)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Directory to store uploaded images
  },
  filename: (req, file, cb) => {
    const { name, menuItemNames } = req.body;

    // If it's a cover image
    if (file.fieldname === 'coverImage') {
      cb(null, `${name.replace(/\s+/g, '_').toLowerCase()}_cover_image_${Date.now()}${path.extname(file.originalname)}`);
    }
    // If it's a menu item image (for each menu item)
    else if (file.fieldname === 'menuItemImages') {
      const itemName = menuItemNames.split(',')[req.index];  // Assuming menuItemNames are passed in order
      cb(null, `${itemName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}${path.extname(file.originalname)}`);
    } else {
      cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
  },
});

// File filter to accept only images (jpg, jpeg, png)
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only jpg, jpeg, and png are allowed.'));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
