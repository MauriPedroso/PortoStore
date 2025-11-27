"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { getCartItems, updateCartItemQty, removeCartItem, clearCart } from "@/lib/utils";

type ProductInfo = { product_id: number; name: string; image: string; priceNow: number };
const SIZE_NAMES: Record<number, string> = { 1: "Único", 2: "XS", 3: "S", 4: "M", 5: "L", 6: "XL", 7: "XXL", 8: "Sin talle" };

export default function CartPage() {
  const [items, setItems] = useState(() => getCartItems());
  const [products, setProducts] = useState<Record<number, ProductInfo>>({});

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
    if (ids.length === 0) return;
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("product_id,name,images(url),product_prices(price)")
        .in("product_id", ids);
      if (error) return;
      const dict: Record<number, ProductInfo> = {};
      type Row = { product_id: number; name: string; product_prices?: { price: number }[]; images?: { url: string }[] };
      (data as Row[]).forEach((p) => {
        const image = p.images?.[0]?.url || "";
        const priceNow = p.product_prices?.[0]?.price || 0;
        dict[p.product_id] = { product_id: p.product_id, name: p.name, image, priceNow };
      });
      setProducts(dict);
    })();
  }, [items]);

  const subtotal = useMemo(() => items.reduce((acc, i) => acc + (Number(i.price_snapshot) || 0) * (Number(i.qty) || 1), 0), [items]);

  function incQty(product_id: number, size_id: number, current: number) {
    const next = current + 1;
    updateCartItemQty(product_id, size_id, next);
    setItems(getCartItems());
  }
  function decQty(product_id: number, size_id: number, current: number) {
    const next = Math.max(1, current - 1);
    updateCartItemQty(product_id, size_id, next);
    setItems(getCartItems());
  }
  function remove(product_id: number, size_id: number) {
    removeCartItem(product_id, size_id);
    setItems(getCartItems());
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="w-full lg:w-2/3">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Mi Carrito</h1>
            <p className="text-muted-foreground mt-2">Revisa los productos en tu carrito.</p>
          </div>
          <div className="flex flex-col gap-4">
            {items.length === 0 && (
              <div className="rounded-lg border p-6 text-sm text-muted-foreground">Tu carrito está vacío.</div>
            )}
            {items.map((ci, idx) => {
              const p = products[ci.product_id];
              const name = p?.name || `Producto #${ci.product_id}`;
              const image = p?.image || "https://images.unsplash.com/photo-1557821552-17105176677c?w=500&auto=format&fit=crop&q=60";
              const unit = Number(ci.price_snapshot) || 0;
              const total = unit * (Number(ci.qty) || 1);
              const meta = `Talle: ${SIZE_NAMES[ci.size_id] || ci.size_id}`;
              return (
                <div key={`${ci.product_id}-${ci.size_id}-${idx}`} className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border">
                  <div className="flex w-full sm:w-auto items-start gap-4">
                    <div className="relative size-[80px] rounded-lg overflow-hidden">
                      <Image src={image} alt={name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">${unit.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{meta}</p>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button className="h-8 w-8 rounded-full border" onClick={() => decQty(ci.product_id, ci.size_id, Number(ci.qty) || 1)}>-</button>
                      <input className="w-8 text-center bg-transparent" value={ci.qty} readOnly />
                      <button className="h-8 w-8 rounded-full border" onClick={() => incQty(ci.product_id, ci.size_id, Number(ci.qty) || 1)}>+</button>
                    </div>
                    <p className="font-semibold">${total.toFixed(2)}</p>
                    <button className="text-muted-foreground hover:text-red-500" onClick={() => remove(ci.product_id, ci.size_id)}>Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link className="text-sm font-medium text-primary" href="/">Ver más productos</Link>
            <button className="text-sm font-medium text-muted-foreground hover:text-red-500" onClick={() => { clearCart(); setItems([]); }}>Vaciar Carrito</button>
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="p-6 rounded-lg border sticky top-24">
            <h2 className="text-xl font-bold pb-4 border-b">Resumen del Pedido</h2>
            <div className="py-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span className="text-muted-foreground">A calcular</span>
              </div>
            </div>
            <div className="py-4 flex justify-between border-t">
              <span className="text-base font-bold">Total</span>
              <span className="text-xl font-bold">${subtotal.toFixed(2)}</span>
            </div>
            <Link href="/checkout">
              <Button className="w-full mt-2">Iniciar Compra</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
