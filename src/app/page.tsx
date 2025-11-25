import Image from "next/image";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product-card";
import { getFeaturedProducts, getCategories } from "@/services/products";

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();
  const categories = await getCategories();

  return (
    <div>
      {/* Hero */}
      <div
        className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center text-center"
      >
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcy2wgH3Hf73X1BmC_IYLyX2n23WfPd2dz8v98s_8bKJxkQcPXRNHzuAj_PrKja7FafcXDoNXFcmml55XG_wNCcfFUDveUSqdMdY6PCePWmjiXjQwZyPSW0McpsuE203QiaWqinV7S1s13ReJE3hP7IlQPWdYl7kSnn59pB0Q9ZMW0J4bAzHtBlr3oQvS2f-li4CpDkbHyVEHlgsdag-RHu5L1r8OKIqN2ZFOJrStb9iCJdqWULVPZa0B3EQkIY_Pu1okdJBvmVJVF"
          alt="Modelos vistiendo ropa de la nueva colección"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 p-4 text-white max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            Descubre la Colección Otoño/Invierno
          </h1>
          <p className="text-lg md:text-xl mb-8">
            Estilos modernos para la nueva temporada. Elegancia y confort.
          </p>
          <Button className="bg-accent text-accent-foreground">Comprar Ahora</Button>
        </div>
      </div>

      {/* Productos Destacados */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Productos Destacados</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredProducts.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Banner promocional */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="relative overflow-hidden rounded-xl min-h-[300px]">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5DUU6P1otb6Q7sOROQhVOWmPyhcTnygROgykF8aCrWOiy6nn7rgflFMn3DY6NhXEp533oSJSURVjJ2h4F8KAJ7yJQHEUAt_5dvSy5R3pVQF2MGC6sHki9QqfyRDytHc-MwTlRyfrf89_9JpBoLcRsDpxWa5UHP8b0CdEAw_wpx0fVWDzOOHSaLyBCb8HM2r60OeQApdLahnN-fo4kYIPH7TDM1LuTXYJEgsK3GTHBLB_QRejkIBVuChclTC--z5zslGAqrU7tVnXZ"
            alt="Texturas de tela en tonos cálidos"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative z-10 p-8 text-white">
            <h3 className="text-4xl font-bold leading-tight mb-2">Rebajas de Mitad de Temporada</h3>
            <p className="text-lg">Hasta 50% de descuento en artículos seleccionados.</p>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Comprar por Categoría</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (
            <div key={c.title} className="relative h-80 rounded-lg overflow-hidden group">
              <Image src={c.image} alt={c.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white text-2xl font-bold tracking-wide">{c.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
