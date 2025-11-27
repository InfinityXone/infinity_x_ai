import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, Code, Zap, Github } from 'lucide-react';
import './styles/index.css';

function App() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsBuilding(true);

    try {
      const response = await fetch('http://localhost:3000/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: input }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || 'Feature built successfully!',
      }]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-purple-500/30 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold">Infinity Intelligence</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition">
              <Github className="w-5 h-5" />
            </button>
            <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition">
              <Code className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Bot className="w-20 h-20 mx-auto mb-6 text-purple-400" />
              <h2 className="text-4xl font-bold mb-4">Welcome to Infinity Intelligence</h2>
              <p className="text-xl text-gray-400 mb-8">
                AI-powered autonomous system builder. Describe anything, and I'll build it.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <h3 className="font-bold mb-2">🏗️ Build Features</h3>
                  <p className="text-sm text-gray-400">Full-stack features automatically</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <h3 className="font-bold mb-2">🤖 Multi-AI</h3>
                  <p className="text-sm text-gray-400">Claude + GPT + Gemini</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <h3 className="font-bold mb-2">🔗 GitHub Sync</h3>
                  <p className="text-sm text-gray-400">Auto-commit & deploy</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <div className="space-y-4 mb-6">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={\lex \\}
              >
                <div
                  className={\max-w-lg px-6 py-4 rounded-2xl \\}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {isBuilding && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="px-6 py-4 rounded-2xl bg-gray-800 border border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150" />
                    <span className="ml-2 text-gray-400">Building...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="sticky bottom-0 pb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Describe what you want to build..."
                className="flex-1 px-6 py-4 rounded-2xl bg-gray-800 border border-purple-500/30 focus:border-purple-500 outline-none"
                disabled={isBuilding}
              />
              <button
                onClick={sendMessage}
                disabled={isBuilding}
                className="px-6 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
