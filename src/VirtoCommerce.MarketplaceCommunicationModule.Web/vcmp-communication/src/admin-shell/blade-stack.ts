import { inject, type App } from "vue";
import { BladeStackKey, type BladeDescriptor, type IBladeStack } from "@vc-shell/framework";

// A widget's isVisible runs in a computed of the host's widget container, where inject() isn't
// available; the blade stack is provided on the app, so it is read through the app's context.
let hostApp: App | undefined;
let stack: IBladeStack | undefined;

export function setHostApp(app: App) {
  hostApp = app;
}

function getStack(): IBladeStack | undefined {
  stack ??= hostApp?.runWithContext(() => inject(BladeStackKey, undefined));
  return stack;
}

/** True when one of the blades this blade was opened from (parent, grandparent, ...) has one of the names */
export function isOpenedFrom(blade: BladeDescriptor | undefined, names: readonly string[]): boolean {
  const blades = getStack()?.blades.value ?? [];
  let parentId = blade?.parentId;
  // the chain is never longer than the stack; the bound guards against a cycle
  for (let i = 0; parentId && i < blades.length; i++) {
    const parent = blades.find((b) => b.id === parentId);
    if (!parent) return false;
    if (names.includes(parent.name)) return true;
    parentId = parent.parentId;
  }
  return false;
}
