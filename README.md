# AI Mafia

A fully AI-driven social deduction game where every player is an LLM agent. Watch AI agents play Mafia, play alongside them, or direct the action.

## Features

- **Spectator Mode**: Watch 6-12 AI agents play autonomously
- **Human Player Mode**: Take control of one agent and play
- **Director Mode**: Whisper secret instructions to AI agents each round
- **Voice Synthesis**: Characters speak their dialogue aloud using Web Speech API
- **Character Configuration**: Customize names, roles, personalities, colors, and hats before each game
- **Dynamic Gameplay**: AI agents with distinct personalities (Paranoid, Loyal, Strategist, Deflector, Populist, Bluffer)

## Tech Stack

- Vite + React 18 + TypeScript
- Tailwind CSS v4
- Framer Motion
- OpenRouter API (free models)

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5174` and enter your OpenRouter API key (free at [openrouter.ai/keys](https://openrouter.ai/keys)).

## How to Play

1. Enter your OpenRouter API key
2. Choose mode: Spectator, Human Player, or Director
3. Select player count (6, 8, or 10)
4. Configure characters (edit names, roles, personalities)
5. Start the game!

### Roles

- **Mafia** (2-3): Vote to eliminate one player each night
- **Detective** (1): Investigate one player per night to learn their role
- **Doctor** (1): Protect one player per night from elimination
- **Civilian** (2-5): No special powers, must deduce who the Mafia are

### Win Conditions

- **Civilians win** when all Mafia are eliminated
- **Mafia wins** when they equal or outnumber Civilians

## Architecture

```
src/
├── components/     # React UI components
│   ├── GameMap/    # Room, Character, SpeechBubble
│   ├── UI/         # PhaseBar, PlayerList, GameLog, VoteModal
│   └── Lobby/      # ApiKeyInput, ModeSelect, GameConfig, CharacterConfig
├── engine/         # Game logic
│   ├── GameEngine.ts      # Phase orchestration
│   ├── AgentRunner.ts     # LLM API calls
│   ├── ActionResolver.ts  # Night action resolution
│   ├── VoteCounter.ts     # Vote tallying
│   └── prompts.ts         # Prompt templates
├── context/        # React state management
├── types/          # TypeScript interfaces
├── data/           # Static data (personalities, names, rooms)
└── hooks/          # Custom React hooks
```

## License

MIT
