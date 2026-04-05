import { useState, useRef, useEffect } from "react";
import { Send, Mic, Lightbulb, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useFloatChat } from "@/contexts/FloatChatContext";

interface ChatInterfaceProps {
  messages: any[];
  onSendMessage: (message: string) => void;
  onReceiveMessage: (message: any) => void;
}

export function ChatInterface({ messages, onSendMessage, onReceiveMessage }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { processChatMessage } = useFloatChat();

  const suggestions = [
    "Compare Arebian Sea and Bay of Bengal and show differences",
    "Show salinity profiles near the equator",
    "Compare BGC parameters in Arabian Sea",
    "Find ARGO floats active in last 7 days",
    "Temperature anomalies in Indian Ocean",
  ];

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage = inputValue.trim();
      onSendMessage(userMessage);
      setInputValue("");
      setIsLoading(true);

      try {
        await processChatMessage(userMessage);
      } catch (error) {
        console.error("Error processing message:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Voice input functionality would be implemented here
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
        <div className="space-y-4 min-h-full">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} chat-enter`}
            >
              <Card
                className={`max-w-[80%] p-3 ${
                  message.type === "user"
                    ? "bg-chat-user text-primary-foreground"
                    : "glass"
                } ocean-transition hover:scale-[1.02]`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                  <span className="text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-40 hover:opacity-80">
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-3 glass ocean-transition">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {inputValue === "" && (
        <ScrollArea className="p-4 border-t border-border/20 scrollbar-custom" style={{ maxHeight: 180 }}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Try asking:</span>
          </div>
          <div className="grid gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto p-2 glass ocean-transition hover:bio-glow"
                onClick={() => setInputValue(suggestion)}
              >
                <span className="text-xs">{suggestion}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border glass">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about ARGO ocean data..."
              className="bg-chat-input border-border/30 pr-12 ocean-transition focus:bio-glow"
            />
            <Button
              size="sm"
              variant="ghost"
              className={`absolute right-1 top-1 h-8 w-8 p-0 ocean-transition ${
                isListening ? "text-destructive animate-pulse" : "text-muted-foreground"
              }`}
              onClick={handleVoiceInput}
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            onClick={handleSend} 
            disabled={!inputValue.trim() || isLoading}
            className="ocean-transition hover:bio-glow"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}