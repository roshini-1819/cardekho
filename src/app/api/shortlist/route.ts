import { NextRequest, NextResponse } from "next/server";
import { CARS } from "@/lib/cars";
import {
  deleteShortlist,
  listShortlists,
  saveShortlist,
} from "@/lib/store";

const VALID_IDS = new Set(CARS.map((c) => c.id));

export async function GET() {
  const items = await listShortlists();
  return NextResponse.json({ shortlists: items });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const carIds: string[] = Array.isArray(body?.carIds)
    ? body.carIds.filter((id: unknown) => VALID_IDS.has(id as string))
    : [];

  if (carIds.length === 0) {
    return NextResponse.json(
      { error: "Provide at least one valid car id" },
      { status: 400 }
    );
  }

  const saved = await saveShortlist(String(body?.label ?? ""), carIds);
  return NextResponse.json({ shortlist: saved }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await deleteShortlist(id);
  return NextResponse.json({ ok: true });
}
