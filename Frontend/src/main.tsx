import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, message } from 'antd';
import App from './App.tsx';
import 'antd/dist/reset.css'; // ⚠️ dùng reset.css thay vì antd.css
import './index.css';

message.config({
  top: 80, // khoảng cách từ trên xuống
  duration: 3,
  getContainer: () => document.body,
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff', // màu chủ đạo
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
);
