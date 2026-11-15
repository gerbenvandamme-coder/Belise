'use client';

import { useState, type ReactNode } from 'react';
import { CalendarDays, CalendarX, Images, ListChecks, MessageSquare, Tags, Users, type LucideIcon } from 'lucide-react';
import AgendaTab from '@/components/admin/AgendaTab';
import AvailabilityTab from '@/components/admin/AvailabilityTab';
import CustomersTab from '@/components/admin/CustomersTab';
import MessagesTab from '@/components/admin/MessagesTab';
import PortfolioTab from '@/components/admin/PortfolioTab';
import SettingsTab from '@/components/admin/SettingsTab';
import TodoTab from '@/components/admin/TodoTab';
import { FOCUS_RING } from '@/lib/admin/ui';

type TabId = 'agenda' | 'availability' | 'customers' | 'messages' | 'portfolio' | 'settings' | 'todo';

// short: label in de onderbalk op mobiel, waar zeven tabs naast elkaar staan.
const TABS: { id: TabId; label: string; short: string; icon: LucideIcon }[] = [
  { id: 'agenda', label: 'Agenda', short: 'Agenda', icon: CalendarDays },
  { id: 'availability', label: 'Beschikbaarheid', short: 'Open', icon: CalendarX },
  { id: 'customers', label: 'Klanten', short: 'Klanten', icon: Users },
  { id: 'messages', label: 'Berichten', short: 'Berichten', icon: MessageSquare },
  { id: 'portfolio', label: 'Portfolio', short: 'Portfolio', icon: Images },
  { id: 'settings', label: 'Tarieven & site', short: 'Tarieven', icon: Tags },
  { id: 'todo', label: 'To-do', short: 'To-do', icon: ListChecks },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('agenda');
  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  let content: ReactNode;
  if (activeTab === 'agenda') content = <AgendaTab />;
  else if (activeTab === 'availability') content = <AvailabilityTab />;
  else if (activeTab === 'customers') content = <CustomersTab />;
  else if (activeTab === 'messages') content = <MessagesTab />;
  else if (activeTab === 'portfolio') content = <PortfolioTab />;
  else if (activeTab === 'settings') content = <SettingsTab />;
  else content = <TodoTab />;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <nav
        aria-label="Adminmenu"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-taupe/40 bg-card/95 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-r lg:border-t-0 lg:bg-card"
      >
        <ul className="grid grid-cols-7 gap-0.5 p-1.5 lg:flex lg:flex-col lg:gap-2 lg:p-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const selected = tab.id === activeTab;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-medium transition-colors motion-reduce:transition-none lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-sm ${
                    selected ? 'bg-accent-soft text-accent-dark' : 'text-primary/70 hover:bg-canvas'
                  } ${FOCUS_RING}`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                  <span className="lg:hidden">{tab.short}</span>
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="flex-1 px-5 pb-28 pt-8 lg:px-10 lg:pb-12">
        <h1 className="font-serif text-3xl font-normal text-primary">{active.label}</h1>
        <div className="mt-6">{content}</div>
      </main>
    </div>
  );
}