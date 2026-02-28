# docsjs 商业化产品技术方案

## 仓库架构

| 仓库 | 可见性 | 用途 |
|------|--------|------|
| `fanly/docsjs` | 公开 | 核心库 (MIT) |
| `fanly/docsjs-md` | 公开 | Markdown 转换器 (MIT) |
| `fanly/docsjs-pro` | 私有 | 商业 SDK + License 验证 |
| `fanly/docsjs-cloud` | 私有 | 云端服务 + License Server |

---

## 1. docsjs-pro (商业 SDK)

### 功能模块

```
docsjs-pro/
├── src/
│   ├── license/          # License 验证
│   │   ├── validator.ts
│   │   ├── crypto.ts
│   │   └── storage.ts
│   ├── editors/          # 编辑器插件
│   │   ├── tiptap/
│   │   ├── editorjs/
│   │   └── ckeditor5/
│   ├── export/           # 导出功能
│   │   └── markdown.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 核心功能

1. **License 验证**
   - 在线验证 + 离线缓存 (24h)
   - 域名白名单 (*.example.com)
   - Plan 分级 (starter/professional/enterprise)
   - 泄露检测 (key 缩短、domain 校验)

2. **编辑器插件**
   - Tiptap: Node Extension
   - Editor.js: Block Tool
   - CKEditor5: Plugin

3. **导出增强**
   - Markdown (GFM)
   - YAML Frontmatter
   - 自定义模板

### 定价策略

| Plan | 价格 | 功能 |
|------|------|------|
| Starter | ¥99/月 | 基本转换 + 1域名 |
| Professional | ¥299/月 | 所有编辑器插件 + 5域名 |
| Enterprise | 定制 | 私有部署 + 无限域名 |

---

## 2. docsjs-cloud (云端服务)

### 服务架构

```
docsjs-cloud/
├── services/
│   ├── api/              # REST API
│   │   ├── convert.ts
│   │   ├── batch.ts
│   │   └── webhook.ts
│   ├── worker/           # 异步任务
│   │   └── processor.ts
│   └── license/          # License Server
│       ├── validator.ts
│       └── metrics.ts
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.worker
│   │   └── docker-compose.yml
│   └── kubernetes/
│       ├── deployment.yaml
│       └── service.yaml
├── package.json
└── tsconfig.json
```

### API 端点

```
POST /api/v1/convert              # 单文件转换
POST /api/v1/convert/batch        # 批量转换
POST /api/v1/jobs                 # 创建任务
GET  /api/v1/jobs/:id             # 任务状态
GET  /api/v1/usage               # 使用统计

# License Server
POST /api/v1/license/verify       # 验证 License
POST /api/v1/license/activate    # 激活 License
GET  /api/v1/license/:key        # 查询 License 信息
```

### Webhook 事件

```typescript
type WebhookEvent = 
  | { event: 'conversion.started'; data: { jobId: string } }
  | { event: 'conversion.completed'; data: { jobId: string; result: ConvertResult } }
  | { event: 'conversion.failed'; data: { jobId: string; error: string } }
  | { event: 'license.expiring'; data: { licenseKey: string; daysLeft: number } }
```

### 定价策略

| Tier | 请求/月 | 价格 |
|------|---------|------|
| Free | 100 | ¥0 |
| Pro | 10,000 | ¥99/月 |
| Business | 100,000 | ¥399/月 |
| Enterprise | 无限 | 定制 |

---

## 3. License 验证协议

### Token 格式 (JWT)

```json
{
  "header": { "alg": "RS256", "typ": "JWT" },
  "payload": {
    "licenseKey": "DOCSJS-PRO-XXXX-XXXX-XXXX",
    "plan": "professional",
    "customerId": "cus_xxxx",
    "customerEmail": "customer@example.com",
    "allowedDomains": ["example.com", "*.example.com"],
    "maxDomains": 5,
    "issuedAt": 1704067200000,
    "expiresAt": 1735689600000,
    "features": ["tiptap", "editorjs", "ckeditor5", "batch"]
  },
  "signature": "..."
}
```

### 验证流程

```
1. 客户端初始化
   └─> 读取本地缓存 (localStorage)

2. 有缓存 + 未过期 (24h)
   └─> 返回缓存的 License 信息

3. 无缓存 / 已过期
   └─> 请求 License Server /api/v1/license/verify
   └─> 验证签名 + 域名 + 到期时间
   └─> 返回 License 信息 + 缓存

4. 离线模式
   └─> 读取本地缓存
   └─> 验证域名匹配
   └─> 警告: 无法确保 License 未被吊销
```

### 安全措施

1. **Key 泄露检测**
   - 监控公开泄露 (GitHub, StackOverflow)
   - 自动吊销泄露的 Key

2. **域名绑定**
   - 支持通配符 (*.example.com)
   - 检测 Referer / Origin

3. **请求限流**
   - 单域名 100次/分钟
   - 异常检测 (多域名共享)

---

## 4. 部署方案

### 客户自部署 (Self-Hosted)

```yaml
# docker-compose.yml
version: '3.8'
services:
  docsjs-api:
    image: fanly/docsjs-cloud:latest
    ports:
      - "3000:3000"
    environment:
      - LICENSE_SERVER_URL=${LICENSE_SERVER_URL}
      - JWT_SECRET=${JWT_SECRET}
      - STORAGE_TYPE=local
      - RATE_LIMIT=1000
    volumes:
      - uploads:/app/uploads

  docsjs-license:
    image: fanly/docsjs-license:latest
    ports:
      - "3001:3001"
    environment:
      - LICENSE_PRIVATE_KEY=${LICENSE_PRIVATE_KEY}
      - LICENSE_PUBLIC_KEY=${LICENSE_PUBLIC_KEY}
      - DATABASE_URL=postgresql://...

volumes:
  uploads:
```

### SaaS (docsjs.cloud)

- Vercel / Railway 托管
- AWS S3 文件存储
- Stripe 支付集成
- Cloudflare CDN

---

## 5. 实施优先级

### Phase 1 (MVP - 2周)

- [ ] License 验证核心 (validator.ts)
- [ ] docsjs-pro 基础框架
- [ ] 手动 Key 激活 (无自动发行)
- [ ] 单域名限制

### Phase 2 (1个月)

- [ ] Tiptap/Editor.js 插件
- [ ] License Server
- [ ] 在线验证 API
- [ ] 基础使用统计

### Phase 3 (2个月)

- [ ] CKEditor5 插件
- [ ] Webhook 集成
- [ ] Stripe 支付
- [ ] 自助 Portal

### Phase 4 (商业化)

- [ ] 批量处理
- [ ] 客户支持系统
- [ ] SLA 监控
- [ ] 企业定制
