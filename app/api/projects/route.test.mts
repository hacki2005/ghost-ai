import assert from "node:assert/strict";
import Module from "node:module";
import { before, beforeEach, describe, mock, test } from "node:test";

const authMock = mock.fn(async () => ({ userId: "owner-1" as string | null }));
const findManyMock = mock.fn(async (args?: unknown) => {
  void args;
  return [] as unknown[];
});
const createMock = mock.fn(async (args?: unknown) => {
  void args;
  return { id: "project-1" };
});

const prisma = {
  project: {
    findMany: findManyMock,
    create: createMock,
  },
};

interface ModuleLoader {
  _load(
    request: string,
    parent: NodeModule | undefined,
    isMain: boolean,
  ): unknown;
}

let GET: typeof import("./route").GET;
let POST: typeof import("./route").POST;

before(async () => {
  const moduleLoader = Module as unknown as ModuleLoader;
  const originalLoad = moduleLoader._load;

  moduleLoader._load = function (request, parent, isMain) {
    if (request === "@clerk/nextjs/server") return { auth: authMock };
    if (request === "../../../lib/prisma") return { prisma };
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    ({ GET, POST } = await import("./route"));
  } finally {
    moduleLoader._load = originalLoad;
  }
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  authMock.mock.resetCalls();
  findManyMock.mock.resetCalls();
  createMock.mock.resetCalls();
  authMock.mock.mockImplementation(async () => ({ userId: "owner-1" }));
  findManyMock.mock.mockImplementation(async () => []);
  createMock.mock.mockImplementation(async () => ({ id: "project-1" }));
});

describe("GET /api/projects", () => {
  test("returns 401 without querying projects when the user is signed out", async () => {
    authMock.mock.mockImplementation(async () => ({ userId: null }));

    const response = await GET();

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
    assert.equal(findManyMock.mock.callCount(), 0);
  });

  test("returns the current user's projects in newest-first order", async () => {
    const projects = [
      { id: "new-project", name: "New project" },
      { id: "old-project", name: "Old project" },
    ];
    findManyMock.mock.mockImplementation(async () => projects);

    const response = await GET();

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), projects);
    assert.deepEqual(findManyMock.mock.calls[0].arguments[0], {
      where: { ownerId: "owner-1" },
      orderBy: { createdAt: "desc" },
    });
  });

  test("returns a 500 response when the project query fails", async () => {
    const consoleMock = mock.method(console, "error", () => undefined);
    findManyMock.mock.mockImplementation(async () => {
      throw new Error("database offline");
    });

    try {
      const response = await GET();

      assert.equal(response.status, 500);
      assert.equal(typeof (await response.json()).error, "string");
    } finally {
      consoleMock.mock.restore();
    }
  });
});

describe("POST /api/projects", () => {
  test("returns 401 without parsing or creating when the user is signed out", async () => {
    authMock.mock.mockImplementation(async () => ({ userId: null }));
    const request = jsonRequest({ name: "Private project" });

    const response = await POST(request);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
    assert.equal(createMock.mock.callCount(), 0);
  });

  test("trims the name and persists the authenticated owner and description", async () => {
    const created = {
      id: "project-1",
      name: "Payments",
      description: "Checkout architecture",
    };
    createMock.mock.mockImplementation(async () => created);

    const response = await POST(
      jsonRequest({
        name: "  Payments  ",
        description: "Checkout architecture",
      }),
    );

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), created);
    assert.deepEqual(createMock.mock.calls[0].arguments[0], {
      data: {
        ownerId: "owner-1",
        name: "Payments",
        description: "Checkout architecture",
        status: "DRAFT",
      },
    });
  });

  test("uses project defaults for a blank name and omitted description", async () => {
    await POST(jsonRequest({ name: "   " }));

    assert.deepEqual(createMock.mock.calls[0].arguments[0], {
      data: {
        ownerId: "owner-1",
        name: "Untitled Project",
        description: null,
        status: "DRAFT",
      },
    });
  });

  test("uses project defaults when optional fields are omitted", async () => {
    const response = await POST(jsonRequest({}));

    assert.equal(response.status, 201);
    assert.deepEqual(createMock.mock.calls[0].arguments[0], {
      data: {
        ownerId: "owner-1",
        name: "Untitled Project",
        description: null,
        status: "DRAFT",
      },
    });
  });

  test("returns a 500 response when project creation fails", async () => {
    const consoleMock = mock.method(console, "error", () => undefined);
    createMock.mock.mockImplementation(async () => {
      throw new Error("write failed");
    });

    try {
      const response = await POST(jsonRequest({ name: "Payments" }));

      assert.equal(response.status, 500);
      assert.equal(typeof (await response.json()).error, "string");
    } finally {
      consoleMock.mock.restore();
    }
  });
});
