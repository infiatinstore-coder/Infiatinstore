# 🚀 Git Setup Instructions

## ✅ Status Saat Ini

Git sudah berhasil dikonfigurasi untuk proyek marketplace:

- ✅ Git repository initialized
- ✅ Remote origin added: `https://github.com/infiatinmuzayyanahcampus-tech/infiya.git`
- ✅ Gitignore created
- ✅ All files committed to local branch `main`

## ⚠️ Authentication Required

Push ke GitHub gagal karena memerlukan autentikasi. Anda perlu login ke GitHub terlebih dahulu.

## 🔐 Cara Push ke GitHub

### Opsi 1: Menggunakan GitHub CLI (Recommended)

1. **Login dengan GitHub CLI:**
   ```bash
   gh auth login
   ```
   - Pilih: GitHub.com
   - Protocol: HTTPS
   - Authenticate via browser

2. **Push ke GitHub:**
   ```bash
   git push -u origin main
   ```

### Opsi 2: Menggunakan Personal Access Token (PAT)

1. **Buat Personal Access Token:**
   - Buka: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Pilih scope: `repo` (full control of private repositories)
   - Copy token yang dihasilkan

2. **Push dengan token:**
   ```bash
   git push -u origin main
   ```
   - Username: username GitHub Anda
   - Password: paste token yang sudah di-copy

### Opsi 3: Menggunakan SSH (Advanced)

1. **Setup SSH Key:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **Tambahkan ke GitHub:**
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - Paste di: https://github.com/settings/keys

3. **Ubah remote ke SSH:**
   ```bash
   git remote set-url origin git@github.com:infiatinmuzayyanahcampus-tech/infiya.git
   git push -u origin main
   ```

## 📝 Future Git Commands

Setelah push pertama berhasil, untuk update selanjutnya:

```bash
# Add changes
git add .

# Commit
git commit -m "Your commit message"

# Push
git push
```

## 🔍 Useful Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# View remote
git remote -v

# Create new branch
git checkout -b feature-name

# Pull latest changes
git pull origin main
```

---

**Next Step:** Pilih salah satu opsi authentication di atas dan jalankan `git push -u origin main`
