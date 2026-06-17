import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const store = searchParams.get("store");
  const lensType = searchParams.get("lensType");

  let query = supabase
    .from("orders")
    .select(
      `
      *,
      frames(*),
      lens_catalog(*)
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (store) query = query.eq("store_location", store);
  if (lensType) query = query.eq("lens_catalog_id", lensType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json(data);
}
