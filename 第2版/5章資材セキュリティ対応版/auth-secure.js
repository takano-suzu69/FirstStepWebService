// auth-secure.js
// 認証関連の処理
if (window.debugLog) debugLog('auth-secure.js 実行開始');

// セキュリティ設定
const SecurityConfig = {
  // CSPヘッダーの設定（Content Security Policy）
  setupCSP: function() {
    // メタタグでCSPを設定（HTTPヘッダーが設定できない場合のフォールバック）
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = "default-src 'self'; script-src 'self' https://unpkg.com https://sdk.amazonaws.com https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.cloudfront.net https://*.amazonaws.com https://*.execute-api.*.amazonaws.com";
    document.head.appendChild(cspMeta);
    
    if (window.debugLog) debugLog('CSPメタタグを設定しました');
  },
  
  // XSSフィルターの有効化
  enableXSSFilter: function() {
    const xssProtectionMeta = document.createElement('meta');
    xssProtectionMeta.httpEquiv = 'X-XSS-Protection';
    xssProtectionMeta.content = '1; mode=block';
    document.head.appendChild(xssProtectionMeta);
    
    if (window.debugLog) debugLog('XSSフィルターを有効化しました');
  },
  
  // クリックジャッキング防止
  preventClickjacking: function() {
    const frameOptionsMeta = document.createElement('meta');
    frameOptionsMeta.httpEquiv = 'X-Frame-Options';
    frameOptionsMeta.content = 'DENY';
    document.head.appendChild(frameOptionsMeta);
    
    if (window.debugLog) debugLog('クリックジャッキング防止を設定しました');
  },
  
  // すべてのセキュリティ対策を適用
  applyAll: function() {
    this.setupCSP();
    this.enableXSSFilter();
    this.preventClickjacking();
    
    if (window.debugLog) debugLog('すべてのセキュリティ対策を適用しました');
  }
};

// セキュリティ対策を適用
SecurityConfig.applyAll();

