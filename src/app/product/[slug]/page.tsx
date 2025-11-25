import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug, getFeaturedProducts } from "@/services/products";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product-card";

type Params = { slug: string };

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return notFound();

  // Fetch related products (just featured for now)
  const relatedProducts = await getFeaturedProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap gap-2 mb-8 text-sm text-muted-foreground">
        <span>Inicio</span>
        <span>/</span>
        <span>Producto</span>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div className="flex flex-col md:flex-row-reverse gap-4">
          <div className="flex-grow">
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            </div>
          </div>
          <div className="flex md:flex-col gap-3">
            {[product.image, product.image, product.image, product.image].map((src, i) => (
              <div key={i} className="relative size-20 rounded-lg overflow-hidden">
                <Image src={src} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-2">Ref. {product.slug}</p>
          </div>
          <div className="flex items-baseline gap-4">
            <p className="text-4xl font-bold text-primary">${product.price.toFixed(2)}</p>
            {/* <p className="text-xl line-through text-muted-foreground">$75.00</p> */}
          </div>
          <p className="text-muted-foreground">
            Este producto es un ejemplo migrado a Next.js con shadcn/ui.
            Selecciona opciones y agrega al carrito.
          </p>
          <div className="grid grid-cols-4 gap-3">
            {["XS", "S", "M", "L"].map((t) => (
              <button key={t} className="p-3 rounded-lg border hover:border-primary">
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center border rounded-lg p-2">
              <button className="px-2">-</button>
              <input className="w-10 text-center bg-transparent" defaultValue={1} />
              <button className="px-2">+</button>
            </div>
            <Button className="flex-grow">Agregar al Carrito</Button>
          </div>
        </div>
      </div>

      {/* Related */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">También te podría interesar</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {relatedProducts.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}