"use client";

import {
  ArrowUp,
  BookOpen,
  CircleAlert,
  History,
  Lightbulb,
  ListChecks,
  MessageSquarePlus,
  RotateCcw,
  Square,
  Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { LogoMark } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { TUTOR_MESSAGE_MAX } from "@/lib/validation";

import { ConversationMenu } from "./conversation-menu";
import { TutorMarkdown } from "./markdown";
import { useTutorChat, type ChatMessage } from "./use-tutor-chat";
import { brand } from "@/lib/brand";

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  subjectName: string | null;
};
type SubjectOption = { id: string; name: string };

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    label: "Explain a difficult topic",
    prompt: "Can you explain a topic I'm finding difficult? The topic is: ",
  },
  {
    icon: BookOpen,
    label: "Help me understand a concept",
    prompt: "Help me understand this concept step by step: ",
  },
  {
    icon: ListChecks,
    label: "Give me a practice question",
    prompt: "Give me a practice question on ",
  },
  {
    icon: Target,
    label: "Test my knowledge",
    prompt: "Ask me a few questions to test what I know about ",
  },
];

function ConversationList({
  conversations,
  activeId,
  onNavigate,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onNavigate?: () => void;
}) {
  if (!conversations.length) {
    return (
      <p className="px-3 py-2 text-sm text-text-muted">Your conversations will appear here.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`/app/tutor/${c.id}`}
            onClick={onNavigate}
            aria-current={c.id === activeId ? "page" : undefined}
            className={cn(
              "block rounded-sm px-3 py-2 text-sm",
              c.id === activeId
                ? "bg-primary-soft text-primary"
                : "text-text hover:bg-surface-muted",
            )}
          >
            <span className="line-clamp-1 font-medium">{c.title}</span>
            {c.subjectName ? (
              <span className="text-xs text-text-muted">{c.subjectName}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TutorWorkspace({
  conversationId,
  title,
  initialMessages,
  conversations,
  subjects,
  initialSubjectId,
  initialDraft,
  availability,
}: {
  conversationId: string | null;
  title: string | null;
  initialMessages: ChatMessage[];
  conversations: ConversationSummary[];
  subjects: SubjectOption[];
  initialSubjectId: string | null;
  initialDraft: string;
  availability: "available" | "test" | "not_configured";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [subjectId, setSubjectId] = useState<string | null>(initialSubjectId);
  const [draft, setDraft] = useState(initialDraft);
  const [historyOpen, setHistoryOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const disabled = availability === "not_configured";

  const onSaved = useCallback(
    (id: string, isNew: boolean) => {
      if (isNew && pathname !== `/app/tutor/${id}`)
        router.replace(`/app/tutor/${id}`, { scroll: false });
      else router.refresh();
    },
    [pathname, router],
  );
  const chat = useTutorChat({ initialMessages, conversationId, subjectId, onSaved });

  // Grow the composer with its content, up to a limit.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

  // Keep the newest content in view unless the student has scrolled up to read.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [chat.messages, chat.streaming]);

  const submit = async (text = draft) => {
    if (!text.trim() || chat.pending || disabled) return;
    if (text.length > TUTOR_MESSAGE_MAX) return;
    stickToBottom.current = true;
    setDraft("");
    const ok = await chat.send(text);
    if (!ok) {
      // Put the failed message back in the composer so it can be edited or resent.
      setDraft((current) => (current.trim() ? current : text));
      textareaRef.current?.focus();
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  const tooLong = draft.length > TUTOR_MESSAGE_MAX;
  const empty = chat.messages.length === 0 && chat.streaming === null;
  const activeSubject = subjects.find((s) => s.id === subjectId);

  return (
    <div className="-mx-4 -mt-6 -mb-28 flex h-[calc(100dvh-3.5rem-4rem)] min-h-[28rem] sm:-mx-6 lg:fixed lg:inset-y-0 lg:right-0 lg:left-[var(--sidebar-width)] lg:m-0 lg:h-auto">
      {/* Conversation history (desktop) */}
      <aside
        className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface xl:flex"
        aria-label="Conversation history"
      >
        <div className="p-3">
          <ButtonLink
            href="/app/tutor"
            variant="secondary"
            className="w-full"
            icon={<MessageSquarePlus className="size-4" aria-hidden="true" />}
          >
            New conversation
          </ButtonLink>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <p className="px-3 pt-1 pb-2 text-xs font-medium text-text-muted">Recent</p>
          <ConversationList conversations={conversations} activeId={conversationId} />
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col" aria-label="Tutor conversation">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-4 lg:h-16 lg:px-6">
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden"
                aria-label="Conversation history"
              >
                <History className="size-5" aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <SheetContent title="Conversation history">
              <div className="border-b border-border p-3">
                <ButtonLink
                  href="/app/tutor"
                  variant="secondary"
                  className="w-full"
                  onClick={() => setHistoryOpen(false)}
                  icon={<MessageSquarePlus className="size-4" aria-hidden="true" />}
                >
                  New conversation
                </ButtonLink>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <ConversationList
                  conversations={conversations}
                  activeId={conversationId}
                  onNavigate={() => setHistoryOpen(false)}
                />
              </div>
            </SheetContent>
          </Dialog>

          <div className="min-w-16 flex-1">
            <h1 className="truncate text-[0.9375rem] font-semibold">
              {title ?? "New conversation"}
            </h1>
            {activeSubject && conversationId ? (
              <p className="truncate text-xs text-text-muted">{activeSubject.name}</p>
            ) : null}
          </div>

          {availability === "test" ? (
            <Badge tone="warning">
              Test mode<span className="hidden sm:inline"> — replies aren&apos;t AI</span>
            </Badge>
          ) : null}

          {!conversationId && subjects.length ? (
            <label className="flex items-center gap-2 text-sm">
              <span className="hidden text-text-muted sm:inline">Subject</span>
              <select
                value={subjectId ?? ""}
                onChange={(e) => setSubjectId(e.target.value || null)}
                disabled={chat.messages.length > 0}
                className="h-9 max-w-[10rem] rounded-sm border border-border-strong/60 bg-surface px-2 text-sm"
                aria-label="Subject for this conversation"
              >
                <option value="">Any subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {conversationId && title ? (
            <ConversationMenu conversationId={conversationId} title={title} />
          ) : null}
          <ButtonLink
            href="/app/tutor"
            variant="ghost"
            size="icon"
            className="xl:hidden"
            aria-label="New conversation"
          >
            <MessageSquarePlus className="size-5" aria-hidden="true" />
          </ButtonLink>
        </header>

        <div
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
            {disabled ? (
              <div
                role="alert"
                className="flex gap-3 rounded-md border border-warning/30 bg-warning-soft p-4 text-sm"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-text">The AI tutor isn&apos;t configured yet</p>
                  <p className="mt-1 text-text">
                    No AI provider has been connected to this deployment yet, so the tutor
                    can&apos;t generate replies. Everything else in {brand.name} works, and nothing
                    you type here is sent anywhere.
                  </p>
                </div>
              </div>
            ) : null}

            {empty ? (
              <div className="flex flex-col items-center pt-6 text-center sm:pt-12">
                <LogoMark className="size-10" />
                <h2 className="mt-4 text-xl font-semibold">What&apos;s on your mind?</h2>
                <p className="mt-1.5 max-w-md text-[0.9375rem] text-text-muted">
                  Ask a question, work through a difficult topic or practise something you&apos;re
                  learning
                  {activeSubject ? ` in ${activeSubject.name}` : ""}.
                </p>
                <ul className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <li key={s.label}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setDraft(s.prompt);
                          requestAnimationFrame(() => {
                            const el = textareaRef.current;
                            el?.focus();
                            el?.setSelectionRange(s.prompt.length, s.prompt.length);
                          });
                        }}
                        className="flex w-full items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-left text-sm font-medium shadow-card transition-colors hover:border-border-strong/40 hover:bg-surface-muted disabled:opacity-55"
                      >
                        <s.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ol className="flex flex-col gap-6" aria-label="Messages">
                {chat.messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {chat.streaming !== null ? (
                  <li className="flex gap-3" aria-live="polite" aria-busy="true">
                    <LogoMark className="mt-0.5 size-7" />
                    <div className="min-w-0 flex-1">
                      <p className="sr-only">{brand.name} is replying</p>
                      {chat.streaming ? (
                        <TutorMarkdown content={chat.streaming} />
                      ) : (
                        <span className="inline-flex gap-1 pt-2" aria-hidden="true">
                          {[0, 150, 300].map((delay) => (
                            <span
                              key={delay}
                              className="size-1.5 animate-pulse-soft rounded-full bg-text-muted"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                  </li>
                ) : null}
              </ol>
            )}

            {chat.error ? (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-md border border-danger/25 bg-danger-soft p-4 text-sm sm:flex-row sm:items-center"
              >
                <p className="flex-1 text-text">{chat.error.message}</p>
                {![
                  "rate_limited",
                  "rate_limited_daily",
                  "ai_not_configured",
                  "unauthenticated",
                ].includes(chat.error.code) ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void submit(chat.error!.draft)}
                    icon={<RotateCcw className="size-4" aria-hidden="true" />}
                  >
                    Try again
                  </Button>
                ) : chat.error.code === "unauthenticated" ? (
                  <ButtonLink
                    size="sm"
                    variant="secondary"
                    href={`/login?next=${encodeURIComponent(pathname)}`}
                  >
                    Log in
                  </ButtonLink>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-bg px-4 pt-3 pb-3 lg:px-6 lg:pb-5">
          <form
            className="mx-auto w-full max-w-3xl"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div className="flex items-end gap-2 rounded-lg border border-border-strong/50 bg-surface p-2 shadow-card focus-within:border-primary focus-within:outline-2 focus-within:outline-brand/30">
              <label htmlFor="tutor-input" className="sr-only">
                Message the tutor
              </label>
              <textarea
                id="tutor-input"
                ref={textareaRef}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={disabled}
                placeholder={
                  disabled
                    ? "The tutor isn't available yet"
                    : `Ask ${brand.name} anything you're learning…`
                }
                aria-describedby="tutor-input-help"
                aria-invalid={tooLong || undefined}
                className="max-h-[200px] min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[0.9375rem] leading-6 placeholder:text-text-muted/80 focus:outline-none disabled:cursor-not-allowed"
              />
              {chat.pending ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={chat.stop}
                  aria-label="Stop generating"
                >
                  <Square className="size-4 fill-current" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim() || tooLong || disabled}
                  aria-label="Send message"
                >
                  <ArrowUp className="size-5" aria-hidden="true" />
                </Button>
              )}
            </div>
            <p
              id="tutor-input-help"
              className={cn(
                "mt-1.5 px-1 text-xs",
                tooLong ? "font-medium text-danger" : "text-text-muted",
              )}
            >
              {tooLong
                ? `This message is ${draft.length - TUTOR_MESSAGE_MAX} characters over the ${TUTOR_MESSAGE_MAX.toLocaleString("en-GB")} limit.`
                : `Enter to send · Shift + Enter for a new line · ${brand.name} can make mistakes, so check important answers.`}
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] rounded-lg rounded-br-sm bg-primary-soft px-4 py-2.5 text-[0.9375rem] break-words whitespace-pre-wrap text-text">
          <span className="sr-only">You said: </span>
          {message.content}
        </div>
      </li>
    );
  }
  return (
    <li className="flex gap-3">
      <LogoMark className="mt-0.5 size-7" />
      <div className="min-w-0 flex-1">
        <span className="sr-only">{brand.name} replied: </span>
        <TutorMarkdown content={message.content} />
      </div>
    </li>
  );
}
