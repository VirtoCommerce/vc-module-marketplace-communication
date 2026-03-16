# Messenger Module Redesign — Architecture + Visual

**Date:** 2026-03-16
**Module:** `vcmp-communication/src/modules/messenger/`
**Approach:** Full rewrite with Slack-style UI and clean architecture

## Summary

Redesign the messenger module with two parallel goals:
1. **Architecture** — per-blade scoped store, typed injection keys, proper separation of concerns
2. **Visual** — Slack-style flat message list with thread side panel, hover-only actions

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual style | Slack-style | Flat message stream + thread panel |
| Thread display | Side panel (60/40 split inside blade) | Context preserved, no nested blades |
| Thread nesting | Preserved (reply-to-reply) | Business requirement |
| Conversation list | Keep VcDataTable, improve slots | Table provides search, pagination, pull-to-refresh |
| Message actions | Hover-only toolbar | Declutters UI, modern UX |
| Date separators | No | Not needed per stakeholder |
| Mobile | Full-width swap (list ↔ thread panel) | Split doesn't fit mobile |
| Architecture | Rewrite from scratch | Current code too coupled for incremental refactor |
| Store scoping | Per-blade instance via provide/inject | Multiple Messenger blades can be open for different entities |

## Component Structure

```
messenger/
  pages/
    messenger.vue              — Orchestrator: split layout, provide store + context
    all-messages.vue           — VcDataTable with improved slot rendering
  components/
    message-list.vue           — Left panel: root messages + infinite scroll
    thread-panel.vue           — Right panel: thread with nested replies
    message-item.vue           — Single message (compact, no form logic)
    message-hover-toolbar.vue  — Hover toolbar (Reply, Edit, Delete icons)
    message-form.vue           — Input form (new message / reply / edit)
    message-skeleton.vue       — (unchanged)
    asset-item.vue             — (unchanged)
    image-preview-popup.vue    — (unchanged)
    notifications/             — (unchanged)
    widgets/                   — (unchanged)
  composables/
    useMessengerStore.ts       — Factory function: per-blade scoped store
    useThreadPanel.ts          — Thread panel UI state (per-blade scoped)
    useMessageActions.ts       — send, update, delete, markAsRead (thin API wrappers)
    useInfiniteScroll/         — (unchanged)
    useConversationList/       — (unchanged)
    useMessageApi/             — (unchanged, API layer)
    useConversationApi/        — (unchanged, API layer)
    useUserApi/                — (unchanged, API layer)
    useSettingsApi/            — (unchanged, API layer)
  injection-keys.ts            — Typed InjectionKey<T> definitions
  constants.ts                 — (unchanged)
  fileUtils.ts                 — (unchanged)
  utils.ts                     — Replace moment.js with useTimeAgo (VueUse)
  typings/                     — (unchanged)
  locales/                     — Add thread panel keys
  index.ts                     — (unchanged)
```

## Architecture: Per-Blade Scoped Store

### Problem

Current `useMessenger()` creates isolated state per call. `message-tree.vue` has its own `messages` separate from `messenger.vue`, causing desync and duplicated logic. A naive singleton would break when multiple Messenger blades are open for different entities (e.g., Messenger for Order + Messenger for Product simultaneously). The `MessageWidget` is registered on ProductDetails, Offer, and OrderDetails blades, making multi-instance a real scenario.

### Solution: `createMessengerStore()` factory + provide/inject

