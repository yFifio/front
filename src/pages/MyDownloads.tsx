import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Construction } from "lucide-react";

const MyDownloads = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Button
        variant="ghost"
        className="absolute top-4 left-4"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>
      
      <Card className="max-w-md w-full text-center shadow-playful">
        <CardHeader>
          <Construction className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl font-display">Em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            A seção de downloads será implementada em breve.
          </p>
          <Button onClick={() => navigate('/')} className="w-full mt-4">
            Voltar para a Loja
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyDownloads;
