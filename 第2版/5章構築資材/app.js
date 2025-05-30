// Reactコンポーネント
function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [tasks, setTasks] = React.useState([]);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [newTask, setNewTask] = React.useState({ title: '', description: '', status: 'pending' });
  
  // 認証状態の確認
  React.useEffect(() => {
    checkAuthState();
  }, []);
  
  // 認証状態を確認
  const checkAuthState = async () => {
    try {
      await Auth.getCurrentSession();
      setIsAuthenticated(true);
      loadTasks();
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // タスク一覧を読み込み
  const loadTasks = async () => {
    try {
      const tasksData = await API.getTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('タスク取得エラー:', error);
    }
  };
  
  // ログイン処理
  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await Auth.signIn(email, password);
      setIsAuthenticated(true);
      loadTasks();
    } catch (error) {
      alert('ログインエラー: ' + error.message);
    }
  };
  
  // サインアップ処理
  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await Auth.signUp(email, password);
      alert('確認メールを送信しました。メールを確認してアカウントを有効化してください。');
    } catch (error) {
      alert('サインアップエラー: ' + error.message);
    }
  };
  
  // ログアウト処理
  const handleSignOut = () => {
    Auth.signOut();
    setIsAuthenticated(false);
  };
  
  // タスク作成処理
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await API.createTask(newTask);
      setNewTask({ title: '', description: '', status: 'pending' });
      loadTasks();
    } catch (error) {
      alert('タスク作成エラー: ' + error.message);
    }
  };
  
  // タスク削除処理
  const handleDeleteTask = async (id) => {
    try {
      await API.deleteTask(id);
      loadTasks();
    } catch (error) {
      alert('タスク削除エラー: ' + error.message);
    }
  };
  
  // タスク状態更新処理
  const handleStatusChange = async (id, status) => {
    try {
      const task = tasks.find(t => t.id === id);
      await API.updateTask(id, { ...task, status });
      loadTasks();
    } catch (error) {
      alert('タスク更新エラー: ' + error.message);
    }
  };
  
  // ローディング中
  if (isLoading) {
    return <div className="loading">読み込み中...</div>;
  }
  
  // 未認証時のログイン画面
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <h1>タスク管理アプリ</h1>
        <form className="auth-form" onSubmit={handleSignIn}>
          <h2>ログイン</h2>
          <div className="form-group">
            <label>メールアドレス</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>パスワード</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="form-buttons">
            <button type="submit">ログイン</button>
            <button type="button" onClick={handleSignUp}>新規登録</button>
          </div>
        </form>
      </div>
    );
  }
  
  // 認証済みのタスク管理画面
  return (
    <div className="app-container">
      <header>
        <h1>タスク管理アプリ</h1>
        <button onClick={handleSignOut}>ログアウト</button>
      </header>
      
      <div className="task-form-container">
        <h2>新しいタスク</h2>
        <form onSubmit={handleCreateTask}>
          <div className="form-group">
            <label>タイトル</label>
            <input 
              type="text" 
              value={newTask.title} 
              onChange={(e) => setNewTask({...newTask, title: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>説明</label>
            <textarea 
              value={newTask.description} 
              onChange={(e) => setNewTask({...newTask, description: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group">
            <label>ステータス</label>
            <select 
              value={newTask.status} 
              onChange={(e) => setNewTask({...newTask, status: e.target.value})}
            >
              <option value="pending">未着手</option>
              <option value="in-progress">進行中</option>
              <option value="completed">完了</option>
            </select>
          </div>
          <button type="submit">タスクを追加</button>
        </form>
      </div>
      
      <div className="tasks-container">
        <h2>タスク一覧</h2>
        {tasks.length === 0 ? (
          <p>タスクがありません</p>
        ) : (
          <ul className="task-list">
            {tasks.map(task => (
              <li key={task.id} className={`task-item ${task.status}`}>
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <div className="task-actions">
                    <select 
                      value={task.status} 
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    >
                      <option value="pending">未着手</option>
                      <option value="in-progress">進行中</option>
                      <option value="completed">完了</option>
                    </select>
                    <button onClick={() => handleDeleteTask(task.id)}>削除</button>
                  </div>
                </div>
                <p>{task.description}</p>
                <div className="task-meta">
                  <span>作成日: {new Date(task.createdAt).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// アプリケーションのレンダリング
ReactDOM.render(<App />, document.getElementById('root'));
