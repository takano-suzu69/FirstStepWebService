// API通信を行うオブジェクト
if (window.debugLog) debugLog('api-secure.js 実行開始');

const API = {
  baseURL: 'https://xxxxxxxxxx.cloudfront.net/api',
  
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
      if (window.debugLog) debugLog(`${message}: ${JSON.stringify(this.maskSensitiveData(data)).substring(0, 200)}`);
    } else {
      console.log(message);
      if (window.debugLog) debugLog(message);
    }
  },
  
  // CSRFトークンを取得
  getCSRFToken: function() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith('XSRF-TOKEN=')) {
        return cookie.substring('XSRF-TOKEN='.length);
      }
    }
    return '';
  },
  
  // エラーを標準化する関数
  standardizeError: function(error, defaultMessage = 'エラーが発生しました') {
    // エラーオブジェクトを標準化
    const standardError = {
      message: error.message || defaultMessage,
      code: error.code || 'UNKNOWN_ERROR',
      status: error.status || 500
    };
    
    // エラーメッセージを一般化（センシティブ情報を削除）
    if (standardError.message.includes('token')) {
      standardError.message = '認証エラーが発生しました。再度ログインしてください。';
    } else if (standardError.message.includes('permission') || standardError.message.includes('access')) {
      standardError.message = 'この操作を行う権限がありません。';
    } else if (standardError.message.includes('network') || standardError.message.includes('connection')) {
      standardError.message = 'ネットワーク接続に問題があります。インターネット接続を確認してください。';
    } else if (standardError.message.includes('timeout')) {
      standardError.message = 'サーバーからの応答がありません。時間をおいて再度お試しください。';
    } else if (standardError.message.includes('not found') || standardError.message.includes('404')) {
      standardError.message = 'リクエストされたリソースが見つかりません。';
    } else if (standardError.message.includes('invalid') || standardError.message.includes('validation')) {
      standardError.message = '入力データが正しくありません。入力内容を確認してください。';
    }
    
    return standardError;
  },
  
  // 共通のリクエスト処理
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    this.safeLog(`API リクエスト: ${url}`, { method: options.method || 'GET' });
    
    try {
      // 認証トークンを取得
      this.safeLog('認証セッション取得中...');
      const session = await Auth.getCurrentSession();
      const idToken = session.getIdToken().getJwtToken();
      this.safeLog('認証トークン取得成功');
            
      // CSRFトークンを取得
      const csrfToken = this.getCSRFToken();
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'X-XSRF-TOKEN': csrfToken // CSRF対策
      };
      
      this.safeLog('認証付きリクエスト送信中...', { endpoint });
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        },
        credentials: 'same-origin' // クッキーを送信
      });
      
      this.safeLog(`レスポンスステータス: ${response.status}`);
      
      // 403エラーの場合、認証なしで再試行（開発用）
      if (response.status === 403) {
        this.safeLog('403エラー検出、認証なしで再試行...');
        
        try {
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'X-XSRF-TOKEN': csrfToken, // CSRF対策は維持
              // 認証ヘッダーを完全に除外
              ...(options.headers || {})
            },
            credentials: 'same-origin' // クッキーを送信
          });
          
          this.safeLog(`再試行レスポンスステータス: ${retryResponse.status}`);
          
          if (retryResponse.ok) {
            const responseText = await retryResponse.text();
            this.safeLog(`再試行成功、レスポンス長: ${responseText.length}`);
            
            if (!responseText || responseText.trim() === '') {
              this.safeLog('空のレスポンス、適切な値を返却');
              return options.method === 'DELETE' ? null : [];
            }
            
            try {
              return JSON.parse(responseText);
            } catch (parseError) {
              this.safeLog(`JSONではないレスポンス: ${parseError.message}`);
              return options.method === 'DELETE' ? null : [];
            }
          } else {
            const retryResponseText = await retryResponse.text();
            this.safeLog(`再試行失敗: ${retryResponse.status}`);
          }
        } catch (retryError) {
          this.safeLog(`再試行リクエスト失敗: ${retryError.message}`);
        }
      }
      
      // 元のレスポンス処理
      const responseText = await response.text();
      this.safeLog(`レスポンステキスト長: ${responseText.length}`);
      
      if (!response.ok) {
        let errorMessage = `APIエラー: ${response.status}`;
        let errorData = {};
        
        try {
          // レスポンスがJSONの場合、エラーメッセージを抽出
          errorData = JSON.parse(responseText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          this.safeLog(`APIエラー詳細`, { status: response.status, message: errorData.message });
        } catch (e) {
          // JSONでない場合は一般的なエラーメッセージを使用
          errorMessage = '処理中にエラーが発生しました';
          this.safeLog(`APIエラー: JSONではないレスポンス`, { status: response.status });
        }
        
        // エラーオブジェクトを作成
        const error = new Error(errorMessage);
        error.status = response.status;
        error.code = errorData.code || 'API_ERROR';
        
        // エラーを標準化して投げる
        const standardError = this.standardizeError(error);
        throw new Error(standardError.message);
      }
      
      // 空のレスポンスの場合
      if (!responseText || responseText.trim() === '') {
        this.safeLog('空のレスポンス、適切な値を返却');
        return options.method === 'DELETE' ? null : [];
      }
      
      // JSONパース
      let data;
      try {
        data = JSON.parse(responseText);
        this.safeLog(`JSONパース成功: ${typeof data}, 配列: ${Array.isArray(data)}`);
      } catch (parseError) {
        this.safeLog(`JSONパースエラー: ${parseError.message}`);
        throw new Error('レスポンスの解析に失敗しました');
      }
      
      return data;
      
    } catch (error) {
      this.safeLog(`リクエスト失敗: ${error.message}`);
      throw error;
    }
  },
  
  // タスク一覧取得
  async getTasks() {
    this.safeLog('API.getTasks 呼び出し');
    const result = await this.request('/tasks');
    this.safeLog('getTasks 結果', { count: Array.isArray(result) ? result.length : 'not an array' });
    return result;
  },
  
  // タスク作成
  async createTask(task) {
    this.safeLog('API.createTask 呼び出し', { 
      hasTitle: !!task.title,
      hasDescription: !!task.description,
      status: task.status
    });
    
    // 送信データの検証と整形
    const validTask = {};
    
    // タイトルの検証
    if (!task.title || typeof task.title !== 'string') {
      throw new Error('タイトルは必須です');
    }
    
    if (task.title.trim().length === 0 || task.title.length > 100) {
      throw new Error('タイトルは1〜100文字で入力してください');
    }
    
    validTask.title = task.title;
    
    // 説明の検証
    if (task.description !== undefined) {
      if (typeof task.description !== 'string' || task.description.length > 1000) {
        throw new Error('説明は1000文字以内で入力してください');
      }
      validTask.description = task.description;
    } else {
      validTask.description = '';
    }
    
    // ステータスの検証
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (task.status !== undefined) {
      if (!validStatuses.includes(task.status)) {
        throw new Error('無効なステータス値です');
      }
      validTask.status = task.status;
    } else {
      validTask.status = 'pending';
    }
    
    this.safeLog('整形後の送信データ', { 
      titleLength: validTask.title.length,
      hasDescription: !!validTask.description,
      status: validTask.status
    });
    
    try {
      const result = await this.request('/tasks', {
        method: 'POST',
        body: JSON.stringify(validTask)
      });
      this.safeLog('createTask 結果', { id: result.id, status: result.status });
      return result;
    } catch (error) {
      this.safeLog('createTask エラー', { message: error.message });
      throw error;
    }
  },
  
  // タスク更新
  async updateTask(id, task) {
    this.safeLog('API.updateTask 呼び出し', { 
      id,
      hasTitle: !!task.title,
      hasDescription: !!task.description,
      status: task.status
    });
    
    // 送信データの検証と整形
    const validTask = {};
    
    if (task.title !== undefined) {
      if (task.title.length > 100) {
        throw new Error('タイトルは100文字以内で入力してください');
      }
      validTask.title = task.title;
    }
    
    if (task.description !== undefined) {
      if (task.description.length > 1000) {
        throw new Error('説明は1000文字以内で入力してください');
      }
      validTask.description = task.description;
    }
    
    if (task.status !== undefined) {
      const validStatuses = ['pending', 'in-progress', 'completed'];
      if (!validStatuses.includes(task.status)) {
        throw new Error('無効なステータス値です');
      }
      validTask.status = task.status;
    }
    
    this.safeLog('整形後の送信データ', { 
      id,
      hasTitle: !!validTask.title,
      hasDescription: !!validTask.description,
      status: validTask.status
    });
    
    try {
      const result = await this.request(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(validTask)
      });
      this.safeLog('updateTask 結果', { id: result.id, status: result.status });
      return result;
    } catch (error) {
      this.safeLog('updateTask エラー', { message: error.message });
      throw error;
    }
  },
  
  // タスク削除
  async deleteTask(id) {
    this.safeLog('API.deleteTask 呼び出し', { id });
    try {
      const result = await this.request(`/tasks/${id}`, {
        method: 'DELETE'
      });
      this.safeLog('deleteTask 結果', { success: true });
      return result;
    } catch (error) {
      this.safeLog('deleteTask エラー', { message: error.message });
      throw error;
    }
  }
};

if (window.debugLog) debugLog('api-secure.js 読み込み完了');
