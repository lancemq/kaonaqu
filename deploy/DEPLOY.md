# kaonaqu 服务器部署指南（124.221.252.243 + kaonaqu.cn）

> 2026-11-05 架构切换配套：数据源 Supabase → 服务器本地 PostgreSQL；域名 kaonaqu.xyz → kaonaqu.cn。

## 0. 前置条件

- 服务器：124.221.252.243（Ubuntu/Debian 假设），已装 Node 22（`node -v`）、PostgreSQL ≥14（`psql --version`）、nginx
- 域名：kaonaqu.cn A 记录已指到 124.221.252.243
- 本仓库代码已拉到服务器（如 `/opt/kaonaqu`）

## 1. 目标库建库建表

```bash
sudo -u postgres psql <<'SQL'
CREATE USER kaonaqu WITH PASSWORD '<强密码>';
CREATE DATABASE kaonaqu OWNER kaonaqu;
SQL

# 表结构：依次执行 supabase/migrations/*.sql（001..019 + 备份表）
cd /opt/kaonaqu
for f in supabase/migrations/*.sql; do
  PGPASSWORD='<强密码>' psql -h 127.0.0.1 -U kaonaqu -d kaonaqu -f "$f"
done
```

注：migrations 里 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + anon/service policy 在自建库无副作用（本地连接属超级用户/表 owner，RLS 对 owner 默认不生效），可原样执行。

## 2. 数据迁移（Supabase → 自建 pg）

在任一能同时访问两端的机器（本机即可）：

```bash
export SUPA_PG="<Supabase 的 POSTGRES_URL_NON_POOLING 原串>"
export DEST_PG="postgres://kaonaqu:<密码>@124.221.252.243:5432/kaonaqu"
bash deploy/migrate-supabase-to-pg.sh
```

脚本自动：导出 5 张表（schools/news/universities + 两张备份表）→ 清目标表 → 导入 → 双端行数核对。
迁移完成后 Supabase 保留只读不再写入（回滚窗口期建议保留 1~2 周）。

## 3. 应用配置

`/opt/kaonaqu/.env.production`：

```bash
# 数据库（pg 直连，取代 SUPABASE_* 全套）
DATABASE_URL=postgres://kaonaqu:<密码>@127.0.0.1:5432/kaonaqu
# 域名（sitemap/canonical/JSON-LD/robots 全部消费此值）
NEXT_PUBLIC_SITE_URL=https://kaonaqu.cn
# 写 API 鉴权（与现 env 同名迁移）
API_WRITE_TOKEN=<原 token>
# CORS 白名单（代码默认已含 kaonaqu.cn，如需显式可保留此行）
# ALLOWED_ORIGINS=https://kaonaqu.cn
```

说明：
- `DATABASE_URL` 也可指向 `POSTGRES_URL_NON_POOLING` / `POSTGRES_URL`（pg-client.js 按此优先级取值），但生产建议统一 `DATABASE_URL`。
- 旧 `SUPABASE_*` / `KNQ_*` 变量可全部删除（运行时代码已不再读取）。`shared/supabase-client.js` 文件保留仅为运维脚本（tmp/*.cjs）回看参考，网站构建不引用。
- `PG_SSL_REJECT_UNAUTHORIZED` 无需设置（本机 127.0.0.1 无 TLS）。

## 3.5 每日任务备份目录（数据债自动化用）

```bash
sudo mkdir -p /home/ubuntu/databak
sudo chown ubuntu:ubuntu /home/ubuntu/databak
```

每日数据债任务（automation-1784266942235）写库前会自动备份：服务器上跑任务时带
`BACKUP_DEST=/home/ubuntu/databak`（写进 .env.production 或 automation 环境即可），
备份保留最近 14 份自动轮转。

## 4. 构建与常驻运行

```bash
cd /opt/kaonaqu
set -a; source .env.production; set +a
NODE_OPTIONS= npm ci
NODE_OPTIONS= npx next build
```

用 PM2 或 systemd 常驻（示例 PM2）：

```bash
npm i -g pm2
set -a; source .env.production; set +a
NODE_OPTIONS= pm2 start "npx next start -p 3000" --name kaonaqu
pm2 save && pm2 startup   # 开机自启
```

## 5. nginx 反代 + HTTPS

`/etc/nginx/sites-available/kaonaqu`：

```nginx
server {
  listen 80;
  server_name kaonaqu.cn www.kaonaqu.cn;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
ln -s /etc/nginx/sites-available/kaonaqu /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
# HTTPS（certbot 自动改写 80→443 跳转）
apt install certbot python3-certbot-nginx
certbot --nginx -d kaonaqu.cn -d www.kaonaqu.cn
```

## 6. 验证清单

```bash
curl -sI https://kaonaqu.cn/ | head -3                      # 308 → /shanghai
curl -s https://kaonaqu.cn/robots.txt | head -5             # Sitemap: https://kaonaqu.cn/...
curl -s https://kaonaqu.cn/sitemap.xml | grep -c kaonaqu.cn # >0 且无 xyz 残留
curl -sI https://kaonaqu.cn/universities | head -1          # 200
curl -s "https://kaonaqu.cn/api/schools?region=shanghai" | head -c 200  # API 读
# 写 API（带 token）与前端详情页各点一遍
```

- 本地验证记录（2026-11-05，dev 起服务直连 pg）：`/` 308、`/shanghai` `/shanghai/schools` `/shanghai/news` `/universities` `/nanjing/universities` 高校详情 学校详情 全 200；页面 canonical、robots、sitemap 全部输出 `kaonaqu.cn`，零 `kaonaqu.xyz` 残留；写路径增改删冒烟通过（含 jsonb 列）。

## 7. 回滚

数据层回滚 = `.env.production` 去掉 `DATABASE_URL`、恢复 `SUPABASE_*` 五件套 → 重新 build/restart（旧镜像下 PostgREST 路径完整保留在 git 历史 `47b2105` 之前）。域名回滚同理改 `NEXT_PUBLIC_SITE_URL`。

## 8. 已知差异（PostgREST → pg 直连）

- Next Data Cache（fetch 缓存）不再参与：pg 查询不经 fetch。缓存责任全部落到实例内存（列表 1800s / 详情 LRU 2000 条）。服务器单实例部署下等价；若未来多实例，写 API 的 revalidateTag 已无效，需要改成 Redis pub/sub 或缩短 TTL。
- 写 API（/api/...）成功后的 `revalidateTag` 调用保留（对 ISR 页面缓存仍生效），只是不再影响数据读取本身。
- `group` 是 SQL 保留字，所有 SQL 中已加引号 `"group"`。
