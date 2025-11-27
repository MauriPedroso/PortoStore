import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string) || "portostore/products";
    if (!file) {
      return new Response(JSON.stringify({ error: "file_missing" }), { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<{ url: string; public_id: string }>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (error, res) => {
          if (error || !res) {
            reject(error || new Error("upload_failed"));
          } else {
            resolve({ url: res.secure_url, public_id: res.public_id });
          }
        }
      );
      upload.end(buffer);
    });

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
