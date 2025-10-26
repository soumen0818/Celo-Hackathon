import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface GitHubRepoData {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

interface GitHubContributor {
  contributions: number;
}

export async function POST(request: NextRequest) {
  try {
    const { githubUrl } = await request.json();

    if (!githubUrl) {
      return NextResponse.json(
        { success: false, error: 'GitHub URL is required' },
        { status: 400 }
      );
    }

    // Extract owner and repo from URL
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Invalid GitHub URL' },
        { status: 400 }
      );
    }

    const [, owner, repo] = match;

    const headers = {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    };

    // Fetch repository data
    const repoResponse = await axios.get<GitHubRepoData>(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );

    // Fetch commits from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const commitsResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers,
        params: {
          since: ninetyDaysAgo.toISOString(),
          per_page: 100,
        },
      }
    );

    // Fetch pull requests
    const prsResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        headers,
        params: {
          state: 'all',
          per_page: 100,
        },
      }
    );

    // Fetch contributors
    const contributorsResponse = await axios.get<GitHubContributor[]>(
      `https://api.github.com/repos/${owner}/${repo}/contributors`,
      {
        headers,
        params: {
          per_page: 100,
        },
      }
    );

    const data = {
      stars: repoResponse.data.stargazers_count,
      forks: repoResponse.data.forks_count,
      issues: repoResponse.data.open_issues_count, // Changed from openIssues to issues
      watchers: repoResponse.data.subscribers_count,
      commits: commitsResponse.data.length,
      pullRequests: prsResponse.data.length,
      contributors: contributorsResponse.data.length,
      createdAt: repoResponse.data.created_at,
      lastUpdated: repoResponse.data.updated_at,
      lastPushed: repoResponse.data.pushed_at,
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch GitHub data',
      },
      { status: 500 }
    );
  }
}
