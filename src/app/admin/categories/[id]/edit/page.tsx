"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Category = { category_id: number; name: string };

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const id = Number(params?.id);
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("category_id,name")
        .eq("category_id", id)
        .single();
      if (data) {
        setCategory(data);
        setName(data.name || "");
      }
    })();
  }, [params]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!category) return;
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("categories")
        .update({ name })
        .eq("category_id", category.category_id);
      if (updateError) throw updateError;
      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 max-w-2xl w-full mx-auto pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Editar Categoría</h1>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
        </div>
      </form>
    </div>
  );
}

