import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const MODEL     = "claude-opus-4-7";

async function askClaude(prompt: string, systemPrompt: string): Promise<any> {
  const message = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: 1500,
    system:     systemPrompt,
    messages:   [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as any).text as string;
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) return JSON.parse(jsonMatch[1]);
  return JSON.parse(text);
}

export const aiService = {
  // ── Feature 1: Analyze a proposal ─────────────────────────────────────────
  async analyzeProposal(proposal: {
    title: string;
    description: string;
    businessType: string;
    fundingGoal: number;
    profitSharePercent: number;
    duration: number;
    riskLevel?: string;
  }) {
    const system = `You are an expert Islamic finance analyst specializing in Musharakah investments.
You evaluate halal business proposals for NoorVenture, a Shariah-compliant platform.
Respond with valid JSON only. No explanations outside JSON.`;

    const prompt = `Analyze this business proposal:

Title: ${proposal.title}
Business Type: ${proposal.businessType}
Funding Goal: ৳${proposal.fundingGoal}
Profit Share for Investors: ${proposal.profitSharePercent}%
Duration: ${proposal.duration} months
Description: ${proposal.description}

Return ONLY this JSON (scores 1-10, higher is better/riskier):
{
  "riskScore": <1-10>,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "viabilityScore": <1-10>,
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "shariahCompliance": {
    "compliant": true | false,
    "notes": "<brief Shariah compliance assessment>"
  }
}`;

    try {
      return await askClaude(prompt, system);
    } catch (err) {
      logger.error(`AI analyzeProposal error: ${err}`);
      throw new Error("AI analysis failed. Please try again.");
    }
  },

  // ── Feature 2: Generate a proposal from a plain text brief ────────────────
  async generateProposal(brief: string) {
    const system = `You are a professional business proposal writer for NoorVenture, a Shariah-compliant investment platform.
Write compelling, honest proposals for halal investors in Bangladesh.
Respond with valid JSON only.`;

    const prompt = `Generate a professional business proposal from this brief:

"${brief}"

Return ONLY this JSON:
{
  "title": "<compelling, specific proposal title>",
  "description": "<3-4 paragraph professional description, at least 150 words>",
  "keyPoints": ["<point 1>", "<point 2>", "<point 3>", "<point 4>", "<point 5>"],
  "revenueModel": "<clear explanation of how the business makes money>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>"]
}`;

    try {
      return await askClaude(prompt, system);
    } catch (err) {
      logger.error(`AI generateProposal error: ${err}`);
      throw new Error("Proposal generation failed. Please try again.");
    }
  },

  // ── Feature 3: Match investors to a proposal ──────────────────────────────
  async matchInvestors(
    proposal: { title: string; businessType: string; riskLevel: string; profitSharePercent: number; fundingGoal: number },
    investors: Array<{ id: string; name: string; totalInvested: number }>
  ) {
    const system = `You are an AI matching engine for NoorVenture.
Match investors to proposals and return compatibility scores.
Respond with valid JSON only.`;

    const prompt = `Match these investors to this proposal:

Proposal: ${proposal.title}
Business Type: ${proposal.businessType}
Risk Level: ${proposal.riskLevel}
Profit Share: ${proposal.profitSharePercent}%
Goal: ৳${proposal.fundingGoal}

Investors (${investors.length}):
${investors.map((i, idx) => `${idx + 1}. ${i.name} (invested ৳${i.totalInvested} total)`).join("\n")}

Return ONLY this JSON (for each investor in same order):
[
  {
    "investorId": "<id>",
    "name": "<name>",
    "score": <1-10 match score>,
    "reasoning": "<brief 1-sentence reason>",
    "riskTolerance": "LOW" | "MEDIUM" | "HIGH"
  }
]`;

    try {
      const result = await askClaude(prompt, system);
      return Array.isArray(result) ? result : (result.matches ?? []);
    } catch (err) {
      logger.error(`AI matchInvestors error: ${err}`);
      throw new Error("Investor matching failed. Please try again.");
    }
  },

  // ── Feature 4: Analyze a profit report ───────────────────────────────────
  async analyzeReport(report: {
    proposalTitle: string;
    month: number;
    year: number;
    revenue: number;
    expenses: number;
    netProfit: number;
    investorShare: number;
    previousReports?: Array<{ month: number; year: number; revenue: number; netProfit: number }>;
  }) {
    const system = `You are a financial analyst for NoorVenture.
Analyze monthly profit reports and give actionable insights.
Respond with valid JSON only.`;

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const prompt = `Analyze this monthly profit report:

Business: ${report.proposalTitle}
Period: ${months[report.month - 1]} ${report.year}
Revenue: ৳${report.revenue}
Expenses: ৳${report.expenses}
Net Profit: ৳${report.netProfit}
Investor Share Paid: ৳${report.investorShare}
Profit Margin: ${report.revenue > 0 ? ((report.netProfit / report.revenue) * 100).toFixed(1) : 0}%

Previous months: ${JSON.stringify(report.previousReports ?? [])}

Return ONLY this JSON:
{
  "trend": "IMPROVING" | "STABLE" | "DECLINING",
  "healthScore": <1-10>,
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "warnings": ["<warning if any, or empty array []>"],
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"],
  "projectedNextMonth": <estimated next month net profit as a number>
}`;

    try {
      return await askClaude(prompt, system);
    } catch (err) {
      logger.error(`AI analyzeReport error: ${err}`);
      throw new Error("Report analysis failed. Please try again.");
    }
  },

  // ── Feature 5: Chat / AI Advisor ─────────────────────────────────────────
  async chat(message: string, history: Array<{ role: "user" | "assistant"; content: string }> = []) {
    const system = `You are Noor AI, a knowledgeable Islamic finance advisor for NoorVenture — a Shariah-compliant peer-to-business financing platform in Bangladesh.

You help users understand:
- Musharakah (profit-loss sharing) model
- Halal investment principles
- Business proposal evaluation
- Portfolio diversification
- Risk management in Islamic finance
- Zakat on investments

Keep responses concise (2-3 paragraphs max). Always be encouraging and reference Islamic finance principles.
Start every response with "Bismillah," or "JazakAllah," occasionally for authenticity.`;

    try {
      const messages = [
        ...history.slice(-6),
        { role: "user" as const, content: message },
      ];

      const response = await anthropic.messages.create({
        model:      MODEL,
        max_tokens: 600,
        system,
        messages,
      });

      const reply = (response.content[0] as any).text as string;
      return { reply };
    } catch (err) {
      logger.error(`AI chat error: ${err}`);
      throw new Error("AI chat failed. Please try again.");
    }
  },
};
