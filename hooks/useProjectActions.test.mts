import assert from "node:assert/strict";
import Module from "node:module";
import { afterEach, before, beforeEach, describe, mock, test } from "node:test";

interface RouterStub {
  push: ReturnType<typeof mock.fn<(path: string) => void>>;
  refresh: ReturnType<typeof mock.fn<() => void>>;
}

interface ModuleLoader {
  _load(
    request: string,
    parent: NodeModule | undefined,
    isMain: boolean,
  ): unknown;
}

type StateUpdate<T> = T | ((current: T) => T);

let pathname = "/editor";
let stateCursor = 0;
let stateSlots: unknown[] = [];
const pushMock = mock.fn((path: string) => {
  void path;
});
const refreshMock = mock.fn(() => undefined);
const router: RouterStub = { push: pushMock, refresh: refreshMock };

function useStateStub<T>(initialValue: T) {
  const slot = stateCursor;
  stateCursor += 1;

  if (!(slot in stateSlots)) stateSlots[slot] = initialValue;

  const setValue = (update: StateUpdate<T>) => {
    const current = stateSlots[slot] as T;
    stateSlots[slot] =
      typeof update === "function"
        ? (update as (value: T) => T)(current)
        : update;
  };

  return [stateSlots[slot] as T, setValue] as const;
}

let makeRoomSuffix: typeof import("./useProjectActions").makeRoomSuffix;
let makeSlug: typeof import("./useProjectActions").makeSlug;
let projectActionsHook: typeof import("./useProjectActions").useProjectActions;

before(async () => {
  const moduleLoader = Module as unknown as ModuleLoader;
  const originalLoad = moduleLoader._load;

  moduleLoader._load = function (request, parent, isMain) {
    if (request === "next/navigation") {
      return {
        usePathname: () => pathname,
        useRouter: () => router,
      };
    }
    if (request === "react") return { useState: useStateStub };
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    ({
      makeRoomSuffix,
      makeSlug,
      useProjectActions: projectActionsHook,
    } = await import("./useProjectActions"));
  } finally {
    moduleLoader._load = originalLoad;
  }
});

