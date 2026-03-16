# Messenger Module Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the messenger module with Slack-style UI (flat message list + thread side panel) and clean per-blade scoped architecture.

**Architecture:** Per-blade scoped store via factory + provide/inject. Split layout: MessageList (60%) + ThreadPanel (40%). Typed injection keys replace 12+ string-based provide/inject. Components call useMessageActions() directly instead of emit chains.

**Tech Stack:** Vue 3, TypeScript, Composition API (`<script setup>`), Tailwind CSS (`tw-` prefix), VueUse, vc-shell framework (VcBlade, VcDataTable, useBladeNavigation, useAsync, usePopup)

**Spec:** `docs/superpowers/specs/2026-03-16-messenger-redesign-design.md`

**Module path:** `src/VirtoCommerce.MarketplaceCommunicationModule.Web/vcmp-communication/src/modules/messenger/`

---

## File Structure

### New Files
- `composables/useMessengerStore.ts` — Factory `createMessengerStore()` + inject hook `useMessengerStore()`
- `composables/useThreadPanel.ts` — Factory `createThreadPanel()` + inject hook `useThreadPanel()`
- `composables/useMessageActions.ts` — Thin API wrappers that update injected store
- `injection-keys.ts` — Typed `InjectionKey<T>` definitions
- `components/message-list.vue` — Left panel: root messages + infinite scroll
- `components/thread-panel.vue` — Right panel: thread with nested replies
- `components/message-hover-toolbar.vue` — Hover toolbar (Reply, Edit, Delete)
- `components/message-form.vue` — Unified input form (new/reply/edit modes)

### Modified Files
- `pages/messenger.vue` — Rewrite as split-layout orchestrator
- `components/message-item.vue` — Rewrite: compact, hover-toolbar, no form logic
- `pages/all-messages.vue` — Improve slot rendering in VcDataTable
- `utils.ts` — Replace moment.js with useTimeAgo
- `locales/en.json` (or equivalent) — Add thread panel locale keys
- `components/index.ts` — Update exports

### Deleted Files
- `components/message-tree.vue` — Replaced by thread-panel.vue
- `components/new-message-form.vue` — Replaced by message-form.vue
- `composables/useMessenger/index.ts` — Split into 3 composables

### Unchanged Files
- `useInfiniteScroll/`, `useConversationList/`, `useMessageApi/`, `useConversationApi/`, `useUserApi/`, `useSettingsApi/`
- `asset-item.vue`, `image-preview-popup.vue`, `message-skeleton.vue`
- `notifications/`, `widgets/`
- `constants.ts`, `fileUtils.ts`, `typings/`, `index.ts`

---

## Chunk 1: Foundation (injection keys, store, actions)

### Task 1: Create injection-keys.ts

**Files:**
- Create: `injection-keys.ts`

- [ ] **Step 1: Create injection keys file**

