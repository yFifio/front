import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

interface DigitalFile {
  id: string;
  file_name: string;
  file_path: string;
}

interface FileUploadProps {
  productId?: string;
  existingFiles: DigitalFile[];
  onFilesChange: (files: DigitalFile[]) => void;
  disabled?: boolean;
}

export function FileUpload({ productId, existingFiles, onFilesChange, disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 50MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = productId ? `${productId}/${fileName}` : `temp/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('digital-products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // If we have a productId, save to digital_files table
      if (productId) {
        const { data, error: dbError } = await supabase
          .from('digital_files')
          .insert({
            product_id: productId,
            file_name: file.name,
            file_path: filePath,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        onFilesChange([...existingFiles, data as DigitalFile]);
      } else {
        // For new products, just track locally
        const tempFile: DigitalFile = {
          id: crypto.randomUUID(),
          file_name: file.name,
          file_path: filePath,
        };
        onFilesChange([...existingFiles, tempFile]);
      }

      toast.success('Arquivo enviado com sucesso!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar arquivo: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async (file: DigitalFile) => {
    try {
      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from('digital-products')
        .remove([file.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // If it's a saved file (has real id from DB), delete from database
      if (productId && file.id && !file.id.includes('-')) {
        const { error: dbError } = await supabase
          .from('digital_files')
          .delete()
          .eq('id', file.id);

        if (dbError) throw dbError;
      }

      onFilesChange(existingFiles.filter(f => f.id !== file.id));
      toast.success('Arquivo removido');
    } catch (error: any) {
      toast.error('Erro ao remover arquivo: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Arquivos Digitais (PDF)</Label>
      
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          {existingFiles.map((file) => (
            <div 
              key={file.id} 
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {file.file_name}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFile(file)}
                disabled={disabled || uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
          id="file-upload"
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
              Adicionar PDF
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Arquivos PDF até 50MB. Estes arquivos serão disponibilizados para download após a compra.
      </p>
    </div>
  );
}
