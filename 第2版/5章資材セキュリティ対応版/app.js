// JSXを使わないバージョン - Babel処理なしで動作確認
if (window.debugLog) debugLog('=== APP.JS 読み込み開始 ===');
console.log('=== APP.JS 読み込み開始 ===');

// TaskItemコンポーネント
function TaskItem(props) {
  if (window.debugLog) debugLog(`TaskItem レンダリング: ${props.task.id}`);
  console.log('TaskItem rendering:', props.task);

  // HTMLエスケープ関数
  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const handleDeleteClick = () => {
    if (window.debugLog) debugLog(`削除ボタンクリック: ${props.task.id}`);
    console.log('Delete button clicked for task:', props.task.id);
    if (window.confirm('このタスクを削除しますか？')) {
      props.onDelete(props.task.id);
    }
  };

  const handleUpdateClick = () => {
    if (window.debugLog) debugLog(`更新ボタンクリック: ${props.task.id}`);
    console.log('Update button clicked for task:', props.task.id);
    const newTitle = prompt('新しいタイトル:', props.task.title);
    const newDescription = prompt('新しい詳細:', props.task.description);
    const newStatus = prompt('新しいステータス (pending/in-progress/completed):', props.task.status);
    
    const updatedTask = { ...props.task };
    let hasChanges = false;
    
    if (newTitle && newTitle !== props.task.title) {
      updatedTask.title = newTitle;
      hasChanges = true;
    }
    if (newDescription && newDescription !== props.task.description) {
      updatedTask.description = newDescription;
      hasChanges = true;
    }
    if (newStatus && ['pending', 'in-progress', 'completed'].includes(newStatus) && newStatus !== props.task.status) {
      updatedTask.status = newStatus;
      hasChanges = true;
    }
    
    if (hasChanges) {
      props.onUpdate(props.task.id, updatedTask);
    }
  };

  // エスケープされたテキストを使用
  const safeTitle = escapeHtml(props.task.title);
  const safeDescription = escapeHtml(props.task.description);
  const safeStatus = escapeHtml(props.task.status);

  return React.createElement('div', 
    { 
      className: 'task-item', 
      style: {border: '1px solid #ccc', margin: '10px', padding: '10px'} 
    },
    React.createElement('h3', null, safeTitle),
    React.createElement('p', null, safeDescription),
    React.createElement('p', null, 'ステータス: ' + safeStatus),
    React.createElement('p', null, '作成日: ' + new Date(props.task.createdAt).toLocaleString()),
    React.createElement('div', null,
      React.createElement('button', 
        { 
          onClick: handleUpdateClick,
          style: {marginRight: '10px'}
        }, 
        '編集'
      ),
      React.createElement('button', 
        { 
          onClick: handleDeleteClick,
          style: {backgroundColor: '#ff4444', color: 'white'}
        }, 
        '削除'
      )
    )
  );
}

