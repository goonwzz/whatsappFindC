# 贝贝家外贸复制系统使用说明

## 一、系统能做什么

厂家输入自己的门户网站，业务员选择目标地区。系统生成 `$find-target-buyers` 指令，交给 Codex 后自动完成：

1. 阅读厂家官网，识别公司、产品、卖点和适合的客户类型。
2. 在目标地区寻找潜在销售渠道。
3. 只把具有公开验证 WhatsApp 的企业计入合格名单。
4. 根据厂家和客户的真实业务信息，为每家客户编写英文招呼。
5. 将结果保存回系统，并自动排除历史重复客户。
6. 点击“一键联系”后，调用本机 WhatsApp 并预填招呼；业务员确认后发送。

系统不会自动发送 WhatsApp，也不会把普通电话号码冒充 WhatsApp。

## 二、首次安装

需要安装 Node.js 22.13 或更高版本，以及 Codex 桌面版。

```bash
git clone https://github.com/goonwzz/whatsappFindC.git
cd whatsappFindC
npm install
```

将项目中的 Skill 安装到当前用户的 Codex 技能目录：

```bash
mkdir -p ~/.codex/skills
cp -R skills/find-target-buyers ~/.codex/skills/find-target-buyers
```

如果以前安装过旧版本，先删除旧的 `~/.codex/skills/find-target-buyers` 文件夹，再复制新版。安装后重新打开 Codex，确保 `$find-target-buyers` 可以被识别。

## 三、启动系统

在项目目录的终端中运行：

```bash
npm run dev
```

不要关闭这个终端。浏览器打开终端显示的本地地址，通常是：

```text
http://localhost:3000/
```

同一局域网内的同事可以使用运行电脑的局域网 IP，例如：

```text
http://192.168.1.20:3000/
```

系统已监听局域网地址；电脑防火墙仍需允许 Node.js 接收入站连接。

## 四、建立厂家预设

1. 在“厂家官网”中粘贴官网，例如 `https://www.example.com/`。
2. 展开“厂家联系资料”。
3. 填写业务员姓名、邮箱和自己的 WhatsApp。
4. 点击“保存当前预设”。

厂家名称、英文简介和厂家优势可以留空，Codex 会从官网公开页面提取。手动填写的内容优先于官网识别结果。

可以保存多个厂家预设。更换厂家时从下拉框切换，不需要修改代码。

## 五、生成找客户任务

1. 选择厂家预设或输入厂家官网。
2. 填写目标地区，例如：
   - `阿联酋`
   - `Dubai`
   - `Dubai + Sharjah`
3. 点击“生成找客户指令”。
4. 点击“复制完整指令”。
5. 打开 Codex，将指令完整粘贴并发送。

正常情况下不需要填写产品、HS Code 或目标客户提示词。官网资料不完整时，可以展开“高级搜索设置”手动补充。

## 六、等待 Codex 完成

Codex 会调用 `$find-target-buyers`，搜索和核验公开商业信息，并把结果写入：

```text
public/data/latest-buyers.json
```

Codex 提示“结果已回传到系统”后，返回网页点击“读取最新结果”。

如果网页和 Codex 不在同一份项目目录中，结果文件无法自动回传。请确保 Codex 打开的工作目录就是当前项目目录。

## 七、查看和联系客户

结果按渠道分类显示。每家企业会显示：

- 企业和产品匹配依据；
- 负责人或建议联系职位；
- 公开联系方式及核验依据；
- 中国采购公开信号；
- WhatsApp 操作按钮。

点击“预览招呼”可以编辑内容。点击“一键联系”会打开本机 WhatsApp，并把英文招呼填入对应客户的对话框。发送前请由业务员再次确认内容和收件人。

## 八、避免重复客户

系统会将已经读取的企业保存在当前浏览器的本地客户库中，并按以下信息去重：

- 官网根域名；
- 标准化企业名称；
- 公开邮箱；
- 公开 WhatsApp。

下一次为相同地区和产品生成任务时，历史客户会自动加入排除名单，无需人工复制。

浏览器本地数据不会自动同步到其他电脑。团队正式使用时，应再接入统一数据库或共享后端。

## 九、常见问题

### Codex 不认识 `$find-target-buyers`

确认 `~/.codex/skills/find-target-buyers/SKILL.md` 存在，然后重新打开 Codex。

### 官网打不开或产品识别失败

在高级设置中补充产品说明，或者提供可以公开访问的具体产品页面。

### 搜索结果少于要求数量

系统要求公开验证的企业 WhatsApp。没有可信 WhatsApp 的企业不会为了凑数而加入。

### 点击 WhatsApp 没反应

确认电脑已经安装并登录 WhatsApp Desktop，或者浏览器允许打开 `whatsapp://` 链接。

### 如何更新项目

在项目目录运行：

```bash
git pull origin main
npm install
```

如果 Skill 同时有更新，重新复制 `skills/find-target-buyers` 到 `~/.codex/skills/`，然后重启 Codex。
