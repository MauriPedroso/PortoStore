import { v2 as cloudinary } from "cloudinary";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export async function GET(req: NextRequest) {
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
  if (!cloudinary.config().api_secret || !preset) {
    return new Response(JSON.stringify({ error: "config_missing" }), { status: 400 });
  }
  console.log(cloudinary.config().api_secret);
  
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { timestamp, upload_preset: preset } as Record<string, string | number>;
  const signature = cloudinary.utils.api_sign_request(paramsToSign, cloudinary.config().api_secret as string);
  return new Response(JSON.stringify({ timestamp, signature }), { status: 200 });
}

export async function POST(req: NextRequest) {
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
  if (!cloudinary.config().api_secret || !preset) {
    return new Response(JSON.stringify({ error: "config_missing" }), { status: 400 });
  }
  const params: Record<string, string | number> = {};
  let body: Record<string, unknown> | null = null;
  try {
    body = await req.json();
  } catch {}
  if (body) {
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null && v !== "") {
        params[k] = v as string | number;
      }
    }
  } else {
    const form = await req.formData().catch(() => null);
    if (form) {
      for (const [k, v] of Array.from(form.entries())) {
        if (typeof v === "string" && v !== "") params[k] = v;
      }
    }
  }
  if (!params.upload_preset) params.upload_preset = preset;
  if (!params.timestamp) params.timestamp = Math.floor(Date.now() / 1000);
  if (!params.source) params.source = "uw";
  const signature = cloudinary.utils.api_sign_request(params, cloudinary.config().api_secret as string);
  return new Response(JSON.stringify({ signature, timestamp: params.timestamp }), { status: 200 });
}
