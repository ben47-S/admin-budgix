/**
 * Types pour le système de discussions
 */

export type DiscussionStatus = "OPEN" | "CLOSED" | "ARCHIVED"
export type MessageSenderType = "USER" | "ADMIN"

export interface DiscussionUser {
  id: string
  username: string | null
  phone: string | null
  email: string | null
}

export interface Message {
  id: string
  discussionId: string
  senderId: string | null
  senderType: MessageSenderType
  content: string
  read: boolean
  createdAt: string
  updatedAt: string
}

export interface DiscussionListItemMessage {
  id: string
  content: string
  createdAt: string
  senderType: MessageSenderType
}

export interface DiscussionListItemMessage {
  id: string
  content: string
  createdAt: string
  senderType: MessageSenderType
}

export interface DiscussionListItem {
  id: string
  userId: string
  status: DiscussionStatus
  lastActivityAt: string
  createdAt: string
  updatedAt: string
  user: DiscussionUser
  messages: DiscussionListItemMessage[]
  _count: {
    messages: number
  }
}

export interface Discussion {
  id: string
  userId: string
  status: DiscussionStatus
  lastActivityAt: string
  createdAt: string
  updatedAt: string
  user: DiscussionUser
  messages: Message[]
}

// Types pour les événements WebSocket
export interface JoinDiscussionData {
  discussionId: string
}

export interface SendMessageData {
  discussionId: string
  content: string
}

export interface MarkAsReadData {
  discussionId: string
}

export interface NewMessageEvent {
  message: Message
}

export interface DiscussionUpdatedEvent {
  discussionId: string
  userId: string
  lastMessage: {
    content: string
    createdAt: string
  }
}

export interface MessagesReadEvent {
  discussionId: string
  readBy: string
}

export interface DiscussionJoinedEvent {
  discussionId: string
}

export interface SocketErrorEvent {
  message: string
}

