import type { InjectionKey, Ref, ComputedRef } from "vue";
import type {
  Conversation,
  CommunicationUser,
  MarketplaceCommunicationSettings,
  Message,
  SearchMessagesQuery,
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
  loadMessages(query: SearchMessagesQuery): Promise<void>;
  loadMoreMessages(query: SearchMessagesQuery): Promise<boolean>;
  loadPreviousMessages(query?: SearchMessagesQuery): Promise<boolean>;
  initializeConversation(options: {
    entityId?: string;
    entityType?: string;
    conversation?: Conversation;
  }): Promise<void>;

  // Quotes
  quotesCache: Map<string, Message>;
  getQuotedMessage: (messageId: string) => Promise<Message | null>;

  // Cleanup
  reset(): void;
}

export const messengerStoreKey: InjectionKey<MessengerStore> = Symbol("messengerStore");
