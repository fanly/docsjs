# Vite+ 全面迁移计划

> **规划者**: Prometheus
> **目标**: 将 docsjs 主项目和所有 demo 完全迁移到 Vite+ 工具链
> **策略**: 新特性优先 (优先体验 Oxlint, Oxfmt, Rolldown)
> **测试**: 现有测试验证

---

## TL;DR

> **快速总结**: 将项目从 tsup + vitest + eslint + tsc 迁移到 Vite+ 统一工具链，使用 vp CLI 统一管理构建、测试、代码检查。
>
> **核心收益**:
>
> - 构建快 40 倍 (Rolldown)
> - Linting 快 50-100 倍 (Oxlint)
> - 格式化快 30 倍 (Oxfmt)
> - 一个命令完成所有检查 (`vp check`)
>
> **预估工作量**: 中等 (需要分阶段迁移 3 个项目)
> **并行执行**: 是 (3 个项目可并行处理)

---

## Context

### 原始需求

用户（Vue 作者尤雨溪的好友，资深前端开发者）希望将项目底层彻底使用 Vite+ 改造。

### 当前工具链分析

| 项目       | 构建        | 测试          | Lint           | 格式化 | 类型检查 |
| ---------- | ----------- | ------------- | -------------- | ------ | -------- |
| 主项目     | tsup        | vitest ^3.2.4 | eslint ^9.18.0 | 无     | tsc      |
| vue-demo   | vite ^6.0.5 | -             | -              | -      | tsc      |
| react-demo | vite ^6.0.5 | -             | -              | -      | tsc      |

### 关键发现

1. **Vite+ 迁移前置条件**: 需要 Vite 8+ 和 Vitest 4.1+
   - 当前主项目没有 vite 依赖 (使用 tsup)
   - 当前 vitest ^3.2.4 (需要升级到 4.1+)
   - 当前 demos 使用 vite ^6.0.5 (需要升级到 v8+)

2. **Vite+ 提供 `vp migrate` 命令**: 自动迁移大部分配置

3. **已知风险** (来自 Vue.js 核心迁移经验):
   - `vp run` 在 CI 中扫描整个 workspace 可能导致问题
   - 需要注意 import 路径重写 (vite → vite-plus)
   - Oxlint 配置可能需要手动调整

---

## Work Objectives

### 核心目标

将 docsjs 主项目和所有 demo 项目完全迁移到 Vite+ 工具链，使用统一的 `vp` CLI。

### 具体交付物

- [ ] 主项目 (docsjs): vp build + vp test + vp check
- [ ] vue-demo: vp dev + vp build + vp check
- [ ] react-demo: vp dev + vp build + vp check
- [ ] 统一的 package.json scripts
- [ ] 移除旧的冗余依赖 (tsup, eslint, 旧版 vite/vitest)

### 完成定义

- [ ] `vp build` 成功构建所有项目
- [ ] `vp test` 成功运行所有测试
- [ ] `vp check` 成功完成 lint + 格式化 + 类型检查
- [ ] 所有 npm scripts 已更新为 vp 命令
- [ ] 现有测试全部通过

### 必须有

- 完整的 Vite+ 工具链功能
- 保留现有的测试覆盖
- 构建产物与之前等价

### 必须没有

- 旧的冗余工具配置 (不再需要 eslint 独立配置)
- 构建产物变化导致的功能破坏

---

## Execution Strategy

### 阶段划分

```
Phase 1: 准备阶段 (升级前置依赖)
├── 任务 1: 升级主项目 Vite 到 v8+
├── 任务 2: 升级主项目 Vitest 到 4.1+
├── 任务 3: 升级 demos 的 Vite 到 v8+
└── 任务 4: 安装 vp CLI

Phase 2: 迁移主项目
├── 任务 5: 运行 vp migrate
├── 任务 6: 配置 vp build (Rolldown)
├── 任务 7: 配置 vp check (Oxlint + Oxfmt + tsgo)
├── 任务 8: 配置 vp test
└── 任务 9: 更新 package.json scripts

Phase 3: 迁移 vue-demo
├── 任务 10: 运行 vp migrate
├── 任务 11: 配置 vp dev/build
└── 任务 12: 更新 scripts

Phase 4: 迁移 react-demo
├── 任务 13: 运行 vp migrate
├── 任务 14: 配置 vp dev/build
└── 任务 15: 更新 scripts

Phase 5: 清理与验证
├── 任务 16: 移除旧的冗余依赖
├── 任务 17: 运行完整验证
└── 任务 18: 提交并测试 CI
```

