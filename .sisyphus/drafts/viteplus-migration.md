# Vite+ 重构计划

## 需求确认

### 重构目标

将 docsjs 主项目和所有 demo 项目完全迁移到 Vite+ 工具链

### 用户偏好

- **迁移范围**: 完整迁移 (主项目 + react-demo + vue-demo)
- **策略**: 新特性优先 (优先体验 Vite+ 的新特性)
- **测试**: 现有测试验证

### 当前工具链

| 工具     | 当前使用 | Vite+ 替代        |
| -------- | -------- | ----------------- |
| 构建     | tsup     | vp build          |
| 测试     | vitest   | vp test           |
| Lint     | eslint   | vp check (oxlint) |
| 格式化   | 无       | vp check (oxfmt)  |
| 类型检查 | tsc      | vp check (tsgo)   |
| 包管理   | npm/pnpm | vp install        |

### 预期收益

- 构建速度提升 40x (Rolldown)
- Linting 快 50-100x (Oxlint)
- 格式化快 30x (Oxfmt)
- 统一 CLI，一个命令完成检查

## 关键发现

### Vite+ 迁移要求

1. 需要 Vite 8+ 和 Vitest 4.1+ (当前不满足)
2. 提供 `vp migrate` 命令自动迁移
3. 迁移后需手动调整

### 已知问题 (来自 Vue.js 迁移经验)

1. vp run 在 CI 中扫描整个 workspace 可能导致问题
2. 需要注意 import 路径重写 (vite → vite-plus)
3. 需要升级 Vite 到 v8

## 计划状态

- [ ] 收集需求
- [ ] 研究 Vite+ 文档
- [ ] 创建计划
