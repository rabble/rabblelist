-- Create pathway_members table for tracking contact progress through pathways

CREATE TABLE pathway_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pathway_id UUID NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    UNIQUE(pathway_id, contact_id)
);

-- Create indexes
CREATE INDEX idx_pathway_members_pathway ON pathway_members(pathway_id);
CREATE INDEX idx_pathway_members_contact ON pathway_members(contact_id);
CREATE INDEX idx_pathway_members_status ON pathway_members(completed_at);

-- Enable RLS
ALTER TABLE pathway_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "view_pathway_members" ON pathway_members FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM pathways 
        WHERE id = pathway_members.pathway_id 
        AND organization_id = get_user_organization_id()
    ));

CREATE POLICY "manage_pathway_members" ON pathway_members FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM pathways 
        WHERE id = pathway_members.pathway_id 
        AND organization_id = get_user_organization_id()
    ));