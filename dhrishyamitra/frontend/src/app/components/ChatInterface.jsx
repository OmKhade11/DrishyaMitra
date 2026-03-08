import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { chatWithAssistant } from "../../services/drishyaApi";

const quickSuggestions = [
  "show me all photos",
  "show photos of person om",
  "what people are recognized?",
  "email these photos to omkhade1605@gmail.com",
];

export function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! Ask me to show all photos, find a person's photos, or email these photos.",
      photos: [],
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [lastPhotoIds, setLastPhotoIds] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      photos: [],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      const data = await chatWithAssistant(userMessage.content, { photo_ids: lastPhotoIds });
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.bot_response,
        photos: data.photos || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (Array.isArray(data.photos) && data.photos.length) {
        setLastPhotoIds(data.photos.map((p) => p.id));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I could not reach the backend. Please ensure Flask is running on 5000.",
          photos: [],
          timestamp: new Date(),
        },
      ]);
    }

    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[86%] rounded-2xl px-4 py-3 ${
                  message.role === "user" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">AI Assistant</span>
                  </div>
                )}

                <p className="text-sm">{message.content}</p>

                {message.photos?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {message.photos.slice(0, 6).map((photo) => (
                      <div key={photo.id} className="rounded overflow-hidden border bg-white">
                        <img src={photo.url} alt={photo.title} className="w-full h-20 object-cover" />
                        <p className="text-[11px] px-2 py-1 text-gray-700 truncate">{photo.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {showSuggestions && messages.length === 1 && (
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => setInputValue(suggestion)}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <span className="text-xs text-gray-500">AI is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-end gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about photos or say: email these photos to ..."
            className="flex-1"
          />

          <Button onClick={handleSend} disabled={!inputValue.trim()} className="bg-gradient-to-r from-purple-600 to-blue-600">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
