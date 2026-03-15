# DocsJS npmjs 自动化发布复盘（Trusted Publisher）

本文是 `@coding01/docsjs`、`@coding01/docsjs-editor`、`@coding01/docsjs-markdown` 的发布复盘与最终标准方案。目标是：后续发布只走一条稳定路径，不再重复踩坑。

## 1. 最终发布架构

只保留一条 npmjs 发布链路：

1. Git tag 触发：`v*.*.*`
2. GitHub Actions workflow：`.github/workflows/publish.yml`
3. npm Trusted Publisher（OIDC）签发并发布
4. `npm publish --provenance --access public`

明确禁止：

1. 在 `ci.yml` 里再做第二条发布路径
2. 混用 `NPM_TOKEN` 和 Trusted Publisher
3. 同时维护多个“看起来都能发布”的 workflow

## 2. 这次踩到的关键问题

### 问题 A：`E404 Not Found - PUT https://registry.npmjs.org/@coding01%2fdocsjs`

现象：

- 构建、测试、verify 全通过
- publish 阶段报 `E404`

根因：

- 包级 Trusted Publisher 绑定和实际 OIDC 身份不匹配，或存在脏配置。

验证方法：

1. 在 workflow 中打印 OIDC claims（sanitized）：
   - `sub`
   - `repository`
   - `workflow_ref`
   - `job_workflow_ref`
   - `ref`
2. 用 claims 对照 npm 包页面的 Trusted Publisher 配置逐字段比对。

### 问题 B：`ENEEDAUTH This command requires you to be logged in`

现象：

- CI 中报需要 `npm adduser`

根因：

- `ci.yml` 里残留了 token 发布 job（`NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`），不是 Trusted Publisher 路径。

修复：

1. 删除 `ci.yml` 里的发布 job
2. 发布只由 `publish.yml` 负责

### 问题 C：CI workflow 无效

现象：

- `Invalid workflow file`
- `(Line: 9): Unexpected value 'tag'`

根因：

- YAML 触发字段写错：`tag` 应为 `tags`（在 `push` 下）。

### 问题 D：`Linting could not start`

现象：

- `vp check` 报 lint 无法启动

处理策略：

1. 拆分检查职责，避免重复启动 lint：
   - `lint`: `vp lint .`
   - `fmt:check`: `vp check --no-lint`
   - `typecheck`: `vp exec tsc --noEmit`
2. `verify` 改为串联上述步骤，降低工具链并发冲突概率。

## 3. 当前标准配置（必须保持）

## 3.1 `publish.yml`

要求：

1. `permissions` 包含 `id-token: write`
2. `on.push.tags` 为 `v*.*.*`
3. `npm ci` + `npm run verify`
4. 仅执行 `npm publish --provenance --access public`

## 3.2 `ci.yml`

要求：

1. 只做质量检查（lint/fmt/typecheck/test/build）
2. 不做 npm 发布

## 3.3 `package.json`

建议：

1. 保留 `publishConfig.access=public`
2. `prepublishOnly` 走 `verify`
3. `prepare` 在 CI 中应可安全跳过（避免发布时副作用）

## 4. 发布前检查清单（实战）

每次发版前按顺序执行：

1. 本地：
   - `npm run verify`
2. 包信息：
   - `name`、`version`、`files`、`exports` 正确
3. Git：
   - `package.json` 版本与 tag 一致
   - `git tag vX.Y.Z`
4. npm 包页面：
   - Trusted Publisher 指向正确 repo + workflow filename
5. Actions：
   - 只有 `publish.yml` 执行发布

## 5. 故障快速定位流程

如果发布失败，按这个顺序排：

1. 先看失败 step：
   - `Verify` 失败：先修代码/脚本
   - `Publish` 失败：优先查 npm 权限或 Trusted Publisher 绑定
2. 看错误码：
   - `E404`：通常是 TP 绑定不匹配/权限隐藏
   - `ENEEDAUTH`：说明走了 token 登录路径，不是 TP 路径
3. 看 OIDC claims：
   - 逐字段比对 `repository/workflow_ref/ref/sub`

## 6. 结论

正确做法不是“多加一条兜底发布”，而是保证发布链路唯一、可观测、可复现：

1. CI 只做质量门
2. publish workflow 只做 Trusted Publisher 发布
3. 所有失败都能映射到单一责任面（代码、workflow、npm 绑定）

按本文执行，可以稳定避免本轮出现过的 `E404`、`ENEEDAUTH`、workflow 语法错误和 lint 启动异常。
