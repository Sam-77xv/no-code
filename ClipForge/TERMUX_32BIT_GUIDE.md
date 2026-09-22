# دليل بناء وتشغيل ClipForge على Termux 32-bit

## 📋 ملخص التغييرات التي تم إجراؤها

تم تعديل المشروع ليعمل على **Termux 32-bit** من خلال:

1. **تغيير متطلبات Node.js** من `>=18.0.0` إلى `>=16.0.0`
2. **إزالة تطبيق سطح المكتب (Tauri)** مؤقتًا (محفوظ في `apps/desktop_backup`)
3. **تحديث Next.js** من إصدار 15 إلى **14.1.0** (آخر إصدار يدعم Node.js 16)
4. **تعديل workspaces** في `package.json` لإزالة reference إلى desktop

---

## 🛠️ متطلبات النظام

### Termux 32-bit
- **Node.js**: v16.x.x (آخر إصدار 32-bit متوفر)
- **Python**: 3.x (لـ yt-dlp)
- **FFmpeg**: للمعالجة الفيديو
- **Git**: لاستنساخ المشروع
- **Storage**: 2GB+ مساحة خالية

---

## 📥 خطوات التثبيت

### 1️⃣ إعداد بيئة Termux

```bash
# تحديث جميع الحزم
pkg update && pkg upgrade -y

# تثبيت Node.js 16 (آخر إصدار 32-bit)
pkg install nodejs -y
node -v  # تأكد من أن الإصدار هو v16.x.x

# تثبيت Git
pkg install git -y

# تثبيت Python (مطلوب لـ yt-dlp)
pkg install python -y

# تثبيت FFmpeg (مطلوب لمعالجة الفيديو)
pkg install ffmpeg -y

# تثبيت curl (للتنزيلات)
pkg install curl -y

# تثبيت wget (اختياري)
pkg install wget -y
```

### 2️⃣ تثبيت yt-dlp

```bash
# تثبيت عبر pip
pip install yt-dlp

# تأكد من التثبيت
yt-dlp --version
```

### 3️⃣ استنساخ المشروع

```bash
# الانتقال إلى مجلد Termux الرئيسي
cd ~/..

# استنساخ المشروع
git clone https://github.com/machbrandido-art/no-code.git
cd no-code/ClipForge
```

### 4️⃣ تثبيت التبعيات

```bash
# تثبيت جميع الحزم باستخدام npm (بدلاً من pnpm)
npm install --legacy-peer-deps
```

**ملاحظة:** قد تستغرق هذه الخطوة وقتًا طويلاً على الهاتف (10-30 دقيقة)

### 5️⃣ بناء تطبيق الويب

```bash
# الانتقال إلى مجلد الويب
cd apps/web

# تثبيت تبعيات الويب
npm install --legacy-peer-deps

# بناء المشروع
npm run build
```

---

## 🚀 تشغيل التطبيق

### وضع التطوير (Development Mode)

```bash
# من مجلد apps/web
npm run dev
```

سيظهر الرابط:
```
  Local:   http://localhost:3000
```

### الوصول إلى التطبيق

#### طريقة 1: من نفس الجهاز (Termux)
```bash
# تثبيت lynx أو links لمتصفح نصي
pkg install lynx -y
lynx http://localhost:3000
```

#### طريقة 2: من متصفح الهاتف
```bash
# تثبيت ngrok للوصول الخارجي
wget https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-arm.zip
unzip ngrok-stable-linux-arm.zip
./ngrok http 3000
```

سيظهر رابط مثل: `https://xxxx.ngrok.io` - افتحه في متصفح الهاتف

#### طريقة 3: استخدام localhost مباشرة
- افتح متصفح الهاتف واذهب إلى: `http://localhost:3000`
- **ملاحظة:** قد لا يعمل هذا على بعض الأجهزة

---

## 📂 هيكل المشروع المعدل

```
ClipForge/
├── apps/
│   └── web/                    # Next.js 14 تطبيق الويب
│       ├── src/               # الكود المصدري
│       ├── package.json      # معدل لاستخدام Next.js 14
│       └── ...
├── packages/
│   ├── core/                  # خدمات الخلفية
│   ├── shared/                # الأنواع المشتركة
│   └── ui/                   # مكونات الواجهة
├── package.json              # معدل ل Node.js >=16.0.0
├── turbo.json                # إعدادات Turbo
├── apps/desktop_backup/       # نسخة احتياطية من Tauri
└── TERMUX_32BIT_GUIDE.md     # هذا الملف
```

---

## ⚙️ حل المشكلات الشائعة

### مشكلة 1: Node.js إصدار غير صحيح
```bash
# تأكد من الإصدار
node -v

# إذا كان الإصدار < 16
pkg remove nodejs
pkg install nodejs
```

