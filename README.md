# 牙齿 AI 检测网站（可公网部署）

你说得对：不是只在你电脑本地打开，而是要让公众都能访问。

这个项目现在支持：
- 前端上传牙齿照片
- 后端调用火山引擎 Ark API（API Key 只在后端）
- 部署到公网后，任何人都可通过网址访问

---


## 零命令行方案：从当前界面保存到本地，再上传 GitHub

如果你不会命令行，可以按这个最简单流程：

1. 在你现在这个页面右侧的文件列表里，逐个打开文件。
2. 把每个文件内容复制到你电脑本地新建文件里（文件名必须一致）。
3. 本项目需要这 10 个文件/目录：
   - `.dockerignore`
   - `.env.example`
   - `.gitignore`
   - `Dockerfile`
   - `README.md`
   - `package-lock.json`
   - `package.json`
   - `render.yaml`
   - `server.js`
   - `public/index.html`（注意 `public` 是文件夹，里面有 `index.html`）
4. 在 GitHub 仓库页面点击 **Add file -> Upload files**。
5. 直接把上面这些文件（含 `public` 文件夹）拖进去。
6. 页面底部点击 **Commit changes**。

> 小贴士：
> - 不要上传 `.env`（它有你的私钥）。
> - 上传后 GitHub 仓库根目录应能看到 `server.js`、`render.yaml`、`package.json`，并且有 `public/index.html`。

---

## 一、先在本地确认能跑（5分钟）

```bash
npm install
cp .env.example .env
```

编辑 `.env`：

```ini
ARK_API_KEY=你的火山API密钥
ARK_MODEL=doubao-seed-1-8-251228
PORT=3000
```

启动：

```bash
npm start
```

浏览器打开：`http://localhost:3000`

---

## 二、部署到公网（推荐 Render，最简单）

### 方案 A：Render（推荐新手）

1. 把代码推送到你的 GitHub 仓库。  
2. 打开 Render：`https://render.com`，选择 **New +** -> **Web Service**。  
3. 连接你的 GitHub 仓库。  
4. Render 会自动识别 `render.yaml`（本项目已提供）。  
5. 在 Render 后台填写环境变量：
   - `ARK_API_KEY` = 你的真实 API Key（必填）
   - `ARK_MODEL` = `doubao-seed-1-8-251228`（可默认）
6. 点击 Deploy，等待完成。  
7. Render 会给你一个公网地址，例如：  
   `https://tooth-ai-analyzer.onrender.com`

这就是给公众访问的网址。

---

### 方案 B：有自己服务器（Docker 部署）

如果你有云服务器（阿里云/腾讯云/VPS），可直接：

```bash
docker build -t tooth-ai-analyzer .
docker run -d \
  --name tooth-ai-analyzer \
  -p 80:3000 \
  -e ARK_API_KEY='你的火山API密钥' \
  -e ARK_MODEL='doubao-seed-1-8-251228' \
  tooth-ai-analyzer
```

然后访问你的服务器公网 IP：`http://你的服务器IP`

---

## 三、给公众访问时你需要注意

- API Key 必须只放后端（这个项目已做到）。
- 建议给网站加一个免责声明：AI 结果不替代医生诊断。
- 生产环境建议配 HTTPS（Render 默认有）。
- 上传的口腔照片属于敏感数据，建议在隐私政策里说明用途和保存策略。

---

## 四、接口健康检查

部署后你可以先测健康接口：

```bash
curl https://你的域名/health
```

返回：

```json
{"ok":true}
```

说明服务在线。
