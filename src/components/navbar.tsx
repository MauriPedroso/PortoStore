"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, ChevronDown, User, Loader2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader } from "@/components/ui/sheet";
import ThemeToggle from "./theme-toggle";
import { getCartCount } from "@/lib/utils";
import { getCategories } from "@/services/products";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    setCartCount(getCartCount());
    const onUpdate = () => setCartCount(getCartCount());
    window.addEventListener("storage", onUpdate);
    window.addEventListener("cart_updated", onUpdate as EventListener);
    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("cart_updated", onUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cs = await getCategories();
        setCategories(cs.map((c) => c.title));
      } catch (error) {
        console.error("Error cargando categorías", error);
      }
    })();
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    // CAMBIO 1: bg-background/60 (más transparente) y backdrop-blur-md para efecto vidrio
    // Opcional: Si quieres que sea MUY transparente, usa bg-background/40
    <header className="sticky top-0 z-50 border-b bg-background/60 backdrop-blur-md transition-all">
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
        
        {/* Izquierda: Logo */}
        <div className="flex items-center z-20"> 
          <Link href="/" className="flex items-center gap-2 font-bold">
            {/* CAMBIO 3: Control estricto del tamaño del logo. 
                'h-10 w-auto' asegura que no sea más alto que la barra. 
                'object-contain' evita que se recorte. */}
            <div className="relative h-10 w-40"> 
                <Image 
                    src="/PORTO - 2.PNG" 
                    alt="PortoStore" 
                    fill
                    className="object-contain object-left"
                    priority 
                />
            </div>
          </Link>
        </div>

        {/* Centro: Navegación */}
        {/* Nota: Como "Políticas de Devolución" es largo, vigilamos el espaciado */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium absolute left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
          <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
          
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="inline-flex items-center gap-1 hover:text-primary transition-colors outline-none">
                Productos <ChevronDown className="size-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content sideOffset={8} className="bg-background/95 backdrop-blur-xl border rounded-md shadow-lg p-1 min-w-[180px] z-50">
              {categories.length === 0 ? (
                 <div className="p-4 flex justify-center"><Loader2 className="animate-spin size-4"/></div>
              ) : (
                categories.map((name) => (
                  <DropdownMenu.Item key={name} asChild>
                    <Link href={`/category/${encodeURIComponent(name)}`} className="block rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none">
                      {name}
                    </Link>
                  </DropdownMenu.Item>
                ))
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          {/* CAMBIO 2: Texto cambiado */}
          <Link href="/returns" className="hover:text-primary transition-colors">
            Políticas de Devolución
          </Link>
        </nav>

        {/* Derecha: Acciones */}
        <div className="flex items-center gap-2 z-20">
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <User className="size-5" />
          </Button>
          
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="size-5" />
              {isMounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          <ThemeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                 <div className="relative h-8 w-32">
                    <Image src="/PORTO - 2.PNG" alt="PortoStore" fill className="object-contain object-left" />
                 </div>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4">
                  <Link href="/" onClick={() => setOpen(false)} className="font-medium">Inicio</Link>
                  <Link href="/returns" onClick={() => setOpen(false)} className="font-medium">Políticas de Devolución</Link>
                   {/* ... resto del menu movil ... */}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}