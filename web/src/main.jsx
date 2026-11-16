import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles.css';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import CasePage from './pages/CasePage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import HowTo from './pages/HowTo.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminCases from './pages/admin/AdminCases.jsx';
import AdminEditor from './pages/admin/AdminEditor.jsx';
import AdminSubmissions from './pages/admin/AdminSubmissions.jsx';
import Presentation from './pages/admin/Presentation.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/admin/vaka/:id/sunum" element={<Presentation />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="vaka/:no" element={<CasePage />} />
        <Route path="vaka/:no/siralama" element={<LeaderboardPage />} />
        <Route path="nasil-oynanir" element={<HowTo />} />
        <Route path="admin/giris" element={<AdminLogin />} />
        <Route path="admin" element={<AdminCases />} />
        <Route path="admin/vaka/yeni" element={<AdminEditor />} />
        <Route path="admin/vaka/:id" element={<AdminEditor />} />
        <Route path="admin/vaka/:id/cevaplar" element={<AdminSubmissions />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </BrowserRouter>,
);
