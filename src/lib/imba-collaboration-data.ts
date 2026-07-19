import type { ImbaRoleKey } from "@/lib/imba-intelligence-data";

export type ImbaCollaborationView =
  | "collaboration"
  | "collaboration-inbox"
  | "collaboration-workspaces"
  | "collaboration-knowledge"
  | "collaboration-meetings"
  | "communications-inbox"
  | "communications-templates";

export interface CollaborationPost {
  id: string;
  author: string;
  role: string;
  time: string;
  text: string;
  mentions: string[];
  state?: "open" | "decision" | "resolved";
}

export interface CollaborationTask {
  id: string;
  title: string;
  owner: string;
  due: string;
  status: "Open" | "In progress" | "Done";
  source?: string;
}

export interface CollaborationDecision {
  id: string;
  decision: string;
  rationale: string;
  owner: string;
  due: string;
  status: "Proposed" | "Approved" | "Deferred";
}

export interface CollaborationKnowledgePage {
  id: string;
  title: string;
  category: string;
  owner: string;
  updated: string;
  version: number;
  content: string;
  tags: string[];
  access: ImbaRoleKey[];
}

export interface CollaborationRoom {
  id: string;
  name: string;
  kind: "Project" | "Grant" | "Chapter network";
  summary: string;
  owner: string;
  status: string;
  financialContext: string;
  members: string[];
  access: ImbaRoleKey[];
  posts: CollaborationPost[];
  tasks: CollaborationTask[];
  decisions: CollaborationDecision[];
  knowledgePageId: string;
  files: Array<{ name: string; type: string; source: string; status: string }>;
}

export interface CollaborationMeeting {
  id: string;
  title: string;
  date: string;
  owner: string;
  participants: string[];
  linkedRoomId: string;
  agenda: string[];
  notes: string;
  status: "Upcoming" | "Notes open" | "Complete";
  decisions: CollaborationDecision[];
  tasks: CollaborationTask[];
}

export interface StakeholderMessage {
  id: string;
  stakeholder: string;
  group: "Client" | "Chapter" | "Funder" | "Member" | "Board";
  subject: string;
  context: string;
  linkedRecord: string;
  owner: string;
  due: string;
  status: "Needs response" | "Assigned" | "Drafting" | "Ready" | "Closed";
  financialEffect: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  audience: string;
  owner: string;
  status: "Approved" | "Review due" | "Draft";
  lastReview: string;
  usage: number;
  subject: string;
  body: string;
}

export const initialCollaborationKnowledge: CollaborationKnowledgePage[] = [
  {
    id: "KB-GL-01",
    title: "Great Lakes Buildout · working brief",
    category: "Project workspace",
    owner: "Construction PM",
    updated: "Jul 17 · 9:40 AM",
    version: 6,
    content:
      "Purpose\nDeliver the approved Great Lakes construction scope while protecting the client start window and IMBA contribution target.\n\nCurrent position\nDelivery is 79% complete. Equipment and closeout assumptions require executive confirmation before the next cash commitment.\n\nOperating rules\n• All scope changes require a documented client decision.\n• Remaining cost is refreshed weekly.\n• Billing acceptance is linked before invoice release.\n• Decisions retain rationale, owner, and next milestone.",
    tags: ["project", "construction", "EAC", "billing"],
    access: ["executive", "finance", "trail-solutions"],
  },
  {
    id: "KB-GR-01",
    title: "Evergreen Trails Foundation · award guide",
    category: "Grant workspace",
    owner: "Grant Finance",
    updated: "Jul 16 · 3:20 PM",
    version: 4,
    content:
      "Award purpose\nSupport community planning and fieldwork under the approved foundation grant scope.\n\nControl requirements\n• Labor must carry project, grant, and function codes.\n• Reimbursement support is certified before submission.\n• Program outcomes and financial periods must reconcile.\n• Unallowable or unsupported costs remain outside the draw.",
    tags: ["grant", "foundation", "restrictions", "reimbursement"],
    access: ["executive", "finance", "development"],
  },
  {
    id: "KB-CH-01",
    title: "Chapter monthly reporting standard",
    category: "Chapter network",
    owner: "Network Finance",
    updated: "Jul 15 · 1:05 PM",
    version: 8,
    content:
      "Monthly standard\nEvery participating chapter submits the canonical financial packet by the final business day of the month.\n\nRequired packet\n• Bank and processor reconciliation\n• Restricted-fund roll-forward\n• Membership settlement confirmation\n• Material commitments and exceptions\n• Officer certification\n\nExceptions enter the remediation queue and do not contaminate consolidated reporting.",
    tags: ["chapters", "uniformity", "compliance", "reporting"],
    access: ["executive", "finance", "trail-solutions", "development"],
  },
  {
    id: "KB-ORG-01",
    title: "How IMBA-OS collaboration works",
    category: "Operating system",
    owner: "System Administrator",
    updated: "Jul 17 · 11:00 AM",
    version: 2,
    content:
      "IMBA-OS collaboration keeps discussion attached to the project, grant, chapter, or decision it concerns. Slack or Teams can remain the conversational system; Notion, SharePoint, or another document platform can remain the authoring system. IMBA-OS retains canonical links, responsibilities, decisions, and audit evidence.",
    tags: ["collaboration", "governance", "Slack", "Notion"],
    access: ["executive", "finance", "trail-solutions", "development", "board"],
  },
];

