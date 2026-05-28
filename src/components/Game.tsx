// src/components/Game.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useGameLoop } from '../hooks/useGameLoop';
import { GameEngine } from '../engine/GameEngine';
import type { Player, HumanMode } from '../types/game';
import PhaseBar from './UI/PhaseBar';
import PlayerList from './UI/PlayerList';
import GameLog from './UI/GameLog';
import VoteModal from './UI/VoteModal';
import Room from './GameMap/Room';
import Character from './GameMap/Character';
import CurtainTransition from './GameMap/CurtainTransition';
import { motion } from 'framer-motion';
import { rooms, phaseToRoom } from '../data/roomLayout';

interface Props {
  apiKey: string;
  humanMode: HumanMode;
  rolePreference?: string;
  preConfiguredPlayers?: Player[];
}

export default function Game({ apiKey, humanMode, rolePreference, preConfiguredPlayers }: Props) {
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

  // Curtain transition state
  const [showCurtain, setShowCurtain] = useState(false);
  const prevPhaseRef = useRef(state.phase);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Detect phase changes and trigger curtain transition
  useEffect(() => {
    const prev = prevPhaseRef.current;
    const curr = state.phase;

    // Skip curtain on initial load (lobby -> night) and game_over
    if (prev !== curr && prev !== 'lobby' && curr !== 'game_over' && curr !== 'lobby') {
      setShowCurtain(true);
      const timer = setTimeout(() => setShowCurtain(false), 1800);
      return () => clearTimeout(timer);
    }

    prevPhaseRef.current = curr;
  }, [state.phase]);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new GameEngine(dispatch, () => stateRef.current, apiKey);
      if (preConfiguredPlayers && preConfiguredPlayers.length > 0) {
        engineRef.current.initializeGameWithPlayers(preConfiguredPlayers, humanMode, rolePreference);
      } else {
        engineRef.current.initializeGame(humanMode, rolePreference);
      }
    }
    return () => { engineRef.current?.stop(); };
  }, [dispatch, apiKey, humanMode, rolePreference, preConfiguredPlayers]);

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
    utterance.rate = 0.75;
    utterance.pitch = 0.5;
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
      engineRef.current?.setWhisper(whisperTarget, whisperText.trim());
      setWhisperText('');
      setShowWhisperInput(false);
      setWhisperTarget('');
    }
  };

  const activeRoomId = phaseToRoom[state.phase] || 'dining';
  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];
  const isNight = state.phase === 'night';

  return (
    <div className="h-screen flex flex-col bg-[#131313] font-pixel">
      <PhaseBar phase={state.phase} round={state.round} speed={state.speed} isPaused={state.isPaused} onSpeedChange={handleSpeedChange} onPauseToggle={handlePauseToggle} />

      <div className="flex-1 flex overflow-hidden">
        <PlayerList players={state.players} revealAllRoles={state.revealAllRoles} humanPlayerId={state.humanPlayerId} humanMode={humanMode} onWhisper={(id) => { setWhisperTarget(id); setShowWhisperInput(true); }} />

        <div className="flex-1 relative">
          {/* Single active room — full screen */}
          <Room room={activeRoom} isLit={!isNight}>
            {/* Night actions indicator */}
            {isNight && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#1b1b1b]/90 border border-[#e8a84c]/30 px-6 py-3 text-center">
                <h3 className="text-[#e8a84c] text-xs mb-2 uppercase tracking-widest font-bold">Night Actions in Progress</h3>
                <div className="flex gap-4 text-[10px] text-[#7a7d8a]">
                  {state.players.filter(p => p.isAlive && p.role === 'mafia').map(p => (
                    <span key={p.id} className="flex items-center gap-1"><span className="w-2 h-2 bg-[#c0392b]" /> {p.name} choosing...</span>
                  ))}
                  {state.players.filter(p => p.isAlive && p.role === 'detective').map(p => (
                    <span key={p.id} className="flex items-center gap-1"><span className="w-2 h-2 bg-[#4a90d9]" /> {p.name} investigating...</span>
                  ))}
                  {state.players.filter(p => p.isAlive && p.role === 'doctor').map(p => (
                    <span key={p.id} className="flex items-center gap-1"><span className="w-2 h-2 bg-[#43e17a]" /> {p.name} protecting...</span>
                  ))}
                </div>
              </div>
            )}

            {/* Voting indicator */}
            {state.phase === 'day_vote' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#1b1b1b]/90 border border-[#e8a84c]/30 px-6 py-3 text-center">
                <h3 className="text-[#e8a84c] text-xs mb-2 uppercase tracking-widest font-bold">☐ Voting in Progress</h3>
                <div className="flex gap-3 text-[10px] text-[#7a7d8a] flex-wrap justify-center">
                  {state.players.filter(p => p.isAlive).map(p => {
                    const hasVoted = state.votes[p.id] !== undefined;
                    return (
                      <span key={p.id} className={`flex items-center gap-1 transition-colors ${hasVoted ? 'text-[#43e17a]' : 'text-[#7a7d8a]'}`}>
                        <span className={`w-2 h-2 ${hasVoted ? 'bg-[#43e17a]' : 'bg-[#7a7d8a]/40 animate-pulse'}`} />
                        {p.name} {hasVoted ? '✓' : '...'}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active speech bubble */}
            {activeSpeech && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]"
              >
                <div className="bg-[#1b1b1b] border-2 border-white overflow-hidden">
                  <div
                    className="px-4 py-2 flex items-center gap-2 border-b border-[#353535]"
                    style={{ backgroundColor: state.players.find(p => p.id === activeSpeech.playerId)?.color + '20' }}
                  >
                    <div className="w-6 h-6">
                        <img
                        src={state.players.find(p => p.id === activeSpeech.playerId)?.avatar}
                        alt=""
                        className="w-full h-full object-contain pixelated"
                      />
                    </div>
                    <span className="font-bold text-sm" style={{ color: state.players.find(p => p.id === activeSpeech.playerId)?.color }}>
                      {state.players.find(p => p.id === activeSpeech.playerId)?.name}
                    </span>
                    <span className="text-[10px] text-[#7a7d8a] ml-auto uppercase tracking-wider">💬 Speaking</span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm leading-relaxed text-[#e2e2e2]">{activeSpeech.text}</p>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
              </motion.div>
            )}

            {/* Characters */}
            {state.players.map((player) => (
              <Character
                key={player.id}
                player={player}
                isRevealed={state.revealAllRoles || !player.isAlive}
                isSpeaking={activeSpeech?.playerId === player.id}
                isThinking={state.phase === 'day_vote' && player.isAlive && state.votes[player.id] === undefined}
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
          </Room>

          {/* Curtain transition overlay */}
          <CurtainTransition
            isOpen={showCurtain}
            roomName={activeRoom.name}
            roomIcon={activeRoom.icon}
            roomDescription={activeRoom.description}
            roomColor={activeRoom.color}
          />

          {/* Game over overlay */}
          {state.phase === 'game_over' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`absolute inset-0 flex items-center justify-center z-20 ${state.winner === 'mafia' ? 'bg-[#c0392b]/30' : 'bg-[#e8a84c]/20'}`}>
              <div className="bg-[#1b1b1b] border-2 border-[#e8a84c] p-8 text-center max-w-md">
                <h2 className="text-3xl font-bold text-[#e8a84c] mb-4 uppercase tracking-tighter">{state.winner === 'mafia' ? 'Mafia Wins!' : 'Civilians Win!'}</h2>
                <p className="text-[#7a7d8a] mb-6 text-sm">{state.winner === 'mafia' ? 'The Mafia has taken over the town.' : 'The town is safe... for now.'}</p>
                <button onClick={() => window.location.reload()} className="bg-[#e8a84c] text-[#131313] font-bold px-6 py-2 hover:bg-[#e8a84c]/90 transition-colors uppercase text-xs tracking-wider">Play Again</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="h-48 p-3 pt-0 flex gap-3">
        <div className="flex-1"><GameLog events={state.events} players={state.players} /></div>
        {humanMode === 'player' && state.humanPlayerId && (
          <div className="w-64 bg-[#1b1b1b] border border-[#353535] p-3 flex flex-col gap-2">
            <h3 className="text-[10px] text-[#e8a84c] uppercase tracking-widest font-bold">Your Turn</h3>
            <button onClick={handleHumanControlToggle} className={`py-2 px-3 text-xs font-bold transition-colors border ${state.humanInControl ? 'bg-[#e8a84c] text-[#131313] border-[#e8a84c]' : 'bg-[#131313] text-[#7a7d8a] border-[#353535]'}`}>
              {state.humanInControl ? 'Take Control' : 'Auto Play'}
            </button>
            {state.humanInControl && state.phase === 'day_discussion' && (
              <div className="flex flex-col gap-2">
                <textarea value={speechText} onChange={(e) => setSpeechText(e.target.value)} placeholder="What do you want to say?" className="bg-[#131313] border border-[#353535] p-2 text-xs text-[#e2e2e2] resize-none h-16 focus:outline-none focus:border-[#e8a84c]" />
                <button onClick={handleSpeechSubmit} className="bg-[#e8a84c] text-[#131313] text-xs font-bold py-1 hover:bg-[#e8a84c]/90 transition-colors uppercase tracking-wider">Speak</button>
              </div>
            )}
          </div>
        )}
      </div>

      <VoteModal isOpen={showVoteModal} title={voteAction === 'vote' ? 'Vote to Eliminate' : voteAction === 'kill' ? 'Choose Target' : voteAction === 'investigate' ? 'Investigate Player' : 'Protect Player'} players={state.players} excludePlayerId={state.humanPlayerId} onSelect={handleVoteSelect} onCancel={() => setShowVoteModal(false)} actionType={voteAction} />

      {showWhisperInput && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1b1b1b] border-2 border-[#e8a84c] p-6 max-w-md w-full mx-4">
            <h2 className="text-lg text-[#e2e2e2] mb-4 uppercase tracking-tighter font-bold">Whisper to {state.players.find((p) => p.id === whisperTarget)?.name}</h2>
            <textarea value={whisperText} onChange={(e) => setWhisperText(e.target.value)} placeholder="What do you want to whisper?" className="w-full bg-[#131313] border border-[#353535] p-3 text-[#e2e2e2] resize-none h-24 mb-4 focus:outline-none focus:border-[#e8a84c]" />
            <div className="flex gap-3">
              <button onClick={() => setShowWhisperInput(false)} className="flex-1 py-2 border border-[#353535] text-[#7a7d8a] hover:text-[#e2e2e2] transition-colors text-xs uppercase font-bold">Cancel</button>
              <button onClick={handleWhisperSubmit} className="flex-1 py-2 bg-[#e8a84c] text-[#131313] font-bold text-xs uppercase hover:bg-[#e8a84c]/90 transition-colors">Whisper</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
