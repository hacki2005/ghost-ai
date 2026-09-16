import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

interface CollaboratorUser {
  displayName: string | null;
  avatarUrl: string | null;
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function getProjectForUser(
  projectId: string,
  userId: string,
  email: string | null,
) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        ...(email ? [{ collaborators: { some: { email } } }] : []),
      ],
    },
    select: { id: true, ownerId: true },
  });
}

async function enrichCollaborators(emails: string[]) {
  const enriched = new Map<string, CollaboratorUser>();

  if (emails.length === 0) {
    return enriched;
  }

  try {
    const client = await clerkClient();
    const users = await client.users.getUserList({ emailAddress: emails });

    for (const user of users.data) {
      const email = user.emailAddresses[0]?.emailAddress?.toLowerCase();
      if (!email) {
        continue;
      }

      const displayName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ");
      enriched.set(email, {
        displayName: displayName || null,
        avatarUrl: user.imageUrl || null,
      });
    }
  } catch (error) {
    console.error("Failed to enrich project collaborators", error);
  }

  return enriched;
}

async function getPrimaryEmail(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return (
    user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    )?.emailAddress?.trim().toLowerCase() ?? null
  );
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const email = await getPrimaryEmail(userId);
  const project = await getProjectForUser(projectId, userId, email);

  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });
  const users = await enrichCollaborators(collaborators.map(({ email }) => email));

  return NextResponse.json({
    owner: project.ownerId === userId,
    collaborators: collaborators.map((collaborator) => {
      const email = collaborator.email.toLowerCase();
      const user = users.get(email);
      return {
        id: collaborator.id,
        email: collaborator.email,
        displayName: user?.displayName ?? null,
        avatarUrl: user?.avatarUrl ?? null,
      };
    }),
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const email = normalizeEmail(
    typeof body === "object" && body !== null && "email" in body
      ? body.email
      : undefined,
  );

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const collaborator = await prisma.projectCollaborator.upsert({
    where: { projectId_email: { projectId, email } },
    create: { projectId, email },
    update: {},
    select: { id: true, email: true },
  });

  const user = (await enrichCollaborators([collaborator.email])).get(
    collaborator.email,
  );

  return NextResponse.json(
    {
      ...collaborator,
      displayName: user?.displayName ?? null,
      avatarUrl: user?.avatarUrl ?? null,
    },
    { status: 201 },
  );
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Collaborator email is required" }, { status: 400 });
  }

  const email = normalizeEmail(
    typeof body === "object" && body !== null && "email" in body
      ? body.email
      : undefined,
  );

  if (!email) {
    return NextResponse.json({ error: "Collaborator email is required" }, { status: 400 });
  }

  await prisma.projectCollaborator.deleteMany({ where: { projectId, email } });
  return NextResponse.json({ success: true });
}
