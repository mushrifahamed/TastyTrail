const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const { name, menu } = req.body;
    
    try {
      // Parse menu if it's a string (from form-data)
      const parsedMenu = typeof menu === 'string' ? JSON.parse(menu) : (menu || []);
      
      if (file.fieldname === 'coverImage') {
        // Handle cover image filename
        const cleanName = name ? name.replace(/\s+/g, '_').toLowerCase() : 'restaurant';
        cb(null, `${cleanName}_cover_${Date.now()}${path.extname(file.originalname)}`);
      } 
      else if (file.fieldname === 'menuItemImages') {
        // Handle menu item images
        const index = req.files['menuItemImages']?.indexOf(file) || 0;
        const itemName = parsedMenu[index]?.name || `item_${index}`;
        cb(null, `${itemName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}${path.extname(file.originalname)}`);
      } 
      else {
        // Default filename
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
      }
    } catch (err) {
      console.error('Error generating filename:', err);
      cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only jpg, jpeg, and png are allowed.'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;