import { useState } from "react";
import { Outlet, useLocation, useParams } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Image,
  KeyRound,
  Menu,
  MessageSquare,
  ReceiptText,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { isAppLocale } from "@partokens/i18n";

import { formatQuota } from "@/lib/format";
import { usePreferenceStore } from "@/stores/preferences";
import { useSessionStore } from "@/stores/session";
import { Modal } from "./modal";
import { IconButton } from "./ui";

export function LegacyConsoleShell() {
  const { t } = useTranslation();
  const pathname = useLocation({ select: (state) => state.pathname });
  const params = useParams({ strict: false }) as { locale?: string };
  const locale = isAppLocale(params.locale) ? params.locale : "zh-CN";
  const { user } = useSessionStore();
  const { sidebarCollapsed, toggleSidebar } = usePreferenceStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const base = `/${locale}/console`;
  const navigation = [
    {
      group: t("Chat"),
      items: [
        {
          label: t("Playground"),
          href: `${base}/playground`,
          icon: MessageSquare,
        },
        { label: t("Image studio"), href: `${base}/studio`, icon: Image },
      ],
    },
    {
      group: t("General"),
      items: [
        { label: t("Overview"), href: `${base}/overview`, icon: Activity },
        { label: t("Analytics"), href: `${base}/analytics`, icon: BarChart3 },
        { label: t("API keys"), href: `${base}/keys`, icon: KeyRound },
        {
          label: t("Usage logs"),
          href: `${base}/usage-logs`,
          icon: ReceiptText,
        },
      ],
    },
    {
      group: t("Personal"),
      items: [
        { label: t("Wallet"), href: `${base}/wallet`, icon: WalletCards },
        { label: t("Profile"), href: `${base}/profile`, icon: UserRound },
      ],
    },
  ];
  const remaining = user?.quota;
  const used = user?.used_quota;
  const mobileItems = [
    navigation[1]?.items[0],
    navigation[0]?.items[0],
    navigation[0]?.items[1],
    navigation[2]?.items[0],
  ].filter(Boolean) as (typeof navigation)[number]["items"];

  return (
    <div
      className={
        sidebarCollapsed ? "console-layout sidebar-collapsed" : "console-layout"
      }
    >
      <aside className="console-sidebar">
        <div className="sidebar-scroll">
          {navigation.map((group) => (
            <section key={group.group} className="sidebar-group">
              <h2>{sidebarCollapsed ? null : group.group}</h2>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={active ? "sidebar-link active" : "sidebar-link"}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} />
                    {sidebarCollapsed ? null : <span>{item.label}</span>}
                  </a>
                );
              })}
            </section>
          ))}
        </div>
        <div className="quota-rail">
          {sidebarCollapsed ? (
            <div
              className="quota-compact"
              title={`${t("Remaining")}: ${formatQuota(remaining, locale)}`}
            >
              <span />
            </div>
          ) : (
            <>
              <div>
                <span>{t("Remaining")}</span>
                <strong>{formatQuota(remaining, locale)}</strong>
              </div>
              <div className="quota-line">
                <span />
              </div>
              <div>
                <span>{t("Total usage")}</span>
                <small>{formatQuota(used, locale)}</small>
              </div>
            </>
          )}
        </div>
        <IconButton
          label={t(sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar")}
          className="sidebar-toggle"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </IconButton>
      </aside>
      <main className="console-main">
        <Outlet />
      </main>
      <nav className="mobile-console-nav" aria-label={t("Console navigation")}>
        {mobileItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={pathname.startsWith(item.href) ? "active" : ""}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </a>
          );
        })}
        <button
          className={moreOpen ? "active" : ""}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          {moreOpen ? <X size={19} /> : <Menu size={19} />}
          <span>{t("More")}</span>
        </button>
      </nav>
      {moreOpen ? (
        <Modal backdropClassName="mobile-console-backdrop" className="mobile-console-sheet" label={t("More")} onClose={() => setMoreOpen(false)}>
          <header>
            <strong>{t("Console")}</strong>
            <IconButton label={t("Close")} onClick={() => setMoreOpen(false)}>
              <X size={18} />
            </IconButton>
          </header>
          {navigation.map((group) => (
            <section key={group.group}>
              <span>{group.group}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={pathname.startsWith(item.href) ? "active" : ""}
                  >
                    <Icon size={17} />
                    {item.label}
                  </a>
                );
              })}
            </section>
          ))}
        </Modal>
      ) : null}
    </div>
  );
}