export const initialCollaborationRooms: CollaborationRoom[] = [
  {
    id: "ROOM-GL",
    name: "Great Lakes Buildout",
    kind: "Project",
    summary:
      "Delivery, equipment commitment, client acceptance, billing, and remaining-cost decisions.",
    owner: "Construction PM",
    status: "Decision required",
    financialContext:
      "$1.24M contract · 79% delivered · 8.5% forecast contribution",
    members: ["Kent", "Finance", "Construction PM", "Project Lead"],
    access: ["executive", "finance", "trail-solutions"],
    knowledgePageId: "KB-GL-01",
    posts: [
      {
        id: "POST-GL-1",
        author: "Avery Chen",
        role: "Construction PM",
        time: "9:16 AM",
        text: "The updated EAC includes the equipment reserve and closeout crew. We need a release decision before Friday to preserve the August mobilization window.",
        mentions: ["Kent", "Finance"],
        state: "decision",
      },
      {
        id: "POST-GL-2",
        author: "Finance",
        role: "Finance",
        time: "9:42 AM",
        text: "The staged purchase protects roughly $185K of downside cash. Recommendation: release long-lead items now and hold the balance until the second start is executed.",
        mentions: ["Kent"],
        state: "open",
      },
      {
        id: "POST-GL-3",
        author: "Kent",
        role: "Executive",
        time: "10:05 AM",
        text: "Keep the staged approach. Please link the client start confirmation and bring the remaining release back as a single decision.",
        mentions: ["Avery Chen"],
        state: "resolved",
      },
    ],
    tasks: [
      {
        id: "TASK-GL-1",
        title: "Attach client start confirmation",
        owner: "Project Lead",
        due: "Jul 19",
        status: "In progress",
      },
      {
        id: "TASK-GL-2",
        title: "Validate remaining equipment commitment",
        owner: "Finance",
        due: "Jul 19",
        status: "Open",
      },
      {
        id: "TASK-GL-3",
        title: "Refresh EAC after release decision",
        owner: "Construction PM",
        due: "Jul 22",
        status: "Open",
      },
    ],
    decisions: [
      {
        id: "DEC-GL-1",
        decision: "Stage the equipment purchase",
        rationale:
          "Protect the mobilization window without committing the full downside cash exposure.",
        owner: "Kent + Trail Solutions",
        due: "Jul 19",
        status: "Approved",
      },
    ],
    files: [
      {
        name: "Executed construction agreement",
        type: "Contract",
        source: "Governance vault",
        status: "Current",
      },
      {
        name: "EAC · week 29",
        type: "Forecast",
        source: "Project command",
        status: "Certified",
      },
      {
        name: "Equipment quote",
        type: "Commitment",
        source: "AP staging",
        status: "Decision hold",
      },
    ],
  },
  {
    id: "ROOM-GR",
    name: "Evergreen Trails Foundation",
    kind: "Grant",
    summary:
      "Restrictions, allowable cost, reimbursement package, outcome narrative, and funder commitments.",
    owner: "Grant Finance",
    status: "Draw in preparation",
    financialContext:
      "$640K award · $188K remaining · $74K reimbursement pending",
    members: ["Finance", "Development", "Program Owner"],
    access: ["executive", "finance", "development"],
    knowledgePageId: "KB-GR-01",
    posts: [
      {
        id: "POST-GR-1",
        author: "Grant Finance",
        role: "Finance",
        time: "Yesterday",
        text: "Payroll support is reconciled. The package still needs the fieldwork outcome narrative and two subcontractor invoices.",
        mentions: ["Program Owner", "Development"],
        state: "open",
      },
      {
        id: "POST-GR-2",
        author: "Morgan Lee",
        role: "Development",
        time: "Yesterday",
        text: "I drafted the funder-facing narrative from the program notes. Please confirm that the reporting period matches the financial draw.",
        mentions: ["Grant Finance"],
        state: "open",
      },
    ],
    tasks: [
      {
        id: "TASK-GR-1",
        title: "Approve outcome narrative",
        owner: "Program Owner",
        due: "Jul 22",
        status: "Open",
      },
      {
        id: "TASK-GR-2",
        title: "Attach subcontractor invoices",
        owner: "Grant Finance",
        due: "Jul 22",
        status: "In progress",
      },
    ],
    decisions: [
      {
        id: "DEC-GR-1",
        decision:
          "Hold submission until narrative and financial period reconcile",
        rationale:
          "Funder outcome claims must align to costs included in the reimbursement.",
        owner: "Grant Finance",
        due: "Jul 24",
        status: "Approved",
      },
    ],
    files: [
      {
        name: "Executed award agreement",
        type: "Grant",
        source: "Governance vault",
        status: "Current",
      },
      {
        name: "Reimbursement package · draft 4",
        type: "Draw",
        source: "Grant tracking",
        status: "Review",
      },
    ],
  },
  {
    id: "ROOM-CH",
    name: "Chapter Monthly Reporting",
    kind: "Chapter network",
    summary:
      "Uniform packet submission, mapping exceptions, member settlements, support, and remediation.",
    owner: "Network Finance",
    status: "87% received",
    financialContext:
      "26 participating chapters · 3 late · 2 mapping exceptions",
    members: ["Network Finance", "Chapter Support", "Development"],
    access: ["executive", "finance", "trail-solutions", "development"],
    knowledgePageId: "KB-CH-01",
    posts: [
      {
        id: "POST-CH-1",
        author: "Network Finance",
        role: "Finance",
        time: "8:42 AM",
        text: "High Desert submitted on time, but two restricted-fund lines do not map to the canonical chapter standard. The packet is isolated from consolidation.",
        mentions: ["Chapter Support"],
        state: "open",
      },
      {
        id: "POST-CH-2",
        author: "Chapter Support",
        role: "Network",
        time: "9:08 AM",
        text: "Working session scheduled with their treasurer. I linked the correction guide and assigned the remapping task.",
        mentions: ["Network Finance"],
        state: "open",
      },
    ],
    tasks: [
      {
        id: "TASK-CH-1",
        title: "Remap High Desert restricted funds",
        owner: "Chapter Support",
        due: "Jul 19",
        status: "In progress",
      },
      {
        id: "TASK-CH-2",
        title: "Contact three late chapters",
        owner: "Network Finance",
        due: "Today",
        status: "Open",
      },
    ],
    decisions: [
      {
        id: "DEC-CH-1",
        decision: "Do not consolidate failed chapter mappings",
        rationale:
          "Uniformity requires exceptions to remain visible and isolated until corrected.",
        owner: "Finance",
        due: "Standing rule",
        status: "Approved",
      },
    ],
    files: [
      {
        name: "Chapter reporting template",
        type: "Template",
        source: "Knowledge hub",
        status: "Current",
      },
      {
        name: "July exception register",
        type: "Control",
        source: "Data exchange",
        status: "Open",
      },
    ],
  },
];

