export interface PathwayTemplate {
  id: string
  name: string
  description: string
  category: 'volunteer' | 'leadership' | 'skills' | 'engagement' | 'advocacy' | 'electoral'
  icon: string
  estimatedDuration: string // e.g., "3 months", "6 weeks"
  settings: {
    tags: string[]
    requirements?: string[]
  }
  steps: Array<{
    name: string
    description: string
    type: 'action' | 'training' | 'milestone' | 'assignment'
    requirements?: string[]
    resources?: Array<{
      name: string
      type: 'document' | 'video' | 'link' | 'training'
      url?: string
    }>
    estimatedTime?: string
  }>
}

export const pathwayTemplates: PathwayTemplate[] = [
  // Volunteer Development Pathways
  {
    id: 'new-volunteer-onboarding',
    name: 'New Volunteer Onboarding',
    description: 'Welcome and integrate new volunteers into your organization',
    category: 'volunteer',
    icon: '👋',
    estimatedDuration: '2 weeks',
    settings: {
      tags: ['onboarding', 'volunteer', 'orientation'],
      requirements: ['Completed volunteer application', 'Background check (if required)']
    },
    steps: [
      {
        name: 'Welcome & Orientation',
        description: 'Introduction to organization mission, values, and structure',
        type: 'training',
        estimatedTime: '2 hours',
        resources: [
          { name: 'Organization Overview', type: 'document' },
          { name: 'Volunteer Handbook', type: 'document' },
          { name: 'Welcome Video', type: 'video' }
        ]
      },
      {
        name: 'Tools & Systems Training',
        description: 'Learn how to use organizational tools and communication systems',
        type: 'training',
        estimatedTime: '1 hour',
        resources: [
          { name: 'Platform Tutorial', type: 'video' },
          { name: 'Communication Guidelines', type: 'document' }
        ]
      },
      {
        name: 'Shadow Experience',
        description: 'Shadow an experienced volunteer on a typical activity',
        type: 'assignment',
        estimatedTime: '3 hours',
        requirements: ['Paired with mentor volunteer']
      },
      {
        name: 'First Assignment',
        description: 'Complete your first independent volunteer task',
        type: 'action',
        estimatedTime: '2-4 hours'
      },
      {
        name: 'Check-in & Feedback',
        description: 'Meet with volunteer coordinator to discuss experience',
        type: 'milestone',
        estimatedTime: '30 minutes'
      }
    ]
  },

  {
    id: 'volunteer-to-leader',
    name: 'Volunteer to Team Leader',
    description: 'Develop volunteers into team leaders who can coordinate others',
    category: 'leadership',
    icon: '🚀',
    estimatedDuration: '3 months',
    settings: {
      tags: ['leadership', 'advancement', 'team-lead'],
      requirements: ['6+ months as active volunteer', 'Completed 20+ volunteer hours']
    },
    steps: [
      {
        name: 'Leadership Fundamentals',
        description: 'Core leadership skills for organizing',
        type: 'training',
        estimatedTime: '4 hours',
        resources: [
          { name: 'Leadership 101 Workshop', type: 'training' },
          { name: 'Organizing Principles', type: 'document' }
        ]
      },
      {
        name: 'Project Management Training',
        description: 'Learn to plan and execute organizing projects',
        type: 'training',
        estimatedTime: '3 hours',
        resources: [
          { name: 'Project Planning Template', type: 'document' },
          { name: 'Campaign Timeline Guide', type: 'document' }
        ]
      },
      {
        name: 'Co-lead a Project',
        description: 'Partner with experienced leader on a campaign or event',
        type: 'assignment',
        estimatedTime: '20 hours over 4 weeks',
        requirements: ['Assigned mentor', 'Active project available']
      },
      {
        name: 'Recruitment Training',
        description: 'Learn to recruit and onboard new volunteers',
        type: 'training',
        estimatedTime: '2 hours',
        resources: [
          { name: 'Recruitment Best Practices', type: 'document' },
          { name: 'One-on-One Guide', type: 'document' }
        ]
      },
      {
        name: 'Lead First Team',
        description: 'Lead a small team on a specific project',
        type: 'milestone',
        estimatedTime: '30+ hours',
        requirements: ['3-5 team members assigned', 'Project plan approved']
      },
      {
        name: 'Leadership Assessment',
        description: 'Review performance and plan next steps',
        type: 'milestone',
        estimatedTime: '1 hour'
      }
    ]
  },

  // Skills Development Pathways
  {
    id: 'digital-organizer',
    name: 'Digital Organizer Certification',
    description: 'Master digital tools and tactics for modern organizing',
    category: 'skills',
    icon: '💻',
    estimatedDuration: '6 weeks',
    settings: {
      tags: ['digital', 'skills', 'social-media', 'tech']
    },
    steps: [
      {
        name: 'Digital Strategy Basics',
        description: 'Understanding digital organizing in overall strategy',
        type: 'training',
        estimatedTime: '2 hours',
        resources: [
          { name: 'Digital Strategy Guide', type: 'document' },
          { name: 'Platform Overview', type: 'video' }
        ]
      },
      {
        name: 'Social Media Mastery',
        description: 'Effective use of social platforms for organizing',
        type: 'training',
        estimatedTime: '3 hours',
        resources: [
          { name: 'Social Media Playbook', type: 'document' },
          { name: 'Content Calendar Template', type: 'document' }
        ]
      },
      {
        name: 'Email & SMS Campaigns',
        description: 'Build and execute email and text message campaigns',
        type: 'training',
        estimatedTime: '2 hours',
        resources: [
          { name: 'Email Best Practices', type: 'document' },
          { name: 'SMS Compliance Guide', type: 'document' }
        ]
      },
      {
        name: 'Data & Analytics',
        description: 'Use data to improve organizing effectiveness',
        type: 'training',
        estimatedTime: '2 hours',
        resources: [
          { name: 'Analytics Dashboard Tutorial', type: 'video' },
          { name: 'Metrics That Matter', type: 'document' }
        ]
      },
      {
        name: 'Digital Security',
        description: 'Protect yourself and your community online',
        type: 'training',
        estimatedTime: '1.5 hours',
        resources: [
          { name: 'Digital Security Checklist', type: 'document' },
          { name: 'Secure Communications Guide', type: 'document' }
        ]
      },
      {
        name: 'Run Digital Campaign',
        description: 'Plan and execute a full digital campaign',
        type: 'milestone',
        estimatedTime: '20 hours',
        requirements: ['Campaign plan approved', 'Metrics goals set']
      }
    ]
  },

  {
    id: 'field-organizer',
    name: 'Field Organizer Training',
    description: 'Become an expert at door-to-door and face-to-face organizing',
    category: 'skills',
    icon: '🚪',
    estimatedDuration: '4 weeks',
    settings: {
      tags: ['field', 'canvassing', 'direct-contact']
    },
    steps: [
      {
        name: 'Canvassing Fundamentals',
        description: 'Learn effective door-knocking techniques',
        type: 'training',
        estimatedTime: '3 hours',
        resources: [
          { name: 'Canvassing Script Templates', type: 'document' },
          { name: 'Door Knocking Best Practices', type: 'video' }
        ]
      },
      {
        name: 'Turf Cutting & Targeting',
        description: 'Identify and prioritize areas for outreach',
        type: 'training',
        estimatedTime: '2 hours',
        resources: [
          { name: 'Turf Cutting Guide', type: 'document' },
          { name: 'Voter File Training', type: 'video' }
        ]
      },
      {
        name: 'Practice Canvass',
        description: 'Shadow experienced canvasser and practice',
        type: 'assignment',
        estimatedTime: '4 hours',
        requirements: ['Paired with experienced canvasser']
      },
      {
        name: 'Data Entry & Reporting',
        description: 'Accurately track and report field contacts',
        type: 'training',
        estimatedTime: '1 hour',
        resources: [
          { name: 'Data Entry Standards', type: 'document' },
          { name: 'Mobile App Tutorial', type: 'video' }
        ]
      },
      {
        name: 'Lead Canvass Shift',
        description: 'Coordinate a canvass shift with 3-5 volunteers',
        type: 'milestone',
        estimatedTime: '5 hours',
        requirements: ['Turf packets prepared', 'Volunteers recruited']
      }
    ]
  },

  // Engagement Pathways
  {
    id: 'supporter-to-activist',
    name: 'Supporter to Activist Journey',
    description: 'Move supporters up the ladder of engagement',
    category: 'engagement',
    icon: '📈',
    estimatedDuration: '2 months',
    settings: {
      tags: ['engagement', 'activation', 'ladder']
    },
    steps: [
      {
        name: 'Issue Education',
        description: 'Deepen understanding of key issues',
        type: 'training',
        estimatedTime: '3 hours',
        resources: [
          { name: 'Issue Briefings', type: 'document' },
          { name: 'Expert Webinars', type: 'video' }
        ]
      },
      {
        name: 'First Action',
        description: 'Take a simple online action',
        type: 'action',
        estimatedTime: '15 minutes',
        requirements: ['Signed petition or contacted representative']
      },
      {
        name: 'Event Attendance',
        description: 'Attend an organizing meeting or event',
        type: 'action',
        estimatedTime: '2 hours',
        requirements: ['RSVP and attend event']
      },
      {
        name: 'Skill Building',
        description: 'Develop specific organizing skills',
        type: 'training',
        estimatedTime: '4 hours',
        resources: [
          { name: 'Choose Your Skill Track', type: 'document' }
        ]
      },
      {
        name: 'Peer Outreach',
        description: 'Recruit friends or family to take action',
        type: 'action',
        estimatedTime: '2 hours',
        requirements: ['Recruit 3+ new supporters']
      },
      {
        name: 'Campaign Role',
        description: 'Take on specific role in active campaign',
        type: 'milestone',
        estimatedTime: 'Ongoing',
        requirements: ['Committed to specific campaign role']
      }
    ]
  },

  {
    id: 'member-leader-pipeline',
    name: 'Member Leadership Pipeline',
    description: 'Systematic development of member leaders',
    category: 'leadership',
    icon: '🎯',
    estimatedDuration: '6 months',
    settings: {
      tags: ['leadership', 'member-led', 'development'],
      requirements: ['Active member for 3+ months']
    },
    steps: [
      {
        name: 'Leadership Interest Meeting',
        description: 'Explore leadership opportunities and commitments',
        type: 'milestone',
        estimatedTime: '1 hour'
      },
      {
        name: 'Core Training Series',
        description: 'Complete foundational leadership training',
        type: 'training',
        estimatedTime: '16 hours over 4 weeks',
        resources: [
          { name: 'Power & Strategy', type: 'training' },
          { name: 'Building Teams', type: 'training' },
          { name: 'Running Campaigns', type: 'training' },
          { name: 'Sustaining Movements', type: 'training' }
        ]
      },
      {
        name: 'Committee Participation',
        description: 'Join and actively participate in a committee',
        type: 'assignment',
        estimatedTime: '2 hours/week for 8 weeks',
        requirements: ['Committee assignment']
      },
      {
        name: 'Lead a Project',
        description: 'Design and lead a member-driven project',
        type: 'milestone',
        estimatedTime: '40 hours',
        requirements: ['Project proposal approved', 'Team recruited']
      },
      {
        name: 'Mentor New Members',
        description: 'Support onboarding of 3-5 new members',
        type: 'assignment',
        estimatedTime: '10 hours',
        requirements: ['Mentor training completed']
      },
      {
        name: 'Leadership Role',
        description: 'Elected or appointed to formal leadership position',
        type: 'milestone',
        estimatedTime: 'Ongoing'
      }
    ]
  },

  // Advocacy Pathways
  {
    id: 'policy-advocate',
    name: 'Policy Advocate Training',
    description: 'Become effective at policy advocacy and lobbying',
    category: 'advocacy',
    icon: '📜',
    estimatedDuration: '8 weeks',
    settings: {
      tags: ['policy', 'advocacy', 'lobbying']
    },
    steps: [
      {
        name: 'Policy Process 101',
        description: 'Understand how policy is made at different levels',
        type: 'training',
        estimatedTime: '3 hours',
        resources: [
          { name: 'How Laws Are Made', type: 'document' },
          { name: 'Power Mapping Guide', type: 'document' }
        ]
      },
      {
        name: 'Research & Analysis',
        description: 'Learn to research and analyze policy proposals',
        type: 'training',
        estimatedTime: '4 hours',
        resources: [
          { name: 'Policy Research Tools', type: 'document' },
          { name: 'Writing Policy Briefs', type: 'document' }
        ]
      },
      {
        name: 'Lobby Visit Training',
        description: 'Prepare for effective legislator meetings',
        type: 'training',
        estimatedTime: '2 hours',
        resources: [
          { name: 'Lobby Visit Checklist', type: 'document' },
          { name: 'Making the Ask', type: 'video' }
        ]
      },
      {
        name: 'First Lobby Visit',
        description: 'Participate in a legislator meeting',
        type: 'action',
        estimatedTime: '3 hours',
        requirements: ['Meeting scheduled', 'Talking points prepared']
      },
      {
        name: 'Coalition Building',
        description: 'Build relationships with allied organizations',
        type: 'assignment',
        estimatedTime: '10 hours',
        resources: [
          { name: 'Coalition Mapping Tool', type: 'document' }
        ]
      },
      {
        name: 'Lead Advocacy Campaign',
        description: 'Coordinate advocacy on specific policy',
        type: 'milestone',
        estimatedTime: '40+ hours',
        requirements: ['Campaign plan', 'Coalition support']
      }
    ]
  },

  {
    id: 'community-spokesperson',
    name: 'Community Spokesperson Development',
    description: 'Become a powerful voice for your community',
    category: 'advocacy',
    icon: '🎤',
    estimatedDuration: '10 weeks',
    settings: {
      tags: ['media', 'spokesperson', 'storytelling']
    },
    steps: [
      {
        name: 'Storytelling Workshop',
        description: 'Craft and practice your personal story',
        type: 'training',
        estimatedTime: '4 hours',
        resources: [
          { name: 'Story of Self, Us, Now', type: 'document' },
          { name: 'Storytelling Examples', type: 'video' }
        ]
      },
      {
        name: 'Media Training',
        description: 'Learn to work effectively with media',
        type: 'training',
        estimatedTime: '3 hours',
        resources: [
          { name: 'Media Interview Tips', type: 'document' },
          { name: 'Bridging Techniques', type: 'video' }
        ]
      },
      {
        name: 'Public Speaking Practice',
        description: 'Practice speaking at events and rallies',
        type: 'assignment',
        estimatedTime: '6 hours',
        requirements: ['3 practice speeches delivered']
      },
      {
        name: 'Social Media Voice',
        description: 'Develop authentic social media presence',
        type: 'training',
        estimatedTime: '2 hours',
        resources: [
          { name: 'Social Media Voice Guide', type: 'document' }
        ]
      },
      {
        name: 'First Media Appearance',
        description: 'Complete first interview or public statement',
        type: 'milestone',
        estimatedTime: '2 hours',
        requirements: ['Media opportunity identified', 'Talking points prepared']
      },
      {
        name: 'Spokesperson Role',
        description: 'Serve as regular spokesperson on key issue',
        type: 'milestone',
        estimatedTime: 'Ongoing',
        requirements: ['Media list developed', 'Regular opportunities']
      }
    ]
  },

  // Electoral Pathways
  {
    id: 'campaign-volunteer',
    name: 'Campaign Volunteer Pathway',
    description: 'Get involved in electoral campaigns',
    category: 'electoral',
    icon: '🗳️',
    estimatedDuration: 'Election cycle',
    settings: {
      tags: ['electoral', 'campaign', 'GOTV']
    },
    steps: [
      {
        name: 'Campaign Orientation',
        description: 'Learn about the candidate and campaign plan',
        type: 'training',
        estimatedTime: '2 hours',
        resources: [
          { name: 'Candidate Platform', type: 'document' },
          { name: 'Campaign Timeline', type: 'document' }
        ]
      },
      {
        name: 'Voter Contact Training',
        description: 'Learn phone banking and canvassing',
        type: 'training',
        estimatedTime: '2 hours',
        resources: [
          { name: 'Voter Contact Scripts', type: 'document' },
          { name: 'Persuasion Techniques', type: 'video' }
        ]
      },
      {
        name: 'Weekend of Action',
        description: 'Participate in major volunteer push',
        type: 'action',
        estimatedTime: '8 hours',
        requirements: ['Completed 50+ voter contacts']
      },
      {
        name: 'Bring a Friend',
        description: 'Recruit new volunteers to the campaign',
        type: 'action',
        estimatedTime: '2 hours',
        requirements: ['Recruited 2+ new volunteers']
      },
      {
        name: 'GOTV Captain',
        description: 'Lead Get Out The Vote efforts in your area',
        type: 'milestone',
        estimatedTime: '20 hours',
        requirements: ['Turf assignment', 'Team of 5+ volunteers']
      }
    ]
  },

  {
    id: 'precinct-captain',
    name: 'Precinct Captain Development',
    description: 'Become a neighborhood political leader',
    category: 'electoral',
    icon: '🏘️',
    estimatedDuration: '4 months',
    settings: {
      tags: ['precinct', 'electoral', 'neighborhood'],
      requirements: ['Registered voter', 'Live in precinct']
    },
    steps: [
      {
        name: 'Precinct Analysis',
        description: 'Understand your precinct voting patterns and demographics',
        type: 'training',
        estimatedTime: '3 hours',
        resources: [
          { name: 'Precinct Data Packet', type: 'document' },
          { name: 'Voter File Access', type: 'document' }
        ]
      },
      {
        name: 'Neighbor Outreach Plan',
        description: 'Develop strategy to reach every household',
        type: 'assignment',
        estimatedTime: '4 hours',
        resources: [
          { name: 'Outreach Planning Tool', type: 'document' }
        ]
      },
      {
        name: 'Build Precinct Team',
        description: 'Recruit 5-10 neighbors as block captains',
        type: 'action',
        estimatedTime: '20 hours',
        requirements: ['Team recruitment goals']
      },
      {
        name: 'Voter Registration Drive',
        description: 'Register new voters in your precinct',
        type: 'action',
        estimatedTime: '10 hours',
        requirements: ['Register 20+ new voters']
      },
      {
        name: 'Precinct Meeting',
        description: 'Host meeting for precinct voters',
        type: 'milestone',
        estimatedTime: '5 hours',
        requirements: ['20+ attendees', 'Candidate appearance']
      },
      {
        name: 'Election Day Operations',
        description: 'Coordinate precinct GOTV on election day',
        type: 'milestone',
        estimatedTime: '14 hours',
        requirements: ['Poll coverage plan', 'GOTV team ready']
      }
    ]
  }
]

export function getPathwayTemplate(id: string): PathwayTemplate | undefined {
  return pathwayTemplates.find(t => t.id === id)
}

export function getPathwayTemplatesByCategory(category: string): PathwayTemplate[] {
  return pathwayTemplates.filter(t => t.category === category)
}