```typescript
// composables/useMessengerStore.ts

export interface MessengerStore {
  // Readonly state
  messages: Readonly<Ref<Message[]>>;
  rootMessages: ComputedRef<Message[]>;
  operator: Readonly<Ref<CommunicationUser | undefined>>;
  seller: Readonly<Ref<CommunicationUser | undefined>>;
  settings: Readonly<Ref<MarketplaceCommunicationSettings | undefined>>;
  conversation: Readonly<Ref<Conversation | undefined>>;

  // Mutations
  setMessages(msgs: Message[]): void;
  updateMessageInList(message: Message): void;
  removeMessageFromList(ids: string[]): void;

  // Async actions
  loadRootMessages(query: ISearchMessagesQuery): Promise<void>;
  loadMoreMessages(query: ISearchMessagesQuery): Promise<boolean>;
  loadPreviousMessages(query?: ISearchMessagesQuery): Promise<boolean>;
  initializeConversation(options: { entityId?: string; entityType?: string; conversation?: Conversation }): Promise<void>;
  createConversation(args: { sellerId: string; sellerName: string; userIds: string[] }): Promise<Conversation>;

  // Pagination state
  hasOlderMessages: Ref<boolean>;
  hasNewerMessages: ComputedRef<boolean>;
  searchQuery: Ref<SearchMessagesQuery>;

  // Loading
  searchMessagesLoading: Ref<boolean>;
  sendMessageLoading: Ref<boolean>;

  // Cleanup
  reset(): void;
}

// Factory — each call creates a new isolated instance
export function createMessengerStore(): MessengerStore {
  const messages = shallowRef<Message[]>([]);
  const operator = ref<CommunicationUser>();
  const seller = ref<CommunicationUser>();
  const settings = ref<MarketplaceCommunicationSettings>();
  const conversation = ref<Conversation>();
  const searchResult = shallowRef<ISearchMessageResult | null>(null);
  const searchQuery = ref<SearchMessagesQuery>({ take: 20 });
  // ... all state is local to this closure

  const rootMessages = computed(() => messages.value.filter(m => !m.threadId));

  return {
    messages: readonly(messages),
    rootMessages,
    operator: readonly(operator),
    seller: readonly(seller),
    settings: readonly(settings),
    conversation: readonly(conversation),
    // ... actions that mutate the closure state
  };
}

// Convenience hook — injects the store provided by messenger.vue
export function useMessengerStore(): MessengerStore {
  const store = inject(messengerStoreKey);
  if (!store) throw new Error("useMessengerStore() called outside of Messenger blade");
  return store;
}
```

```typescript
// pages/messenger.vue — orchestrator
const store = createMessengerStore();
provide(messengerStoreKey, store);
```

Each Messenger blade creates its own store instance via `createMessengerStore()` and provides it. All child components inject the same instance. When the blade closes, the store is GC'd. Multiple blades for different entities work correctly — each has isolated state.

### `useMessageActions.ts`

Thin wrappers over API composables that update the injected store. Uses re-fetch after send (matching current behavior — API does not return complete Message with sender info):

```typescript
export function useMessageActions() {
  const store = useMessengerStore();  // injects per-blade store
  const ctx = inject(messengerContextKey)!;
  const { sendMessage: sendMessageApi, ... } = useMessageApi();

  async function send(args: { content: string; replyTo?: string; attachments?: MessageAttachment[] }) {
    await sendMessageApi({ ...args, sellerId: ctx.sellerId, sellerName: ctx.sellerName });
    // Re-fetch to get server-assigned fields, sender info, recipients
    await store.loadRootMessages({ ...store.searchQuery.value, conversationId: ctx.conversation.value?.id });
  }

  async function remove(ids: string[], withReplies: boolean) {
    await removeMessageApi({ messageIds: ids, withReplies, sellerId: ctx.sellerId, sellerName: ctx.sellerName });
    store.removeMessageFromList(ids);
  }

  async function markAsRead(messageId: string, recipientId: string) {
    await markMessageAsReadApi({ messageId, recipientId, sellerId: ctx.sellerId, sellerName: ctx.sellerName });
    store.updateMessageInList(/* message with updated readStatus */);
  }

  return { send, update, remove, markAsRead };
}
```

### `useThreadPanel.ts`

Per-blade scoped via provide/inject. Thread messages are loaded separately from root messages (matching current API pattern — root messages use `rootsOnly: true`, thread replies are fetched via dedicated endpoint):

