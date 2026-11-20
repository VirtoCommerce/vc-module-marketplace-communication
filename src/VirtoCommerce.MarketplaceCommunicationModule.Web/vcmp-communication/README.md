# Marketplace Communication — Vue UI

The vendor portal and the Admin Shell UIs of the [Marketplace Communication module](../../../README.md). One codebase, two builds:

| Build | Who writes | Entry | Command | Output |
|---|---|---|---|---|
| Vendor portal plugin | the vendor (seller) | `src/modules/index.ts` | `yarn build:modules-bundle` | `../plugins/vendor-portal/` |
| Admin Shell plugin | the marketplace operator | `src/admin-shell/index.ts` | `yarn build:admin-shell` | `../plugins/admin-shell/` |

The platform serves both from the module folder (`/modules/$(VirtoCommerce.MarketplaceCommunication)/plugins/<app>/`) and lists them in `GET /api/apps/<app>/manifest`.

## Layout

```text
src/
├─ modules/
│  ├─ index.ts                   Vendor portal entry
│  └─ messenger/                 Shared by both builds
│     ├─ pages/                  Blades: AllMessages (the Communication list), Messenger (one conversation)
│     ├─ components/             Message list, message, message form, attachments, quotes, ...
│     ├─ composables/            The messenger store, API wrappers, conversation list
│     ├─ notifications/          MessagePushNotification template
│     ├─ widgets/                The vendor portal's widget (ProductDetails, Offer, OrderDetails)
│     ├─ identity.ts             Who writes: seller or operator (see below)
│     ├─ locales/en.json
│     └─ index.ts                Vendor portal module: blades, widget, notification
├─ admin-shell/                  Admin Shell only
│  ├─ index.ts                   Entry: operator identity, blades, widgets, notification
│  ├─ widgets/                   Widgets on the marketplace blades
│  ├─ blade-stack.ts             Which blade a blade was opened from (for the order widget)
│  ├─ operator.ts                The operator's communication user, loaded once
│  ├─ constants.ts               Permissions, entity types, host blade names
│  ├─ locales/                   Admin Shell strings + the shared ones
│  ├─ styles.scss                Tailwind utilities only
│  └─ public/plugin.json         Menu contribution
├─ api_client/                   Generated API client (@vcmp-communication/api)
├─ main.ts, pages/, router/      Standalone app for local development (yarn serve)
└─ styles/                       The vendor portal's styles
vite.config.admin-shell.mts      Admin Shell build
admin-shell.html                 Admin Shell build input
src/modules/vite.config.with-api.mts   Vendor portal build
```

## How the shared code tells the sides apart

`src/modules/messenger/identity.ts` defines the **messenger identity**: the role (`seller` or `operator`), the vendor the portal works for, and the blade that shows each entity type.

- The **vendor portal** provides nothing: `useMessengerIdentity()` falls back to the seller, taken from the portal's `currentSeller`.
- The **Admin Shell** entry provides the operator identity on the app (`app.provide(messengerIdentityKey, …)`).

The messenger store then has `self` (who writes from this UI) and `counterpart` (the other side). Everything that depends on the side reads those instead of "seller" or "operator":

| | Vendor portal | Admin Shell |
|---|---|---|
| Sender of a new message | resolved by the server from the vendor | the operator group (`senderId`) |
| Recipient | the operator group | the entity's vendor, or the other user of a direct conversation |
| "My" messages (right side, editable) | the vendor's | the operator group's |
| Marked as read when seen | messages to the vendor | messages to the operator group |
| Conversation list | the vendor's (`sellerId`) | the operator group's (`userIds`) |
| Entity link in the messenger header | vendor portal blades | marketplace and Orders blades |

An incoming message arrives as a `MessagePushNotification`. The open conversation (`message-list.vue`) reloads its messages, the Communication list reloads its conversations, and the widgets reload their counts. Clicking the toast opens the message's conversation next to the Communication list and replaces any conversation open there. A workspace takes no `param`, so the toast opens the blades through the blade stack.

When you change the shared code, check both: `yarn type-check` covers both entries; build both.

## Admin Shell widgets

Registered in `src/admin-shell/index.ts` with `registerExternalWidget`. The host blades belong to the Marketplace Vendor module's Admin Shell plugin (and Orders' for the order) and share their entity through `defineBladeContext({ item })`.

| Widget | Host blade | Opens |
|---|---|---|
| `MarketplaceSellerCommunication` | `MarketplaceSellerDetails` | The direct conversation with the vendor (created on first open) |
| `MarketplaceProductCommunication` | `MarketplaceSellerProductDetails` | The vendor product's conversation |
| `MarketplaceOfferCommunication` | `MarketplaceOfferDetails` | The offer's conversation |
| `MarketplaceOrderCommunication` | `OrdersDetails`, only when opened from `MarketplaceOperatorOrders` (directly or further down) | The seller order's conversation; disabled on an order without a vendor |

Each widget shows the operator's unread count (`POST /api/vcmp/message/unreadcount` with `recipientId` = the operator group). The count refreshes on a `MessagePushNotification` and after the messenger marks messages read.

The platform broadcasts every push notification to all clients as well. The Admin Shell entry sets a broadcast filter so the operator gets toasts only for messages sent to the operator group, not for its own messages or other people's. The vendor portal does the same for the vendor in `src/pages/App.vue`. The filter is one slot for the whole Admin Shell, so it lets every other notification type through.

Past the first widgets of a blade, the Admin Shell moves the rest into the **More widgets** dropdown.

## Development

Use PowerShell or any shell; run yarn from this folder.

```bash
yarn install            # yarn 4 (corepack); the lockfile is committed and CI installs with --immutable
yarn type-check
yarn build:admin-shell  # or build:modules-bundle
```

The platform serves the plugins straight from `../plugins/`, so a running platform that loads the module from this repository picks up a new build after a browser refresh (no restart). `../plugins/` is not committed.

`dotnet publish` of the Web project runs `yarn install --immutable`, `yarn type-check` and `yarn build:admin-shell` (target `BuildAdminShellPlugin`) and copies `plugins/admin-shell` into the package. CI builds the vendor portal plugin in `.github/actions/build-communication-module`.

### Regenerating the API client

After changing a controller or a query/command model, restart the platform and run:

```bash
yarn generate-api-client --APP_PLATFORM_URL=https://localhost:5000/
```

Then:

- Keep `src/api_client/package.json` and `tsconfig.json` as committed (`git restore` them). The generator rewrites them to a `dist/` layout, which is not committed and breaks the build on a clean checkout.
- Run `yarn prettier --write src/api_client/virtocommerce.marketplacecommunication.ts`, so the diff shows only the API change.
- Recompile the committed JavaScript and typings: `yarn tsc -p src/api_client/tsconfig.json`.

If the generator stops with *"runtime … differs from the current process runtime"*, set `RUNTIME` to the runtime it names (for example `$env:RUNTIME="Net80"`), or remove it.

### Styles

Use scoped styles with the framework's CSS variables (`var(--neutrals-300)`, `var(--primary-500)`). The `tw-` Tailwind utility classes work in both builds; the Admin Shell build includes only Tailwind's utilities, because its base layer would reset the styles of the whole Admin Shell.
