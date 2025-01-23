export declare class AuthApiBase {
    authToken: string;
    protected constructor();
    getBaseUrl(defaultUrl: string, baseUrl: string): string;
    setAuthToken(token: string): void;
    protected transformOptions(options: any): Promise<any>;
}
export declare class VcmpCommunicationClient extends AuthApiBase {
    private http;
    private baseUrl;
    protected jsonParseReviver: ((key: string, value: any) => any) | undefined;
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
    protected jsonParseReviver: ((key: string, value: any) => any) | undefined;
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
    protected jsonParseReviver: ((key: string, value: any) => any) | undefined;
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
    protected jsonParseReviver: ((key: string, value: any) => any) | undefined;
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
export declare class CommunicationUser implements ICommunicationUser {
    userName?: string | undefined;
    userId?: string | undefined;
    userType?: string | undefined;
    avatarUrl?: string | undefined;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
    constructor(data?: ICommunicationUser);
    init(_data?: any): void;
    static fromJS(data: any): CommunicationUser;
    toJSON(data?: any): any;
}
export interface ICommunicationUser {
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
export declare class Conversation implements IConversation {
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
    constructor(data?: IConversation);
    init(_data?: any): void;
    static fromJS(data: any): Conversation;
    toJSON(data?: any): any;
}
export interface IConversation {
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
export declare class ConversationUser implements IConversationUser {
    conversationId?: string | undefined;
    userId?: string | undefined;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
    constructor(data?: IConversationUser);
    init(_data?: any): void;
    static fromJS(data: any): ConversationUser;
    toJSON(data?: any): any;
}
export interface IConversationUser {
    conversationId?: string | undefined;
    userId?: string | undefined;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
}
export declare class CreateConversationCommand implements ICreateConversationCommand {
    userIds: string[];
    name?: string | undefined;
    iconUrl?: string | undefined;
    entityId?: string | undefined;
    entityType?: string | undefined;
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    constructor(data?: ICreateConversationCommand);
    init(_data?: any): void;
    static fromJS(data: any): CreateConversationCommand;
    toJSON(data?: any): any;
}
export interface ICreateConversationCommand {
    userIds: string[];
    name?: string | undefined;
    iconUrl?: string | undefined;
    entityId?: string | undefined;
    entityType?: string | undefined;
    sellerId?: string | undefined;
    sellerName?: string | undefined;
}
export declare class DeleteMessageCommand implements IDeleteMessageCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    messageIds: string[];
    constructor(data?: IDeleteMessageCommand);
    init(_data?: any): void;
    static fromJS(data: any): DeleteMessageCommand;
    toJSON(data?: any): any;
}
export interface IDeleteMessageCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    messageIds: string[];
}
export declare class GetSellerCommunicationUserQuery implements IGetSellerCommunicationUserQuery {
    entityId: string;
    entityType: string;
    constructor(data?: IGetSellerCommunicationUserQuery);
    init(_data?: any): void;
    static fromJS(data: any): GetSellerCommunicationUserQuery;
    toJSON(data?: any): any;
}
export interface IGetSellerCommunicationUserQuery {
    entityId: string;
    entityType: string;
}
export declare class GetUnreadCountQuery implements IGetUnreadCountQuery {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    recipientId?: string | undefined;
    entityId: string;
    entityType: string;
    constructor(data?: IGetUnreadCountQuery);
    init(_data?: any): void;
    static fromJS(data: any): GetUnreadCountQuery;
    toJSON(data?: any): any;
}
export interface IGetUnreadCountQuery {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    recipientId?: string | undefined;
    entityId: string;
    entityType: string;
}
export declare class MarkMessageAsReadCommand implements IMarkMessageAsReadCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    messageId: string;
    recipientId?: string | undefined;
    notRead?: boolean;
    constructor(data?: IMarkMessageAsReadCommand);
    init(_data?: any): void;
    static fromJS(data: any): MarkMessageAsReadCommand;
    toJSON(data?: any): any;
}
export interface IMarkMessageAsReadCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    messageId: string;
    recipientId?: string | undefined;
    notRead?: boolean;
}
export declare class MarketplaceCommunicationSettings implements IMarketplaceCommunicationSettings {
    attachmentCountLimit?: number;
    attachmentSizeLimit?: number;
    constructor(data?: IMarketplaceCommunicationSettings);
    init(_data?: any): void;
    static fromJS(data: any): MarketplaceCommunicationSettings;
    toJSON(data?: any): any;
}
export interface IMarketplaceCommunicationSettings {
    attachmentCountLimit?: number;
    attachmentSizeLimit?: number;
}
export declare class Message implements IMessage {
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
    constructor(data?: IMessage);
    init(_data?: any): void;
    static fromJS(data: any): Message;
    toJSON(data?: any): any;
}
export interface IMessage {
    senderId?: string | undefined;
    content?: string | undefined;
    threadId?: string | undefined;
    conversationId?: string | undefined;
    attachments?: MessageAttachment[] | undefined;
    recipients?: MessageRecipient[] | undefined;
    reactions?: MessageReaction[] | undefined;
    answers?: Message[] | undefined;
    conversation?: Conversation | undefined;
    answersCount?: number | undefined;
    entityId?: string | undefined;
    entityType?: string | undefined;
    sender?: CommunicationUser | undefined;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
}
export declare class MessageAttachment implements IMessageAttachment {
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
    constructor(data?: IMessageAttachment);
    init(_data?: any): void;
    static fromJS(data: any): MessageAttachment;
    toJSON(data?: any): any;
}
export interface IMessageAttachment {
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
export declare class MessageReaction implements IMessageReaction {
    messageId?: string | undefined;
    userId?: string | undefined;
    reaction?: string | undefined;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
    constructor(data?: IMessageReaction);
    init(_data?: any): void;
    static fromJS(data: any): MessageReaction;
    toJSON(data?: any): any;
}
export interface IMessageReaction {
    messageId?: string | undefined;
    userId?: string | undefined;
    reaction?: string | undefined;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
}
export declare class MessageRecipient implements IMessageRecipient {
    messageId?: string | undefined;
    recipientId?: string | undefined;
    readStatus?: string | undefined;
    readTimestamp?: Date;
    createdDate?: Date;
    modifiedDate?: Date | undefined;
    createdBy?: string | undefined;
    modifiedBy?: string | undefined;
    id?: string | undefined;
    constructor(data?: IMessageRecipient);
    init(_data?: any): void;
    static fromJS(data: any): MessageRecipient;
    toJSON(data?: any): any;
}
export interface IMessageRecipient {
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
export declare class MessageShort implements IMessageShort {
    senderId?: string | undefined;
    recipientId?: string | undefined;
    conversationId?: string | undefined;
    entityId?: string | undefined;
    entityType?: string | undefined;
    content?: string | undefined;
    replyTo?: string | undefined;
    attachments?: MessageAttachment[] | undefined;
    constructor(data?: IMessageShort);
    init(_data?: any): void;
    static fromJS(data: any): MessageShort;
    toJSON(data?: any): any;
}
export interface IMessageShort {
    senderId?: string | undefined;
    recipientId?: string | undefined;
    conversationId?: string | undefined;
    entityId?: string | undefined;
    entityType?: string | undefined;
    content?: string | undefined;
    replyTo?: string | undefined;
    attachments?: MessageAttachment[] | undefined;
}
export declare class SearchConversationResult implements ISearchConversationResult {
    totalCount?: number;
    results?: Conversation[] | undefined;
    constructor(data?: ISearchConversationResult);
    init(_data?: any): void;
    static fromJS(data: any): SearchConversationResult;
    toJSON(data?: any): any;
}
export interface ISearchConversationResult {
    totalCount?: number;
    results?: Conversation[] | undefined;
}
export declare class SearchConversationsQuery implements ISearchConversationsQuery {
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
    constructor(data?: ISearchConversationsQuery);
    init(_data?: any): void;
    static fromJS(data: any): SearchConversationsQuery;
    toJSON(data?: any): any;
}
export interface ISearchConversationsQuery {
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
    sortInfos?: SortInfo[] | undefined;
    skip?: number;
    take?: number;
}
export declare class SearchMessageResult implements ISearchMessageResult {
    totalCount?: number;
    results?: Message[] | undefined;
    constructor(data?: ISearchMessageResult);
    init(_data?: any): void;
    static fromJS(data: any): SearchMessageResult;
    toJSON(data?: any): any;
}
export interface ISearchMessageResult {
    totalCount?: number;
    results?: Message[] | undefined;
}
export declare class SearchMessagesQuery implements ISearchMessagesQuery {
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
    constructor(data?: ISearchMessagesQuery);
    init(_data?: any): void;
    static fromJS(data: any): SearchMessagesQuery;
    toJSON(data?: any): any;
}
export interface ISearchMessagesQuery {
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
    sortInfos?: SortInfo[] | undefined;
    skip?: number;
    take?: number;
}
export declare class SendMessageCommand implements ISendMessageCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    message: MessageShort;
    constructor(data?: ISendMessageCommand);
    init(_data?: any): void;
    static fromJS(data: any): SendMessageCommand;
    toJSON(data?: any): any;
}
export interface ISendMessageCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    message: MessageShort;
}
export declare class SendReactionCommand implements ISendReactionCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    messageId: string;
    reactorId?: string | undefined;
    reaction?: string | undefined;
    constructor(data?: ISendReactionCommand);
    init(_data?: any): void;
    static fromJS(data: any): SendReactionCommand;
    toJSON(data?: any): any;
}
export interface ISendReactionCommand {
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
export declare class SortInfo implements ISortInfo {
    sortColumn?: string | undefined;
    sortDirection?: SortInfoSortDirection;
    constructor(data?: ISortInfo);
    init(_data?: any): void;
    static fromJS(data: any): SortInfo;
    toJSON(data?: any): any;
}
export interface ISortInfo {
    sortColumn?: string | undefined;
    sortDirection?: SortInfoSortDirection;
}
export declare class UpdateConversationCommand implements IUpdateConversationCommand {
    conversation: Conversation;
    constructor(data?: IUpdateConversationCommand);
    init(_data?: any): void;
    static fromJS(data: any): UpdateConversationCommand;
    toJSON(data?: any): any;
}
export interface IUpdateConversationCommand {
    conversation: Conversation;
}
export declare class UpdateMessageCommand implements IUpdateMessageCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    messageId: string;
    content: string;
    attachments?: MessageAttachment[] | undefined;
    constructor(data?: IUpdateMessageCommand);
    init(_data?: any): void;
    static fromJS(data: any): UpdateMessageCommand;
    toJSON(data?: any): any;
}
export interface IUpdateMessageCommand {
    sellerId?: string | undefined;
    sellerName?: string | undefined;
    messageId: string;
    content: string;
    attachments?: MessageAttachment[] | undefined;
}
export declare enum SortInfoSortDirection {
    Ascending = "Ascending",
    Descending = "Descending"
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
//# sourceMappingURL=virtocommerce.marketplacecommunication.d.ts.map