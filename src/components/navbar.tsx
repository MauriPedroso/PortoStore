"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import ThemeToggle from "./theme-toggle";
import { getCartCount } from "@/lib/utils";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/product/vestido-floral", label: "Productos" },
  { href: "/cart", label: "Carrito" },
  { href: "/checkout", label: "Checkout" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => getCartCount());
  const pathname = usePathname();
  useEffect(() => {
    const onUpdate = () => setCartCount(getCartCount());
    window.addEventListener("storage", onUpdate);
    window.addEventListener("cart_updated", onUpdate as EventListener);
    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("cart_updated", onUpdate as EventListener);
    };
  }, []);
  if (pathname?.startsWith("/admin")) return null;
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="inline-block size-5 rounded-sm bg-primary" />
            <span>Tienda Nube</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-primary">
                {l.label}
              </Link>
            ))}
            <Link href="#" className="text-primary">Sale</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Buscar">
            <Search className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Cuenta" className="hidden sm:inline-flex">
            <User className="size-5" />
          </Button>
          <Link href="/cart" aria-label="Carrito" className="inline-flex">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <span className="font-bold">Tienda Nube</span>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-3">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="py-2 px-2 rounded hover:bg-muted"
                  >
                    {l.label}
                  </Link>
                ))}
                <Link href="#" className="py-2 px-2 rounded hover:bg-muted" onClick={() => setOpen(false)}>
                  Sale
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