### مشكلة 2: خطأ في تثبيت الحزم
```bash
# استخدم --legacy-peer-deps
npm install --legacy-peer-deps

# أو حاول تثبيت كل حزمة على حدة
npm install next@14.1.0
npm install react react-dom
# ثم الباقي
```

### مشكلة 3: yt-dlp غير موجود
```bash
# تأكد من التثبيت
which yt-dlp

# إذا لم يكن مثبتًا
pip install --upgrade yt-dlp
```

### مشكلة 4: FFmpeg غير موجود
```bash
# تأكد من التثبيت
which ffmpeg

# إذا لم يكن مثبتًا
pkg install ffmpeg
```

### مشكلة 5: عدم وجود مساحة كافية
```bash
# تحقق من المساحة
df -h

# حذف ملفات مؤقتة
rm -rf node_modules
rm -rf apps/web/node_modules
rm -rf packages/*/node_modules

# إعادة المحاولة
npm install --legacy-peer-deps
```

### مشكلة 6: خطأ في Next.js
```bash
# تأكد من إصدار Next.js
cd apps/web
npm list next

# إذا كان لا يزال 15
npm uninstall next
npm install next@14.1.0
```

---

## 🔄 استعادة تطبيق سطح المكتب (Tauri)

إذا أردت استعادة تطبيق سطح المكتب بعد بناء الويب:

```bash
# من جذر المشروع
mv apps/desktop_backup apps/desktop

# عدّل package.json لاستعادة desktop
nano package.json
# غير workspaces إلى:
# "workspaces": ["apps/*", "packages/*"]
```

**ملاحظة:** لن يعمل Tauri على Termux 32-bit، لكنه سيظل موجودًا للمشروع الأصلي.

---

## 📝 أوامر مفيدة

| الأمر | الوصف |
|-------|------|
| `npm run dev` | تشغيل في وضع التطوير |
| `npm run build` | بناء المشروع للإنتاج |
| `npm run start` | تشغيل الخادم للإنتاج |
| `npm run lint` | فحص الأخطاء |
| `npm run clean` | حذف ملفات البناء |

---

## 🎯 أوامر سريعة

### تثبيت كامل:
```bash
pkg update && pkg upgrade -y && \
pkg install nodejs git python ffmpeg curl -y && \
pip install yt-dlp && \
git clone https://github.com/machbrandido-art/no-code.git && \
cd no-code/ClipForge && \
npm install --legacy-peer-deps && \
cd apps/web && \
npm install --legacy-peer-deps && \
npm run dev
```

### تشغيل مع ngrok:
```bash
# في Terminal 1
cd ~/no-code/ClipForge/apps/web
npm run dev

# في Terminal 2
cd ~/no-code/ClipForge/apps/web
wget https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-arm.zip && \
unzip ngrok-stable-linux-arm.zip && \
./ngrok http 3000
```

---

## 📌 ملاحظات هامة

1. **الأداء**: قد يكون التطبيق بطيئًا على الهواتف القديمة
2. **المساحة**: تأكد من وجود 2GB+ مساحة حرة
3. **الإنترنت**: عملية التثبيت تتطلب اتصال إنترنت قوي
4. **ال time**: قد تستغرق عملية التثبيت 30-60 دقيقة
5. **الطاقة**: تأكد من أن الهاتف مشحون أو متصل بالشاحن

---

## 🚨 تحذيرات

- **لا تقم بإغلاق Terminal** أثناء التثبيت
- **لا تقم بحذف node_modules** أثناء البناء
- **تأكد من وجود مساحة كافية** قبل البدء
- **استخدم --legacy-peer-deps** دائمًا مع npm على Termux

---

## ✅ اختبار النجاح

بعد التثبيت الناجح، يجب أن تكون قادرًا على:

1. تشغيل `npm run dev` من `apps/web`
2. الوصول إلى `http://localhost:3000`
3. رؤية واجهة ClipForge
4. محاولة إضافة URL لفيديو

---

## 🔗 روابط مفيدة

- [Node.js على Termux](https://wiki.termux.com/wiki/Node.js)
- [FFmpeg على Termux](https://wiki.termux.com/wiki/FFmpeg)
- [yt-dlp مستندات](https://github.com/yt-dlp/yt-dlp)
- [Next.js مستندات](https://nextjs.org/docs)

---

## 📞 دعم

إذا واجهت أي مشكلة:

1. تأكد من اتباع جميع الخطوات بشكل صحيح
2. تحقق من المساحة والإنترنت
3. حاول إعادة التثبيت من البداية
4. إذا استمرت المشكلة، قد يكون هاتفك لا يدعم 32-bit بشكل كامل

---

**تم التعديل ليدعم Termux 32-bit**
**آخر تحديث: 2024**
