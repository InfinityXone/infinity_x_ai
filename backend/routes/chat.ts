```typescript
import { Router, Request, Response } from 'express';
import { Server as SocketIO } from 'socket.io';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

interface User {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface Message {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
}

interface TypingUser {
  userId: string;
  username: string;
  timestamp: Date;
}

interface ChatRoom {
  id: string;
  name: string;
  participants: User[];
  messages: Message[];
  typingUsers: Map<string, TypingUser>;
  createdAt: Date;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

const router = Router();

// In-memory storage (replace with database in production)
const chatRooms = new Map<string, ChatRoom>();
const userSessions = new Map<string, { socketId: string; roomId: string }>();

// Rate limiting
const chatRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many chat requests, please try again later.' }
});

/**
 * Validation middleware for chat operations
 */
const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters'),
  body('roomId')
    .isUUID()
    .withMessage('Room ID must be a valid UUID')
];

const validateRoom = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be between 1 and 100 characters')
];

const validateRoomParam = [
  param('roomId')
    .isUUID()
    .withMessage('Room ID must be a valid UUID')
];

const validateMessageHistory = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Authentication middleware
 */
const authenticate = async (req: AuthenticatedRequest, res: Response, next: Function): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Authentication token required' });
      return;
    }

    // Mock authentication - replace with actual JWT verification
    const user = { id: 'user123', username: 'testuser', avatar: 'avatar.jpg' };
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

/**
 * Initialize Socket.IO for real-time functionality
 */
export const setupSocketIO = (io: SocketIO): void => {
  io.on('connection', (socket) => {
    socket.on('join-room', async (data: { roomId: string; userId: string; username: string }) => {
      try {
        const { roomId, userId, username } = data;
        
        socket.join(roomId);
        userSessions.set(userId, { socketId: socket.id, roomId });

        const room = chatRooms.get(roomId);
        if (room) {
          // Update user presence
          const userIndex = room.participants.findIndex(u => u.id === userId);
          if (userIndex >= 0) {
            room.participants[userIndex].isOnline = true;
          } else {
            room.participants.push({
              id: userId,
              username,
              isOnline: true,
              lastSeen: new Date()
            });
          }

          // Broadcast user joined
          socket.to(roomId).emit('user-joined', {
            userId,
            username,
            timestamp: new Date()
          });

          // Send current online users
          socket.emit('online-users', room.participants.filter(u => u.isOnline));
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('send-message', async (data: { roomId: string; content: string; userId: string; username: string }) => {
      try {
        const { roomId, content, userId, username } = data;
        
        const room = chatRooms.get(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        const message: Message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          roomId,
          userId,
          username,
          content: content.trim(),
          timestamp: new Date()
        };

        room.messages.push(message);

        // Broadcast message to all users in room
        io.to(roomId).emit('new-message', message);

        // Clear typing indicator for this user
        room.typingUsers.delete(userId);
        socket.to(roomId).emit('user-stopped-typing', { userId, username });

      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (data: { roomId: string; userId: string; username: string }) => {
      try {
        const { roomId, userId, username } = data;
        
        const room = chatRooms.get(roomId);
        if (room) {
          room.typingUsers.set(userId, {
            userId,
            username,
            timestamp: new Date()
          });

          socket.to(roomId).emit('user-typing', { userId, username });

          // Clear typing indicator after 3 seconds
          setTimeout(() => {
            if (room.typingUsers.has(userId)) {
              room.typingUsers.delete(userId);
              socket.to(roomId).emit('user-stopped-typing', { userId, username });
            }
          }, 3000);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to update typing status' });
      }
    });

    socket.on('stop-typing', (data: { roomId: string; userId: string; username: string }) => {
      try {
        const { roomId, userId, username } = data;
        
        const room = chatRooms.get(roomId);
        if (room) {
          room.typingUsers.delete(userId);
          socket.to(roomId).emit('user-stopped-typing', { userId, username });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to update typing status' });
      }
    });

    socket.on('disconnect', () => {
      try {
        // Find user by socket ID and update presence
        for (const [userId, session] of userSessions.entries()) {
          if (session.socketId === socket.id) {
            const room = chatRooms.get(session.roomId);
            if (room) {
              const user = room.participants.find(u => u.id === userId);
              if (user) {
                user.isOnline = false;
                user.lastSeen = new Date();
                
                // Remove from typing users
                room.typingUsers.delete(userId);
                
                // Broadcast user left
                socket.to(session.roomId).emit('user-left', {
                  userId,
                  username: user.username,
                  timestamp: new Date()
                });
              }
            }
            userSessions.delete(userId);
            break;
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });
};

/**
 * @route POST /chat/rooms
 * @description Create a new chat room
 * @access Private
 */
router.post('/rooms', 
  chatRateLimit,
  authenticate,
  validateRoom,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name } = req.body;
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newRoom: ChatRoom = {
        id: roomId,
        name: name.trim(),
        participants: [],
        messages: [],
        typingUsers: new Map(),
        createdAt: new Date()
      };

      chatRooms.set(roomId, newRoom);

      res.status(201).json({
        success: true,
        data: {
          id: newRoom.id,
          name: newRoom.name,
          participantCount: 0,
          createdAt: newRoom.createdAt
        }
      });

    } catch (error) {
      console.error('Create room error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route GET /chat/rooms
 * @description Get all available chat rooms
 * @access Private
 */
router.get('/rooms',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const rooms = Array.from(chatRooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        participantCount: room.participants.length,
        onlineCount: room.participants.filter(u => u.isOnline).length,
        lastActivity: room.messages.length > 0 
          ? room.messages[room.messages.length - 1].timestamp 
          : room.createdAt,
        createdAt: room.createdAt
      }));

      res.json({
        success: true,
        data: rooms
      });

    } catch (error) {
      console.error('Get rooms error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route GET /chat/rooms/:roomId
 * @description Get chat room details with participants
 * @access Private
 */
router.get('/rooms/:roomId',
  authenticate,
  validateRoomParam,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { roomId } = req.params;
      const room = chatRooms.get(roomId);

      if (!room) {
        res.status(404).json({ error: 'Chat room not found' });
        return;
      }

      const roomData = {
        id: room.id,
        name: room.name,
        participants: room.participants.map(p => ({
          id: p.id,
          username: p.username,
          avatar: p.avatar,
          isOnline: p.isOnline,
          lastSeen: p.lastSeen
        })),
        participantCount: room.participants.length,
        onlineCount: room.participants.filter(u => u.isOnline).length,
        typingUsers: Array.from(room.typingUsers.values()),
        createdAt: room.createdAt
      };

      res.json({
        success: true,
        data: roomData
      });

    } catch (error) {
      console.error('Get room error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route GET /chat/rooms/:roomId/messages
 * @description Get message history for a chat room with pagination
 * @access Private
 */
router.get('/rooms/:roomId/messages',
  authenticate,
  validateRoomParam,
  validateMessageHistory,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { roomId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const room = chatRooms.get(roomId);

      if (!room) {
        res.status(404).json({ error: 'Chat room not found' });
        return;
      }

      const totalMessages = room.messages.length;
      const totalPages = Math.ceil(totalMessages / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + limit, totalMessages);

      // Get messages in reverse chronological order (newest first)
      const messages = room.messages
        .slice()
        .reverse()
        .slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            currentPage: page,
            totalPages,
            totalMessages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @route PUT /chat/messages/:messageId
 * @description Edit a message
 * @access Private
 */
router.put('/messages/:messageId',
  authenticate,
  [
    param('messageId').notEmpty().withMessage('Message ID is required'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message content must be between 1 and 1000 characters')
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user?.id;

      let messageFound = false;
      let roomId = '';

      // Find and update message across all rooms
      for (const [rId, room] of chatRooms.entries()) {
        const messageIndex = room.messages.findIndex(m => m.id === messageId);
        if (messageIndex >= 0) {
          const message = room.messages[messageIndex];
          
          // Check if user owns the message
          if (message.userId !== userId) {
            res.status(403).json({ error: 'You can only edit your own messages' });
            return;
          }