```typescript
import type { InjectionKey, Ref, ComputedRef } from "vue";
import type {
  Conversation,
  CommunicationUser,
  MarketplaceCommunicationSettings,
  Message,
  SearchMessagesQuery,
  ISearchMessagesQuery,
  ISearchMessageResult,
  MessageAttachment,
} from "@vcmp-communication/api/marketplacecommunication";

// --- Messenger Context (entity + seller info) ---

export interface MessengerContext {
  entityId: string | undefined;
  entityType: string | undefined;
  sellerId: string;
  sellerName: string;
  conversation: Ref<Conversation | undefined>;
}

export const messengerContextKey: InjectionKey<MessengerContext> = Symbol("messengerContext");

// --- Store interface ---

export interface MessengerStore {
  // State
  messages: Readonly<Ref<Message[]>>;
  rootMessages: ComputedRef<Message[]>;
  operator: Readonly<Ref<CommunicationUser | undefined>>;
  seller: Readonly<Ref<CommunicationUser | undefined>>;
  settings: Readonly<Ref<MarketplaceCommunicationSettings | undefined>>;
  conversation: Readonly<Ref<Conversation | undefined>>;

  // Pagination
  hasOlderMessages: Ref<boolean>;
  hasNewerMessages: ComputedRef<boolean>;
  searchQuery: Ref<SearchMessagesQuery>;
  searchMessagesLoading: Ref<boolean>;
  sendMessageLoading: Ref<boolean>;

  // Mutations
  setMessages(msgs: Message[]): void;
  updateMessageInList(message: Message): void;
  removeMessageFromList(ids: string[]): void;

  // Actions
  loadRootMessages(query: ISearchMessagesQuery): Promise<void>;
  loadMoreMessages(query: ISearchMessagesQuery): Promise<boolean>;
  loadPreviousMessages(query?: ISearchMessagesQuery): Promise<boolean>;
  initializeConversation(options: {
    entityId?: string;
    entityType?: string;
    conversation?: Conversation;
  }): Promise<void>;

  // Cleanup
  reset(): void;
}

export const messengerStoreKey: InjectionKey<MessengerStore> = Symbol("messengerStore");

// --- Thread Panel interface ---

export interface ThreadPanelState {
  activeThreadId: Readonly<Ref<string | null>>;
  rootMessage: ComputedRef<Message | undefined>;
  threadMessages: Ref<Message[]>;
  isOpen: ComputedRef<boolean>;
  threadLoading: Ref<boolean>;
  openThread(messageId: string): Promise<void>;
  closeThread(): void;
}

export const threadPanelKey: InjectionKey<ThreadPanelState> = Symbol("threadPanel");
```

- [ ] **Step 2: Commit**

```bash
git add injection-keys.ts
git commit -m "feat(messenger): add typed injection keys for store, context, thread panel"
```

### Task 2: Create useMessengerStore.ts

**Files:**
- Create: `composables/useMessengerStore.ts`
- Reference: `composables/useMessenger/index.ts` (current implementation to port logic from)
- Reference: `composables/useMessageApi/index.ts`, `composables/useConversationApi/index.ts`, `composables/useUserApi/index.ts`, `composables/useSettingsApi/index.ts`

- [ ] **Step 1: Create the store factory**

Port all state and actions from current `useMessenger/index.ts` into `createMessengerStore()` factory. Key differences from current code:
- All state is local to the factory closure (not module-level)
- `rootMessages` computed filters `messages` by `!threadId`
- `conversation` is readonly (with setter via `initializeConversation`)
- `loadRootMessages` always passes `rootsOnly: true`
- `loadMoreMessages` and `loadPreviousMessages` accept optional `threadId` to support both root and thread pagination
- Keep `loadUserInfoForMessages` private helper
- Remove `operator` from module scope — move into closure

- [ ] **Step 2: Create inject convenience hook**

```typescript
export function useMessengerStore(): MessengerStore {
  const store = inject(messengerStoreKey);
  if (!store) throw new Error("useMessengerStore() called outside of Messenger blade");
  return store;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd <module-root>/../../.. && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add composables/useMessengerStore.ts
git commit -m "feat(messenger): add per-blade scoped store factory with inject hook"
```

### Task 3: Create useThreadPanel.ts

**Files:**
- Create: `composables/useThreadPanel.ts`
- Reference: `composables/useMessageApi/index.ts` (for getThread API)

- [ ] **Step 1: Create thread panel factory**

