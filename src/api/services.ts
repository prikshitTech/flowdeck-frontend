import { endpoints } from './endpoints';
import {
  deleteRequest,
  downloadRequest,
  getListRequest,
  getRequest,
  patchRequest,
  postRequest,
  uploadRequest
} from './http';
import { tokenStorage } from '@/utils/storage';
import type { CursorMeta, PageMeta, QueryParams } from '@/types/api';
import type {
  AppNotification,
  AuditEntry,
  AuthResult,
  BoardSnapshot,
  BoardSummary,
  Card,
  CardPriority,
  Channel,
  ChannelVisibility,
  FileAsset,
  Member,
  MemberActivity,
  Message,
  Page,
  PageDetail,
  PageTreeNode,
  Reaction,
  Revision,
  SearchHit,
  SessionInfo,
  StorageUsage,
  Suggestion,
  UnreadCount,
  User,
  WorkspaceDetail,
  WorkspaceOverview,
  WorkspaceRole,
  WorkspaceSummary
} from '@/types/models';

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    postRequest<AuthResult>(endpoints.auth.register, body),
  login: (body: { email: string; password: string }) => postRequest<AuthResult>(endpoints.auth.login, body),
  logout: () => postRequest<null>(endpoints.auth.logout, { refreshToken: tokenStorage.getRefreshToken() }),
  logoutAll: () => postRequest<{ revoked: number }>(endpoints.auth.logoutAll),
  me: () => getRequest<User>(endpoints.auth.me),
  updateProfile: (body: { name?: string; avatarUrl?: string }) => patchRequest<User>(endpoints.auth.me, body),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    postRequest<null>(endpoints.auth.changePassword, body),
  sessions: () => getRequest<SessionInfo[]>(endpoints.auth.sessions),
  revokeSession: (sessionId: string) => deleteRequest<null>(endpoints.auth.session(sessionId))
};

export interface SetupStatus {
  available: boolean;
  requiresKey: boolean;
}

export const adminApi = {
  setupStatus: () => getRequest<SetupStatus>(endpoints.admin.setup),
  createSuperAdmin: (body: { name: string; email: string; password: string; setupKey?: string }) =>
    postRequest<AuthResult>(endpoints.admin.setup, body)
};

export const workspaceApi = {
  list: (params?: QueryParams) => getListRequest<WorkspaceSummary>(endpoints.workspaces.root, params),
  create: (body: { name: string; description?: string }) =>
    postRequest<WorkspaceSummary>(endpoints.workspaces.root, body),
  detail: (workspaceId: string) => getRequest<WorkspaceDetail>(endpoints.workspaces.one(workspaceId)),
  update: (workspaceId: string, body: { name?: string; description?: string }) =>
    patchRequest<WorkspaceSummary>(endpoints.workspaces.one(workspaceId), body),
  archive: (workspaceId: string) => deleteRequest<WorkspaceSummary>(endpoints.workspaces.one(workspaceId)),
  members: (workspaceId: string, params?: QueryParams) =>
    getListRequest<Member>(endpoints.workspaces.members(workspaceId), params),
  addMember: (workspaceId: string, body: { email: string; role: WorkspaceRole }) =>
    postRequest<unknown>(endpoints.workspaces.members(workspaceId), body),
  updateMember: (workspaceId: string, memberId: string, role: WorkspaceRole) =>
    patchRequest<unknown>(endpoints.workspaces.member(workspaceId, memberId), { role }),
  removeMember: (workspaceId: string, memberId: string) =>
    deleteRequest<unknown>(endpoints.workspaces.member(workspaceId, memberId)),
  transfer: (workspaceId: string, memberId: string) =>
    postRequest<unknown>(endpoints.workspaces.transfer(workspaceId), { memberId }),
  leave: (workspaceId: string) => postRequest<unknown>(endpoints.workspaces.leave(workspaceId))
};

export const pageApi = {
  tree: (workspaceId: string) => getRequest<PageTreeNode[]>(endpoints.pages.tree(workspaceId)),
  detail: (workspaceId: string, pageId: string) => getRequest<PageDetail>(endpoints.pages.one(workspaceId, pageId)),
  create: (workspaceId: string, body: { title: string; parent?: string | null; body?: string }) =>
    postRequest<Page>(endpoints.pages.root(workspaceId), body),
  update: (workspaceId: string, pageId: string, body: { title?: string; body?: string }) =>
    patchRequest<Page>(endpoints.pages.one(workspaceId, pageId), body),
  archive: (workspaceId: string, pageId: string) =>
    deleteRequest<{ archived: number }>(endpoints.pages.one(workspaceId, pageId)),
  move: (workspaceId: string, pageId: string, parent: string | null) =>
    postRequest<Page>(endpoints.pages.move(workspaceId, pageId), { parent }),
  revisions: (workspaceId: string, pageId: string, params?: QueryParams) =>
    getListRequest<Revision>(endpoints.pages.revisions(workspaceId, pageId), params),
  restore: (workspaceId: string, pageId: string, version: number) =>
    postRequest<Page>(endpoints.pages.restore(workspaceId, pageId, version))
};

export interface CardInput {
  list?: string;
  title?: string;
  description?: string;
  priority?: CardPriority;
  labels?: string[];
  assignees?: string[];
  dueAt?: string | null;
  completed?: boolean;
}

