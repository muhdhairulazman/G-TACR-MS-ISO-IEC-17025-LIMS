/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LIMSProvider, useLIMS } from './context/LIMSContext';
import { Header } from './components/layout/Header';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { FinanceView } from './components/finance/FinanceView';
import { RegistrationView } from './components/registration/RegistrationView';
import { AnalysisView } from './components/analysis/AnalysisView';
import { TechnicalReviewView } from './components/review/TechnicalReviewView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { CertificateModal } from './components/coa/CertificateModal';
import { Sample } from './types/lims';

function MainAppContent() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedCoaSample, setSelectedCoaSample] = useState<Sample | null>(null);

  const handleOpenCOA = (sample: Sample) => {
    setSelectedCoaSample(sample);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Header */}
      <Header onNavigateTab={tab => setCurrentTab(tab)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-(--breakpoint-2xl) mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar 
          currentTab={currentTab} 
          onTabChange={tab => setCurrentTab(tab)} 
        />

        {/* Viewport Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardView 
              onNavigateTab={tab => setCurrentTab(tab)}
              onSelectSampleForCOA={handleOpenCOA}
            />
          )}

          {currentTab === 'finance' && (
            <FinanceView />
          )}

          {currentTab === 'registration' && (
            <RegistrationView />
          )}

          {currentTab === 'analysis' && (
            <AnalysisView />
          )}

          {currentTab === 'review' && (
            <TechnicalReviewView 
              onSelectSampleForCOA={handleOpenCOA}
            />
          )}

          {currentTab === 'audit' && (
            <AuditTrailView />
          )}
        </main>
      </div>

      {/* Certificate of Analysis Preview Modal */}
      <CertificateModal
        sample={selectedCoaSample}
        onClose={() => setSelectedCoaSample(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LIMSProvider>
      <MainAppContent />
    </LIMSProvider>
  );
}
