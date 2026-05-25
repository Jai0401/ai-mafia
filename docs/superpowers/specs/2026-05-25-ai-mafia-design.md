# AI Mafia — Design Document

> A fully AI-driven social deduction game. Every player is an LLM agent. You observe, direct, or play alongside them.

---

## 1. Architecture & Tech Stack

**Stack:**
- Vite + React 18 + TypeScript
- Tailwind CSS for layout utilities + CSS custom properties for theming
- Framer Motion for all animations
- SVG for all character and room artwork (inline, themeable)
- Pure client-side — no backend. LLM calls via `fetch` to OpenRouter API (`openrouter/free`)
- Google Fonts: Playfair Display, Crimson Pro, Courier Prime

**Architecture: Monolithic React Context**
- Single `GameContext` with `useReducer` holds the full `GameState`
- `GameEngine` class orchestrates phase transitions, agent calls, action resolution
- Engine dispatches actions to the reducer; UI reads from context
- `AnimationBus` (event emitter) decouples engine logic from Framer Motion triggers

**File Structure:**
```
src/
├── components/
│   ├── GameMap/
│   │   ├── Room.tsx
│   │   ├── Character.tsx
│   │   └── SpeechBubble.tsx
│   ├── UI/
│   │   ├── PhaseBar.tsx
│   │   ├── PlayerList.tsx
│   │   ├── GameLog.tsx
│   │   └── VoteModal.tsx
│   ├── Lobby/
│   │   ├── ApiKeyInput.tsx
│   │   ├── ModeSelect.tsx
│   │   └── GameConfig.tsx
│   └── Game.tsx
├── engine/
│   ├── GameEngine.ts
│   ├── AgentRunner.ts
│   ├── ActionResolver.ts
│   ├── VoteCounter.ts
│   └── prompts.ts
├── context/
│   ├── GameContext.tsx
│   └── gameReducer.ts
├── types/
│   └── game.ts
├── data/
│   ├── personalities.ts
│   ├── names.ts
│   └── roomLayout.ts
├── hooks/
│   ├── useAnimation.ts
│   └── useGameLoop.ts
└── App.tsx
```

---

## 2. Game Rules

### Roles (6-player default)
| Role | Team | Count | Special Power |
|---|---|---|---|
| Mafia | Mafia | 2 | Vote to eliminate at night |
| Detective | Civilian | 1 | Investigate one player per night |
| Doctor | Civilian | 1 | Protect one player per night |
| Civilian | Civilian | 2 | No special power |

### Phase Structure
```
NIGHT PHASE (simultaneous, hidden)
  └─ Mafia chat → choose elimination target
  └─ Detective → chooses investigation target → receives role reveal
  └─ Doctor → chooses player to protect

DAY PHASE (public, sequential)
  └─ Announcement of night result (killed / saved)
  └─ Discussion round — each agent speaks once (1–3 sentences)
  └─ Accusation round — each agent nominates a suspect
  └─ Vote — majority vote eliminates a player
  └─ Eliminated player's role is revealed

WIN CONDITIONS
  └─ Civilian: all Mafia eliminated
  └─ Mafia: Mafia ≥ Civilians remaining
```

### Design Decisions (Resolved)
- **Memory truncation**: Last 20 events + full round 1 in each agent prompt
- **Tie votes**: Random elimination from tied players
- **Investigation awareness**: Mafia agent does NOT know they were investigated
- **Human vote weight**: Equal to AI agents (no extra weight)
- **Speech format**: 1–3 sentences per agent per discussion round, no back-and-forth

---

## 3. Game Engine & Agent System

### GameEngine
Plain TypeScript class that orchestrates:
- Phase transitions: lobby → night → day_discussion → day_vote → (repeat or game_over)
- Timer management with configurable speed (1x/2x/4x)
- Parallel night actions (Promise.all), sequential day actions (800ms delay between speeches)
- Win condition checks after each elimination

### Phase Flow
1. **Night**: `AgentRunner` fires parallel LLM calls for Mafia (pick target), Detective (pick investigate), Doctor (pick protect). `ActionResolver` resolves kill vs protect. Events logged.
2. **Day Discussion**: Characters walk to Dining Room. Sequential LLM calls with 800ms delay. Speech bubbles animate.
3. **Day Vote**: Characters walk to Parlour. Sequential LLM calls for votes. `VoteCounter` tallies. Ties → random elimination from tied players. Eliminated player's role revealed.
4. **Win Check**: After each elimination, check win conditions.

