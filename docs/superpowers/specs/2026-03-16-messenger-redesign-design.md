# Messenger Module Redesign — Architecture + Visual

**Date:** 2026-03-16
**Module:** `vcmp-communication/src/modules/messenger/`
**Approach:** Full rewrite with Slack-style UI and clean architecture

## Summary

Redesign the messenger module with two parallel goals:
1. **Architecture** — singleton store, typed injection keys, proper separation of concerns
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

## Component Structure

```
messenger/
  pages/
    messenger.vue              — Orchestrator: split layout, provide context
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
    useMessengerStore.ts       — Singleton store: messages, operator, seller, settings
    useThreadPanel.ts          — Thread panel UI state: activeThreadId, open/close
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

## Architecture: Singleton Store

### Problem

Current `useMessenger()` creates isolated state per call. `message-tree.vue` has its own `messages` separate from `messenger.vue`, causing desync and duplicated logic.

### Solution: `useMessengerStore.ts`

Module-level state shared across all consumers:

```typescript
// State lives at module scope — one instance per app
const messages = shallowRef<Message[]>([]);
const operator = ref<CommunicationUser>();
const seller = ref<CommunicationUser>();
const settings = ref<MarketplaceCommunicationSettings>();
const conversation = ref<Conversation>();
const searchResult = shallowRef<ISearchMessageResult | null>(null);
const searchQuery = ref<SearchMessagesQuery>({ take: 20 });

export function useMessengerStore() {
  return {
    // Readonly state
    messages: readonly(messages),
    operator: readonly(operator),
    seller: readonly(seller),
    settings: readonly(settings),
    conversation,

    // Mutations
    setMessages,
    updateMessageInList,
    removeMessageFromList,

    // Async actions
    loadRootMessages,
    loadMoreMessages,
    loadPreviousMessages,
    initializeConversation,

    // Cleanup
    reset,
  };
}
```

### `useMessageActions.ts`

Thin wrappers over API composables that update the store:

```typescript
export function useMessageActions() {
  const store = useMessengerStore();
  const { sendMessage: sendMessageApi, ... } = useMessageApi();

  async function send(args) {
    const result = await sendMessageApi(args);
    store.setMessages([...store.messages.value, result]);
    return result;
  }

  async function remove(ids: string[]) {
    await removeMessageApi({ messageIds: ids });
    store.removeMessageFromList(ids);
  }

  // etc.
  return { send, update, remove, markAsRead };
}
```

### `useThreadPanel.ts`

UI state for thread panel:

```typescript
const activeThreadId = ref<string | null>(null);
const threadMessages = computed(() =>
  store.messages.value.filter(m => m.threadId === activeThreadId.value)
);

export function useThreadPanel() {
  return {
    activeThreadId: readonly(activeThreadId),
    threadMessages,
    openThread(messageId: string) { activeThreadId.value = messageId; },
    closeThread() { activeThreadId.value = null; },
    isOpen: computed(() => activeThreadId.value !== null),
  };
}
```

## Architecture: Typed Injection Keys

### Problem

12+ string-based provide/inject calls without type safety:

```typescript
// Current — fragile, no autocomplete, no type checking
provide("entityId", props.options?.entityId);
const entityId = inject("entityId") as string; // might be undefined!
```

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
export const messengerSettingsKey: InjectionKey<Ref<MarketplaceCommunicationSettings | undefined>> = Symbol("messengerSettings");
```

12 separate `provide()` calls → one:

```typescript
provide(messengerContextKey, {
  entityId: props.options?.entityId,
  entityType: props.options?.entityType,
  sellerId: currentSeller.value.id,
  sellerName: currentSeller.value.name,
  conversation,
});
```

Functions like `updateMessage`, `removeMessage`, `setActiveForm` are no longer injected — they come from `useMessageActions()` and `useThreadPanel()` directly.

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

### Mobile

- Default: `MessageList` full-width
- On "N replies" tap: `ThreadPanel` replaces `MessageList` with "← Back" button
- Hover toolbar replaced by: always-visible "..." button in top-right corner of message

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

- No permanent action buttons — hover-only
- Avatar: 28px, `border-radius: 6px` (Slack-style, not circle)
- Unread: red dot next to timestamp
- Attachments: inline chips
- Thread badge: pill with reply count + last reply time

## Visual: Thread Panel

- Header: "Thread" title + close (✕) button
- Root message: highlighted in a card with border
- Replies: flat list, compact (smaller avatars 24px)
- Nested replies (reply-to-reply): `border-left: 2px solid` + left padding
- Reply form at bottom

## Visual: AllMessages (Conversation List)

Keep VcDataTable. Improve column slots:

- Icon column: avatar image or fallback icon
- Name column layout:
  ```
  [Author Name]  [Entity Type badge]  [time ago]  [unread badge]
  [Sender]: Last message preview text...
  ```
- Better spacing, font weights, truncation

## Data Flow

```
messenger.vue (orchestrator)
  ├─ provide(messengerContextKey)
  ├─ useMessengerStore()
  ├─ useThreadPanel()
  │
  ├─ MessageList
  │    ├─ useMessengerStore()          — reads messages
  │    ├─ useInfiniteScroll()
  │    ├─ MessageItem × N
  │    │    ├─ props: message, isMobile
  │    │    ├─ emit: open-thread
  │    │    ├─ useMessageActions()     — direct send/update/remove
  │    │    └─ MessageHoverToolbar
  │    └─ MessageForm (bottom)
  │
  └─ ThreadPanel (v-if="activeThread")
       ├─ useMessengerStore()          — same singleton
       ├─ useInfiniteScroll()
       ├─ props: threadId
       ├─ MessageItem × N (recursive nesting via indent)
       └─ MessageForm (bottom)
```

**Key change:** No emit chains for update/remove/markAsRead. Components call `useMessageActions()` directly, which updates the singleton store. One source of truth.

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
