import { Bell, ChevronDown, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun, UserRound } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import type { NavItem, PageId, RoleId, RoleOption } from "../types";

export function AppLayout({
  navItems,
  roles,
  activePage,
  activeRole,
  unreadCount,
  theme,
  onPageChange,
  onRoleChange,
  onThemeChange,
  onOpenProfile,
  onOpenNotifications,
  children
}: {
  navItems: NavItem[];
  roles: RoleOption[];
  activePage: PageId;
  activeRole: RoleId;
  unreadCount: number;
  theme: "light" | "dark";
  onPageChange: (page: PageId) => void;
  onRoleChange: (role: RoleId) => void;
  onThemeChange: (theme: "light" | "dark") => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  children: ReactNode;
}) {
  const role = roles.find((item) => item.id === activeRole)!;
  const roleText = role.organizationTitle ? `${role.label} · ${role.organizationTitle}` : role.label;
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ systemSettings: true });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isNavItemActive = (item: NavItem) => activePage === item.id || Boolean(item.children?.some((child) => child.id === activePage));

  return (
    <div className={`app-shell theme-${theme} ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">IT</div>
          <div>
            <strong>项目管理系统</strong>
            <span>Prototype</span>
          </div>
          <button className="sidebar-toggle" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}>
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
        <nav className="nav-list" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.children) {
              const expanded = openGroups[item.id] ?? false;
              return (
                <div className={isNavItemActive(item) ? "nav-group active" : "nav-group"} key={item.id}>
                  <button
                    className="nav-group-trigger"
                    onClick={() => setOpenGroups((items) => ({ ...items, [item.id]: !expanded }))}
                    title={item.label}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    <ChevronDown className="nav-group-chevron" size={15} />
                  </button>
                  {expanded ? (
                    <div className="nav-sub-list">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.id}
                            className={activePage === child.id ? "active" : ""}
                            onClick={() => onPageChange(child.id)}
                            title={child.label}
                          >
                            <ChildIcon size={16} />
                            <span>{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }
            return (
              <button
                key={item.id}
                className={activePage === item.id ? "active" : ""}
                onClick={() => onPageChange(item.id)}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <label className="sidebar-role-switcher">
            <span>切换身份</span>
            <select value={activeRole} onChange={(event) => onRoleChange(event.target.value as RoleId)}>
              {roles.map((item) => (
                <option key={item.id} value={item.id}>{item.userName} · {item.organizationTitle ? `${item.label}（${item.organizationTitle}）` : item.label}</option>
              ))}
            </select>
          </label>
          <div className="sidebar-role-icon" title={`切换身份：${roleText}`}>
            <UserRound size={18} />
          </div>
          <div className="sidebar-foot">
            <span>MCP / 企业微信</span>
            <strong>集成配置</strong>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="search-box">
            <Search size={17} />
            <input placeholder="搜索需求、项目、负责人" />
          </div>
          <div className="topbar-actions">
            <div className="theme-switcher" aria-label="主题切换">
              <button
                className={theme === "light" ? "selected" : ""}
                onClick={() => onThemeChange("light")}
                title="light"
              >
                <Sun size={15} />
                <span>light</span>
              </button>
              <button
                className={theme === "dark" ? "selected" : ""}
                onClick={() => onThemeChange("dark")}
                title="dark"
              >
                <Moon size={15} />
                <span>dark</span>
              </button>
            </div>
            <button className="notification-button" onClick={onOpenNotifications} aria-label="通知">
              <Bell size={18} />
              {unreadCount > 0 ? <span>{unreadCount}</span> : null}
            </button>
            <div className="user-profile-menu">
              <button className="user-profile-trigger" onClick={() => setUserMenuOpen((value) => !value)}>
                <div className="avatar-mark"><UserRound size={20} /></div>
                <div>
                  <strong>{role.userName}</strong>
                  <span>{role.department} · {roleText}</span>
                </div>
                <ChevronDown size={16} />
              </button>
              {userMenuOpen ? (
                <div className="user-dropdown">
                  <button onClick={() => { setUserMenuOpen(false); onOpenProfile(); }}>
                    <UserRound size={17} />
                    <span>个人资料</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="content">{children}</main>
      </section>
    </div>
  );
}