export const initialCollaborationMeetings: CollaborationMeeting[] = [
  {
    id: "MTG-01",
    title: "Trail Solutions portfolio review",
    date: "Jul 22 · 10:00 AM",
    owner: "Finance + Trail Solutions",
    participants: ["Kent", "Finance", "Planning", "Design", "Construction"],
    linkedRoomId: "ROOM-GL",
    agenda: [
      "Portfolio EAC changes",
      "Billing lag",
      "Equipment release",
      "Capacity gates",
    ],
    notes:
      "Bring only exceptions, material changes, and decisions. Supporting project records remain linked in IMBA-OS.",
    status: "Upcoming",
    decisions: [],
    tasks: [],
  },
  {
    id: "MTG-02",
    title: "Grant draw certification",
    date: "Jul 24 · 2:00 PM",
    owner: "Grant Finance",
    participants: ["Finance", "Development", "Program Owner"],
    linkedRoomId: "ROOM-GR",
    agenda: [
      "Allowable cost certification",
      "Narrative reconciliation",
      "Submission approval",
    ],
    notes:
      "Package remains on hold until both narrative evidence and final invoices are present.",
    status: "Notes open",
    decisions: [
      {
        id: "DEC-MTG-1",
        decision: "Use a single reporting period across narrative and draw",
        rationale: "Eliminates unsupported outcome claims and period mismatch.",
        owner: "Grant Finance",
        due: "Jul 24",
        status: "Approved",
      },
    ],
    tasks: [],
  },
];

