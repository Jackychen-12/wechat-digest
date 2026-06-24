import { initState } from "./state.js";
import { bindEvents } from "./events.js";
import { applySettingsToUI } from "./settings.js";
import { renderWsCode, initSync } from "./workspace.js";
import { maybeSeedDemo } from "./data.js";
import { renderAll } from "./render.js";
import "./skills/digest.js";

initState();
bindEvents();
applySettingsToUI();
renderWsCode();
maybeSeedDemo();
renderAll();
initSync();
