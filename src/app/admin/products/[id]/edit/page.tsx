"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Category = { category_id: number; name: string };
type Unit = { measurement_unit_id: number; name: string };
type Size = { size_id: number; name: string };
// type PaymentType = { payment_type_id: number; name: string };
type Product = { product_id: number; name: string; description: string | null; sku_base: string | null; category_id: number | null; measurement_unit_id: number | null };

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const FIXED_PAYMENTS: { payment_type_id: number; name: string }[] = [
    { payment_type_id: 1, name: "Efectivo" },
    { payment_type_id: 2, name: "Tarjeta de Crédito" },
    { payment_type_id: 3, name: "Transferencia" },
  ];
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);
  const [paymentPrices, setPaymentPrices] = useState<Record<number, number>>({});
  // const [sizes, setSizes] = useState<Size[]>([]);

  const [name, setName] = useState("");
  const [skuBase, setSkuBase] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [unitId, setUnitId] = useState<number | null>(null);

  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);
  const [sizeStock, setSizeStock] = useState<Record<number, number>>({});
  const FIXED_SIZES: { size_id: number; name: string }[] = [
    { size_id: 1, name: "Único" },
    { size_id: 2, name: "XS" },
    { size_id: 3, name: "S" },
    { size_id: 4, name: "M" },
    { size_id: 5, name: "L" },
    { size_id: 6, name: "XL" },
    { size_id: 7, name: "XXL" },
    { size_id: 8, name: "Sin talle" },
  ];
  // const [price, setPrice] = useState<number>(0);
  // const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    const id = Number(params?.id);
    if (!id) return;
    (async () => {
      const [prod, cats, ms] = await Promise.all([
        supabase.from("products").select("product_id,name,description,sku_base,category_id,measurement_unit_id").eq("product_id", id).single(),
        supabase.from("categories").select("category_id,name"),
        supabase.from("measurement_units").select("measurement_unit_id,name"),
      ]);
      if (cats.data) setCategories(cats.data);
      if (ms.data) setUnits(ms.data);

      const { data: priceRowsInit } = await supabase
        .from("product_prices")
        .select("payment_type_id,price")
        .eq("product_id", id);
      const paymentIds = (priceRowsInit || []).map(r => r.payment_type_id as number);
      setSelectedPaymentIds(paymentIds);
      const priceDict: Record<number, number> = {};
      (priceRowsInit || []).forEach(r => { priceDict[r.payment_type_id as number] = Number(r.price) || 0; });
      setPaymentPrices(priceDict);

      if (prod.data) {
        const p = prod.data as Product;
        setProduct(p);
        setName(p.name || "");
        setSkuBase(p.sku_base || "");
        setDescription(p.description || "");
        setCategoryId(p.category_id ?? null);
        setUnitId(p.measurement_unit_id ?? null);

        const { data: sizeRows } = await supabase
          .from("product_sizes")
          .select("size_id,stock")
          .eq("product_id", id);
        if (sizeRows && sizeRows.length > 0) {
          const ids = sizeRows.map(r => r.size_id as number);
          setSelectedSizeIds(ids);
          const dict: Record<number, number> = {};
          sizeRows.forEach(r => { dict[r.size_id as number] = Number(r.stock) || 0; });
          setSizeStock(dict);
        }
      }
    })();
  }, [params]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;
    setLoading(true);
    setError(null);
    try {
      const { error: upProductError } = await supabase
        .from("products")
        .update({ name, description, sku_base: skuBase || null, category_id: categoryId, measurement_unit_id: unitId })
        .eq("product_id", product.product_id);
      if (upProductError) throw upProductError;

      // Replace all product_prices for this product by selected payments
      const { error: delPricesError } = await supabase
        .from("product_prices")
        .delete()
        .eq("product_id", product.product_id);
      if (delPricesError) throw delPricesError;
      const priceRows = FIXED_PAYMENTS
        .filter(p => selectedPaymentIds.includes(p.payment_type_id))
        .map(p => ({ product_id: product.product_id, payment_type_id: p.payment_type_id, price: Number(paymentPrices[p.payment_type_id] || 0) }))
        .filter(r => r.price > 0);
      if (priceRows.length > 0) {
        const { error: insPriceError } = await supabase.from("product_prices").insert(priceRows);
        if (insPriceError) throw insPriceError;
      }

      const { error: delSizesError } = await supabase
        .from("product_sizes")
        .delete()
        .eq("product_id", product.product_id);
      if (delSizesError) throw delSizesError;
      const inserts = selectedSizeIds.map(id => ({ product_id: product.product_id, size_id: id, stock: sizeStock[id] || 0 }));
      if (inserts.length > 0) {
        const { error: insSizesError } = await supabase
          .from("product_sizes")
          .insert(inserts);
        if (insSizesError) throw insSizesError;
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 max-w-4xl w-full mx-auto pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Editar Producto</h1>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku_base">SKU Base</Label>
              <Input id="sku_base" value={skuBase} onChange={(e) => setSkuBase(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category_id">Categoría</Label>
                <Select value={categoryId ? String(categoryId) : undefined} onValueChange={(v) => setCategoryId(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.category_id} value={String(c.category_id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="measurement_unit_id">Unidad</Label>
                <Select value={unitId ? String(unitId) : undefined} onValueChange={(v) => setUnitId(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u.measurement_unit_id} value={String(u.measurement_unit_id)}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precios por tipo de pago</CardTitle>
            <CardDescription>Seleccioná los tipos y cargá el precio para cada uno.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FIXED_PAYMENTS.map(pt => {
                const checked = selectedPaymentIds.includes(pt.payment_type_id);
                return (
                  <label key={pt.payment_type_id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={checked} onChange={() => setSelectedPaymentIds(prev => checked ? prev.filter(x => x !== pt.payment_type_id) : [...prev, pt.payment_type_id])} />
                    <span>{pt.name}</span>
                  </label>
                );
              })}
            </div>
            <div className="grid gap-4">
              {FIXED_PAYMENTS.filter(pt => selectedPaymentIds.includes(pt.payment_type_id)).map(pt => (
                <div key={pt.payment_type_id} className="grid grid-cols-3 items-center gap-4">
                  <Label className="col-span-1">{pt.name}</Label>
                  <Input type="number" step="0.01" value={paymentPrices[pt.payment_type_id] || 0} onChange={(e) => setPaymentPrices(prev => ({ ...prev, [pt.payment_type_id]: Number(e.target.value || 0) }))} className="col-span-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventario (Talles)</CardTitle>
            <CardDescription>Seleccioná talles y definí cantidades.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FIXED_SIZES.map(s => {
                const checked = selectedSizeIds.includes(s.size_id);
                return (
                  <label key={s.size_id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={checked} onChange={() => {
                      setSelectedSizeIds(prev => checked ? prev.filter(x => x !== s.size_id) : [...prev, s.size_id]);
                    }} />
                    <span>{s.name}</span>
                  </label>
                );
              })}
            </div>
            <div className="grid gap-4">
              {FIXED_SIZES.filter(s => selectedSizeIds.includes(s.size_id)).map(size => (
                <div key={size.size_id} className="grid grid-cols-3 items-center gap-4">
                  <Label className="col-span-1">{size.name}</Label>
                  <Input type="number" value={sizeStock[size.size_id] || 0} onChange={(e) => {
                    const val = Number(e.target.value || 0);
                    setSizeStock(prev => ({ ...prev, [size.size_id]: val }));
                  }} className="col-span-2" />
                </div>
              ))}
              <div className="text-sm text-muted-foreground">Cantidad total: {selectedSizeIds.reduce((acc, id) => acc + (sizeStock[id] || 0), 0)}</div>
            </div>
          </CardContent>
        </Card>

        {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
        </div>
      </form>
    </div>
  );
}