// ログインフォームコンポーネント
function LoginForm(props) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState('');
  const [awaitingVerification, setAwaitingVerification] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (window.debugLog) debugLog(`ログインフォーム送信: ${email}, モード: ${awaitingVerification ? '検証' : isSignUp ? 'サインアップ' : 'ログイン'}`);
      
      if (awaitingVerification) {
        // 検証コード確認
        if (window.debugLog) debugLog(`検証コード確認: ${email}, コード: ${verificationCode}`);
        await Auth.confirmSignUp(email, verificationCode);
        if (window.debugLog) debugLog('アカウント認証完了');
        alert('アカウント認証が完了しました。ログインしてください。');
        setAwaitingVerification(false);
        setIsSignUp(false);
        setVerificationCode('');
      } else if (isSignUp) {
        // サインアップ
        if (window.debugLog) debugLog(`サインアップ: ${email}`);
        await Auth.signUp(email, password);
        if (window.debugLog) debugLog('サインアップ成功、検証待ち');
        setAwaitingVerification(true);
        alert('確認メールを送信しました。メール内の認証コードを入力してください。');
      } else {
        // ログイン
        if (window.debugLog) debugLog(`ログイン: ${email}`);
        const result = await Auth.signIn(email, password);
        if (window.debugLog) debugLog('ログイン成功');
        console.log('Login successful:', result);
        props.onLogin();
      }
    } catch (error) {
      if (window.debugLog) debugLog(`認証エラー: ${error.message}`);
      console.error('Auth error:', error);
      setError(error.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', 
    { style: {maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px'} },
    React.createElement('h2', null, 'タスク管理アプリ'),
    error && React.createElement('div', 
      { style: {color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#fee', borderRadius: '4px'} },
      error
    ),
    React.createElement('form', { onSubmit: handleSubmit },
      !awaitingVerification && React.createElement('div', null,
        React.createElement('div', { style: {marginBottom: '15px'} },
          React.createElement('label', null, 'メールアドレス:'),
          React.createElement('input', {
            type: 'email',
            value: email,
            onChange: (e) => setEmail(e.target.value),
            required: true,
            style: {width: '100%', padding: '8px', marginTop: '5px'}
          })
        ),
        React.createElement('div', { style: {marginBottom: '15px'} },
          React.createElement('label', null, 'パスワード:'),
          React.createElement('input', {
            type: 'password',
            value: password,
            onChange: (e) => setPassword(e.target.value),
            required: true,
            style: {width: '100%', padding: '8px', marginTop: '5px'}
          })
        )
      ),
      awaitingVerification && React.createElement('div', { style: {marginBottom: '15px'} },
        React.createElement('label', null, '認証コード:'),
        React.createElement('input', {
          type: 'text',
          value: verificationCode,
          onChange: (e) => setVerificationCode(e.target.value),
          required: true,
          style: {width: '100%', padding: '8px', marginTop: '5px'},
          placeholder: 'メールで受信した6桁のコード'
        })
      ),
      React.createElement('button', 
        {
          type: 'submit',
          disabled: loading,
          style: {
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }
        },
        loading ? '処理中...' : 
        awaitingVerification ? '認証' :
        isSignUp ? 'サインアップ' : 'ログイン'
      )
    ),
    !awaitingVerification && React.createElement('div', { style: {textAlign: 'center', marginTop: '15px'} },
      React.createElement('button', {
        type: 'button',
        onClick: () => setIsSignUp(!isSignUp),
        style: {
          background: 'none',
          border: 'none',
          color: '#007bff',
          textDecoration: 'underline',
          cursor: 'pointer'
        }
      }, isSignUp ? 'ログインはこちら' : 'アカウント作成はこちら')
    ),
    awaitingVerification && React.createElement('div', { style: {textAlign: 'center', marginTop: '15px'} },
      React.createElement('button', {
        type: 'button',
        onClick: async () => {
          try {
            if (window.debugLog) debugLog(`認証コード再送信: ${email}`);
            await Auth.resendConfirmationCode(email);
            if (window.debugLog) debugLog('認証コード再送信成功');
            alert('認証コードを再送信しました。');
          } catch (error) {
            if (window.debugLog) debugLog(`認証コード再送信失敗: ${error.message}`);
            setError('再送信に失敗しました: ' + error.message);
          }
        },
        style: {
          background: 'none',
          border: 'none',
          color: '#007bff',
          textDecoration: 'underline',
          cursor: 'pointer'
        }
      }, '認証コードを再送信')
    )
  );
}

// Appコンポーネント
function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [tasks, setTasks] = React.useState([]);
  const [showNewTaskForm, setShowNewTaskForm] = React.useState(false);
  const [newTask, setNewTask] = React.useState({ title: '', description: '', status: 'pending' });
  const [error, setError] = React.useState(null);

  if (window.debugLog) debugLog('App コンポーネントレンダリング');
  console.log('App component rendering');

  // エラーメッセージを標準化する関数
  const standardizeErrorMessage = (error) => {
    // エラーメッセージを一般化（センシティブ情報を削除）
    const message = error.message || 'エラーが発生しました';
    
    if (message.includes('token') || message.includes('認証')) {
      return '認証エラーが発生しました。再度ログインしてください。';
    } else if (message.includes('permission') || message.includes('権限')) {
      return 'この操作を行う権限がありません。';
    } else if (message.includes('network') || message.includes('接続')) {
      return 'ネットワーク接続に問題があります。インターネット接続を確認してください。';
    } else if (message.includes('timeout') || message.includes('タイムアウト')) {
      return 'サーバーからの応答がありません。時間をおいて再度お試しください。';
    } else if (message.includes('not found') || message.includes('見つかりません')) {
      return 'リクエストされたリソースが見つかりません。';
    } else if (message.includes('invalid') || message.includes('入力')) {
      return '入力データが正しくありません。入力内容を確認してください。';
    }
    
    // 詳細なエラーメッセージを一般的なものに置き換え
    if (message.includes('API') || message.includes('server')) {
      return 'サーバーとの通信中にエラーが発生しました。時間をおいて再度お試しください。';
    }
    
    return message;
  };
  
  // 認証状態をチェック
  const checkAuthState = async () => {
    try {
      if (window.debugLog) debugLog('認証状態チェック中...');
      console.log('Checking authentication state...');
      
      // セッションを取得
      const session = await Auth.getCurrentSession();
      
      // トークンの有効性を検証
      const isValid = await Auth.validateToken();
      if (!isValid) {
        if (window.debugLog) debugLog('トークンが無効です');
        throw new Error('トークンが無効です');
      }
      
      if (window.debugLog) debugLog('ユーザーは認証済み');
      console.log('User is authenticated');
      setIsAuthenticated(true);
      setError(null);
      
      // 定期的な認証状態チェックを設定（5分ごと）
      setTimeout(checkAuthState, 5 * 60 * 1000);
    } catch (error) {
      if (window.debugLog) debugLog(`ユーザーは未認証: ${error.message}`);
      console.log('User is not authenticated:', error.message);
      setIsAuthenticated(false);
      
      // 認証エラーは通常のフローなので、エラー表示はしない
      if (error.message !== 'ユーザーがログインしていません') {
        // エラーメッセージを標準化
        const standardizedMessage = standardizeErrorMessage(error);
        setError(`認証エラー: ${standardizedMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ログイン成功時の処理
  const handleLogin = () => {
    if (window.debugLog) debugLog('ログイン成功、状態更新');
    console.log('Login successful, updating state');
    setIsAuthenticated(true);
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      if (window.debugLog) debugLog('ログアウト処理開始');
      await Auth.signOut();
      setIsAuthenticated(false);
      setTasks([]);
      if (window.debugLog) debugLog('ログアウト成功');
      console.log('Logout successful');
    } catch (error) {
      if (window.debugLog) debugLog(`ログアウトエラー: ${error.message}`);
      console.error('Logout error:', error);
      setError(`ログアウトエラー: ${error.message}`);
    }
  };

  // タスク一覧を読み込み
  const loadTasks = async () => {
    try {
      if (window.debugLog) debugLog('タスク読み込み中...');
      console.log('Loading tasks...');
      const tasksData = await API.getTasks();
      if (window.debugLog) debugLog(`タスクデータ取得: ${JSON.stringify(tasksData)}`);
      console.log('Raw tasks data:', tasksData);
      
      if (Array.isArray(tasksData)) {
        setTasks(tasksData);
        if (window.debugLog) debugLog(`タスク設定成功: ${tasksData.length}件`);
        console.log('Tasks set successfully:', tasksData.length, 'items');
      } else {
        if (window.debugLog) debugLog(`タスクデータが配列ではない: ${typeof tasksData}`);
        console.error('Tasks data is not an array:', tasksData);
        setTasks([]);
      }
    } catch (error) {
      if (window.debugLog) debugLog(`タスク取得エラー: ${error.message}`);
      console.error('タスク取得エラー:', error);
      setTasks([]);
      setError(`タスク取得エラー: ${error.message}`);
    }
  };

  // タスク削除関数
  const handleDeleteTask = async (id) => {
    if (window.debugLog) debugLog('=== DELETE TASK DEBUG ===');
    if (window.debugLog) debugLog(`削除対象タスクID: ${id}`);
    console.log('=== DELETE TASK DEBUG ===');
    console.log('Task ID to delete:', id);
    
    try {
      if (window.debugLog) debugLog('API.deleteTask 呼び出し中...');
      console.log('Calling API.deleteTask...');
      await API.deleteTask(id);
      if (window.debugLog) debugLog('削除API呼び出し完了');
      console.log('Delete API call completed');
      
      // ローカル状態から即座に削除
      setTasks(prevTasks => {
        const newTasks = prevTasks.filter(task => task.id !== id);
        if (window.debugLog) debugLog(`削除後のタスク: ${newTasks.length}件`);
        console.log('New tasks after delete:', newTasks);
        return newTasks;
      });
      
      if (window.debugLog) debugLog('タスク削除完了');
      console.log('Delete task completed successfully');
      
    } catch (error) {
      if (window.debugLog) debugLog(`タスク削除エラー: ${error.message}`);
      console.error('Task delete error:', error);
      // エラーメッセージを標準化
      const standardizedMessage = standardizeErrorMessage(error);
      setError(`タスク削除エラー: ${standardizedMessage}`);
    }
  };

  // タスク更新関数
  const handleUpdateTask = async (id, updatedTask) => {
    if (window.debugLog) debugLog('=== UPDATE TASK DEBUG ===');
    if (window.debugLog) debugLog(`更新対象タスクID: ${id}`);
    if (window.debugLog) debugLog(`更新データ: ${JSON.stringify(updatedTask)}`);
    console.log('=== UPDATE TASK DEBUG ===');
    console.log('Task ID:', id);
    console.log('Updated data:', updatedTask);
    
    // 入力検証
    if (updatedTask.title !== undefined && (updatedTask.title.trim() === '' || updatedTask.title.length > 100)) {
      alert('タイトルは1〜100文字で入力してください');
      return;
    }
    
    if (updatedTask.description !== undefined && updatedTask.description.length > 1000) {
      alert('説明は1000文字以内で入力してください');
      return;
    }
    
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (updatedTask.status !== undefined && !validStatuses.includes(updatedTask.status)) {
      alert('無効なステータス値です');
      return;
    }
    
    try {
      // 送信するデータを明示的に構造化
      const taskToUpdate = {};
      
      if (updatedTask.title !== undefined) {
        taskToUpdate.title = updatedTask.title.trim();
      }
      
      if (updatedTask.description !== undefined) {
        taskToUpdate.description = updatedTask.description;
      }
      
      if (updatedTask.status !== undefined) {
        taskToUpdate.status = updatedTask.status;
      }
      
      if (window.debugLog) debugLog(`送信データ: ${JSON.stringify(taskToUpdate)}`);
      
      if (window.debugLog) debugLog('API.updateTask 呼び出し中...');
      console.log('Calling API.updateTask...');
      const result = await API.updateTask(id, taskToUpdate);
      if (window.debugLog) debugLog(`APIレスポンス: ${JSON.stringify(result)}`);
      console.log('API response:', result);
      
      // ローカル状態を即座に更新
      setTasks(prevTasks => {
        const newTasks = prevTasks.map(task => {
          if (task.id === id) {
            return { ...task, ...updatedTask, updatedAt: new Date().toISOString() };
          }
          return task;
        });
        if (window.debugLog) debugLog(`更新後のタスク: ${newTasks.length}件`);
        console.log('New tasks after update:', newTasks);
        return newTasks;
      });
      
      if (window.debugLog) debugLog('タスク更新完了');
      console.log('Update task completed successfully');
      
    } catch (error) {
      if (window.debugLog) debugLog(`タスク更新エラー: ${error.message}`);
      console.error('Task update error:', error);
      // エラーメッセージを標準化
      const standardizedMessage = standardizeErrorMessage(error);
      setError(`タスク更新エラー: ${standardizedMessage}`);
      alert(`タスク更新エラー: ${standardizedMessage}`);
    }
  };

  // 新規作成関数
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (window.debugLog) debugLog('=== CREATE TASK DEBUG ===');
    console.log('=== CREATE TASK DEBUG ===');
    
    // 入力検証
    if (!newTask.title || newTask.title.trim() === '') {
      alert('タイトルを入力してください');
      return;
    }
    
    if (newTask.title.length > 100) {
      alert('タイトルは100文字以内で入力してください');
      return;
    }
    
    if (newTask.description && newTask.description.length > 1000) {
      alert('説明は1000文字以内で入力してください');
      return;
    }
    
    if (window.debugLog) debugLog(`新規タスクデータ: ${JSON.stringify(newTask)}`);
    console.log('New task data:', newTask);
    
    try {
      if (window.debugLog) debugLog('API.createTask 呼び出し中...');
      console.log('Calling API.createTask...');
      
      // 送信するデータを明示的に構造化
      const taskToCreate = {
        title: newTask.title.trim(),
        description: newTask.description || '',
        status: newTask.status || 'pending'
      };
      
      if (window.debugLog) debugLog(`送信データ: ${JSON.stringify(taskToCreate)}`);
      
      const createdTask = await API.createTask(taskToCreate);
      if (window.debugLog) debugLog(`APIレスポンス: ${JSON.stringify(createdTask)}`);
      console.log('API response:', createdTask);
      
      // ローカル状態に即座に追加
      setTasks(prevTasks => {
        const newTasks = [createdTask, ...prevTasks];
        if (window.debugLog) debugLog(`作成後のタスク: ${newTasks.length}件`);
        console.log('New tasks after create:', newTasks);
        return newTasks;
      });
      
      // フォームリセット
      setNewTask({ title: '', description: '', status: 'pending' });
      setShowNewTaskForm(false);
      
      if (window.debugLog) debugLog('タスク作成完了');
      console.log('Create task completed successfully');
      
    } catch (error) {
      if (window.debugLog) debugLog(`タスク作成エラー: ${error.message}`);
      console.error('Task creation error:', error);
      // エラーメッセージを標準化
      const standardizedMessage = standardizeErrorMessage(error);
      alert(`タスク作成エラー: ${standardizedMessage}`);
    }
  };

  React.useEffect(() => {
    if (window.debugLog) debugLog('App useEffect - 初期化');
    checkAuthState();
  }, []);

  // 認証されたらタスクを読み込み
  React.useEffect(() => {
    if (isAuthenticated) {
      if (window.debugLog) debugLog('認証済み、タスク読み込み開始');
      loadTasks();
    }
  }, [isAuthenticated]);

  if (window.debugLog) debugLog(`App レンダリング - 認証状態: ${isAuthenticated}, 読み込み中: ${isLoading}, タスク数: ${tasks.length}`);
  console.log('App rendering - auth state:', { isAuthenticated, isLoading, tasksCount: tasks.length });

  // ローディング中
  if (isLoading) {
    return React.createElement('div', 
      { style: {textAlign: 'center', padding: '50px'} },
      React.createElement('h2', null, '読み込み中...')
    );
  }

  // エラーがある場合
  if (error) {
    return React.createElement('div', 
      { style: {textAlign: 'center', padding: '50px', color: 'red'} },
      React.createElement('h2', null, 'エラーが発生しました'),
      React.createElement('p', null, error),
      React.createElement('button', 
        { 
          onClick: () => window.location.reload(),
          style: {marginTop: '20px', padding: '10px 20px'}
        }, 
        'ページを再読み込み'
      )
    );
  }

  // 未認証の場合：ログインフォームを表示
  if (!isAuthenticated) {
    return React.createElement(LoginForm, { onLogin: handleLogin });
  }

  // 認証済みの場合：メインアプリを表示
  return React.createElement('div', { className: 'app' },
    React.createElement('div', 
      { 
        className: 'header', 
        style: {display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #ddd'} 
      },
      React.createElement('h1', null, 'タスク管理アプリ'),
      React.createElement('div', null,
        React.createElement('button', 
          { 
            onClick: () => setShowNewTaskForm(!showNewTaskForm),
            style: {marginRight: '10px', padding: '8px 16px'}
          },
          showNewTaskForm ? 'キャンセル' : '新規タスク作成'
        ),
        React.createElement('button', 
          { 
            onClick: handleLogout,
            style: {padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px'}
          },
          'ログアウト'
        )
      )
    ),
    
    // 新規タスク作成フォーム
    showNewTaskForm && React.createElement('div', 
      { 
        className: 'new-task-form',
        style: {border: '1px solid #ddd', padding: '20px', margin: '20px 0'}
      },
      React.createElement('h3', null, '新しいタスク'),
      React.createElement('form', { onSubmit: handleCreateTask },
        React.createElement('div', { style: {marginBottom: '10px'} },
          React.createElement('input', {
            type: 'text',
            placeholder: 'タスクタイトル',
            value: newTask.title,
            onChange: (e) => setNewTask({...newTask, title: e.target.value}),
            required: true,
            style: {width: '100%', padding: '8px'}
          })
        ),
        React.createElement('div', { style: {marginBottom: '10px'} },
          React.createElement('textarea', {
            placeholder: '詳細',
            value: newTask.description,
            onChange: (e) => setNewTask({...newTask, description: e.target.value}),
            style: {width: '100%', padding: '8px', height: '80px'}
          })
        ),
        React.createElement('div', { style: {marginBottom: '10px'} },
          React.createElement('select', {
            value: newTask.status,
            onChange: (e) => setNewTask({...newTask, status: e.target.value}),
            style: {width: '100%', padding: '8px'}
          },
            React.createElement('option', { value: 'pending' }, '未着手'),
            React.createElement('option', { value: 'in-progress' }, '進行中'),
            React.createElement('option', { value: 'completed' }, '完了')
          )
        ),
        React.createElement('button', 
          { type: 'submit', style: {marginRight: '10px', padding: '8px 16px'} },
          '作成'
        ),
        React.createElement('button', 
          { 
            type: 'button', 
            onClick: () => setShowNewTaskForm(false),
            style: {padding: '8px 16px'}
          },
          'キャンセル'
        )
      )
    ),
    
    React.createElement('div', { className: 'tasks-list' },
      React.createElement('h2', null, 'タスク一覧 (' + tasks.length + '件)'),
      tasks.length === 0 ?
        React.createElement('p', null, 'タスクがありません。新規タスクを作成してください。') :
        tasks.map(task => 
          React.createElement(TaskItem, {
            key: task.id,
            task: task,
            onUpdate: handleUpdateTask,
            onDelete: handleDeleteTask
          })
        )
    )
  );
}

if (window.debugLog) debugLog('=== APP.JS 定義完了 ===');
console.log('=== APP.JS 定義完了 ===');

try {
  if (window.debugLog) debugLog('Appコンポーネントのレンダリング開始');
  // ReactDOMが定義されているか確認してからレンダリング
  if (typeof ReactDOM !== 'undefined') {
    ReactDOM.render(React.createElement(App), document.getElementById('root'));
    if (window.debugLog) debugLog('Appコンポーネントのレンダリング成功');
  } else {
    if (window.debugLog) debugLog('ReactDOMが定義されていません');
    console.error('ReactDOM is not defined. Waiting for libraries to load...');
    
    // ReactDOMが読み込まれるまで待機
    const checkReactDOM = setInterval(() => {
      if (typeof ReactDOM !== 'undefined') {
        clearInterval(checkReactDOM);
        if (window.debugLog) debugLog('ReactDOMが読み込まれました、レンダリングを実行');
        ReactDOM.render(React.createElement(App), document.getElementById('root'));
      }
    }, 100);
    
    // 10秒後にタイムアウト
    setTimeout(() => {
      clearInterval(checkReactDOM);
      if (typeof ReactDOM === 'undefined') {
        if (window.debugLog) debugLog('ReactDOMの読み込みがタイムアウトしました');
        console.error('Timeout waiting for ReactDOM to load');
        document.getElementById('root').innerHTML = `
          <div style="text-align: center; padding: 50px; color: red;">
            <h2>ライブラリの読み込みエラー</h2>
            <p>必要なライブラリ（ReactDOM）を読み込めませんでした。</p>
            <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px;">
              ページを再読み込み
            </button>
          </div>
        `;
      }
    }, 10000);
  }
} catch (error) {
  if (window.debugLog) debugLog(`レンダリングエラー: ${error.message}`);
  console.error('Rendering error:', error);
  
  // エラー表示
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="text-align: center; padding: 50px; color: red;">
        <h2>レンダリングエラー</h2>
        <p>${error.message}</p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px;">
          ページを再読み込み
        </button>
      </div>
    `;
  }
}
