# Tuition Student App

A mobile-first React/Capacitor application for tuition students to track their attendance, view test scores, and manage their fees.

## Teacher App Requirements

Before running this app, ensure the connected **Teacher App** has been updated with the following:

### 1. Setting Student PINs
Students log in using a 4-digit PIN. 
In the teacher app, go to **Students → Add/Edit Student**. You will see a new field: **"Student Login PIN (4 digits)"**. Set this PIN and provide it to the student. The default PIN is `0000`.

### 2. Managing Exams
The student dashboard features an "Upcoming Exams" countdown. 
In the teacher app dashboard, tap the **Book/Calendar icon** in the top header to open the **Exam Manager**. 
Add exams with their Subject, Name, and Date. Exams will automatically disappear from the student app once the date passes.

### 3. Contact Teacher WhatsApp
The student app includes a direct WhatsApp link to the teacher.
To change the teacher's phone number, edit `src/lib/config.js` in the **student app** codebase:
```javascript
export const TEACHER_PHONE = '+91XXXXXXXXXX';
```

---

## Installing the APK on Phones

1. Transfer the built APK (`android/app/build/outputs/apk/debug/app-debug.apk`) to the Android phone (via WhatsApp, email, or USB).
2. Tap the APK file to open it.
3. Android will prompt a security warning: **"Install unknown apps"**.
4. Go to **Settings**, and toggle **Allow from this source**.
5. Return to the installation screen and tap **Install**.
6. The app will be installed as **"Tuition Student"** on the home screen.

---

## Development

- Built with Vite + React + Tailwind CSS v4
- Wrapped with Capacitor JS for Android compilation
- Database: Supabase

```bash
# Install dependencies
npm install

# Run web dev server
npm run dev

# Build for production
npm run build

# Sync with capacitor and build Android
npx cap sync
cd android && ./gradlew assembleDebug
```
