'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/components/i18n/LanguageContext';

type NotificationKind = 'lead' | 'approval' | 'payment' | 'system';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  kind: NotificationKind;
  unread: boolean;
}

const notifications: NotificationItem[] = [
  {
    id: 'lead-1',
    title: 'New lead inquiry',
    message: 'A buyer requested more details about one of your active listings.',
    time: 'Today',
    kind: 'lead',
    unread: true,
  },
  {
    id: 'approval-1',
    title: 'Listing review update',
    message: 'Your latest property submission is queued for editorial review.',
    time: 'Yesterday',
    kind: 'approval',
    unread: true,
  },
  {
    id: 'payment-1',
    title: 'Payment reference received',
    message: 'Your manual payment reference was recorded and is awaiting confirmation.',
    time: 'This week',
    kind: 'payment',
    unread: false,
  },
  {
    id: 'system-1',
    title: 'Profile visibility',
    message: 'Complete your contact details to improve agent profile trust signals.',
    time: 'This month',
    kind: 'system',
    unread: false,
  },
];

const iconByKind: Record<NotificationKind, string> = {
  lead: 'forum',
  approval: 'task_alt',
  payment: 'payments',
  system: 'manage_accounts',
};

export default function NotificationsClient() {
  const { t } = useLanguage();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  const visibleNotifications = useMemo(() => {
    return notifications
      .map((item) => ({ ...item, unread: item.unread && !readIds.includes(item.id) }))
      .filter((item) => (showUnreadOnly ? item.unread : true));
  }, [readIds, showUnreadOnly]);

  const unreadCount = visibleNotifications.filter((item) => item.unread).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#002045]">
            {t.dashboard.notifications.allNotifications}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#74777f]">
            {t.dashboard.notifications.desc}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowUnreadOnly((current) => !current)}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${
              showUnreadOnly
                ? 'bg-[#002045] text-white'
                : 'border border-[#e3e6ea] bg-white text-[#002045] hover:bg-[#f5f6f8]'
            }`}
          >
            {t.dashboard.notifications.unread}
          </button>
          <button
            type="button"
            onClick={() => setReadIds(notifications.map((item) => item.id))}
            className="rounded-lg border border-[#e3e6ea] bg-white px-3.5 py-2 text-[13px] font-medium text-[#5b616b] transition-colors hover:bg-[#f5f6f8]"
          >
            {t.dashboard.notifications.markAllAsRead}
          </button>
        </div>
      </div>

      <div className="grid gap-2.5">
        {visibleNotifications.map((item) => (
          <article
            key={item.id}
            className="flex items-start gap-3.5 rounded-xl border border-[#eceef1] bg-white p-4"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.unread ? 'bg-[#002045] text-[#fab983]' : 'bg-[#f5f6f8] text-[#9aa0a8]'}`}>
              <span className="material-symbols-outlined text-[20px]">{iconByKind[item.kind]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-[14px] font-medium text-[#002045]">{item.title}</h2>
                <span className="text-[12px] font-medium text-[#9aa0a8]">{item.time}</span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-[#74777f]">{item.message}</p>
            </div>
            {item.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
          </article>
        ))}
      </div>

      {visibleNotifications.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#e3e6ea] bg-white py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-[#d7dbe0]">notifications_off</span>
          <h2 className="mt-3 text-[15px] font-semibold text-[#002045]">{t.dashboard.notifications.noNotifications}</h2>
          <p className="mt-1 text-sm text-[#9aa0a8]">
            {unreadCount === 0 ? t.dashboard.notifications.markAllAsRead : t.dashboard.notifications.desc}
          </p>
        </div>
      )}
    </section>
  );
}
