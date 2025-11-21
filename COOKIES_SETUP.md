# 🍪 YouTube Cookies Setup Guide

## ❌ Problem:
```
Error: Sign in to confirm you're not a bot
```

YouTube datacenter IPs (Render, AWS, etc.) ko block karta hai. **Cookies use karke fix kar sakte hain.**

---

## ✅ Solution: Cookies Export Karein

### **Step 1: Browser Extension Install Karein**

**Chrome/Edge:**
1. Install karein: [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)

**Firefox:**
1. Install karein: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

---

### **Step 2: YouTube par Login Karein**

1. YouTube.com kholein
2. Apne Google account se login karein (ya already logged in rahein)

---

### **Step 3: Cookies Export Karein**

1. **YouTube.com** par rahte hue, extension icon par click karein
2. **"Export cookies"** ya **"Get cookies"** click karein
3. `cookies.txt` file download ho jayegi

---

### **Step 4: Cookies ko JSON mein Convert Karein**

**Option A: Online Tool (Easy)**
```
https://www.cookieconverter.com/
```
- Upload `cookies.txt`
- Select output: **JSON**
- Download converted file

**Option B: Manual (Advanced)**

Yeh Python script use karein:
```python
import json

cookies = []
with open('cookies.txt', 'r') as f:
    for line in f:
        if line.strip() and not line.startswith('#'):
            parts = line.strip().split('\t')
            if len(parts) >= 7:
                cookies.append({
                    'name': parts[5],
                    'value': parts[6],
                    'domain': parts[0]
                })

with open('cookies.json', 'w') as f:
    json.dump(cookies, f, indent=2)

print("✅ cookies.json created!")
```

---

### **Step 5: Render par Cookies Upload Karein**

**Method 1: Environment Variable (Recommended)**

1. Render dashboard → Your service → **Environment**
2. Add new variable:
   ```
   Key: YOUTUBE_COOKIES
   Value: [paste entire cookies.json content]
   ```
3. Save changes
4. Redeploy

**Method 2: File Upload**

1. Project mein `cookies.json` file add karein
2. Git push karein
3. Render automatically deploy karega

⚠️ **Security:** Cookies sensitive hain, use environment variables (not Git)

---

## 🔧 Code Changes

Code already updated hai to support cookies:

```javascript
// bot/youtube.js automatically loads cookies from:
// 1. cookies.json file (if exists)
// 2. Or environment variable YOUTUBE_COOKIES
```

---

## ⏰ Cookie Expiry

- YouTube cookies **2-4 weeks** mein expire ho jate hain
- Jab bot error de: **Fresh cookies export karke update karein**

---

## 🚀 Quick Setup (5 Minutes)

1. ✅ Browser extension install karein
2. ✅ YouTube par login karein  
3. ✅ Cookies export karein (`cookies.txt`)
4. ✅ JSON mein convert karein
5. ✅ Render environment variable mein add karein:
   ```
   YOUTUBE_COOKIES=<paste JSON here>
   ```
6. ✅ Redeploy

---

## 🧪 Test Karein

Deploy hone ke baad:
```
/song meinjo jee rha hoon toh wajah tum ho
```

Agar work kare toh **cookies properly setup hain!** ✅

---

## 🛡️ Security Tips

1. **Secondary Google account** use karein (personal nahi)
2. **Never commit cookies to Git** - use environment variables only
3. **Refresh cookies** har 2-3 weeks mein
4. **Logout** mat karna us account se (cookies invalid ho jayenge)

---

## ⚠️ Troubleshooting

### **Still getting "Sign in to confirm" error:**
- Fresh cookies export karein (purane expire ho gaye)
- Check karo logged in ho YouTube par
- Try different Google account

### **"Invalid cookies" error:**
- JSON format check karein
- Cookies properly converted hain?
- Environment variable mein properly set hai?

---

## 📝 Alternative: Without Cookies (Limited)

Agar cookies setup nahi kar sakte:
- Bot kabhi-kabhi kaam karega (luck-based)
- YouTube randomly block karega
- **Not recommended for production**

---

Happy Deploying with Cookies! 🍪