```typescript
export interface ThreadPanelState {
  activeThreadId: Readonly<Ref<string | null>>;
  threadMessages: Ref<Message[]>;
  isOpen: ComputedRef<boolean>;
  threadLoading: Ref<boolean>;
  openThread(messageId: string): Promise<void>;
  closeThread(): void;
  loadThreadReplies(threadId: string): Promise<void>;
}

export function createThreadPanel(): ThreadPanelState {
  const activeThreadId = ref<string | null>(null);
  const threadMessages = ref<Message[]>([]);
  const { getThread: getThreadApi } = useMessageApi();

  async function openThread(messageId: string) {
    activeThreadId.value = messageId;
    await loadThreadReplies(messageId);
  }

  function closeThread() {
    activeThreadId.value = null;
    threadMessages.value = [];
  }

  async function loadThreadReplies(threadId: string) {
    // Fetches thread replies from API — separate from root messages
    const result = await getThreadApi(threadId);
    threadMessages.value = result;
  }

  return {
    activeThreadId: readonly(activeThreadId),
    threadMessages,
    isOpen: computed(() => activeThreadId.value !== null),
    threadLoading,
    openThread,
    closeThread,
    loadThreadReplies,
  };
}

// Convenience inject hook
export function useThreadPanel(): ThreadPanelState {
  const panel = inject(threadPanelKey);
  if (!panel) throw new Error("useThreadPanel() called outside of Messenger blade");
  return panel;
}
```

```typescript
// pages/messenger.vue
const threadPanel = createThreadPanel();
provide(threadPanelKey, threadPanel);
```

## Architecture: Typed Injection Keys

### Problem

12+ string-based provide/inject calls without type safety.

### Solution: `injection-keys.ts`

```typescript
import type { InjectionKey, Ref } from "vue";

export interface MessengerContext {
  entityId: string | undefined;
  entityType: string | undefined;
  sellerId: string;
  sellerName: string;
  conversation: Ref<Conversation | undefined>;
}

export const messengerContextKey: InjectionKey<MessengerContext> = Symbol("messengerContext");
export const messengerStoreKey: InjectionKey<MessengerStore> = Symbol("messengerStore");
export const threadPanelKey: InjectionKey<ThreadPanelState> = Symbol("threadPanel");
```

12 separate `provide()` calls → three typed provides:

```typescript
// messenger.vue
provide(messengerContextKey, { entityId, entityType, sellerId, sellerName, conversation });
provide(messengerStoreKey, store);
provide(threadPanelKey, threadPanel);
```

Functions like `updateMessage`, `removeMessage` are no longer injected — they come from `useMessageActions()` which internally injects the store.

## Component Interfaces

### `message-list.vue`

```typescript
// Props: none — reads from injected store
// Emits: none — uses useMessageActions() and useThreadPanel() directly
// Responsibilities:
//   - Renders rootMessages from store
//   - Owns the scroll container + useInfiniteScroll() for root message pagination
//   - Contains bottom MessageForm for new root messages
//   - MessageItem emits "open-thread" → calls useThreadPanel().openThread()
```

### `thread-panel.vue`

```typescript
// Props: none — reads from injected threadPanel
// Emits: none — uses useMessageActions() directly
// Responsibilities:
//   - Shows root message as highlighted card at top
//   - Renders threadMessages (with recursive nesting via border-left indent)
//   - Owns its own scroll container + useInfiniteScroll() for thread pagination
//   - Contains bottom MessageForm for thread replies
//   - Close button calls useThreadPanel().closeThread()
```

### `message-item.vue`

```typescript
interface Props {
  message: Message;
  isMobile: boolean;
  isThreadView?: boolean;      // compact mode when inside thread panel
  nestingLevel?: number;       // for indentation in thread panel (0 = root)
}

interface Emits {
  (e: "open-thread", messageId: string): void;
}

// Responsibilities:
//   - Renders one message (avatar, author, time, content, attachments, thread badge)
//   - MessageHoverToolbar appears on hover (desktop) or "..." button (mobile)
//   - Reply/Edit actions: inline MessageForm (edit mode) or calls emit("open-thread")
//   - Delete: calls useMessageActions().remove() directly
//   - Auto-mark-as-read: useElementVisibility() + 2s delay timer (carried over from current code)
//   - Content truncation with expand/collapse (carried over)
```

### `message-hover-toolbar.vue`

```typescript
interface Props {
  canEdit: boolean;
  canDelete: boolean;
}

interface Emits {
  (e: "reply"): void;
  (e: "edit"): void;
  (e: "delete"): void;
  (e: "open-thread"): void;
}

// Desktop: positioned absolute, top-right of message, appears on hover
// Mobile: not rendered — replaced by "..." menu button in message-item
// Keyboard a11y: parent message-item is focusable, Tab reveals toolbar
```

### `message-form.vue`

