import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

type OrderRow = {
  sale_id: number;
  total_amount: number;
  status: string | null;
  sale_date: string | null;
  payment_types?: { name: string } | { name: string }[] | null;
  payment_records?: { record_status: string } | { record_status: string }[] | null;
};

async function getOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("sale_id,total_amount,status,sale_date,payment_types(name),payment_records(record_status)")
    .order("sale_date", { ascending: false })
    .limit(50);
  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  return (data as OrderRow[]) || [];
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Pedidos</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Últimos pedidos</CardTitle>
          <CardDescription>Controlá pagos y estados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const paymentName = Array.isArray(o.payment_types)
                  ? o.payment_types.map((p) => p.name).join(", ")
                  : (o.payment_types as { name: string } | null)?.name || "-";
                const dateStr = o.sale_date ? new Date(o.sale_date).toLocaleString() : "-";
                const payStatus = Array.isArray(o.payment_records)
                  ? o.payment_records.map((p) => p.record_status).join(", ")
                  : (o.payment_records as { record_status: string } | null)?.record_status || "-";
                return (
                  <TableRow key={o.sale_id}>
                    <TableCell className="font-mono text-xs">{o.sale_id}</TableCell>
                    <TableCell>{dateStr}</TableCell>
                    <TableCell>${Number(o.total_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>{paymentName}</TableCell>
                    <TableCell>{o.status || "-"} {payStatus !== "-" && (<span className="ml-2 text-xs px-2 py-1 rounded bg-secondary">{payStatus}</span>)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/orders/${o.sale_id}`}>
                        <Button variant="ghost" size="sm">Ver</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No hay pedidos cargados.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
