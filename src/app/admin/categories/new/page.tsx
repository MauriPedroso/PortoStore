'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCategoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;

        if (!name) {
            setError("El nombre es obligatorio");
            setLoading(false);
            return;
        }

        try {
            const { error: insertError } = await supabase
                .from('categories')
                .insert([{ name }]);

            if (insertError) throw insertError;

            router.push('/admin/categories');
            router.refresh();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(e);
            setError(msg || "No se pudo crear la categoría");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid gap-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Nueva Categoría</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Detalles de la Categoría</CardTitle>
                    <CardDescription>Ingresá el nombre de la nueva categoría.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" name="name" placeholder="ej.: Remeras" required />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Creando..." : "Crear Categoría"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
