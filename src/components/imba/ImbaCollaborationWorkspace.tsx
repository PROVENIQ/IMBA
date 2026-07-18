"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  AtSign,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Hash,
  Inbox,
  MessageSquare,
  Network,
  NotebookPen,
  Plus,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  initialCollaborationKnowledge,
  initialCollaborationMeetings,
  initialCollaborationRooms,
  initialCommunicationTemplates,
  initialStakeholderMessages,
  type CollaborationKnowledgePage,
  type CollaborationMeeting,
  type CollaborationRoom,
  type CommunicationTemplate,
  type ImbaCollaborationView,
  type StakeholderMessage,
} from "@/lib/imba-collaboration-data";
import {
  imbaRoleProfiles,
  type ImbaRoleKey,
} from "@/lib/imba-intelligence-data";
import type { ImbaOsView } from "@/lib/imba-os-data";

type RoomTab = "Discussion" | "Tasks" | "Knowledge" | "Decisions" | "Files";

interface CollaborationStore {
  version: 1;
  rooms: CollaborationRoom[];
  knowledge: CollaborationKnowledgePage[];
  meetings: CollaborationMeeting[];
  messages: StakeholderMessage[];
  templates: CommunicationTemplate[];
}

const storageKey = "imba-os-collaboration-v1";
const initialStore: CollaborationStore = {
  version: 1,
  rooms: initialCollaborationRooms,
  knowledge: initialCollaborationKnowledge,
  meetings: initialCollaborationMeetings,
  messages: initialStakeholderMessages,
  templates: initialCommunicationTemplates,
};

const viewMeta: Record<
  ImbaCollaborationView,
  { eyebrow: string; title: string; description: string }
> = {
  collaboration: {
    eyebrow: "Collaboration · control plane",
    title: "Context, conversation, and institutional memory",
    description:
      "Slack-like threads and Notion-like knowledge remain attached to IMBA projects, grants, chapters, commitments, and decisions.",
  },
  "collaboration-inbox": {
    eyebrow: "Collaboration · my work",
    title: "My inbox",
    description:
      "Mentions, assignments, decisions, and external commitments that require attention—without monitoring every room.",
  },
  "collaboration-workspaces": {
    eyebrow: "Collaboration · contextual rooms",
    title: "Team workspaces",
    description:
      "Every important record carries its discussion, tasks, knowledge, files, decisions, and financial context.",
  },
  "collaboration-knowledge": {
    eyebrow: "Collaboration · institutional memory",
    title: "Knowledge hub",
    description:
      "Living pages, standards, runbooks, and lessons learned with ownership, versions, access, and linked operating records.",
  },
  "collaboration-meetings": {
    eyebrow: "Collaboration · governed follow-through",
    title: "Meetings + decisions",
    description:
      "Turn agendas and notes into explicit decisions, assignments, deadlines, and durable evidence.",
  },
  "communications-inbox": {
    eyebrow: "Collaboration · external commitments",
    title: "Stakeholder inbox",
    description:
      "Route client, chapter, funder, member, and Board messages into owned work with financial and compliance context.",
  },
  "communications-templates": {
    eyebrow: "Collaboration · controlled language",
    title: "Message templates",
    description:
      "Approved, versioned language for high-consequence client, chapter, funder, Board, and finance communication.",
  },
};

