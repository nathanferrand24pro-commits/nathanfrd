import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json() as { active: boolean };

  const source = await prisma.source.update({
    where: { id },
    data: { active: body.active },
  });

  return NextResponse.json(source);
}
