import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, Circle } from 'lucide-react';

/**
 * Message interface for chat messages
 */
interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
}

/**
 * User interface for chat participants
 */
interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
}

/**
 * Typing indicator interface
 */
interface TypingUser {
  userId: string;
  username: string;
  timestamp: Date;
}

/**
 * Props for the ChatInterface component
 */
interface ChatInterfaceProps {
  /** Current user information */
  currentUser: User;
  /** List of all chat participants */
  users: User[];
  /** Chat messages history */
  messages: Message[];
  /** Callback when a new message is sent */
  onSendMessage: (content: string) => void;
  /** Callback when user starts/stops typing */
  onTypingChange: (isTyping: boolean) => void;
  /** List of users currently typing */
  typingUsers: TypingUser[];
  /** Optional chat room title */
  roomTitle?: string;
  /** Maximum message length */
  maxMessageLength?: number;
}

/**
 * Real-time chat interface component with message history, typing indicators, and user presence
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUser,
  users,
  messages,
  onSendMessage,
  onTypingChange,
  typingUsers,
  roomTitle = 'Chat Room',
  maxMessageLength = 500
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * Handle typing indicator logic
   */
  const handleTypingChange = useCallback((typing: boolean) => {
    if (typing !== isTyping) {
      setIsTyping(typing);
      onTypingChange(typing);
    }
  }, [isTyping, onTypingChange]);

  /**
   * Handle input change with typing indicators
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value.length <= maxMessageLength) {
      setMessageInput(value);
      
      if (!isTyping && value.trim()) {
        handleTypingChange(true);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      if (value.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          handleTypingChange(false);
        }, 1000);
      } else {
        handleTypingChange(false);
      }
    }
  };

  /**
   * Handle message submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = messageInput.trim();
    
    if (trimmedMessage && trimmedMessage.length <= maxMessageLength) {
      onSendMessage(trimmedMessage);
      setMessageInput('');
      handleTypingChange(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  /**
   * Handle key press events
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  /**
   * Get typing indicator text
   */
  const getTypingText = () => {
    const filteredTyping = typingUsers.filter(user => user.userId !== currentUser.id);
    
    if (filteredTyping.length === 0) return '';
    if (filteredTyping.length === 1) return `${filteredTyping[0].username} is typing...`;
    if (filteredTyping.length === 2) return `${filteredTyping[0].username} and ${filteredTyping[1].username} are typing...`;
    return `${filteredTyping[0].username} and ${filteredTyping.length - 1} others are typing...`;
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const onlineUsers = users.filter(user => user.isOnline);
  const typingText = getTypingText();

  return (
    <div className="flex h-full max-h-screen bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{roomTitle}</h2>
            <p className="text-sm text-gray-500">
              {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{users.length}</span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.userId === currentUser.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'system'
                    ? 'bg-gray-100 text-gray-600 text-center text-sm'
                    : message.userId === currentUser.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {message.type !== 'system' && message.userId !== currentUser.id && (
                  <div className="text-xs font-medium mb-1 text-gray-600">
                    {message.username}
                  </div>
                )}
                <div className="break-words">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.userId === currentUser.id ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {typingText && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm">
                {typingText}
                <span className="ml-1 animate-pulse">●●●</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                maxLength={maxMessageLength}
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>{isTyping ? 'Typing...' : ''}</span>
                <span>
                  {messageInput.length}/{maxMessageLength}
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* User List Sidebar */}
      <div className="w-64 border-l border-gray-200 bg-gray-50">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Users ({users.length})
          </h3>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center space-x-2">
                <div className="relative">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <Circle
                    className={`w-3 h-3 absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white ${
                      user.isOnline ? 'text-green-500 fill-current' : 'text-gray-400 fill-current'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.username}
                    {user.id === currentUser.id && ' (You)'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.isOnline
                      ? 'Online'
                      : user.lastSeen
                      ? `Last seen ${formatTime(user.lastSeen)}`
                      : 'Offline'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;