/* Игротека — подключение к Firebase, общее для всех игр.
   Страница игры подключает перед этим файлом три скрипта Firebase (compat 10.12.2: app, auth, database),
   затем вызывает SiteFirebase.connect().
   Конфиг не секретный: доступ к данным защищают правила Realtime Database. */
window.SiteFirebase = {
  config: {
    apiKey: "AIzaSyAca6O4wKSrpAc0_JVD0QR7J9wg0I44-1w",
    authDomain: "poymay-volnu.firebaseapp.com",
    databaseURL: "https://poymay-volnu-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "poymay-volnu",
    storageBucket: "poymay-volnu.firebasestorage.app",
    messagingSenderId: "111831908199",
    appId: "1:111831908199:web:5cf4e98ed1c7765431f9c2"
  },
  _p: null,
  /* Инициализация и анонимный вход. Promise<{db, uid}>.
     Ошибки: "noconfig" — нет конфига, "offline" — не загрузились скрипты Firebase,
     иначе ошибка Firebase с полем code (например, auth/operation-not-allowed). */
  connect() {
    if (this._p) return this._p;
    const cfg = this.config, fb = window.firebase;
    this._p = new Promise((resolve, reject) => {
      if (!cfg.apiKey || !cfg.databaseURL) return reject("noconfig");
      if (!fb || typeof fb.initializeApp !== "function") return reject("offline");
      try {
        if (!fb.apps.length) fb.initializeApp(cfg);
        const db = fb.database(), auth = fb.auth();
        let done = false;
        auth.onAuthStateChanged(u => { if (u && !done) { done = true; resolve({ db, uid: u.uid }); } });
        auth.signInAnonymously().catch(e => { if (!done) { done = true; reject(e); } });
      } catch (e) { reject(e); }
    });
    return this._p;
  }
};
