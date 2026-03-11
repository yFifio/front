import { useState, useRef } from 'react';
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
    
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 5MB');
      return;
    }

    setUploading(true);

    try {
      const objectUrl = URL.createObjectURL(file);
      const isPrimary = images.length === 0;

      const newImage: ProductImage = {
        id: crypto.randomUUID(),
        image_url: objectUrl,
        file_path: 'local/' + file.name,
        is_primary: isPrimary,
        display_order: images.length,
      };

      onImagesChange([...images, newImage]);
      toast.success('Imagem adicionada (localmente)!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
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

      onImagesChange(updatedImages);
      toast.success('Imagem principal definida!');
    } catch (error) {
      toast.error('Erro ao definir imagem principal: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
    }
  };

  const handleRemoveImage = async (imageToRemove: ProductImage) => {
    try {
      let updatedImages = images.filter(img => img.id !== imageToRemove.id);

      if (imageToRemove.is_primary && updatedImages.length > 0) {
        updatedImages[0].is_primary = true;
      }

      onImagesChange(updatedImages);
      toast.success('Imagem removida');
    } catch (error) {
      toast.error('Erro ao remover imagem: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
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
              
              {image.is_primary && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Principal
                </div>
              )}
              
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
