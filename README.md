# NexusFlow - Frontend

Giao diện web cho NexusFlow - nền tảng SaaS quản lý dự án và vận hành doanh nghiệp. Cho phép các nhóm tạo workspace, quản lý dự án, phân công công việc và cộng tác theo thời gian thực.

## Tech Stack

| Loại | Công nghệ |
|------|-----------|
| Framework | Vue 3 + TypeScript |
| Build | Nx Workspace + Vite |
| Styling | Tailwind CSS v4 |
| State | Pinia |
| Routing | Vue Router |
| HTTP | Axios |
| WebSocket | Socket.io Client |
| UI Components | Headless UI + Custom |
| Icons | Heroicons |

## Yêu cầu hệ thống

- Node.js >= 20
- npm >= 10

## Cài đặt

```bash
git clone <repository-url>
cd websites
npm install
```

## Biến môi trường

Tạo file `.env` từ file `.env.example`

## Chạy dự án

```bash
# Development server (http://localhost:4200)
npm start

# Build production
npm run build

# Chạy tests
npm test
```
