// src/engine/AgentRunner.ts
import type { AgentState, GameEvent, Player, NightAction, AgentStateDiff } from "../types/game";
import {
  buildDiscussionPrompt,
  buildNightActionPrompt,
  buildVotePrompt,
} from './prompts';

function parseStateUpdates(raw: string, players: Player[]): AgentStateDiff | null {
  try {
    const parsed = JSON.parse(raw.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
    if (!parsed.state_updates) return null;

    const diff: AgentStateDiff = {};

    // Parse player belief updates
    if (parsed.state_updates.players) {
      diff.playerBeliefs = {};
      Object.entries(parsed.state_updates.players).forEach(([name, entry]: [string, any]) => {
        const player = players.find(p => p.name.toLowerCase() === name.toLowerCase())
          || players.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
        if (!player) return;

        diff.playerBeliefs![player.id] = {};
        if (typeof entry.suspicion === 'number') {
          diff.playerBeliefs![player.id].suspicion = Math.max(0, Math.min(1, entry.suspicion));
        }
        if (entry.suspectedRole && ['mafia', 'civilian', 'unknown'].includes(entry.suspectedRole)) {
          diff.playerBeliefs![player.id].suspectedRole = entry.suspectedRole;
        }
        if (typeof entry.reason === 'string') {
          diff.playerBeliefs![player.id].reason = entry.reason;
        }
      });
    }

    // Parse deductions
    if (Array.isArray(parsed.state_updates.deductions)) {
      diff.beliefs = { deductions: parsed.state_updates.deductions.filter((d: any) => typeof d === 'string') };
    }

    // Parse strategy
    if (typeof parsed.state_updates.strategy === 'string') {
      diff.beliefs = diff.beliefs || {};
      diff.beliefs.strategy = parsed.state_updates.strategy;
    }

    // Parse relationships
    if (parsed.state_updates.relationships) {
      const rel = parsed.state_updates.relationships;
      diff.beliefs = diff.beliefs || {};
      diff.beliefs.relationships = {
        allies: Array.isArray(rel.allies) ? rel.allies : [],
        enemies: Array.isArray(rel.enemies) ? rel.enemies : [],
      };
    }

    return diff;
  } catch {
    return null;
  }
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class AgentRunner {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async callLLM(prompt: string, maxTokens = 150): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'AI Mafia',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callLLMWithTimeout(prompt: string, maxTokens = 150, timeoutMs = 15000): Promise<string> {
    return Promise.race([
      this.callLLM(prompt, maxTokens),
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('LLM call timed out')), timeoutMs)
      ),
    ]);
  }

  private async callLLMWithRetry(prompt: string, maxTokens = 150, retries = 2): Promise<string> {
    for (let i = 0; i <= retries; i++) {
      try {
        return await this.callLLMWithTimeout(prompt, maxTokens);
      } catch (error) {
        if (i === retries) throw error;
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
    return '';
  }

  async getSpeech(
    agent: AgentState,
    round: number,
    events: GameEvent[],
    players: Player[],
    whisper?: string,
  ): Promise<string> {
    const prompt = buildDiscussionPrompt(agent, round, events, players, whisper);
    const response = await this.callLLMWithRetry(prompt, 150);

    try {
      const parsed = JSON.parse(response.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
      return parsed.speech || "I'm thinking...";
    } catch {
      // Fallback: extract first sentence as speech
      return response.split('.')[0]?.trim() || "I'm not sure what to think.";
    }
  }

  async getNightAction(
    agent: AgentState,
    action: 'mafia_kill' | 'detective_investigate' | 'doctor_protect',
    events: GameEvent[],
    players: Player[],
  ): Promise<NightAction> {
    const prompt = buildNightActionPrompt(agent, action, events, players);
    const response = await this.callLLMWithRetry(prompt, 150);

    try {
      const parsed = JSON.parse(response.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
      const targetName = parsed.target;
      if (!targetName || typeof targetName !== 'string') {
        throw new Error('No target field');
      }

      let targetPlayer = players.find((p) => p.name.toLowerCase() === targetName.toLowerCase());
      if (!targetPlayer) {
        targetPlayer = players.find((p) => p.name.toLowerCase().includes(targetName.toLowerCase()));
      }

      return {
        playerId: agent.id,
        action,
        targetId: targetPlayer?.id || players.filter((p) => p.isAlive && p.id !== agent.id)[0]?.id || '',
        reasoning: parsed.reasoning || '',
      };
    } catch {
      const aliveOthers = players.filter((p) => p.isAlive && p.id !== agent.id);
      return {
        playerId: agent.id,
        action,
        targetId: aliveOthers[Math.floor(Math.random() * aliveOthers.length)]?.id || '',
        reasoning: 'Random fallback.',
      };
    }
  }

  async getVote(
    agent: AgentState,
    events: GameEvent[],
    players: Player[],
  ): Promise<{ targetId: string; confidence: number; reasoning: string; stateUpdates: AgentStateDiff | null }> {
    const prompt = buildVotePrompt(agent, events, players);
    const response = await this.callLLMWithRetry(prompt, 150);

    try {
      const parsed = JSON.parse(response.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));

      if (parsed.vote?.toLowerCase() === 'abstain') {
        return {
          targetId: 'abstain',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
          reasoning: parsed.reasoning || 'Abstaining.',
          stateUpdates: parseStateUpdates(response, players),
        };
      }

      const voteName = parsed.vote || parsed.target || parsed.choice;
      if (!voteName || typeof voteName !== 'string') {
        throw new Error('No vote field');
      }

      let targetPlayer = players.find(p => p.name.toLowerCase() === voteName.toLowerCase());
      if (!targetPlayer) {
        targetPlayer = players.find(p => p.name.toLowerCase().includes(voteName.toLowerCase()));
      }

      return {
        targetId: targetPlayer?.id || '',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        reasoning: parsed.reasoning || 'Voting based on suspicion.',
        stateUpdates: parseStateUpdates(response, players),
      };
    } catch {
      // Fallback: most suspicious from current beliefs
      let mostSuspicious = '';
      let highestScore = -1;
      Object.entries(agent.beliefs.players).forEach(([id, entry]) => {
        if (entry.suspicion > highestScore) {
          highestScore = entry.suspicion;
          mostSuspicious = id;
        }
      });
      if (!mostSuspicious) {
        return { targetId: 'abstain', confidence: 0.3, reasoning: 'No suspicions yet.', stateUpdates: null };
      }
      return { targetId: mostSuspicious, confidence: 0.3, reasoning: 'Falling back to highest suspicion.', stateUpdates: null };
    }
  }
}
