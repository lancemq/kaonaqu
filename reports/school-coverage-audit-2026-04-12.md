# 上海初高中学校覆盖审计

生成时间：2026-04-12

## 高中覆盖

- 官方基准：上海市教育考试院《2025 年上海市高中招生学校名单》：https://www.shmeea.edu.cn/download/20250430/90.pdf
- 官方 PDF 解析记录数：287
- 站内学校总数：684
- 高中官方名单缺口：0

- 结论：当前站内学校库已覆盖本轮解析到的官方高中招生学校名单。

## 初中覆盖

- 站内初中/完全中学相关记录：420
- 按区分布：{"baoshan":27,"changning":25,"chongming":16,"fengxian":15,"hongkou":18,"huangpu":20,"jiading":10,"jingan":19,"jinshan":13,"minhang":46,"pudong":73,"putuo":24,"qingpu":24,"songjiang":32,"xuhui":31,"yangpu":27}
- 市级义务教育政策入口：https://www.shanghai.gov.cn/nw12344/20250327/9d524c40947141639a2c40666ee4490d.html
- 本轮未找到一个可直接机器读取的上海市级“全量初中学校名单”。市级义务教育招生政策明确各区教育行政部门负责公布招生入学相关信息，因此初中全量覆盖需要按 16 区官方页面/PDF 逐区建立基准表后再跑差集。

## 使用说明

- 重新运行：`node scripts/audit-school-coverage.mjs`
- 若后续补齐 16 区初中官方基准，可在本脚本中增加 district junior source 解析，再生成初中缺口表。
