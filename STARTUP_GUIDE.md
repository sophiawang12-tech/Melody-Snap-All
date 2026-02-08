# Melody Snap - 启动指南

本指南包含启动前后端服务的完整步骤。

## 1. 准备工作

*   确保手机和电脑连接在**同一个 Wi-Fi** 下。
*   确保你的电脑 IP 地址已配置在前端代码中 (如 IP 变动需修改 `Melody-Snap-Frontend/app/services/sunoService.ts`)。

---

## 2. 启动后端服务 (Backend)

**路径**: `Melody-Snap-Backend`

打开终端，执行以下命令：

```bash
# 1. 进入后端目录
cd "Melody-Snap-Backend"

# 2. 激活虚拟环境 (确保出现 (venv) 前缀)
source venv/bin/activate

# 3. 启动服务 (允许局域网访问)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> **注意**: 如果提示端口被占用 (`Address already in use`)，先杀掉旧进程：
> `lsof -i :8000` (查看 PID) -> `kill -9 <PID>`

---

## 3. 启动前端服务 (Frontend)

**路径**: `Melody-Snap-Frontend`

打开**新的**终端窗口，执行以下命令：

```bash
# 1. 进入前端目录
cd "Melody-Snap-Frontend"

# 2. 启动 Expo 开发服务器
npx expo start
```

> **连接手机**:
> *   **iOS**: 打开系统相机，扫描终端显示的二维码 -> 点击 "Open in Expo Go"。
> *   **Android**: 打开 Expo Go App，扫描二维码。

---

## 4. 常见问题排查

*   **手机无法连接后端**：
    *   检查电脑防火墙是否允许 8000 端口。
    *   确认手机和电脑在同一 Wi-Fi。
    *   检查 `sunoService.ts` 中的 IP 是否是你电脑当前的局域网 IP。
*   **后端报错 `ModuleNotFoundError`**:
    *   确认是否激活了虚拟环境 (`source venv/bin/activate`)。
    *   确认依赖已安装 (`pip install -r requirements.txt`)。
