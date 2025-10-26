import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('impact_score', { ascending: false });

    if (error) throw error;

    // Transform snake_case to camelCase for frontend
    const transformedProjects = projects?.map((project: any) => ({
      id: project.blockchain_project_id || project.id,
      name: project.name,
      description: project.description,
      githubUrl: project.github_url,
      requestedAmount: project.requested_amount || '0',
      votesFor: project.votes_for || 0,
      votesAgainst: project.votes_against || 0,
      isApproved: project.is_approved || false,
      isFunded: project.is_funded || false,
      projectAddress: project.project_address,
    })) || [];

    return NextResponse.json({
      success: true,
      projects: transformedProjects,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch projects',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectAddress, name, description, githubUrl, blockchainTxHash, blockchainProjectId, aiScore } = body;

    if (!projectAddress || !name || !githubUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert([
        {
          project_address: projectAddress,
          name,
          description,
          github_url: githubUrl,
          blockchain_tx_hash: blockchainTxHash || null,
          blockchain_project_id: blockchainProjectId !== undefined ? blockchainProjectId : null,
          impact_score: aiScore || 0,
          total_grants_received: 0,
          is_active: true,
          is_verified: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create project',
      },
      { status: 500 }
    );
  }
}
