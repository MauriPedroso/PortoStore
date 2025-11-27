import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, Tags, Plus } from "lucide-react";

export default function AdminDashboard() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Productos</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground">
                        +0% desde el mes pasado
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Categorías</CardTitle>
                    <Tags className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground">
                        Categorías activas
                    </p>
                </CardContent>
            </Card>
 <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ofertas</CardTitle>
                    <Tags className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground">Categorías activas</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Horarios</CardTitle>
                    <Tags className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground">Categorías activas</p>
                </CardContent>
            </Card>
            <div className="col-span-full grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                        <CardDescription>Gestioná el contenido de tu tienda</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Link href="/admin/products/new">
                            <Button className="w-full justify-start gap-2">
                                <Plus className="h-4 w-4" />
                                Agregar Producto
                            </Button>
                        </Link>
                        <Link href="/admin/categories/new">
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <Plus className="h-4 w-4" />
                                Agregar Categoría
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
