---
title: 安全
---

# 安全模型

DocsJS 采用安全优先的设计理念，为文档处理提供多层保护。

## 插件沙箱

插件在受限沙箱中运行，拥有有限的全局访问权限：

```ts
const plugin = {
  name: "safe-plugin",
  permissions: {
    compute: { maxMemoryMB: 20 },
    ast: { canModifySemantics: true, canAccessOriginal: true },
  },
  beforeRender: (context) => {
    // 插件代码在隔离上下文中运行
    return context;
  },
};
```

## 权限系统

细粒度权限控制插件的访问范围：

| 权限      | 描述             |
| --------- | ---------------- |
| `read`    | 文件系统读取权限 |
| `write`   | 文件系统写入权限 |
| `network` | 网络请求能力     |
| `compute` | CPU/内存限制     |
| `ast`     | AST 修改权限     |

## AST 保护

核心转换操作经过白名单验证，防止未授权修改：

```ts
const permissions = {
  ast: {
    canModifySemantics: true, // 允许语义修改
    canAccessOriginal: true, // 访问源文档
    canExportRawAst: false, // 禁止 AST 导出
  },
};
```

## 内容净化

基于配置的净化策略防止 XSS 和注入攻击：

- **fidelity-first**: 最小化净化，保留原始内容
- **strict**: 激进净化，移除所有潜在危险内容
- **balanced**: 默认配置，标准净化规则

## 最佳实践

1. **最小权限**: 只授予插件必要的权限
2. **验证输入**: 始终净化外部内容
3. **审计日志**: 启用安全事件记录
4. **定期更新**: 保持依赖项更新
