# docsjs Roadmap

目标：在浏览器中实现 Word 内容“无损粘贴 + 无损上传”的 render-first 高保真组件。

## Milestone A (Now)

- [x] Web Component 内核
- [x] React/Vue 适配
- [x] 粘贴与 DOCX 上传双入口
- [x] OIDC Trusted Publishing
- [x] React demo (runnable)
- [x] Vue demo (runnable)

## Milestone B (Next)

- [ ] 列表完整保真（跨级连续编号、复杂模板）
- [ ] 表格完整保真（merge cell, nested table, fixed layout）
- [ ] 图片完整保真（floating anchor, wrap mode, crop）
- [ ] 字体完整保真（fontTable + fallback mapping + async loading）

## Milestone C (Advanced)

- [ ] 分页规则精度（widow/orphan, keep with next, table split）
- [ ] 高级对象（OMML, chart, SmartArt）
- [ ] 协同编辑适配（CRDT events）

## Definition of Done

1. 同一测试文档在 Word 与 docsjs 的核心版式偏差可控（行距/段距/版心）。
2. 关键结构（列表、表格、图片）不丢失语义与视觉关系。
3. 可通过自动化回归（基准文档 + 快照对比 + 语义统计）。