```typescript
interface Props {
  mode: "new" | "reply" | "edit";
  message?: Message;           // for edit mode — prefills content + attachments
  replyTo?: string;            // for reply mode — thread ID
  placeholder?: string;
  loading?: boolean;
}

interface Emits {
  (e: "send", args: { content: string; attachments: MessageAttachment[] }): void;
  (e: "cancel"): void;
}

// In "new" mode: collapsed input that expands on focus (bottom of MessageList)
// In "reply" mode: always expanded (bottom of ThreadPanel)
// In "edit" mode: inline within message-item, prefilled, Save/Cancel buttons
```

## Visual: Layout

### Desktop

```
┌─ VcBlade width="50%" ─────────────────────────────────┐
│ ┌─ Header (entity icon + name + link) ───────────────┐ │
│ └────────────────────────────────────────────────────┘ │
│ ┌─ MessageList (flex: 3) ─┐ ┌─ ThreadPanel (flex: 2) ┐ │
│ │                          │ │ Thread header + close   │ │
│ │  [message]               │ │                         │ │
│ │  [message] ← hover bar  │ │ [root message card]     │ │
│ │  [message]  "3 replies"──┼─│→[reply]                 │ │
│ │  [message]               │ │   [nested reply]        │ │
│ │                          │ │ [reply]                 │ │
│ │                          │ │                         │ │
│ │ ┌─ MessageForm ────────┐ │ │ ┌─ MessageForm ──────┐ │ │
│ │ │ Write a message...   │ │ │ │ Reply in thread... │ │ │
│ │ └──────────────────────┘ │ │ └────────────────────┘ │ │
│ └──────────────────────────┘ └─────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

When no thread is open, MessageList takes full width (flex: 1, no ThreadPanel).

### Mobile

- Default state: `MessageList` full-width
- On "N replies" tap: `ThreadPanel` replaces `MessageList` with slide transition
- Thread panel header shows "← Back" button that calls `useThreadPanel().closeThread()`
- Hover toolbar not rendered — replaced by always-visible "..." button (top-right of message-item)
- "..." button opens a dropdown menu with Reply, Edit, Delete options
- Implementation: `v-if` swap controlled by `useThreadPanel().isOpen`

```typescript
// messenger.vue template (simplified)
<div class="messenger__layout">
  <MessageList v-if="$isDesktop.value || !threadPanel.isOpen.value" />
  <ThreadPanel v-if="($isDesktop.value && threadPanel.isOpen.value) || ($isMobile.value && threadPanel.isOpen.value)" />
</div>
```

## Visual: Message Item

```
┌─────────────────────────────────────────────────────┐
│ [avatar 28px rounded-md]  Author Name  10:30 AM  ●  │  ← ● = unread dot
│                                                      │
│ Message content text here...                         │
│                                                      │
│ [📄 invoice.pdf  24KB]                               │  ← attachments inline
│                                                      │
│ [3 replies · Last reply 5 min ago]                   │  ← thread badge
└─────────────────────────────────────────────────────┘
         ┌──────────┐
         │ ↩  ✏  🗑 │  ← hover toolbar (appears on hover)
         └──────────┘
```

- No permanent action buttons — hover-only (desktop), "..." menu (mobile)
- Avatar: 28px, `border-radius: 6px` (Slack-style, not circle)
- Unread: red dot next to timestamp
- Attachments: inline chips
- Thread badge: pill with reply count + last reply time
- Content truncation: max 4 lines, expand/collapse button (carried over from current)
- Auto-mark-as-read: `useElementVisibility()` + 2s delay timer (carried over from current)

## Visual: Thread Panel

- Header: "Thread" title + close (✕) button
- Root message: highlighted in a card with border
- Replies: flat list, compact (smaller avatars 24px)
- Nested replies (reply-to-reply): `border-left: 2px solid var(--blade-border-color)` + `padding-left: 12px`
- Reply form at bottom (always expanded, "Reply in thread..." placeholder)
- Own scroll container with infinite scroll for long threads

## Visual: AllMessages (Conversation List)

Keep VcDataTable. Improve column slots:

- Icon column: avatar image or fallback icon (unchanged structure)
- Name column layout (improved rendering):
  ```
  [Author Name]  [Entity Type badge]  [time ago]  [unread badge]
  [Sender]: Last message preview text...
  ```
- Better spacing, font weights, truncation

## Data Flow

```
messenger.vue (orchestrator)
  ├─ provide(messengerContextKey)      — entity info, seller
  ├─ provide(messengerStoreKey)        — createMessengerStore()
  ├─ provide(threadPanelKey)           — createThreadPanel()
  │
  ├─ MessageList
  │    ├─ useMessengerStore()          — injects store, reads rootMessages
  │    ├─ useInfiniteScroll()          — root message pagination
  │    ├─ MessageItem × N
  │    │    ├─ props: message, isMobile
  │    │    ├─ emit: open-thread → useThreadPanel().openThread()
  │    │    ├─ useMessageActions()     — direct send/update/remove (injects store)
  │    │    ├─ useElementVisibility()  — auto-mark-as-read with 2s delay
  │    │    └─ MessageHoverToolbar
  │    └─ MessageForm (mode="new")
  │
  └─ ThreadPanel (v-if="threadPanel.isOpen")
       ├─ useThreadPanel()             — injects thread panel, reads threadMessages
       ├─ useInfiniteScroll()          — thread reply pagination (separate from root)
       ├─ MessageItem × N             — with nestingLevel prop for indentation
       └─ MessageForm (mode="reply")
