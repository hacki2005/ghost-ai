import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

const DATABASE_ERROR_MESSAGE = "Database unavailable";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return normalizeError("Project not found", 404);
    }

    if (project.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      const parsedBody: unknown = await request.json();

      if (!isRecord(parsedBody) || typeof parsedBody.name !== "string") {
        return normalizeError("Project name is required", 400);
      }

      body = parsedBody;
    } catch {
      return normalizeError("Project name is required", 400);
    }

    const name = (body.name as string).trim();

    if (!name) {
      return normalizeError("Project name is required", 400);
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { name },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/projects/[projectId] failed", error);
    return NextResponse.json(
      { error: DATABASE_ERROR_MESSAGE },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return normalizeError("Project not found", 404);
    }

    if (project.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[projectId] failed", error);
    return NextResponse.json(
      { error: DATABASE_ERROR_MESSAGE },
      { status: 500 },
    );
  }
}