```typescript
import { ref, computed, readonly, inject, type Ref, type ComputedRef } from "vue";
import { useAsync } from "@vc-shell/framework";
import { Message } from "@vcmp-communication/api/marketplacecommunication";
import { useMessageApi } from "./useMessageApi";
import { useUserApi } from "./useUserApi";
import { threadPanelKey, messengerStoreKey, type ThreadPanelState } from "../injection-keys";

export function createThreadPanel(): ThreadPanelState {
  const { getThread: getThreadApi } = useMessageApi();
  const { getUsers: getUsersApi } = useUserApi();

  const activeThreadId = ref<string | null>(null);
  const threadMessages = ref<Message[]>([]);

  // Get the store to find root message
  const store = inject(messengerStoreKey)!;

  const rootMessage = computed(() =>
    store.messages.value.find((m) => m.id === activeThreadId.value)
  );

  const { action: loadThread, loading: threadLoading } = useAsync<string>(async (threadId) => {
    if (!threadId) return;
    const result = await getThreadApi(threadId);
    // Load user info for thread messages
    const userIds = [...new Set(result.map((m) => m.senderId).filter(Boolean))] as string[];
    if (userIds.length) {
      const { action: getUsers } = useAsync(() => getUsersApi(userIds));
      const users = await getUsers();
      result.forEach((msg) => {
        const user = users.find((u) => u.id === msg.senderId);
        if (user) msg.sender = user;
      });
    }
    // Build tree: keep flat list but set answers for nesting
    threadMessages.value = result.filter((m) => m.threadId === threadId);
  });

  async function openThread(messageId: string) {
    activeThreadId.value = messageId;
    await loadThread(messageId);
  }

  function closeThread() {
    activeThreadId.value = null;
    threadMessages.value = [];
  }

  return {
    activeThreadId: readonly(activeThreadId),
    rootMessage,
    threadMessages,
    isOpen: computed(() => activeThreadId.value !== null),
    threadLoading,
    openThread,
    closeThread,
  };
}

export function useThreadPanel(): ThreadPanelState {
  const panel = inject(threadPanelKey);
  if (!panel) throw new Error("useThreadPanel() called outside of Messenger blade");
  return panel;
}
```

- [ ] **Step 2: Commit**

```bash
git add composables/useThreadPanel.ts
git commit -m "feat(messenger): add thread panel state factory with inject hook"
```

### Task 4: Create useMessageActions.ts

**Files:**
- Create: `composables/useMessageActions.ts`

- [ ] **Step 1: Create message actions composable**

Thin wrappers that inject the store and context, call API, then update store:

```typescript
import { inject } from "vue";
import { useAsync } from "@vc-shell/framework";
import { MessageAttachment, IUpdateMessageCommand } from "@vcmp-communication/api/marketplacecommunication";
import { useMessageApi } from "./useMessageApi";
import { messengerContextKey, messengerStoreKey } from "../injection-keys";

export function useMessageActions() {
  const store = inject(messengerStoreKey)!;
  const ctx = inject(messengerContextKey)!;
  const {
    sendMessage: sendMessageApi,
    updateMessage: updateMessageApi,
    removeMessage: removeMessageApi,
    markMessageAsRead: markMessageAsReadApi,
  } = useMessageApi();

  const { action: send, loading: sendLoading } = useAsync(async (args: {
    content: string;
    replyTo?: string;
    threadId?: string;
    conversationId?: string;
    attachments?: MessageAttachment[];
    rootsOnly?: boolean;
  }) => {
    if (!args) return;
    await sendMessageApi({
      ...args,
      sellerId: ctx.sellerId,
      sellerName: ctx.sellerName,
      entityId: ctx.entityId!,
      entityType: ctx.entityType!,
      recipientId: store.operator.value?.id,
    });
    // Re-fetch — API does not return full Message with sender info
    await store.loadRootMessages({
      ...store.searchQuery.value,
      conversationId: args.conversationId || ctx.conversation.value?.id,
    });
  });

  async function update(args: IUpdateMessageCommand) {
    await updateMessageApi({
      ...args,
      sellerId: ctx.sellerId,
      sellerName: ctx.sellerName,
    });
  }

  async function remove(messageIds: string[], withReplies: boolean) {
    await removeMessageApi({
      messageIds,
      withReplies,
      sellerId: ctx.sellerId,
      sellerName: ctx.sellerName,
    });
    store.removeMessageFromList(messageIds);
  }

  async function markAsRead(messageId: string, recipientId: string) {
    await markMessageAsReadApi({
      messageId,
      recipientId,
      sellerId: ctx.sellerId,
      sellerName: ctx.sellerName,
    });
  }

  return { send, sendLoading, update, remove, markAsRead };
}
```

- [ ] **Step 2: Commit**

```bash
git add composables/useMessageActions.ts
git commit -m "feat(messenger): add useMessageActions composable with store integration"
```

