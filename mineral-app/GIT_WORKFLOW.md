# Git Workflow Guide

## Cấu trúc Nhánh (Branch Structure)

Dự án sử dụng **Git Flow** với các nhánh chính sau:

### 🌲 Nhánh Chính

- **`main`**: Nhánh production, chỉ chứa code đã được test và sẵn sàng deploy
- **`develop`**: Nhánh phát triển chính, tích hợp tất cả các tính năng mới

### 🌿 Nhánh Hỗ trợ

- **`feature/*`**: Các tính năng mới
  - Ví dụ: `feature/image-upload`, `feature/pricing-algorithm`
- **`bugfix/*`**: Sửa lỗi từ develop
  - Ví dụ: `bugfix/upload-error`, `bugfix/pricing-calculation`
- **`hotfix/*`**: Sửa lỗi khẩn cấp từ main (production)
  - Ví dụ: `hotfix/critical-security-fix`

## Quy trình Làm việc

### 1. Tạo Tính Năng Mới (Feature)

```bash
# Bắt đầu từ develop
git checkout develop
git pull origin develop

# Tạo branch mới
git checkout -b feature/ten-tinh-nang

# Làm việc và commit
git add .
git commit -m "feat: mô tả tính năng"

# Push lên remote
git push -u origin feature/ten-tinh-nang

# Tạo Pull Request từ feature/* -> develop trên GitHub
```

### 2. Sửa Lỗi (Bugfix)

```bash
# Bắt đầu từ develop
git checkout develop
git pull origin develop

# Tạo branch bugfix
git checkout -b bugfix/ten-loi

# Sửa lỗi và commit
git add .
git commit -m "fix: mô tả lỗi đã sửa"

# Push và tạo PR
git push -u origin bugfix/ten-loi
```

### 3. Sửa Lỗi Khẩn Cấp (Hotfix)

```bash
# Bắt đầu từ main
git checkout main
git pull origin main

# Tạo hotfix branch
git checkout -b hotfix/ten-loi-khan-cap

# Sửa lỗi
git add .
git commit -m "hotfix: mô tả lỗi khẩn cấp"

# Push và merge vào cả main và develop
git push -u origin hotfix/ten-loi-khan-cap
```

### 4. Merge vào Develop

Sau khi PR được approve:

```bash
# Merge trên GitHub (khuyến nghị) hoặc:
git checkout develop
git pull origin develop
git merge feature/ten-tinh-nang
git push origin develop
```

### 5. Release lên Main

Khi develop đã ổn định:

```bash
git checkout main
git pull origin main
git merge develop
git push origin main

# Tag version
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Quy tắc Commit Message

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Tính năng mới
- `fix:` - Sửa lỗi
- `docs:` - Cập nhật tài liệu
- `style:` - Format code (không ảnh hưởng logic)
- `refactor:` - Refactor code
- `test:` - Thêm/sửa test
- `chore:` - Cập nhật build, dependencies, etc.

Ví dụ:
```
feat: thêm tính năng upload nhiều ảnh
fix: sửa lỗi tính giá không chính xác
docs: cập nhật hướng dẫn setup
```

## Xử lý Lỗi và Conflicts

### Khi có conflict:

```bash
# Pull latest changes
git pull origin develop

# Resolve conflicts trong code editor
# Sau đó:
git add .
git commit -m "fix: resolve merge conflicts"
git push origin feature/ten-tinh-nang
```

### Khi có lỗi build:

1. Kiểm tra lỗi trong terminal
2. Sửa lỗi trong code
3. Commit và push lại
4. CI/CD sẽ tự động chạy lại

## Best Practices

✅ **Nên làm:**
- Luôn pull latest changes trước khi tạo branch mới
- Commit thường xuyên với message rõ ràng
- Tạo PR nhỏ, dễ review
- Test code trước khi push
- Review code của người khác

❌ **Không nên:**
- Commit trực tiếp vào `main` hoặc `develop`
- Commit code chưa test
- Commit message không rõ ràng
- Tạo PR quá lớn (>500 dòng code)

## Tài liệu Tham khảo

- [Git Flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)


