import { Bell, LockKeyhole, UserRound } from "lucide-react";
import type { NotificationItem, ProfileTab, RoleId, RoleOption } from "../types";
import { Notifications } from "./Notifications";
import { SectionHeader, StatusTag } from "../components/ui";

export function Profile({
  activeRole,
  roles,
  activeTab,
  notifications,
  onTabChange,
  onToggleRead,
  onMarkAllRead,
  onOpenNotificationSettings
}: {
  activeRole: RoleId;
  roles: RoleOption[];
  activeTab: ProfileTab;
  notifications: NotificationItem[];
  onTabChange: (tab: ProfileTab) => void;
  onToggleRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpenNotificationSettings?: () => void;
}) {
  const role = roles.find((item) => item.id === activeRole)!;

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>个人资料</h1>
        </div>
      </div>
      <div className="profile-layout">
        <aside className="profile-tabs">
          <button className={activeTab === "personal" ? "active" : ""} onClick={() => onTabChange("personal")}>
            <UserRound size={18} />
            <span>个人资料</span>
          </button>
          <button className={activeTab === "notifications" ? "active" : ""} onClick={() => onTabChange("notifications")}>
            <Bell size={18} />
            <span>消息通知</span>
          </button>
        </aside>
        <div className="profile-content">
          {activeTab === "personal" ? (
            <>
              <div className="panel">
                <SectionHeader eyebrow="PROFILE" title="个人信息" action={<StatusTag tone="green">启用</StatusTag>} />
                <div className="profile-form-grid">
                  <label>姓名<input value={role.userName} readOnly /></label>
                  <label>邮箱<input value={role.email} readOnly /></label>
                  <label>部门<input value={role.department} readOnly /></label>
                  <label>电话<input value={role.phone} readOnly /></label>
                  <label>当前业务角色<input value={role.label} readOnly /></label>
                  <label>组织身份<input value={role.organizationTitle ?? "普通成员"} readOnly /></label>
                  <label>数据范围<input value={role.description} readOnly /></label>
                </div>
              </div>
              <div className="panel">
                <SectionHeader eyebrow="PREFERENCE" title="偏好设置" />
                <div className="profile-setting-list">
                  <article>
                    <strong>默认主题</strong>
                    <span>跟随当前 light / dark 设置。</span>
                  </article>
                  <article>
                    <strong>默认入口</strong>
                    <span>进入当前身份可见的第一个业务模块。</span>
                  </article>
                  <article>
                    <strong>通知策略</strong>
                    <span>根据当前业务角色和组织身份应用默认订阅、可选订阅和强制通知。</span>
                  </article>
                </div>
              </div>
              <div className="panel">
                <SectionHeader eyebrow="SECURITY" title="安全设置" action={<LockKeyhole size={18} />} />
                <button className="btn profile-wide-button">修改密码</button>
              </div>
            </>
          ) : (
            <Notifications
              activeRole={activeRole}
              notifications={notifications}
              onToggleRead={onToggleRead}
              onMarkAllRead={onMarkAllRead}
              onOpenNotificationSettings={onOpenNotificationSettings}
              embedded
            />
          )}
        </div>
      </div>
    </section>
  );
}
