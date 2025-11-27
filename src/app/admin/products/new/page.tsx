'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data for selects
    const [categories, setCategories] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    function removeImage(index: number) {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
        setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index));
    }
    function clearAllImages() {
        setSelectedFiles([]);
        setPreviews([]);
        setUploadedImageUrls([]);
    }

    useEffect(() => {
        async function fetchData() {
            const [cats, ms, pts, szs] = await Promise.all([
                supabase.from('categories').select('*'),
                supabase.from('measurement_units').select('*'),
                supabase.from('payment_types').select('*'),
                supabase.from('sizes').select('*')
            ]);

            if (cats.data) setCategories(cats.data);
            if (ms.data) setUnits(ms.data);
            if (pts.data) setPaymentTypes(pts.data);
            if (szs.data) setSizes(szs.data);
        }
        fetchData();
    }, []);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const sku_base = formData.get('sku_base') as string;
        const category_id = formData.get('category_id');
        const measurement_unit_id = formData.get('measurement_unit_id');
        const imageUrls = uploadedImageUrls;

        if (!name) {
            setError("El nombre es obligatorio");
            setLoading(false);
            return;
        }

        try {
            // 1. Insert Product
            const { data: productData, error: productError } = await supabase
                .from('products')
                .insert([{
                    name,
                    description,
                    sku_base: sku_base || null,
                    category_id: category_id ? Number(category_id) : null,
                    measurement_unit_id: measurement_unit_id ? Number(measurement_unit_id) : null
                }])
                .select()
                .single();

            if (productError) throw productError;
            const productId = productData.product_id;

            if (imageUrls.length > 0) {
                const inserts = imageUrls.slice(0, 3).map((url) => ({ product_id: productId, url, alt_text: name }));
                const { error: imageError } = await supabase.from('images').insert(inserts);
                if (imageError) console.error("Error saving image:", imageError);
            }

            // 3. Insert Prices
            const priceInserts = paymentTypes.map(pt => {
                const price = formData.get(`price_${pt.payment_type_id}`);
                if (price && Number(price) > 0) {
                    return {
                        product_id: productId,
                        payment_type_id: pt.payment_type_id,
                        price: Number(price)
                    };
                }
                return null;
            }).filter(Boolean);

            if (priceInserts.length > 0) {
                const { error: priceError } = await supabase
                    .from('product_prices')
                    .insert(priceInserts);
                if (priceError) throw priceError;
            }

            // 4. Insert Stock (Sizes)
            const stockInserts = sizes.map(size => {
                const stock = formData.get(`stock_${size.size_id}`);
                if (stock && Number(stock) >= 0) {
                    return {
                        product_id: productId,
                        size_id: size.size_id,
                        stock: Number(stock)
                    };
                }
                return null;
            }).filter(Boolean);

            if (stockInserts.length > 0) {
                const { error: stockError } = await supabase
                    .from('product_sizes')
                    .insert(stockInserts);
                if (stockError) throw stockError;
            }

            router.push('/admin/products');
            router.refresh();
        } catch (e: any) {
            console.error(e);
            setError(e.message || "No se pudo crear el producto");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid gap-4 max-w-4xl w-full mx-auto pb-10">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Nuevo Producto</h1>
            </div>
            <form onSubmit={onSubmit} className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Información Básica</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input id="name" name="name" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sku_base">SKU Base</Label>
                            <Input id="sku_base" name="sku_base" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea id="description" name="description" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category_id">Categoría</Label>
                                <Select name="category_id">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccioná categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.category_id} value={String(c.category_id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="measurement_unit_id">Unidad</Label>
                                <Select name="measurement_unit_id">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccioná unidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {units.map(u => (
                                            <SelectItem key={u.measurement_unit_id} value={String(u.measurement_unit_id)}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Imágenes del Producto (máximo 3)</Label>
                            <div
                                className="border border-dashed rounded-md p-6 text-center cursor-pointer select-none"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                                    const limit = 3 - selectedFiles.length;
                                    const toAdd = files.slice(0, Math.max(0, limit));
                                    const nextFiles = [...selectedFiles, ...toAdd];
                                    setSelectedFiles(nextFiles);
                                    const nextPreviews = [...previews, ...toAdd.map(f => URL.createObjectURL(f))].slice(0, 3);
                                    setPreviews(nextPreviews);
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
                                        const limit = 3 - selectedFiles.length;
                                        const toAdd = files.slice(0, Math.max(0, limit));
                                        const nextFiles = [...selectedFiles, ...toAdd];
                                        setSelectedFiles(nextFiles);
                                        const nextPreviews = [...previews, ...toAdd.map(f => URL.createObjectURL(f))].slice(0, 3);
                                        setPreviews(nextPreviews);
                                    }}
                                />
                                <p className="text-sm">Arrastrá y soltá o hacé click para seleccionar</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {previews.map((src, i) => (
                                    <div key={i} className="relative h-24 w-full overflow-hidden rounded-md border">
                                        <Image src={src} alt="Preview" fill className="object-cover" />
                                        <button type="button" className="absolute top-1 right-1 rounded-xs bg-background/70 border p-1" onClick={() => removeImage(i)}>
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    disabled={uploadingImages || selectedFiles.length === 0}
                                    onClick={async () => {
                                        setUploadingImages(true);
                                        const urls: string[] = [];
                                        for (const f of selectedFiles.slice(0, 3)) {
                                            const fd = new FormData();
                                            fd.append("file", f);
                                            fd.append("folder", "portostore/products");
                                            const res = await fetch("/api/upload", { method: "POST", body: fd });
                                            const json = await res.json();
                                            if (res.ok && json.url) urls.push(json.url);
                                        }
                                        setUploadedImageUrls(urls);
                                        setUploadingImages(false);
                                    }}
                                >
                                    {uploadingImages ? "Subiendo imágenes..." : "Subir imágenes"}
                                </Button>
                                <Button type="button" variant="outline" onClick={clearAllImages} disabled={selectedFiles.length === 0 && previews.length === 0 && uploadedImageUrls.length === 0}>Quitar todas</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Precios</CardTitle>
                        <CardDescription>Definí los precios por tipo de pago.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {paymentTypes.map(pt => (
                            <div key={pt.payment_type_id} className="grid grid-cols-3 items-center gap-4">
                                <Label className="col-span-1">{pt.name}</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    name={`price_${pt.payment_type_id}`}
                                    placeholder="0.00"
                                    className="col-span-2"
                                />
                            </div>
                        ))}
                        {paymentTypes.length === 0 && <p className="text-sm text-muted-foreground">No hay tipos de pago definidos.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Inventario (Talles)</CardTitle>
                        <CardDescription>Definí el stock inicial por talle.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {sizes.map(size => (
                            <div key={size.size_id} className="grid grid-cols-3 items-center gap-4">
                                <Label className="col-span-1">{size.name}</Label>
                                <Input
                                    type="number"
                                    name={`stock_${size.size_id}`}
                                    placeholder="0"
                                    className="col-span-2"
                                />
                            </div>
                        ))}
                        {sizes.length === 0 && <p className="text-sm text-muted-foreground">No hay talles definidos.</p>}
                    </CardContent>
                </Card>

                {error && (
                    <div className="text-sm text-red-500 font-medium">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" disabled={loading}>{loading ? "Creando..." : "Crear Producto"}</Button>
                </div>
            </form>
        </div>
    );
}