### Task 5: Update utils.ts — replace moment.js

**Files:**
- Modify: `utils.ts`

- [ ] **Step 1: Replace moment with useTimeAgo**

```typescript
import { useTimeAgo } from "@vueuse/core";
import { computed, type MaybeRefOrGetter, toValue } from "vue";

const locale = window.navigator.language;

const formatDate = (date: Date | undefined) => {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

// Returns a reactive ref that auto-updates
const createTimeAgo = (date: MaybeRefOrGetter<Date | undefined>) => {
  return useTimeAgo(computed(() => toValue(date) || new Date()));
};

// Static version for non-reactive contexts (e.g., conversation list)
const dateAgo = (date: Date | undefined) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
};

const truncateFileName = (fileName: string | undefined, maxLength = 20) => {
  if (!fileName) return "";
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return fileName;
  const name = fileName.slice(0, lastDotIndex);
  const extension = fileName.slice(lastDotIndex);
  if (fileName.length <= maxLength) return fileName;
  const truncatedLength = maxLength - extension.length - 1;
  return `${name.slice(0, truncatedLength)}...${extension}`;
};

export { formatDate, dateAgo, createTimeAgo, truncateFileName };
```

- [ ] **Step 2: Commit**

```bash
git add utils.ts
git commit -m "refactor(messenger): replace moment.js with native dateAgo + VueUse useTimeAgo"
```

### Task 6: Update composables/index.ts

**Files:**
- Modify: `composables/index.ts`

- [ ] **Step 1: Update exports**

```typescript
export * from "./useMessengerStore";
export * from "./useThreadPanel";
export * from "./useMessageActions";
export * from "./useInfiniteScroll";
export * from "./useConversationList";
export * from "./useMessageApi";
export * from "./useConversationApi";
export * from "./useUserApi";
export * from "./useSettingsApi";
```

Note: Do NOT remove `useMessenger` export yet — `widgets/message-widget.vue` and `all-messages.vue` still use it. Those will be migrated in later tasks. Keep old file until all consumers are migrated.

- [ ] **Step 2: Commit**

```bash
git add composables/index.ts
git commit -m "feat(messenger): export new composables from barrel"
```

---

## Chunk 2: UI Components

### Task 7: Create message-hover-toolbar.vue

**Files:**
- Create: `components/message-hover-toolbar.vue`

- [ ] **Step 1: Create hover toolbar component**

Small component: positioned absolute, shows on parent hover. Icons for Reply, Edit, Delete, Open Thread. Props: `canEdit`, `canDelete`. Emits: `reply`, `edit`, `delete`, `open-thread`.

Desktop: `opacity: 0` by default, parent `.message-item:hover` sets `opacity: 1`.
Keyboard: parent is `tabindex="0"`, `:focus-within` also shows toolbar.

- [ ] **Step 2: Commit**

```bash
git add components/message-hover-toolbar.vue
git commit -m "feat(messenger): add message-hover-toolbar component"
```

### Task 8: Create message-form.vue

**Files:**
- Create: `components/message-form.vue`
- Reference: `components/new-message-form.vue` (port logic from)

- [ ] **Step 1: Create unified message form**

Port from `new-message-form.vue` with these changes:
- Props: `mode: "new" | "reply" | "edit"`, `message?: Message`, `replyTo?: string`, `placeholder?: string`, `loading?: boolean`
- Emits: `send`, `cancel`
- In "new" mode: collapsed input → expands on focus
- In "reply" mode: always expanded
- In "edit" mode: prefilled content + attachments, Save/Cancel
- Keep: drag-and-drop, file validation, Enter-to-send, asset management
- Inject `messengerContextKey` instead of string-based injects
- Inject `messengerStoreKey` for settings (attachment limits)

- [ ] **Step 2: Commit**

```bash
git add components/message-form.vue
git commit -m "feat(messenger): add unified message-form component (new/reply/edit modes)"
```

### Task 9: Rewrite message-item.vue

**Files:**
- Modify: `components/message-item.vue`

