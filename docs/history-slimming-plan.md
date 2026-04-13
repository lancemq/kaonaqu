# Git 历史瘦身方案

## 目标

本方案只清理这三类历史垃圾，不改动当前保留的业务数据历史：

- `crawler/node_modules/**`
- 临时 HTML 抓取文件
- 本地缓存文件

本次明确纳入历史重写的路径：

- `crawler/node_modules`
- `.remote-schools.json`
- `remote-schools.tmp`
- `crawler/data/raw_edu_page.html`
- `crawler/data/raw_exam_page.html`
- `crawler/data/raw/raw_*.html`

不在本次范围内：

- `data/schools.json`
- `data/policies.json`
- `kaonaqu.pen`

说明：当前工作树已不再保留 `crawler/data/raw/official-*.json` 与 `crawler/data/processed/*.json` 这类抓取缓存；如果后续要进一步瘦身历史对象，可单独把这些缓存路径纳入 `git filter-repo` 范围。

## 仓库现状

- 当前默认分支：`main`
- 远端：`origin`
- 现有远端备份分支：`origin/backup/pre-filter-20260321`
- 本地工作区当前是脏的，不能直接开始历史重写
- 本机当前未安装 `git-filter-repo`

历史迹象：

- `crawler/node_modules` 出现在 2 个历史提交中
- 临时 HTML / 缓存文件出现在 5 个历史提交中
- 当前最大的历史 blob 仍以 `data/schools.json`、`kaonaqu.pen`、`data/policies.json` 为主，本方案不会触碰它们

## 风险说明

`git filter-repo` 会改写提交 ID。执行后：

- 所有分支和 PR 基础都会变化
- 已拉取仓库的协作者需要重新同步历史
- 强推前必须保留备份引用

## 建议执行顺序

### 1. 先保存当前工作区改动

历史重写前，先把当前清理改动提交掉，或者临时 stash。

建议直接提交：

```bash
git add .gitignore crawler/package.json
git add -u
git commit -m "chore: trim crawler artifacts and legacy scripts"
```

如果你不想现在提交，也可以：

```bash
git stash push -u -m "pre-filter-repo-worktree"
```

### 2. 安装 `git-filter-repo`

二选一：

```bash
brew install git-filter-repo
```

或

```bash
python3 -m pip install --user git-filter-repo
```

验证：

```bash
git filter-repo --help
```

### 3. 创建本地只读备份引用

```bash
git branch backup/pre-filter-$(date +%Y%m%d)
```

如果希望连裸仓都备份一份：

```bash
cd ..
git clone --mirror kaonaqu kaonaqu.mirror-backup
cd kaonaqu
```

### 4. 执行历史重写

在仓库根目录执行：

```bash
git filter-repo \
  --force \
  --invert-paths \
  --path crawler/node_modules \
  --path .remote-schools.json \
  --path remote-schools.tmp \
  --path crawler/data/raw_edu_page.html \
  --path crawler/data/raw_exam_page.html \
  --path-glob 'crawler/data/raw/raw_*.html'
```

说明：

- `--invert-paths` 表示把这些路径从全部历史中删除
- `--path-glob` 用于匹配带时间戳的原始 HTML 文件
- 本命令不会动 `data/*.json`；如需继续清理历史里的 crawler JSON 缓存，可另开一轮 filter-repo 范围

### 5. 清理本地不可达对象并复查体积

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git count-objects -vH
```

再复查最大的历史 blob：

```bash
git rev-list --objects --all \
| git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
| awk '$1=="blob" {print $3"\t"$4}' \
| sort -nr \
| head -n 20
```

预期结果：

- `crawler/node_modules/...` 不再出现在最大 blob 列表里
- `.remote-schools.json` 和临时 HTML 不再出现在历史对象里
- `.git` 会变小，但不会非常夸张，因为最大的剩余对象还是 `data/schools.json` 和 `kaonaqu.pen`

### 6. 推送策略

先推备份分支，再强推主分支：

```bash
git push origin backup/pre-filter-$(date +%Y%m%d)
```

```bash
git push origin --force --all
git push origin --force --tags
```

如果只想先更新主分支：

```bash
git push origin --force main
```

## 协作者同步指引

历史改写后，其他本地仓库建议这样同步：

```bash
git fetch origin
git checkout main
git reset --hard origin/main
git clean -fd
```

如果协作者有自己的未提交修改，应先自行备份。

## 回滚方案

如果重写后发现范围不对：

1. 直接回到备份分支
2. 或从镜像备份仓库恢复
3. 或把远端重置回 `origin/backup/pre-filter-20260321` / 新建的本地备份分支

示例：

```bash
git checkout main
git reset --hard backup/pre-filter-$(date +%Y%m%d)
```

然后重新推送。

## 本仓库的下一阶段可选项

如果这轮做完后你还想继续显著缩小历史，下一批最值得单独评估的是：

- `data/schools.json` 的历史版本
- `data/policies.json` 的历史版本
- `kaonaqu.pen` 的多次大版本

但这已经会触碰业务数据历史，建议单独开第二个方案，而不是和这次混在一起。
