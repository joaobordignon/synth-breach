// Minimal browser-global stubs so the engine logic can run under node during
// the headless playtest. These are injected via esbuild --inject; they are
// test-only and never part of the app bundle.
class AudioContextStub {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
  }
  createOscillator() {
    return { type: "sine", frequency: { value: 0 }, connect() {}, start() {}, stop() {} };
  }
  createGain() {
    return { gain: { value: 0 }, connect() {} };
  }
}
if (typeof globalThis.AudioContext === "undefined") globalThis.AudioContext = AudioContextStub;
if (typeof globalThis.localStorage === "undefined") {
  const mem = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
  };
}
// The Ep01 `save` command downloads a .synthsave file via the DOM; stub just
// enough of document/URL/Blob for exportSave() to run without a browser.
if (typeof globalThis.document === "undefined") {
  const makeEl = () => ({
    click() {},
    remove() {},
    setAttribute() {},
    addEventListener() {},
    style: {},
    href: "",
    download: "",
    type: "",
    accept: "",
    files: [],
  });
  globalThis.document = {
    createElement: () => makeEl(),
    body: { appendChild() {}, removeChild() {} },
  };
}
if (typeof globalThis.Blob === "undefined") globalThis.Blob = class Blob {};
if (typeof globalThis.URL === "undefined") globalThis.URL = {};
if (typeof globalThis.URL.createObjectURL !== "function") globalThis.URL.createObjectURL = () => "blob:stub";
if (typeof globalThis.URL.revokeObjectURL !== "function") globalThis.URL.revokeObjectURL = () => {};
export {};
