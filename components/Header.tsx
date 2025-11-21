
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm p-4 border-b border-slate-700 shadow-lg text-center sticky top-0 z-10">
      <h1 className="text-3xl font-bold text-amber-400 tracking-wider">গল্পের আসর</h1>
      <p className="text-slate-400 text-sm">আপনার ব্যক্তিগত গল্পকার, ইন্টারনেট থেকে গল্প খুঁজে আনতে সক্ষম</p>
    </header>
  );
};

export default Header;