import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface CurrentClerkIdentity {
  userId: string | null;
  primaryEmail: string | null;
}

export async function getCurrentClerkIdentity(): Promise<CurrentClerkIdentity> {
  const { userId } = await auth();

  if (!userId) {
    return { userId: null, primaryEmail: null };
  }

  const user = await currentUser();
  const primaryEmail =
    user?.emailAddresses?.find(
      (address) => address.id === user.primaryEmailAddressId,
    )?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  return { userId, primaryEmail };
}

export async function getProjectAccess(projectId: string) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return null;
  }

  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: identity.userId },
        ...(identity.primaryEmail
          ? [{ collaborators: { some: { email: identity.primaryEmail } } }]
          : []),
      ],
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });
}