### AgentRunner
- Calls OpenRouter `/api/v1/chat/completions` with model `openrouter/free`
- Embraces randomness — each call may hit a different free model
- Each agent's prompt built from template + personality + memory + current game state
- `max_tokens: 150` for speech/vote calls
- Returns parsed JSON for structured outputs (votes, night actions), raw text for speech
- "Thinking..." indicator per character during API latency
- Retry logic: 2 retries with 1s delay for rate limits/failures

### Agent State
```typescript
interface AgentState {
  id: string;
  name: string;
  role: Role;
  personality: PersonalityProfile;
  memory: GameEvent[];           // truncated to last 20 + full round 1
  suspicions: Map<string, number>; // playerID → 0–1
  trust: Map<string, number>;
  privateNotes: string;          // accumulated reasoning scratchpad
}
```

### Personality Profiles (6)
| Profile | Behavior Bias |
|---|---|
| **Paranoid** | Suspects everyone, frequently changes vote. Higher base suspicion scores. |
| **Loyal** | Locks onto one suspect early, defends allies hard. |
| **Strategist** | Calm, methodical, tracks patterns across rounds. |
| **Deflector** | Deflects accusations with counter-accusations. |
| **Populist** | Bandwagons with the majority vote. Weights majority opinion higher. |
| **Bluffer** | Mafia role only — confidently claims Detective. |

Each profile provides:
- A description injected into every prompt
- A suspicion bias modifier (Paranoid starts higher)
- A vote tendency modifier (Populist weights majority higher)

### Suspicion Tracking
Each agent maintains `Map<playerId, suspicionScore>` (0–1). After each event, an "update suspicions" LLM call adjusts scores. This drives voting behavior and speech content.

### Prompt Templates

**Day Discussion:**
```
You are {name}, a {role} in a game of Mafia.
Your personality: {personality_description}
Your private suspicions: {suspicions_json}

Game history so far:
{memory_events}

It is the Day {round} discussion phase.
Speak naturally in 1–3 sentences. Express suspicion, defend yourself, or redirect.
Do NOT reveal your role directly.
Stay in character. Be specific — reference actual in-game events.
```

**Night Action (Mafia):**
```
You are {name}, a Mafia member. Your fellow Mafia: {mafia_ally}.
Civilian players: {civilian_list}
Game state: {memory_events}

Choose ONE player to eliminate tonight.
Respond with ONLY a JSON object: {"target": "player_name", "reasoning": "..."}
```

**Vote Decision:**
```
You are {name}. Based on everything said today, vote to eliminate one player.
Your suspicion scores: {suspicions_json}
Recent statements: {todays_speeches}

Respond with ONLY: {"vote": "player_name", "confidence": 0.0–1.0}
```

---

## 4. UI & Visual Design

### Aesthetic: Noir Isometric Dollhouse
- Top-down 2D with isometric depth cues
- Layered drop shadows for fake 3D depth
- ~15° CSS skew on furniture for isometric tilt
- Dark palette: deep navy, charcoal, warm amber, blood red accents
- Film grain overlay (SVG feTurbulence, 3% opacity)
- Vignette on room edges (radial-gradient)

### Design Tokens
```css
:root {
  --bg-deep:        #0d0f14;
  --bg-room:        #171b24;
  --bg-room-lit:    #1e2333;
  --accent-amber:   #e8a84c;
  --accent-red:     #c0392b;
  --accent-blue:    #4a90d9;
  --text-primary:   #e8e6df;
  --text-muted:     #7a7d8a;
  --shadow-depth:   rgba(0, 0, 0, 0.6);
  --glow-mafia:     rgba(192, 57, 43, 0.4);
  --glow-detective: rgba(74, 144, 217, 0.4);
  --font-display:   'Playfair Display', serif;
  --font-mono:      'Courier Prime', monospace;
  --font-body:      'Crimson Pro', serif;
}
```

### Layout
- **Top bar**: Phase indicator (🌙/☀️), round number, speed controls (1x/2x/4x), pause button
- **Left sidebar**: Player list — colored dot, name, role icon (if revealed), alive/dead status
- **Center**: Mansion map — 2×2 grid of rooms + center hallway
- **Bottom**: Game log — scrollable monospace ticker, color-coded events
- **Modal overlays**: Vote UI, investigation results, night actions, game over

