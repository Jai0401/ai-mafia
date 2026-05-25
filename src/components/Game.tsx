// src/components/Game.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useGameLoop } from '../hooks/useGameLoop';
import { GameEngine } from '../engine/GameEngine';
import type { Player } from '../types/game';
import PhaseBar from './UI/PhaseBar';
import PlayerList from './UI/PlayerList';
import GameLog from './UI/GameLog';
import VoteModal from './UI/VoteModal';
import Room from './GameMap/Room';
import Character from './GameMap/Character';
import { AnimatePresence, motion } from 'framer-motion';
import { rooms } from '../data/roomLayout';

interface Props {
  apiKey: string;
  preConfiguredPlayers?: Player[];
}

export default function Game({ apiKey, preConfiguredPlayers }: Props) {
  const { state, dispatch } = useGame();
  const engineRef = useRef<GameEngine | null>(null);
  const stateRef = useRef(state);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteAction, setVoteAction] = useState<'vote' | 'kill' | 'investigate' | 'protect'>('vote');
  const [showWhisperInput, setShowWhisperInput] = useState(false);
  const [whisperTarget, setWhisperTarget] = useState('');
  const [whisperText, setWhisperText] = useState('');
  const [speechText, setSpeechText] = useState('');
  const [activeSpeech, setActiveSpeech] = useState<{playerId: string; text: string} | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new GameEngine(dispatch, () => stateRef.current, apiKey);
      if (preConfiguredPlayers && preConfiguredPlayers.length > 0) {
        engineRef.current.initializeGameWithPlayers(preConfiguredPlayers, state.humanMode);
      } else {
        engineRef.current.initializeGame(state.humanMode, undefined);
      }
    }
    return () => { engineRef.current?.stop(); };
  }, [dispatch, apiKey, state.humanMode, preConfiguredPlayers]);

  useGameLoop();

  // Track speeches and announcements
  useEffect(() => {
    const lastEvent = state.events[state.events.length - 1];
    if (!lastEvent) return;

    if (lastEvent.type === 'speech') {
      setActiveSpeech({ playerId: lastEvent.actorId, text: lastEvent.content });
      speakCharacterText(lastEvent.content, lastEvent.actorId);
      const timer = setTimeout(() => setActiveSpeech(null), 6000);
      return () => clearTimeout(timer);
    } else if (['elimination', 'investigation', 'protection', 'system'].includes(lastEvent.type)) {
      // Speak system announcements with narrator voice
      speakNarratorText(lastEvent.content);
    }
  }, [state.events]);

  const speakCharacterText = useCallback((text: string, playerId: string) => {
    if (!window.speechSynthesis) return;
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8 + (player.name.charCodeAt(0) % 5) * 0.15;
    utterance.volume = 0.7;
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;
    window.speechSynthesis.speak(utterance);
  }, [state.players]);

  const speakNarratorText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.75; // Slower, more dramatic
    utterance.pitch = 0.5; // Deep narrator voice
    utterance.volume = 0.8;
    const voices = window.speechSynthesis.getVoices();
    const deepVoice = voices.find(v => v.lang.startsWith('en'));
    if (deepVoice) utterance.voice = deepVoice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleSpeedChange = useCallback((speed: 1 | 2 | 4) => {
    dispatch({ type: 'SET_SPEED', payload: speed });
  }, [dispatch]);

  const handlePauseToggle = useCallback(() => {
    dispatch({ type: 'TOGGLE_PAUSE' });
  }, [dispatch]);

  const handleHumanControlToggle = useCallback(() => {
    dispatch({ type: 'TOGGLE_HUMAN_CONTROL' });
  }, [dispatch]);

  const handleVoteSelect = (targetId: string) => {
    if (voteAction === 'vote') {
      dispatch({ type: 'HUMAN_VOTE', payload: { targetId } });
    } else {
      const humanPlayer = state.players.find((p) => p.id === state.humanPlayerId);
      if (humanPlayer) {
        dispatch({
          type: 'HUMAN_NIGHT_ACTION',
          payload: {
            playerId: humanPlayer.id,
            action: voteAction === 'kill' ? 'mafia_kill' : voteAction === 'investigate' ? 'detective_investigate' : 'doctor_protect',
            targetId,
          },
        });
      }
    }
    setShowVoteModal(false);
  };

  const handleSpeechSubmit = () => {
    if (speechText.trim()) {
      dispatch({ type: 'HUMAN_SPEECH', payload: { content: speechText.trim() } });
      setSpeechText('');
    }
  };

  const handleWhisperSubmit = () => {
    if (whisperText.trim() && whisperTarget) {
      dispatch({ type: 'HUMAN_WHISPER', payload: { targetId: whisperTarget, message: whisperText.trim() } });
      setWhisperText('');
      setShowWhisperInput(false);
      setWhisperTarget('');
    }
  };

  const isNight = state.phase === 'night';

  return (
    <div className="h-screen flex flex-col">
      <PhaseBar phase={state.phase} round={state.round} speed={state.speed} isPaused={state.isPaused} onSpeedChange={handleSpeedChange} onPauseToggle={handlePauseToggle} />

      <div className="flex-1 flex overflow-hidden">
        <PlayerList players={state.players} revealAllRoles={state.revealAllRoles} humanPlayerId={state.humanPlayerId} humanMode={state.humanMode} onWhisper={(id) => { setWhisperTarget(id); setShowWhisperInput(true); }} />

        <div className="flex-1 relative p-4">
          <AnimatePresence>
            {isNight && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="absolute inset-0 bg-blue-950/20 z-10 pointer-events-none" />
            )}
          </AnimatePresence>

          {/* Night actions indicator */}
          {isNight && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-bg-room/90 border border-accent-amber/30 rounded-lg px-6 py-3 text-center">
              <h3 className="font-display text-accent-amber text-sm mb-2">Night Actions in Progress</h3>
              <div className="flex gap-4 text-xs text-text-muted">
                {state.players.filter(p => p.isAlive && p.role === 'mafia').map(p => (
                  <span key={p.id} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-red" /> {p.name} choosing target...</span>
                ))}
                {state.players.filter(p => p.isAlive && p.role === 'detective').map(p => (
                  <span key={p.id} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-blue" /> {p.name} investigating...</span>
                ))}
                {state.players.filter(p => p.isAlive && p.role === 'doctor').map(p => (
                  <span key={p.id} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> {p.name} protecting...</span>
                ))}
              </div>
            </div>
          )}

          {/* Active speech bubble */}
          {activeSpeech && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg shadow-2xl"
            >
              <div className="bg-white text-bg-deep rounded-2xl overflow-hidden">
                {/* Speaker header */}
                <div 
                  className="px-4 py-2 flex items-center gap-2"
                  style={{ backgroundColor: state.players.find(p => p.id === activeSpeech.playerId)?.color + '20' }}
                >
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: state.players.find(p => p.id === activeSpeech.playerId)?.color }} 
                  />
                  <span className="font-display font-bold text-sm" style={{ color: state.players.find(p => p.id === activeSpeech.playerId)?.color }}>
                    {state.players.find(p => p.id === activeSpeech.playerId)?.name}
                  </span>
                  <span className="text-xs text-text-muted ml-auto">💬 Speaking</span>
                </div>
                {/* Speech text */}
                <div className="px-4 py-3">
                  <p className="font-body text-sm leading-relaxed text-bg-deep">{activeSpeech.text}</p>
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
            </motion.div>
          )}

          {rooms.map((room) => (
            <Room key={room.id} room={room} isLit={!isNight} />
          ))}

          {state.players.map((player) => (
            <Character
              key={player.id}
              player={player}
              isRevealed={state.revealAllRoles || !player.isAlive}
              isSpeaking={activeSpeech?.playerId === player.id}
              onClick={() => {
                if (state.humanInControl) {
                  if (state.phase === 'day_vote') { setVoteAction('vote'); setShowVoteModal(true); }
                  else if (state.phase === 'night' && player.id === state.humanPlayerId) {
                    const humanPlayer = state.players.find((p) => p.id === state.humanPlayerId);
                    if (humanPlayer?.role === 'mafia') setVoteAction('kill');
                    else if (humanPlayer?.role === 'detective') setVoteAction('investigate');
                    else if (humanPlayer?.role === 'doctor') setVoteAction('protect');
                    setShowVoteModal(true);
                  }
                }
              }}
            />
          ))}

          {state.phase === 'game_over' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`absolute inset-0 flex items-center justify-center z-20 ${state.winner === 'mafia' ? 'bg-red-900/60' : 'bg-amber-900/40'}`}>
              <div className="bg-bg-room rounded-lg border-2 border-accent-amber p-8 text-center">
                <h2 className="font-display text-3xl font-bold text-accent-amber mb-4">{state.winner === 'mafia' ? 'Mafia Wins!' : 'Civilians Win!'}</h2>
                <p className="text-text-muted mb-4">{state.winner === 'mafia' ? 'The Mafia has taken over the town.' : 'The town is safe... for now.'}</p>
                <button onClick={() => window.location.reload()} className="bg-accent-amber text-bg-deep font-display font-semibold px-6 py-2 rounded hover:bg-accent-amber/90 transition-colors">Play Again</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="h-48 p-4 pt-0 flex gap-4">
        <div className="flex-1"><GameLog events={state.events} players={state.players} /></div>
        {state.humanMode === 'player' && state.humanPlayerId && (
          <div className="w-64 bg-bg-room rounded-lg border border-text-muted/20 p-4 flex flex-col gap-2">
            <h3 className="font-display text-xs text-accent-amber uppercase tracking-wider">Your Turn</h3>
            <button onClick={handleHumanControlToggle} className={`py-2 px-3 rounded text-sm font-semibold transition-colors ${state.humanInControl ? 'bg-accent-amber text-bg-deep' : 'bg-bg-deep text-text-muted border border-text-muted/30'}`}>
              {state.humanInControl ? 'Take Control' : 'Auto Play'}
            </button>
            {state.humanInControl && state.phase === 'day_discussion' && (
              <div className="flex flex-col gap-2">
                <textarea value={speechText} onChange={(e) => setSpeechText(e.target.value)} placeholder="What do you want to say?" className="bg-bg-deep border border-text-muted/30 rounded p-2 text-sm text-text-primary resize-none h-16 focus:outline-none focus:border-accent-amber" />
                <button onClick={handleSpeechSubmit} className="bg-accent-amber text-bg-deep font-display text-sm font-semibold py-1 rounded hover:bg-accent-amber/90 transition-colors">Speak</button>
              </div>
            )}
          </div>
        )}
      </div>

      <VoteModal isOpen={showVoteModal} title={voteAction === 'vote' ? 'Vote to Eliminate' : voteAction === 'kill' ? 'Choose Target' : voteAction === 'investigate' ? 'Investigate Player' : 'Protect Player'} players={state.players} excludePlayerId={state.humanPlayerId} onSelect={handleVoteSelect} onCancel={() => setShowVoteModal(false)} actionType={voteAction} />

      {showWhisperInput && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-bg-room rounded-lg border border-accent-amber/50 p-6 max-w-md w-full mx-4">
            <h2 className="font-display text-xl text-text-primary mb-4">Whisper to {state.players.find((p) => p.id === whisperTarget)?.name}</h2>
            <textarea value={whisperText} onChange={(e) => setWhisperText(e.target.value)} placeholder="What do you want to whisper?" className="w-full bg-bg-deep border border-text-muted/30 rounded p-3 text-text-primary resize-none h-24 mb-4 focus:outline-none focus:border-accent-amber" />
            <div className="flex gap-3">
              <button onClick={() => setShowWhisperInput(false)} className="flex-1 py-2 rounded border border-text-muted/30 text-text-muted">Cancel</button>
              <button onClick={handleWhisperSubmit} className="flex-1 py-2 rounded bg-accent-amber text-bg-deep font-display font-semibold">Whisper</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
