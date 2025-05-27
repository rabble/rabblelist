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
  tags: string[]
  settings?: any
  metadata?: any
  email_subject?: string
  email_body?: string
  sms_body?: string
  created_at: string
  updated_at: string
  created_by?: string
  campaign_stats?: CampaignStats[]
  campaign_contacts?: CampaignContact[]
  campaign_assets?: CampaignAsset[]
}

export interface CampaignStats {
  id: string
  campaign_id: string
  participants: number
  conversions: number
  shares: number
  new_contacts: number
  updated_at: string
}

export interface CampaignContact {
  id: string
  campaign_id: string
  contact_id: string
  status: 'active' | 'completed' | 'opted_out'
  last_contacted?: string
  created_at: string
}

export interface CampaignAsset {
  id: string
  campaign_id: string
  type: string
  name: string
  url: string
  metadata?: any
  created_at: string
}

export interface Petition {
  id: string
  campaign_id: string
  target_name?: string
  target_title?: string
  delivery_method?: string
  custom_fields?: any[]
  created_at: string
}

export interface PetitionSignature {
  id: string
  campaign_id: string
  contact_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  zip_code?: string
  comment?: string
  is_public: boolean
  signed_at: string
}