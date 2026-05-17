# ToldYou

一个前后端分离的个人博客项目，当前版本已完成 v1.0 所需的核心链路：

- 公开站点首页、文章列表、文章详情
- 后台登录、文章管理、分类管理、标签管理
- 站点配置、图片上传
- FastAPI 后端接口与 Vue 3 前端联动

## 项目结构

```text
ToldYou/
├─ backend/      FastAPI 后端
├─ frontend/     Vue 3 + TypeScript + Vite 前端
├─ docs/         接口与需求文档、设计参考图
├─ _Test/        接口测试脚本与报告
└─ docker-compose.yml
```

## 技术栈

- 前端：Vue 3、TypeScript、Vite
- 后端：FastAPI、SQLAlchemy
- 数据库：PostgreSQL
- 测试：pytest / 自定义 API 报告

## 本地开发

### 1. 启动后端

```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

后端默认地址：

- Swagger：`http://127.0.0.1:8000/docs`
- Health：`http://127.0.0.1:8000/health`

### 2. 启动前端

```powershell
cd frontend
npm install
npm run dev
```

如果需要指定后端地址，可以在前端环境变量中设置：

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3. Docker 启动

```powershell
docker compose up --build
```

当前 `docker-compose.yml` 包含：

- `backend`
- `postgres`

## 默认管理员

后端首次启动会自动创建管理员账号。账号密码来自 `backend/.env` 中的配置。

如果使用当前默认测试配置，常见登录信息为：

- 用户名：`admin`
- 密码：`Admin123456`

## 文档位置

- 后端设计说明：[docs/backend.md](./docs/backend.md)
- v1.0 测试说明：[docs/backend-test-v1.0.md](./docs/backend-test-v1.0.md)
- 页面设计参考图：`docs/首屏实例.png`、`docs/主页大观.png`

## 测试

接口测试相关内容位于 `_Test/`：

- 测试脚本
- 测试报告 HTML / JSON / LOG
- 测试说明文档

## 当前说明

- 前端目前使用 hash 路由组织公开页与后台页
- 项目展示区当前为前端静态占位数据
- 评论、搜索、RSS 等能力暂未进入当前实现范围
