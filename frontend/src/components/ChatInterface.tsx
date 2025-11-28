import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import './ChatInterface.css';

/**
 * Real-time chat interface with message history, typing indicators, and user presence.
 *
 * @param {Object} props - Component properties
 * @param {string} props.username - The username of the current user
 * @param {string} props.userId - The ID of the current user
 * @param {Array} props.messages - The list of messages in the chat
 * @param {Array} props.users - The list of users in the chat
 * @param {function} props.onSendMessage - Callback for sending a message
 * @param {function} props.onTyping - Callback for typing indicator
 */
const ChatInterface: React.FC<{
  username: string;
  userId: string;
  messages: any[];
  users: any[];
  onSendMessage: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
}> = ({
  username,
  userId,
  messages,
  users,
  onSendMessage,
  onTyping,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollTop = messageRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      onTyping(true);
      setTimeout(() => {
        if (newMessage.trim() === '') {
          setIsTyping(false);
          onTyping(false);
        }
      }, 2000);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold">Chat Interface</h2>
        <span className="text-sm">{username}</span>
      </div>
      <div
        ref={messageRef}
        className="flex-1 overflow-y-scroll p-4"
      >
        {messages.map((message, index) => (
          <div key={index} className="mb-4">
            <span className="text-sm font-bold">{message.username}:</span>
            <span className="text-sm">{message.text}</span>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-200">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyUp={handleTyping}
          placeholder="Type a message..."
          className="w-full p-2 pl-10 text-sm text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 py-2 px-4 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-700"
        >
          Send
        </button>
      </div>
      {users.map((user, index) => (
        <div key={index} className="p-4 border-b border-gray-200">
          <span className="text-sm font-bold">{user.username}</span>
          <span className="text-sm">
            {user.presence === 'online' ? 'Online' : 'Offline'}
          </span>
          {user.typing && <span className="text-sm"> (Typing...)</span>}
        </div>
      ))}
    </div>
  );
};

export default ChatInterface;