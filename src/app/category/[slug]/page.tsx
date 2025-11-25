import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductsByCategory } from "@/services/products";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";

type Params = { slug: string };

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
    const { slug } = await params;
    // Decode slug if needed, assuming simple slug for now. 
    // The category name in DB might have spaces or accents. 
    // For this implementation, I'll assume the slug passed in URL matches the category name in DB 
    // or I need a way to map slug to name. 
    // Given the previous hardcoded categories "Vestidos", "Camisetas", "Accesorios", 
    // I will try to decode URI component just in case.
    const categoryName = decodeURIComponent(slug);

    const products = await getProductsByCategory(categoryName);

    if (!products || products.length === 0) {
        // If no products found, it might be an invalid category or just empty.
        // For better UX, we could show "No products found" instead of 404, 
        // but 404 is safer if the category doesn't exist.
        // However, since I don't have a "getCategoryBySlug" method, I'll rely on products check.
        // If the user manually types a URL, they might get 404.
        // Let's show a message if empty but render the page.
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground">Inicio</Link>
                <span>/</span>
                <span className="text-foreground capitalize">{categoryName}</span>
            </div>

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold capitalize">{categoryName}</h1>
                <span className="text-muted-foreground">{products.length} productos</span>
            </div>

            {products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {products.map((p) => (
                        <ProductCard key={p.slug} product={p} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-xl text-muted-foreground">No se encontraron productos en esta categoría.</p>
                    <Button asChild className="mt-4">
                        <Link href="/">Volver al Inicio</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
