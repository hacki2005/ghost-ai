import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

const DATABASE_ERROR_MESSAGE = "Database unavailable";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects failed", error);
    return NextResponse.json(
      { error: DATABASE_ERROR_MESSAGE },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    const parsedBody: unknown = await request.json();

    if (!isRecord(parsedBody) || typeof parsedBody.name !== "string") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 },
      );
    }

    body = parsedBody;
  } catch {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 },
    );
  }

  const name = (body.name as string).trim() || "Untitled Project";
  const roomId = typeof body.roomId === "string" ? body.roomId : undefined;
  const description =
    typeof body.description === "string" || body.description === null
      ? body.description
      : null;

  try {
    const created = await prisma.project.create({
      data: {
        ...(roomId ? { id: roomId } : {}),
        ownerId: userId,
        name,
        description,
        status: "DRAFT",
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects failed", error);
    return NextResponse.json(
      { error: DATABASE_ERROR_MESSAGE },
      { status: 500 },
    );
  }
}