function renderActions() {
  stateCursor = 0;
  return projectActionsHook();
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
  pathname = "/editor";
  stateCursor = 0;
  stateSlots = [];
  pushMock.mock.resetCalls();
  refreshMock.mock.resetCalls();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("project identifier helpers", () => {
  test("normalizes names into lowercase URL-safe slugs", () => {
    assert.equal(makeSlug("  Payments & Billing API  "), "payments-billing-api");
    assert.equal(makeSlug("already--separated"), "already-separated");
    assert.equal(makeSlug("***"), "");
  });

  test("creates a short base-36 room suffix", () => {
    const randomMock = mock.method(Math, "random", () => 0.123456789);

    try {
      const suffix = makeRoomSuffix();
      assert.match(suffix, /^[a-z0-9]{5}$/);
    } finally {
      randomMock.mock.restore();
    }
  });
});

describe("create project actions", () => {
  test("opens a clean dialog and ignores a whitespace-only submission", async () => {
    const fetchMock = mock.fn<typeof fetch>();
    globalThis.fetch = fetchMock;
    let actions = renderActions();

    actions.openCreate();
    actions = renderActions();

    assert.deepEqual(actions.dialog, { type: "create" });
    assert.equal(actions.createName, "");
    await actions.submitCreate();
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  test("posts a trimmed name and generated room ID, then opens the created project", async () => {
    const fetchMock = mock.fn<typeof fetch>(async () =>
      Response.json({ id: "created-project" }, { status: 201 }),
    );
    globalThis.fetch = fetchMock;
    const randomMock = mock.method(Math, "random", () => 0.123456789);
    let actions = renderActions();

    try {
      actions.openCreate();
      actions = renderActions();
      actions.setCreateName("  Payments API  ");
      actions = renderActions();

      await actions.submitCreate();

      assert.equal(fetchMock.mock.callCount(), 1);
      const [url, init] = fetchMock.mock.calls[0].arguments;
      assert.equal(url, "/api/projects");
      assert.equal(init?.method, "POST");
      assert.deepEqual(init?.headers, { "Content-Type": "application/json" });
      const payload = JSON.parse(String(init?.body));
      assert.equal(payload.name, "Payments API");
      assert.match(payload.roomId, /^payments-api-[a-z0-9]{5}$/);
      assert.deepEqual(pushMock.mock.calls[0].arguments, [
        "/editor/created-project",
      ]);
      assert.equal(refreshMock.mock.callCount(), 1);
      assert.equal(renderActions().dialog, null);
    } finally {
      randomMock.mock.restore();
    }
  });

  test("keeps the create dialog open for retry when the request fails", async () => {
    globalThis.fetch = mock.fn<typeof fetch>(async () =>
      Response.json({ error: "Try again later" }, { status: 503 }),
    );
    const consoleMock = mock.method(console, "error", () => undefined);
    let actions = renderActions();

    try {
      actions.openCreate();
      actions = renderActions();
      actions.setCreateName("Payments");
      actions = renderActions();
      await actions.submitCreate();

      actions = renderActions();
      assert.deepEqual(actions.dialog, { type: "create" });
      assert.equal(actions.loading, false);
      assert.equal(pushMock.mock.callCount(), 0);
      assert.equal(refreshMock.mock.callCount(), 0);
    } finally {
      consoleMock.mock.restore();
    }
  });
});

describe("rename project actions", () => {
  test("prefills, trims, and submits a rename before refreshing", async () => {
    const fetchMock = mock.fn<typeof fetch>(async () =>
      Response.json({ id: "project-1", name: "New name" }),
    );
    globalThis.fetch = fetchMock;
    const project = { id: "project-1", name: "Old name", owner: true };
    let actions = renderActions();

    actions.openRename(project);
    actions = renderActions();
    assert.deepEqual(actions.dialog, { type: "rename", project });
    assert.equal(actions.renameName, "Old name");

    actions.setRenameName("  New name  ");
    actions = renderActions();
    await actions.submitRename();

    const [url, init] = fetchMock.mock.calls[0].arguments;
    assert.equal(url, "/api/projects/project-1");
    assert.equal(init?.method, "PATCH");
    assert.deepEqual(JSON.parse(String(init?.body)), { name: "New name" });
    assert.equal(refreshMock.mock.callCount(), 1);
    assert.equal(renderActions().dialog, null);
  });
});

describe("delete project actions", () => {
  test("redirects to the editor home after deleting the active project", async () => {
    globalThis.fetch = mock.fn<typeof fetch>(async () =>
      Response.json({ success: true }),
    );
    pathname = "/editor/project-1";
    let actions = renderActions();

    actions.openDelete({ id: "project-1", name: "Active", owner: true });
    actions = renderActions();
    await actions.submitDelete();

    assert.deepEqual(pushMock.mock.calls[0].arguments, ["/editor"]);
    assert.equal(refreshMock.mock.callCount(), 0);
    assert.equal(renderActions().dialog, null);
  });

  test("refreshes in place after deleting a project that is not active", async () => {
    const fetchMock = mock.fn<typeof fetch>(async () =>
      Response.json({ success: true }),
    );
    globalThis.fetch = fetchMock;
    pathname = "/editor/another-project";
    let actions = renderActions();

    actions.openDelete({ id: "project-1", name: "Inactive", owner: true });
    actions = renderActions();
    await actions.submitDelete();

    assert.equal(fetchMock.mock.calls[0].arguments[0], "/api/projects/project-1");
    assert.equal(fetchMock.mock.calls[0].arguments[1]?.method, "DELETE");
    assert.equal(pushMock.mock.callCount(), 0);
    assert.equal(refreshMock.mock.callCount(), 1);
  });
});
