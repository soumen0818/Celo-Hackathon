-- Migration: Add blockchain tracking fields to projects table
-- Date: 2025-10-25
-- Description: Adds blockchain_project_id and blockchain_tx_hash columns to track on-chain project registration

-- Add blockchain_project_id column (stores the on-chain project ID)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS blockchain_project_id INTEGER;

-- Add blockchain_tx_hash column (stores the registration transaction hash)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT;

-- Add comment for documentation
COMMENT ON COLUMN projects.blockchain_project_id IS 'The project ID from the smart contract (0-indexed)';
COMMENT ON COLUMN projects.blockchain_tx_hash IS 'Transaction hash of the blockchain registration';

-- Create index for faster lookups by blockchain_project_id
CREATE INDEX IF NOT EXISTS idx_projects_blockchain_id ON projects(blockchain_project_id);

-- Optional: For existing projects, you can manually set blockchain_project_id
-- If you registered projects manually and know the mapping:
-- UPDATE projects SET blockchain_project_id = 0 WHERE id = 1;  -- First project
-- UPDATE projects SET blockchain_project_id = 1 WHERE id = 2;  -- Second project
-- etc.
