'use client';

import { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'lead' | 'system' | 'listing' | 'security';
  isRead: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'New High-Intensity Lead',
    message: 'Adolfo Macamo has inquired about "Polana Sands Villa". They are looking to schedule a viewing this Friday.',
    time: '20m ago',
    type: 'lead',
    isRead: false,
  },
  {
    id: '2',
    title: 'Listing Approved',
    message: 'Your property "Coastal Breeze Residences" has been verified by the editorial team and is now live.',
    time: '2h ago',
    type: 'listing',
    isRead: false,
  },
  {
    id: '3',
    title: 'Security Alert',
    message: 'A new login was detected from a Chrome browser on Windows in Gaza, Mozambique.',
    time: '5h ago',
    type: 'security',
    isRead: true,
  },
  {
    id: '4',
    title: 'Subscription Renewal',
    message: 'Your "Premium Curator" plan will automatically renew on May 15, 2026.',
    time: '1d ago',
    type: 'system',
    isRead: true,
  },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const filteredNotifications = notifications.filter(n => 
    activeTab === 'all' || !n.isRead
  );

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'lead': return { icon: 'chat_bubble', color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'listing': return { icon: 'domain', color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'security': return { icon: 'verified_user', color: 'text-red-500', bg: 'bg-red-50' };
      case 'system': return { icon: 'settings', color: 'text-[#845326]', bg: 'bg-[#fef9f2]' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#002045] tracking-tighter mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
            Notification Center
          </h1>
          <p className="text-[#74777f] font-medium font-serif leading-relaxed italic">
            Keep track of your professional engagement and platform status.
          </p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="text-[10px] font-black text-[#845326] uppercase tracking-[0.2em] hover:underline whitespace-nowrap"
        >
          Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#f2f4f6]">
        {[
          { id: 'all', label: 'All Notifications' },
          { id: 'unread', label: 'Unread' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-[#002045]' : 'text-[#c4c6cf] hover:text-[#74777f]'}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fab983]" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => {
            const style = getIcon(n.type);
            return (
              <div 
                key={n.id} 
                className={`p-6 rounded-3xl border transition-all flex items-start gap-6 group hover:shadow-xl hover:shadow-[#002045]/5 ${n.isRead ? 'bg-white border-[#f2f4f6]' : 'bg-white border-[#fab983]/30 shadow-lg shadow-[#fab983]/5'}`}
              >
                <div className={`w-12 h-12 rounded-2xl ${style.bg} ${style.color} flex items-center justify-center shrink-0`}>
                  <span className="material-symbols-outlined text-2xl">{style.icon}</span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-base font-black tracking-tight ${n.isRead ? 'text-[#002045]' : 'text-[#002045]'}`}>{n.title}</h4>
                    <span className="text-[10px] font-bold text-[#c4c6cf] uppercase tracking-widest">{n.time}</span>
                  </div>
                  <p className="text-sm text-[#74777f] leading-relaxed font-medium">
                    {n.message}
                  </p>
                </div>
                {!n.isRead && (
                   <div className="w-2 h-2 rounded-full bg-[#fab983] shrink-0 mt-2" />
                )}
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-[#f2f4f6] mb-4">notifications_off</span>
            <p className="text-[#c4c6cf] font-black text-[10px] uppercase tracking-widest">No notifications found</p>
          </div>
        )}
      </div>
    </div>
  );
}
