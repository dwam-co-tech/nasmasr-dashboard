"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { fetchSupportInbox, fetchSupportConversation, replySupport, markSupportConversationRead, fetchSupportStats } from "@/services/supportInbox";
import { fetchUsersSummary, fetchUsersSummaryPage } from "@/services/users";
import type { SupportInboxItem, SupportStatsResponse } from "@/models/support-inbox";
import type { UserSummary } from "@/models/users";

 type ChatMessage = { id: string; sender: "admin" | "user"; content: string; time: string; status?: "sent" | "delivered"; srcId?: number; imageUrl?: string };
type QuickReply = { id: string; title: string; content: string };

export default function MessagesPage() {
  const [inboxItems, setInboxItems] = useState<SupportInboxItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, ChatMessage[]>>({});
  const [messageInput, setMessageInput] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bubblesRef = useRef<HTMLDivElement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentsPanel, setShowAttachmentsPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [designMode, setDesignMode] = useState(true);
  const chatPaneRef = useRef<HTMLDivElement | null>(null);
  const msgIdRef = useRef(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | string | null>(null);
  const pollRef = useRef<number | null>(null);
  const inboxPollRef = useRef<number | null>(null);
  const [supportStats, setSupportStats] = useState<SupportStatsResponse | null>(null);
  const quickReplies: QuickReply[] = [
    { id: "qr1", title: "تحية", content: "مرحبًا، كيف يمكنني مساعدتك؟" },
    { id: "qr2", title: "استلام الطلب", content: "تم استلام طلبك وجاري المراجعة." },
    { id: "qr3", title: "طلب معلومات", content: "هل يمكنك تزويدنا بمزيد من التفاصيل؟" },
    { id: "qr4", title: "شكرًا", content: "شكرًا لتواصلك معنا." },
    { id: "qr5", title: "استفسار", content: "هل لديك أي استفسارات أخرى؟" },
    
  ];

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [startSearch, setStartSearch] = useState("");
  const [startUsers, setStartUsers] = useState<UserSummary[]>([]);
  const [startLoading, setStartLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetchSupportInbox();
        const items = (resp?.data ?? []).filter(Boolean) as SupportInboxItem[];
        setInboxItems(items);
        if (items.length > 0) setSelectedConversationId(items[0].conversation_id);
      } catch (e) {
        setError((e as Error)?.message || "تعذر جلب قائمة محادثات الدعم");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadAllUsers = async () => {
      if (!isStartModalOpen) return;
      setStartLoading(true);
      try {
        const first = await fetchUsersSummary();
        const baseUsers = Array.isArray(first?.users) ? first.users : [];
        setStartUsers(baseUsers);
        const lastPage = Number(first?.meta?.last_page || 1);
        for (let p = 2; p <= lastPage; p++) {
          try {
            const pageResp = await fetchUsersSummaryPage(p);
            const more = Array.isArray(pageResp?.users) ? pageResp.users : [];
            if (more.length) setStartUsers((prev) => [...prev, ...more]);
          } catch {}
        }
      } catch {
        setStartUsers([]);
      } finally {
        setStartLoading(false);
      }
    };
    loadAllUsers();
  }, [isStartModalOpen]);
  useEffect(() => {
    try {
      const unreadTotal = inboxItems.reduce((sum, it) => sum + (Number(it.unread_count) || 0), 0);
      if (typeof window !== 'undefined') {
        localStorage.setItem('messagesCount', String(unreadTotal));
      }
    } catch {}
  }, [inboxItems]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await fetchSupportStats();
        setSupportStats(stats || null);
      } catch { setSupportStats(null); }
    };
    loadStats();
  }, []);

  useEffect(() => {
    try {
      if (supportStats && typeof window !== 'undefined') {
        const v = Number(supportStats.unread_conversations) || 0;
        localStorage.setItem('messagesCount', String(v));
      }
    } catch {}
  }, [supportStats]);

  useEffect(() => {
    const loadConv = async () => {
      if (!selectedConversationId) return;
      const item = inboxItems.find((it) => it.conversation_id === selectedConversationId);
      if (!item) return;
      if (messagesByConv[selectedConversationId]?.length) return;
      setLoading(true);
      setError(null);
      try {
        let targetUserId: number | string | undefined = item.user?.id;
        if ((item.user?.name || "").toLowerCase() === "admin" && item.last_message_by) {
          try {
            const summary = await fetchUsersSummary();
            const match = summary.users.find((u) => {
              const name = (u.name || "").toLowerCase();
              const code = (u.user_code || "").toLowerCase();
              const by = item.last_message_by?.toLowerCase() || "";
              return name === by || code === by || name.includes(by) || code.includes(by);
            });
            if (match?.id) targetUserId = match.id;
          } catch {}
        }
        const resp = await fetchSupportConversation(targetUserId ?? "");
        const normalized: ChatMessage[] = (resp?.data ?? []).map((m) => ({
          id: `${selectedConversationId}-${m.id}`,
          sender: m.sender_id === resp.meta.user.id ? "user" : "admin",
          content: m.message,
          time: new Date(m.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          status: m.read_at ? "delivered" : "sent",
          srcId: m.id,
        }));
        setMessagesByConv((prev) => ({ ...prev, [selectedConversationId]: normalized }));
        setCurrentUserId(targetUserId ?? null);
        try {
          await markSupportConversationRead(targetUserId ?? "");
          setInboxItems((prev) => prev.map((it) => it.conversation_id === selectedConversationId ? { ...it, unread_count: 0 } : it));
        } catch {}
      } catch (e) {
        setError((e as Error)?.message || "تعذر جلب محادثة الدعم");
      } finally {
        setLoading(false);
      }
    };
    loadConv();
  }, [selectedConversationId, inboxItems, messagesByConv]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!currentUserId || !selectedConversationId) return;
    const tick = async () => {
      try {
        const resp = await fetchSupportConversation(currentUserId);
        const metaUserId = resp.meta.user.id;
        const incoming = new Map<number, { read_at: string | null; created_at: string; sender_id: number; message: string }>();
        (resp.data || []).forEach((m) => incoming.set(m.id, { read_at: m.read_at, created_at: m.created_at, sender_id: m.sender_id, message: m.message }));
        setMessagesByConv((prev): Record<string, ChatMessage[]> => {
          const existing = prev[selectedConversationId] || [];
          const updatedExisting = existing.map((m) => {
            const src = m.srcId != null ? m.srcId : parseInt(m.id.split('-').pop() || '0');
            const im = incoming.get(src);
            if (im) {
              const newTime = new Date(im.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
              const newStatus = im.read_at ? "delivered" : "sent";
              return { ...m, time: newTime, status: newStatus };
            }
            return m;
          });
          const existingIds = new Set(updatedExisting.map((m) => (m.srcId != null ? m.srcId : parseInt(m.id.split('-').pop() || '0'))));
          const toAdd = (resp.data || []).filter((m) => !existingIds.has(m.id)).map((m) => ({
            id: `${selectedConversationId}-${m.id}`,
            sender: m.sender_id === metaUserId ? "user" : "admin",
            content: m.message,
            time: new Date(m.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
            status: m.read_at ? "delivered" : "sent",
            srcId: m.id,
          }));
          const merged = toAdd.length ? [...updatedExisting, ...toAdd] : updatedExisting;
          return { ...prev, [selectedConversationId]: merged as ChatMessage[] };
        });
        const last = (resp.data || [])[resp.data.length - 1];
        if (last) {
          const by = last.sender_id === resp.meta.user.id ? (resp.meta.user.name || "مستخدم") : "Admin";
          const lastAt = last.created_at;
          setInboxItems((prev) => prev.map((it) => (it.conversation_id === selectedConversationId ? { ...it, last_message: last.message, last_message_by: by, last_message_at: lastAt } : it)));
        }
      } catch {}
    };
    pollRef.current = window.setInterval(tick, 4000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [currentUserId, selectedConversationId]);

  useEffect(() => {
    if (inboxPollRef.current) {
      clearInterval(inboxPollRef.current);
      inboxPollRef.current = null;
    }
    const tick = async () => {
      try {
        const resp = await fetchSupportInbox();
        const items = (resp?.data ?? []).filter(Boolean) as SupportInboxItem[];
        const merged = items.map((it) =>
          selectedConversationId && it.conversation_id === selectedConversationId
            ? { ...it, unread_count: 0 }
            : it
        );
        setInboxItems(merged);
        if (!selectedConversationId && merged.length > 0) {
          setSelectedConversationId(merged[0].conversation_id);
        }
      } catch {}
    };
    inboxPollRef.current = window.setInterval(tick, 5000);
    return () => {
      if (inboxPollRef.current) {
        clearInterval(inboxPollRef.current);
        inboxPollRef.current = null;
      }
    };
  }, [selectedConversationId]);

  useEffect(() => {
    if (bubblesRef.current) {
      bubblesRef.current.scrollTop = bubblesRef.current.scrollHeight;
    }
  }, [messagesByConv, selectedConversationId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesignMode(true);
    };
    const handleMouseDown = (e: MouseEvent) => {
      const el = chatPaneRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setDesignMode(true);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const filteredInbox = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return inboxItems;
    return inboxItems.filter((it) => {
      const name = (it.user?.name || "").toLowerCase();
      const phone = (it.user?.phone || "").toLowerCase();
      const email = (it.user?.email || "").toLowerCase();
      const lastText = (it.last_message || "").toLowerCase();
      return name.includes(term) || phone.includes(term) || email.includes(term) || lastText.includes(term);
    });
  }, [inboxItems, searchTerm]);

  const currentMessages = useMemo(() => {
    if (!selectedConversationId) return [];
    return messagesByConv[selectedConversationId] || [];
  }, [messagesByConv, selectedConversationId]);

  const selectedConversationItem = useMemo(() => inboxItems.find((it) => it.conversation_id === selectedConversationId) || null, [inboxItems, selectedConversationId]);

  const lastUserMessageText = useMemo(() => {
    const text = selectedConversationItem?.last_message || "";
    return text;
  }, [selectedConversationItem]);

  const smartSuggestions: QuickReply[] = useMemo(() => {
    const text = lastUserMessageText.toLowerCase();
    const suggestions: QuickReply[] = [];
    if (!text) {
      return [
        { id: "s1", title: "كيف أساعد؟", content: "كيف يمكنني مساعدتك؟" },
        { id: "s2", title: "استلام", content: "تم استلام رسالتك وجاري المراجعة." },
      ];
    }
    if (text.includes("السلام")) suggestions.push({ id: "s3", title: "وعليكم السلام", content: "وعليكم السلام، أهلاً بك" });
    if (text.includes("سعر") || text.includes("كم")) suggestions.push({ id: "s4", title: "السعر", content: "سعر المنتج موضح في الإعلان، هل تحتاج تفاصيل إضافية؟" });
    if (text.includes("مكان") || text.includes("اين") || text.includes("عنوان")) suggestions.push({ id: "s5", title: "الموقع", content: "الموقع موضح في الإعلان، يمكنني مساعدتك بالتفاصيل" });
    if (text.includes("وقت") || text.includes("ساعات") || text.includes("موعد")) suggestions.push({ id: "s6", title: "المواعيد", content: "ساعات العمل من 9 صباحًا حتى 9 مساءً" });
    if (suggestions.length === 0) suggestions.push({ id: "s7", title: "معلومات أكثر", content: "هل يمكنك تزويدنا بمزيد من التفاصيل؟" });
    return suggestions;
  }, [lastUserMessageText]);

  const formatTime = (ts?: string | null) => {
    if (!ts) return "";
    const t = ts.replace(" ", "T");
    const d = new Date(t);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    }
    return ts;
  };

  const startFilteredUsers = useMemo(() => {
    const term = startSearch.trim().toLowerCase();
    if (!term) return startUsers;
    return startUsers.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const code = (u.user_code || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      return name.includes(term) || code.includes(term) || phone.includes(term);
    });
  }, [startUsers, startSearch]);

  const startConversationWithUser = (item: SupportInboxItem) => {
    const cid = item.conversation_id;
    if (!messagesByConv[cid]) {
      setMessagesByConv((prev) => ({ ...prev, [cid]: [] }));
    }
    setSelectedConversationId(cid);
    setIsStartModalOpen(false);
    setDesignMode(false);
  };
  const startConversationWithUserSummary = async (user: UserSummary) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchSupportConversation(user.id);
      const cid = resp.meta.conversation_id;
      setCurrentUserId(resp.meta.user.id);
      setSelectedConversationId(cid);
      const last = (resp.data || [])[resp.data.length - 1];
      const by = last ? (last.sender_id === resp.meta.user.id ? (resp.meta.user.name || "مستخدم") : "Admin") : null;
      const item: SupportInboxItem = {
        conversation_id: cid,
        user: resp.meta.user,
        last_message: last ? last.message : null,
        last_message_at: last ? last.created_at : null,
        last_message_by: by,
        messages_count: Number(resp.meta.total || (resp.data || []).length),
        unread_count: 0,
      };
      setInboxItems((prev) => {
        const exists = prev.find((it) => it.conversation_id === cid);
        if (exists) return prev.map((it) => (it.conversation_id === cid ? item : it));
        return [item, ...prev];
      });
      setIsStartModalOpen(false);
      setDesignMode(false);
    } catch (e) {
      setError((e as Error)?.message || "تعذر فتح محادثة المستخدم");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!selectedConversationId) return;
    const text = content.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: `${selectedConversationId}-${msgIdRef.current++}`,
      sender: "admin",
      content: text,
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };
    setMessagesByConv((prev) => ({ ...prev, [selectedConversationId]: [...(prev[selectedConversationId] || []), msg] }));
    setMessageInput("");
    setIsTyping(false);
    try {
      if (currentUserId == null) return;
      const resp = await replySupport({ user_id: currentUserId, message: text });
      const serverTime = new Date(resp.data.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
      setMessagesByConv((prev) => {
        const list = [...(prev[selectedConversationId] || [])];
        const idx = list.findIndex((m) => m.id === msg.id);
        if (idx >= 0) list[idx] = { ...list[idx], time: serverTime, srcId: resp.data.id };
        return { ...prev, [selectedConversationId]: list };
      });
      setInboxItems((prev) => prev.map((it) => it.conversation_id === selectedConversationId ? { ...it, last_message: text, last_message_by: resp.data.admin_name, last_message_at: resp.data.created_at } : it));
    } catch {}
  };

  const handleSend = () => { sendMessage(messageInput); };
  const handleQuickSend = (qr: QuickReply) => { sendMessage(qr.content); };
  const appendEmoji = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };
  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => {
      if (!selectedConversationId) return;
      if (f.type.startsWith("image/")) {
        const url = URL.createObjectURL(f);
        const msg: ChatMessage = {
          id: `${selectedConversationId}-${msgIdRef.current++}`,
          sender: "admin",
          content: "",
          imageUrl: url,
          time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          status: "sent",
        };
        setMessagesByConv((prev) => ({ ...prev, [selectedConversationId]: [...(prev[selectedConversationId] || []), msg] }));
      } else {
        sendMessage(`📎 ${f.name}`);
      }
    });
    e.target.value = "";
    setShowAttachmentsPanel(false);
  };

  return (
    <div className="messages-page">
      <div className="messages-header">
        <div className="header-content">
          <div className="title-section">
            <div className="title-icon">💬</div>
            <div>
              <h1 className="page-title">الرسائل</h1>
              <p className="page-subtitle">محادثة بين المشرف والمستخدم مع ردود سريعة</p>
            </div>
          </div>
          {supportStats && (
            <div className="chat-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))', gap: 12 }}>
              <div className="stat-card">
                <span className="value-secondary">{supportStats.total_conversations}</span>
                <span className="label">إجمالي المحادثات</span>
              </div>
              <div className="stat-card">
                <span className="value-secondary">{supportStats.unread_conversations}</span>
                <span className="label">غير مقروءة</span>
              </div>
              <div className="stat-card">
                <span className="value-secondary">{supportStats.today_messages}</span>
                <span className="label">رسائل اليوم</span>
              </div>
              {/* <div className="stat-card">
                <span className="value-secondary">{supportStats.avg_response_time ?? '-'}</span>
                <span className="label">متوسط زمن الرد</span>
              </div> */}
            </div>
          )}
        </div>
      </div>

      <div className="messages-layout">
        <aside className="messages-sidebar">
          <div className="messages-search">
            <input
              className="form-input"
              type="text"
              placeholder="بحث بالاسم أو الكود أو الهاتف"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="start-chat-btn" onClick={() => setIsStartModalOpen(true)}>ابدأ محادثة</button>
          </div>
          <div className="messages-list">
            {filteredInbox.map((it) => (
              <button
                key={it.conversation_id}
                className={`messages-user-item ${selectedConversationId === it.conversation_id ? "active" : ""}`}
                onClick={() => { setSelectedConversationId(it.conversation_id); setDesignMode(false); }}
              >
                <Image src={"/profile.png"} alt="" width={36} height={36} className="messages-avatar" />
                <div className="messages-user-meta">
                  <div className="messages-user-name">
                    {it.user?.name || "مستخدم"}
                    {(() => {
                      const unreadVal = Number(it.unread_count) || 0;
                      return unreadVal > 0 ? (
                        <span className="unread-badge">{unreadVal}</span>
                      ) : null;
                    })()}
                  </div>
                  <div className="messages-user-extra">
                    <span className="last-text" dir="rtl" style={{ direction: 'rtl', textAlign: 'right' }}>{`${it.last_message_by ? `${it.last_message_by}: ` : ""}${it.last_message || ""}`}</span>
                    <span className="last-time">{formatTime(it.last_message_at)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="chat-pane" ref={chatPaneRef} onClick={() => setDesignMode(false)}>
          {selectedConversationItem ? (
            <>
              <div className="chat-header" style={{ display: designMode ? "none" : undefined }}>
                <div className="chat-user">
                  <Image src={"/profile.png"} alt="" width={40} height={40} className="messages-avatar" />
                  <div>
                    <div className="chat-user-name">{selectedConversationItem.user?.name || "مستخدم"}</div>
                    <div className="chat-user-code">{selectedConversationItem.user?.phone || selectedConversationItem.user?.email || ""}</div>
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="quick-replies-toggle" onClick={() => setShowQuickReplies((v) => !v)}>
                    الردود السريعة
                  </button>
                  <button className="quick-replies-toggle" onClick={() => window.location.href = '/users'}>
                    ملف المستخدم
                  </button>
                  {selectedConversationItem && (
                    <div
                      className="messages-counter"
                      style={{ marginInlineStart: 'auto', background: '#0ea5e9', color: '#fff', padding: '4px 10px', borderRadius: 9999, fontSize: '0.8rem' }}
                    >
                      الرسائل: {selectedConversationItem.messages_count}
                    </div>
                  )}
                </div>
              </div>

              {showQuickReplies && (
                <div className="quick-replies-menu" style={{ display: designMode ? "none" : undefined }}>
                  {quickReplies.map((qr) => (
                    <button key={qr.id} className="quick-reply-chip" onClick={() => handleQuickSend(qr)}>
                      {qr.title}
                    </button>
                  ))}
                </div>
              )}
              <div className="chat-showcase" style={{ display: designMode ? "flex" : "none" }} onClick={() => setDesignMode(false)}>
                <div className="showcase-card" onClick={(e) => e.stopPropagation()}>
                  <div className="showcase-brand">
                    <Image src="/nas-masr.png" alt="" width={64} height={64} className="showcase-logo" />
                    <span>ناس مصر</span>
                  </div>
                  {/* <h3 className="showcase-title">منطقة المحادثة</h3>
                  <p className="showcase-subtitle">اضغط ESC أو داخل المحادثة للعودة</p>
                  <div className="showcase-actions">
                    <button className="btn-primary" onClick={() => setDesignMode(false)}>عودة للمحادثة</button>
                    <button className="btn-secondary" onClick={() => setDesignMode(false)}>إغلاق العرض</button>
                  </div> */}
                </div>
              </div>

              <div style={{ display: designMode ? "none" : "block" }}>
                <div className="smart-suggestions">
                  {smartSuggestions.map((qr) => (
                    <button key={qr.id} className="smart-chip" onClick={() => handleQuickSend(qr)}>
                      {qr.title}
                    </button>
                  ))}
                </div>

                <div className="chat-bubbles" ref={bubblesRef}>
                  {currentMessages.map((m) => (
                    <div key={m.id} className={`chat-bubble ${m.sender === "admin" ? "admin" : "user"}`}>
                      {m.imageUrl ? (
                        <>
                          <img src={m.imageUrl} alt="" className="bubble-image" />
                          <div className="bubble-time">
                            {m.time}
                            {m.sender === "admin" && (
                              <span className={`bubble-status ${m.status}`}>{m.status === "delivered" ? "✓✓" : "✓"}</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bubble-content">{m.content}</div>
                          <div className="bubble-time">
                            {m.time}
                            {m.sender === "admin" && (
                              <span className={`bubble-status ${m.status}`}>{m.status === "delivered" ? "✓✓" : "✓"}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  )}
                </div>

                <div className="chat-input-bar">
                  <div className="chat-input">
                  <button
                    className="input-action"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                      else setShowAttachmentsPanel((v) => !v);
                    }}
                    title="إرفاق"
                  >
                    📎
                  </button>
                  <button
                    className="input-action"
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    title="إيموجي"
                  >
                    😊
                  </button>
                  <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleAttachFiles} />

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      setIsTyping(e.target.value.trim().length > 0);
                    }}
                    placeholder="اكتب رسالتك هنا"
                    className="chat-input-field"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                  />

                  <button className="send-btn" onClick={handleSend} title="إرسال">
                    <span className="send-icon">✈️</span>
                  </button>
                  </div>
                </div>

                {showEmojiPicker && (
                  <div className="emoji-menu">
                    {["😀","😂","😍","👍","🙏","🔥","🎉","😎","😉","🙌"].map((e) => (
                      <button key={e} className="emoji-chip" onClick={() => appendEmoji(e)}>{e}</button>
                    ))}
                  </div>
                )}

                {showAttachmentsPanel && (
                  <div className="attachments-popover">
                    <div className="attachments-title">إرفاق</div>
                    <button className="attachment-option" onClick={() => fileInputRef.current?.click()}>ملفات</button>
                    <button className="attachment-option">صورة</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>اختر محادثة لبدء الدعم</h3>
            </div>
          )}
        </section>
      </div>
      {isStartModalOpen && (
        <div className="modal-overlay" onClick={() => setIsStartModalOpen(false)}>
          <div className="start-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>بدء محادثة</h3>
              <button className="modal-close" onClick={() => setIsStartModalOpen(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="start-search">
                <input
                  className="form-input"
                  type="text"
                  placeholder="بحث بالاسم أو الكود أو الهاتف"
                  value={startSearch}
                  onChange={(e) => setStartSearch(e.target.value)}
                />
              </div>
              <div className="start-list">
                {startFilteredUsers.map((u) => (
                  <button key={u.id} className="start-item" onClick={() => startConversationWithUserSummary(u)}>
                    <Image src={"/profile.png"} alt="" width={36} height={36} className="start-avatar" />
                    <div className="start-meta">
                      <div className="start-name">{u.name || "مستخدم"}</div>
                      <div className="start-sub">
                        <span className="start-code">{u.user_code || u.phone || ''}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setIsStartModalOpen(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