- [ ] **Step 1: Rewrite message item**

Complete rewrite with these changes:
- Props: `message`, `isMobile`, `isThreadView?`, `nestingLevel?`
- Emits: `open-thread(messageId)`
- Use `useMessageActions()` directly for edit/delete/markAsRead (no emit chains)
- Hover toolbar via `MessageHoverToolbar` (desktop) or "..." dropdown (mobile)
- Auto-mark-as-read: `useElementVisibility()` + 2s delay (carried over)
- Content truncation: max 4 lines + expand/collapse (carried over)
- Thread badge: "N replies · Last reply X ago" — emits `open-thread`
- Unread indicator: red dot next to timestamp
- Avatar: 28px, `border-radius: 6px`
- Inline edit: shows `MessageForm` in edit mode
- Nested indentation: `margin-left: ${nestingLevel * 12}px` + `border-left` when `nestingLevel > 0`
- Significantly smaller than current 607 lines — target ~200 lines

- [ ] **Step 2: Commit**

```bash
git add components/message-item.vue
git commit -m "feat(messenger): rewrite message-item with hover toolbar and compact design"
```

### Task 10: Create message-list.vue

**Files:**
- Create: `components/message-list.vue`

- [ ] **Step 1: Create message list component**

Left panel of split layout:
- No props — reads from injected `useMessengerStore()` (rootMessages)
- Owns scroll container + `useInfiniteScroll()` for root message pagination
- Renders `MessageItem` for each root message
- MessageItem `@open-thread` → calls `useThreadPanel().openThread()`
- Bottom `MessageForm` (mode="new") for root messages
- Skeleton loaders during initial load
- Empty state: icon + "No messages" + "New message" button

- [ ] **Step 2: Commit**

```bash
git add components/message-list.vue
git commit -m "feat(messenger): add message-list component (left panel)"
```

### Task 11: Create thread-panel.vue

**Files:**
- Create: `components/thread-panel.vue`

- [ ] **Step 1: Create thread panel component**

Right panel of split layout:
- No props — reads from injected `useThreadPanel()` (rootMessage, threadMessages)
- Header: "Thread" title + close (✕) button
- Root message: highlighted in card with border at top
- Replies: `MessageItem` with `isThreadView=true`, recursive nesting via `nestingLevel`
- Bottom `MessageForm` (mode="reply") — always expanded
- Own scroll container
- Close calls `useThreadPanel().closeThread()`

- [ ] **Step 2: Commit**

```bash
git add components/thread-panel.vue
git commit -m "feat(messenger): add thread-panel component (right panel)"
```

### Task 12: Update components/index.ts

**Files:**
- Modify: `components/index.ts`

- [ ] **Step 1: Update component exports**

Add new components, remove old ones:

```typescript
export { default as MessageList } from "./message-list.vue";
export { default as ThreadPanel } from "./thread-panel.vue";
export { default as MessageItem } from "./message-item.vue";
export { default as MessageHoverToolbar } from "./message-hover-toolbar.vue";
export { default as MessageForm } from "./message-form.vue";
export { default as MessageSkeleton } from "./message-skeleton.vue";
export { default as AssetItem } from "./asset-item.vue";
export { default as ImagePreviewPopup } from "./image-preview-popup.vue";
```

- [ ] **Step 2: Commit**

```bash
git add components/index.ts
git commit -m "refactor(messenger): update component barrel exports"
```

---

## Chunk 3: Page Orchestrators + Cleanup

### Task 13: Rewrite messenger.vue

**Files:**
- Modify: `pages/messenger.vue`

- [ ] **Step 1: Rewrite as split-layout orchestrator**

Complete rewrite:
- Create store: `const store = createMessengerStore(); provide(messengerStoreKey, store);`
- Create thread panel: `const threadPanel = createThreadPanel(); provide(threadPanelKey, threadPanel);`
- Provide context: `provide(messengerContextKey, { entityId, entityType, sellerId, sellerName, conversation })`
- Template: split layout with `MessageList` (flex: 3) + `ThreadPanel` (flex: 2, v-if)
- Mobile: `v-if` swap — MessageList when no thread, ThreadPanel when thread open
- Header: entity icon + name + link (carried over)
- `onMounted`: call `store.initializeConversation()` then `store.loadRootMessages()`
- Push notification handler: `store.loadRootMessages()` on notify
- Keep `defineOptions({ name: "Messenger", notifyType: "MessagePushNotification" })`

