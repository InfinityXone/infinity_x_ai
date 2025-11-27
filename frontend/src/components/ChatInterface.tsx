import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, Circle } from 'lucide-react';

/**
 * Interface for a chat message
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
 * Interface for a user in the chat
 */
interface User {
  id: string;
  username: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

/**
 * Interface for typing indicator
 */
interface TypingUser {
  userId: string;
  username: string;
}

/**
 * Props for the ChatInterface component
 */
interface ChatInterfaceProps {
  /** Current user information */
  currentUser: User;
  /** List of messages in the chat */
  messages?: Message[];
  /** List of online users */
  onlineUsers?: User[];
  /** List of users currently typing */
  typingUsers?: TypingUser[];
  /** Callback fired when a message is sent */
  onSendMessage?: (content: string) => void;
  /** Callback fired when user starts/stops typing */
  onTypingChange?: (isTyping: boolean) => void;
  /** Maximum height of the chat container */
  maxHeight?: string;
  /** Whether to show user presence indicators */
  showPresence?: boolean;
}

/**
 * Real-time chat interface component with message history, typing indicators, and user presence
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUser,
  messages = [],
  onlineUsers = [],
  typingUsers = [],
  onSendMessage,
  onTypingChange,
  maxHeight = '500px',
  showPresence = true,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Scroll to the bottom of the messages container
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * Handle input change and typing indicators
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (!isTyping && value.trim()) {
      setIsTyping(true);
      onTypingChange?.(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingChange?.(false);
    }, 1000);
  }, [isTyping, onTypingChange]);

  /**
   * Handle message submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    onSendMessage?.(trimmedValue);
    setInputValue('');
    
    // Clear typing state
    setIsTyping(false);
    onTypingChange?.(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [inputValue, onSendMessage, onTypingChange]);

  /**
   * Handle key press events
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  /**
   * Format timestamp for display
   */
  const formatTimestamp = useCallback((date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  /**
   * Get status color for user presence
   */
  const getStatusColor = useCallback((status: User['status']): string => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'away': return 'text-yellow-500';
      case 'offline': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  }, []);

  /**
   * Render typing indicator
   */
  const renderTypingIndicator = useCallback(() => {
    if (typingUsers.length === 0) return null;

    const typingText = typingUsers.length === 1 
      ? `${typingUsers[0].username} is typing...`
      : typingUsers.length === 2
      ? `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
      : `${typingUsers.length} people are typing...`;

    return (
      <div className="px-4 py-2 text-sm text-gray-500 italic flex items-center space-x-1">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span>{typingText}</span>
      </div>
    );
  }, [typingUsers]);

  // Auto-scroll to bottom when new messages arrive
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

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
          {showPresence && (
            <span className="text-sm text-gray-500">
              {onlineUsers.filter(u => u.status === 'online').length} online
            </span>
          )}
        </div>
        
        {showPresence && (
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ maxHeight }}
          >
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
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
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    {message.type === 'text' && message.userId !== currentUser.id && (
                      <div className="text-xs font-medium mb-1 opacity-75">
                        {message.username}
                      </div>
                    )}
                    <div className="break-words">{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.userId === currentUser.id ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          {renderTypingIndicator()}

          {/* Message Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* User List Sidebar */}
        {showPresence && showUserList && (
          <div className="w-64 bg-gray-50 border-l border-gray-200">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Online Users ({onlineUsers.length})
              </h4>
              <div className="space-y-2">
                {onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Circle className={`w-3 h-3 fill-current ${getStatusColor(user.status)}`} />
                    <span className={`text-sm ${
                      user.id === currentUser.id ? 'font-medium' : ''
                    }`}>
                      {user.username}
                      {user.id === currentUser.id && ' (You)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;