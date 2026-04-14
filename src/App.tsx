/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminAgents from './pages/AdminAgents';
import AgentDashboard from './pages/AgentDashboard';
import Dialer from './pages/Dialer';
import CallHistory from './pages/CallHistory';
import Settings from './pages/Settings';
import CRMOverview from './pages/CRMOverview';
import AdminTelephony from './pages/AdminTelephony';
import Tasks from './pages/Tasks';
import StudyLibrary from './pages/StudyLibrary';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/crm" element={<CRMOverview />} />
          <Route path="admin/agents" element={<AdminAgents />} />
          <Route path="admin/telephony" element={<AdminTelephony />} />
          <Route path="admin/history" element={<CallHistory />} />
          <Route path="admin/settings" element={<Settings />} />
          
          {/* Agent Routes */}
          <Route path="agent" element={<AgentDashboard />} />
          <Route path="agent/crm" element={<CRMOverview />} />
          <Route path="agent/dialer" element={<Dialer />} />
          <Route path="agent/history" element={<CallHistory />} />
          <Route path="agent/settings" element={<Settings />} />
          <Route path="agent/tasks" element={<Tasks />} />
          <Route path="agent/library" element={<StudyLibrary />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
