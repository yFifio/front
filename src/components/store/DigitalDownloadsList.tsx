import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Download, FileText, Loader2 } from 'lucide-react';

export interface DownloadItem {
  id: string;
  download_token: string;
  download_count: number | null;
  max_downloads: number | null;
  expires_at: string;
  product_id: string | number | null;
}

export interface DownloadOrderItem {
  id: string;
  product_name: string;
  product_id: string | number | null;
  products: {
    category: string | null;
    image_url: string | null;
  } | null;
}

export interface DownloadOrder {
  id: string;
  created_at: string | null;
  total_price?: number;
  order_items: DownloadOrderItem[];
  downloads?: DownloadItem[];
}

interface DigitalDownloadsListProps {
  orders: DownloadOrder[];
  downloadingId: string | null;
  onDownload: (download: DownloadItem) => void;
  onBrowseProducts: () => void;
  formatDate: (date: string | null) => string;
  formatPrice?: (price: number) => string;
  emptyDescription: string;
}

const getRemainingDownloads = (download: DownloadItem) => {
  if (download.max_downloads == null) return null;
  const max = download.max_downloads;
  const used = download.download_count || 0;
  return max - used;
};

const isExpired = (download: DownloadItem) => {
  const expDate = new Date(download.expires_at);
  const fiftyYearsFromNow = new Date();
  fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
  if (expDate > fiftyYearsFromNow) return false;
  return expDate < new Date();
};

export const DigitalDownloadsList = ({
  orders,
  downloadingId,
  onDownload,
  onBrowseProducts,
  formatDate,
  formatPrice,
  emptyDescription,
}: DigitalDownloadsListProps) => {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Download className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-bold text-lg mb-2">Nenhum download disponível</h3>
          <p className="text-muted-foreground text-center mb-6">{emptyDescription}</p>
          <Button onClick={onBrowseProducts}>Ver Produtos Digitais</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const digitalItems = order.order_items.filter((item) => item.products?.category === 'digital');
        const orderDownloads = order.downloads || [];

        return (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Pedido de {formatDate(order.created_at)}
                  </CardTitle>
                  {typeof order.total_price === 'number' && formatPrice && (
                    <p className="text-sm text-muted-foreground mt-1">Total: {formatPrice(order.total_price)}</p>
                  )}
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground">
                  Pago
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {digitalItems.map((item) => {
                  const download = orderDownloads.find(
                    (d) => String(d.product_id ?? '') === String(item.product_id ?? '')
                  );
                  const remaining = download ? getRemainingDownloads(download) : 0;
                  const expired = download ? isExpired(download) : false;
                  const exhausted = remaining != null ? remaining <= 0 : false;
                  const disabled = !download || expired || exhausted;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.products?.image_url ? (
                          <img
                            src={item.products.image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {!download ? (
                            'Processando...'
                          ) : expired ? (
                            <span className="text-destructive">Link expirado</span>
                          ) : exhausted ? (
                            <span className="text-destructive">Downloads esgotados</span>
                          ) : (
                            remaining == null
                              ? 'Downloads ilimitados'
                              : `${remaining} downloads restantes`
                          )}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        disabled={disabled || (download && downloadingId === download.id)}
                        onClick={() => download && onDownload(download)}
                        className="flex-shrink-0"
                      >
                        {download && downloadingId === download.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : disabled ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
