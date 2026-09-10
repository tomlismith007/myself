# Umami 部署手册 · 新加坡服务器（2C1G）

> 目标：在新加坡服务器上用 Docker 部署 Umami + PostgreSQL，绑定 `umami.ruinexai.com`，拿到 Website ID 交给主站接入。
>
> **全程约 40-60 分钟。每一步都带【验证】，验证不过不要进下一步。**
>
> 你的服务器状态（已确认）：干净、装了部分基础工具、无 Docker、有 2G swap —— 条件合格。

---

## 架构总览（部署完成后的样子）

```
访客浏览器
   │  页面加载 https://umami.ruinexai.com/script.js
   ▼
Cloudflare 橙云代理（CDN + HTTPS + 隐藏源站 IP）
   ▼
新加坡服务器 nginx (443, Let's Encrypt 证书)
   ▼
Docker: umami (127.0.0.1:3000) ←→ postgres (容器内网, 公网不可见)
   ▼
数据落在 /var/lib/postgresql/data 卷里
```

主站（liruixiang.ruinexai.com，Cloudflare Pages）之后只需要改一行 script 标签——那是我部署完帮你改的，本手册不用管主站。

**开始前需要准备：**
- 服务器公网 IP 和 SSH 登录方式（下文用 `<服务器IP>` 占位，替换成真实值）
- Cloudflare 账号（ruinexai.com 已托管 ✓）
- 本机 Git Bash（用于 scp 上传文件）

---

## 第 1 步：SSH 登录 + 环境体检

本机 Git Bash 执行：

```bash
ssh root@<服务器IP>
```

登录服务器后，**逐条**执行下面的体检命令：

```bash
# 1. 系统信息（确认发行版，决定后面用 apt 还是 yum）
cat /etc/os-release | head -2

# 2. 内存 + swap（你应有 2G 内存 + 2G swap）
free -h

# 3. 磁盘空间（Docker 镜像 + 数据库至少需要 2GB 余量）
df -h /

# 4. 端口占用检查（80/443 必须空闲，3000/5432 也应空闲）
ss -tlnp | grep -E ':(80|443|3000|5432)\s' || echo "端口全部空闲 ✓"

# 5. Docker 是否已装
docker --version 2>/dev/null || echo "未安装 Docker（第 2 步会装）"

# 6. nginx 是否已装
nginx -v 2>/dev/null || echo "未安装 nginx（第 5 步会装）"
```

**【验证】** 体检结论填进这张表：

| 检查项 | 预期 | 不达标怎么办 |
|--------|------|--------------|
| swap | ≥ 2G | 没有就先加 swap（文末附录 A） |
| 磁盘余量 | ≥ 2GB | 清理或扩盘后再继续 |
| 80/443 端口 | 空闲 | 被占用则停下告诉我占用者是谁 |
| Docker | 无/有都行 | 无则执行第 2 步 |

> ⚠️ **云安全组提醒**：如果服务器是 AWS EC2 / 阿里云 / 腾讯云等云主机，去云控制台确认**安全组已放行 TCP 80 和 443**（AWS EC2 默认通常只开 22，安全组入口：AWS 控制台 → EC2 → Security Groups → 关联你实例的那组 → Inbound rules）。不放行会导致后面 certbot 签证书失败、Cloudflare 橙云报 522。

---

## 第 2 步：安装 Docker（第 1 步显示未安装才做）

新加坡服务器直连 Docker 官方源没有障碍，用官方一键脚本：

```bash
curl -fsSL https://get.docker.com | sh
```

装完启动并设自启：

```bash
systemctl enable --now docker
```

**【验证】**

```bash
docker --version
# 预期：Docker version 2x.x, ...
docker compose version
# 预期：Docker Compose version v2.x.x
```

如果 `docker compose version` 报"unknown command"，说明装的是老版 docker-compose（Python 版），执行 `apt install -y docker-compose-plugin` 或告诉我。

---

## 第 3 步：上传部署文件（二选一）

