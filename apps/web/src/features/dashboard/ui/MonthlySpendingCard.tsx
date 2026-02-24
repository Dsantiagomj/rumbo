import { RiArrowRightLine, RiPieChartLine } from '@remixicon/react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

export function MonthlySpendingCard() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiPieChartLine className="size-4 text-muted-foreground" />
          Gastos por categoría
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
        <p className="text-center text-sm text-muted-foreground">
          Categoriza tus gastos para entender a dónde va tu plata
        </p>
        <Link
          to="/categories"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-foreground/80"
        >
          Gestionar categorías
          <RiArrowRightLine className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
