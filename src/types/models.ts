export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';
export type CardPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ChannelVisibility = 'public' | 'private';
export type Reaction = 'like' | 'celebrate' | 'eyes' | 'thanks' | 'fire' | 'question';
export type SearchKind = 'page' | 'card' | 'message';

export interface Person {
  id?: string;
  _id?: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionInfo {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  memberCount: number;
  role: WorkspaceRole;
  joinedAt: string;
  updatedAt: string;
}

export interface WorkspaceDetail extends WorkspaceSummary {
  owner: Person;
  createdAt: string;
}

export interface Member {
  id: string;
  role: WorkspaceRole;
  joinedAt: string;
  lastSeenAt: string | null;
  user: { id: string; name: string; email: string; avatarUrl: string | null; status: string };
}

export interface PageTreeNode {
  id: string;
  parent: string | null;
  title: string;
  icon: string | null;
  position: number;
  depth: number;
  children: PageTreeNode[];
}

export interface Page {
  id: string;
  title: string;
  body: string;
  icon: string | null;
  parent: string | null;
  version: number;
  updatedAt: string;
}

export interface PageDetail extends Page {
  createdBy: Person;
  updatedBy: Person | null;
  breadcrumb: { id: string; title: string }[];
}

export interface Revision {
  id: string;
  version: number;
  title: string;
  createdAt: string;
  editedBy: string | null;
}

export interface BoardSummary {
  id: string;
  name: string;
  description: string;
  colour: string;
  updatedAt: string;
  cardCount: number;
  completedCount: number;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  priority: CardPriority;
  labels: string[];
  assignees: string[];
  dueAt: string | null;
  completedAt: string | null;
  list?: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  position: number;
  cardLimit: number | null;
  cards: Card[];
}

export interface BoardSnapshot {
  id: string;
  name: string;
  description: string;
  colour: string;
  updatedAt: string;
  lists: BoardColumn[];
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  topic: string;
  visibility: ChannelVisibility;
  memberCount: number;
  messageCount: number;
  lastMessageAt: string | null;
  joined: boolean;
  lastReadAt?: string | null;
  unread?: number;
}

export interface MessageReaction {
  emoji: Reaction;
  users: string[];
}

export interface Message {
  id: string;
  channel: string;
  body: string;
  author: Person;
  parent: string | null;
  replyCount: number;
  mentions: string[];
  reactions: MessageReaction[];
  editedAt: string | null;
  createdAt: string;
  pending?: boolean;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  workspace: string;
  actor: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCount {
  total: number;
  byWorkspace: { workspace: string; count: number }[];
}

export interface FileAsset {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: { id: string; name: string } | string;
  deduplicated?: boolean;
}

export interface StorageUsage {
  totalBytes: number;
  totalFiles: number;
  byType: { mimeType: string; bytes: number; count: number }[];
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ip: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
}

export interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  snippet: string;
  parentId: string | null;
  updatedAt: string;
}

export interface Suggestion {
  id: string;
  kind: 'page' | 'board' | 'channel';
  label: string;
}

export interface DayCount {
  day: string;
  count: number;
}

export interface WorkspaceOverview {
  since: string;
  pages: { total: number; created: DayCount[] };
  cards: {
    open: number;
    completed: number;
    overdue: number;
    averageCycleHours: number;
    byPriority: { priority: CardPriority; count: number }[];
  };
  messages: { total: number; perDay: DayCount[] };
  membersByRole: { role: WorkspaceRole; count: number }[];
}

export interface MemberActivity {
  user: { id: string; name: string; email: string };
  role: WorkspaceRole;
  messages: number;
  pageEdits: number;
  cardsCompleted: number;
  activityScore: number;
}
