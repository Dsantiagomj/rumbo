import { RiArrowRightLine, RiExchangeDollarLine } from '@remixicon/react';
import { Link } from '@tanstack/react-router';
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
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
        <p className="text-center text-sm text-muted-foreground">
          Registra transacciones para ver tus ingresos vs gastos
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-foreground/80"
        >
          Registrar transacción
          <RiArrowRightLine className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
