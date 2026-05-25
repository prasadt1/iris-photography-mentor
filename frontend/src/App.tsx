import { useCallback, useEffect, useState } from 'react';
import { Sparkles, Target, Upload } from 'lucide-react';
import { AppSidebar } from './components/AppSidebar';
import { AssignmentStrip } from './components/AssignmentStrip';
import { BottomNav } from './components/BottomNav';
import { FieldTab } from './components/FieldTab';
import { HomeTab } from './components/HomeTab';
import { MemoryTab } from './components/MemoryTab';
import { MentorTab } from './components/MentorTab';
import { OnboardingScreen } from './components/OnboardingScreen';
import { PracticeTab } from './components/PracticeTab';
import { PrintSalesTab } from './components/PrintSalesTab';
import { SettingsTab } from './components/SettingsTab';
import { TriageTab } from './components/TriageTab';
import { ActivePracticeBanner } from './components/studio/ActivePracticeBanner';
import PhotoUploader from './components/studio/PhotoUploader';
import StudioAnalysisResults from './components/studio/StudioAnalysisResults';
import type { AppTab } from './config/navConfig';
import { isAppTab, setTabHash, tabFromHash } from './config/navConfig';
import { clearMentorSession } from './services/mentorClient';
import { analyzePhoto } from './services/agentClient';
import { fetchActiveAssignment } from './services/practiceClient';
import { fetchUserProfile, personaToUserMode, updatePersona } from './services/userClient';
import { isOnboardingComplete, setOnboardingComplete } from './lib/onboarding';
import { mapAnalysisResult } from './lib/mapAnalysisResult';
import type { AnalysisResult } from './types';
import type { Assignment, UserMode } from './types/practice';

