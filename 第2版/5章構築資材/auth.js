// 認証関連の処理
const Auth = {
  // Cognitoの設定
  userPool: new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: config.cognito.userPoolId,
    ClientId: config.cognito.clientId
  }),
  
  // 現在のセッション取得
  getCurrentSession: () => {
    return new Promise((resolve, reject) => {
      const user = Auth.userPool.getCurrentUser();
      
      if (!user) {
        reject(new Error('ユーザーがログインしていません'));
        return;
      }
      
      user.getSession((err, session) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(session);
      });
    });
  },
  
  // ログイン処理
  signIn: (email, password) => {
    return new Promise((resolve, reject) => {
      const authData = {
        Username: email,
        Password: password
      };
      
      const authDetails = new AmazonCognitoIdentity.AuthenticationDetails(authData);
      
      const userData = {
        Username: email,
        Pool: Auth.userPool
      };
      
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
      
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        }
      });
    });
  },
  
  // サインアップ処理
  signUp: (email, password) => {
    return new Promise((resolve, reject) => {
      Auth.userPool.signUp(
        email,
        password,
        [new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: email })],
        null,
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(result);
        }
      );
    });
  },
  
  // ログアウト処理
  signOut: () => {
    const user = Auth.userPool.getCurrentUser();
    if (user) {
      user.signOut();
    }
  }
};
