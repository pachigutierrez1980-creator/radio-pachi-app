import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Wifi, WifiOff, Radio } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import AudioVisualizer from "./AudioVisualizer";

const songInfoCache = new Map();

const DEFAULT_STREAM_URL = "https://a6.asurahosting.com:7410/radio.mp3";
const NOWPLAYING_API = "https://a6.asurahosting.com/api/nowplaying/pachi_gutierrez_dj";

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState({ artist: "—", title: "Esperando señal...", art: null });
  const [nextTrack, setNextTrack] = useState(null);
  const [streamUrl, setStreamUrl] = useState(DEFAULT_STREAM_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(DEFAULT_STREAM_URL);
  const [songInfo, setSongInfo] = useState(null); // { year, description }
  const [loadingSongInfo, setLoadingSongInfo] = useState(false);
  const audioRef = useRef(null);
  const metadataInterval = useRef(null);
  const reconnectTimeout = useRef(null);
  const lastSongKey = useRef(null);

  const fetchSongInfo = useCallback(async (artist, title) => {
    const key = `${artist}|||${title}`.toLowerCase();
    if (lastSongKey.current === key) return;
    lastSongKey.current = key;

    if (songInfoCache.has(key)) {
      setSongInfo(songInfoCache.get(key));
      return;
    }

    setSongInfo(null);
    setLoadingSongInfo(true);

    try {
      // 1. MusicBrainz for release year
      const mbQuery = encodeURIComponent(`recording:"${title}" AND artist:"${artist}"`);
      const mbRes = await fetch(
        `https://musicbrainz.org/ws/2/recording/?query=${mbQuery}&limit=1&fmt=json`,
        { headers: { "User-Agent": "PachiGutierrezRadio/1.0 (radio@pachigutierrez.live)" } }
      );
      let year = null;
      if (mbRes.ok) {
        const mbData = await mbRes.json();
        const firstDate = mbData?.recordings?.[0]?.["first-release-date"] || mbData?.recordings?.[0]?.releases?.[0]?.date;
        if (firstDate) year = firstDate.substring(0, 4);
      }

      // 2. LLM for interesting fact
      const llmRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Give me ONE brief, interesting sentence (max 12 words) about the song "${title}" by ${artist}. Just the fact, no quotes, no artist/title repetition. If you don't know it, return an empty string.`,
        response_json_schema: { type: "object", properties: { description: { type: "string" } } }
      });
      const description = llmRes?.description || "";

      const info = { year, description: description.trim() };
      songInfoCache.set(key, info);
      setSongInfo(info);
    } catch {
      setSongInfo(null);
    }
    setLoadingSongInfo(false);
  }, []);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch(NOWPLAYING_API);
      if (res.ok) {
        const station = await res.json();
        const artist = station.now_playing?.song?.artist || "Artista desconocido";
        const title = station.now_playing?.song?.title || "Pista desconocida";
        setCurrentTrack({ artist, title, art: station.now_playing?.song?.art || null });
        setNextTrack(station.playing_next?.song || null);
        if (artist && title && artist !== "Artista desconocido") {
          fetchSongInfo(artist, title);
        }
      }
    } catch {
      // Silently fail
    }
  }, [fetchSongInfo]);

  useEffect(() => {
    // Always fetch metadata, even when not playing
    fetchNowPlaying();
    metadataInterval.current = setInterval(fetchNowPlaying, 10000);
    return () => {
      if (metadataInterval.current) clearInterval(metadataInterval.current);
    };
  }, [fetchNowPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      audio.src = "";
      setIsPlaying(false);
    } else {
      // iOS Safari requires load() before play() after setting src
      audio.src = streamUrl + "?t=" + Date.now(); // cache-bust para iOS
      audio.load();
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  };

  const handleStreamError = () => {
    if (isPlaying) {
      setIsPlaying(false);
      reconnectTimeout.current = setTimeout(() => {
        const audio = audioRef.current;
        if (audio) {
          audio.src = streamUrl;
          audio.load();
          audio.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }, 5000);
    }
  };

  const applyStreamUrl = () => {
    setStreamUrl(tempUrl);
    setShowSettings(false);
    if (isPlaying) {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = tempUrl;
        audio.load();
        audio.play().catch(() => {});
      }
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 neon-border relative overflow-hidden">
      <audio ref={audioRef} preload="none" playsInline onError={handleStreamError} />

      {/* Badge + Settings */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full pulse-on-air" />
              <span className="font-bold text-sm tracking-widest uppercase animate-[blink_2s_ease-in-out_infinite] text-red-500">EN VIVO</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-zinc-600 rounded-full" />
              <span className="text-zinc-500 font-medium text-sm tracking-widest uppercase">Fuera del Aire</span>
            </div>
          )}
        </div>

      </div>

      {/* Panel de configuración */}
      {showSettings && (
        <div className="mb-6 p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
          <label className="text-xs text-zinc-400 uppercase tracking-wider">URL de transmisión AzuraCast</label>
          <div className="flex gap-2">
            <Input
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://tu-estacion.com/radio/8000/stream"
              className="bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-600 text-sm"
            />
            <Button onClick={applyStreamUrl} className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white px-6 border-0">
              Conectar
            </Button>
          </div>
        </div>
      )}

      {/* Cover + Canción actual - centrado y grande */}
      <div className="flex flex-col items-center text-center mb-6">
        {currentTrack.art ? (
          <img
            src={currentTrack.art}
            alt="Portada"
            className="w-40 h-40 md:w-52 md:h-52 rounded-2xl object-cover shadow-[0_0_40px_rgba(124,58,237,0.3)] mb-4"
          />
        ) : (
          <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl bg-gradient-to-br from-violet-900/60 to-blue-900/60 border border-violet-800/30 flex items-center justify-center mb-4">
            <Radio className="w-16 h-16 text-violet-600/40" />
          </div>
        )}
        <h3 className="text-white font-bold text-xl md:text-2xl leading-tight">
          {currentTrack.title}
        </h3>
        <p className="text-blue-400 text-sm mt-1">{currentTrack.artist}</p>

        {/* Song info */}
        {loadingSongInfo ? (
          <p className="text-zinc-600 text-xs mt-2 animate-pulse">Buscando información...</p>
        ) : songInfo && (songInfo.year || songInfo.description) ? (
          <div className="mt-2 flex flex-col items-center gap-0.5">
            <p className="text-zinc-400 text-xs">
              {[songInfo.year, songInfo.description].filter(Boolean).join(" • ")}
            </p>
          </div>
        ) : null}

        {/* En cola */}
        {nextTrack && (
          <div className="mt-3 px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/50 flex items-center gap-2">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider font-semibold">En cola</span>
            <span className="text-zinc-400 text-xs">
              {nextTrack.title}{nextTrack.artist ? ` — ${nextTrack.artist}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Visualizador */}
      <div className="mb-6">
        <AudioVisualizer isPlaying={isPlaying} />
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-6">
        {/* Volumen */}
        <div className="flex items-center gap-2 flex-1 max-w-[140px]">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={(v) => { setVolume(v[0]); setIsMuted(false); }}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Botón reproducir */}
        <button
          onClick={togglePlay}
          className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isPlaying
              ? "bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:shadow-[0_0_40px_rgba(124,58,237,0.7)]"
              : "bg-zinc-800 border-2 border-violet-600/50 hover:bg-gradient-to-br hover:from-violet-600 hover:to-blue-600 hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
          }`}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 md:w-8 md:h-8 text-white" fill="white" />
          ) : (
            <Play className="w-7 h-7 md:w-8 md:h-8 text-white ml-1" fill="white" />
          )}
        </button>

        {/* Indicador de conexión */}
        <div className="flex items-center gap-2 flex-1 max-w-[140px] justify-end">
          {isPlaying ? (
            <div className="flex items-center gap-1.5 text-green-400 text-xs">
              <Wifi className="w-4 h-4" />
              <span>Conectado</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-600 text-xs">
              <WifiOff className="w-4 h-4" />
              <span>Desconectado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}