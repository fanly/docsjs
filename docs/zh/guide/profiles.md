---
title: 配置系统
---

# 配置系统

DocsJS 提供预设配置（Profile）系统，针对不同使用场景优化处理行为。

## 内置配置

### knowledge-base

适用于技术文档，保留高保真格式：

```ts
engine.applyProfile("knowledge-base");
```

特点：

- 高保真格式保留
- MathML 支持
- 表格完整解析

### exam-paper

适用于试卷，支持题目提取：

```ts
engine.applyProfile("exam-paper");
```

特点：

- 严格语义解析
- 题目自动识别
- 答案区域标记

### enterprise-document

适用于企业文档，强调安全性：

```ts
engine.applyProfile("enterprise-document");
```

特点：

- 安全优先
- 合规性检查
- 内容净化

## 自定义配置

```ts
const customProfile = {
  id: "scientific-paper",
  name: "学术论文处理器",
  parse: {
    features: {
      mathML: true,
      tables: true,
      images: false,
    },
  },
  security: {
    allowedDomains: ["arxiv.org"],
    sanitizerProfile: "fidelity-first",
  },
};

engine.registerProfile(customProfile);
engine.applyProfile("scientific-paper");
```

## 配置选项

| 选项                        | 描述         | 默认值       |
| --------------------------- | ------------ | ------------ |
| `features.mathML`           | 数学公式支持 | `true`       |
| `features.tables`           | 表格解析     | `true`       |
| `features.images`           | 图片处理     | `true`       |
| `security.allowedDomains`   | 允许的域名   | `[]`         |
| `security.sanitizerProfile` | 净化策略     | `"balanced"` |
