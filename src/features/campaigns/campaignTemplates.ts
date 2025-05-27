export interface CampaignTemplate {
  id: string
  name: string
  description: string
  category: 'advocacy' | 'electoral' | 'fundraising' | 'community' | 'crisis' | 'education'
  type: 'petition' | 'event' | 'donation' | 'email_blast' | 'phone_bank' | 'canvas' | 'social'
  icon: string
  settings: {
    goal?: number
    duration?: number // in days
    tags: string[]
    customFields?: Array<{
      name: string
      type: 'text' | 'number' | 'date' | 'select'
      required: boolean
      options?: string[]
    }>
  }
  steps?: Array<{
    name: string
    description: string
    dayOffset: number
  }>
  emailTemplates?: Array<{
    name: string
    subject: string
    content: string
  }>
  smsTemplates?: Array<{
    name: string
    content: string
  }>
  callScripts?: Array<{
    name: string
    content: string
  }>
}

export const campaignTemplates: CampaignTemplate[] = [
  // Advocacy Campaigns
  {
    id: 'climate-petition',
    name: 'Climate Action Petition',
    description: 'Rally community support for local climate initiatives',
    category: 'advocacy',
    type: 'petition',
    icon: '🌍',
    settings: {
      goal: 1000,
      duration: 30,
      tags: ['climate', 'environment', 'petition'],
      customFields: [
        { name: 'zip_code', type: 'text', required: true },
        { name: 'willing_to_volunteer', type: 'select', required: false, options: ['Yes', 'No', 'Maybe'] }
      ]
    },
    emailTemplates: [
      {
        name: 'Initial Ask',
        subject: 'Add your name: Demand climate action now',
        content: `Dear {{first_name}},

The climate crisis demands immediate action. Our community needs leaders who will prioritize our planet and our future.

Add your name to demand:
- 100% renewable energy by 2035
- Green jobs for our community
- Protection of our local environment

Sign the petition: {{petition_link}}

Together, we can create the change we need.

In solidarity,
{{organization_name}}`
      },
      {
        name: 'Thank You',
        subject: 'Thank you for taking action!',
        content: `Thank you {{first_name}},

Your signature matters. With {{signature_count}} supporters like you, we're building an unstoppable movement for climate action.

Here's how you can amplify your impact:
- Share the petition: {{share_link}}
- Join our next action: {{event_link}}
- Donate to support our work: {{donate_link}}

Together, we're creating the future we deserve.

{{organization_name}}`
      }
    ]
  },
  
  {
    id: 'housing-justice',
    name: 'Housing Justice Campaign',
    description: 'Fight for tenant rights and affordable housing',
    category: 'advocacy',
    type: 'petition',
    icon: '🏠',
    settings: {
      goal: 2000,
      duration: 45,
      tags: ['housing', 'tenant-rights', 'affordable-housing']
    },
    emailTemplates: [
      {
        name: 'Launch Email',
        subject: 'Stand with us for housing justice',
        content: `Dear {{first_name}},

Everyone deserves a safe, affordable place to call home. But in our community, too many are struggling with skyrocketing rents and unfair evictions.

Join our campaign for:
- Rent control and stabilization
- Just cause eviction protections
- Investment in affordable housing

Take action: {{petition_link}}

Housing is a human right,
{{organization_name}}`
      }
    ]
  },

  // Electoral Campaigns
  {
    id: 'gotv-phone-bank',
    name: 'Get Out The Vote Phone Bank',
    description: 'Mobilize voters for election day',
    category: 'electoral',
    type: 'phone_bank',
    icon: '🗳️',
    settings: {
      goal: 10000, // calls
      duration: 14,
      tags: ['gotv', 'election', 'phone-bank']
    },
    callScripts: [
      {
        name: 'GOTV Script',
        content: `Hi, is this {{contact_name}}?

Great! I'm {{volunteer_name}} with {{organization_name}}. I'm calling to make sure you have a plan to vote on {{election_date}}.

[If yes] Excellent! Do you know where your polling location is?
[If no] Can I help you make a plan? Your polling location is {{polling_location}}.

Polls are open from {{poll_hours}}. Do you need information about:
- Transportation to the polls?
- What's on your ballot?
- Voting by mail?

Remember, every vote counts. Can we count on you to vote on {{election_date}}?

Thank you for your time!`
      }
    ],
    steps: [
      { name: 'Recruit volunteers', description: 'Build your phone bank team', dayOffset: -14 },
      { name: 'Training session', description: 'Train volunteers on script and systems', dayOffset: -10 },
      { name: 'Test calls', description: 'Practice calls with volunteers', dayOffset: -7 },
      { name: 'Launch phone bank', description: 'Begin voter outreach', dayOffset: -5 },
      { name: 'Final push', description: 'Last weekend before election', dayOffset: -2 },
      { name: 'Election day calls', description: 'Final reminder calls', dayOffset: 0 }
    ]
  },

  {
    id: 'candidate-canvass',
    name: 'Candidate Door-to-Door Canvass',
    description: 'Build support through direct voter contact',
    category: 'electoral',
    type: 'canvas',
    icon: '🚪',
    settings: {
      goal: 5000, // doors
      duration: 30,
      tags: ['canvass', 'field', 'voter-contact']
    },
    steps: [
      { name: 'Cut turf', description: 'Identify target precincts and create walk lists', dayOffset: -30 },
      { name: 'Recruit canvassers', description: 'Build your field team', dayOffset: -25 },
      { name: 'Canvass training', description: 'Train volunteers on messaging and data entry', dayOffset: -20 },
      { name: 'Weekend canvasses', description: 'Launch regular weekend canvasses', dayOffset: -15 },
      { name: 'Persuasion phase', description: 'Focus on undecided voters', dayOffset: -10 },
      { name: 'GOTV phase', description: 'Shift to turning out supporters', dayOffset: -5 }
    ]
  },

  // Fundraising Campaigns
  {
    id: 'year-end-fundraising',
    name: 'Year-End Fundraising Drive',
    description: 'Maximize donations during giving season',
    category: 'fundraising',
    type: 'donation',
    icon: '🎁',
    settings: {
      goal: 50000,
      duration: 45,
      tags: ['fundraising', 'year-end', 'donations']
    },
    emailTemplates: [
      {
        name: 'Launch',
        subject: 'Your year-end gift will be MATCHED',
        content: `Dear {{first_name}},

This year, you helped us:
- Win {{victory_count}} campaigns
- Organize {{event_count}} community events
- Train {{volunteer_count}} new leaders

Now, we need your help to finish strong. A generous donor will MATCH every gift until December 31st.

Your donation of $[suggested_amount] becomes $[doubled_amount]: {{donate_link}}

Together, we're building power for change.

{{organization_name}}`
      }
    ],
    steps: [
      { name: 'Plan campaign', description: 'Set goals and create materials', dayOffset: -45 },
      { name: 'Secure matching funds', description: 'Find donors for match campaign', dayOffset: -40 },
      { name: 'Soft launch', description: 'Email major donors first', dayOffset: -35 },
      { name: 'Public launch', description: 'Launch to full list', dayOffset: -30 },
      { name: 'Giving Tuesday', description: 'Special push for Giving Tuesday', dayOffset: -15 },
      { name: 'Final push', description: 'Last chance emails', dayOffset: -3 }
    ]
  },

  {
    id: 'monthly-sustainers',
    name: 'Monthly Sustainer Program',
    description: 'Build recurring revenue through monthly giving',
    category: 'fundraising',
    type: 'donation',
    icon: '💪',
    settings: {
      goal: 100, // new monthly donors
      duration: 60,
      tags: ['monthly', 'sustainers', 'recurring']
    },
    emailTemplates: [
      {
        name: 'Sustainer Ask',
        subject: 'Become a movement sustainer for just ${{amount}}/month',
        content: `Dear {{first_name}},

Real change takes time. That's why we need sustainers like you who are in it for the long haul.

For less than the cost of a coffee each week, you can:
- Keep our organizers in the field
- Support ongoing campaigns
- Build lasting community power

Start your monthly gift: {{sustainer_link}}

Monthly sustainers are the backbone of our movement.

With gratitude,
{{organization_name}}`
      }
    ]
  },

  // Community Organizing
  {
    id: 'neighborhood-cleanup',
    name: 'Community Cleanup Day',
    description: 'Organize neighbors to beautify shared spaces',
    category: 'community',
    type: 'event',
    icon: '🧹',
    settings: {
      goal: 50, // participants
      duration: 30,
      tags: ['community', 'cleanup', 'environment']
    },
    steps: [
      { name: 'Scout locations', description: 'Identify areas needing cleanup', dayOffset: -30 },
      { name: 'Get permits', description: 'Secure necessary permissions', dayOffset: -25 },
      { name: 'Partner outreach', description: 'Connect with local businesses for supplies', dayOffset: -20 },
      { name: 'Volunteer recruitment', description: 'Sign up participants', dayOffset: -15 },
      { name: 'Supply prep', description: 'Gather tools and supplies', dayOffset: -5 },
      { name: 'Event day', description: 'Execute cleanup', dayOffset: 0 }
    ]
  },

  {
    id: 'mutual-aid-network',
    name: 'Mutual Aid Network',
    description: 'Build community support systems',
    category: 'community',
    type: 'email_blast',
    icon: '🤝',
    settings: {
      goal: 200, // network members
      duration: 90,
      tags: ['mutual-aid', 'community', 'solidarity']
    },
    emailTemplates: [
      {
        name: 'Network Launch',
        subject: 'Join our neighborhood mutual aid network',
        content: `Dear neighbor,

In times of crisis and calm, we keep each other safe. We're building a mutual aid network to:

- Share resources and skills
- Support neighbors in need
- Build community resilience

Join us: {{signup_link}}

Together, we thrive.
{{organization_name}}`
      }
    ]
  },

  // Crisis Response
  {
    id: 'rapid-response',
    name: 'Rapid Response Network',
    description: 'Mobilize quickly in response to urgent threats',
    category: 'crisis',
    type: 'phone_bank',
    icon: '🚨',
    settings: {
      goal: 500, // rapid responders
      duration: 7,
      tags: ['rapid-response', 'crisis', 'urgent']
    },
    smsTemplates: [
      {
        name: 'Alert',
        content: 'URGENT: {{crisis_description}}. Take action now: {{action_link}} Reply STOP to opt out.'
      }
    ],
    callScripts: [
      {
        name: 'Rapid Response Call',
        content: `This is an urgent call from {{organization_name}}.

{{crisis_description}}

We need you to:
1. {{action_1}}
2. {{action_2}}
3. {{action_3}}

Can we count on you to take action right now?

For more info: {{info_link}}

Thank you for standing with us.`
      }
    ]
  },

  {
    id: 'disaster-relief',
    name: 'Disaster Relief Coordination',
    description: 'Coordinate community response to natural disasters',
    category: 'crisis',
    type: 'event',
    icon: '🆘',
    settings: {
      goal: 100, // volunteers
      duration: 14,
      tags: ['disaster', 'relief', 'emergency']
    },
    steps: [
      { name: 'Assess needs', description: 'Survey affected areas and residents', dayOffset: 0 },
      { name: 'Set up hub', description: 'Establish coordination center', dayOffset: 1 },
      { name: 'Volunteer mobilization', description: 'Recruit and deploy volunteers', dayOffset: 2 },
      { name: 'Supply distribution', description: 'Coordinate relief supplies', dayOffset: 3 },
      { name: 'Ongoing support', description: 'Maintain operations', dayOffset: 7 }
    ]
  },

  // Education & Training
  {
    id: 'organizer-training',
    name: 'Organizer Training Program',
    description: 'Develop new community leaders',
    category: 'education',
    type: 'event',
    icon: '📚',
    settings: {
      goal: 25, // trainees
      duration: 60,
      tags: ['training', 'leadership', 'education']
    },
    steps: [
      { name: 'Curriculum design', description: 'Develop training materials', dayOffset: -60 },
      { name: 'Recruit trainers', description: 'Line up experienced organizers', dayOffset: -45 },
      { name: 'Open applications', description: 'Launch recruitment', dayOffset: -30 },
      { name: 'Select cohort', description: 'Choose participants', dayOffset: -15 },
      { name: 'Session 1', description: 'Power mapping & campaign planning', dayOffset: 0 },
      { name: 'Session 2', description: 'Base building & outreach', dayOffset: 7 },
      { name: 'Session 3', description: 'Direct action & escalation', dayOffset: 14 },
      { name: 'Session 4', description: 'Digital organizing & comms', dayOffset: 21 },
      { name: 'Graduation', description: 'Celebrate new organizers', dayOffset: 28 }
    ]
  },

  {
    id: 'issue-education',
    name: 'Issue Education Series',
    description: 'Educate community on key issues',
    category: 'education',
    type: 'event',
    icon: '🎓',
    settings: {
      goal: 200, // total attendees
      duration: 90,
      tags: ['education', 'issues', 'community']
    },
    emailTemplates: [
      {
        name: 'Series Announcement',
        subject: 'Join our community education series',
        content: `Dear {{first_name}},

Knowledge is power. Join us for our education series on the issues that matter:

- Session 1: {{topic_1}} ({{date_1}})
- Session 2: {{topic_2}} ({{date_2}})
- Session 3: {{topic_3}} ({{date_3}})

Register for free: {{registration_link}}

Education is the first step toward action.

{{organization_name}}`
      }
    ]
  },

  // Digital Campaigns
  {
    id: 'social-media-storm',
    name: 'Social Media Storm',
    description: 'Coordinate mass digital action',
    category: 'advocacy',
    type: 'social',
    icon: '📱',
    settings: {
      goal: 1000, // posts
      duration: 1,
      tags: ['social-media', 'digital', 'viral']
    },
    smsTemplates: [
      {
        name: 'Storm Alert',
        content: 'SOCIAL MEDIA STORM starting NOW! Post with #{{hashtag}} and tag {{targets}}. Sample posts: {{toolkit_link}}'
      }
    ],
    steps: [
      { name: 'Create toolkit', description: 'Develop graphics and sample posts', dayOffset: -7 },
      { name: 'Recruit participants', description: 'Build digital army', dayOffset: -5 },
      { name: 'Schedule reminder', description: 'Queue up reminder messages', dayOffset: -1 },
      { name: 'Launch storm', description: 'Coordinate mass posting', dayOffset: 0 }
    ]
  },

  {
    id: 'email-your-rep',
    name: 'Email Your Representative',
    description: 'Flood decision-makers with constituent messages',
    category: 'advocacy',
    type: 'email_blast',
    icon: '✉️',
    settings: {
      goal: 5000, // emails sent
      duration: 7,
      tags: ['advocacy', 'email', 'representative']
    },
    emailTemplates: [
      {
        name: 'Action Alert',
        subject: 'URGENT: Email your representative about {{issue}}',
        content: `{{first_name}},

{{representative_name}} needs to hear from you TODAY about {{issue}}.

Take 2 minutes to send a message: {{action_link}}

What's at stake:
- {{stake_1}}
- {{stake_2}}
- {{stake_3}}

Your voice matters. Make it heard.

{{organization_name}}`
      }
    ]
  }
]

export function getCampaignTemplate(id: string): CampaignTemplate | undefined {
  return campaignTemplates.find(t => t.id === id)
}

export function getCampaignTemplatesByCategory(category: string): CampaignTemplate[] {
  return campaignTemplates.filter(t => t.category === category)
}

export function getCampaignTemplatesByType(type: string): CampaignTemplate[] {
  return campaignTemplates.filter(t => t.type === type)
}