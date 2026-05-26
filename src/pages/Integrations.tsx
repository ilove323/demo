import { Bot, PlugZap } from "lucide-react";
import { botMessages, integrationEndpoints, notificationCatalog } from "../data";
import { SectionHeader, StatusTag, toneForStatus } from "../components/ui";

export function Integrations() {
  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>集成中心</h1>
        </div>
        <StatusTag tone="cyan">接口配置</StatusTag>
      </div>

      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="MCP" title="MCP 能力卡片" action={<PlugZap size={18} />} />
          <div className="integration-grid">
            {integrationEndpoints.map((endpoint) => (
              <article className="integration-card" key={endpoint.path}>
                <div>
                  <StatusTag tone="blue">{endpoint.method}</StatusTag>
                  <StatusTag tone={toneForStatus(endpoint.status)}>{endpoint.status}</StatusTag>
                </div>
                <strong>{endpoint.name}</strong>
                <code>{endpoint.path}</code>
                <p>{endpoint.capability}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="panel">
          <SectionHeader eyebrow="BOT" title="企业微信机器人对话样例" action={<Bot size={18} />} />
          <div className="bot-chat">
            {botMessages.map((message, index) => (
              <div className={message.speaker === "user" ? "chat-bubble user" : "chat-bubble bot"} key={`${message.speaker}${index}`}>
                <span>{message.speaker === "user" ? "用户" : "机器人"}</span>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <SectionHeader eyebrow="CHANNEL" title="通知与订阅渠道状态" />
        <table className="data-table">
          <thead><tr><th>通知类型</th><th>站内信</th><th>企业微信</th><th>说明</th></tr></thead>
          <tbody>
            {notificationCatalog.filter((item) => item.channels.includes("企业微信") || item.channels.includes("机器人")).slice(0, 8).map((item) => (
              <tr key={item.id}>
                <td><strong>{item.domain} · {item.event}</strong></td>
                <td><StatusTag tone="green">已启用</StatusTag></td>
                <td><StatusTag tone={item.configurable ? "orange" : "green"}>{item.configurable ? "按角色订阅" : "强提醒"}</StatusTag></td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