function identifier(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

function timestamp() {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[22px] border border-white/[0.08] bg-[#111b1a]/90 ${className}`}
    >
      {children}
    </section>
  );
}

function Heading({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#718981]">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-base font-semibold text-white">{title}</h3>
        {detail ? (
          <p className="mt-1 text-[9px] text-[#718981]">{detail}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function Kpi({
  label,
  value,
  note,
  tone = "indigo",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "indigo" | "lime" | "amber" | "rose";
}) {
  const color =
    tone === "lime"
      ? "text-[rgb(var(--sa-soft))]"
      : tone === "amber"
        ? "text-amber-100"
        : tone === "rose"
          ? "text-rose-100"
          : "text-indigo-100";
  return (
    <div className="rounded-[18px] border border-white/[0.08] bg-[#142321] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#718981]">
        {label}
      </p>
      <p className={`mt-3 font-mono text-2xl font-semibold ${color}`}>
        {value}
      </p>
      <p className="mt-1 text-[9px] text-[#81978f]">{note}</p>
    </div>
  );
}

export function ImbaCollaborationWorkspace({
  view,
  role,
  onNavigate,
}: {
  view: ImbaCollaborationView;
  role: ImbaRoleKey;
  onNavigate: (view: ImbaOsView) => void;
}) {
  const [store, setStore] = useState<CollaborationStore>(initialStore);
  const [hydrated, setHydrated] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("ROOM-GL");
  const [roomTab, setRoomTab] = useState<RoomTab>("Discussion");
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState("KB-ORG-01");
  const [selectedMeetingId, setSelectedMeetingId] = useState("MTG-01");
  const [selectedMessageId, setSelectedMessageId] = useState("MSG-778");
  const [selectedTemplateId, setSelectedTemplateId] = useState("TPL-014");
  const [composer, setComposer] = useState("");
  const [knowledgeDrafts, setKnowledgeDrafts] = useState<
    Record<string, string>
  >({});
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as CollaborationStore;
          if (parsed.version === 1) setStore(parsed);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated)
      window.localStorage.setItem(storageKey, JSON.stringify(store));
  }, [hydrated, store]);

  const accessibleRooms = useMemo(
    () => store.rooms.filter((room) => room.access.includes(role)),
    [role, store.rooms],
  );
  const accessibleKnowledge = useMemo(
    () =>
      store.knowledge.filter(
        (page) =>
          page.access.includes(role) &&
          `${page.title} ${page.category} ${page.tags.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, role, store.knowledge],
  );
  const selectedRoom =
    accessibleRooms.find((room) => room.id === selectedRoomId) ??
    accessibleRooms[0];
  const selectedPage =
    accessibleKnowledge.find((page) => page.id === selectedKnowledgeId) ??
    accessibleKnowledge[0];
  const selectedRoomKnowledge = selectedRoom
    ? store.knowledge.find((page) => page.id === selectedRoom.knowledgePageId)
    : undefined;
  const selectedMeeting =
    store.meetings.find((meeting) => meeting.id === selectedMeetingId) ??
    store.meetings[0];
  const selectedMessage =
    store.messages.find((message) => message.id === selectedMessageId) ??
    store.messages[0];
  const selectedTemplate =
    store.templates.find((template) => template.id === selectedTemplateId) ??
    store.templates[0];
  const mentions = accessibleRooms.flatMap((room) =>
    room.posts
      .filter((post) => post.mentions.length)
      .map((post) => ({ room, post })),
  );
  const openTasks = accessibleRooms.flatMap((room) =>
    room.tasks
      .filter((task) => task.status !== "Done")
      .map((task) => ({ room, task })),
  );
  const meta = viewMeta[view];
  const selectedPageDraft = selectedPage
    ? (knowledgeDrafts[selectedPage.id] ?? selectedPage.content)
    : "";
  const selectedRoomKnowledgeDraft = selectedRoomKnowledge
    ? (knowledgeDrafts[selectedRoomKnowledge.id] ??
      selectedRoomKnowledge.content)
    : "";

  const updateRoom = (
    roomId: string,
    updater: (room: CollaborationRoom) => CollaborationRoom,
  ) =>
    setStore((current) => ({
      ...current,
      rooms: current.rooms.map((room) =>
        room.id === roomId ? updater(room) : room,
      ),
    }));
  const postMessage = () => {
    if (!selectedRoom || !composer.trim()) return;
    const mentionsInText = [...composer.matchAll(/@([A-Za-z ]+)/g)].map(
      (match) => match[1].trim(),
    );
    updateRoom(selectedRoom.id, (room) => ({
      ...room,
      posts: [
        ...room.posts,
        {
          id: identifier("POST"),
          author: imbaRoleProfiles[role].label,
          role: imbaRoleProfiles[role].label,
          time: timestamp(),
          text: composer.trim(),
          mentions: mentionsInText,
          state: "open",
        },
      ],
    }));
    setComposer("");
    setNotice(
      "Message added to the contextual record; no external Slack or Teams message was sent.",
    );
  };
  const convertPost = (
    roomId: string,
    postId: string,
    kind: "task" | "decision",
  ) =>
    updateRoom(roomId, (room) => {
      const post = room.posts.find((item) => item.id === postId);
      if (!post) return room;
      if (kind === "task")
        return {
          ...room,
          tasks: [
            ...room.tasks,
            {
              id: identifier("TASK"),
              title: post.text.slice(0, 90),
              owner: post.mentions[0] ?? room.owner,
              due: "Assign due date",
              status: "Open",
              source: post.id,
            },
          ],
        };
      return {
        ...room,
        decisions: [
          ...room.decisions,
          {
            id: identifier("DEC"),
            decision: post.text.slice(0, 110),
            rationale: `Converted from discussion ${post.id}; rationale requires confirmation.`,
            owner: room.owner,
            due: "Decision review",
            status: "Proposed",
          },
        ],
      };
    });
  const toggleTask = (roomId: string, taskId: string) =>
    updateRoom(roomId, (room) => ({
      ...room,
      tasks: room.tasks.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === "Done" ? "Open" : "Done" }
          : task,
      ),
    }));
  const updateKnowledgeDraft = (pageId: string, value: string) =>
    setKnowledgeDrafts((current) => ({ ...current, [pageId]: value }));
  const saveKnowledge = (pageId: string) => {
    const sourcePage = store.knowledge.find((page) => page.id === pageId);
    if (!sourcePage) return;
    const content = knowledgeDrafts[pageId] ?? sourcePage.content;
    setStore((current) => ({
      ...current,
      knowledge: current.knowledge.map((page) =>
        page.id === pageId
          ? {
              ...page,
              content,
              version: page.version + 1,
              updated: timestamp(),
            }
          : page,
      ),
    }));
    setKnowledgeDrafts((current) => {
      const next = { ...current };
      delete next[pageId];
      return next;
    });
    setNotice(`${sourcePage.title} saved as a new controlled version.`);
  };

  return (
    <div className="space-y-5">
      {notice ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--sa)/0.15)] bg-[rgb(var(--sa))]/[0.045] px-4 py-3 text-[9px] text-[rgb(var(--sa-soft))]">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="font-black uppercase"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {view === "collaboration" ? (
        <CollaborationOverview
          rooms={accessibleRooms}
          knowledgeCount={accessibleKnowledge.length}
          openTasks={openTasks.length}
          mentions={mentions.length}
          onNavigate={onNavigate}
          onNotice={setNotice}
        />
      ) : null}
      {view === "collaboration-inbox" ? (
        <CollaborationInbox
          mentions={mentions}
          tasks={openTasks}
          onOpenRoom={(roomId) => {
            setSelectedRoomId(roomId);
            setRoomTab("Discussion");
            onNavigate("collaboration-workspaces");
          }}
          onToggleTask={toggleTask}
        />
      ) : null}
      {view === "collaboration-workspaces" && selectedRoom ? (
        <TeamWorkspaces
          rooms={accessibleRooms}
          selectedRoom={selectedRoom}
          selectedRoomId={selectedRoom.id}
          tab={roomTab}
          composer={composer}
          knowledge={selectedRoomKnowledge}
          knowledgeDraft={selectedRoomKnowledgeDraft}
          onSelectRoom={(id) => {
            setSelectedRoomId(id);
            setRoomTab("Discussion");
          }}
          onTab={setRoomTab}
          onComposer={setComposer}
          onPost={postMessage}
          onConvert={convertPost}
          onToggleTask={toggleTask}
          onKnowledgeDraft={(value) => {
            if (selectedRoomKnowledge)
              updateKnowledgeDraft(selectedRoomKnowledge.id, value);
          }}
          onSaveKnowledge={() => {
            if (selectedRoomKnowledge) saveKnowledge(selectedRoomKnowledge.id);
          }}
        />
      ) : null}
      {view === "collaboration-knowledge" ? (
        <KnowledgeHub
          pages={accessibleKnowledge}
          selected={selectedPage}
          draft={selectedPageDraft}
          query={query}
          onQuery={setQuery}
          onSelect={setSelectedKnowledgeId}
          onDraft={(value) => {
            if (selectedPage) updateKnowledgeDraft(selectedPage.id, value);
          }}
          onSave={() => {
            if (selectedPage) saveKnowledge(selectedPage.id);
          }}
        />
      ) : null}
      {view === "collaboration-meetings" ? (
        <MeetingsDecisions
          meetings={store.meetings}
          selected={selectedMeeting}
          onSelect={setSelectedMeetingId}
          onUpdate={(meeting) =>
            setStore((current) => ({
              ...current,
              meetings: current.meetings.map((item) =>
                item.id === meeting.id ? meeting : item,
              ),
            }))
          }
        />
      ) : null}
      {view === "communications-inbox" ? (
        <StakeholderInbox
          messages={store.messages}
          selected={selectedMessage}
          onSelect={setSelectedMessageId}
          onUpdate={(message) =>
            setStore((current) => ({
              ...current,
              messages: current.messages.map((item) =>
                item.id === message.id ? message : item,
              ),
            }))
          }
        />
      ) : null}
      {view === "communications-templates" ? (
        <MessageTemplates
          templates={store.templates}
          selected={selectedTemplate}
          onSelect={setSelectedTemplateId}
          onUse={(template) => {
            setStore((current) => ({
              ...current,
              templates: current.templates.map((item) =>
                item.id === template.id
                  ? { ...item, usage: item.usage + 1 }
                  : item,
              ),
            }));
            setNotice(
              `${template.name} opened as a controlled draft; no message was sent.`,
            );
          }}
        />
      ) : null}
    </div>
  );
}

function CollaborationOverview({
  rooms,
  knowledgeCount,
  openTasks,
  mentions,
  onNavigate,
  onNotice,
}: {
  rooms: CollaborationRoom[];
  knowledgeCount: number;
  openTasks: number;
  mentions: number;
  onNavigate: (view: ImbaOsView) => void;
  onNotice: (notice: string) => void;
}) {
  const launchers = [
    {
      view: "collaboration-inbox" as ImbaOsView,
      icon: Inbox,
      title: "My inbox",
      note: "Mentions, assignments, decisions, and commitments",
    },
    {
      view: "collaboration-workspaces" as ImbaOsView,
      icon: Hash,
      title: "Team workspaces",
      note: "Project, grant, and chapter rooms",
    },
    {
      view: "collaboration-knowledge" as ImbaOsView,
      icon: BookOpen,
      title: "Knowledge hub",
      note: "Living pages with owners and versions",
    },
    {
      view: "collaboration-meetings" as ImbaOsView,
      icon: NotebookPen,
      title: "Meetings + decisions",
      note: "Agenda through owned follow-through",
    },
  ];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Authorized rooms"
          value={`${rooms.length}`}
          note="Role-scoped operating records"
        />
        <Kpi
          label="Open mentions"
          value={`${mentions}`}
          note="Context requiring awareness"
          tone="amber"
        />
        <Kpi
          label="Open assignments"
          value={`${openTasks}`}
          note="Across accessible rooms"
          tone="rose"
        />
        <Kpi
          label="Knowledge pages"
          value={`${knowledgeCount}`}
          note="Versioned institutional memory"
          tone="lime"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <Heading
            eyebrow="Connected workplace"
            title="One room per consequential record"
          />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {launchers.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => onNavigate(item.view)}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left hover:border-indigo-300/20 hover:bg-indigo-300/[0.035]"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-indigo-300/10 p-2 text-indigo-100">
                      <Icon className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#607870] transition group-hover:translate-x-1 group-hover:text-indigo-100" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[10px] text-[#7f958e]">{item.note}</p>
                </button>
              );
            })}
          </div>
        </Card>
        <Card className="xl:col-span-5">
          <Heading
            eyebrow="Connection boundaries"
            title="Integrate the tools IMBA already uses"
          />
          <div className="space-y-3 p-5">
            {[
              {
                name: "Slack / Teams",
                icon: MessageSquare,
                role: "Conversation authority",
                detail:
                  "Receive authorized events, post alerts, and retain links back to the original thread.",
              },
              {
                name: "Notion / SharePoint",
                icon: BookOpen,
                role: "Knowledge authority",
                detail:
                  "Sync page references, ownership, versions, comments, and change notifications.",
              },
              {
                name: "IMBA-OS",
                icon: ShieldCheck,
                role: "Context + control authority",
                detail:
                  "Own canonical records, permissions, assignments, decisions, and audit evidence.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-indigo-300/10 p-2 text-indigo-100">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-white">
                          {item.name}
                        </p>
                        <span className="text-[8px] font-black uppercase text-indigo-100">
                          {item.role}
                        </span>
                      </div>
                      <p className="mt-1 text-[9px] leading-4 text-[#81978f]">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() =>
                onNotice(
                  "Integration discovery checklist created. No Slack, Teams, Notion, or SharePoint credentials were requested.",
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-300/15 bg-indigo-300/[0.07] px-4 py-3 text-[9px] font-black uppercase text-indigo-100"
            >
              <Network className="h-3.5 w-3.5" /> Start discovery checklist
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

function CollaborationInbox({
  mentions,
  tasks,
  onOpenRoom,
  onToggleTask,
}: {
  mentions: Array<{
    room: CollaborationRoom;
    post: CollaborationRoom["posts"][number];
  }>;
  tasks: Array<{
    room: CollaborationRoom;
    task: CollaborationRoom["tasks"][number];
  }>;
  onOpenRoom: (id: string) => void;
  onToggleTask: (roomId: string, taskId: string) => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          label="Mentions"
          value={`${mentions.length}`}
          note="Across authorized discussions"
          tone="amber"
        />
        <Kpi
          label="Assignments"
          value={`${tasks.length}`}
          note="Open and in progress"
          tone="rose"
        />
        <Kpi
          label="Decision mentions"
          value={`${mentions.filter((item) => item.post.state === "decision").length}`}
          note="Explicit management attention"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <Heading eyebrow="Mentions + context" title="What needs awareness" />
          <div className="divide-y divide-white/[0.06]">
            {mentions.map(({ room, post }) => (
              <button
                key={`${room.id}-${post.id}`}
                type="button"
                onClick={() => onOpenRoom(room.id)}
                className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-white/[0.025]"
              >
                <span className="rounded-xl bg-indigo-300/10 p-2 text-indigo-100">
                  <AtSign className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold text-white">
                      {room.name}
                    </span>
                    <span className="text-[8px] text-[#617971]">
                      {post.time}
                    </span>
                  </span>
                  <span className="mt-1 block text-[9px] leading-4 text-[#93a7a0]">
                    {post.text}
                  </span>
                  <span className="mt-2 block text-[8px] font-black uppercase text-indigo-100">
                    {post.mentions.map((mention) => `@${mention}`).join(" · ")}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#526a63]" />
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <Heading eyebrow="Assigned work" title="What needs action" />
          <div className="divide-y divide-white/[0.06]">
            {tasks.map(({ room, task }) => (
              <div
                key={`${room.id}-${task.id}`}
                className="flex items-start gap-3 px-5 py-4"
              >
                <button
                  type="button"
                  onClick={() => onToggleTask(room.id, task.id)}
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/[0.14] text-[rgb(var(--sa-ink))] hover:border-[rgb(var(--sa))]"
                >
                  {task.status === "Done" ? (
                    <Check className="h-3.5 w-3.5 bg-[rgb(var(--sa))]" />
                  ) : null}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-white">
                    {task.title}
                  </p>
                  <p className="mt-1 text-[9px] text-[#718981]">
                    {room.name} · {task.owner} · {task.due}
                  </p>
                </div>
                <span className="rounded-full bg-amber-300/10 px-2 py-1 text-[8px] font-black uppercase text-amber-100">
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function TeamWorkspaces({
  rooms,
  selectedRoom,
  selectedRoomId,
  tab,
  composer,
  knowledge,
  knowledgeDraft,
  onSelectRoom,
  onTab,
  onComposer,
  onPost,
  onConvert,
  onToggleTask,
  onKnowledgeDraft,
  onSaveKnowledge,
}: {
  rooms: CollaborationRoom[];
  selectedRoom: CollaborationRoom;
  selectedRoomId: string;
  tab: RoomTab;
  composer: string;
  knowledge?: CollaborationKnowledgePage;
  knowledgeDraft: string;
  onSelectRoom: (id: string) => void;
  onTab: (tab: RoomTab) => void;
  onComposer: (value: string) => void;
  onPost: () => void;
  onConvert: (
    roomId: string,
    postId: string,
    kind: "task" | "decision",
  ) => void;
  onToggleTask: (roomId: string, taskId: string) => void;
  onKnowledgeDraft: (value: string) => void;
  onSaveKnowledge: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
      <Card>
        <Heading
          eyebrow="Authorized rooms"
          title="Projects · grants · chapters"
        />
        <div className="space-y-1.5 p-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom(room.id)}
              className={`w-full rounded-2xl p-3 text-left ${room.id === selectedRoomId ? "bg-indigo-300/[0.1] text-white" : "text-[#8fa39d] hover:bg-white/[0.03]"}`}
            >
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-indigo-100" />
                <span className="text-[10px] font-semibold">{room.name}</span>
              </div>
              <p className="mt-1.5 text-[8px] text-[#637b73]">
                {room.kind} · {room.status}
              </p>
            </button>
          ))}
        </div>
      </Card>
      <div className="space-y-4">
        <section className="rounded-[22px] border border-indigo-300/15 bg-indigo-300/[0.04]">
          <div className="flex flex-wrap items-start justify-between gap-4 p-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-indigo-100">
                {selectedRoom.kind} workspace
              </p>
              <h3 className="mt-1 text-xl font-semibold text-white">
                {selectedRoom.name}
              </h3>
              <p className="mt-2 max-w-3xl text-[10px] leading-5 text-[#9bada7]">
                {selectedRoom.summary}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/10 px-4 py-3 text-right">
              <p className="text-[8px] font-black uppercase text-[#718981]">
                Financial context
              </p>
              <p className="mt-1 text-[10px] font-semibold text-[rgb(var(--sa-soft))]">
                {selectedRoom.financialContext}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap border-t border-white/[0.07] px-3">
            {(
              [
                "Discussion",
                "Tasks",
                "Knowledge",
                "Decisions",
                "Files",
              ] as RoomTab[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onTab(item)}
                className={`border-b-2 px-4 py-3 text-[9px] font-black uppercase ${tab === item ? "border-indigo-300 text-indigo-100" : "border-transparent text-[#718981]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>
        {tab === "Discussion" ? (
          <Card>
            <Heading
              eyebrow="Contextual thread"
              title={`${selectedRoom.posts.length} messages`}
              detail={`Members · ${selectedRoom.members.join(" · ")}`}
            />
            <div className="divide-y divide-white/[0.06]">
              {selectedRoom.posts.map((post) => (
                <article key={post.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-300/10 text-[9px] font-black text-indigo-100">
                      {post.author
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] font-semibold text-white">
                          {post.author}
                        </p>
                        <span className="text-[8px] text-[#617971]">
                          {post.role} · {post.time}
                        </span>
                        {post.state ? (
                          <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[7px] font-black uppercase text-indigo-100">
                            {post.state}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-[10px] leading-5 text-[#a8b9b3]">
                        {post.text}
                      </p>
                      {post.mentions.length ? (
                        <p className="mt-2 text-[8px] font-black text-indigo-100">
                          {post.mentions
                            .map((mention) => `@${mention}`)
                            .join(" · ")}
                        </p>
                      ) : null}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onConvert(selectedRoom.id, post.id, "task")
                          }
                          className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[8px] font-black uppercase text-[#9aafa8]"
                        >
                          Convert to task
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onConvert(selectedRoom.id, post.id, "decision")
                          }
                          className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[8px] font-black uppercase text-[#9aafa8]"
                        >
                          Propose decision
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="border-t border-white/[0.07] p-4">
              <textarea
                value={composer}
                onChange={(event) => onComposer(event.target.value)}
                rows={3}
                placeholder="Add context, use @mentions, or record a proposed decision…"
                className="w-full resize-none rounded-xl border border-white/[0.09] bg-[#0d1917] p-3 text-[10px] leading-5 text-white outline-none placeholder:text-[#526a63] focus:border-indigo-300/30"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[8px] text-[#617971]">
                  Prototype entry remains inside IMBA-OS until an approved
                  connector is configured.
                </p>
                <button
                  type="button"
                  onClick={onPost}
                  className="flex items-center gap-2 rounded-xl bg-indigo-300 px-4 py-2.5 text-[8px] font-black uppercase text-[#15172d]"
                >
                  <Send className="h-3 w-3" /> Post
                </button>
              </div>
            </div>
          </Card>
        ) : null}
        {tab === "Tasks" ? (
          <Card>
            <Heading eyebrow="Room assignments" title="Owned work" />
            <div className="divide-y divide-white/[0.06]">
              {selectedRoom.tasks.map((task) => (
                <div
                  key={task.id}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[auto_1fr_1fr_auto]"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(selectedRoom.id, task.id)}
                    className={`flex h-6 w-6 items-center justify-center rounded-md border ${task.status === "Done" ? "border-[rgb(var(--sa))] bg-[rgb(var(--sa))] text-[rgb(var(--sa-ink))]" : "border-white/[0.14]"}`}
                  >
                    {task.status === "Done" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : null}
                  </button>
                  <div>
                    <p
                      className={`text-[10px] font-semibold ${task.status === "Done" ? "text-[#718981] line-through" : "text-white"}`}
                    >
                      {task.title}
                    </p>
                    {task.source ? (
                      <p className="mt-1 text-[8px] text-indigo-100">
                        Created from {task.source}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-[9px] text-[#82978f]">
                    {task.owner} · {task.due}
                  </p>
                  <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[8px] font-black uppercase text-indigo-100">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
        {tab === "Knowledge" && knowledge ? (
          <Card>
            <Heading
              eyebrow={`Living page · v${knowledge.version}`}
              title={knowledge.title}
              detail={`Owner ${knowledge.owner} · Updated ${knowledge.updated}`}
              action={
                <button
                  type="button"
                  onClick={onSaveKnowledge}
                  className="rounded-xl bg-indigo-300 px-4 py-2.5 text-[8px] font-black uppercase text-[#15172d]"
                >
                  Save new version
                </button>
              }
            />
            <div className="p-5">
              <textarea
                value={knowledgeDraft}
                onChange={(event) => onKnowledgeDraft(event.target.value)}
                rows={18}
                className="w-full resize-y rounded-2xl border border-white/[0.08] bg-[#0d1917] p-4 text-[11px] leading-6 text-[#c5d1cd] outline-none focus:border-indigo-300/30"
              />
            </div>
          </Card>
        ) : null}
        {tab === "Decisions" ? (
          <Card>
            <Heading
              eyebrow="Durable decision log"
              title="Decision, rationale, owner, and next milestone"
            />
            <div className="space-y-3 p-5">
              {selectedRoom.decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {decision.decision}
                      </p>
                      <p className="mt-2 text-[10px] leading-5 text-[#93a7a0]">
                        {decision.rationale}
                      </p>
                    </div>
                    <span className="rounded-full bg-[rgb(var(--sa)/0.10)] px-2 py-1 text-[8px] font-black uppercase text-[rgb(var(--sa-soft))]">
                      {decision.status}
                    </span>
                  </div>
                  <p className="mt-3 text-[8px] font-black uppercase text-indigo-100">
                    {decision.owner} · {decision.due}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
        {tab === "Files" ? (
          <Card>
            <Heading
              eyebrow="Linked evidence"
              title="References remain in their authoritative system"
            />
            <div className="divide-y divide-white/[0.06]">
              {selectedRoom.files.map((file) => (
                <div
                  key={file.name}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[auto_1fr_1fr_auto]"
                >
                  <span className="rounded-xl bg-indigo-300/10 p-2 text-indigo-100">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold text-white">
                      {file.name}
                    </p>
                    <p className="mt-1 text-[8px] text-[#718981]">
                      {file.type}
                    </p>
                  </div>
                  <p className="text-[9px] text-[#93a7a0]">
                    Authority · {file.source}
                  </p>
                  <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[8px] font-black uppercase text-indigo-100">
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function KnowledgeHub({
  pages,
  selected,
  draft,
  query,
  onQuery,
  onSelect,
  onDraft,
  onSave,
}: {
  pages: CollaborationKnowledgePage[];
  selected?: CollaborationKnowledgePage;
  draft: string;
  query: string;
  onQuery: (value: string) => void;
  onSelect: (id: string) => void;
  onDraft: (value: string) => void;
  onSave: () => void;
}) {
  if (!selected)
    return (
      <Card>
        <div className="p-8 text-center text-sm text-[#82978f]">
          No knowledge pages are authorized for this role.
        </div>
      </Card>
    );
  return (
    <div className="grid gap-5 xl:grid-cols-[330px_1fr]">
      <Card>
        <Heading
          eyebrow="Searchable knowledge"
          title="Pages + standards"
          action={
            <label className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-2 py-1.5">
              <Search className="h-3 w-3 text-[#718981]" />
              <input
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder="Search"
                className="w-20 bg-transparent text-[9px] text-white outline-none"
              />
            </label>
          }
        />
        <div className="space-y-1.5 p-2">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelect(page.id)}
              className={`w-full rounded-xl p-3 text-left ${selected.id === page.id ? "bg-indigo-300/[0.1]" : "hover:bg-white/[0.03]"}`}
            >
              <p className="text-[10px] font-semibold text-white">
                {page.title}
              </p>
              <p className="mt-1 text-[8px] text-[#718981]">
                {page.category} · v{page.version}
              </p>
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <Heading
          eyebrow={`Controlled page · ${selected.id}`}
          title={selected.title}
          detail={`Owner ${selected.owner} · Updated ${selected.updated} · Version ${selected.version}`}
          action={
            <button
              type="button"
              onClick={onSave}
              className="rounded-xl bg-indigo-300 px-4 py-2.5 text-[8px] font-black uppercase text-[#15172d]"
            >
              Save version
            </button>
          }
        />
        <div className="p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {selected.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-indigo-300/10 px-2 py-1 text-[8px] font-black text-indigo-100"
              >
                #{tag}
              </span>
            ))}
          </div>
          <textarea
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            rows={22}
            className="w-full resize-y rounded-2xl border border-white/[0.08] bg-[#0d1917] p-4 text-[11px] leading-6 text-[#c5d1cd] outline-none focus:border-indigo-300/30"
          />
        </div>
      </Card>
    </div>
  );
}

function MeetingsDecisions({
  meetings,
  selected,
  onSelect,
  onUpdate,
}: {
  meetings: CollaborationMeeting[];
  selected: CollaborationMeeting;
  onSelect: (id: string) => void;
  onUpdate: (meeting: CollaborationMeeting) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[330px_1fr]">
      <Card>
        <Heading eyebrow="Meeting rhythm" title="Agendas + follow-through" />
        <div className="space-y-2 p-2">
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              type="button"
              onClick={() => onSelect(meeting.id)}
              className={`w-full rounded-2xl p-3 text-left ${selected.id === meeting.id ? "bg-indigo-300/[0.1]" : "hover:bg-white/[0.03]"}`}
            >
              <p className="text-[10px] font-semibold text-white">
                {meeting.title}
              </p>
              <p className="mt-1 text-[8px] text-[#718981]">
                {meeting.date} · {meeting.status}
              </p>
            </button>
          ))}
        </div>
      </Card>
      <div className="space-y-5">
        <Card>
          <Heading
            eyebrow={`${selected.id} · ${selected.date}`}
            title={selected.title}
            detail={`Owner ${selected.owner} · ${selected.participants.join(" · ")}`}
            action={
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    ...selected,
                    status:
                      selected.status === "Complete"
                        ? "Notes open"
                        : "Complete",
                  })
                }
                className="rounded-xl bg-indigo-300 px-4 py-2.5 text-[8px] font-black uppercase text-[#15172d]"
              >
                {selected.status === "Complete"
                  ? "Reopen notes"
                  : "Complete meeting"}
              </button>
            }
          />
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <p className="text-[9px] font-black uppercase text-indigo-100">
                Agenda
              </p>
              <div className="mt-3 space-y-2">
                {selected.agenda.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 text-[10px] text-[#a8b9b3]"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-300/10 font-mono text-[8px] text-indigo-100">
                      {index + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-indigo-100">
                Working notes
              </p>
              <textarea
                value={selected.notes}
                onChange={(event) =>
                  onUpdate({ ...selected, notes: event.target.value })
                }
                rows={8}
                className="mt-3 w-full resize-none rounded-xl border border-white/[0.08] bg-[#0d1917] p-3 text-[10px] leading-5 text-[#b7c6c1] outline-none"
              />
            </div>
          </div>
        </Card>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <Heading
              eyebrow="Decisions"
              title={`${selected.decisions.length} recorded`}
            />
            <div className="space-y-3 p-5">
              {selected.decisions.length ? (
                selected.decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="rounded-xl border border-white/[0.07] p-3"
                  >
                    <p className="text-[10px] font-semibold text-white">
                      {decision.decision}
                    </p>
                    <p className="mt-1 text-[9px] leading-4 text-[#82978f]">
                      {decision.rationale}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-[#718981]">
                  No decisions recorded yet.
                </p>
              )}
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    ...selected,
                    decisions: [
                      ...selected.decisions,
                      {
                        id: identifier("DEC"),
                        decision:
                          "Confirm the recommended path from this meeting",
                        rationale:
                          "Prototype decision created from meeting notes; edit during production workflow.",
                        owner: selected.owner,
                        due: "Next review",
                        status: "Proposed",
                      },
                    ],
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-300/15 px-3 py-2.5 text-[8px] font-black uppercase text-indigo-100"
              >
                <Plus className="h-3 w-3" /> Add proposed decision
              </button>
            </div>
          </Card>
          <Card>
            <Heading
              eyebrow="Assignments"
              title={`${selected.tasks.length} owned actions`}
            />
            <div className="space-y-3 p-5">
              {selected.tasks.length ? (
                selected.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-white/[0.07] p-3"
                  >
                    <p className="text-[10px] font-semibold text-white">
                      {task.title}
                    </p>
                    <p className="mt-1 text-[8px] text-[#718981]">
                      {task.owner} · {task.due}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-[#718981]">
                  No assignments recorded yet.
                </p>
              )}
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    ...selected,
                    tasks: [
                      ...selected.tasks,
                      {
                        id: identifier("TASK"),
                        title:
                          "Distribute meeting decisions and confirm owners",
                        owner: selected.owner,
                        due: "Within 2 days",
                        status: "Open",
                      },
                    ],
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-300/15 px-3 py-2.5 text-[8px] font-black uppercase text-indigo-100"
              >
                <Plus className="h-3 w-3" /> Add follow-up
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StakeholderInbox({
  messages,
  selected,
  onSelect,
  onUpdate,
}: {
  messages: StakeholderMessage[];
  selected: StakeholderMessage;
  onSelect: (id: string) => void;
  onUpdate: (message: StakeholderMessage) => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Needs response"
          value={`${messages.filter((message) => message.status === "Needs response").length}`}
          note="Owned external commitments"
          tone="rose"
        />
        <Kpi
          label="Financial triggers"
          value={`${messages.filter((message) => message.financialEffect.includes("$")).length}`}
          note="Messages with direct cash context"
          tone="amber"
        />
        <Kpi
          label="Stakeholder groups"
          value={`${new Set(messages.map((message) => message.group)).size}`}
          note="Client through Board"
        />
        <Kpi
          label="Unassigned"
          value={`${messages.filter((message) => !message.owner).length}`}
          note="Target is zero"
          tone="lime"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <Heading
            eyebrow="Shared commitment queue"
            title="External messages become owned work"
          />
          <div className="divide-y divide-white/[0.06]">
            {messages.map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => onSelect(message.id)}
                className={`grid w-full gap-3 px-5 py-4 text-left md:grid-cols-[1.2fr_1.5fr_1fr_auto] ${selected.id === message.id ? "bg-indigo-300/[0.05]" : "hover:bg-white/[0.02]"}`}
              >
                <div>
                  <p className="text-[10px] font-semibold text-white">
                    {message.stakeholder}
                  </p>
                  <p className="mt-1 text-[8px] text-indigo-100">
                    {message.group} · {message.id}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white">{message.subject}</p>
                  <p className="mt-1 text-[8px] text-[#718981]">
                    Linked · {message.linkedRecord}
                  </p>
                </div>
                <p className="text-[9px] text-[#93a7a0]">
                  {message.owner} · {message.due}
                </p>
                <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[8px] font-black uppercase text-indigo-100">
                  {message.status}
                </span>
              </button>
            ))}
          </div>
        </Card>
        <Card className="xl:col-span-4">
          <Heading
            eyebrow={`Selected · ${selected.id}`}
            title={selected.subject}
          />
          <div className="space-y-4 p-5">
            <p className="text-[10px] leading-5 text-[#a8b9b3]">
              {selected.context}
            </p>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <p className="text-[8px] font-black uppercase text-[#718981]">
                Financial / governance effect
              </p>
              <p className="mt-1 text-[10px] font-semibold text-[rgb(var(--sa-soft))]">
                {selected.financialEffect}
              </p>
            </div>
            <label className="block">
              <span className="text-[8px] font-black uppercase text-[#718981]">
                Assigned owner
              </span>
              <input
                value={selected.owner}
                onChange={(event) =>
                  onUpdate({ ...selected, owner: event.target.value })
                }
                className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0d1917] px-3 py-2.5 text-[10px] text-white outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdate({ ...selected, status: "Ready" })}
                className="rounded-xl bg-indigo-300 px-3 py-3 text-[8px] font-black uppercase text-[#15172d]"
              >
                Mark ready
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ ...selected, status: "Closed" })}
                className="rounded-xl border border-white/[0.08] px-3 py-3 text-[8px] font-black uppercase text-white"
              >
                Close commitment
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function MessageTemplates({
  templates,
  selected,
  onSelect,
  onUse,
}: {
  templates: CommunicationTemplate[];
  selected: CommunicationTemplate;
  onSelect: (id: string) => void;
  onUse: (template: CommunicationTemplate) => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi
          label="Approved"
          value={`${templates.filter((template) => template.status === "Approved").length}`}
          note="Available for controlled use"
          tone="lime"
        />
        <Kpi
          label="Review due"
          value={`${templates.filter((template) => template.status === "Review due").length}`}
          note="Owner action required"
          tone="amber"
        />
        <Kpi
          label="Uses"
          value={`${templates.reduce((sum, template) => sum + template.usage, 0)}`}
          note="Illustrative monthly volume"
        />
        <Kpi
          label="Drafts"
          value={`${templates.filter((template) => template.status === "Draft").length}`}
          note="Blocked from external send"
          tone="rose"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[330px_1fr]">
        <Card>
          <Heading eyebrow="Controlled library" title="Templates by audience" />
          <div className="space-y-2 p-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template.id)}
                className={`w-full rounded-2xl p-3 text-left ${selected.id === template.id ? "bg-indigo-300/[0.1]" : "hover:bg-white/[0.03]"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold text-white">
                    {template.name}
                  </p>
                  <span className="text-[8px] font-black uppercase text-indigo-100">
                    {template.status}
                  </span>
                </div>
                <p className="mt-1 text-[8px] text-[#718981]">
                  {template.audience} · {template.usage} uses
                </p>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <Heading
            eyebrow={`${selected.id} · ${selected.status}`}
            title={selected.name}
            detail={`Owner ${selected.owner} · Last review ${selected.lastReview}`}
            action={
              <button
                type="button"
                onClick={() => onUse(selected)}
                disabled={selected.status === "Draft"}
                className="rounded-xl bg-indigo-300 px-4 py-2.5 text-[8px] font-black uppercase text-[#15172d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Use controlled template
              </button>
            }
          />
          <div className="space-y-4 p-5">
            <div>
              <p className="text-[8px] font-black uppercase text-[#718981]">
                Subject
              </p>
              <p className="mt-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-[10px] text-white">
                {selected.subject}
              </p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-[#718981]">
                Body
              </p>
              <pre className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/[0.07] bg-[#0d1917] p-4 font-sans text-[10px] leading-6 text-[#b7c6c1]">
                {selected.body}
              </pre>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Approval", selected.status],
                ["Owner", selected.owner],
                ["Audit", "Usage retained"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/[0.07] p-3"
                >
                  <p className="text-[8px] font-black uppercase text-[#617971]">
                    {label}
                  </p>
                  <p className="mt-1 text-[9px] font-semibold text-indigo-100">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
