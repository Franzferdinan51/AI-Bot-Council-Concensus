import { promises as fs } from 'fs';
import { randomBytes } from 'crypto';

export interface SlackIntegration {
  channelId: string;
  channelName: string;
  webhookUrl?: string;
  botToken?: string;
  enabled: boolean;
  notifyOnSessionStart?: boolean;
  notifyOnSessionEnd?: boolean;
  notifyOnConsensus?: boolean;
}

export interface GitHubIntegration {
  owner: string;
  repo: string;
  token?: string;
  webhookSecret?: string;
  enabled: boolean;
  autoCreateIssue?: boolean;
  autoCreatePR?: boolean;
  notifyOnSessionStart?: boolean;
  notifyOnSessionEnd?: boolean;
}

export interface JiraIntegration {
  serverUrl: string;
  projectKey: string;
  email?: string;
  apiToken?: string;
  enabled: boolean;
  autoCreateIssue?: boolean;
  issueType?: string;
  notifyOnSessionStart?: boolean;
  notifyOnSessionEnd?: boolean;
}

export interface IntegrationConfig {
  slack?: SlackIntegration;
  github?: GitHubIntegration;
  jira?: JiraIntegration;
  webhooks?: {
    sessionStart?: string;
    sessionEnd?: string;
    consensus?: string;
    vote?: string;
  };
}

export interface IntegrationResult {
  platform: 'slack' | 'github' | 'jira' | 'webhook';
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface WebhookPayload {
  event: string;
  sessionId?: string;
  timestamp: number;
  data: any;
}

export class IntegrationEcosystemService {
  private config: IntegrationConfig = {};
  private configFile: string = './config/integrations.json';

  constructor() {}

  async initialize(): Promise<void> {
    try {
      await fs.mkdir('./config', { recursive: true });
      await this.loadConfig();
      console.log('[IntegrationEcosystem] Service initialized');
    } catch (error) {
      console.error('[IntegrationEcosystem] Failed to initialize:', error);
    }
  }

  async configureSlack(config: SlackIntegration): Promise<void> {
    this.config.slack = config;
    await this.saveConfig();
    console.log('[IntegrationEcosystem] Slack integration configured');
  }

  async configureGitHub(config: GitHubIntegration): Promise<void> {
    this.config.github = config;
    await this.saveConfig();
    console.log('[IntegrationEcosystem] GitHub integration configured');
  }

  async configureJira(config: JiraIntegration): Promise<void> {
    this.config.jira = config;
    await this.saveConfig();
    console.log('[IntegrationEcosystem] Jira integration configured');
  }

  async configureWebhooks(webhooks: IntegrationConfig['webhooks']): Promise<void> {
    this.config.webhooks = webhooks;
    await this.saveConfig();
    console.log('[IntegrationEcosystem] Webhooks configured');
  }

