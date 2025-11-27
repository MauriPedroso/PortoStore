import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type CartItem = {
  product_id: number
  size_id: number
  qty: number
  price_snapshot?: number
}

const CART_KEY = "cart_items"

export function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function setCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {}
}

export function addCartItem(item: CartItem) {
  const items = getCartItems()
  const idx = items.findIndex(
    (i) => i.product_id === item.product_id && i.size_id === item.size_id
  )
  if (idx >= 0) {
    items[idx] = { ...items[idx], qty: items[idx].qty + item.qty }
  } else {
    items.push(item)
  }
  setCartItems(items)
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new Event("cart_updated"))
    } catch {}
  }
}

export function getCartCount(): number {
  const items = getCartItems()
  return items.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
}

export function updateCartItemQty(product_id: number, size_id: number, qty: number) {
  const items = getCartItems()
  const idx = items.findIndex((i) => i.product_id === product_id && i.size_id === size_id)
  if (idx >= 0) {
    items[idx] = { ...items[idx], qty: Math.max(1, qty) }
    setCartItems(items)
    if (typeof window !== "undefined") {
      try { window.dispatchEvent(new Event("cart_updated")) } catch {}
    }
  }
}

export function removeCartItem(product_id: number, size_id: number) {
  const items = getCartItems().filter((i) => !(i.product_id === product_id && i.size_id === size_id))
  setCartItems(items)
  if (typeof window !== "undefined") {
    try { window.dispatchEvent(new Event("cart_updated")) } catch {}
  }
}

export function clearCart() {
  setCartItems([])
  if (typeof window !== "undefined") {
    try { window.dispatchEvent(new Event("cart_updated")) } catch {}
  }
}
