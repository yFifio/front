import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeliveryAddressFormProps {
  address: string;
  setAddress: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  state: string;
  setState: (value: string) => void;
  zip: string;
  setZip: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
}

const DeliveryAddressForm = ({
  address,
  setAddress,
  city,
  setCity,
  state,
  setState,
  zip,
  setZip,
  phone,
  setPhone,
}: DeliveryAddressFormProps) => {
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📦</span>
        <h3 className="font-semibold text-foreground">Endereço de Entrega</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Endereço Completo</Label>
        <Input 
          id="address"
          type="text"
          placeholder="Rua, número, complemento"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input 
            id="city"
            type="text"
            placeholder="Sua cidade"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input 
            id="state"
            type="text"
            placeholder="UF"
            maxLength={2}
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase())}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="zip">CEP</Label>
          <Input 
            id="zip"
            type="text"
            placeholder="00000-000"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input 
            id="phone"
            type="tel"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default DeliveryAddressForm;
