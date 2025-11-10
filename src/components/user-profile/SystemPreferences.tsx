import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export const SystemPreferences = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações por E-mail</p>
              <p className="text-sm text-muted-foreground">
                Receba atualizações importantes por e-mail
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações do Sistema</p>
              <p className="text-sm text-muted-foreground">
                Receba notificações no navegador
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Idioma do Sistema</p>
              <p className="text-sm text-muted-foreground">
                Português (Brasil)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