export const initialStakeholderMessages: StakeholderMessage[] = [
  {
    id: "MSG-778",
    stakeholder: "High Desert County",
    group: "Client",
    subject: "Design milestone acceptance",
    context: "Obtain acceptance so Finance can release the design invoice.",
    linkedRecord: "High Desert Trail System",
    owner: "Project Lead",
    due: "Today",
    status: "Needs response",
    financialEffect: "$178K billing trigger",
  },
  {
    id: "MSG-781",
    stakeholder: "Blue Ridge Trail Coalition",
    group: "Chapter",
    subject: "Restricted-cash roll-forward",
    context:
      "Clarify the chapter packet and complete the monthly certification.",
    linkedRecord: "Chapter Monthly Reporting",
    owner: "Network Finance",
    due: "Jul 31",
    status: "Assigned",
    financialEffect: "Consolidation dependency",
  },
  {
    id: "MSG-786",
    stakeholder: "Outdoor Access Foundation",
    group: "Funder",
    subject: "Outcome report request",
    context: "Program outcomes must reconcile to the grant financial period.",
    linkedRecord: "Grant Tracking",
    owner: "Development",
    due: "Aug 15",
    status: "Drafting",
    financialEffect: "$240K stewardship relationship",
  },
  {
    id: "MSG-790",
    stakeholder: "Finance Committee Chair",
    group: "Board",
    subject: "Cash forecast assumptions",
    context:
      "Provide the scenario bridge and assumptions behind the projected trough.",
    linkedRecord: "Liquidity Runway",
    owner: "Finance",
    due: "Friday",
    status: "Ready",
    financialEffect: "Board oversight",
  },
];

export const initialCommunicationTemplates: CommunicationTemplate[] = [
  {
    id: "TPL-014",
    name: "Project milestone invoice",
    audience: "Client",
    owner: "Finance",
    status: "Approved",
    lastReview: "Jun 2026",
    usage: 42,
    subject: "{{project}} milestone acceptance and invoice",
    body: "Hello {{client}},\n\nThe {{milestone}} milestone for {{project}} has been accepted. The approved invoice of {{amount}} is attached with supporting acceptance evidence.\n\nOwner: {{owner}} · Due: {{due_date}}",
  },
  {
    id: "TPL-021",
    name: "Chapter exception notice",
    audience: "Chapter",
    owner: "Network Finance",
    status: "Approved",
    lastReview: "May 2026",
    usage: 18,
    subject: "Action required: {{chapter}} reporting exception",
    body: "Your monthly packet contains the following exception: {{exception}}. Please complete {{required_action}} by {{due_date}}. Support owner: {{owner}}.",
  },
  {
    id: "TPL-026",
    name: "Grant report request",
    audience: "Program owner",
    owner: "Development",
    status: "Review due",
    lastReview: "Jan 2026",
    usage: 11,
    subject: "{{grant}} outcome narrative due {{internal_due}}",
    body: "Please provide outcomes for the financial reporting period {{period}} using the linked evidence checklist. Finance owner: {{finance_owner}}.",
  },
  {
    id: "TPL-031",
    name: "Board decision follow-up",
    audience: "Board + leadership",
    owner: "Board Secretary",
    status: "Approved",
    lastReview: "Jul 2026",
    usage: 9,
    subject: "Decision recorded: {{decision}}",
    body: "Decision: {{decision}}\nRationale: {{rationale}}\nOwner: {{owner}}\nMilestone: {{milestone}}\nNext reporting point: {{next_review}}",
  },
];
