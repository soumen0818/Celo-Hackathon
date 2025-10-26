import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const GRANT_DISTRIBUTION_ABI = [
    {
        inputs: [],
        name: 'projectCount',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '_projectId', type: 'uint256' }],
        name: 'getProject',
        outputs: [{
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'projectAddress', type: 'address' },
                { name: 'name', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'githubUrl', type: 'string' },
                { name: 'requestedAmount', type: 'uint256' },
                { name: 'votesFor', type: 'uint256' },
                { name: 'votesAgainst', type: 'uint256' },
                { name: 'totalGrantsReceived', type: 'uint256' },
                { name: 'createdAt', type: 'uint256' },
                { name: 'isActive', type: 'bool' },
                { name: 'isApproved', type: 'bool' },
                { name: 'isFunded', type: 'bool' },
            ],
            name: '',
            type: 'tuple',
        }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '_projectId', type: 'uint256' }],
        name: 'getProjectAssignedCompanies',
        outputs: [{ name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '_address', type: 'address' }],
        name: 'companies',
        outputs: [
            { name: 'companyAddress', type: 'address' },
            { name: 'name', type: 'string' },
            { name: 'isActive', type: 'bool' },
            { name: 'registeredAt', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getAllCompanies',
        outputs: [{ name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '_companyAddress', type: 'address' }],
        name: 'getCompanyAssignedProjects',
        outputs: [{ name: '', type: 'uint256[]' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: http(),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const functionName = searchParams.get('function');
        const argsParam = searchParams.get('args');

        if (!functionName) {
            return NextResponse.json(
                { success: false, error: 'Function name is required' },
                { status: 400 }
            );
        }

        let args: any[] = [];
        if (argsParam) {
            // Parse arguments - handle both single values and arrays
            try {
                // Try to parse as JSON first
                args = JSON.parse(argsParam);
                if (!Array.isArray(args)) {
                    args = [args];
                }
            } catch {
                // If not JSON, treat as single value
                // Check if it's a number
                if (!isNaN(Number(argsParam))) {
                    args = [BigInt(argsParam)];
                } else {
                    args = [argsParam];
                }
            }
        }

        // Call the contract function
        const data = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: GRANT_DISTRIBUTION_ABI,
            functionName: functionName as any,
            args: args as any,
        });

        // Convert BigInt values to strings for JSON serialization
        const serializedData = JSON.parse(
            JSON.stringify(data, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            )
        );

        return NextResponse.json({
            success: true,
            data: serializedData,
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to read contract data',
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { functionName, args } = body;

        if (!functionName) {
            return NextResponse.json(
                { success: false, error: 'Function name is required' },
                { status: 400 }
            );
        }

        // Parse arguments
        let processedArgs: any[] = [];
        if (args && Array.isArray(args)) {
            processedArgs = args.map((arg: any) => {
                // Convert string numbers to BigInt for uint256 parameters
                if (typeof arg === 'string' && !isNaN(Number(arg))) {
                    return BigInt(arg);
                }
                return arg;
            });
        }


        // Call the contract function
        const data = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: GRANT_DISTRIBUTION_ABI,
            functionName: functionName as any,
            args: processedArgs as any,
        });

        // Convert BigInt values to strings for JSON serialization
        const serializedData = JSON.parse(
            JSON.stringify(data, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            )
        );

        return NextResponse.json({
            success: true,
            result: serializedData,
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to read contract data',
            },
            { status: 500 }
        );
    }
}
