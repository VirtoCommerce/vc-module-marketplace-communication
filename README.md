# Marketplace Communication

Marketplace Communication lets the marketplace operator and vendors (sellers) talk to each other inside the Virto Commerce back office, without email.

A conversation is either about a **marketplace entity** (a vendor's product, an offer or a seller order) or a **direct conversation** between the operator and one vendor. Both sides write messages, reply to a message (quoting it), edit and delete their own messages and attach files. Unread messages are counted, marked as read when they are seen, and announced with a push notification.

## What you get

**Vendor portal** (the vendor's side):

- **Communication** in the main menu: all conversations of the vendor, with search, the last message and the number of unread messages.
- A **Communication** widget on the vendor's product, offer and order blades. It shows the number of unread messages and opens the conversation about that entity.
- **Operator chat** on the Communication list: the vendor's direct conversation with the marketplace operator.

**Admin Shell** (the operator's side, Vue):

- **Communication** in the main menu: all conversations of the operator.
- A **Communication** widget, with the operator's unread count, on these blades of the Marketplace Vendor module:
  - **Vendors** → vendor details: the direct conversation with the vendor.
  - **Marketplace products** → vendor product details.
  - **Offers** → offer details.
  - **Operator orders** → order details, including the seller orders opened from its **Seller orders** widget. A customer order that was split into seller orders has no vendor to talk to; the widget is disabled and says *Open a seller order to communicate*. The regular **Orders** screen doesn't show the widget.

**AngularJS admin** (the operator's side, legacy): the same features in the classic back office (**Browse → Communication** and the widgets on the vendor, vendor product, offer and order blades). It keeps working next to the Admin Shell.

## Requirements

- Virto Commerce Platform **3.1002.0** or later.
- **Core**, **Communication**, **Marketplace Vendor** and **Orders** modules, 3.1000.0 or later. Conversations, messages and communication users are stored by the Communication module; vendors, products, offers and seller orders come from Marketplace Vendor.
- **Admin Shell** module, for the operator's Vue UI. Without it, operators use the AngularJS admin.

## Permissions

| Permission | Allows |
|---|---|
| `seller:message:read` | See the Communication menu item, the widgets, conversations and messages; mark messages as read |
| `seller:message:send` | Send messages, start conversations |
| `seller:message:edit` | Edit own messages |
| `seller:message:delete` | Delete own messages |

The module adds these permissions to the marketplace roles on startup:

| Role | Permissions |
|---|---|
| Operator (`vcmp-operator-role`) | read, send, edit, delete |
| Vendor owner (`vcmp-owner-role`) | read, send, edit, delete |
| Vendor admin (`vcmp-admin-role`) | read, send |
| Vendor agent (`vcmp-agent-role`) | read, send |

A vendor user only ever works with its own vendor: the Marketplace Vendor module sets the vendor on every request. An operator works with all vendors.

## Settings

**Settings → Marketplace Communication → General**

| Setting | Default | Meaning |
|---|---|---|
| `MarketplaceCommunication.AttachmentCountLimit` | 5 | Maximum number of files attached to one message |
| `MarketplaceCommunication.AttachmentSizeLimit` | 10 | Maximum total size of a message's files, in MB |

## How it works

- **Who writes.** Each side writes as a communication user of the Communication module. A vendor writes as its organization. All operators write as one shared user, the operator group (the organization set as `OperatorGroupId` in the Marketplace Vendor options), so any operator can answer any vendor.
- **Conversations.** A conversation about an entity is found by the entity's id and type, and is created with the first message. A direct conversation is the one between the operator group and the vendor, created when either side opens it the first time.
- **Entity types.**

  | Entity | `entityType` |
  |---|---|
  | Vendor product | `VirtoCommerce.MarketplaceVendorModule.Core.Domains.SellerProduct` |
  | Offer | `VirtoCommerce.MarketplaceVendorModule.Core.Domains.Offer` |
  | Seller order | `VirtoCommerce.OrdersModule.Core.Model.CustomerOrder` |

- **Unread messages.** A message is unread until its recipient sees it in the conversation for 2 seconds.
- **Push notifications.** A new message sends a `MessagePushNotification` to the recipient. Administrators, and managers who are employees of the operator group, receive the operator group's notifications.
- **Data.** This module has no tables of its own: conversations, messages, recipients and reactions are stored by the Communication module. Attached files are uploaded to the asset storage, under `messenger/<entity type>/<entity id>/` (or `messenger/<conversation id>/` for a direct conversation).

## Web API

All endpoints require authentication and the permission shown. For a vendor user, the vendor is set by the server.

### Messages — `/api/vcmp/message`

| Method | Endpoint | Permission | What it does |
|---|---|---|---|
| `POST` | `/search` | read | Search the messages of a conversation (`conversationId`, or `entityId` + `entityType`), with paging and sorting; `unreadOnly` returns the vendor's unread messages |
| `GET` | `/getbyid?messageId=…` | read | Get one message |
| `GET` | `/thread?threadId=…` | read | Get a message with the chain of messages it replies to |
| `POST` | `/new` | send | Send a message; creates the entity's conversation if there is none yet |
| `POST` | `/update` | edit | Change a message's text and attachments |
| `DELETE` | `/` | delete | Delete messages (`messageIds` in the body) |
| `POST` | `/markread` | read | Mark a message as read (or unread, with `notRead`) for a recipient |
| `POST` | `/sendreaction` | read | Add a reaction to a message |
| `POST` | `/unreadcount` | read | Count a recipient's unread messages in an entity's conversation, or, without an entity, in the direct conversation with the vendor `sellerId` |

### Conversations — `/api/vcmp/conversation`

| Method | Endpoint | Permission | What it does |
|---|---|---|---|
| `POST` | `/search` | read | Search the conversations of communication users (`userIds`), or of a vendor (`sellerId`), by `keyword`, with paging; includes the last message and the unread count |
| `GET` | `/getbyid?conversationId=…` | read | Get one conversation |
| `GET` | `/getbyentity?entityId=…&entityType=…` | read | Get the conversation about an entity |
| `POST` | `/new` | send | Get or create a conversation of the given users (and vendor) |
| `POST` | `/update` | send | Save a conversation (the AngularJS admin uses it to rename a conversation and change its icon) |

### Communication users — `/api/vcmp/communicationuser`

| Method | Endpoint | Permission | What it does |
|---|---|---|---|
| `GET` | `/info?communicationUserIds=…` | read | Get communication users (name, avatar) |
| `GET` | `/operator` | read | Get the operator group's communication user |
| `GET` | `/getorcreate?userId=…&userType=…` | read | Get, or create, the communication user of a user or organization |
| `POST` | `/seller` | read | Get the communication user of the vendor that owns an entity (`entityId`, `entityType`) |

### Settings — `/api/vcmp/communication`

| Method | Endpoint | Permission | What it does |
|---|---|---|---|
| `GET` | `/settings` | read | Get the attachment limits |

## For developers

### Building and testing

```bash
dotnet build VirtoCommerce.MarketplaceCommunicationModule.sln
dotnet test tests/VirtoCommerce.MarketplaceCommunicationModule.Tests
```

`dotnet publish` (and `vc-build Compress`) also builds the Admin Shell plugin; see [The Vue UI](#the-vue-ui). Pass `-p:SkipAdminShellPlugin=true` to leave it out.

### Project layout

| Project | Contents |
|---|---|
| `VirtoCommerce.MarketplaceCommunicationModule.Core` | Constants (permissions, roles, settings, entity types), models, the push notification user id provider |
| `VirtoCommerce.MarketplaceCommunicationModule.Data` | MediatR commands and queries on top of the Communication module's services |
| `VirtoCommerce.MarketplaceCommunicationModule.Web` | Module entry point, API controllers, AngularJS UI (`Scripts`), Vue UI (`vcmp-communication`) |
| `tests/VirtoCommerce.MarketplaceCommunicationModule.Tests` | Unit tests |

### The Vue UI

The vendor portal and the Admin Shell use the **same Vue code**, in `src/VirtoCommerce.MarketplaceCommunicationModule.Web/vcmp-communication`. It is built twice: once as the vendor portal's plugin, where the seller writes, and once as the Admin Shell's plugin, where the operator writes.

```text
vcmp-communication/
├─ src/
│  ├─ modules/messenger/     Shared: the Communication list and messenger blades, message components,
│  │                         composables, locales. Also the vendor portal entry (index.ts) and its widget.
│  ├─ admin-shell/           Admin Shell entry (index.ts): the operator identity, widgets on the
│  │                         marketplace blades, menu (public/plugin.json)
│  └─ api_client/            Generated API client
├─ src/modules/vite.config.with-api.mts   Vendor portal build  → plugins/vendor-portal/
└─ vite.config.admin-shell.mts            Admin Shell build    → plugins/admin-shell/
```

| Command (in `vcmp-communication`) | Builds |
|---|---|
| `yarn build:modules-bundle` | The vendor portal plugin |
| `yarn build:admin-shell` | The Admin Shell plugin |
| `yarn type-check` | Type-checks both |

The Admin Shell code lives next to the vendor portal code, not in a separate `vue/` project like in other modules, because it reuses the messenger: vc-shell's build strips the styles of components outside the project, and a second project would load a second copy of Vue and the framework.

See [vcmp-communication/README.md](src/VirtoCommerce.MarketplaceCommunicationModule.Web/vcmp-communication/README.md) for how the shared code tells the two sides apart, and how to regenerate the API client.

## License

Copyright (c) Virto Solutions LTD.  All rights reserved.

Licensed under the Virto Commerce Open Software License (the "License"); you
may not use this file except in compliance with the License. You may
obtain a copy of the License at

<https://virtocommerce.com/open-source-license>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied.