export const boardApi = {
  list: (workspaceId: string, params?: QueryParams) =>
    getListRequest<BoardSummary>(endpoints.boards.root(workspaceId), params),
  create: (workspaceId: string, body: { name: string; description?: string }) =>
    postRequest<BoardSummary>(endpoints.boards.root(workspaceId), body),
  snapshot: (workspaceId: string, boardId: string) =>
    getRequest<BoardSnapshot>(endpoints.boards.one(workspaceId, boardId)),
  archive: (workspaceId: string, boardId: string) => deleteRequest<unknown>(endpoints.boards.one(workspaceId, boardId)),
  createList: (workspaceId: string, boardId: string, name: string) =>
    postRequest<{ id: string; name: string; position: number; cardLimit: number | null }>(
      endpoints.boards.lists(workspaceId, boardId),
      { name }
    ),
  archiveList: (workspaceId: string, boardId: string, listId: string) =>
    deleteRequest<unknown>(endpoints.boards.list(workspaceId, boardId, listId)),
  createCard: (workspaceId: string, boardId: string, body: CardInput & { list: string; title: string }) =>
    postRequest<Card>(endpoints.boards.cards(workspaceId, boardId), body),
  updateCard: (workspaceId: string, boardId: string, cardId: string, body: CardInput) =>
    patchRequest<Card>(endpoints.boards.card(workspaceId, boardId, cardId), body),
  moveCard: (workspaceId: string, boardId: string, cardId: string, body: { list: string; position: number }) =>
    postRequest<Card>(endpoints.boards.moveCard(workspaceId, boardId, cardId), body),
  archiveCard: (workspaceId: string, boardId: string, cardId: string) =>
    deleteRequest<unknown>(endpoints.boards.card(workspaceId, boardId, cardId))
};

export const channelApi = {
  list: (workspaceId: string, params?: QueryParams) =>
    getListRequest<Channel>(endpoints.channels.root(workspaceId), params),
  detail: (workspaceId: string, channelId: string) =>
    getRequest<Channel>(endpoints.channels.one(workspaceId, channelId)),
  create: (workspaceId: string, body: { name: string; topic?: string; visibility: ChannelVisibility }) =>
    postRequest<Channel>(endpoints.channels.root(workspaceId), body),
  join: (workspaceId: string, channelId: string) => postRequest<unknown>(endpoints.channels.join(workspaceId, channelId)),
  leave: (workspaceId: string, channelId: string) =>
    postRequest<unknown>(endpoints.channels.leave(workspaceId, channelId)),
  markRead: (workspaceId: string, channelId: string) =>
    postRequest<unknown>(endpoints.channels.read(workspaceId, channelId)),
  messages: (workspaceId: string, channelId: string, params?: QueryParams) =>
    getListRequest<Message, CursorMeta>(endpoints.channels.messages(workspaceId, channelId), params),
  send: (workspaceId: string, channelId: string, body: { body: string; parent?: string; mentions?: string[] }) =>
    postRequest<Message>(endpoints.channels.messages(workspaceId, channelId), body),
  edit: (workspaceId: string, channelId: string, messageId: string, body: string) =>
    patchRequest<Message>(endpoints.channels.message(workspaceId, channelId, messageId), { body }),
  remove: (workspaceId: string, channelId: string, messageId: string) =>
    deleteRequest<unknown>(endpoints.channels.message(workspaceId, channelId, messageId)),
  react: (workspaceId: string, channelId: string, messageId: string, emoji: Reaction) =>
    postRequest<Message>(endpoints.channels.reactions(workspaceId, channelId, messageId), { emoji })
};

export const fileApi = {
  list: (workspaceId: string, params?: QueryParams) =>
    getListRequest<FileAsset>(endpoints.files.root(workspaceId), params),
  usage: (workspaceId: string) => getRequest<StorageUsage>(endpoints.files.usage(workspaceId)),
  upload: (workspaceId: string, file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return uploadRequest<FileAsset>(endpoints.files.root(workspaceId), form, onProgress);
  },
  download: (workspaceId: string, fileId: string) => downloadRequest(endpoints.files.download(workspaceId, fileId)),
  remove: (workspaceId: string, fileId: string) => deleteRequest<unknown>(endpoints.files.one(workspaceId, fileId))
};

export const insightApi = {
  search: (workspaceId: string, params: QueryParams) =>
    getListRequest<SearchHit, PageMeta & { byKind: Record<string, number> }>(endpoints.search.root(workspaceId), params),
  suggest: (workspaceId: string, q: string) =>
    getRequest<Suggestion[]>(endpoints.search.suggestions(workspaceId), { q }),
  overview: (workspaceId: string, days = 30) =>
    getRequest<WorkspaceOverview>(endpoints.analytics.overview(workspaceId), { days }),
  memberActivity: (workspaceId: string, days = 30) =>
    getRequest<MemberActivity[]>(endpoints.analytics.members(workspaceId), { days })
};

export const auditApi = {
  list: (workspaceId: string, params?: QueryParams) =>
    getListRequest<AuditEntry>(endpoints.audit.root(workspaceId), params)
};

export const notificationApi = {
  list: (params?: QueryParams) => getListRequest<AppNotification>(endpoints.notifications.root, params),
  unread: () => getRequest<UnreadCount>(endpoints.notifications.unread),
  markRead: (notificationId: string) => patchRequest<AppNotification>(endpoints.notifications.read(notificationId)),
  markAllRead: () => postRequest<{ read: number }>(endpoints.notifications.readAll, {})
};
