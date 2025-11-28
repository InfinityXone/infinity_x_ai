interface User {
  id: number;
  username: string;
  email: string;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  users: User[];
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  conversation: Conversation;
  sender: User;
}

interface TypingIndicator {
  id: number;
  conversationId: number;
  userId: number;
  isTyping: boolean;
  createdAt: Date;
  updatedAt: Date;
  conversation: Conversation;
  user: User;
}

interface UserPresence {
  id: number;
  userId: number;
  conversationId: number;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  conversation: Conversation;
}