### Map: "The Mansion" (single-screen, no camera pan)
```
┌──────────────────────────────────┐
│  LIBRARY      │   DINING ROOM    │
│  (night chat  │   (day discussion│
│   zone)       │    zone)         │
├───────────────┼──────────────────┤
│  STUDY        │   PARLOUR        │
│  (detective   │   (voting booth) │
│   den)        │                  │
└──────────────────────────────────┘
         CENTER HALLWAY
         (elimination stage)
```

Characters walk to the relevant room for each phase (lerp animation).

### Character Design
- Silhouette SVG figures with unique color-coded hat/accessory: Duck, Top hat, Bowler, Beret, Crown, Cap
- Glowing name badge below (text-shadow in character color)
- Speech bubble appears during discussion (auto-dismiss after 4s, queue if multiple)
- Alive: full opacity | Dead: grayscale + ghost shimmer + 50% opacity
- Mafia (revealed): red glow aura (box-shadow with --glow-mafia)
- Detective (investigating): blue glow aura

### Animations (Framer Motion)
| Event | Animation |
|---|---|
| Phase transition (Night) | Screen dims, moon rises, room lights flicker off |
| Phase transition (Day) | Sun rises, lights flicker on, brightness returns |
| Character walks to room | Lerp over 1.2s with bounce easing |
| Speech bubble appears | Scale 0→1 + fade in over 200ms |
| Vote cast | Target character shakes (translateX oscillation) |
| Elimination | Desaturate over 0.6s, float upward, become ghost silhouette |
| Mafia kill confirmed | Red radial particle burst (CSS animation), then fade |
| Detective result | Magnifying glass animation, role card flips in |
| Game over - Civilians win | Confetti, warm amber light wash |
| Game over - Mafia wins | Red vignette pulse, ominous glow |

---

## 5. Interaction Modes

### Mode 1: Spectator
- Full auto-play, no input required
- Speed controls: 1x/2x/4x
- Pause/resume at any point
- "Reveal all roles" toggle — shows Mafia red glow and role labels

### Mode 2: Human Player
- Select a role in lobby (or random assignment)
- **Opt in/out per phase**: Each phase shows a "Take Control" / "Auto Play" toggle
  - Take Control: you provide speech, vote, night action via UI
  - Auto Play: AI makes a fresh LLM call for your agent (same as other AI agents)
  - Switch freely at any time
- During discussion (Take Control): text input replaces LLM call. Your speech injected into other agents' memory
- During vote (Take Control): click player portrait in sidebar or on map
- Night actions (Take Control): click target for your role's action
- "Thinking..." indicator suppressed for your agent when you're in control

### Mode 3: Director
- All agents are AI
- Each round you may whisper to one agent (optional, skip rounds freely)
- "Whisper" button next to each alive agent in player list
- Opens text input → injected as: `A mysterious voice whispers to you: "{message}"`
- Whisper applies to that agent's next prompt only
- Post-game summary shows whisper influence on votes/accusations

### Mode Continuum
The three modes form a continuum. In lobby, you select a role (or spectator). Then you control your level of participation round by round via the Take Control / Auto Play toggle.

---

## 6. Game State

### Core Types
```typescript
type Phase = 'lobby' | 'night' | 'day_discussion' | 'day_vote' | 'game_over';
type Role = 'mafia' | 'detective' | 'doctor' | 'civilian';

interface Player {
  id: string;
  name: string;
  role: Role;
  personality: string;
  isAlive: boolean;
  isHuman: boolean;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
}

interface GameEvent {
  round: number;
  phase: Phase;
  type: 'speech' | 'vote' | 'elimination' | 'investigation' | 'protection' | 'system';
  actorId: string;
  targetId?: string;
  content: string;
  timestamp: number;
  isPublic: boolean;
}

interface GameState {
  phase: Phase;
  round: number;
  players: Player[];
  events: GameEvent[];
  nightActions: NightAction[];
  votes: Map<string, string>;       // voter → target
  winner: 'civilian' | 'mafia' | null;
  humanPlayerId?: string;
  humanMode?: 'spectator' | 'player' | 'director';
  speed: 1 | 2 | 4;
  isPaused: boolean;
  revealAllRoles: boolean;
  humanInControl: boolean;          // per-phase opt in/out
}
```