function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingComplete());
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState('photo.jpg');
  const [userMode, setUserMode] = useState<UserMode>('hobbyist');
  const [personaError, setPersonaError] = useState<string | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);

  const navigate = useCallback((tab: AppTab) => {
    if (tab === 'print' && userMode !== 'working_pro') {
      setActiveTab('home');
      setTabHash('home');
      return;
    }
    setActiveTab(tab);
    setTabHash(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [userMode]);

  const refreshActiveAssignment = useCallback(async () => {
    try {
      setActiveAssignment(await fetchActiveAssignment());
    } catch {
      setActiveAssignment(null);
    }
  }, []);

  useEffect(() => {
    const hashTab = tabFromHash();
    if (hashTab && isAppTab(hashTab)) {
      setActiveTab(hashTab);
    }
    void fetchUserProfile()
      .then((p) => setUserMode(personaToUserMode(p.persona)))
      .catch(() => {});
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    void refreshActiveAssignment();
  }, [activeTab, ready, refreshActiveAssignment]);

  useEffect(() => {
    if (userMode !== 'working_pro' && activeTab === 'print') {
      navigate('home');
    }
  }, [userMode, activeTab, navigate]);

  const handleImageSelected = async (file: File, previewUrl: string) => {
    setAnalyzing(true);
    setResult(null);
    setImageUrl(previewUrl);
    setFilename(file.name);

    try {
      setResult(
        await analyzePhoto({
          imageFile: file,
          assignmentId: activeAssignment?.id,
        }),
      );
      void refreshActiveAssignment();
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. See console for details.');
      URL.revokeObjectURL(previewUrl);
      setImageUrl(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetStudio = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setResult(null);
    setImageUrl(null);
    setFilename('photo.jpg');
  };

  const handleOnboardingComplete = (mode: UserMode) => {
    setOnboardingComplete();
    setShowOnboarding(false);
    setUserMode(mode);
    navigate('home');
  };

  const persistPersona = async (mode: UserMode) => {
    setPersonaError(null);
    await updatePersona(mode);
    clearMentorSession();
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-500 text-sm">
        Loading…
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={handleOnboardingComplete}
        onPersist={persistPersona}
      />
    );
  }

  const showAssignmentStrip =
    activeAssignment &&
    activeTab !== 'field' &&
    activeTab !== 'practice';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-brand-500/30 flex">
      <AppSidebar activeTab={activeTab} mode={userMode} onNavigate={navigate} />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 pb-20 lg:pb-0">
        {showAssignmentStrip && activeAssignment && (
          <AssignmentStrip
            assignment={activeAssignment}
            onShootNow={() => navigate('field')}
            onPractice={() => navigate('practice')}
          />
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-10">
          {personaError && activeTab === 'settings' && (
            <p className="mb-4 text-sm text-amber-400" role="alert">
              Could not save your profile mode ({personaError}).
            </p>
          )}

          {activeTab === 'home' && (
            <HomeTab
              mode={userMode}
              activeAssignment={activeAssignment}
              onNavigate={navigate}
              onOpenSettings={() => navigate('settings')}
            />
          )}

          {activeTab === 'studio' && (
            <div className="animate-fadeIn">
              {!result && (
                <div className="flex flex-col items-center space-y-8">
                  {activeAssignment && (
                    <ActivePracticeBanner assignment={activeAssignment} />
                  )}
                  <div className="text-center max-w-2xl space-y-6">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
                        Critique a photo
                      </h1>
                      <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                        Upload once for honest scores, Glass Box reasoning you can read, and
                        practice ideas tied to your real work.
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4 text-left">
                      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                        <Upload className="w-5 h-5 text-brand-400 mb-2" aria-hidden />
                        <p className="text-sm font-semibold text-white">1. Upload</p>
                        <p className="text-xs text-slate-500 mt-1">Any shot from camera or files</p>
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                        <Sparkles className="w-5 h-5 text-brand-400 mb-2" aria-hidden />
                        <p className="text-sm font-semibold text-white">2. Get critique</p>
                        <p className="text-xs text-slate-500 mt-1">Scores plus why they matter</p>
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                        <Target className="w-5 h-5 text-brand-400 mb-2" aria-hidden />
                        <p className="text-sm font-semibold text-white">3. Practice</p>
                        <p className="text-xs text-slate-500 mt-1">Assignments from your weak spots</p>
                      </div>
                    </div>
                  </div>
                  <PhotoUploader onImageSelected={handleImageSelected} isAnalyzing={analyzing} />
                </div>
              )}
              {result && imageUrl && (
                <StudioAnalysisResults
                  analysis={mapAnalysisResult(result)}
                  imageSrc={imageUrl}
                  originalFilename={filename}
                  onReset={() => {
                    resetStudio();
                    navigate('home');
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'practice' && (
            <PracticeTab
              mode={userMode}
              onGoToStudio={() => navigate('studio')}
              onGoToField={() => navigate('field')}
              onAssignmentsChange={refreshActiveAssignment}
            />
          )}
          {activeTab === 'memory' && <MemoryTab />}
          {activeTab === 'mentor' && <MentorTab mode={userMode} />}
          {activeTab === 'triage' && (
            <TriageTab mode={userMode} onGoToMemory={() => navigate('memory')} />
          )}
          {activeTab === 'print' && userMode === 'working_pro' && (
            <PrintSalesTab mode={userMode} onGoToMentor={() => navigate('mentor')} />
          )}
          {activeTab === 'field' && (
            <FieldTab
              assignment={activeAssignment}
              onCaptureAnalyzed={refreshActiveAssignment}
              onGoToPractice={() => navigate('practice')}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              mode={userMode}
              onModeChange={setUserMode}
              onPersistPersona={persistPersona}
              onPersistError={setPersonaError}
              onRestartOnboarding={() => {
                setShowOnboarding(true);
                navigate('home');
              }}
            />
          )}
        </main>

        <footer className="hidden lg:block border-t border-slate-800 py-6 text-center text-xs text-slate-500 px-4 mb-0">
          <p>Practice Companion — your photos stay in your private library.</p>
        </footer>
      </div>

      <BottomNav activeTab={activeTab} mode={userMode} onNavigate={navigate} />
    </div>
  );
}

export default App;
