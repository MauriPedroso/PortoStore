"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Sale = { sale_id: number; total_amount: number; status: string | null; payment_type_id: number | null; sale_date: string | null };
type SaleDetail = { product_id: number | null; size_id: number | null; quantity: number; price_at_sale: number };
type PaymentRecord = {
  payment_record_id?: number;
  sale_id: number;
  payment_type_id: number;
  amount: number;
  currency?: string | null;
  reference_number?: string | null;
  origin_name?: string | null;
  origin_bank?: string | null;
  amount_received?: number | null;
  change_given?: number | null;
  transfer_date?: string | null;
  record_status?: string | null;
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "pending_approval", label: "Pendiente de aprobación" },
  { value: "paid", label: "Pagada" },
  { value: "dispatched", label: "Despachada" },
  { value: "in_branch", label: "En sucursal" },
  { value: "picked_up", label: "Retirada" },
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [sale, setSale] = useState<Sale | null>(null);
  const [details, setDetails] = useState<SaleDetail[]>([]);
  const [status, setStatus] = useState<string>("pending");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: saleRow } = await supabase
        .from("sales")
        .select("sale_id,total_amount,status,payment_type_id,sale_date")
        .eq("sale_id", id)
        .single();
      const { data: items } = await supabase
        .from("sale_details")
        .select("product_id,size_id,quantity,price_at_sale")
        .eq("sale_id", id);
      const { data: pr } = await supabase
        .from("payment_records")
        .select("payment_record_id,sale_id,payment_type_id,amount,currency,reference_number,origin_name,origin_bank,amount_received,change_given,transfer_date,record_status")
        .eq("sale_id", id)
        .maybeSingle();
      if (saleRow) {
        setSale(saleRow as Sale);
        setStatus((saleRow as Sale).status || "pending");
      }
      setDetails((items as SaleDetail[]) || []);
      if (pr) setPayment(pr as PaymentRecord);
    })();
  }, [id]);

  const totalCalc = useMemo(() => details.reduce((acc, d) => acc + Number(d.price_at_sale || 0) * Number(d.quantity || 0), 0), [details]);

  async function updateStatus(next: string) {
    if (!sale) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("sales").update({ status: next }).eq("sale_id", sale.sale_id);
    if (error) {
      setError(error.message || "No se pudo actualizar el estado");
    } else {
      setStatus(next);
    }
    setSaving(false);
  }

  async function markAllGood() {
    // Para transferencia, marcamos como "paid"; para efectivo, también como "paid" inmediatamente
    await updateStatus("paid");
  }

  async function savePaymentRecord(next: PaymentRecord) {
    if (!sale || !sale.payment_type_id) return;
    setSaving(true);
    setError(null);
    const row = { ...next, sale_id: sale.sale_id, payment_type_id: sale.payment_type_id };
    const { data, error } = await supabase
      .from("payment_records")
      .upsert([row], { onConflict: "sale_id" })
      .select()
      .maybeSingle();
    if (error) {
      setError(error.message || "No se pudo guardar el registro de pago");
    } else {
      setPayment(data as PaymentRecord);
      if (row.record_status === "verified") await updateStatus("paid");
    }
    setSaving(false);
  }

  return (
    <div className="grid gap-4 max-w-4xl w-full mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Pedido #{id}</h1>
        <Button variant="outline" onClick={() => router.back()}>Volver</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Pedido</CardTitle>
          <CardDescription>Revisá ítems y estados.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2 text-sm">
            <div><span className="text-muted-foreground">Fecha: </span>{sale?.sale_date ? new Date(sale.sale_date).toLocaleString() : "-"}</div>
            <div><span className="text-muted-foreground">Estado: </span>
              <select className="h-9 rounded-md border bg-transparent px-3 text-sm" value={status} onChange={(e) => updateStatus(e.target.value)} disabled={saving}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Talle</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((d, idx) => (
                <TableRow key={idx}>
                  <TableCell>#{d.product_id ?? "-"}</TableCell>
                  <TableCell>{d.size_id ?? "-"}</TableCell>
                  <TableCell>{d.quantity}</TableCell>
                  <TableCell>${Number(d.price_at_sale || 0).toFixed(2)}</TableCell>
                  <TableCell>${(Number(d.price_at_sale || 0) * Number(d.quantity || 0)).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {details.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Sin ítems.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-muted-foreground">Total calculado</div>
            <div className="text-xl font-bold">${totalCalc.toFixed(2)}</div>
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div className="flex gap-3">
            <Button type="button" onClick={markAllGood} disabled={saving}>Marcar todo correcto</Button>
            <Button type="button" variant="secondary" onClick={() => router.refresh()} disabled={saving}>Actualizar</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Registro de Pago</CardTitle>
          <CardDescription>Registrá comprobantes o montos según el método.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {sale?.payment_type_id === 3 && (
            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Monto transferido</label>
                <input className="h-10 rounded-md border bg-transparent px-3 text-sm" type="number" step="0.01" defaultValue={payment?.amount ?? undefined} onChange={(e) => setPayment({ ...(payment || { sale_id: id, payment_type_id: 3, amount: 0 }), amount: Number(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">N° comprobante</label>
                <input className="h-10 rounded-md border bg-transparent px-3 text-sm" defaultValue={payment?.reference_number ?? undefined} onChange={(e) => setPayment({ ...(payment || { sale_id: id, payment_type_id: 3, amount: 0 }), reference_number: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Origen (titular)</label>
                <input className="h-10 rounded-md border bg-transparent px-3 text-sm" defaultValue={payment?.origin_name ?? undefined} onChange={(e) => setPayment({ ...(payment || { sale_id: id, payment_type_id: 3, amount: 0 }), origin_name: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Banco de origen</label>
                <input className="h-10 rounded-md border bg-transparent px-3 text-sm" defaultValue={payment?.origin_bank ?? undefined} onChange={(e) => setPayment({ ...(payment || { sale_id: id, payment_type_id: 3, amount: 0 }), origin_bank: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Fecha de transferencia</label>
                <input className="h-10 rounded-md border bg-transparent px-3 text-sm" type="datetime-local" defaultValue={payment?.transfer_date ?? undefined} onChange={(e) => setPayment({ ...(payment || { sale_id: id, payment_type_id: 3, amount: 0 }), transfer_date: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Estado del registro</label>
                <select className="h-10 rounded-md border bg-transparent px-3 text-sm" defaultValue={payment?.record_status ?? "recorded"} onChange={(e) => setPayment({ ...(payment || { sale_id: id, payment_type_id: 3, amount: 0 }), record_status: e.target.value })}>
                  <option value="recorded">Registrado</option>
                  <option value="verified">Verificado</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button type="button" onClick={() => payment && savePaymentRecord(payment)} disabled={saving}>Guardar registro</Button>
              </div>
            </div>
          )}
          {sale?.payment_type_id === 1 && (
            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Monto recibido</label>
                <input className="h-10 rounded-md border bg-transparent px-3 text-sm" type="number" step="0.01" defaultValue={payment?.amount_received ?? undefined} onChange={(e) => setPayment({ ...(payment || { sale_id: id, payment_type_id: 1, amount: 0 }), amount_received: Number(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Vuelto</label>
                <input className="h-10 rounded-md border bg-transparent px-3 text-sm" type="number" step="0.01" defaultValue={payment?.change_given ?? undefined} onChange={(e) => setPayment({ ...(payment || { sale_id: id, payment_type_id: 1, amount: 0 }), change_given: Number(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Estado del registro</label>
                <select className="h-10 rounded-md border bg-transparent px-3 text-sm" defaultValue={payment?.record_status ?? "recorded"} onChange={(e) => setPayment({ ...(payment || { sale_id: id, payment_type_id: 1, amount: 0 }), record_status: e.target.value })}>
                  <option value="recorded">Registrado</option>
                  <option value="verified">Verificado</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button type="button" onClick={() => payment && savePaymentRecord(payment)} disabled={saving}>Guardar registro</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
