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
import { CldUploadButton } from "next-cloudinary";

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data for selects
    const [categories, setCategories] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);
    const [sizeStock, setSizeStock] = useState<Record<number, number>>({});
    const fixedSizeNames = ["XS", "S", "M", "L", "XL", "XXL", "Sin talle"];
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
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

    const uploadPreset = "PortoStore"

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
            if (szs.data) {
                let current = szs.data;
                const missing = fixedSizeNames.filter(n => !current.find((s: any) => String(s.name).toLowerCase() === n.toLowerCase()));
                if (missing.length > 0) {
                    const { data: created } = await supabase.from('sizes').insert(missing.map(n => ({ name: n }))).select('*');
                    if (created) current = [...current, ...created];
                }
                setSizes(current);
            }
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

            // 3. Insert Precio único con descuento opcional
            const basePrice = Number(formData.get('price') || 0);
            const discountPercent = Number(formData.get('discount') || 0);
            const finalPrice = basePrice > 0 ? basePrice * (1 - Math.min(Math.max(discountPercent, 0), 100) / 100) : 0;
            if (finalPrice > 0 && paymentTypes.length > 0) {
                const defaultPaymentTypeId = paymentTypes[0].payment_type_id;
                const { error: priceError } = await supabase
                    .from('product_prices')
                    .insert([{ product_id: productId, payment_type_id: defaultPaymentTypeId, price: finalPrice }]);
                if (priceError) throw priceError;
            }

            const stockInserts = sizes
                .filter(s => selectedSizeIds.includes(s.size_id))
                .map(size => {
                    const stock = formData.get(`stock_${size.size_id}`);
                    if (stock && Number(stock) >= 0) {
                        return { product_id: productId, size_id: size.size_id, stock: Number(stock) };
                    }
                    return null;
                })
                .filter(Boolean) as any[];

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
                                {uploadPreset ? (
                                    <CldUploadButton
                                        uploadPreset={uploadPreset}
                                        signatureEndpoint="/api/cloudinary-signature"
                                        options={{ multiple: true, cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY }}
                                        onUpload={(result) => {
                                            const url = (result as any)?.info?.secure_url as string | undefined;
                                            if (!url) return;
                                            setUploadedImageUrls((prev) => [...prev, url].slice(0, 3));
                                            setPreviews((prev) => [...prev, url].slice(0, 3));
                                        }}
                                        className="rounded-md border px-3 py-2"
                                    >
                                        Subir imágenes
                                    </CldUploadButton>
                                ) : (
                                    <Button type="button" disabled className="opacity-60 cursor-not-allowed">Configurar Cloudinary</Button>
                                )}
                                <Button type="button" variant="outline" onClick={clearAllImages} disabled={selectedFiles.length === 0 && previews.length === 0 && uploadedImageUrls.length === 0}>Quitar todas</Button>
                            </div>
                            {uploadError && (
                                <p className="text-sm text-red-500">{uploadError}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Precio y descuento</CardTitle>
                        <CardDescription>Definí el precio y un descuento opcional.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="price">Precio</Label>
                            <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="discount">Descuento (%)</Label>
                            <Input id="discount" name="discount" type="number" step="1" min="0" max="100" placeholder="0" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Inventario (Talles)</CardTitle>
                        <CardDescription>Seleccioná talles y definí cantidades.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {fixedSizeNames.map(label => {
                                const size = sizes.find(s => String(s.name).toLowerCase() === label.toLowerCase());
                                const id = size?.size_id as number | undefined;
                                const checked = id ? selectedSizeIds.includes(id) : false;
                                return (
                                    <label key={label} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={async () => {
                                                let targetId = id;
                                                if (!targetId) {
                                                    const { data: created } = await supabase
                                                        .from('sizes')
                                                        .insert([{ name: label }])
                                                        .select('*')
                                                        .single();
                                                    if (created) {
                                                        targetId = (created as any).size_id as number;
                                                        setSizes(prev => [...prev, created as any]);
                                                    }
                                                }
                                                if (!targetId) return;
                                                setSelectedSizeIds(prev => checked ? prev.filter(x => x !== targetId!) : [...prev, targetId!]);
                                            }}
                                        />
                                        <span>{label}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <div className="grid gap-4">
                            {sizes.filter(s => selectedSizeIds.includes(s.size_id)).map(size => (
                                <div key={size.size_id} className="grid grid-cols-3 items-center gap-4">
                                    <Label className="col-span-1">{size.name}</Label>
                                    <Input
                                        type="number"
                                        name={`stock_${size.size_id}`}
                                        placeholder="0"
                                        onChange={(e) => {
                                            const val = Number(e.target.value || 0);
                                            setSizeStock(prev => ({ ...prev, [size.size_id]: val }));
                                        }}
                                        className="col-span-2"
                                    />
                                </div>
                            ))}
                            {sizes.length === 0 && <p className="text-sm text-muted-foreground">No hay talles definidos.</p>}
                            <div className="text-sm text-muted-foreground">
                                Cantidad total: {selectedSizeIds.reduce((acc, id) => acc + (sizeStock[id] || 0), 0)}
                            </div>
                        </div>
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
