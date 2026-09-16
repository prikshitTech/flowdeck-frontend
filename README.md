# FlowDeck web

The browser client for [flowdeck-backend](https://github.com/prikshitTech/flowdeck-backend):
workspaces with nested pages, kanban boards and chat channels.

React 19, Vite, TypeScript, Redux Toolkit, React Hook Form, Tailwind CSS, Socket.io.

## Running it

Start the backend first (it listens on `http://localhost:4000`), then:

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:4000/api/v1` | REST base URL |
| `VITE_SOCKET_URL` | `http://localhost:4000` | Socket.io server |

The backend's `CORS_ORIGINS` must include `http://localhost:5173`.

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run typecheck` | Strict TypeScript check |
| `npm run build` | Type check, then production build with the service worker |
| `npm run preview` | Serve the production build locally |

## What is in it

| Screen | Route | Notes |
| --- | --- | --- |
| Sign in, register | `/login`, `/register` | React Hook Form + zod, live password rules |
| Workspaces | `/` | Create a workspace, switch between them in the sidebar |
| Overview | `/w/:id` | Stat tiles, messages per day, member activity |
| Pages | `/w/:id/pages/:pageId?` | Page tree, editor, move, archive, revision history and restore |
| Boards | `/w/:id/boards`, `/w/:id/boards/:boardId` | Drag and drop between lists, card details, list limits |
| Channels | `/w/:id/channels/:channelId?` | Chat with reactions, older messages load as you scroll up |
| Files | `/w/:id/files` | Upload with progress, download, storage usage |
| Search | `/w/:id/search` | Debounced search across pages, cards and messages, with suggestions |
| Members | `/w/:id/members` | Invite, change role, remove, transfer ownership, rename, archive |
| Audit log | `/w/:id/audit` | Admins only, filterable, infinite scroll |
| Notifications | `/notifications` | Mentions, assignments, due dates, mark read |
| Settings | `/settings` | Profile, password, active sessions, sign out everywhere |

## How it is put together

```
src/
  api/          axios client, request helpers, endpoint paths, one service object per resource
  store/        redux store and slices: auth, ui, workspaces, pages, boards, channels, notifications
  realtime/     socket connection, the bridge that turns server events into actions, room hook
  hooks/        useRequest, useInfiniteList, useInfiniteScroll, useDebounce, useNotify, ...
  components/
    ui/         Button, IconButton, Input, Select, Textarea, Modal, ConfirmDialog, Spinner, Badge, ...
    layout/     AppShell, Sidebar, Topbar, Logo
    common/     ErrorBoundary, route guards, OfflineBanner, ToastHost, LoadMoreSentinel
  features/     one folder per screen area
  types/        API envelope and model types
  utils/        formatting, validation rules, roles, storage, offline cache
```

### Calling the API

Screens never touch axios. `api/http.ts` has four helpers, one per verb, which unwrap the
backend's `{ success, message, data, meta }` envelope:

```ts
getRequest<T>(url, params)
postRequest<T>(url, body)
patchRequest<T>(url, body)
deleteRequest<T>(url)
```

plus `getListRequest` for paged lists and `uploadRequest` for files. `api/services.ts` builds
on those, so a call reads like `boardApi.moveCard(workspaceId, boardId, cardId, { list, position })`.

`api/client.ts` adds the bearer token to every request. When a request comes back 401, it
refreshes the token once and replays the request. If several requests fail at the same moment
they share the single refresh instead of each starting their own. If the refresh also fails,
the session ends and the app returns to sign in.

Writes check `navigator.onLine` first, so while offline you get a clear message instead of a
timeout.

### Optimistic updates

These changes show immediately and undo themselves if the server says no:

| Action | Where | How it rolls back |
| --- | --- | --- |
| Move a card | `boardSlice` | A copy of the board is kept while the request runs and restored on failure |
| Complete or archive a card | `boardSlice` | Same board copy |
| Send a message | `channelSlice` | Shown with a temporary id, swapped for the saved message or removed on failure |
| React to a message | `channelSlice` | The toggle is applied again on failure, which reverses it |
| Delete a message | `channelSlice` | The message and its position are kept and put back on failure |
| Rename a page | `pageSlice` | The old title is kept and restored on failure |
| Change a member role | `MembersScreen` | Previous role is written back on failure |
| Mark notifications read | `notificationSlice` | The read timestamp and unread count are reverted on failure |

When a message is sent, the realtime echo can arrive before the HTTP response. The slice
checks for that, so the message never shows twice.

### Infinite scroll

`useInfiniteScroll` puts an `IntersectionObserver` on a sentinel element.
`useInfiniteList` loads page after page, drops duplicates, and starts over when its key
changes, for example a new filter. Members, boards, files, audit log, notifications,
revisions and search all use this pair. Channels load older messages from the top using
the backend's cursor, and keep your scroll position so the view doesn't jump.

### Realtime

`RealtimeBridge` opens one socket once you are signed in and turns server events into Redux
actions:

- New messages, edits, deletes and reactions update the open channel.
- Card events refresh the open board, grouping bursts of events into a single refresh.
- Page edits refresh the page tree.
- A notification increments the unread badge and shows a toast.

`useRealtimeRoom` joins the workspace, channel or board room for the current screen, and
joins again automatically after a reconnect.

### Offline

`vite-plugin-pwa` precaches the app shell. API reads go network-first, with a four-second
timeout before falling back to the last good response. While offline, screens still show the
data they last loaded and a banner explains that changes are paused. The API cache is
deleted on sign out, when a session expires, and after signing out everywhere, so a
different account on the same machine never sees the previous user's data.

### Errors

There are two error boundaries. The root one catches anything that breaks the whole app. The
one inside the shell resets whenever the route changes, so a crash in one screen doesn't
leave the rest of the app unusable. Failed requests show a toast with the backend's message.
On registration, field errors from the backend are also attached to the matching inputs.

### Keeping renders cheap

- Row and item components are wrapped in `React.memo`, including cards, board columns,
  messages, tree items, member rows, files, notifications, search results and audit rows.
- Callbacks passed into those lists are created with `useCallback`, so the memo is not
  defeated by a new function on every render.
- Derived values use `useMemo`, for example the page parent options, role-filtered sidebar
  links, chart peak and suggestion links.
- Every screen is lazy loaded, so the first load only downloads sign in.
- Selectors pick the smallest slice of state they need.

### Design notes

A neutral stone palette with one teal accent, flat panels with borders instead of shadows,
and icons from Feather via `react-icons`. The only animation is the loading spinner. Dark
mode follows the system setting until you toggle it, and the choice is remembered. Every
layout collapses to one column on small screens, and the sidebar becomes a drawer.
