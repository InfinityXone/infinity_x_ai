import { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
}

interface TypingIndicator {
  userId: string;
  username: string;
  timestamp: Date;
}

interface WebSocketClient extends WebSocket {
  userId?: string;
  username?: string;
}

class ChatService {
  private messages: Message[] = [];
  private users: Map<string, User> = new Map();
  private typingUsers: Map<string, TypingIndicator> = new Map();
  private clients: Set<WebSocketClient> = new Set();

  addMessage(userId: string, username: string, content: string): Message {
    const message: Message = {
      id: uuidv4(),
      userId,
      username,
      content,
      timestamp: new Date()
    };
    this.messages.push(message);
    return message;
  }

  getMessages(limit: number = 50, offset: number = 0): Message[] {
    return this.messages
      .slice(-limit - offset, -offset || undefined)
      .reverse();
  }

  setUserOnline(userId: string, username: string): void {
    const user: User = {
      id: userId,
      username,
      isOnline: true,
      lastSeen: new Date()
    };
    this.users.set(userId, user);
  }

  setUserOffline(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
    }
  }

  getOnlineUsers(): User[] {
    return Array.from(this.users.values()).filter(user => user.isOnline);
  }

  setTyping(userId: string, username: string, isTyping: boolean): void {
    if (isTyping) {
      this.typingUsers.set(userId, {
        userId,
        username,
        timestamp: new Date()
      });
    } else {
      this.typingUsers.delete(userId);
    }
  }

  getTypingUsers(): TypingIndicator[] {
    const now = new Date();
    const validTyping = Array.from(this.typingUsers.values()).filter(
      indicator => now.getTime() - indicator.timestamp.getTime() < 5000
    );
    
    // Clean up expired typing indicators
    this.typingUsers.clear();
    validTyping.forEach(indicator => {
      this.typingUsers.set(indicator.userId, indicator);
    });

    return validTyping;
  }

  broadcast(data: any, excludeUserId?: string): void {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.userId !== excludeUserId) {
        client.send(message);
      }
    });
  }

  addClient(client: WebSocketClient): void {
    this.clients.add(client);
  }

  removeClient(client: WebSocketClient): void {
    this.clients.delete(client);
    if (client.userId) {
      this.setUserOffline(client.userId);
      this.setTyping(client.userId, client.username || '', false);
      this.broadcast({
        type: 'userOffline',
        userId: client.userId,
        onlineUsers: this.getOnlineUsers()
      });
    }
  }
}

const chatService = new ChatService();

// Validation middleware
export const validateGetMessages = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];

export const validatePostMessage = [
  body('content').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters'),
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('username').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Username must be between 1 and 50 characters')
];

export const validateTyping = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('username').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Username is required'),
  body('isTyping').isBoolean().withMessage('isTyping must be a boolean')
];

// GET /api/messages - Retrieve message history
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const messages = chatService.getMessages(limit, offset);
    const onlineUsers = chatService.getOnlineUsers();
    const typingUsers = chatService.getTypingUsers();

    res.status(200).json({
      success: true,
      data: {
        messages,
        onlineUsers,
        typingUsers,
        pagination: {
          limit,
          offset,
          total: messages.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// POST /api/messages - Send a new message
export const postMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { content, userId, username } = req.body;

    // Set user as online
    chatService.setUserOnline(userId, username);

    // Add message
    const message = chatService.addMessage(userId, username, content);

    // Clear typing indicator for this user
    chatService.setTyping(userId, username, false);

    // Broadcast new message to all clients
    chatService.broadcast({
      type: 'newMessage',
      message,
      onlineUsers: chatService.getOnlineUsers(),
      typingUsers: chatService.getTypingUsers()
    }, userId);

    res.status(201).json({
      success: true,
      data: {
        message,
        onlineUsers: chatService.getOnlineUsers()
      }
    });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// POST /api/messages/typing - Update typing indicator
export const updateTyping = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { userId, username, isTyping } = req.body;

    chatService.setTyping(userId, username, isTyping);

    // Broadcast typing status to all clients except sender
    chatService.broadcast({
      type: 'typingUpdate',
      typingUsers: chatService.getTypingUsers()
    }, userId);

    res.status(200).json({
      success: true,
      data: {
        typingUsers: chatService.getTypingUsers()
      }
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// WebSocket handler for real-time functionality
export const handleWebSocketConnection = (ws: WebSocketClient, req: any): void => {
  chatService.addClient(ws);

  ws.on('message', (data: string) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'authenticate':
          ws.userId = message.userId;
          ws.username = message.username;
          chatService.setUserOnline(message.userId, message.username);
          
          // Send current state to new client
          ws.send(JSON.stringify({
            type: 'authenticated',
            onlineUsers: chatService.getOnlineUsers(),
            typingUsers: chatService.getTypingUsers()
          }));

          // Broadcast user online status
          chatService.broadcast({
            type: 'userOnline',
            userId: message.userId,
            username: message.username,
            onlineUsers: chatService.getOnlineUsers()
          }, message.userId);
          break;

        case 'typing':
          if (ws.userId && ws.username) {
            chatService.setTyping(ws.userId, ws.username, message.isTyping);
            chatService.broadcast({
              type: 'typingUpdate',
              typingUsers: chatService.getTypingUsers()
            }, ws.userId);
          }
          break;

        case 'heartbeat':
          if (ws.userId) {
            chatService.setUserOnline(ws.userId, ws.username || '');
          }
          ws.send(JSON.stringify({ type: 'heartbeat' }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    chatService.removeClient(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    chatService.removeClient(ws);
  });
};

// Export the chat service for use in other modules
export { chatService };