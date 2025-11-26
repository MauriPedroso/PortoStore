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
            setError("Name is required");
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
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to create category");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid gap-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">New Category</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                    <CardDescription>
                        Enter the name of the new category.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" placeholder="e.g. T-Shirts" required />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Create Category"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
