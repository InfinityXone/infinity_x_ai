import { Octokit } from '@octokit/rest';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class GitHubCopilotIntegration {
  private octokit: Octokit;
  private openai: OpenAI;
  private repoOwner: string;
  private repoName: string;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Parse repo from git remote
    const remote = process.env.GITHUB_REPO || 'username/repo';
    const [owner, name] = remote.split('/');
    this.repoOwner = owner;
    this.repoName = name;

    console.log('🔗 GitHub Copilot Integration initialized');
    console.log(\   Repository: \/\\);
  }

  async syncWithRepo(): Promise<void> {
    console.log('\n🔄 Syncing with GitHub repository...');

    try {
      // Get repository info
      const { data: repo } = await this.octokit.repos.get({
        owner: this.repoOwner,
        repo: this.repoName,
      });

      console.log(\ Connected to: \\);
      console.log(\   Stars: \\);
      console.log(\   Language: \\);

      // Get recent commits
      const { data: commits } = await this.octokit.repos.listCommits({
        owner: this.repoOwner,
        repo: this.repoName,
        per_page: 5,
      });

      console.log(\\n📝 Recent commits:\);
      commits.forEach((commit, i) => {
        console.log(\   \. \\);
      });

      return;
    } catch (error: any) {
      console.error('❌ GitHub sync failed:', error.message);
    }
  }

  async generateCodeWithCopilot(prompt: string): Promise<string> {
    console.log(\\n🤖 Generating code with AI Copilot...\);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are GitHub Copilot. Generate clean, production-ready code.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const code = completion.choices[0].message.content || '';
      console.log(' Code generated successfully');
      return code;
    } catch (error: any) {
      console.error('❌ Code generation failed:', error.message);
      return '';
    }
  }

  async createPullRequest(
    title: string,
    body: string,
    branch: string
  ): Promise<void> {
    console.log(\\n📤 Creating pull request...\);

    try {
      const { data: pr } = await this.octokit.pulls.create({
        owner: this.repoOwner,
        repo: this.repoName,
        title,
        body,
        head: branch,
        base: 'main',
      });

      console.log(\✅ Pull request created: \\);
    } catch (error: any) {
      console.error('❌ PR creation failed:', error.message);
    }
  }

  async autoCommitAndPush(message: string): Promise<void> {
    console.log(\\n📦 Auto-committing changes...\);

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('git add .');
      await execAsync(\git commit -m "\"\);
      await execAsync('git push');
      console.log('✅ Changes committed and pushed');
    } catch (error: any) {
      console.error('❌ Commit failed:', error.message);
    }
  }
}