### 并行策略

- Phase 1 任务 1-4 可并行执行
- Phase 2-4 每个项目内部串行，但项目间可并行
- Phase 5 任务 17-18 串行

---

## TODOs

- [x] 1. 升级主项目 Vite 到 v8+

  **What to do**:
  - 在主项目 package.json 添加 `"vite": "^8.0.0"` 到 devDependencies
  - 运行 `npm install` 安装
  - 或使用 `vp install` (如果 vp 已安装)

  **QA Scenarios**:

  ```
  Scenario: 验证 Vite 8 已安装
    Tool: Bash
    Steps:
      1. npm list vite
      2. grep '"vite"' package.json
    Expected Result: vite 版本显示 ^8.0.0
  ```

  **Commit**: YES
  - Message: `chore: upgrade vite to v8 for Vite+ migration`

- [x] 2. 升级主项目 Vitest 到 4.1+

  **What to do**:
  - 修改 package.json: `"vitest": "^4.1.0"`
  - 运行 `npm install` 安装

  **QA Scenarios**:

  ```
  Scenario: 验证 Vitest 4.1 已安装
    Tool: Bash
    Steps:
      1. npm list vitest
    Expected Result: vitest 版本显示 ^4.1.0
  ```

  **Commit**: YES
  - Message: `chore: upgrade vitest to v4.1 for Vite+ migration`

- [x] 3. 升级 demos 的 Vite 到 v8

  **What to do**:
  - 修改 demos/vue-demo/package.json: `"vite": "^8.0.0"`
  - 修改 demos/react-demo/package.json: `"vite": "^8.0.0"`
  - 在各 demo 目录运行 `npm install`

  **QA Scenarios**:

  ```
  Scenario: 验证两个 demo 的 Vite 已升级
    Tool: Bash
    Steps:
      1. cd demos/vue-demo && npm list vite
      2. cd demos/react-demo && npm list vite
    Expected Result: 两个 demo 都显示 vite ^8.0.0
  ```

  **Commit**: YES
  - Message: `chore: upgrade demos vite to v8`

- [x] 4. 安装 vp CLI

  **What to do**:
  - 运行安装命令: `curl -fsSL https://vite.plus | bash`
  - 验证安装: `vp --version`
  - 运行 `vp help` 了解可用命令

  **QA Scenarios**:

  ```
  Scenario: 验证 vp 已安装
    Tool: Bash
    Steps:
      1. vp --version
    Expected Result: 显示版本号 (如 0.x.x)
  ```

  **Commit**: NO (全局安装)

- [ ] 5. 主项目运行 vp migrate

  **What to do**:
  - 在主项目根目录运行 `vp migrate --no-interactive`
  - 这将自动:
    - 更新 package.json scripts
    - 合并配置到 vite.config.ts (需要先创建)
    - 重写 imports
    - 更新依赖

  **注意**: 可能需要先创建基础的 vite.config.ts

  **QA Scenarios**:

  ```
  Scenario: 验证 migrate 完成
    Tool: Bash
    Steps:
      1. ls vite.config.ts
      2. grep 'vite-plus' package.json
    Expected Result: vite.config.ts 存在，package.json 包含 vite-plus
  ```

  **Commit**: YES
  - Message: `chore: run vp migrate for main project`

- [x] 6. 配置 vp build (Rolldown)

  **What to do**:
  - 检查并调整 vite.config.ts 的 build 配置
  - 确保构建产物与之前 tsup 等价
  - 运行 `vp build` 测试构建

  **关键配置**:
  - entry points: src/index.ts, src/core.ts, src/react.ts, src/vue.ts
  - formats: esm, cjs
  - external: react, react-dom, vue, jszip, yjs
  - dts: true (生成类型定义)
  - define: **DOCSJS_VERSION**

  **QA Scenarios**:

  ```
  Scenario: 验证构建成功
    Tool: Bash
    Steps:
      1. vp build
      2. ls dist/
    Expected Result: dist/ 目录包含构建产物
  ```

  Scenario: 验证构建成功
  Tool: Bash
  Steps: 1. vp build 2. ls dist/
  Expected Result: dist/ 目录包含构建产物

  ```

  **Commit**: YES
  - Message: `feat: configure vp build with Rolldown`

  ```

