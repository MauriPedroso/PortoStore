"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { getCartItems, clearCart } from "@/lib/utils";

export default function CheckoutPage() {
  const [shipping, setShipping] = useState<"home" | "branch" | "store">("home");
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const postalCodeRef = useRef<HTMLInputElement>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash");
  const [copied, setCopied] = useState<boolean>(false);
  const [items, setItems] = useState(() => getCartItems());
  const [products, setProducts] = useState<Record<number, { name: string; image?: string; prices: { payment_type_id: number; price: number }[] }>>({});
  const [success, setSuccess] = useState<boolean>(false);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [transferRef, setTransferRef] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const bank = {
    cbu: "2850590940090412345678",
    alias: "portostore.cobros",
    bank: "Banco Nación",
    account: "Porto Store S.A.",
    cuit: "30-12345678-9",
  };
  const branches = [
    { code: "POS-CENTRO", name: "Correo Argentino - Posadas Centro", address: "Av. Mitre 1234", hours: "Lun-Vie 9-17" },
    { code: "POS-NORTE", name: "Correo Argentino - Posadas Norte", address: "Av. López y Planes 456", hours: "Lun-Vie 9-17" },
    { code: "CBA-CENTRO", name: "Correo Argentino - Córdoba Centro", address: "San Jerónimo 789", hours: "Lun-Vie 9-18" },
    { code: "BA-PALERMO", name: "Correo Argentino - Palermo", address: "Av. Santa Fe 1500", hours: "Lun-Vie 9-18" },
  ];
  const unitPriceById = useMemo(() => {
    const dict: Record<number, number> = {};
    const pid = paymentMethod === "cash" ? 1 : 3;
    items.forEach((i) => {
      const p = products[i.product_id];
      const priceRow = p?.prices?.find((r) => Number(r.payment_type_id) === pid) || p?.prices?.[0];
      dict[i.product_id] = Number(priceRow?.price) || 0;
    });
    return dict;
  }, [items, products, paymentMethod]);
  const subtotalDb = useMemo(() => items.reduce((acc, i) => acc + (unitPriceById[i.product_id] || 0) * (Number(i.qty) || 1), 0), [items, unitPriceById]);
  const total = subtotalDb + shippingCost;

  useEffect(() => {
    const onUpdate = () => setItems(getCartItems());
    window.addEventListener("storage", onUpdate);
    window.addEventListener("cart_updated", onUpdate as EventListener);
    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("cart_updated", onUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    const ids = Array.from(new Set(items.map((i) => i.product_id)));
    let cancelled = false;
    const run = async () => {
      if (ids.length === 0) {
        await Promise.resolve();
        if (!cancelled) setProducts({});
        return;
      }
      const { data } = await supabase
        .from("products")
        .select("product_id,name,images(url),product_prices(payment_type_id,price)")
        .in("product_id", ids);
      const dict: Record<number, { name: string; image?: string; prices: { payment_type_id: number; price: number }[] }> = {};
      type Row = { product_id: number; name: string; images?: { url: string }[]; product_prices?: { payment_type_id: number; price: number }[] };
      (data as Row[] | null)?.forEach((p) => {
        dict[p.product_id] = { name: p.name, image: p.images?.[0]?.url, prices: p.product_prices || [] };
      });
      if (!cancelled) setProducts(dict);
    };
    run();
    return () => { cancelled = true; };
  }, [items]);

  function validateShipping(): boolean {
    const next: Record<string, string> = {};
    if (shipping === "home") {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Email inválido";
      if (!firstName.trim()) next.firstName = "Nombre requerido";
      if (!lastName.trim()) next.lastName = "Apellido requerido";
      if (!address.trim()) next.address = "Dirección requerida";
      if (!city.trim()) next.city = "Ciudad requerida";
      const cp = postalCode.trim();
      if (!/^[0-9]{4,8}$/.test(cp)) next.postalCode = "Código postal inválido";
    }
    if (shipping === "branch") {
      if (!selectedBranch) next.branch = "Seleccioná una sucursal";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function finalizePurchase() {
    setSuccess(false);
    setSubmitError(null);
    if (!validateShipping()) return;
    if (items.length === 0) { setSubmitError("No hay productos en el carrito"); return; }
    try {
      setSaving(true);
      const paymentId = paymentMethod === "cash" ? 1 : 3;
      const initialStatus = paymentMethod === "transfer" ? "pending_approval" : "pending";
      const { data: saleRow, error: saleErr } = await supabase
        .from("sales")
        .insert([{ payment_type_id: paymentId, total_amount: total, status: initialStatus }])
        .select()
        .single();
      if (saleErr) throw saleErr;
      const sid = Number((saleRow as { sale_id: number }).sale_id);
      setSaleId(sid);
      const details = items.map((i) => ({
        sale_id: sid,
        product_id: i.product_id,
        size_id: i.size_id,
        quantity: Number(i.qty) || 1,
        price_at_sale: unitPriceById[i.product_id] || 0,
      }));
      const { error: detErr } = await supabase.from("sale_details").insert(details);
      if (detErr) throw detErr;
      if (paymentMethod === "transfer") {
        const { error: recErr } = await supabase
          .from("payment_records")
          .insert([{ sale_id: sid, payment_type_id: 3, amount: total, reference_number: transferRef || null, record_status: "recorded" }]);
        if (recErr) throw recErr;
      }
      clearCart();
      setItems([]);
      setSuccess(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo finalizar la compra";
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  }

  function calcShippingFromPostalCode(cp: string) {
    const n = parseInt(cp.replace(/[^0-9]/g, ""), 10);
    if (Number.isNaN(n)) return 0;
    if (n < 2000) return 3500;
    if (n < 5000) return 4200;
    return 5000;
  }

  function handleCalcShipping() {
    const cp = postalCodeRef.current?.value?.trim() || "";
    const cost = calcShippingFromPostalCode(cp);
    setShippingCost(cost);
  }
  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-wrap gap-2 mb-8 text-sm">
        <span className="text-primary">Carrito</span>
        <span className="text-muted-foreground">/</span>
        <span>Envío</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">Pago</span>
      </div>
      <p className="text-4xl font-black tracking-tight mb-6">Finalizar Compra</p>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <details className="rounded-xl border p-4 group" open>
            <summary className="flex cursor-pointer items-center justify-between gap-6 list-none">
              <p className="text-lg font-bold">1. Información de Envío</p>
              <span className="rotate-0 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <div className="mt-6 grid gap-4">
              <fieldset className="grid gap-3">
                <legend className="text-sm font-medium">Método de envío</legend>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="shipping_method" value="home" checked={shipping === "home"} onChange={() => { setShipping("home"); setPaymentMethod("transfer"); }} className="size-4" />
                  Envío a domicilio
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="shipping_method" value="branch" checked={shipping === "branch"} onChange={() => { setShipping("branch"); setShippingCost(0); setPaymentMethod("transfer"); }} className="size-4" />
                  Retiro en sucursal
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="shipping_method" value="store" checked={shipping === "store"} onChange={() => { setShipping("store"); setShippingCost(0); setPaymentMethod("cash"); }} className="size-4" />
                  Retiro en la tienda
                </label>
              </fieldset>
              {shipping === "home" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1" htmlFor="email">Email</label>
                    <Input id="email" placeholder="tu@email.com" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: "" })); }} />
                    {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1" htmlFor="firstName">Nombre</label>
                    <Input id="firstName" placeholder="Juan" value={firstName} onChange={(e) => { setFirstName(e.target.value); setErrors((prev) => ({ ...prev, firstName: "" })); }} />
                    {errors.firstName && <div className="text-red-500 text-xs mt-1">{errors.firstName}</div>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1" htmlFor="lastName">Apellido</label>
                    <Input id="lastName" placeholder="Pérez" value={lastName} onChange={(e) => { setLastName(e.target.value); setErrors((prev) => ({ ...prev, lastName: "" })); }} />
                    {errors.lastName && <div className="text-red-500 text-xs mt-1">{errors.lastName}</div>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1" htmlFor="address">Dirección</label>
                    <Input id="address" placeholder="Av. Siempre Viva 742" value={address} onChange={(e) => { setAddress(e.target.value); setErrors((prev) => ({ ...prev, address: "" })); }} />
                    {errors.address && <div className="text-red-500 text-xs mt-1">{errors.address}</div>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1" htmlFor="city">Ciudad</label>
                    <Input id="city" placeholder="Posadas" value={city} onChange={(e) => { setCity(e.target.value); setErrors((prev) => ({ ...prev, city: "" })); }} />
                    {errors.city && <div className="text-red-500 text-xs mt-1">{errors.city}</div>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1" htmlFor="postalCode">Código Postal</label>
                    <Input id="postalCode" placeholder="B1636" ref={postalCodeRef} value={postalCode} onChange={(e) => { setPostalCode(e.target.value); setErrors((prev) => ({ ...prev, postalCode: "" })); }} />
                    {errors.postalCode && <div className="text-red-500 text-xs mt-1">{errors.postalCode}</div>}
                  </div>
                  <div className="sm:col-span-2 flex items-end gap-3">
                    <Button type="button" variant="secondary" onClick={handleCalcShipping}>Calcular costo de envío</Button>
                    <span className="text-sm text-muted-foreground">Costo estimado: ${shippingCost.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {shipping === "branch" && (
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1" htmlFor="branch">Sucursal</label>
                    <select id="branch" className="h-10 w-full rounded-md border bg-transparent px-3 text-sm" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                      <option value="">Seleccioná sucursal</option>
                      {branches.map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                    {errors.branch && <div className="text-red-500 text-xs mt-1">{errors.branch}</div>}
                  </div>
                  <div className="text-sm text-muted-foreground">Te avisaremos cuando el pedido esté listo para retirar.</div>
                  {selectedBranch && (
                    <div className="grid gap-1 text-sm">
                      <div className="font-medium">Detalles de la sucursal</div>
                      <div>{branches.find(b => b.code === selectedBranch)?.address}</div>
                      <div className="text-muted-foreground">{branches.find(b => b.code === selectedBranch)?.hours}</div>
                    </div>
                  )}
                </div>
              )}
              {shipping === "store" && (
                <div className="grid gap-2 text-sm">
                  <div>Retiro en tienda principal.</div>
                  <div className="text-muted-foreground">Dirección: Av. Principal 123. Presentá tu número de pedido.</div>
                </div>
              )}
            </div>
          </details>
          
          <details className="rounded-xl border p-4 group">
            <summary className="flex cursor-pointer items-center justify-between gap-6 list-none">
              <p className="text-lg font-bold">2. Método de Pago</p>
              <span className="rotate-0 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <div className="mt-6 grid grid-cols-1 gap-4">
              <fieldset className="grid gap-3">
                <legend className="text-sm font-medium">Seleccioná un método</legend>
                <label className={`flex items-center gap-2 text-sm ${shipping !== "store" ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <input type="radio" name="payment_method" value="cash" className="size-4" disabled={shipping !== "store"} checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} />
                  Efectivo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="payment_method" value="transfer" className="size-4" checked={paymentMethod === "transfer"} onChange={() => setPaymentMethod("transfer")} />
                  Transferencia
                </label>
                {shipping !== "store" && (
                  <div className="text-xs text-muted-foreground">Para envío o retiro en sucursal, sólo transferencia.</div>
                )}
              </fieldset>
              {paymentMethod === "transfer" && (
                <div className="grid gap-3 rounded-md border p-4">
                  <div className="text-sm font-medium">Datos para transferencia</div>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">CBU:</span>
                      <span>{bank.cbu}</span>
                      <Button type="button" variant="secondary" size="sm" onClick={async () => { await navigator.clipboard.writeText(bank.cbu); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                        {copied ? "Copiado" : "Copiar"}
                      </Button>
                    </div>
                    <div>
                      <span className="font-medium">Alias:</span> <span>{bank.alias}</span>
                    </div>
                    <div>
                      <span className="font-medium">Banco:</span> <span>{bank.bank}</span>
                    </div>
                    <div>
                      <span className="font-medium">Titular:</span> <span>{bank.account}</span>
                    </div>
                    <div>
                      <span className="font-medium">CUIT:</span> <span>{bank.cuit}</span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Referencia de pago</label>
                    <Input placeholder="Opcional: número de comprobante o alias" value={transferRef} onChange={(e) => setTransferRef(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </details>
          <Button className="w-full" type="button" onClick={finalizePurchase} disabled={saving || items.length === 0}>Finalizar Compra</Button>
          {submitError && (<div className="mt-3 text-sm text-red-500">{submitError}</div>)}
          {success && (
            <div className="mt-4 rounded-md border p-4 text-sm">
              <p className="font-medium">¡Gracias por tu compra!</p>
              <p className="text-muted-foreground">Nos vamos a contactar con vos para coordinar el envío o retiro.</p>
              {saleId !== null && (<p className="text-muted-foreground">Número de pedido: #{saleId}</p>)}
            </div>
          )}
        </div>
        <div className="lg:col-span-5">
          <div className="sticky top-28 rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-6">Resumen del Pedido</h2>
            <ul className="space-y-4 text-sm">
              {items.map((ci, idx) => {
                const p = products[ci.product_id];
                const name = p?.name || `Producto #${ci.product_id}`;
                const unit = unitPriceById[ci.product_id] || 0;
                const qty = Number(ci.qty) || 1;
                return (
                  <li key={`${ci.product_id}-${ci.size_id}-${idx}`} className="flex justify-between">
                    <span>{name} × {qty}</span>
                    <span>${(unit * qty).toFixed(2)}</span>
                  </li>
                );
              })}
              {items.length === 0 && (
                <li className="text-muted-foreground">No hay productos en el pedido.</li>
              )}
            </ul>
            <div className="mt-8 pt-6 border-t space-y-2 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <Input placeholder="Código de descuento" />
                <Button variant="secondary">Aplicar</Button>
              </div>
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotalDb.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Envío</span><span>${shippingCost.toFixed(2)}</span></div>
              <div className="flex justify-between text-base font-bold border-t pt-4 mt-4"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