const Auth = {
  userPool: null,
  refreshTokenInterval: null, // トークン自動更新用のインターバル
  tokenExpiryBuffer: 10 * 60, // トークン更新を行う期限切れ前の秒数（10分）
  
  // セキュアストレージ - トークン関連情報の安全な保存
  // セキュアストレージ - トークン関連情報の安全な保存
  secureStorage: {
    // 安全なストレージキー（ランダム生成）
    storageKeyPrefix: 'app_' + Math.random().toString(36).substring(2, 15),
    
    // データの暗号化
    encrypt: function(data, key) {
      try {
        // 簡易的な暗号化（本番環境ではより強力な暗号化を使用すべき）
        const encodedData = btoa(JSON.stringify(data));
        const encodedKey = btoa(key || this.storageKeyPrefix);
        return encodedData + '.' + encodedKey.substring(0, 8);
      } catch (e) {
        console.error('Encryption error:', e);
        return null;
      }
    },
    
    // データの復号化
    decrypt: function(encryptedData, key) {
      try {
        if (!encryptedData || !encryptedData.includes('.')) return null;
        
        const parts = encryptedData.split('.');
        const data = parts[0];
        const keyCheck = parts[1];
        
        const encodedKey = btoa(key || this.storageKeyPrefix);
        if (keyCheck !== encodedKey.substring(0, 8)) {
          console.error('Invalid storage key');
          return null;
        }
        
        return JSON.parse(atob(data));
      } catch (e) {
        console.error('Decryption error:', e);
        return null;
      }
    },
    
    // セッションストレージに安全に保存（ページ閉じると消える）
    setSessionItem: function(key, value) {
      const encryptedValue = this.encrypt(value, key);
      if (encryptedValue) {
        sessionStorage.setItem(this.storageKeyPrefix + '_' + key, encryptedValue);
        return true;
      }
      return false;
    },
    
    // セッションストレージから安全に取得
    getSessionItem: function(key) {
      const encryptedValue = sessionStorage.getItem(this.storageKeyPrefix + '_' + key);
      if (!encryptedValue) return null;
      return this.decrypt(encryptedValue, key);
    },
    
    // セッションストレージから削除
    removeSessionItem: function(key) {
      sessionStorage.removeItem(this.storageKeyPrefix + '_' + key);
    },
    
    // すべてのストレージをクリア
    clearAll: function() {
      // セッションストレージのクリア
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(this.storageKeyPrefix)) {
          sessionStorage.removeItem(key);
        }
      });
      
      if (window.debugLog) debugLog('セキュアストレージをクリアしました');
    }
  },
  
  // センシティブ情報をマスクする関数
  maskSensitiveData: function(obj) {
    if (!obj) return obj;
    if (typeof obj !== 'object') return obj;
    
    // オブジェクトをディープコピー
    const masked = JSON.parse(JSON.stringify(obj));
    
    // センシティブフィールドのリスト
    const sensitiveFields = [
      'password', 'token', 'accessToken', 'idToken', 'refreshToken', 
      'authorization', 'apiKey', 'secret', 'credentials', 'key',
      'sub', 'email', 'phone', 'address', 'birthdate', 'ssn'
    ];
    
    // オブジェクトを再帰的に処理
    function maskRecursive(obj) {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        // キーがセンシティブかチェック（大文字小文字を区別しない）
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()));
        
        if (isSensitive && typeof obj[key] === 'string') {
          // センシティブな文字列をマスク
          const value = obj[key];
          if (value.length > 6) {
            obj[key] = value.substring(0, 3) + '***' + value.substring(value.length - 3);
          } else if (value.length > 0) {
            obj[key] = '******';
          }
        } else if (obj[key] && typeof obj[key] === 'object') {
          // オブジェクトや配列を再帰的に処理
          maskRecursive(obj[key]);
        }
      });
    }
    
    maskRecursive(masked);
    return masked;
  },
  
  // 安全にログ出力する関数
  safeLog: function(message, data) {
    if (data) {
      console.log(message, this.maskSensitiveData(data));
      if (window.debugLog) {
        const maskedData = this.maskSensitiveData(data);
        let logStr;
        try {
          logStr = JSON.stringify(maskedData);
          if (logStr.length > 200) {
            logStr = logStr.substring(0, 197) + '...';
          }
        } catch (e) {
          logStr = '[Object cannot be stringified]';
        }
        debugLog(`${message}: ${logStr}`);
      }
    } else {
      console.log(message);
      if (window.debugLog) debugLog(message);
    }
  },

  // Cognitoの設定を初期化する関数
  initPool: async function() {
    this.safeLog('Auth.initPool 呼び出し');
    
    if (this.userPool) {
      this.safeLog('ユーザープールは既に初期化済み');
      return this.userPool; // 既に初期化済みの場合は再利用
    }

    try {
      // APIから設定を取得（CloudFrontのパスを使用）- 認証なしの公開エンドポイント
      // 両方のエンドポイントを試す
      let apiUrl = 'https://xxxxxxxx.cloudfront.net/cognito-config-public';
      this.safeLog('設定取得URL', { url: apiUrl });

      let response = await fetch(apiUrl);
      this.safeLog('設定取得レスポンス', { status: response.status });

      if (!response.ok) {
        apiUrl = 'https://xxxxxxxxx.cloudfront.net/cognito-config';
        this.safeLog('最初のURLが失敗、次のURLを試行', { url: apiUrl });
        response = await fetch(apiUrl);
        this.safeLog('2回目の設定取得レスポンス', { status: response.status });
      }

      if (!response.ok) {
        this.safeLog('設定取得失敗', { status: response.status });
        throw new Error(`Failed to load configuration: ${response.status}`);
      }

      const responseText = await response.text();
      
      const cognitoConfig = JSON.parse(responseText);
      this.safeLog('Cognito設定取得', { 
        hasUserPoolId: !!cognitoConfig.userPoolId || !!cognitoConfig.UserPoolId,
        hasClientId: !!cognitoConfig.clientId || !!cognitoConfig.ClientId || !!cognitoConfig.userPoolWebClientId
      });

      // ユーザープールを初期化
      this.userPool = new AmazonCognitoIdentity.CognitoUserPool({
        UserPoolId: cognitoConfig.userPoolId || cognitoConfig.UserPoolId,
        ClientId: cognitoConfig.clientId || cognitoConfig.ClientId || cognitoConfig.userPoolWebClientId
      });

      this.safeLog('ユーザープール初期化成功');
      
      // 既存のセッションがあれば、トークン自動更新を設定
      this.setupTokenRefresh();
      
      return this.userPool;
    } catch (error) {
      this.safeLog('Cognito設定取得エラー', { message: error.message });
      
    }
  },
  
  // トークン自動更新の設定
  setupTokenRefresh: async function() {
    try {
      // 既存のインターバルをクリア
      if (this.refreshTokenInterval) {
        clearInterval(this.refreshTokenInterval);
      }
      
      // 現在のユーザーを取得
      const user = this.userPool.getCurrentUser();
      if (!user) {
        if (window.debugLog) debugLog('現在のユーザーが存在しないため、トークン更新は設定しません');
        return;
      }
      
      // セッションを取得してトークンの有効期限を確認
      const session = await this.getCurrentSession();
      const idToken = session.getIdToken();
      const expirationTime = idToken.getExpiration(); // Unix時間（秒）
      
      // 次の更新時間を計算（有効期限の10分前）
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = expirationTime - currentTime;
      const refreshTime = Math.max(0, timeToExpiry - this.tokenExpiryBuffer);
      
      if (window.debugLog) debugLog(`トークン有効期限: ${new Date(expirationTime * 1000).toISOString()}`);
      if (window.debugLog) debugLog(`${refreshTime}秒後にトークンを更新します`);
      
      // 更新タイマーを設定
      this.refreshTokenInterval = setTimeout(async () => {
        if (window.debugLog) debugLog('トークン更新を実行します');
        try {
          await this.refreshSession();
          // 更新成功後、次の更新をスケジュール
          this.setupTokenRefresh();
        } catch (error) {
          if (window.debugLog) debugLog(`トークン更新エラー: ${error.message}`);
          console.error('Token refresh error:', error);
          // エラー時は再ログインを促す
          alert('セッションの有効期限が切れました。再度ログインしてください。');
          await this.signOut();
          window.location.reload();
        }
      }, refreshTime * 1000); // ミリ秒に変換
      
    } catch (error) {
      if (window.debugLog) debugLog(`トークン更新設定エラー: ${error.message}`);
      console.error('Error setting up token refresh:', error);
    }
  },
  
  // セッションを更新
  refreshSession: function() {
    return new Promise((resolve, reject) => {
      const user = this.userPool.getCurrentUser();
      
      if (!user) {
        reject(new Error('ユーザーがログインしていません'));
        return;
      }
      
      user.getSession((err, session) => {
        if (err) {
          reject(err);
          return;
        }
        
        // リフレッシュトークンを使用して新しいセッションを取得
        user.refreshSession(session.getRefreshToken(), (err, newSession) => {
          if (err) {
            reject(err);
            return;
          }
          if (window.debugLog) debugLog('セッション更新成功');
          resolve(newSession);
        });
      });
    });
  },
  
  // 現在のセッション取得
  getCurrentSession: async function() {
    if (window.debugLog) debugLog('Auth.getCurrentSession 呼び出し');
    
    if (!this.userPool) {
      if (window.debugLog) debugLog('ユーザープールが未初期化、初期化を実行');
      await this.initPool();
    }
    
    return new Promise((resolve, reject) => {
      const user = this.userPool.getCurrentUser();
      
      if (!user) {
        if (window.debugLog) debugLog('現在のユーザーが存在しない');
        reject(new Error('ユーザーがログインしていません'));
        return;
      }
      
      user.getSession((err, session) => {
        if (err) {
          if (window.debugLog) debugLog(`セッション取得エラー: ${err.message}`);
          reject(err);
          return;
        }
        
        // セッションの有効性を検証
        if (!session.isValid()) {
          if (window.debugLog) debugLog('セッションが無効です');
          reject(new Error('セッションが無効です'));
          return;
        }
        
        if (window.debugLog) debugLog('セッション取得成功');
        resolve(session);
      });
    });
  },
  
  // トークンの検証
  validateToken: async function() {
    try {
      const session = await this.getCurrentSession();
      const idToken = session.getIdToken();
      const expirationTime = idToken.getExpiration(); // Unix時間（秒）
      const currentTime = Math.floor(Date.now() / 1000);
      
      // トークンが有効期限切れかどうかをチェック
      if (currentTime >= expirationTime) {
        if (window.debugLog) debugLog('トークンの有効期限が切れています');
        return false;
      }
      
      return true;
    } catch (error) {
      if (window.debugLog) debugLog(`トークン検証エラー: ${error.message}`);
      return false;
    }
  },
  
  // ログイン処理
  signIn: async function(email, password) {
    this.safeLog('Auth.signIn 呼び出し', { email: email ? email.substring(0, 3) + '***' : null });
    
    if (!this.userPool) {
      this.safeLog('ユーザープールが未初期化、初期化を実行');
      await this.initPool();
    }
    
    return new Promise((resolve, reject) => {
      const authData = {
        Username: email,
        Password: password
      };
      
      const authDetails = new AmazonCognitoIdentity.AuthenticationDetails(authData);
      
      const userData = {
        Username: email,
        Pool: this.userPool
      };
      
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
      
      // セキュリティ強化: ログイン試行回数を制限
      const loginAttempts = this.secureStorage.getSessionItem('loginAttempts') || 0;
      if (loginAttempts >= 5) {
        const lastAttempt = this.secureStorage.getSessionItem('lastLoginAttempt') || 0;
        const now = Date.now();
        const lockoutTime = 15 * 60 * 1000; // 15分のロックアウト
        
        if (now - lastAttempt < lockoutTime) {
          const remainingTime = Math.ceil((lockoutTime - (now - lastAttempt)) / 60000);
          this.safeLog('ログイン試行回数超過', { attempts: loginAttempts, remainingTime });
          reject(new Error(`ログイン試行回数が多すぎます。${remainingTime}分後に再試行してください。`));
          return;
        } else {
          // ロックアウト時間が過ぎたらリセット
          this.secureStorage.setSessionItem('loginAttempts', 0);
          this.safeLog('ロックアウト時間経過、カウンターリセット');
        }
      }
      
      // ログイン試行を記録
      this.secureStorage.setSessionItem('lastLoginAttempt', Date.now());
      this.secureStorage.setSessionItem('loginAttempts', loginAttempts + 1);
      this.safeLog('ログイン試行記録', { attempts: loginAttempts + 1 });
      
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => {
          this.safeLog('ログイン成功');
          
          // ログイン成功したらカウンターをリセット
          this.secureStorage.setSessionItem('loginAttempts', 0);
          
          // ユーザー情報を安全に保存
          const userInfo = {
            username: email,
            loginTime: new Date().toISOString()
          };
          this.secureStorage.setSessionItem('userInfo', userInfo);
          this.safeLog('ユーザー情報を保存', { loginTime: userInfo.loginTime });
          
          // トークン自動更新を設定
          this.setupTokenRefresh();
          
          resolve(result);
        },
        onFailure: (err) => {
          this.safeLog('ログイン失敗', { message: err.message });
          reject(err);
        }
      });
    });
  },
  
  // サインアップ処理
  signUp: async function(email, password) {
    if (window.debugLog) debugLog(`Auth.signUp 呼び出し: ${email}`);
    
    if (!this.userPool) {
      if (window.debugLog) debugLog('ユーザープールが未初期化、初期化を実行');
      await this.initPool();
    }
    
    // パスワードの強度をチェック
    if (!this.validatePassword(password)) {
      throw new Error('パスワードは8文字以上で、大文字、小文字、数字を含む必要があります');
    }
    
    return new Promise((resolve, reject) => {
      this.userPool.signUp(
        email,
        password,
        [new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email })],
        null,
        (err, result) => {
          if (err) {
            if (window.debugLog) debugLog(`サインアップ失敗: ${err.message}`);
            reject(err);
            return;
          }
          if (window.debugLog) debugLog('サインアップ成功');
          resolve(result);
        }
      );
    });
  },
  
  // パスワードの強度を検証
  validatePassword: function(password) {
    // 最低8文字、大文字、小文字、数字を含む
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
  },
  
  // ログアウト処理
  signOut: async function() {
    if (window.debugLog) debugLog('Auth.signOut 呼び出し');
    
    // トークン更新タイマーをクリア
    if (this.refreshTokenInterval) {
      clearInterval(this.refreshTokenInterval);
      this.refreshTokenInterval = null;
    }
    
    if (!this.userPool) {
      if (window.debugLog) debugLog('ユーザープールが未初期化、初期化を実行');
      await this.initPool();
    }
    
    const user = this.userPool.getCurrentUser();
    if (user) {
      if (window.debugLog) debugLog('ユーザーをログアウト');
      user.signOut();
      
      // セキュアストレージをクリア
      this.secureStorage.clearAll();
      
      // CSRF対策: ページをリロード
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      if (window.debugLog) debugLog('ログアウト対象のユーザーが存在しない');
    }
  },
  
  // 検証メソッドを追加
  confirmSignUp: async function(email, code) {
    if (window.debugLog) debugLog(`Auth.confirmSignUp 呼び出し: ${email}`);
    
    if (!this.userPool) {
      if (window.debugLog) debugLog('ユーザープールが未初期化、初期化を実行');
      await this.initPool();
    }
    
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: this.userPool
      };
      
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
      
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          if (window.debugLog) debugLog(`サインアップ確認失敗: ${err.message}`);
          reject(err);
          return;
        }
        if (window.debugLog) debugLog('サインアップ確認成功');
        resolve(result);
      });
    });
  },

  // 検証コードの再送信
  resendConfirmationCode: async function(email) {
    if (window.debugLog) debugLog(`Auth.resendConfirmationCode 呼び出し: ${email}`);
    
    if (!this.userPool) {
      if (window.debugLog) debugLog('ユーザープールが未初期化、初期化を実行');
      await this.initPool();
    }
    
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: this.userPool
      };
      
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
      
      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          if (window.debugLog) debugLog(`確認コード再送信失敗: ${err.message}`);
          reject(err);
          return;
        }
        if (window.debugLog) debugLog('確認コード再送信成功');
        resolve(result);
      });
    });
  }
};

// ページ読み込み時に認証を初期化
document.addEventListener('DOMContentLoaded', () => {
  if (window.debugLog) debugLog('DOMContentLoaded イベント発生、認証初期化');
  Auth.initPool().catch(err => {
    if (window.debugLog) debugLog(`認証初期化失敗: ${err.message}`);
    console.error('Failed to initialize authentication:', err);
  });
});

if (window.debugLog) debugLog('auth-secure.js 読み込み完了');