```

**Key changes from current architecture:**
- No emit chains for update/remove/markAsRead — components call `useMessageActions()` directly
- Store is per-blade, not singleton — multiple Messenger blades work correctly
- Root messages and thread messages are separate collections — no filtering confusion
- Thread replies loaded via dedicated API call, not filtered from root messages

## Behaviors Carried Over

These existing behaviors must be preserved in the rewrite:
- **Auto-mark-as-read:** `useElementVisibility()` + 2s delay timer on unread messages
- **Content truncation:** max 4 lines with gradient overlay and expand/collapse button
- **Highlight on target:** flash animation when navigating to a specific message via `param`
- **Enter-to-send:** keyboard shortcut in message form
- **File upload:** drag-and-drop + file picker with validation (size, count, type limits from settings)
- **Push notifications:** `notifyType: "MessagePushNotification"` handler refreshes message list

## Push Notification Integration

The `notifyType: "MessagePushNotification"` on the blade triggers the notification handler. In the current code this reloads conversations in `all-messages.vue`. For the Messenger blade, the handler should call `store.loadRootMessages()` to refresh the message list when a push arrives. The store's `loadRootMessages` is safe to call multiple times.

## Files Deleted

- `components/message-tree.vue` → replaced by `thread-panel.vue` + recursive `message-item.vue`
- `components/new-message-form.vue` → renamed to `message-form.vue`
- `composables/useMessenger/` → split into `useMessengerStore` + `useMessageActions` + `useThreadPanel`

## Files Unchanged

- `useInfiniteScroll/`, `useConversationList/`, `useMessageApi/`, `useConversationApi/`, `useUserApi/`, `useSettingsApi/`
- `asset-item.vue`, `image-preview-popup.vue`, `message-skeleton.vue`
- `notifications/`, `widgets/`
- `constants.ts`, `fileUtils.ts`, `typings/`
- `index.ts` (module entry)

## Dependencies

- **Remove:** `moment` (replace `dateAgo` in `utils.ts` with `useTimeAgo` from `@vueuse/core`)
- **Note:** `useTimeAgo` returns a `Ref<string>` that auto-updates — template binding changes from `{{ dateAgo(date) }}` to `{{ timeAgo }}` where `timeAgo = useTimeAgo(date)`
- **No new dependencies**

## Locales

Add keys:
- `MESSENGER.THREAD.TITLE` — "Thread"
- `MESSENGER.THREAD.CLOSE` — "Close"
- `MESSENGER.THREAD.REPLY_PLACEHOLDER` — "Reply in thread..."
- `MESSENGER.THREAD.REPLIES_COUNT` — "{count} replies"
- `MESSENGER.THREAD.LAST_REPLY` — "Last reply {time}"
- `MESSENGER.THREAD.BACK` — "Back" (mobile)
- `MESSENGER.HOVER.REPLY` — "Reply"
- `MESSENGER.HOVER.EDIT` — "Edit"
- `MESSENGER.HOVER.DELETE` — "Delete"
- `MESSENGER.HOVER.OPEN_THREAD` — "Open thread"
- `MESSENGER.MORE_ACTIONS` — "More actions" (mobile "..." button)
