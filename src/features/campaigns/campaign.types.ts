export interface Campaign {
  id: string
  organization_id: string
  title: string
  type: 'petition' | 'event' | 'donation' | 'email_blast' | 'phone_bank' | 'canvas' | 'social'
  status: 'draft' | 'active' | 'scheduled' | 'completed' | 'archived'
  description?: string
  goal?: number
  start_date?: string
  end_date?: string
  scheduled_for?: string
  settings?: Record<string, any>
  tags: string[]
  created_by?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  email_subject?: string
  email_body?: string
  sms_body?: string
  // Relations
  campaign_stats?: CampaignStats[]
  campaign_assets?: CampaignAsset[]
  campaign_contacts?: { count: number; contact_id?: string }[]
  created_by_user?: {
    full_name: string
    email: string
  }
}

export interface CampaignStats {
  id: string
  campaign_id: string
  date: string
  participants: number
  conversions: number
  shares: number
  new_contacts: number
  emails_sent: number
  emails_opened: number
  emails_clicked: number
  calls_made: number
  calls_completed: number
  amount_raised: number
  created_at: string
}

export interface CampaignContact {
  id: string
  campaign_id: string
  contact_id: string
  status: 'subscribed' | 'completed' | 'opted_out'
  source: string
  joined_at: string
  completed_at?: string
  metadata?: Record<string, any>
}

export interface CampaignAsset {
  id: string
  campaign_id: string
  type: 'email_template' | 'sms_template' | 'call_script' | 'social_post' | 'image' | 'document'
  name: string
  content?: string
  url?: string
  metadata?: Record<string, any>
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Petition {
  id: string
  campaign_id?: string
  organization_id: string
  title: string
  description?: string
  target?: string
  goal: number
  is_public: boolean
  allow_comments: boolean
  settings?: Record<string, any>
  created_at: string
  updated_at: string
  // Relations
  signatures?: { count: number }[]
  recent_signatures?: PetitionSignature[]
}

export interface PetitionSignature {
  id: string
  petition_id: string
  contact_id?: string
  signer_name: string
  signer_email: string
  signer_phone?: string
  signer_zip?: string
  comment?: string
  is_public: boolean
  signed_at: string
  ip_address?: string
  user_agent?: string
}

export interface Donation {
  id: string
  campaign_id?: string
  organization_id: string
  contact_id?: string
  amount: number
  currency: string
  payment_method?: string
  transaction_id?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  donor_name: string
  donor_email: string
  donor_phone?: string
  donor_address?: Record<string, any>
  is_recurring: boolean
  metadata?: Record<string, any>
  created_at: string
}