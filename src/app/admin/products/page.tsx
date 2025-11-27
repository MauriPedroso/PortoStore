import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select(`
        product_id,
        name,
        sku_base,
        categories (name),
        product_prices (price)
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return data;
}

export default async function AdminProductsPage() {
    const products = await getProducts();

    return (
        <div className="grid gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Productos</h1>
                <Link href="/admin/products/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Agregar Producto
                    </Button>
                </Link>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Todos los Productos</CardTitle>
                    <CardDescription>Gestioná el inventario.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.product_id}>
                                    <TableCell className="font-mono text-xs">{product.sku_base || '-'}</TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>
                                    {Array.isArray(product.categories)
                                            ? product.categories.map((c: { name: string }) => c.name).join(', ')
                                            : (product.categories as { name: string } | null)?.name || '-'}
                                </TableCell>
                                <TableCell>
                                    {Array.isArray(product.product_prices) && product.product_prices.length > 0
                                        ? `$${Number(product.product_prices[0].price || 0).toFixed(2)}`
                                        : '-'}
                                </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/products/${product.product_id}/edit`}>
                                            <Button variant="ghost" size="sm">Editar</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {products.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No hay productos. Creá uno para empezar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
