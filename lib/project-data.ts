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

  const user = await currentUser();
  const email =
    user?.emailAddresses?.find(
      (address) => address.id === user.primaryEmailAddressId,
    )?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;

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
  } catch (error) {
    throw error;
  }
}
