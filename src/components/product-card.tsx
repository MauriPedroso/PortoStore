import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { Product } from "@/services/products";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="group overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[3/4]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, (max-width:1024px) 25vw, 300px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Button
            className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] opacity-0 group-hover:opacity-100"
            variant="secondary"
            asChild
          >
            <Link href={`/product/${product.slug}`}>Vista Rápida</Link>
          </Button>
        </div>
        <div className="p-3">
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}