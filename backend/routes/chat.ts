import express, { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { validate } from 'joi';

/**
 * @typedef {Object} Message
 * @property {string} id - Unique message ID
 * @property {string} userId - User ID of the sender
 * @property {string} message - Message content
 * @property {Date} timestamp - Timestamp of the message
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique user ID
 * @property {string} username - Username
 * @property {boolean} online - User online status
 */

/**
 * @typedef {Object} ChatRequest
 * @property {string} userId - User ID of the sender
 * @property {string} message - Message content
 */

/**
 * @typedef {Object} ChatResponse
 * @property {Message[]} messages - Array of messages
 * @property {User[]} users - Array of users
 */

const chatRouter: Router = express.Router();

const messages: { [key: string]: Message } = {};
const users: { [key: string]: User } = {};
const typingUsers: { [key: string]: boolean } = {};

/**
 * @route POST /chat
 * @description Send a new message
 * @access Public
 */
chatRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const schema = Joi.object({
      userId: Joi.string().required(),
      message: Joi.string().required(),
    });
    const { error } = validate(req.body, schema);
    if (error) {
      return res.status(400).send({ message: 'Invalid request' });
    }

    const { userId, message } = req.body;
    const messageId = uuidv4();
    const timestamp = new Date();

    if (!users[userId]) {
      users[userId] = {
        id: userId,
        username: 'Unknown',
        online: true,
      };
    }

    messages[messageId] = {
      id: messageId,
      userId,
      message,
      timestamp,
    };

    return res.send({ message: 'Message sent successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

/**
 * @route GET /chat
 * @description Get all messages
 * @access Public
 */
chatRouter.get('/chat', async (req: Request, res: Response) => {
  try {
    const messagesArray = Object.values(messages);
    return res.send(messagesArray);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

/**
 * @route POST /chat/typing
 * @description Send typing indicator
 * @access Public
 */
chatRouter.post('/chat/typing', async (req: Request, res: Response) => {
  try {
    const schema = Joi.object({
      userId: Joi.string().required(),
      typing: Joi.boolean().required(),
    });
    const { error } = validate(req.body, schema);
    if (error) {
      return res.status(400).send({ message: 'Invalid request' });
    }

    const { userId, typing } = req.body;
    typingUsers[userId] = typing;

    return res.send({ message: 'Typing indicator sent successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

/**
 * @route GET /chat/typing
 * @description Get typing indicators
 * @access Public
 */
chatRouter.get('/chat/typing', async (req: Request, res: Response) => {
  try {
    const typingUsersArray = Object.keys(typingUsers).map((userId) => ({
      userId,
      typing: typingUsers[userId],
    }));
    return res.send(typingUsersArray);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

/**
 * @route POST /chat/presence
 * @description Update user presence
 * @access Public
 */
chatRouter.post('/chat/presence', async (req: Request, res: Response) => {
  try {
    const schema = Joi.object({
      userId: Joi.string().required(),
      online: Joi.boolean().required(),
    });
    const { error } = validate(req.body, schema);
    if (error) {
      return res.status(400).send({ message: 'Invalid request' });
    }

    const { userId, online } = req.body;
    if (users[userId]) {
      users[userId].online = online;
    }

    return res.send({ message: 'User presence updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

/**
 * @route GET /chat/presence
 * @description Get user presence
 * @access Public
 */
chatRouter.get('/chat/presence', async (req: Request, res: Response) => {
  try {
    const usersArray = Object.values(users);
    return res.send(usersArray);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Internal server error' });
  }
});

export default chatRouter;