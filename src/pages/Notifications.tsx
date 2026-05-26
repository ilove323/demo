import { Check, Settings } from "lucide-react";
import type { NotificationItem, RoleId } from "../types";
import { SectionHeader, StatusTag } from "../components/ui";
import { notificationCatalog, roleNotificationSubscriptions } from "../data";

export function Notifications({
  activeRole,
  notifications,
  onToggleRead,
  onMarkAllRead,
  onOpenNotificationSettings,
  embedded = false
}: {
  activeRole: RoleId;
  notifications: NotificationItem[];
  onToggleRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpenNotificationSettings?: () => void;
  embedded?: boolean;
}) {
  const rolePolicy = roleNotificationSubscriptions.find((item) => item.roleId === activeRole);
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <section className={embedded ? "page notification-page embedded" : "page notification-page"}>
      <div className="notification-hero">
        <div>
          <h1>消息通知</h1>
          <p>{unreadCount} 条未读</p>
        </div>
        <div className="notification-hero-actions">
          <button
            className="icon-button notification-settings-button"
            type="button"
            aria-label="通知设置"
            title={activeRole === "admin" ? "进入系统设置 / 通知设置" : "通知规则由管理员在系统设置中维护"}
            onClick={onOpenNotificationSettings}
            disabled={!onOpenNotificationSettings}
          >
            <Settings size={21} />
          </button>
          <button className="btn notification-read-button" type="button" onClick={onMarkAllRead} disabled={unreadCount === 0}>
            <Check size={18} />
            <span>全部已读</span>
          </button>
        </div>
      </div>
      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="INBOX" title="通知列表" />
          <div className="notification-list">
            {notifications.map((item) => (
              <button className={item.unread ? "notification-row unread" : "notification-row"} key={item.id} onClick={() => onToggleRead(item.id)}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.content}</p>
                  <small>
                    {item.time}
                    {item.sourceUserName ? ` · 来自 ${item.sourceUserName}` : ""}
                    {item.relatedId ? ` · ${item.relatedId}` : ""}
                  </small>
                </div>
                <div className="notification-tags">
                  <StatusTag tone={item.level}>{item.type}</StatusTag>
                  <StatusTag tone={item.channel === "企业微信" ? "green" : "gray"}>{item.channel}</StatusTag>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <SectionHeader eyebrow="MY SUBSCRIPTION" title="我的订阅摘要" />
        <div className="panel-soft-block">
          <strong>{rolePolicy?.note ?? "当前角色暂无订阅策略"}</strong>
        </div>
          <div className="subscription-policy-list">
            {notificationCatalog.map((item) => {
              const locked = rolePolicy?.locked.includes(item.id);
              const enabled = rolePolicy?.defaultOn.includes(item.id) || locked;
              const optional = rolePolicy?.optional.includes(item.id);
              if (!enabled && !optional) return null;
              return (
                <article className="subscription-policy-row" key={item.id}>
                  <div>
                    <strong>{item.event}</strong>
                    <span>{item.domain} · {item.description}</span>
                  </div>
                  <div className="notification-tags">
                    <StatusTag tone={locked ? "red" : enabled ? "green" : "gray"}>{locked ? "强制" : enabled ? "默认" : "可选"}</StatusTag>
                    <StatusTag tone={priorityTone(item.priority)}>{item.priority}</StatusTag>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function priorityTone(priority: string) {
  if (priority === "高") return "red";
  if (priority === "中") return "orange";
  return "gray";
}