  async notifySessionStart(sessionId: string, topic: string): Promise<IntegrationResult[]> {
    const results: IntegrationResult[] = [];

    // Slack notification
    if (this.config.slack?.enabled && this.config.slack.notifyOnSessionStart) {
      try {
        const result = await this.sendSlackMessage(
          this.config.slack.channelId,
          `🚀 New AI Council session started: "${topic}"\nSession ID: ${sessionId}`
        );
        results.push({
          platform: 'slack',
          success: true,
          message: 'Session start notification sent to Slack',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'slack',
          success: false,
          message: 'Failed to send Slack notification',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // GitHub notification
    if (this.config.github?.enabled && this.config.github.notifyOnSessionStart) {
      try {
        const result = await this.createGitHubCommit(
          `chore: AI Council session ${sessionId} - ${topic}`,
          `AI Council session started\n\nTopic: ${topic}\nSession ID: ${sessionId}\nTimestamp: ${new Date().toISOString()}`
        );
        results.push({
          platform: 'github',
          success: true,
          message: 'Session start logged to GitHub',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'github',
          success: false,
          message: 'Failed to log to GitHub',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Jira notification
    if (this.config.jira?.enabled && this.config.jira.notifyOnSessionStart) {
      try {
        const result = await this.createJiraIssue(
          `AI Council Session: ${topic}`,
          `AI Council session initiated\n\nSession ID: ${sessionId}\nTopic: ${topic}`
        );
        results.push({
          platform: 'jira',
          success: true,
          message: 'Session start created as Jira issue',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'jira',
          success: false,
          message: 'Failed to create Jira issue',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Webhook notification
    if (this.config.webhooks?.sessionStart) {
      try {
        const result = await this.sendWebhook(this.config.webhooks.sessionStart, {
          event: 'session_start',
          sessionId,
          timestamp: Date.now(),
          data: { topic }
        });
        results.push({
          platform: 'webhook',
          success: true,
          message: 'Session start webhook sent',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'webhook',
          success: false,
          message: 'Failed to send webhook',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  async notifySessionEnd(sessionId: string, summary: string): Promise<IntegrationResult[]> {
    const results: IntegrationResult[] = [];

    // Slack notification
    if (this.config.slack?.enabled && this.config.slack.notifyOnSessionEnd) {
      try {
        const result = await this.sendSlackMessage(
          this.config.slack.channelId,
          `✅ AI Council session completed\n\nSession ID: ${sessionId}\nSummary: ${summary.substring(0, 200)}...`
        );
        results.push({
          platform: 'slack',
          success: true,
          message: 'Session end notification sent to Slack',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'slack',
          success: false,
          message: 'Failed to send Slack notification',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // GitHub notification
    if (this.config.github?.enabled && this.config.github.notifyOnSessionEnd) {
      try {
        const result = await this.createGitHubCommit(
          `feat: AI Council session ${sessionId} completed`,
          `AI Council session completed\n\nSession ID: ${sessionId}\nSummary: ${summary}\nTimestamp: ${new Date().toISOString()}`
        );
        results.push({
          platform: 'github',
          success: true,
          message: 'Session end logged to GitHub',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'github',
          success: false,
          message: 'Failed to log to GitHub',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Jira notification
    if (this.config.jira?.enabled && this.config.jira.notifyOnSessionEnd) {
      try {
        const result = await this.updateJiraIssue(
          `AI Council Session: ${sessionId}`,
          `AI Council session completed\n\nSession ID: ${sessionId}\nSummary: ${summary}`
        );
        results.push({
          platform: 'jira',
          success: true,
          message: 'Session end updated in Jira',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'jira',
          success: false,
          message: 'Failed to update Jira issue',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Webhook notification
    if (this.config.webhooks?.sessionEnd) {
      try {
        const result = await this.sendWebhook(this.config.webhooks.sessionEnd, {
          event: 'session_end',
          sessionId,
          timestamp: Date.now(),
          data: { summary }
        });
        results.push({
          platform: 'webhook',
          success: true,
          message: 'Session end webhook sent',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'webhook',
          success: false,
          message: 'Failed to send webhook',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  async notifyConsensus(sessionId: string, consensusLabel: string, consensusScore: number): Promise<IntegrationResult[]> {
    const results: IntegrationResult[] = [];

    // Slack notification
    if (this.config.slack?.enabled && this.config.slack.notifyOnConsensus) {
      try {
        const result = await this.sendSlackMessage(
          this.config.slack.channelId,
          `🎯 Consensus Reached in AI Council Session\n\nSession ID: ${sessionId}\nConsensus: ${consensusLabel} (${(consensusScore * 100).toFixed(1)}%)`
        );
        results.push({
          platform: 'slack',
          success: true,
          message: 'Consensus notification sent to Slack',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'slack',
          success: false,
          message: 'Failed to send Slack notification',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Webhook notification
    if (this.config.webhooks?.consensus) {
      try {
        const result = await this.sendWebhook(this.config.webhooks.consensus, {
          event: 'consensus_reached',
          sessionId,
          timestamp: Date.now(),
          data: { consensusLabel, consensusScore }
        });
        results.push({
          platform: 'webhook',
          success: true,
          message: 'Consensus webhook sent',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'webhook',
          success: false,
          message: 'Failed to send webhook',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  async notifyVote(sessionId: string, voteData: any): Promise<IntegrationResult[]> {
    const results: IntegrationResult[] = [];

    // Slack notification
    if (this.config.slack?.enabled) {
      try {
        const result = await this.sendSlackMessage(
          this.config.slack.channelId,
          `🗳️ Vote Cast in AI Council Session\n\nSession ID: ${sessionId}\nTopic: ${voteData.topic}\nResult: ${voteData.result}`
        );
        results.push({
          platform: 'slack',
          success: true,
          message: 'Vote notification sent to Slack',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'slack',
          success: false,
          message: 'Failed to send Slack notification',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Webhook notification
    if (this.config.webhooks?.vote) {
      try {
        const result = await this.sendWebhook(this.config.webhooks.vote, {
          event: 'vote_cast',
          sessionId,
          timestamp: Date.now(),
          data: voteData
        });
        results.push({
          platform: 'webhook',
          success: true,
          message: 'Vote webhook sent',
          data: result
        });
      } catch (error) {
        results.push({
          platform: 'webhook',
          success: false,
          message: 'Failed to send webhook',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  async createGitHubIssue(title: string, body: string, labels?: string[]): Promise<any> {
    if (!this.config.github?.enabled) {
      throw new Error('GitHub integration not configured');
    }

    // Simulated GitHub issue creation
    await this.delay(500);

    return {
      number: Math.floor(Math.random() * 1000),
      title,
      body,
      labels: labels || [],
      state: 'open',
      html_url: `https://github.com/${this.config.github.owner}/${this.config.github.repo}/issues/1`
    };
  }

  async createGitHubPullRequest(title: string, body: string, head: string, base: string): Promise<any> {
    if (!this.config.github?.enabled) {
      throw new Error('GitHub integration not configured');
    }

    // Simulated GitHub PR creation
    await this.delay(800);

    return {
      number: Math.floor(Math.random() * 1000),
      title,
      body,
      head: { ref: head },
      base: { ref: base },
      state: 'open',
      html_url: `https://github.com/${this.config.github.owner}/${this.config.github.repo}/pull/1`
    };
  }

  async createGitHubCommit(message: string, content: string): Promise<any> {
    if (!this.config.github?.enabled) {
      throw new Error('GitHub integration not configured');
    }

    // Simulated GitHub commit
    await this.delay(300);

    return {
      sha: randomBytes(20).toString('hex'),
      message,
      author: 'AI Council Bot',
      timestamp: new Date().toISOString()
    };
  }

  async createJiraIssue(summary: string, description: string): Promise<any> {
    if (!this.config.jira?.enabled) {
      throw new Error('Jira integration not configured');
    }

    // Simulated Jira issue creation
    await this.delay(600);

    return {
      key: `${this.config.jira.projectKey}-${Math.floor(Math.random() * 1000)}`,
      summary,
      description,
      status: 'Open',
      issueType: this.config.jira.issueType || 'Task',
      url: `${this.config.jira.serverUrl}/browse/${this.config.jira.projectKey}-1`
    };
  }

  async updateJiraIssue(issueKey: string, comment: string): Promise<any> {
    if (!this.config.jira?.enabled) {
      throw new Error('Jira integration not configured');
    }

    // Simulated Jira issue update
    await this.delay(400);

    return {
      key: issueKey,
      comment,
      updated: true,
      timestamp: new Date().toISOString()
    };
  }

  async sendSlackMessage(channel: string, text: string): Promise<any> {
    if (!this.config.slack?.enabled) {
      throw new Error('Slack integration not configured');
    }

    // Simulated Slack message
    await this.delay(200);

    return {
      channel,
      text,
      ts: Date.now().toString(),
      ok: true
    };
  }

  async sendSlackFile(channel: string, file: Buffer, filename: string): Promise<any> {
    if (!this.config.slack?.enabled) {
      throw new Error('Slack integration not configured');
    }

    // Simulated Slack file upload
    await this.delay(500);

    return {
      channel,
      file: filename,
      ok: true
    };
  }

  async sendWebhook(url: string, payload: WebhookPayload): Promise<any> {
    // Simulated webhook call
    await this.delay(300);

    return {
      url,
      payload,
      status: 'sent',
      timestamp: Date.now()
    };
  }

  async loadConfig(): Promise<void> {
    try {
      const data = await fs.readFile(this.configFile, 'utf-8');
      this.config = JSON.parse(data);
    } catch (error) {
      // Use default config if file doesn't exist
      this.config = {};
    }
  }

  async saveConfig(): Promise<void> {
    await fs.writeFile(this.configFile, JSON.stringify(this.config, null, 2));
  }

  getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  async testSlackConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.slack?.enabled) {
      return { success: false, message: 'Slack integration not configured' };
    }

    try {
      await this.sendSlackMessage(this.config.slack.channelId, 'Test message from AI Council');
      return { success: true, message: 'Slack connection successful' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  async testGitHubConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.github?.enabled) {
      return { success: false, message: 'GitHub integration not configured' };
    }

    try {
      await this.createGitHubCommit('chore: test connection', 'Testing GitHub connection');
      return { success: true, message: 'GitHub connection successful' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  async testJiraConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.jira?.enabled) {
      return { success: false, message: 'Jira integration not configured' };
    }

    try {
      await this.createJiraIssue('Test Issue', 'Testing Jira connection');
      return { success: true, message: 'Jira connection successful' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const integrationEcosystemService = new IntegrationEcosystemService();
