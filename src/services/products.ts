import { supabase } from '@/lib/supabase';

export interface Product {
    product_id: number;
    slug: string;
    name: string;
    price: number;
    image: string;
}

export interface Category {
    title: string;
    image: string;
}

export async function getFeaturedProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select(`
      product_id,
      name,
      sku_base,
      product_prices (price),
      images (url)
    `)
        .limit(4);

    if (error) {
        console.error('Error fetching featured products:', error);
        return [];
    }

    type ProductRow = { product_id: number; name: string; sku_base: string | null; product_prices?: { price: number }[]; images?: { url: string }[] };
    return data.map((p: ProductRow) => ({
        product_id: p.product_id,
        slug: p.sku_base || String(p.product_id),
        name: p.name,
        price: p.product_prices?.[0]?.price || 0,
        image: p.images?.[0]?.url || '',
    }));
}

export async function getCategories(): Promise<Category[]> {
    // Since the DB schema for categories is simple (id, name), 
    // and the UI expects an image, we might need a mapping or a join if categories had images.
    // For now, based on the user request to "bring categories based on that file",
    // and the schema showing just `categories(category_id, name)`, 
    // I will fetch categories. 
    // However, the UI uses hardcoded images for categories. 
    // I will fetch the category names from DB and map them to the existing UI structure or placeholders if needed.
    // The user said "traiga las categorias y productos basandote en ese archivo".
    // The `database.sql` does NOT have images for categories.
    // I will fetch categories and use a placeholder or try to match existing ones if names match.

    const { data, error } = await supabase
        .from('categories')
        .select('name');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    // MAPPING STRATEGY:
    // The UI has "Vestidos", "Camisetas", "Accesorios" with specific images.
    // I'll return the DB categories. For images, I'll use a default or random one from the current set 
    // if I can't match them, but for now let's just return what's in DB.
    // Wait, the user wants to replace mocks.
    // If I return categories without images, the UI might break or look bad if I don't handle it.
    // I will add a helper to assign images to categories for now, or just use a placeholder.

    const defaultImages: Record<string, string> = {
        'Vestidos': "https://lh3.googleusercontent.com/aida-public/AB6AXuAfkyqJKnoCI6H_Ae8RrwODVEJyWCSQZt-YhDL892UcPI4tVMwtnss8eqaf80x10DlYkOKz_SJBXWkeWGyJrYpQZN5S6Dltl4m5j2cm8lkAtbd7kEUEe783xT4ubSHsMdSGlolNyDu1vA6SXoFY7hqH7S1Zd5obzuqNZ8lNLFbi4euJ0sz8iWg3zhFKoqQEvaEN9d725ScGbdUj4nkPbNAoCUKGwGCIc9VNtuUshPZXZ5VKu8pVO1PktNTCzAz3S9pjAkVl9DuIc-uH",
        'Camisetas': "https://lh3.googleusercontent.com/aida-public/AB6AXuCMAFWuPLupBVqtm5x43w2aq4Mg8ydFJET8CEtVuQtmDA1-iAcMsJfAbfEcXcigSsZkaKP-GQPzPhYStYtcGbkizFglRMCRxY6Vbro7YWs0qzTiFeWkZX0PBtkGv4f8RH7gnriJ5CQB87JL7RC7wpsbhRK6ItjyRKQ6MoJw_kUTuUUkh-75plilkq-Xka2Ro-LGckVOQKRfh-26FzZqsKibqJBCDs0uMnvdkeOAHB4K0oSm_g2RfwyAVnxTzVfU4WTIytfeHJNwfxhV",
        'Accesorios': "https://lh3.googleusercontent.com/aida-public/AB6AXuCSO5iVuogDxad87V7DFkHPeraQ31_CMDZCDcpaCUpP5oYZuwpCaCXoKq7KYjyAD9zccNrwCJFZsGJ8S7vu-dd6hRUoXXguH8tGJM4CumRQAke2Je4Gt08gcHJ_jZvUCd0V-FW1A1wXj_j1ZcwT2-67L2mQmd0M1dP3t94zczXSgliAKnC-MZcsIxUaet35AKDDnBvUL9u49hzNOk6Hl4su05urbOC1Tmeyd43FDFWEIsSYJHTPPrV499grptQ-r0wY_6bkdBcBmEje",
    };

    return (data || []).map((c: { name: string }) => ({
        title: c.name,
        image: defaultImages[c.name] || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHNob3BwaW5nfGVufDB8fDB8fHww',
    }));
}

export interface CategoryWithProducts extends Category {
    products: Product[];
}

export async function getProductsByCategory(categoryName: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select(`
            product_id,
            name,
            sku_base,
            product_prices (price),
            images (url),
            categories!inner (name)
        `)
        .eq('categories.name', categoryName);

    if (error) {
        console.error(`Error fetching products for category ${categoryName}:`, error);
        return [];
    }

    type ProductRow2 = { product_id: number; name: string; sku_base: string | null; product_prices?: { price: number }[]; images?: { url: string }[] };
    return data.map((p: ProductRow2) => ({
        product_id: p.product_id,
        slug: p.sku_base || String(p.product_id),
        name: p.name,
        price: p.product_prices?.[0]?.price || 0,
        image: p.images?.[0]?.url || '',
    }));
}

export async function getCategoriesWithProducts(): Promise<CategoryWithProducts[]> {
    const categories = await getCategories();

    const categoriesWithProducts = await Promise.all(categories.map(async (category) => {
        const products = await getProductsByCategory(category.title);
        return {
            ...category,
            products: products.slice(0, 4) // Get top 4
        };
    }));

    return categoriesWithProducts;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select(`
            product_id,
            name,
            sku_base,
            product_prices (price),
            images (url)
        `)
        .eq('sku_base', slug)
        .single();

    if (error) {
        // Try by ID if slug fails, just in case
        const { data: dataId, error: errorId } = await supabase
            .from('products')
            .select(`
                product_id,
                name,
                sku_base,
                product_prices (price),
                images (url)
            `)
            .eq('product_id', slug)
            .single();

        if (errorId) {
            console.error(`Error fetching product by slug ${slug}:`, error);
            return null;
        }
        return {
            product_id: dataId.product_id,
            slug: dataId.sku_base || String(dataId.product_id),
            name: dataId.name,
            price: dataId.product_prices?.[0]?.price || 0,
            image: dataId.images?.[0]?.url || '',
        };
    }

    return {
        product_id: data.product_id,
        slug: data.sku_base || String(data.product_id),
        name: data.name,
        price: data.product_prices?.[0]?.price || 0,
        image: data.images?.[0]?.url || '',
    };
}
