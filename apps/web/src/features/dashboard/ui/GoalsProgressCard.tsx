import { RiFlagLine } from '@remixicon/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

export function GoalsProgressCard() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiFlagLine className="size-4 text-muted-foreground" />
          Metas de ahorro
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Próximamente</p>
      </CardContent>
    </Card>
  );
}
