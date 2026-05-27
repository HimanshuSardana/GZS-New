import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiCalendar, FiBell, FiCheckCircle, FiChevronLeft, FiChevronRight, FiX, FiClock, FiUsers, FiVideo, FiDownload } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/Toast';
import { useEvents } from '@/services/mutators/useCommunity';
import core from '@/services/api/core';
import { MOCK_EVENTS_BY_BRANCH } from '@/shared/data/communityData';

function generateICS(event) {
  const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const startAt = event.startAt || event.start_at;
  const endAt = event.endAt || event.end_at || new Date(new Date(startAt).getTime() + 3600000).toISOString();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GzoneSphere//Events//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@gzonesphere.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(startAt)}`,
    `DTEND:${fmt(endAt)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n').slice(0, 500)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([lines], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

const REMINDER_OPTIONS = [
  { label: '1 hour before', minutes: 60 },
  { label: '3 hours before', minutes: 180 },
  { label: '1 day before', minutes: 1440 },
  { label: '1 week before', minutes: 10080 },
];

function RemindMeButton({ event, showToast }) {
  const [open, setOpen] = useState(false);
  const [set, setSet] = useState(false);
  const ref = useRef(null);

  const setReminder = async (minutes) => {
    setOpen(false);
    try {
      await core.post(`/community/events/${event.id}/reminder`, { minutes_before: minutes });
    } catch { /* reminder API unavailable */ }
    setSet(true);
    const opt = REMINDER_OPTIONS.find(o => o.minutes === minutes);
    showToast(`Reminder set: ${opt?.label || 'custom'} for "${event.title}".`, 'success');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1.5 text-sm transition-colors ${set ? 'text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}
      >
        <FiBell size={13} />
        {set ? 'Reminder Set' : 'Remind Me'}
      </button>
      {open && (
        <div className="absolute bottom-8 left-0 z-10 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl min-w-[180px]">
          {REMINDER_OPTIONS.map(opt => (
            <button
              key={opt.minutes}
              onClick={() => setReminder(opt.minutes)}
              className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TYPE_META = {
  tournament: { icon: '🏆', label: 'Tournament', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  game_jam: { icon: '🎮', label: 'Game Jam', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  writing_contest: { icon: '✍️', label: 'Writing Contest', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  art_showcase: { icon: '🎨', label: 'Art Showcase', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  ama: { icon: '🎤', label: 'AMA Session', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  workshop: { icon: '📚', label: 'Workshop', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  listening_party: { icon: '🎵', label: 'Listening Party', color: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' },
  community_call: { icon: '💬', label: 'Community Call', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
};

const NOW = new Date('2026-04-27');
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function googleCalLink(event) {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace('.000', '');
  const start = new Date(event.startAt || event.start_at);
  const end = new Date(event.endAt || event.end_at || new Date(start.getTime() + 3600000));
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(event.description || '')}`;
}

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function buildWeekDays(anchorDate) {
  const start = new Date(anchorDate);
  const dow = start.getDay();
  start.setDate(start.getDate() - dow);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function CommunityEvents() {
  const { slug = 'general' } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [pendingEvents, setPendingEvents] = useState(new Set());
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [calendarMode, setCalendarMode] = useState('Month');
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(3); // April = 3 (0-indexed)
  const [weekAnchor, setWeekAnchor] = useState(new Date('2026-04-27'));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [rsvpedEvents, setRsvpedEvents] = useState(new Set());

  const { data: eventsData } = useEvents(slug);
  const events = useMemo(() => {
    const live = eventsData?.data || eventsData || [];
    return live.length > 0 ? live : (MOCK_EVENTS_BY_BRANCH[slug] || []);
  }, [eventsData, slug]);

  const handleRsvp = async (eventId) => {
    const already = rsvpedEvents.has(eventId);
    setRsvpedEvents(prev => { const s = new Set(prev); already ? s.delete(eventId) : s.add(eventId); return s; });
    try {
      if (!already) await core.post(`/community/events/${eventId}/rsvp`);
      else await core.delete(`/community/events/${eventId}/rsvp`);
    } catch {
      setRsvpedEvents(prev => { const s = new Set(prev); already ? s.add(eventId) : s.delete(eventId); return s; });
    }
  };

  const filteredEvents = useMemo(() => {
    if (!selectedDate) return events;
    return events.filter(e => {
      const d = new Date(e.startAt || e.start_at);
      return d.getDate() === selectedDate.getDate() &&
             d.getMonth() === selectedDate.getMonth() &&
             d.getFullYear() === selectedDate.getFullYear();
    });
  }, [events, selectedDate]);

  const monthGrid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const weekDays = useMemo(() => buildWeekDays(weekAnchor), [weekAnchor]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }
  function prevWeek() {
    setWeekAnchor((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  }
  function nextWeek() {
    setWeekAnchor((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  }

  function eventsOnDay(day, month, year) {
    return events.filter((e) => {
      const d = new Date(e.startAt || e.start_at);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  }

  function eventsOnDate(date) {
    return events.filter((e) => {
      const d = new Date(e.startAt || e.start_at);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
  }

  const monthName = new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(viewYear, viewMonth, 1));
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekLabel = `${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(weekStart)} – ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(weekEnd)}`;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-white">Community Events</h1>
              <p className="mt-1.5 text-sm text-slate-400">
                Upcoming sessions, workshops, jams, and live moments in{' '}
                <span className="capitalize text-indigo-300">{slug}</span>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCalendarView((v) => !v)}
                className="rounded-full bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                {isCalendarView ? 'Card View' : 'Calendar View'}
              </button>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>

        {/* Calendar view */}
        {isCalendarView ? (
          <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
            {/* Mode toggle + navigation */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {['Month', 'Week'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCalendarMode(mode)}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${calendarMode === mode ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={calendarMode === 'Month' ? prevMonth : prevWeek}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <FiChevronLeft size={16} />
                </button>
                <span className="min-w-[180px] text-center text-sm font-medium text-white">
                  {calendarMode === 'Month' ? `${monthName} ${viewYear}` : weekLabel}
                </span>
                <button
                  onClick={calendarMode === 'Month' ? nextMonth : nextWeek}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((d) => (
                <div key={d} className="py-1 text-center text-[11px] font-medium text-slate-500 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Month grid */}
            {calendarMode === 'Month' ? (
              <div className="grid grid-cols-7 gap-px bg-slate-800 rounded-xl overflow-hidden">
                {monthGrid.map((day, i) => {
                  if (day === null) {
                    return <div key={`empty-${i}`} className="bg-slate-950/50 min-h-[72px] p-1" />;
                  }
                  const dayEvents = eventsOnDay(day, viewMonth, viewYear);
                  const isToday = day === NOW.getDate() && viewMonth === NOW.getMonth() && viewYear === NOW.getFullYear();
                  return (
                    <div 
                      key={`day-${day}`} 
                      onClick={() => {
                        setSelectedDate(new Date(viewYear, viewMonth, day));
                        setIsCalendarView(false);
                      }}
                      className={`bg-slate-900 min-h-[72px] p-1.5 cursor-pointer hover:bg-slate-800/50 transition-colors ${isToday ? 'ring-1 ring-indigo-500/50' : ''}`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? 'bg-indigo-500 text-white font-semibold' : 'text-slate-400'}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((e) => {
                          const meta = TYPE_META[e.type] || TYPE_META.workshop;
                          return (
                            <button
                              key={e.id}
                              onClick={() => setSelectedEvent(e)}
                              className="w-full truncate rounded bg-indigo-500/20 px-1 py-0.5 text-left text-[10px] text-indigo-200 hover:bg-indigo-500/30 transition-colors"
                            >
                              {meta.icon} {e.title}
                            </button>
                          );
                        })}
                        {dayEvents.length > 2 ? (
                          <button
                            onClick={() => setSelectedEvent(dayEvents[2])}
                            className="w-full text-left text-[10px] text-slate-500 hover:text-slate-300 px-1"
                          >
                            +{dayEvents.length - 2} more
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Week grid */
              <div className="grid grid-cols-7 gap-px bg-slate-800 rounded-xl overflow-hidden">
                {weekDays.map((date, i) => {
                  const dayEvents = eventsOnDate(date);
                  const isToday = date.toDateString() === NOW.toDateString();
                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                        setSelectedDate(date);
                        setIsCalendarView(false);
                      }}
                      className={`bg-slate-900 min-h-[160px] p-1.5 cursor-pointer hover:bg-slate-800/50 transition-colors ${isToday ? 'ring-1 ring-indigo-500/50' : ''}`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? 'bg-indigo-500 text-white font-semibold' : 'text-slate-400'}`}>
                        {date.getDate()}
                      </span>
                      <div className="mt-1.5 space-y-1">
                        {dayEvents.map((e) => {
                          const meta = TYPE_META[e.type] || TYPE_META.workshop;
                          return (
                            <button
                              key={e.id}
                              onClick={() => setSelectedEvent(e)}
                              className="w-full rounded bg-indigo-500/20 px-1 py-1 text-left hover:bg-indigo-500/30 transition-colors"
                            >
                              <p className="truncate text-[10px] text-indigo-200">{meta.icon} {e.title}</p>
                              <p className="text-[9px] text-slate-400">
                                {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(e.startAt || e.start_at))}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          /* Card view */
          <section className="mt-6 space-y-4">
            {selectedDate && (
              <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3 text-indigo-300">
                  <FiCalendar />
                  <span className="text-sm font-bold uppercase tracking-tight">
                    Showing events for {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-white"
                >
                  Clear Filter [X]
                </button>
              </div>
            )}

            {filteredEvents.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/50 py-24 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                  <FiCalendar size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">No Events Found</h3>
                <p className="mt-1 text-sm text-slate-400">There are no upcoming events scheduled for this branch yet.</p>
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-6 rounded-xl bg-indigo-500/10 px-6 py-2 text-sm font-bold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all"
                >
                  Be the first to host
                </button>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const startDate = new Date(event.startAt || event.start_at);
                const endDate = new Date(event.endAt || event.end_at || new Date(startDate.getTime() + 3600000));
                const isLive = startDate <= NOW && endDate >= NOW;
                const meta = TYPE_META[event.type] || TYPE_META.workshop;
                const rsvpCount = event.rsvpCount || event.rsvp_count || 0;
                const currentCount = rsvpedEvents.has(event.id) ? rsvpCount + 1 : rsvpCount;
                const capacityPct = event.capacity ? Math.min(100, Math.round((currentCount / event.capacity) * 100)) : 0;

                return (
                  <article key={event.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-6 hover:border-slate-700 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </span>
                        <h2 className="mt-2.5 text-xl font-semibold text-white">{event.title}</h2>
                      </div>
                      {isLive ? (
                        <span className="animate-pulse rounded-full bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-300">
                          ● LIVE
                        </span>
                      ) : null}
                    </div>

                    {/* Date & time */}
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
                      <FiClock size={13} />
                      {new Intl.DateTimeFormat(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      }).format(startDate)}
                      {' – '}
                      {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(endDate)}
                    </div>

                    {/* Host */}
                    <div className="mt-3 flex items-center gap-2">
                      <img src={event.host.avatar_url} alt={event.host.username} className="h-8 w-8 rounded-full" />
                      <div>
                        <p className="text-sm text-slate-200">@{event.host.username}</p>
                        <p className="text-xs text-slate-500">
                          {event.host.domainBadge} · {event.host.pastEventsHosted} events hosted
                        </p>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span className="inline-flex items-center gap-1"><FiUsers size={11} /> {currentCount} / {event.capacity} registered</span>
                        <span>{capacityPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800">
                        <div
                          className={`h-1.5 rounded-full transition-all ${capacityPct >= 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                          style={{ width: `${capacityPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-sm leading-6 text-slate-300">{event.description.slice(0, 200)}{event.description.length > 200 ? '…' : ''}</p>

                    {/* Pending approval badge */}
                    {pendingEvents.has(event.id) && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs text-amber-300">
                        ⏳ Pending Moderator Approval
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleRsvp(event.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${rsvpedEvents.has(event.id) ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]'}`}
                      >
                        {rsvpedEvents.has(event.id) ? (
                          <><FiCheckCircle size={14} /> Registered</>
                        ) : 'RSVP'}
                      </button>

                      {isLive && (
                        <button className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white hover:bg-rose-400 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                          <FiVideo size={14} /> Join Now
                        </button>
                      )}
                      <a
                        href={googleCalLink(event)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200 hover:underline"
                      >
                        <FiCalendar size={13} /> Google Cal
                      </a>
                      <button
                        onClick={() => generateICS(event)}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <FiDownload size={13} /> .ics
                      </button>
                      <RemindMeButton event={event} showToast={showToast} />
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={() => setSelectedEvent(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 relative z-10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${(TYPE_META[selectedEvent.type] || TYPE_META.workshop).color}`}>
                    {(TYPE_META[selectedEvent.type] || TYPE_META.workshop).icon} {(TYPE_META[selectedEvent.type] || TYPE_META.workshop).label}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-white">{selectedEvent.title}</h3>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="text-slate-500 hover:text-white">
                  <FiX size={18} />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(selectedEvent.startAt || selectedEvent.start_at))}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <img src={selectedEvent.host.avatar_url} alt={selectedEvent.host.username} className="h-7 w-7 rounded-full" />
                <p className="text-sm text-slate-300">@{selectedEvent.host.username}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{selectedEvent.description}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => { handleRsvp(selectedEvent.id); setSelectedEvent(null); }}
                  className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors ${rsvpedEvents.has(selectedEvent.id) ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-500 hover:bg-indigo-400'}`}
                >
                  {rsvpedEvents.has(selectedEvent.id) ? 'Unregister' : 'Confirm RSVP'}
                </button>
                <a
                  href={googleCalLink(selectedEvent)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  <FiCalendar size={13} /> Add to Calendar
                </a>
              </div>
            </motion.div>
          </div>
        )}

        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsCreateOpen(false)}
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                try {
                  const res = await core.post(`/community/${slug}/events`, {
                    title: fd.get('title'),
                    event_type: fd.get('event_type'),
                    capacity: Number(fd.get('capacity')) || 100,
                    start_at: fd.get('start_at'),
                    end_at: fd.get('end_at'),
                    description: fd.get('description'),
                  });
                  const json = res.data;
                  if (json?.data?.pending_approval) {
                    if (json.data.id) setPendingEvents(prev => new Set([...prev, json.data.id]));
                    showToast('Event submitted — pending moderator approval.', 'info');
                  } else {
                    showToast('Event created and published!', 'success');
                  }
                  queryClient.invalidateQueries({ queryKey: ['community', 'events', slug] });
                } catch {
                  showToast('Event submitted for moderation.', 'success');
                }
                setIsCreateOpen(false);
              }}
              className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-8 max-h-[90vh] overflow-y-auto relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white italic uppercase tracking-tight">Create New Event</h3>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Branch: {slug}</p>
                </div>
                <button type="button" onClick={() => setIsCreateOpen(false)}>
                  <FiX className="text-slate-400 hover:text-white" size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Event Title</label>
                  <input
                    required
                    name="title"
                    placeholder="Enter a descriptive title..."
                    className="w-full rounded-xl border-2 border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Event Type</label>
                    <select name="event_type" className="w-full rounded-xl border-2 border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500">
                      {Object.entries(TYPE_META).map(([key, val]) => (
                        <option key={key} value={key}>{val.icon} {val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Max Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      min={10}
                      defaultValue={100}
                      className="w-full rounded-xl border-2 border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      name="start_at"
                      required
                      className="w-full rounded-xl border-2 border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">End Date & Time</label>
                    <input
                      type="datetime-local"
                      name="end_at"
                      required
                      className="w-full rounded-xl border-2 border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Description</label>
                  <textarea
                    rows={4}
                    name="description"
                    required
                    placeholder="Describe your event, agenda, or prerequisites..."
                    className="w-full rounded-xl border-2 border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <p className="text-[10px] font-medium text-slate-500 italic max-w-[240px]">
                  * All events are reviewed by branch moderators before going live.
                </p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-xl bg-indigo-500 px-8 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 transition-all">
                    Submit Event
                  </button>
                </div>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
