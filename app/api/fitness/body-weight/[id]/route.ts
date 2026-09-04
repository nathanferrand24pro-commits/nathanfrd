import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.bodyWeightEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Pesée non trouvée" }, { status: 404 });
  }
}
