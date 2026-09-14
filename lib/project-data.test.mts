import assert from "node:assert/strict";
import Module from "node:module";
import { before, beforeEach, describe, mock, test } from "node:test";

const authMock = mock.fn(async () => ({ userId: "owner-1" as string | null }));
const currentUserMock = mock.fn(async () =>
  Promise.resolve({
    emailAddresses: [{ emailAddress: "owner@example.com" }],
  } as { emailAddresses: { emailAddress: string }[] } | null),
);
const findManyMock = mock.fn(async (args?: unknown) => {
  void args;
  return [] as unknown[];
});

const prisma = {
  project: {
    findMany: findManyMock,
  },
};

interface ModuleLoader {
  _load(
    request: string,
    parent: NodeModule | undefined,
    isMain: boolean,
  ): unknown;
}

let getEditorProjects: typeof import("./project-data").getEditorProjects;

before(async () => {
  const moduleLoader = Module as unknown as ModuleLoader;
  const originalLoad = moduleLoader._load;

  moduleLoader._load = function (request, parent, isMain) {
    if (request === "@clerk/nextjs/server") {
      return { auth: authMock, currentUser: currentUserMock };
    }
    if (request === "@/lib/prisma") return { prisma };
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    ({ getEditorProjects } = await import("./project-data"));
  } finally {
    moduleLoader._load = originalLoad;
  }
});

beforeEach(() => {
  authMock.mock.resetCalls();
  currentUserMock.mock.resetCalls();
  findManyMock.mock.resetCalls();
  authMock.mock.mockImplementation(async () => ({ userId: "owner-1" }));
  currentUserMock.mock.mockImplementation(async () => ({
    emailAddresses: [{ emailAddress: "owner@example.com" }],
  }));
  findManyMock.mock.mockImplementation(async () => []);
});

describe("getEditorProjects", () => {
  test("returns empty lists without calling Clerk or Prisma for a signed-out user", async () => {
    authMock.mock.mockImplementation(async () => ({ userId: null }));

    const result = await getEditorProjects();

    assert.deepEqual(result, { ownedProjects: [], sharedProjects: [] });
    assert.equal(currentUserMock.mock.callCount(), 0);
    assert.equal(findManyMock.mock.callCount(), 0);
  });

  test("loads owned and shared projects with their expected access flags", async () => {
    let queryIndex = 0;
    findManyMock.mock.mockImplementation(async () => {
      if (queryIndex++ === 0) {
        return [
          { id: "owned-2", name: "Newest owned" },
          { id: "owned-1", name: "Older owned" },
        ];
      }

      return [{ id: "shared-1", name: "Shared architecture" }];
    });

    const result = await getEditorProjects();

    assert.deepEqual(result, {
      ownedProjects: [
        { id: "owned-2", name: "Newest owned", owner: true },
        { id: "owned-1", name: "Older owned", owner: true },
      ],
      sharedProjects: [
        { id: "shared-1", name: "Shared architecture", owner: false },
      ],
    });
    assert.deepEqual(findManyMock.mock.calls[0].arguments[0], {
      where: { ownerId: "owner-1" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    });
    assert.deepEqual(findManyMock.mock.calls[1].arguments[0], {
      where: {
        ownerId: { not: "owner-1" },
        collaborators: { some: { email: "owner@example.com" } },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    });
  });

  test("skips the collaborator query when Clerk has no email for the user", async () => {
    currentUserMock.mock.mockImplementation(async () => ({ emailAddresses: [] }));
    findManyMock.mock.mockImplementation(async () => [
      { id: "owned-1", name: "Owned project" },
    ]);

    const result = await getEditorProjects();

    assert.deepEqual(result, {
      ownedProjects: [
        { id: "owned-1", name: "Owned project", owner: true },
      ],
      sharedProjects: [],
    });
    assert.equal(findManyMock.mock.callCount(), 1);
  });
});
