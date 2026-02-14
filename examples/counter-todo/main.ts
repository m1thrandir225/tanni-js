import App from './App.tanni';

const app = document.getElementById('app');
if (!app) {
  throw new Error('Missing #app mount element.');
}

app.append(App());