> 目的：让 `docker-compose.yml` 和 `nginx-umami.conf` 出现在服务器的 `/opt/umami/` 目录。
> 两个文件在你电脑的 `C:\Users\tom\Desktop\myself\umami\` 下。

### 方式 A：Git Bash + scp（有 Git Bash 的机器用）

```bash
cd /c/Users/tom/Desktop/myself/umami
ssh root@<服务器IP> "mkdir -p /opt/umami"
scp docker-compose.yml nginx-umami.conf root@<服务器IP>:/opt/umami/
```

### 方式 B：Xshell 直接粘贴建文件（无需传文件）

服务器 SSH 会话里执行：

```bash
mkdir -p /opt/umami && cd /opt/umami
nano docker-compose.yml
```

- 在你电脑上用记事本打开 `docker-compose.yml`，Ctrl+A 全选复制
- 回到 Xshell 终端**右键粘贴** → `Ctrl+O` 回车保存 → `Ctrl+X` 退出
- 同样方法建 `nginx-umami.conf`：`nano nginx-umami.conf` → 粘贴 → 保存退出

### 无论哪种方式，接着在服务器生成真实密钥

（密钥只在服务器存在，不进 git）

```bash
cd /opt/umami
printf 'APP_SECRET=%s\nPOSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 16)" > .env
cat .env   # 确认两个变量都有值，把这两行保存到你的密码管理器
```

**【验证】**

```bash
ls -la /opt/umami
# 预期看到：docker-compose.yml  nginx-umami.conf  .env
```

---

## 第 4 步：启动 Umami

```bash
cd /opt/umami
docker compose up -d
```

首次会拉取两个镜像（约 1-2 分钟），然后 postgres 先就绪，umami 做数据库迁移（**首次启动要 1-3 分钟，属正常**）。

查看状态（迁移完成前 umami 显示 `starting` 或 `unhealthy`，耐心等）：

```bash
watch -n 5 'docker compose ps'
# 等 umami 的 STATUS 变成 Up (healthy) 后 Ctrl+C 退出 watch
```

**【验证】**

```bash
docker compose ps
# 预期：umami        Up X minutes (healthy)
#       umami-postgres  Up X minutes (healthy)

curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
# 预期输出：200 或 307/308（跳转登录页都算正常）

curl -s http://127.0.0.1:3000/api/heartbeat
# 预期：空响应或 200（只要不报 connection refused）
```

> 排查：`docker compose logs --tail 50 umami`，把报错发我。

---

## 第 5 步：DNS 添加 A 记录（先灰云）

浏览器打开 Cloudflare Dashboard → 选 `ruinexai.com` 域 → **DNS** → **Records** → **Add record**：

| 字段 | 值 |
|------|-----|
| Type | `A` |
| Name | `umami` |
| IPv4 address | `<服务器IP>` |
| Proxy status | **灰云 DNS only**（先不要橙云！） |
| TTL | Auto |

保存后回到服务器验证解析已生效（灰云解析到的是服务器真实 IP）：

```bash
nslookup umami.ruinexai.com 1.1.1.1
# 预期：Address 显示 <服务器IP>（可能要等 1-5 分钟生效）
```

---

## 第 6 步：nginx + HTTPS 证书

### 6.1 安装 nginx（第 1 步显示未安装才做）

```bash
# Debian / Ubuntu
apt update && apt install -y nginx

# CentOS / AlmaLinux / Rocky
# yum install -y nginx && systemctl enable --now nginx
```

```bash
systemctl enable --now nginx
```

### 6.2 放置站点配置（当前是 HTTP 占位版，专门配合 certbot）

```bash
mkdir -p /var/www/certbot
cp /opt/umami/nginx-umami.conf /etc/nginx/conf.d/umami.conf
nginx -t          # 预期：syntax is ok / test is successful
systemctl reload nginx
```

### 6.3 签发 Let's Encrypt 证书

```bash
# Debian / Ubuntu
apt install -y certbot python3-certbot-nginx
certbot --nginx -d umami.ruinexai.com --redirect -m 你的邮箱 --agree-tos --non-interactive
```

> - 前提：第 5 步的 DNS 已生效、云安全组放行了 80/443
> - `--redirect` 会自动加 HTTP→HTTPS 跳转
> - CentOS 系：先 `yum install -y epel-release && yum install -y certbot python3-certbot-nginx`

**【验证】**

```bash
curl -sI https://umami.ruinexai.com | head -5
# 预期：HTTP/2 200（或 307 跳转到 /login），server: nginx
```

到这一步，浏览器打开 `https://umami.ruinexai.com` 应该能看到 Umami 登录页（灰云直连源站）。

### 6.4 启用完整 nginx 配置（443 + 反代头）

> ⚠️ **版本兼容提示**：Ubuntu 24.04 的 nginx 是 1.24，**不支持** `http2 on;` 独立指令（1.25.1+ 才有）。
> 如果 certbot 部署证书后访问 https 出现 **无限 301 循环**（ERR_TOO_MANY_REDIRECTS），说明 certbot 把原 80 块里的占位跳转带进了 443 块。处理方法：用下面的"最终版配置"整体替换 `/etc/nginx/conf.d/umami.conf`（443 段用老写法 `listen 443 ssl http2;`），`nginx -t && systemctl reload nginx` 即可。

证书签好后，把配置升级为最终版：

```bash
# 取消 conf 里 443 段的注释
sed -i 's/^# //' /opt/umami/nginx-umami.conf   # 这条不行就用下面的手动方式
```

> ⚠️ sed 批量去注释可能不完美，**建议手动编辑**更稳：
> ```bash
> nano /opt/umami/nginx-umami.conf
> ```
> 把文件末尾 `# ---- 证书签发成功后 ----` 注释块里每行开头的 `# ` 去掉（保留 `#` 开头的纯注释行不动），只保留那两个"注释括号"标记行删除。改完执行：

