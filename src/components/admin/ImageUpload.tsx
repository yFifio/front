import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Star, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImage {
  id: string;
  image_url: string;
  file_path: string;
  is_primary: boolean;
  display_order: number;
}

interface ImageUploadProps {
  productId?: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  disabled?: boolean;
}

export function ImageUpload({ productId, images, onImagesChange, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 5MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = productId ? `${productId}/${fileName}` : `temp/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const isPrimary = images.length === 0; // First image is primary by default

      // If we have a productId, save to database
      if (productId) {
        const { data, error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: publicUrl,
            file_path: filePath,
            is_primary: isPrimary,
            display_order: images.length,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        const newImage: ProductImage = {
          id: data.id,
          image_url: data.image_url,
          file_path: data.file_path,
          is_primary: data.is_primary,
          display_order: data.display_order,
        };

        onImagesChange([...images, newImage]);

        // If this is the primary image, update the product's image_url
        if (isPrimary) {
          await supabase
            .from('products')
            .update({ image_url: publicUrl })
            .eq('id', productId);
        }
      } else {
        // For new products, track locally
        const tempImage: ProductImage = {
          id: crypto.randomUUID(),
          image_url: publicUrl,
          file_path: filePath,
          is_primary: isPrimary,
          display_order: images.length,
        };
        onImagesChange([...images, tempImage]);
      }

      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetPrimary = async (imageToSetPrimary: ProductImage) => {
    if (imageToSetPrimary.is_primary) return;

    try {
      const updatedImages = images.map(img => ({
        ...img,
        is_primary: img.id === imageToSetPrimary.id,
      }));

      if (productId) {
        // Update all images in database
        for (const img of updatedImages) {
          await supabase
            .from('product_images')
            .update({ is_primary: img.is_primary })
            .eq('id', img.id);
        }

        // Update product's main image_url
        await supabase
          .from('products')
          .update({ image_url: imageToSetPrimary.image_url })
          .eq('id', productId);
      }

      onImagesChange(updatedImages);
      toast.success('Imagem principal definida!');
    } catch (error: any) {
      toast.error('Erro ao definir imagem principal: ' + error.message);
    }
  };

  const handleRemoveImage = async (imageToRemove: ProductImage) => {
    try {
      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([imageToRemove.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // If saved in database, delete from there too
      if (productId) {
        const { error: dbError } = await supabase
          .from('product_images')
          .delete()
          .eq('id', imageToRemove.id);

        if (dbError) throw dbError;
      }

      let updatedImages = images.filter(img => img.id !== imageToRemove.id);

      // If we removed the primary image, set the first remaining as primary
      if (imageToRemove.is_primary && updatedImages.length > 0) {
        updatedImages[0].is_primary = true;
        
        if (productId) {
          await supabase
            .from('product_images')
            .update({ is_primary: true })
            .eq('id', updatedImages[0].id);

          await supabase
            .from('products')
            .update({ image_url: updatedImages[0].image_url })
            .eq('id', productId);
        }
      }

      // If no images left, clear product image_url
      if (updatedImages.length === 0 && productId) {
        await supabase
          .from('products')
          .update({ image_url: null })
          .eq('id', productId);
      }

      onImagesChange(updatedImages);
      toast.success('Imagem removida');
    } catch (error: any) {
      toast.error('Erro ao remover imagem: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Imagens do Produto</Label>
      
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image) => (
            <div 
              key={image.id} 
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 group",
                image.is_primary ? "border-primary ring-2 ring-primary/20" : "border-muted"
              )}
            >
              <img 
                src={image.image_url} 
                alt="Product" 
                className="w-full h-full object-cover"
              />
              
              {/* Primary badge */}
              {image.is_primary && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Principal
                </div>
              )}
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(image)}
                    disabled={disabled || uploading}
                    title="Definir como principal"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveImage(image)}
                  disabled={disabled || uploading}
                  title="Remover imagem"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
          <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma imagem adicionada
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
        id="image-upload"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Adicionar Imagem
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        Imagens JPG, PNG ou WebP até 5MB. A primeira imagem será definida como principal.
        Clique na estrela para mudar a imagem principal.
      </p>
    </div>
  );
}
