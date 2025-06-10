# 🚀 Mall Web 快速部署指南

## 📋 服务器信息
- **服务器IP**: 39.107.74.208
- **前端端口**: 80
- **后端端口**: 9999

## 🛠️ 部署前准备

### 1. 确保服务器已安装Docker
```bash
# 检查Docker是否安装
docker --version

# 如果未安装，执行以下命令安装
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. 上传项目到服务器
```bash
# 方法1: 使用scp上传
scp -r mall-web/ user@39.107.74.208:/path/to/deploy/

# 方法2: 在服务器上git clone
git clone your-repo-url
cd mall-web
```

## 🚀 一键部署

### 在服务器上执行：
```bash
cd mall-web
chmod +x deploy.sh
./deploy.sh
```

## 📊 验证部署

### 1. 检查容器状态
```bash
docker ps | grep mall-web
```

### 2. 查看容器日志
```bash
docker logs -f mall-web-frontend
```

### 3. 访问应用
- **前端地址**: http://39.107.74.208
- **健康检查**: http://39.107.74.208/health

## 🔧 常用管理命令

```bash
# 查看容器状态
docker ps

# 查看实时日志
docker logs -f mall-web-frontend

# 重启容器
docker restart mall-web-frontend

# 停止容器
docker stop mall-web-frontend

# 进入容器
docker exec -it mall-web-frontend sh

# 查看容器资源使用
docker stats mall-web-frontend
```

## 🛠️ 故障排除

### 1. 容器启动失败
```bash
# 查看详细日志
docker logs mall-web-frontend

# 检查端口占用
netstat -tlnp | grep :80
```

### 2. 无法访问应用
- 检查防火墙设置
- 确保端口80已开放
- 检查后端服务是否正常运行

### 3. API请求失败
- 确认后端服务在9999端口正常运行
- 检查网络连接
- 查看浏览器控制台错误信息

## 🔄 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新部署
./deploy.sh
```

## 📝 配置文件说明

- **Dockerfile**: Docker镜像构建配置
- **nginx.conf**: Nginx服务器配置
- **.dockerignore**: Docker构建忽略文件
- **.env.production**: 生产环境变量配置

## 🔒 安全建议

1. **配置防火墙**
```bash
# 只开放必要端口
ufw allow 80
ufw allow 443
ufw allow 22
ufw enable
```

2. **定期更新**
```bash
# 更新系统
sudo apt update && sudo apt upgrade

# 更新Docker镜像
docker pull node:18-alpine
docker pull nginx:alpine
```

## 📞 技术支持

如遇到问题，请检查：
1. Docker服务是否正常运行
2. 端口是否被占用
3. 防火墙配置是否正确
4. 后端服务是否可访问
