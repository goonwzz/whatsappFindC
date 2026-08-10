# 外贸获客系统

海外买家发现、需求验证、个性化邮件发送和回复跟进工作台。

## 获客任务参数

`POST /api/campaigns` 使用海关编码作为产品识别主键：

```json
{
  "country": "韩国",
  "hsCode": "6307100000",
  "productDescription": "黏胶/涤纶水刺无纺布家居清洁布",
  "exclusions": "自有工厂、关联企业内部采购、同类出口商",
  "targetCount": 10
}
```

`country`、6–10位的 `hsCode` 和自动匹配的 `hsNameZh` 必填；`productDescription` 只用于进一步筛选材质、规格和应用，不能覆盖目标国家的官方HS归类。任务、线索、邮件和事件分别保存在 `data/*.json`，不依赖数据库。

## 真实数据获取

在 `.env` 配置 `OPENAI_API_KEY` 后，任务会由服务端调用 Responses API 的网页搜索工具，返回带具体来源 URL 的真实候选企业。没有可核验来源的公司不会进入结果，也不会猜测邮箱。

公开网页证据不等于海关提单数据。只有证据页明确显示进口记录时，结果才标记为“已确认进口”；如需完整的 HS Code 进口商、供应商、批次和金额，需要后续选择并接入付费海关数据供应商。

通过内网穿透开放给业务员前，请设置 `DEMO_ACCESS_USER` 和强密码 `DEMO_ACCESS_PASSWORD`。OpenAI 与邮件密钥只保存在服务端 `.env`。

## 邮箱配置

本地邮件设置集中保存在 `.env`。复制 `.env.example` 后填写 Google OAuth 的
`GMAIL_CLIENT_ID`、`GMAIL_CLIENT_SECRET`、`GMAIL_REFRESH_TOKEN`，并为
`MAIL_WEBHOOK_SECRET` 设置随机长字符串。`.env` 已被 Git 忽略，不会进入仓库。

`GET /api/email/config` 只返回配置状态和缺失字段，不会返回任何密钥。

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` 保留Sites配置，但Demo不声明D1数据库
- `vite.config.ts` simulates declared bindings for local development
- `data/*.json` 保存任务、线索、邮件和事件数据

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Email and name are intended for display or contact purposes.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: 验证本地 Node/Next.js 生产构建
- `npm run build:sites`: 验证 Sites/Vinext 构建
- `npm test`: build the starter and verify its rendered loading skeleton

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
