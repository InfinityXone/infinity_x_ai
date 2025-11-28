import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Message, User } from './models';
import { validateMessage } from './validators';

const router = express.Router();

// In-memory storage for messages and users
const messages: Message[] = [];
const users: User[] = [];

// Typing indicators
const typingUsers: string[] = [];

// User presence
const onlineUsers: string[] = [];

// GET /api/messages
router.get('/api/messages', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userMessages = messages.filter((message) => message.userId === userId);
    return res.json(userMessages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/messages
router.post('/api/messages', async (req: Request, res: Response) => {
  try {
    const { text, userId } = req.body;
    if (!text || !userId) {
      return res.status(400).json({ error: 'Text and User ID are required' });
    }

    const isValid = validateMessage(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid message' });
    }

    const message: Message = {
      id: uuidv4(),
      text,
      userId,
      createdAt: new Date(),
    };

    messages.push(message);

    // Update user presence
    if (!onlineUsers.includes(userId)) {
      onlineUsers.push(userId);
    }

    return res.json(message);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/typing
router.post('/api/typing', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!typingUsers.includes(userId)) {
      typingUsers.push(userId);
    }

    return res.json({ message: 'Typing indicator updated' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/stop-typing
router.post('/api/stop-typing', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const index = typingUsers.indexOf(userId);
    if (index !== -1) {
      typingUsers.splice(index, 1);
    }

    return res.json({ message: 'Typing indicator updated' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/users
router.get('/api/users', async (req: Request, res: Response) => {
  try {
    return res.json(onlineUsers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});