- [x] 7. 配置 vp check (Oxlint + Oxfmt + tsgo)

  **What to do**:
  - 运行 `vp check` 查看当前状态
  - 调整 .oxlintrc 或 vite.config.ts 中的 lint 配置
  - 运行 `vp check --fix` 自动修复格式问题
  - 确保通过所有检查

  **QA Scenarios**:

  ```
  Scenario: 验证 check 通过
    Tool: Bash
    Steps:
      1. vp check
    Expected Result: All checks passed
  ```

  Scenario: 验证 check 通过
  Tool: Bash
  Steps: 1. vp check
  Expected Result: All checks passed

  ```

  **Commit**: YES
  - Message: `feat: configure vp check with Oxlint and Oxfmt`

  ```

- [x] 8. 配置 vp test

  **What to do**:
  - 确保 vitest 配置兼容 vp test
  - 运行 `vp test` 验证测试运行
  - 确保现有测试通过

  **QA Scenarios**:

  ```
  Scenario: 验证测试通过
    Tool: Bash
    Steps:
      1. vp test run
    Expected Result: 所有测试通过
  ```

  **Commit**: YES
  - Message: `feat: configure vp test`
    Scenario: 验证测试通过
    Tool: Bash
    Steps: 1. vp test
    Expected Result: 所有测试通过

  ```

  Scenario: 验证测试通过
  Tool: Bash
  Steps: 1. vp test
  Expected Result: 所有测试通过

  ```

  **Commit**: YES
  - Message: `feat: configure vp test`

  ```

  ```

- [x] 9. 更新主项目 package.json scripts

  **What to do**:
  - 将 `"build": "tsup"` 改为 `"build": "vp build"`
  - 将 `"test": "vitest run"` 改为 `"test": "vp test"`
  - 将 `"lint": "eslint ."` 改为 `"lint": "vp check"` 或 `"vp lint"`
  - 将 `"typecheck": "tsc --noEmit"` 改为 `"typecheck": "vp check"` (已集成)
  - 合并为: `"check": "vp check"` (lint + fmt + typecheck)
  - 更新 `"verify"` 脚本

  **QA Scenarios**:

  ```
  Scenario: 验证 scripts 更新
    Tool: Bash
    Steps:
      1. cat package.json | jq '.scripts'
    Expected Result: 所有脚本使用 vp 命令
  ```

  **Commit**: YES
  - Message: `refactor: update package.json scripts to use vp`

- [x] 10. vue-demo 运行 vp migrate

  **What to do**:
  - cd demos/vue-demo
  - 运行 `vp migrate --no-interactive`
  - 确认配置正确

  **QA Scenarios**:

  ```
  Scenario: 验证 migrate 完成
    Tool: Bash
    Steps:
      1. cd demos/vue-demo && ls vite.config.ts
    Expected Result: vite.config.ts 存在
  ```

  **Commit**: YES
  - Message: `chore: migrate vue-demo to Vite+`

- [x] 11. 配置 vue-demo vp dev/build

  **What to do**:
  - 调整 vite.config.ts 确保 Vue 插件正常工作
  - 运行 `vp dev` 测试开发服务器
  - 运行 `vp build` 测试构建

  **QA Scenarios**:

  ```
  Scenario: 验证 dev 和 build
    Tool: Bash
    Steps:
      1. cd demos/vue-demo && vp build
    Expected Result: 构建成功
  ```

  **Commit**: YES
  - Message: `feat: configure vue-demo vp build`

- [x] 12. 更新 vue-demo scripts

  **What to do**:
  - 修改 package.json scripts 使用 vp 命令

  **QA Scenarios**:

  ```
  Scenario: 验证 scripts
    Tool: Bash
    Steps:
      1. cat demos/vue-demo/package.json | jq '.scripts'
    Expected Result: 使用 vp dev/build
  ```

  **Commit**: YES
  - Message: `refactor: update vue-demo scripts`

