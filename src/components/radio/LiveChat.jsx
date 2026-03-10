import React, { useState, useEffect, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const AVATAR_COLORS = ["#7c3aed", "#6d28d9", "#3b82f6", "#2563eb", "#8b5cf6", "#60a5fa", "#a78bfa"];

export default function LiveChat() {
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [userColor] = useState(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
  const chatEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["chatMessages"],
    queryFn: () => base44.entities.ChatMessage.list("-created_date", 50),
    refetchInterval: 3000,
  });

  const sortedMessages = [...messages].reverse();

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
      setMessage("");
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate({
      username,
      message: message.trim(),
      avatar_color: userColor,
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsJoined(true);
  };

  if (!isJoined) {
    return (
      <div className="glass-card rounded-2xl neon-border overflow-hidden">
        <div className="p-4 border-b border-zinc-800/50 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-violet-500" />
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Chat en Vivo</h3>
        </div>
        <div className="p-8 flex flex-col items-center justify-center">
          <p className="text-zinc-400 text-sm mb-4">Ingresá tu nombre para unirte al chat</p>
          <form onSubmit={handleJoin} className="flex gap-2 w-full max-w-xs">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre..."
              className="bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-600 text-sm"
              maxLength={20}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all"
            >
              Unirse
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl neon-border overflow-hidden flex flex-col" style={{ height: 400 }}>
      <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-violet-500" />
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Chat en Vivo</h3>
        </div>
        <span className="text-zinc-600 text-xs">{sortedMessages.length} mensajes</span>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedMessages.length === 0 && (
          <p className="text-zinc-600 text-sm text-center py-8">Nadie ha escrito aún. ¡Saludá!</p>
        )}
        {sortedMessages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
              style={{ backgroundColor: msg.avatar_color || "#7c3aed" }}
            >
              {msg.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-white text-xs font-semibold">{msg.username}</span>
                <span className="text-zinc-700 text-[10px]">
                  {msg.created_date ? format(new Date(msg.created_date), "HH:mm") : ""}
                </span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed break-words">{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800/50 flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribí un mensaje..."
          className="bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-600 text-sm flex-1"
          maxLength={300}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}