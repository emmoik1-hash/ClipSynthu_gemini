
import React from 'react';
import Header from './components/Header';
import UploadPage from './components/UploadPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <UploadPage />
      </main>
    </div>
  );
};

export default App;
