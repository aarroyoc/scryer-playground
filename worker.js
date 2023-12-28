import init, { eval_code } from "./scryer_prolog.js";

self.onmessage = (e) => {
    const result = eval_code(e.data.code);
    self.postMessage({type: "result", result: result});
};

await init("./scryer_prolog_bg.wasm");
self.postMessage({type: "ready"});
