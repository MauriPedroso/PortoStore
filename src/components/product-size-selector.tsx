"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { addCartItem } from "@/lib/utils";

type Size = { size_id: number; name: string };

export default function ProductSizeSelector({ sizes, stockBySizeId, productId, price }: { sizes: Size[]; stockBySizeId: Record<number, number>; productId: number; price: number }) {
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [qty, setQty] = useState<number>(1);
  const currentStock = selectedSizeId ? (stockBySizeId[selectedSizeId] || 0) : 0;
  const canAdd = selectedSizeId !== null && currentStock > 0 && qty >= 1 && qty <= currentStock;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        {sizes.map((s) => {
          const stock = stockBySizeId[s.size_id] || 0;
          const disabled = stock <= 0;
          const active = selectedSizeId === s.size_id;
          return (
            <button
              key={s.size_id}
              type="button"
              disabled={disabled}
              onClick={() => {
                setSelectedSizeId(s.size_id);
                setQty((q) => Math.min(Math.max(1, q), stock));
              }}
              className={`p-3 rounded-lg border text-sm transition ${active ? 'border-primary' : ''} ${disabled ? 'border-destructive text-destructive' : 'hover:border-primary'}`}
            >
              <span className="inline-flex items-center gap-1">
                {s.name}
                {disabled && <X className="size-3" />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center border rounded-lg p-2">
          <button type="button" className="px-2" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={!selectedSizeId}>-</button>
          <input
            className="w-12 text-center bg-transparent"
            type="number"
            min={1}
            max={currentStock || 1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value || 1), currentStock || 1)))}
            disabled={!selectedSizeId}
          />
          <button type="button" className="px-2" onClick={() => setQty((q) => Math.min(currentStock || 1, q + 1))} disabled={!selectedSizeId}>+</button>
        </div>
        <Button
          className="flex-grow"
          disabled={!canAdd}
          onClick={() => {
            if (!canAdd || selectedSizeId === null) return;
            addCartItem({ product_id: productId, size_id: selectedSizeId, qty, price_snapshot: price });
          }}
        >
          Agregar al Carrito
        </Button>
      </div>
      {selectedSizeId !== null && currentStock === 0 && (
        <p className="text-sm text-destructive">Sin stock para el talle seleccionado.</p>
      )}
      {selectedSizeId !== null && qty > currentStock && (
        <p className="text-sm text-destructive">Cantidad supera el stock disponible.</p>
      )}
    </div>
  );
}
