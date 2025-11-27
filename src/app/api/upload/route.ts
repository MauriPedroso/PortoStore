import { v2 as cloudinary } from "cloudinary";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});
console.log(process.env.CLOUDINARY_API_SECRET);

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string) || "portostore/products";
    if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) {
      return new Response(JSON.stringify({ error: "env_missing" }), { status: 400 });
    }
    if (!file) {
      return new Response(JSON.stringify({ error: "file_missing" }), { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUri = `data:${file.type || "image/*"};base64,${buffer.toString("base64")}`;
    const res = await cloudinary.uploader.upload(dataUri, { folder, resource_type: "image" });
    const result = { url: res.secure_url, public_id: res.public_id };

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
