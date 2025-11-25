import { supabase } from '@/lib/supabase';

export interface Product {
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
      product_prices!inner (price),
      images (url)
    `)
        .limit(4);

    if (error) {
        console.error('Error fetching featured products:', error);
        return [];
    }

    return data.map((p: any) => ({
        slug: p.sku_base || String(p.product_id), // Fallback to ID if no SKU
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

    return data.map((c: any) => ({
        title: c.name,
        image: defaultImages[c.name] || "https://lh3.googleusercontent.com/aida-public/AB6AXuCcy2wgH3Hf73X1BmC_IYLyX2n23WfPd2dz8v98s_8bKJxkQcPXRNHzuAj_PrKja7FafcXDoNXFcmml55XG_wNCcfFUDveUSqdMdY6PCePWmjiXjQwZyPSW0McpsuE203QiaWqinV7S1s13ReJE3hP7IlQPWdYl7kSnn59pB0Q9ZMW0J4bAzHtBlr3oQvS2f-li4CpDkbHyVEHlgsdag-RHu5L1r8OKIqN2ZFOJrStb9iCJdqWULVPZa0B3EQkIY_Pu1okdJBvmVJVF" // Fallback image
    }));
}
