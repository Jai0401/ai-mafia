// src/engine/AgentRunner.ts
import type {  AgentState, GameEvent, Player, NightAction  } from "../types/game";
import {
  buildDiscussionPrompt,
  buildNightActionPrompt,
  buildVotePrompt,
} from './prompts';

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
    return response.replace(/"/g, '"').replace(/"/g, '"').trim();
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
      const targetPlayer = players.find((p) => p.name.toLowerCase() === parsed.target?.toLowerCase());

      return {
        playerId: agent.id,
        action,
        targetId: targetPlayer?.id || players.filter((p) => p.isAlive && p.id !== agent.id)[0]?.id || '',
        reasoning: parsed.reasoning || '',
      };
    } catch {
      // Fallback: random alive player
      const aliveOthers = players.filter((p) => p.isAlive && p.id !== agent.id);
      return {
        playerId: agent.id,
        action,
        targetId: aliveOthers[Math.floor(Math.random() * aliveOthers.length)]?.id || '',
        reasoning: 'Random fallback selection.',
      };
    }
  }

  async getVote(
    agent: AgentState,
    events: GameEvent[],
    players: Player[],
  ): Promise<{ targetId: string; confidence: number }> {
    const prompt = buildVotePrompt(agent, events, players);
    const response = await this.callLLMWithRetry(prompt, 100);

    try {
      const parsed = JSON.parse(response.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
      const targetPlayer = players.find((p) => p.name.toLowerCase() === parsed.vote?.toLowerCase());

      return {
        targetId: targetPlayer?.id || '',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      };
    } catch {
      // Fallback: vote for most suspicious player
      let mostSuspicious = '';
      let highestScore = -1;
      Object.entries(agent.suspicions).forEach(([id, score]) => {
        if (score > highestScore) {
          highestScore = score;
          mostSuspicious = id;
        }
      });
      return { targetId: mostSuspicious, confidence: 0.3 };
    }
  }

  async updateSuspicions(
    agent: AgentState,
    newEvents: GameEvent[],
    players: Player[],
  ): Promise<Record<string, number>> {
    const prompt = `You are ${agent.name}. Update your suspicion scores based on recent events.
Your current suspicions: ${JSON.stringify(agent.suspicions)}
Recent events: ${newEvents.map((e) => e.content).join('\n')}

Respond with ONLY a JSON object mapping player names to suspicion scores (0-1).
Example: {"Viktor": 0.8, "Luna": 0.2}`;

    const response = await this.callLLMWithRetry(prompt, 100);
    const newSuspicions = { ...agent.suspicions };

    try {
      const parsed = JSON.parse(response.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
      Object.entries(parsed).forEach(([name, score]) => {
        const player = players.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (player && typeof score === 'number') {
          newSuspicions[player.id] = Math.max(0, Math.min(1, score));
        }
      });
    } catch {
      // Keep existing suspicions if parsing fails
    }

    return newSuspicions;
  }
}
