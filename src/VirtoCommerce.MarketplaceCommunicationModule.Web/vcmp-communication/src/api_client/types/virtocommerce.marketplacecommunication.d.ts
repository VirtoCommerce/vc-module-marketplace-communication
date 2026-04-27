/**
 * JSON parse reviver that converts ISO date strings to Date objects.
 * This is needed because when using interface-based types (after NSwag migration),
 * dates are not automatically converted from strings to Date objects.
 */
declare function dateReviver(key: string, value: unknown): unknown;
export declare class AuthApiBase {
    authToken: string;
    /**
     * JSON parse reviver for converting date strings to Date objects.
     * Subclasses use this when parsing API responses.
     * The dateReviver function is defined in File.Header.liquid template.
     */
    protected jsonParseReviver: typeof dateReviver;
    protected constructor();
    getBaseUrl(defaultUrl: string, baseUrl: string): string;
    setAuthToken(token: string): void;
    protected transformOptions(options: any): Promise<any>;
}
export declare class VcmpCommunicationClient extends AuthApiBase {
    private http;
    private baseUrl;
    constructor(baseUrl?: string, http?: {
        fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
    });
    /**
     * @return OK
     */
    getCommunicationSettings(): Promise<MarketplaceCommunicationSettings>;
    protected processGetCommunicationSettings(response: Response): Promise<MarketplaceCommunicationSettings>;
}
export declare class VcmpCommunicationUserClient extends AuthApiBase {
    private http;
    private baseUrl;
    constructor(baseUrl?: string, http?: {
        fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
    });
    /**
     * @param communicationUserIds (optional)
     * @return OK
     */
    getCommunicationUsers(communicationUserIds?: string[] | undefined): Promise<CommunicationUser[]>;
    protected processGetCommunicationUsers(response: Response): Promise<CommunicationUser[]>;
    /**
     * @return OK
     */
    getOperator(): Promise<CommunicationUser>;
    protected processGetOperator(response: Response): Promise<CommunicationUser>;
    /**
     * @param userId (optional)
     * @param userType (optional)
     * @return OK
     */
    getOrCreateCommunicationUser(userId?: string | undefined, userType?: string | undefined): Promise<CommunicationUser>;
    protected processGetOrCreateCommunicationUser(response: Response): Promise<CommunicationUser>;
    /**
     * @param body (optional)
     * @return OK
     */
    getSeller(body?: GetSellerCommunicationUserQuery | undefined): Promise<CommunicationUser>;
    protected processGetSeller(response: Response): Promise<CommunicationUser>;
}
export declare class VcmpConversationClient extends AuthApiBase {
    private http;
    private baseUrl;
    constructor(baseUrl?: string, http?: {
        fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
    });
    /**
     * @param body (optional)
     * @return OK
     */
    search(body?: SearchConversationsQuery | undefined): Promise<SearchConversationResult>;
    protected processSearch(response: Response): Promise<SearchConversationResult>;
    /**
     * @param conversationId (optional)
     * @return OK
     */
    getById(conversationId?: string | undefined): Promise<Conversation>;
    protected processGetById(response: Response): Promise<Conversation>;
    /**
     * @param entityId (optional)
     * @param entityType (optional)
     * @return OK
     */
    getByEntity(entityId?: string | undefined, entityType?: string | undefined): Promise<Conversation>;
    protected processGetByEntity(response: Response): Promise<Conversation>;
    /**
     * @param body (optional)
     * @return OK
     */
    createConversation(body?: CreateConversationCommand | undefined): Promise<Conversation>;
    protected processCreateConversation(response: Response): Promise<Conversation>;
    /**
     * @param body (optional)
     * @return OK
     */
    updateConversation(body?: UpdateConversationCommand | undefined): Promise<Conversation>;
    protected processUpdateConversation(response: Response): Promise<Conversation>;
}
export declare class VcmpMessageClient extends AuthApiBase {
    private http;
    private baseUrl;
    constructor(baseUrl?: string, http?: {
        fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
    });
    /**
     * @param body (optional)
     * @return OK
     */
    search(body?: SearchMessagesQuery | undefined): Promise<SearchMessageResult>;
    protected processSearch(response: Response): Promise<SearchMessageResult>;
    /**
     * @param messageId (optional)
     * @return OK
     */
    getMessageById(messageId?: string | undefined): Promise<Message>;
    protected processGetMessageById(response: Response): Promise<Message>;
    /**
     * @param threadId (optional)
     * @return OK
     */
    getThread(threadId?: string | undefined): Promise<Message[]>;
    protected processGetThread(response: Response): Promise<Message[]>;
    /**
     * @param body (optional)
     * @return OK
     */
    sendMessage(body?: SendMessageCommand | undefined): Promise<void>;
    protected processSendMessage(response: Response): Promise<void>;
    /**
     * @param body (optional)
     * @return OK
     */
    updateMessage(body?: UpdateMessageCommand | undefined): Promise<void>;
    protected processUpdateMessage(response: Response): Promise<void>;
    /**
     * @param body (optional)
     * @return OK
     */
    deleteMessage(body?: DeleteMessageCommand | undefined): Promise<void>;
    protected processDeleteMessage(response: Response): Promise<void>;
    /**
     * @param body (optional)
     * @return OK
     */
    markMessageAsRead(body?: MarkMessageAsReadCommand | undefined): Promise<void>;
    protected processMarkMessageAsRead(response: Response): Promise<void>;
    /**
     * @param body (optional)
     * @return OK
     */
    sendReaction(body?: SendReactionCommand | undefined): Promise<void>;
    protected processSendReaction(response: Response): Promise<void>;
    /**
     * @param body (optional)
     * @return OK
     */
    getUnreadMessageCount(body?: GetUnreadCountQuery | undefined): Promise<number>;
    protected processGetUnreadMessageCount(response: Response): Promise<number>;
}
export interface CommunicationUser {
    userName?: string | undefined;
    userId?: string | undefined;
    userType?: string | undefined;
    avatarUrl?: string | undefined;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
}
export interface Conversation {
    name?: string | undefined;
    iconUrl?: string | undefined;
    entityId?: string | undefined;
    entityType?: string | undefined;
    lastMessageId?: string | undefined;
    lastMessageTimestamp?: Date;
    users?: ConversationUser[] | undefined;
    unreadMessagesCount?: number;
    lastMessage?: Message | undefined;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
}
export interface ConversationUser {
    conversationId?: string | undefined;
    userId?: string | undefined;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
}
export interface CreateConversationCommand {
    userIds: string[];
    name?: string | undefined;
    iconUrl?: string | undefined;
    entityId?: string | undefined;
    entityType?: string | undefined;
    sellerId?: string | undefined;
    sellerName?: string | undefined;
}
export interface DeleteMessageCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    messageIds: string[];
}
export interface GetSellerCommunicationUserQuery {
    entityId: string;
    entityType: string;
}
export interface GetUnreadCountQuery {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    recipientId?: string | undefined;
    entityId: string;
    entityType: string;
}
export interface MarkMessageAsReadCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    messageId: string;
    recipientId?: string | undefined;
    notRead?: boolean;
}
export interface MarketplaceCommunicationSettings {
    attachmentCountLimit?: number;
    attachmentSizeLimit?: number;
}
export interface Message {
    senderId?: string | undefined;
    content?: string | undefined;
    threadId?: string | undefined;
    conversationId?: string | undefined;
    attachments?: MessageAttachment[] | undefined;
    recipients?: MessageRecipient[] | undefined;
    reactions?: MessageReaction[] | undefined;
    answers?: Message[] | undefined;
    conversation?: Conversation | undefined;
    readonly answersCount?: number | undefined;
    readonly entityId?: string | undefined;
    readonly entityType?: string | undefined;
    sender?: CommunicationUser | undefined;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
}
export interface MessageAttachment {
    messageId?: string | undefined;
    attachmentUrl?: string | undefined;
    fileName?: string | undefined;
    fileType?: string | undefined;
    fileSize?: number;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
}
export interface MessageReaction {
    messageId?: string | undefined;
    userId?: string | undefined;
    reaction?: string | undefined;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
}
export interface MessageRecipient {
    messageId?: string | undefined;
    recipientId?: string | undefined;
    readStatus?: string | undefined;
    readTimestamp?: Date;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
}
export interface MessageShort {
    senderId?: string | undefined;
    recipientId?: string | undefined;
    conversationId?: string | undefined;
    entityId?: string | undefined;
    entityType?: string | undefined;
    content?: string | undefined;
    replyTo?: string | undefined;
    attachments?: MessageAttachment[] | undefined;
}
export interface SearchConversationResult {
    totalCount?: number;
    results?: Conversation[] | undefined;
}
export interface SearchConversationsQuery {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    userIds?: string[] | undefined;
    responseGroup?: string | undefined;
    objectType?: string | undefined;
    objectTypes?: string[] | undefined;
    objectIds?: string[] | undefined;
    keyword?: string | undefined;
    searchPhrase?: string | undefined;
    languageCode?: string | undefined;
    sort?: string | undefined;
    readonly sortInfos?: SortInfo[] | undefined;
    skip?: number;
    take?: number;
}
export interface SearchMessageResult {
    totalCount?: number;
    results?: Message[] | undefined;
}
export interface SearchMessagesQuery {
    entityId?: string | undefined;
    entityType?: string | undefined;
    conversationId?: string | undefined;
    threadId?: string | undefined;
    rootsOnly?: boolean;
    responseGroup?: string | undefined;
    objectType?: string | undefined;
    objectTypes?: string[] | undefined;
    objectIds?: string[] | undefined;
    keyword?: string | undefined;
    searchPhrase?: string | undefined;
    languageCode?: string | undefined;
    sort?: string | undefined;
    readonly sortInfos?: SortInfo[] | undefined;
    skip?: number;
    take?: number;
}
export interface SendMessageCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    message: MessageShort;
}
export interface SendReactionCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    messageId: string;
    reactorId?: string | undefined;
    reaction?: string | undefined;
}
export declare enum SortDirection {
    Ascending = "Ascending",
    Descending = "Descending"
}
export interface SortInfo {
    sortColumn?: string | undefined;
    sortDirection?: SortDirection;
}
export interface UpdateConversationCommand {
    conversation: Conversation;
}
export interface UpdateMessageCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    messageId: string;
    content: string;
    attachments?: MessageAttachment[] | undefined;
}
export declare class ApiException extends Error {
    message: string;
    status: number;
    response: string;
    headers: {
        [key: string]: any;
    };
    result: any;
    constructor(message: string, status: number, response: string, headers: {
        [key: string]: any;
    }, result: any);
    protected isApiException: boolean;
    static isApiException(obj: any): obj is ApiException;
}
export {};
//# sourceMappingURL=virtocommerce.marketplacecommunication.d.ts.map