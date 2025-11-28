import express, { Request, Response, NextFunction } from 'express';
import { validate } from 'joi';
import logger from '../logger';

const aiModelRouter = express.Router();

interface AiModelRequest {
  model: string;
}

const aiModelSchema = Joi.object({
  model: Joi.string().valid('claude', 'gpt-4', 'gemini').required(),
});

const models: { [key: string]: any } = {
  claude: { id: 1, name: 'Claude' },
  'gpt-4': { id: 2, name: 'GPT-4' },
  gemini: { id: 3, name: 'Gemini' },
};

aiModelRouter.get('/api/ai-models', async (req: Request, res: Response) => {
  try {
    const availableModels = Object.keys(models);
    return res.status(200).json({ availableModels });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

aiModelRouter.post('/api/ai-models', async (req: Request, res: Response) => {
  try {
    const { model } = req.body;
    const { error } = validate(req.body, aiModelSchema);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    if (!models[model]) {
      return res.status(404).json({ message: 'Model not found' });
    }
    // Switch to the selected model
    // NOTE: This is a placeholder, you should implement the actual model switching logic
    const selectedModel = models[model];
    return res.status(200).json({ message: `Switched to ${selectedModel.name}` });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default aiModelRouter;