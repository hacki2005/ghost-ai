import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface EditorProject {
  id: string;
  name: string;
  owner: boolean;
}

export async function getEditorProjects() {
  const { userId } = await auth();

  if (!userId) {
    return { ownedProjects: [], sharedProjects: [] };
  }

  let email: string | undefined;

  try {
    const user = await currentUser();
    email = user?.emailAddresses?.[0]?.emailAddress;
  } catch {
    email = undefined;
  }

  try {
    const [ownedProjects, sharedProjects] = await Promise.all([
      prisma.project.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      }),
      email
        ? prisma.project.findMany({
            where: {
              ownerId: { not: userId },
              collaborators: {
                some: {
                  email,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true },
          })
        : [],
    ]);

    return {
      ownedProjects: ownedProjects.map((project) => ({
        id: project.id,
        name: project.name,
        owner: true,
      })),
      sharedProjects: sharedProjects.map((project) => ({
        id: project.id,
        name: project.name,
        owner: false,
      })),
    };
  } catch {
    return { ownedProjects: [], sharedProjects: [] };
  }
}
