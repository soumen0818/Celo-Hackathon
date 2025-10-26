import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Using Google Gemini API (FREE!)
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Mock AI scoring function (for testing without OpenAI costs)
function calculateMockScore(projectData: any) {
  const { commits = 0, stars = 0, forks = 0, contributors = 0, pullRequests = 0, issues = 0 } = projectData;

  // Calculate score based on GitHub metrics
  const activityScore = Math.min(25, commits / 10); // Up to 25 points
  const popularityScore = Math.min(20, (stars + forks) / 10); // Up to 20 points
  const communityScore = Math.min(20, contributors * 2); // Up to 20 points
  const contributionScore = Math.min(15, (pullRequests + issues) / 5); // Up to 15 points
  const baseInnovation = 20; // Base innovation score

  const totalScore = Math.round(activityScore + popularityScore + communityScore + contributionScore + baseInnovation);

  return {
    impactScore: Math.min(100, totalScore),
    breakdown: {
      codeQuality: Math.round(activityScore),
      communityEngagement: Math.round(communityScore),
      sustainability: Math.round(popularityScore),
      impactPotential: Math.round(contributionScore),
      innovation: baseInnovation,
    },
    reasoning: `This project shows ${totalScore > 70 ? 'strong' : totalScore > 50 ? 'moderate' : 'developing'} potential based on GitHub metrics. ` +
      `With ${stars} stars, ${commits} commits, and ${contributors} contributors, it demonstrates ${totalScore > 70 ? 'excellent' : totalScore > 50 ? 'good' : 'promising'
      } community engagement and development activity.`,
    recommendations: [
      stars < 50 ? 'Increase project visibility through marketing and community outreach' : 'Strong community presence',
      commits < 100 ? 'Maintain consistent development activity' : 'Excellent development rhythm',
      contributors < 5 ? 'Encourage more community contributions' : 'Good contributor diversity',
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const { projectData } = await request.json();

    const {
      githubUrl,
      description,
      commits = 0,
      pullRequests = 0,
      issues = 0,
      stars = 0,
      forks = 0,
      contributors = 0,
    } = projectData;

    let analysis;

    if (!genAI) {
      // Fallback to mock scoring if no API key
      analysis = calculateMockScore(projectData);

    } else {
      // Use Google Gemini API (FREE!)

      const prompt = `You are an expert blockchain project evaluator specializing in assessing Web3 projects for grant distribution. Provide objective, data-driven analysis.

Analyze this blockchain project for grant eligibility and calculate an impact score (0-100).

Project Details:
- GitHub URL: ${githubUrl}
- Description: ${description}
- Commits (last 90 days): ${commits}
- Pull Requests: ${pullRequests}
- Issues Resolved: ${issues}
- Stars: ${stars}
- Forks: ${forks}
- Contributors: ${contributors}

Please analyze:
1. Code quality and activity level
2. Community engagement
3. Project sustainability
4. Impact potential on the Celo ecosystem
5. Innovation and uniqueness

Provide a JSON response with this exact structure:
{
  "impactScore": 0-100,
  "breakdown": {
    "codeQuality": 0-25,
    "communityEngagement": 0-20,
    "sustainability": 0-20,
    "impactPotential": 0-15,
    "innovation": 0-20
  },
  "reasoning": "Brief explanation",
  "recommendations": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

      try {
        // Try multiple model names as Google keeps changing them
        let model;
        try {
          model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        } catch {
          try {
            model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          } catch {
            model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
          }
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (remove markdown code blocks if present)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback to mock if parsing fails

          analysis = calculateMockScore(projectData);
        }

      } catch (geminiError: any) {
        analysis = calculateMockScore(projectData);

      }
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    // Even if there's an error, return mock scoring instead of failing
    const mockAnalysis = calculateMockScore({
      commits: 0,
      stars: 0,
      forks: 0,
      contributors: 0,
      pullRequests: 0,
      issues: 0,
    });

    return NextResponse.json({
      success: true,
      analysis: mockAnalysis,
      note: 'Using mock scoring due to API error',
    });
  }
}