```bash
cp /opt/umami/nginx-umami.conf /etc/nginx/conf.d/umami.conf
nginx -t && systemctl reload nginx
curl -sI https://umami.ruinexai.com | head -3
# 预期仍是 200，且响应头里有 Cache-Control: no-store
```

**【验证】** 证书自动续期检查：

```bash
certbot renew --dry-run
# 预期：Congratulations, all simulated renewals succeeded
```

---

## 第 7 步：Cloudflare 切橙云（套 CDN）

回到 Cloudflare DNS 页面，把 `umami` 这条 A 记录的 Proxy status 从灰云点成**橙云（Proxied）**。

然后检查全站 TLS 模式：**SSL/TLS → Overview**，确认为 **Full** 或 **Full (strict)**。
> ⚠️ **不要改成 Flexible**——你主站 liruixiang.ruinexai.com（Pages）也在这个区域上，乱动模式会影响全站。当前应该是 Full 系，保持即可。

**【验证】**（本机 Git Bash）：

```bash
curl -sI https://umami.ruinexai.com | head -8
# 预期：HTTP/2 200，server: cloudflare ← 出现 cloudflare 字样说明已走 CDN
```

橙云的好处：CDN 加速、隐藏源站 IP、源站只对 CF 开放。可选进阶（以后再做）：防火墙只放行 Cloudflare IP 段访问 443。

---

## 第 8 步：初始化 Umami 后台

1. 浏览器打开 **https://umami.ruinexai.com**
2. 默认账号登录：用户名 `admin`，密码 `umami`
3. **立即改密码**：右上角头像 → Profile → Change password（存进密码管理器）
   - 可选加固：同一页面开启 **Two-Factor Authentication**
4. 添加网站：左侧 **Websites** → **Add website**
   - Name：`李瑞祥 · 个人主页`
   - Domain：`liruixiang.ruinexai.com`
   - Time zone：**Asia/Shanghai**（决定"每日"报表的切日时间，必选对）
5. **拿 Website ID**：网站列表 → 点进你刚建的网站 → 右上角 ⚙ 或 Edit → **Website ID**（一串 UUID，格式如 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`），复制它

---

## 第 9 步：回传验收信息

部署完成后，把下面两样发我：

1. **Website ID**（第 8 步第 5 小步复制的 UUID）
2. 各步验证结果（尤其第 4、6、7 步的 curl 输出，如果全绿可以只说"全过"）

我拿到后：改主站 `index.html`（tracker 引用换为 Umami）+ `main.js`（埋点委托切到 `umami.track`）→ 推送 → 陪你做最后的数据闭环验证。

---

## 附录 A：没有 swap 就加 2G（你已有，可跳过）

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h   # 预期 Swap: 2.0Gi
```

## 附录 B：每日自动备份（建议部署成功后加）

```bash
mkdir -p /opt/umami/backups
crontab -e
# 追加一行（每天 04:00 备份数据库，保留最近 14 份）：
0 4 * * * docker exec umami-postgres pg_dump -U umami umami | gzip > /opt/umami/backups/umami_$(date +\%F).sql && find /opt/umami/backups -name "*.sql.gz" -mtime +14 -delete
```

## 附录 C：日常运维速查

```bash
cd /opt/umami
docker compose logs --tail 50 umami     # 看日志
docker compose restart umami            # 重启应用
docker compose pull && docker compose up -d   # 升级到最新版 Umami
docker compose down                     # 停止（数据在卷里，不会丢）
```

---

## 故障排查表

| 症状 | 可能原因 | 处理 |
|------|----------|------|
| `docker compose up` 后 umami 一直 restarting | .env 缺失或密码含特殊字符 | `cat .env` 检查；`docker compose logs umami` 发我 |
| 首页 502 Bad Gateway | umami 还在迁移 / 没监听 3000 | 等 2 分钟再看；`curl 127.0.0.1:3000` 确认 |
| certbot 失败 "Failed authorization" | DNS 未生效 / 安全组没放 80 | `nslookup` 验证解析；云控制台开 80/443 |
| certbot 失败 " port 80 in use" | 80 被其他程序占用 | `ss -tlnp \| grep :80` 看占用者，发我 |
| 打开域名 ERR_NAME_NOT_RESOLVED | DNS 记录没建/没生效 | Cloudflare DNS 列表核对；等 5 分钟 |
| 切橙云后 522/526 | CF 连不上源站 / 证书模式错误 | 检查安全组 443；SSL/TLS 模式确认为 Full |
| Umami 报表没有地理位置数据 | 正常现象，偶发 | 数据量少时国家字段可能 Unknown |
| 内存吃紧 OOM | 1G 内存挤 | `free -h` 检查 swap；附录 A |

---

*手册版本：v1.0 · 2026-09-10 · 对应 Umami postgresql-latest（v3.x）+ postgres:16-alpine*
