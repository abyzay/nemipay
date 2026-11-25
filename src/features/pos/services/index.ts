export {
  archiveCategory,
  createCategory,
  fetchActiveCategories,
  updateCategory,
} from './categoriesService';
export {
  PRODUCT_IMAGES_BUCKET,
  compressImageToWebp,
  uploadPosImageToStorage,
} from './imageUploadService';
export {
  DEFAULT_POS_CATEGORY,
  POS_CATEGORY_PRESETS,
  POS_TEMPLATES,
  archiveProduct,
  calculateCartTotalCents,
  calculateCartUnitsCount,
  createProduct,
  createProductsBatch,
  extractProductCategories,
  fetchActiveProducts,
  updateProduct,
  uploadProductImage,
} from './productsService';
