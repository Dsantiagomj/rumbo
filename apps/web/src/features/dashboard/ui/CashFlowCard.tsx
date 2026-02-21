import { RiExchangeDollarLine } from '@remixicon/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

export function CashFlowCard() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiExchangeDollarLine className="size-4 text-muted-foreground" />
          Flujo de caja
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Próximamente</p>
      </CardContent>
    </Card>
  );
}
