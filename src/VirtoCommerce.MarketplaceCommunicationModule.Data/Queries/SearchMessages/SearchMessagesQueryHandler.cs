using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models.Search;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.Platform.Core.Common;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class SearchMessagesQueryHandler : IQueryHandler<SearchMessagesQuery, SearchMessageResult>
{
    private readonly IMessageSearchService _messageSearchService;
    private readonly IConversationService _conversationService;
    private readonly ICommunicationUserService _communicationUserService;

    public SearchMessagesQueryHandler(
        IMessageSearchService messageSearchService,
        IConversationService conversationService,
        ICommunicationUserService communicationUserService
        )
    {
        _messageSearchService = messageSearchService;
        _conversationService = conversationService;
        _communicationUserService = communicationUserService;
    }

    public virtual async Task<SearchMessageResult> Handle(SearchMessagesQuery request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrEmpty(request.ConversationId) && !string.IsNullOrEmpty(request.EntityId) && !string.IsNullOrEmpty(request.EntityType))
        {
            request.ConversationId = (await _conversationService.GetConversationByEntity(request.EntityId, request.EntityType))?.Id;
        }

        if (request.UnreadOnly)
        {
            return await SearchUnreadAsync(request);
        }

        return await _messageSearchService.SearchAsync(request);
    }

    // Same rule as the unread count: a message whose seller recipient has not read it.
    // The search criteria cannot filter by recipient, so filter one conversation in memory.
    protected virtual async Task<SearchMessageResult> SearchUnreadAsync(SearchMessagesQuery request)
    {
        var result = AbstractTypeFactory<SearchMessageResult>.TryCreateInstance();
        if (string.IsNullOrEmpty(request.ConversationId))
        {
            return result;
        }

        var recipient = await _communicationUserService.GetOrCreateCommunicationUser(request.SellerId, CoreModuleConstants.CommunicationUserType.Organization);
        if (recipient == null)
        {
            return result;
        }

        var all = await _messageSearchService.SearchAllNoCloneAsync(new SearchMessageCriteria
        {
            ConversationId = request.ConversationId,
            ThreadId = request.ThreadId,
            RootsOnly = request.RootsOnly,
            Sort = request.Sort,
        });

        var unread = all
            .Where(x => x.Recipients?.Any(r => r.RecipientId == recipient.Id && r.ReadStatus != CoreModuleConstants.ReadStatus.Read) == true)
            .ToList();

        result.TotalCount = unread.Count;
        result.Results = unread.Skip(request.Skip).Take(request.Take).ToList();
        return result;
    }
}