### Reducer Actions
```
Core:
  INIT_GAME           → Set players, roles, personalities, mode
  START_NIGHT         → phase → 'night', clear nightActions
  SUBMIT_NIGHT_ACTION → Add to nightActions array
  RESOLVE_NIGHT       → Process actions, log events, check kills/saves
  START_DISCUSSION    → phase → 'day_discussion'
  ADD_SPEECH          → Append speech event
  START_VOTE          → phase → 'day_vote'
  SUBMIT_VOTE         → Add vote
  RESOLVE_VOTE        → Tally, eliminate, reveal role, check win
  SET_PHASE           → Direct phase override
  UPDATE_SUSPICIONS   → Agent suspicion map update
  GAME_OVER           → Set winner, phase → 'game_over'
  TICK_ANIMATION      → Update character positions (lerp progress)

Human Input:
  HUMAN_SPEECH        → Replace agent's LLM speech with human text
  HUMAN_VOTE          → Set human's vote target
  HUMAN_NIGHT_ACTION  → Set human's night action target
  HUMAN_WHISPER       → Director whisper to an agent
  TOGGLE_HUMAN_CONTROL → Switch Take Control / Auto Play
```

---

## 7. API & LLM Integration

### OpenRouter Configuration
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Model: `openrouter/free` (random free model selection — embraced for variety)
- API key: entered via UI lobby screen, stored in-memory only (never persisted)
- Headers: `Authorization: Bearer {key}`, `HTTP-Referer: {app-url}`, `X-Title: AI Mafia`

### Call Patterns
- Night actions: parallel (`Promise.all`) — ~4 calls
- Day discussion: sequential with 800ms delay — ~6 calls
- Day vote: sequential — ~6 calls
- Suspicion updates: parallel after each phase — ~6 calls
- Total per round: ~22 LLM calls
- Tokens per call: ~500–2000 input + ~50–150 output

### Error Handling
- Retry: 2 retries with 1s exponential backoff
- Fallback: if all retries fail, agent uses last known suspicion scores to make a decision (no LLM needed)
- Rate limiting: queue concurrent calls with 200ms stagger to avoid burst

### Cost Management
- `max_tokens: 150` for all calls
- Memory truncated to last 20 events + round 1
- Suspicion update calls use abbreviated prompt (no full history)

---

## 8. Animation Spec

All animations via Framer Motion unless noted as CSS.

| Event | Animation | Duration |
|---|---|---|
| Phase transition (Night) | Screen overlay dims, moon icon rises from bottom, room box-shadows fade to dark | 1.5s |
| Phase transition (Day) | Overlay lifts, sun icon rises, room lights flicker on | 1.5s |
| Character walks to room | Lerp position with bounce easing | 1.2s |
| Speech bubble appears | Scale 0→1 + opacity 0→1 | 200ms |
| Speech bubble dismisses | Scale 1→0.8 + opacity 1→0 | 150ms |
| Vote cast | Target shakes (translateX ±4px, 3 oscillations) | 400ms |
| Elimination | Desaturate, opacity to 50%, float upward 20px | 600ms |
| Mafia kill confirmed | CSS red radial burst from target position | 800ms |
| Detective result | Magnifying glass scale in, role card flip | 1s |
| Game over - Civilians | Confetti particles + warm amber light wash | 3s |
| Game over - Mafia | Red vignette pulse (CSS animation) + glow intensify | 3s |
| Ghost shimmer | CSS keyframe: opacity oscillation 40%–60% | 2s loop |

---

## 9. Lobby Flow

1. **API Key Screen**: Input field for OpenRouter key. "Start" button validates key with a test call.
2. **Game Config**: Select mode (Spectator / Human Player / Director). If Human Player, select role preference (Random / Mafia / Detective / Doctor / Civilian).
3. **Launch**: Game initializes with 6 agents, random personality assignment, role distribution.

---

## 10. Scope

### Implemented Now (Everything)
- 6 AI agents, fixed roles (2 Mafia, 1 Detective, 1 Doctor, 2 Civilian)
- Full game loop: Night → Day discussion → Vote → repeat
- Spectator mode with speed controls and role reveal toggle
- Human player mode with per-phase opt in/out
- Director mode with whispering
- Single-screen mansion map with 4 rooms + center hallway
- LLM-powered speech, voting, and night actions via OpenRouter free route
- Game log
- Win condition detection
- All animations listed in Section 8
- Personality profiles driving agent behavior
- Suspicion tracking system
