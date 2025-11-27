import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4 font-bold">
              <span className="inline-block size-5 rounded-sm bg-primary" />
              <span>Tienda Nube</span>
            </div>
            <p className="text-sm text-muted-foreground">La mejor moda, entregada en tu puerta.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Comprar</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link className="hover:text-primary" href="#">Novedades</Link></li>
              <li><Link className="hover:text-primary" href="#">Hombre</Link></li>
              <li><Link className="hover:text-primary" href="#">Mujer</Link></li>
              <li><Link className="hover:text-primary" href="#">Rebajas</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link className="hover:text-primary" href="#">Sobre Nosotros</Link></li>
              <li><Link className="hover:text-primary" href="#">Contacto</Link></li>
              <li><Link className="hover:text-primary" href="#">Carreras</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Ayuda</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link className="hover:text-primary" href="#">FAQs</Link></li>
              <li><Link className="hover:text-primary" href="#">Envíos</Link></li>
              <li><Link className="hover:text-primary" href="#">Devoluciones</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h3 className="font-semibold mb-4">Suscríbete</h3>
            <p className="text-sm text-muted-foreground mb-3">Recibe ofertas exclusivas y noticias.</p>
            <form className="flex w-full">
              <input suppressHydrationWarning className="flex-grow min-w-0 rounded-l-md border bg-background px-3 py-2" placeholder="Tu correo" type="email" name="email" autoComplete="email" />
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-r-md font-semibold" type="submit">Enviar</button>
            </form>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© 2025 Tienda Nube. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link aria-label="Facebook" href="#">FB</Link>
            <Link aria-label="Instagram" href="#">IG</Link>
            <Link aria-label="Twitter" href="#">TW</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
