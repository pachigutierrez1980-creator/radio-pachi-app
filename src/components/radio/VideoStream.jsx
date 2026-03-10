import React, { useState, useRef } from "react";
import { Maximize2, Minimize2, Video, Settings, MonitorPlay } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VideoStream() {
  const DEFAULT_TWITCH = "https://www.twitch.tv/pachigutierrez";
  const [videoUrl, setVideoUrl] = useState(DEFAULT_TWITCH);
  const [showConfig, setShowConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(DEFAULT_TWITCH);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const applyUrl = () => {
    setVideoUrl(tempUrl);
    setShowConfig(false);
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    const twitchMatch = url.match(/twitch\.tv\/([^/\s]+)/);
    if (twitchMatch) return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}`;
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div ref={containerRef} className="glass-card rounded-2xl overflow-hidden neon-border">
      






















      {showConfig &&
      <div className="p-4 border-b border-zinc-800/50 bg-black/40">
          <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
            URL de video (YouTube, Twitch o transmisión OBS)
          </label>
          <div className="flex gap-2">
            <Input
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... o URL de stream"
            className="bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-600 text-sm" />

            <Button onClick={applyUrl} className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white px-6 border-0">
              Conectar
            </Button>
          </div>
        </div>
      }

      <div className="relative aspect-video bg-black">
        {embedUrl ? null :








        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Video className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-zinc-600 text-sm">Sin video conectado</p>
            <button
            onClick={() => setShowConfig(true)}
            className="text-violet-400 text-xs hover:text-blue-400 transition-colors underline">

              Configurar transmisión
            </button>
          </div>
        }
      </div>
    </div>);

}