import { RiArrowRightLine, RiCalendarCheckLine } from '@remixicon/react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

export function UpcomingPaymentsCard() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiCalendarCheckLine className="size-4 text-muted-foreground" />
          Transacciones recurrentes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
        <p className="text-center text-sm text-muted-foreground">
          Configura recordatorios para tus pagos recurrentes
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-foreground/80"
        >
          Configurar pagos
          <RiArrowRightLine className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
