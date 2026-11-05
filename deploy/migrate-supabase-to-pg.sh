#!/usr/bin/env bash
# ============================================================
# Supabase → 自建 PostgreSQL 数据迁移（一次性）
# 用法：
#   1. 在能同时访问 Supabase 与目标服务器的机器上执行
#   2. export SUPA_PG="<SUPABASE POSTGRES_URL_NON_POOLING 原串>"
#      export DEST_PG="postgres://user:pass@124.221.252.243:5432/kaonaqu"
#   3. bash deploy/migrate-supabase-to-pg.sh
# 前置：目标库已执行 supabase/migrations（019 之前全部）建好表结构；
#       两端装有 pg_dump / psql（版本 ≥ 14）。
# 说明：只迁数据（--data-only），表结构以目标库 migrations 为准；
#       schools_backup_20261029 / news_backup_20261029 一并迁移。
# ============================================================
set -euo pipefail

: "${SUPA_PG:?需要 SUPA_PG 环境变量}"
: "${DEST_PG:?需要 DEST_PG 环境变量}"

TABLES=(schools news universities schools_backup_20261029 news_backup_20261029)

echo "==> 校验两端连通性"
pg_dump --version >/dev/null
psql "$SUPA_PG" -c 'SELECT 1' >/dev/null  && echo "  Supabase OK"
psql "$DEST_PG" -c 'SELECT 1' >/dev/null && echo "  目标库 OK"

STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="tmp/migrate-${STAMP}.sql"
mkdir -p tmp

echo "==> 导出数据（data-only，含 jsonb）"
# 剥 sslmode（本地 node 连 Supabase 时已知要剥；pg_dump 走 libpq 可保留 sslmode，
# 但若证书校验失败可追加 ?sslmode=require 或 PGSSLMODE=require env）
pg_dump "$SUPA_PG" --data-only --no-owner --no-privileges \
  --table=$(IFS=, ; echo "${TABLES[*]/%/ --table=&}") 2>/dev/null \
  || pg_dump "$SUPA_PG" --data-only --no-owner --no-privileges ${TABLES[@]/#/--table=} \
  > "$DUMP"

echo "==> 目标库清表（防重复导入）"
for t in "${TABLES[@]}"; do
  psql "$DEST_PG" -c "TRUNCATE TABLE $t CASCADE" >/dev/null
done

echo "==> 导入目标库"
psql "$DEST_PG" -v ON_ERROR_STOP=1 -f "$DUMP"

echo "==> 行数核对"
for t in "${TABLES[@]}"; do
  src=$(psql "$SUPA_PG" -tAc "SELECT count(*) FROM $t")
  dst=$(psql "$DEST_PG" -tAc "SELECT count(*) FROM $t")
  if [ "$src" = "$dst" ]; then
    echo "  ✓ $t: $dst"
  else
    echo "  ✗ $t: 源 $src / 目标 $dst —— 不一致，检查 $DUMP"
    exit 1
  fi
done

echo "==> 完成。dump 保留在 $DUMP（可删）"
