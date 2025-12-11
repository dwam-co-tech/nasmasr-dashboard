"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { fetchAdminConversations, fetchAdminConversation, searchAdminConversations, fetchAdminConversationsStats } from "@/services/customerChats";
import type { ConversationItem, ConversationsMeta, ConversationMessage, SingleConversationMeta, SearchResponse, ConversationsStatsResponse } from "@/models/customer-chats";

export default function CustomerChatsPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [meta, setMeta] = useState<ConversationsMeta | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [msgMeta, setMsgMeta] = useState<SingleConversationMeta | null>(null);
  const [msgPage, setMsgPage] = useState(1);
  const msgPerPage = 50;
  const [searchStats, setSearchStats] = useState<SearchResponse | null>(null);
  const [convStats, setConvStats] = useState<ConversationsStatsResponse | null>(null);
  const [lastTextCache, setLastTextCache] = useState<Record<string, { text: string; time: string }>>({});
  const [unreadCache, setUnreadCache] = useState<Record<string, number>>({});
  const [designMode, setDesignMode] = useState(true);
  const chatPaneRef = useRef<HTMLDivElement | null>(null);

  function formatTimeHM(s?: string) {
    const t = String(s || "").trim();
    if (!t) return "";
    const d = new Date(t);
    if (isNaN(d.getTime())) return t;
    return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  }

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetchAdminConversations(currentPage, perPage);
        setConversations(resp.data || []);
        setMeta(resp.meta || null);
        setSelectedConvId((prev) => prev ?? (resp.data?.[0]?.conversation_id ?? null));
      } catch {}
    };
    load();
  }, [currentPage]);

  useEffect(() => {
    try {
      const totalUnread = conversations.reduce((sum, c) => {
        const v = typeof c.unread_count === 'number' ? c.unread_count : (unreadCache[c.conversation_id] ?? 0);
        return sum + (Number(v) || 0);
      }, 0);
      if (typeof window !== 'undefined') {
        localStorage.setItem('customerChatsCount', String(totalUnread));
      }
    } catch {}
  }, [conversations, unreadCache]);

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

  useEffect(() => {
    const load = async () => {
      try {
        if (!selectedConvId) { setMessages([]); setMsgMeta(null); return; }
        const resp = await fetchAdminConversation(selectedConvId, msgPage, msgPerPage);
        setMessages(resp.data || []);
        setMsgMeta(resp.meta || null);
        const last = (resp.data || []).slice(-1)[0];
        if (last) setLastTextCache(prev => ({ ...prev, [selectedConvId]: { text: last.message, time: formatTimeHM(last.created_at) } }));
        const unreadCount = (resp.data || []).filter(m => !m.read_at).length;
        setUnreadCache(prev => ({ ...prev, [selectedConvId]: unreadCount }));
      } catch { setMessages([]); setMsgMeta(null); }
    };
    load();
  }, [selectedConvId, msgPage]);

  useEffect(() => {
    const fillMissing = async () => {
      const per = 50;
      for (const c of conversations) {
        const needText = !(c.last_message_text && String(c.last_message_text).trim());
        const needUnread = typeof c.unread_count !== 'number';
        if (!needText && !needUnread) continue;
        try {
          const lastPage = Math.max(1, Math.ceil((c.messages_count || per) / per));
          const resp = await fetchAdminConversation(c.conversation_id, lastPage, per);
          const arr = resp.data || [];
          const last = arr.slice(-1)[0];
          if (needText && last) setLastTextCache(prev => ({ ...prev, [c.conversation_id]: { text: last.message, time: formatTimeHM(last.created_at) } }));
          if (needUnread) {
            const unreadCount = arr.filter(m => !m.read_at).length;
            setUnreadCache(prev => ({ ...prev, [c.conversation_id]: unreadCount }));
          }
        } catch {}
      }
    };
    fillMissing();
  }, [conversations]);

  useEffect(() => {
    const load = async () => {
      try {
        const term = searchTerm.trim();
        if (!term) { setSearchStats(null); return; }
        const resp = await searchAdminConversations(term);
        setSearchStats(resp || null);
      } catch { setSearchStats(null); }
    };
    const timer = setTimeout(load, 300);
    return () => { clearTimeout(timer); };
  }, [searchTerm]);

  useEffect(() => {
    const load = async () => {
      try {
        const stats = await fetchAdminConversationsStats();
        setConvStats(stats || null);
      } catch { setConvStats(null); }
    };
    load();
  }, []);

  const toImageUrl = () => "/profile.png";
  const safeName = (s?: string | null) => {
    const n = String(s || '').trim();
    return n || 'مستخدم';
  };
  const formatDateDDMMYYYY = (s?: string | null) => {
    const t = String(s || '').trim();
    if (!t) return '-';
    const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return t;
    return `${m[3]}-${m[2]}-${m[1]}`;
  };
  const dateKey = (s?: string | null) => {
    const t = String(s || '').trim();
    const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
  };
  const formatGroupDateLabel = (ymd: string) => {
    const today = new Date();
    const ymdToday = today.toISOString().slice(0, 10);
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    const ymdYesterday = y.toISOString().slice(0, 10);
    if (ymd === ymdToday) return 'اليوم';
    if (ymd === ymdYesterday) return 'أمس';
    return formatDateDDMMYYYY(ymd);
  };

  const filteredConvs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((c) => {
      const a = c.participants[0];
      const b = c.participants[1];
      const fields = [a?.name, a?.phone, b?.name, b?.phone];
      return fields.some((v) => String(v || '').toLowerCase().includes(term));
    });
  }, [conversations, searchTerm]);

  const selectedConv = useMemo(() => filteredConvs.find((c) => c.conversation_id === selectedConvId) || filteredConvs[0] || null, [filteredConvs, selectedConvId]);

  const lastMetaByConv = useMemo(() => {
    const r: Record<string, { text: string; time: string }> = {};
    conversations.forEach((c) => {
      const cached = lastTextCache[c.conversation_id];
      r[c.conversation_id] = {
        text: cached?.text ?? (String(c.last_message_text || '').trim() || '—'),
        time: cached?.time ?? formatTimeHM(c.last_message_at),
      };
    });
    return r;
  }, [conversations, lastTextCache]);

  const groupedMessages = useMemo(() => {
    const map = new Map<string, ConversationMessage[]>();
    messages.forEach((m) => {
      const k = dateKey(m.created_at) || 'unknown';
      const arr = map.get(k) || [];
      arr.push(m);
      map.set(k, arr);
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([date, items]) => ({ date, items }));
  }, [messages]);

  return (
    <div className="customer-chats-page">
      <div className="customer-chats-header">
        <div className="header-content">
          <div className="title-section">
            <div className="title-icon">👥</div>
            <div>
              <h1 className="page-title">محادثات العملاء</h1>
              <p className="page-subtitle">عرض المحادثات بين المعلنين والمستخدمين (قراءة فقط)</p>
            </div>
          </div>
          {convStats && (
            <div className="chat-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))', gap: 12 }}>
              <div className="stat-card">
                <span className="value-secondary">{convStats.total_peer_conversations}</span>
                <span className="label">إجمالي المحادثات</span>
              </div>
              <div className="stat-card">
                <span className="value-secondary">{convStats.total_peer_messages}</span>
                <span className="label">إجمالي الرسائل</span>
              </div>
              <div className="stat-card">
                <span className="value-secondary">{convStats.today_messages}</span>
                <span className="label">رسائل اليوم</span>
              </div>
              <div className="stat-card">
                <span className="value-secondary">{convStats.active_users_today}</span>
                <span className="label">مستخدمون نشطون اليوم</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="customer-chats-layout">
        <aside className="customer-chats-sidebar">
          <div className="customer-chats-search">
            <input
              className="form-input"
              type="text"
              placeholder="بحث بالاسم أو الكود أو الهاتف"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchStats && (
              <div className="search-stats" style={{ display: 'flex', gap: 12, marginTop: 6, color: '#64748b', fontSize: 12 }}>
                <span>مستخدمين: {searchStats.users_found}</span>
                <span>محادثات: {searchStats.conversations_found}</span>
              </div>
            )}
          </div>
          <div className="customer-chats-list">
            {filteredConvs.map((c) => (
              <button
                key={c.conversation_id}
                className={`customer-chat-item ${selectedConv?.conversation_id === c.conversation_id ? "active" : ""}`}
                onClick={() => { setSelectedConvId(c.conversation_id); setDesignMode(false); }}
              >
                <Image src={toImageUrl()} alt="" width={32} height={32} className="chat-avatar" />
                <Image src={toImageUrl()} alt="" width={28} height={28} className="chat-avatar small" />
                <div className="customer-chat-meta">
                  <div className="customer-chat-names">{safeName(c.participants[0]?.name)} ↔ {safeName(c.participants[1]?.name)}</div>
                  <div className="customer-chat-last">
                    <span className="last-text">{lastMetaByConv[c.conversation_id]?.text}</span>
                    <span className="last-time">{lastMetaByConv[c.conversation_id]?.time}</span>
                  </div>
                </div>
                {(() => {
                  const unreadVal = typeof c.unread_count === 'number' ? c.unread_count : (unreadCache[c.conversation_id] ?? 0);
                  return unreadVal > 0 ? (
                    <div
                      className="unread-circle"
                      style={{ marginInlineStart: 'auto', minWidth: 24, height: 24, borderRadius: 12, background: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', paddingInline: 6 }}
                    >
                      {unreadVal}
                    </div>
                  ) : null;
                })()}
              </button>
            ))}
          </div>
        </aside>

        <section className="customer-chat-pane" ref={chatPaneRef} onClick={() => setDesignMode(false)}>
          {selectedConv ? (
            <>
              <div className="customer-chat-header" style={{ display: designMode ? "none" : undefined }}>
                <div className="participants">
                  <div className="participant">
                    <Image src={toImageUrl()} alt="" width={36} height={36} className="chat-avatar" />
                    <div className="participant-meta">
                      <div className="participant-name">{safeName(selectedConv.participants[0]?.name)}</div>
                      <div className="participant-role">طرف</div>
                    </div>
                  </div>
                  <div className="participant">
                    <Image src={toImageUrl()} alt="" width={36} height={36} className="chat-avatar" />
                    <div className="participant-meta">
                      <div className="participant-name">{safeName(selectedConv.participants[1]?.name)}</div>
                      <div className="participant-role">طرف</div>
                    </div>
                  </div>
                </div>
                {/* <div className="view-only">مشاهدة فقط</div> */}
                {selectedConv && (
                  <div
                    className="messages-counter"
                    style={{ marginInlineStart: 'auto', background: '#0ea5e9', color: '#fff', padding: '4px 10px', borderRadius: 9999, fontSize: '0.8rem' }}
                  >
                    الرسائل: {selectedConv.messages_count}
                  </div>
                )}
              </div>

              <div className="chat-showcase" style={{ display: designMode ? "flex" : "none" }} onClick={() => setDesignMode(false)}>
                <div className="showcase-card" onClick={(e) => e.stopPropagation()}>
                  <div className="showcase-brand">
                    <Image src="/nas-masr.png" alt="" width={64} height={64} className="showcase-logo" />
                    <span>ناس مصر</span>
                  </div>
                  {/* <h3 className="showcase-title">ابدأ المحادثة</h3> */}
                  {/* <p className="showcase-subtitle">اضغط ESC أو داخل المحادثة للعودة</p>
                  <div className="showcase-actions">
                    <button className="btn-primary" onClick={() => setDesignMode(false)}>عودة للمحادثة</button>
                    <button className="btn-secondary" onClick={() => setDesignMode(false)}>إغلاق العرض</button>
                  </div> */}
                </div>
              </div>

              <div className="customer-chat-bubbles" style={{ display: designMode ? "none" : "block" }}>
                {groupedMessages.map((g) => (
                  <div key={g.date} className="chat-date-block">
                    <div className="chat-date-group"><div className="date-separator">{formatGroupDateLabel(g.date)}</div></div>
                    {g.items.map((m) => {
                      const a = selectedConv.participants[0];
                      const bubbleClass = m.sender.id === a?.id ? 'user' : 'advertiser';
                      return (
                        <div key={m.id} className={`cust-bubble ${bubbleClass}`}>
                          <div className="bubble-content">{m.message}</div>
                          <div className="bubble-time">{formatTimeHM(m.created_at)}<span className={`read-status ${m.read_at ? 'read' : 'unread'}`}>✓✓</span></div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className={`cust-bubble user`}>
                    <div className="bubble-content">لا توجد رسائل</div>
                    <div className="bubble-time"></div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🗂️</div>
              <h3>لا توجد محادثات لعرضها</h3>
            </div>
          )}
        </section>
      </div>
      {meta && meta.last_page > 1 && (
        <div className="pagination-container" style={{ marginTop: '1rem' }}>
          <div className="pagination">
            <button className="pagination-btn pagination-nav" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>السابق</button>
            <span className="page-info">الصفحة {meta.page} من {meta.last_page}</span>
            <button className="pagination-btn pagination-nav" onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))} disabled={currentPage >= meta.last_page}>التالي</button>
          </div>
        </div>
      )}
      {msgMeta && msgMeta.total > msgMeta.per_page && (
        <div className="pagination-container" style={{ marginTop: '0.75rem' }}>
          <div className="pagination">
            <button className="pagination-btn pagination-nav" onClick={() => setMsgPage((p) => Math.max(1, p - 1))} disabled={msgPage <= 1}>السابق</button>
            <span className="page-info">رسائل الصفحة {msgMeta.page} من {Math.max(1, Math.ceil(msgMeta.total / msgMeta.per_page))}</span>
            <button className="pagination-btn pagination-nav" onClick={() => setMsgPage((p) => p + 1)} disabled={msgPage * msgMeta.per_page >= msgMeta.total}>التالي</button>
          </div>
        </div>
      )}
    </div>
  );
}
