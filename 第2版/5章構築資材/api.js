// API呼び出し処理
const API = {
  // 認証トークンの取得
  getToken: async () => {
    try {
      const session = await Auth.getCurrentSession();
      return session.getIdToken().getJwtToken();
    } catch (error) {
      console.error('トークン取得エラー:', error);
      return null;
    }
  },
  
  // APIリクエスト共通処理
  request: async (path, method = 'GET', body = null) => {
    const token = await API.getToken();
    
    if (!token) {
      throw new Error('認証が必要です');
    }
    
    const options = {
      method,
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${config.apiUrl}${path}`, options);
    
    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status}`);
    }
    
    // 204 No Contentの場合は空オブジェクトを返す
    if (response.status === 204) {
      return {};
    }
    
    return await response.json();
  },
  
  // タスク一覧取得
  getTasks: () => API.request('/api/tasks'),
  
  // タスク詳細取得
  getTask: (id) => API.request(`/api/tasks/${id}`),
  
  // タスク作成
  createTask: (task) => API.request('/api/tasks', 'POST', task),
  
  // タスク更新
  updateTask: (id, task) => API.request(`/api/tasks/${id}`, 'PUT', task),
  
  // タスク削除
  deleteTask: (id) => API.request(`/api/tasks/${id}`, 'DELETE')
};
