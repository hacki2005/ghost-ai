import assert from "node:assert/strict";
import Module from "node:module";
import { before, beforeEach, describe, mock, test } from "node:test";

const authMock = mock.fn(async () => ({ userId: "owner-1" as string | null }));
interface ProjectRecord {
  id: string;
  ownerId: string;
  name: string;
}

const findUniqueMock = mock.fn(
  async (args?: unknown): Promise<ProjectRecord | null> => {
    void args;
    return { id: "project-1", ownerId: "owner-1", name: "Existing" };
  },
);
const updateMock = mock.fn(async (args?: unknown) => {
  void args;
  return { id: "project-1", ownerId: "owner-1", name: "Renamed" };
});
const deleteMock = mock.fn(async (args?: unknown) => {
  void args;
  return { id: "project-1" };
});

const prisma = {
  project: {
    findUnique: findUniqueMock,
    update: updateMock,
    delete: deleteMock,
  },
};

interface ModuleLoader {
  _load(
    request: string,
    parent: NodeModule | undefined,
    isMain: boolean,
  ): unknown;
}

let DELETE: typeof import("./route").DELETE;
let PATCH: typeof import("./route").PATCH;

before(async () => {
  const moduleLoader = Module as unknown as ModuleLoader;
  const originalLoad = moduleLoader._load;

  moduleLoader._load = function (request, parent, isMain) {
    if (request === "@clerk/nextjs/server") return { auth: authMock };
    if (request === "../../../../lib/prisma") return { prisma };
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    ({ DELETE, PATCH } = await import("./route"));
  } finally {
    moduleLoader._load = originalLoad;
  }
});

function routeContext(projectId = "project-1") {
  return { params: Promise.resolve({ projectId }) };
}

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/projects/project-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  authMock.mock.resetCalls();
  findUniqueMock.mock.resetCalls();
  updateMock.mock.resetCalls();
  deleteMock.mock.resetCalls();
  authMock.mock.mockImplementation(async () => ({ userId: "owner-1" }));
  findUniqueMock.mock.mockImplementation(async () => ({
    id: "project-1",
    ownerId: "owner-1",
    name: "Existing",
  }));
  updateMock.mock.mockImplementation(async () => ({
    id: "project-1",
    ownerId: "owner-1",
    name: "Renamed",
  }));
  deleteMock.mock.mockImplementation(async () => ({ id: "project-1" }));
});

describe("PATCH /api/projects/[projectId]", () => {
  test("returns 401 before loading a project when the user is signed out", async () => {
    authMock.mock.mockImplementation(async () => ({ userId: null }));

    const response = await PATCH(patchRequest({ name: "Renamed" }), routeContext());

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
    assert.equal(findUniqueMock.mock.callCount(), 0);
    assert.equal(updateMock.mock.callCount(), 0);
  });

  test("returns 404 without updating when the project does not exist", async () => {
    findUniqueMock.mock.mockImplementation(async () => null);

    const response = await PATCH(patchRequest({ name: "Renamed" }), routeContext("missing"));

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Project not found" });
    assert.deepEqual(findUniqueMock.mock.calls[0].arguments[0], {
      where: { id: "missing" },
    });
    assert.equal(updateMock.mock.callCount(), 0);
  });

  test("returns 403 without updating another user's project", async () => {
    findUniqueMock.mock.mockImplementation(async () => ({
      id: "project-1",
      ownerId: "another-user",
      name: "Existing",
    }));

    const response = await PATCH(patchRequest({ name: "Renamed" }), routeContext());

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "Forbidden" });
    assert.equal(updateMock.mock.callCount(), 0);
  });

  test("rejects an empty name without updating the project", async () => {
    const response = await PATCH(patchRequest({ name: "   " }), routeContext());

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "Project name is required",
    });
    assert.equal(updateMock.mock.callCount(), 0);
  });

  test("rejects malformed JSON without updating the project", async () => {
    const request = new Request("http://localhost/api/projects/project-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    const response = await PATCH(request, routeContext());

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "Project name is required",
    });
    assert.equal(updateMock.mock.callCount(), 0);
  });

  test("trims and updates the name of an owned project", async () => {
    const updated = { id: "project-1", ownerId: "owner-1", name: "Renamed" };
    updateMock.mock.mockImplementation(async () => updated);

    const response = await PATCH(
      patchRequest({ name: "  Renamed  " }),
      routeContext(),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), updated);
    assert.deepEqual(updateMock.mock.calls[0].arguments[0], {
      where: { id: "project-1" },
      data: { name: "Renamed" },
    });
  });

  test("returns 500 when the lookup fails", async () => {
    const consoleMock = mock.method(console, "error", () => undefined);
    findUniqueMock.mock.mockImplementation(async () => {
      throw new Error("lookup failed");
    });

    try {
      const response = await PATCH(
        patchRequest({ name: "Renamed" }),
        routeContext(),
      );

      assert.equal(response.status, 500);
      assert.equal(typeof (await response.json()).error, "string");
      assert.equal(updateMock.mock.callCount(), 0);
    } finally {
      consoleMock.mock.restore();
    }
  });
});

describe("DELETE /api/projects/[projectId]", () => {
  const deleteRequest = new Request(
    "http://localhost/api/projects/project-1",
    { method: "DELETE" },
  );

  test("returns 401 before loading a project when the user is signed out", async () => {
    authMock.mock.mockImplementation(async () => ({ userId: null }));

    const response = await DELETE(deleteRequest, routeContext());

    assert.equal(response.status, 401);
    assert.equal(findUniqueMock.mock.callCount(), 0);
    assert.equal(deleteMock.mock.callCount(), 0);
  });

  test("returns 404 without deleting when the project does not exist", async () => {
    findUniqueMock.mock.mockImplementation(async () => null);

    const response = await DELETE(deleteRequest, routeContext("missing"));

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Project not found" });
    assert.equal(deleteMock.mock.callCount(), 0);
  });

  test("returns 403 without deleting another user's project", async () => {
    findUniqueMock.mock.mockImplementation(async () => ({
      id: "project-1",
      ownerId: "another-user",
      name: "Existing",
    }));

    const response = await DELETE(deleteRequest, routeContext());

    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: "Forbidden" });
    assert.equal(deleteMock.mock.callCount(), 0);
  });

  test("deletes an owned project and returns success", async () => {
    const response = await DELETE(deleteRequest, routeContext());

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
    assert.deepEqual(deleteMock.mock.calls[0].arguments[0], {
      where: { id: "project-1" },
    });
  });

  test("returns 500 when deletion fails", async () => {
    const consoleMock = mock.method(console, "error", () => undefined);
    deleteMock.mock.mockImplementation(async () => {
      throw new Error("delete failed");
    });

    try {
      const response = await DELETE(deleteRequest, routeContext());

      assert.equal(response.status, 500);
      assert.equal(typeof (await response.json()).error, "string");
    } finally {
      consoleMock.mock.restore();
    }
  });
});
