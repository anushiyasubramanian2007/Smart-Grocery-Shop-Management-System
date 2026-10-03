import express from 'express';
import {
  getProducts,
  getLowStockProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedTamilNaduCatalog
} from '../controllers/productController.js';
import { protectOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Allow reading products (for voice or dashboard) with or without token; require owner token for modifications
router.get('/', getProducts);
router.get('/low', getLowStockProducts);
router.get('/:id', getProductById);

router.post('/', protectOwner, createProduct);
router.post('/seed-catalog', protectOwner, seedTamilNaduCatalog);
router.put('/:id', protectOwner, updateProduct);
router.delete('/:id', protectOwner, deleteProduct);

export default router;
