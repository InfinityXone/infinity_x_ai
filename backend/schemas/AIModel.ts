interface AIModel {
  id: number;
  name: string;
  type: 'Claude' | 'GPT-4' | 'Gemini';
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

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserModel {
  id: number;
  userId: number;
  modelId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SwitchHistory {
  id: number;
  userId: number;
  modelId: number;
  switchedAt: Date;
}

// Example SQL query to create the above schema
/*
CREATE TABLE AIModel (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL CHECK (type IN ('Claude', 'GPT-4', 'Gemini')),
  configuration TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ModelConfiguration (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES AIModel(id),
  configuration TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE UserModel (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES "User"(id),
  model_id INTEGER NOT NULL REFERENCES AIModel(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE SwitchHistory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES "User"(id),
  model_id INTEGER NOT NULL REFERENCES AIModel(id),
  switched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
*/