- [x] 13. react-demo 运行 vp migrate

  **What to do**:
  - cd demos/react-demo
  - 运行 `vp migrate --no-interactive`
  - 确认配置正确

  **QA Scenarios**:

  ```
  Scenario: 验证 migrate 完成
    Tool: Bash
    Steps:
      1. cd demos/react-demo && ls vite.config.ts
    Expected Result: vite.config.ts 存在
  ```

  **Commit**: YES
  - Message: `chore: migrate react-demo to Vite+`

- [x] 14. 配置 react-demo vp dev/build

  **What to do**:
  - 调整 vite.config.ts 确保 React 插件正常工作
  - 运行 `vp dev` 测试开发服务器
  - 运行 `vp build` 测试构建

  **QA Scenarios**:

  ```
  Scenario: 验证 dev 和 build
    Tool: Bash
    Steps:
      1. cd demos/react-demo && vp build
    Expected Result: 构建成功
  ```

  **Commit**: YES
  - Message: `feat: configure react-demo vp build`

- [x] 15. 更新 react-demo scripts

  **What to do**:
  - 修改 package.json scripts 使用 vp 命令

  **QA Scenarios**:

  ```
  Scenario: 验证 scripts
    Tool: Bash
    Steps:
      1. cat demos/react-demo/package.json | jq '.scripts'
    Expected Result: 使用 vp dev/build
  ```

  **Commit**: YES
  - Message: `refactor: update react-demo scripts`

- [ ] 16. 清理旧冗余依赖

  **What to do**:
  - 移除 tsup 及相关配置 (tsup.config.ts)
  - 评估是否可以移除 eslint (因为使用 vp check)
  - 评估是否可以移除独立的 prettier
  - 确认所有功能正常后再删除

  **QA Scenarios**:

  ```
  Scenario: 验证功能正常
    Tool: Bash
    Steps:
      1. vp build
      2. vp test
      3. vp check
    Expected Result: 全部通过
  ```

  **Commit**: YES
  - Message: `chore: remove legacy build tools (tsup)`

- [ ] 17. 运行完整验证

  **What to do**:
  - 在主项目: vp build && vp test && vp check
  - 在各 demo: vp build
  - 确保所有功能正常

  **QA Scenarios**:

  ```
  Scenario: 主项目完整验证
    Tool: Bash
    Steps:
      1. vp build
      2. vp test
      3. vp check
    Expected Result: 全部通过

  Scenario: vue-demo 验证
    Tool: Bash
    Steps:
      1. cd demos/vue-demo && vp build
    Expected Result: 构建成功

  Scenario: react-demo 验证
    Tool: Bash
    Steps:
      1. cd demos/react-demo && vp build
    Expected Result: 构建成功
  ```

  **Commit**: NO

- [ ] 18. 提交并测试 CI

  **What to do**:
  - 创建 git commit
  - 推送并观察 CI 结果
  - 修复任何 CI 问题

  **QA Scenarios**:

  ```
  Scenario: CI 验证
    Tool: Bash
    Steps:
      1. git push
      2. 观察 CI 状态
    Expected Result: CI 全部通过
  ```

  **Commit**: YES
  - Message: `feat: complete Vite+ migration for docsjs`

---

## Final Verification Wave

- [ ] F1. **构建产物验证** — 确认构建产物与之前等价
- [ ] F2. **测试覆盖验证** — 确保所有测试通过
- [ ] F3. **功能验证** — 手动测试核心功能正常
- [ ] F4. **CI 验证** — 确保 CI 流程正常

---

## Success Criteria

### 验证命令

```bash
# 主项目
vp build    # 构建成功
vp test     # 测试通过
vp check    # lint + fmt + typecheck 全部通过

# demos
cd demos/vue-demo && vp build
cd demos/react-demo && vp build
```

### 最终检查清单

- [ ] 所有项目使用 Vite+ 工具链
- [ ] vp build 成功
- [ ] vp test 成功
- [ ] vp check 成功
- [ ] 构建产物正常
- [ ] CI 流程正常
- [ ] 旧的冗余依赖已清理
