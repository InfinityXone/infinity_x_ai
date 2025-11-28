import React, { useState } from 'react';
import { AiOutlineSwitcher } from 'react-icons/ai';

/**
 * ModelSwitcher component props type
 */
interface ModelSwitcherProps {
  /**
   * Initial selected model
   */
  initialModel: 'claude' | 'gpt-4' | 'gemini';
  /**
   * Model configuration callback
   */
  onModelChange: (model: 'claude' | 'gpt-4' | 'gemini') => void;
}

/**
 * ModelSwitcher component
 * @param props ModelSwitcherProps
 * @returns JSX.Element
 */
const ModelSwitcher: React.FC<ModelSwitcherProps> = ({ initialModel, onModelChange }) => {
  const [selectedModel, setSelectedModel] = useState(initialModel);

  const handleModelChange = (model: 'claude' | 'gpt-4' | 'gemini') => {
    setSelectedModel(model);
    onModelChange(model);
  };

  return (
    <div className="flex justify-center items-center mb-4">
      <label className="mr-2">Select Model:</label>
      <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
        <input
          type="radio"
          name="model"
          id="claude"
          value="claude"
          checked={selectedModel === 'claude'}
          onChange={() => handleModelChange('claude')}
          className="absolute block w-0 h-0 opacity-0"
        />
        <label
          htmlFor="claude"
          className={`${
            selectedModel === 'claude' ? 'bg-blue-500' : 'bg-gray-300'
          } w-4 h-4 rounded-full inline-block`}
        />
      </div>
      <span className="mr-4">Claude</span>
      <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
        <input
          type="radio"
          name="model"
          id="gpt-4"
          value="gpt-4"
          checked={selectedModel === 'gpt-4'}
          onChange={() => handleModelChange('gpt-4')}
          className="absolute block w-0 h-0 opacity-0"
        />
        <label
          htmlFor="gpt-4"
          className={`${
            selectedModel === 'gpt-4' ? 'bg-blue-500' : 'bg-gray-300'
          } w-4 h-4 rounded-full inline-block`}
        />
      </div>
      <span className="mr-4">GPT-4</span>
      <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
        <input
          type="radio"
          name="model"
          id="gemini"
          value="gemini"
          checked={selectedModel === 'gemini'}
          onChange={() => handleModelChange('gemini')}
          className="absolute block w-0 h-0 opacity-0"
        />
        <label
          htmlFor="gemini"
          className={`${
            selectedModel === 'gemini' ? 'bg-blue-500' : 'bg-gray-300'
          } w-4 h-4 rounded-full inline-block`}
        />
      </div>
      <span>Gemini</span>
      <AiOutlineSwitcher className="ml-2 text-lg" />
    </div>
  );
};

export default ModelSwitcher;