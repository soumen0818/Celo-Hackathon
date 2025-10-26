import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { celoAlfajores } from 'viem/chains';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: http(),
});

// Event signatures
const EVENT_SIGNATURES = {
    GrantDistributed: 'event GrantDistributed(uint256 indexed projectId, address indexed recipient, uint256 amount, uint256 timestamp)',
    ProjectProposed: 'event ProjectProposed(uint256 indexed projectId, address indexed projectAddress, string name, uint256 requestedAmount, uint256 timestamp)',
    VoteCast: 'event VoteCast(uint256 indexed projectId, address indexed company, bool support, uint256 timestamp)',
    ProjectApproved: 'event ProjectApproved(uint256 indexed projectId, uint256 votesFor, uint256 votesAgainst, uint256 timestamp)',
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventName, fromBlock, toBlock } = body;

        if (!eventName) {
            return NextResponse.json(
                { success: false, error: 'Event name is required' },
                { status: 400 }
            );
        }

        if (!EVENT_SIGNATURES[eventName as keyof typeof EVENT_SIGNATURES]) {
            return NextResponse.json(
                { success: false, error: `Unknown event: ${eventName}` },
                { status: 400 }
            );
        }

        // Get current block number
        const currentBlock = await publicClient.getBlockNumber();
        const from = fromBlock !== undefined && fromBlock !== null ? BigInt(fromBlock) : currentBlock - BigInt(10000); // Default: last ~10k blocks
        const to = toBlock !== undefined && toBlock !== null ? BigInt(toBlock) : currentBlock;

        // Fetch events
        const eventAbi = parseAbiItem(EVENT_SIGNATURES[eventName as keyof typeof EVENT_SIGNATURES]);

        const logs = await publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: eventAbi as any,
            fromBlock: from,
            toBlock: to,
        });

        // Convert BigInt values to strings for JSON serialization
        const serializedLogs = logs.map((log: any) => ({
            blockNumber: log.blockNumber.toString(),
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            args: JSON.parse(
                JSON.stringify(log.args || {}, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )
            ),
        }));

        return NextResponse.json({
            success: true,
            events: serializedLogs,
            count: serializedLogs.length,
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch events',
            },
            { status: 500 }
        );
    }
}
