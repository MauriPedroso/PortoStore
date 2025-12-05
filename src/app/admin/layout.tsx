import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Package,
    Tags,
    Receipt,
    Settings,
    LogOut
} from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
            <aside className="hidden w-64 flex-col border-r bg-background md:flex">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <Package className="h-6 w-6" />
                        <span className="">PortoStore Admin</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Panel
                        </Link>
                        <Link
                            href="/admin/products"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Package className="h-4 w-4" />
                            Productos
                        </Link>
                        <Link
                            href="/admin/categories"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Tags className="h-4 w-4" />
                            Categorías
                        </Link>
                        <Link
                            href="/admin/orders"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Receipt className="h-4 w-4" />
                            Pedidos
                        </Link>
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    <Button variant="outline" className="w-full justify-start gap-2">
                        <LogOut className="h-4 w-4" />
                        Salir del Admin
                    </Button>
                </div>
            </aside>
            <div className="flex flex-col flex-1 sm:gap-4 sm:py-4">
                <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <div className="w-full max-w-7xl mx-auto">
                        <h1 className="text-lg font-semibold md:text-xl">Panel de Administración</h1>
                    </div>
                </header>
                <main className="grid flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 w-full max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
