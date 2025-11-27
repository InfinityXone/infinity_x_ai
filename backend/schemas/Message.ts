interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'direct' | 'group' | 'public' | 'private';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'emoji' | 'system';
  replyToId?: string;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatRoomMember {
  id: string;
  chatRoomId: string;
  userId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastReadMessageId?: string;
  lastReadAt?: Date;
}

interface TypingIndicator {
  id: string;
  chatRoomId: string;
  userId: string;
  isTyping: boolean;
  startedAt: Date;
  expiresAt: Date;
}

interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

interface UserPresence {
  id: string;
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastActivity: Date;
  socketId?: string;
  deviceInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

interface MessageRead {
  id: string;
  messageId: string;
  userId: string;
  readAt: Date;
}