- [ ] **Step 2: Add SCSS for split layout**

```scss
.messenger {
  &__layout {
    @apply tw-flex tw-flex-1 tw-overflow-hidden;
  }

  &__layout--mobile {
    @apply tw-flex-col;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add pages/messenger.vue
git commit -m "feat(messenger): rewrite messenger.vue as Slack-style split layout orchestrator"
```

### Task 14: Improve all-messages.vue slots

**Files:**
- Modify: `pages/all-messages.vue`

- [ ] **Step 1: Improve conversation list slot rendering**

Minimal changes — keep VcDataTable, improve name column slot:
- Better layout: `[Author Name] [Entity Type badge] [time ago] [unread badge]` on first row
- `[Sender]: Last message preview...` on second row
- Better font weights and spacing
- Remove unused `expandAllReplies` function
- Clean up imports (remove lodash if only used for debounce — use VueUse `useDebounceFn` instead)

- [ ] **Step 2: Commit**

```bash
git add pages/all-messages.vue
git commit -m "style(messenger): improve conversation list slot rendering in all-messages"
```

### Task 15: Update locales

**Files:**
- Modify: `locales/en.json` (or `locales/index.ts` — check actual file format)

- [ ] **Step 1: Add thread panel locale keys**

Add all keys from spec:
- `MESSENGER.THREAD.TITLE`, `MESSENGER.THREAD.CLOSE`, `MESSENGER.THREAD.REPLY_PLACEHOLDER`
- `MESSENGER.THREAD.REPLIES_COUNT`, `MESSENGER.THREAD.LAST_REPLY`, `MESSENGER.THREAD.BACK`
- `MESSENGER.HOVER.REPLY`, `MESSENGER.HOVER.EDIT`, `MESSENGER.HOVER.DELETE`, `MESSENGER.HOVER.OPEN_THREAD`
- `MESSENGER.MORE_ACTIONS`

- [ ] **Step 2: Commit**

```bash
git add locales/
git commit -m "feat(messenger): add locale keys for thread panel and hover toolbar"
```

### Task 16: Delete old files

**Files:**
- Delete: `components/message-tree.vue`
- Delete: `components/new-message-form.vue`
- Delete: `composables/useMessenger/index.ts`

- [ ] **Step 1: Verify no remaining imports of old files**

Search for imports of deleted files in the module. The widget (`message-widget.vue`) currently imports `useMessenger` — it needs to be updated to use the new store or keep a thin compatibility wrapper. Check before deleting.

If `message-widget.vue` uses `useMessenger`, update it to use `useMessageActions` or keep `useMessenger` as a re-export from the new composables.

- [ ] **Step 2: Delete files and update imports**

```bash
git rm components/message-tree.vue components/new-message-form.vue
# Only delete useMessenger if all consumers are migrated
git add -A
git commit -m "refactor(messenger): remove message-tree, new-message-form, old useMessenger"
```

### Task 17: Final verification

- [ ] **Step 1: TypeScript check**

```bash
cd <project-root> && npx tsc --noEmit
```

- [ ] **Step 2: Verify all imports resolve**

Check that no file imports deleted modules. Grep for:
- `message-tree`
- `new-message-form`
- `useMessenger` (should only be in widget or re-exported)

- [ ] **Step 3: Manual smoke test**

If dev server is available:
1. Open AllMessages → conversations load in table
2. Click conversation → Messenger blade opens with split layout
3. Messages load in left panel
4. Click "N replies" → thread panel opens on right
5. Send a message → appears in list
6. Reply in thread → appears in thread panel
7. Close thread → panel closes
8. Mobile viewport → list/thread swap works

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "refactor(messenger): complete messenger module redesign"
```
