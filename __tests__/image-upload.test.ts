import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { uploadPosImageToStorage } from '@/features/pos/services/imageUploadService';
import { supabase } from '@/services/supabase';

describe('uploadPosImageToStorage (compresión WebP y Supabase Storage)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('comprime a WebP y sube al bucket product-images en la carpeta del comercio', async () => {
    const uploadMock = jest.fn().mockResolvedValue({ error: null });
    const getPublicUrlMock = jest.fn().mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/product-images/merchant-1/products/p1.webp' },
    });

    jest.spyOn(supabase.storage, 'from').mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    } as unknown as ReturnType<typeof supabase.storage.from>);

    const url = await uploadPosImageToStorage(
      'merchant-1',
      'products',
      {
        imageUri: 'file:///tmp/photo.jpg',
        imageBase64: 'b3JpZ2luYWw=',
        imageMimeType: 'image/jpeg',
      },
      'prod-1'
    );

    expect(ImageManipulator.manipulate).toHaveBeenCalledWith('file:///tmp/photo.jpg', {
      maxWidth: 800,
      maxHeight: 800,
    });
    const contextMock = (ImageManipulator.manipulate as jest.Mock).mock.results[0]?.value;
    expect(contextMock).toBeDefined();
    const renderedMock = await contextMock.renderAsync.mock.results[0]?.value;
    expect(renderedMock).toBeDefined();
    expect(renderedMock.saveAsync).toHaveBeenCalledWith({
      format: SaveFormat.WEBP,
      compress: 0.75,
      base64: true,
    });

    expect(supabase.storage.from).toHaveBeenCalledWith('product-images');
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringMatching(/^merchant-1\/products\/prod-1-\d+\.webp$/),
      expect.any(Uint8Array),
      {
        contentType: 'image/webp',
        upsert: true,
      }
    );
    expect(url).toBe('https://cdn.example.com/product-images/merchant-1/products/p1.webp');
  });
});
