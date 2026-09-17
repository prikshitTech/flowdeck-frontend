const workspace = (workspaceId: string) => `/workspaces/${workspaceId}`;

export const endpoints = {
  admin: {
    setup: '/admin/setup'
  },
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    me: '/auth/me',
    changePassword: '/auth/change-password',
    sessions: '/auth/sessions',
    session: (sessionId: string) => `/auth/sessions/${sessionId}`
  },
  workspaces: {
    root: '/workspaces',
    one: workspace,
    members: (workspaceId: string) => `${workspace(workspaceId)}/members`,
    member: (workspaceId: string, memberId: string) => `${workspace(workspaceId)}/members/${memberId}`,
    transfer: (workspaceId: string) => `${workspace(workspaceId)}/transfer-ownership`,
    leave: (workspaceId: string) => `${workspace(workspaceId)}/leave`
  },
  pages: {
    root: (workspaceId: string) => `${workspace(workspaceId)}/pages`,
    tree: (workspaceId: string) => `${workspace(workspaceId)}/pages/tree`,
    one: (workspaceId: string, pageId: string) => `${workspace(workspaceId)}/pages/${pageId}`,
    move: (workspaceId: string, pageId: string) => `${workspace(workspaceId)}/pages/${pageId}/move`,
    revisions: (workspaceId: string, pageId: string) => `${workspace(workspaceId)}/pages/${pageId}/revisions`,
    restore: (workspaceId: string, pageId: string, version: number) =>
      `${workspace(workspaceId)}/pages/${pageId}/revisions/${version}/restore`
  },
  boards: {
    root: (workspaceId: string) => `${workspace(workspaceId)}/boards`,
    one: (workspaceId: string, boardId: string) => `${workspace(workspaceId)}/boards/${boardId}`,
    lists: (workspaceId: string, boardId: string) => `${workspace(workspaceId)}/boards/${boardId}/lists`,
    list: (workspaceId: string, boardId: string, listId: string) =>
      `${workspace(workspaceId)}/boards/${boardId}/lists/${listId}`,
    cards: (workspaceId: string, boardId: string) => `${workspace(workspaceId)}/boards/${boardId}/cards`,
    card: (workspaceId: string, boardId: string, cardId: string) =>
      `${workspace(workspaceId)}/boards/${boardId}/cards/${cardId}`,
    moveCard: (workspaceId: string, boardId: string, cardId: string) =>
      `${workspace(workspaceId)}/boards/${boardId}/cards/${cardId}/move`
  },
  channels: {
    root: (workspaceId: string) => `${workspace(workspaceId)}/channels`,
    one: (workspaceId: string, channelId: string) => `${workspace(workspaceId)}/channels/${channelId}`,
    join: (workspaceId: string, channelId: string) => `${workspace(workspaceId)}/channels/${channelId}/join`,
    leave: (workspaceId: string, channelId: string) => `${workspace(workspaceId)}/channels/${channelId}/leave`,
    read: (workspaceId: string, channelId: string) => `${workspace(workspaceId)}/channels/${channelId}/read`,
    messages: (workspaceId: string, channelId: string) => `${workspace(workspaceId)}/channels/${channelId}/messages`,
    message: (workspaceId: string, channelId: string, messageId: string) =>
      `${workspace(workspaceId)}/channels/${channelId}/messages/${messageId}`,
    reactions: (workspaceId: string, channelId: string, messageId: string) =>
      `${workspace(workspaceId)}/channels/${channelId}/messages/${messageId}/reactions`
  },
  files: {
    root: (workspaceId: string) => `${workspace(workspaceId)}/files`,
    usage: (workspaceId: string) => `${workspace(workspaceId)}/files/usage`,
    one: (workspaceId: string, fileId: string) => `${workspace(workspaceId)}/files/${fileId}`,
    download: (workspaceId: string, fileId: string) => `${workspace(workspaceId)}/files/${fileId}/download`
  },
  search: {
    root: (workspaceId: string) => `${workspace(workspaceId)}/search`,
    suggestions: (workspaceId: string) => `${workspace(workspaceId)}/search/suggestions`
  },
  analytics: {
    overview: (workspaceId: string) => `${workspace(workspaceId)}/analytics/overview`,
    members: (workspaceId: string) => `${workspace(workspaceId)}/analytics/members`
  },
  audit: {
    root: (workspaceId: string) => `${workspace(workspaceId)}/audit-logs`
  },
  notifications: {
    root: '/notifications',
    unread: '/notifications/unread-count',
    read: (notificationId: string) => `/notifications/${notificationId}/read`,
    readAll: '/notifications/read-all'
  }
};
