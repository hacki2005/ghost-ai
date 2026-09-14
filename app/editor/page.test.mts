import assert from "node:assert/strict";
import Module from "node:module";
import { before, beforeEach, mock, test } from "node:test";

const ownedProjects = [
  { id: "owned-1", name: "Owned project", owner: true },
];
const sharedProjects = [
  { id: "shared-1", name: "Shared project", owner: false },
];
const getEditorProjectsMock = mock.fn(async () => ({
  ownedProjects,
  sharedProjects,
}));

function EditorHomeStub() {
  return null;
}

interface ModuleLoader {
  _load(
    request: string,
    parent: NodeModule | undefined,
    isMain: boolean,
  ): unknown;
}

let EditorPage: typeof import("./page").default;

before(async () => {
  const moduleLoader = Module as unknown as ModuleLoader;
  const originalLoad = moduleLoader._load;

  moduleLoader._load = function (request, parent, isMain) {
    if (request === "@/components/editor/editor-home") {
      return { EditorHome: EditorHomeStub };
    }
    if (request === "@/lib/project-data") {
      return { getEditorProjects: getEditorProjectsMock };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    ({ default: EditorPage } = await import("./page"));
  } finally {
    moduleLoader._load = originalLoad;
  }
});

beforeEach(() => {
  getEditorProjectsMock.mock.resetCalls();
  getEditorProjectsMock.mock.mockImplementation(async () => ({
    ownedProjects,
    sharedProjects,
  }));
});

test("loads projects on the server and passes both lists to the editor home", async () => {
  const result = await EditorPage();

  assert.equal(getEditorProjectsMock.mock.callCount(), 1);
  assert.equal(result.type, EditorHomeStub);
  assert.deepEqual(result.props, { ownedProjects, sharedProjects });
});
