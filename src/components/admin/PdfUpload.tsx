import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Upload, X } from 'lucide-react';

interface PdfUploadProps {
  currentPdf?: string | null;
  currentFileName?: string | null;
  onPdfChange: (value: { url: string | null; fileName: string | null }) => void;
  disabled?: boolean;
}

export function PdfUpload({ currentPdf, currentFileName, onPdfChange, disabled }: PdfUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('PDF muito grande. Máximo: 25MB');
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Erro ao ler o PDF'));
        reader.readAsDataURL(file);
      });

      onPdfChange({ url: dataUrl, fileName: file.name });
      toast.success('PDF importado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao importar PDF');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => onPdfChange({ url: null, fileName: null });

  return (
    <div className="space-y-3">
      <div className="border rounded-lg p-4 bg-muted/30">
        {currentPdf ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-8 h-8 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{currentFileName || 'PDF importado'}</p>
                <p className="text-sm text-muted-foreground">Arquivo digital pronto para download</p>
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={handleRemove}
              disabled={disabled || uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum PDF importado</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
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
            Importando PDF...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {currentPdf ? 'Trocar PDF' : 'Importar PDF'}
          </>
        )}
      </Button>
    </div>
  );
}
