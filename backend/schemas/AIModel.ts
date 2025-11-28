interface AIModel {
  id: number;
  name: string;
  modelType: 'Claude' | 'GPT-4' | 'Gemini';
  configuration: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ModelConfiguration {
  id: number;
  modelId: number;
  configuration: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserModel {
  id: number;
  name: string;
  email: string;
  preferredModel: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UserModelPreference {
  id: number;
  userId: number;
  modelId: number;
  preference: string;
  createdAt: Date;
  updatedAt: Date;
}