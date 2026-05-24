import { useState } from 'react'
import './App.css'
import { ModeToggle } from './components/ModeToggle'
import { PracticeTab } from './components/PracticeTab'
import { MemoryTab } from './components/MemoryTab'
import { PhotoUploader } from './components/PhotoUploader'
import { AnalysisResults } from './components/AnalysisResults'
import { analyzePhoto } from './services/agentClient'
import type { AnalysisResult } from './types'

type Tab = 'studio' | 'practice' | 'memory' | 'field';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('studio');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handlePhotoUpload = async (file: File) => {
    setAnalyzing(true);
    setResult(null);

    try {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      // Call agent (mock in Phase 1, real Agent Engine in Phase 2)
      const analysisResult = await analyzePhoto({ imageFile: file });

      setResult(analysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. See console for details.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1>Practice Companion</h1>
          <p style={{ color: '#666', fontSize: '1.1em' }}>
            AI Photography Mentor with Persistent Memory
          </p>
          <p style={{ fontSize: '0.9em', color: '#999' }}>
            Phase 1 Scaffold - Frontend structure verified
          </p>
        </header>

        <ModeToggle />

        <nav style={{ display: 'flex', gap: '10px', marginTop: '20px', borderBottom: '2px solid #eee' }}>
          {(['studio', 'practice', 'memory', 'field'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #646cff' : 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </nav>

        <main style={{ marginTop: '30px' }}>
          {activeTab === 'studio' && (
            <div style={{ padding: '20px' }}>
              <h2>Studio Mode</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Upload a photo for AI critique. Phase 1 uses mock data; Agent Engine integration in Phase 2.
              </p>

              <PhotoUploader onUpload={handlePhotoUpload} loading={analyzing} />

              {result && imageUrl && (
                <div style={{ marginTop: '30px' }}>
                  <AnalysisResults result={result} imageUrl={imageUrl} />

                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        setResult(null);
                        setImageUrl(null);
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#646cff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1em',
                      }}
                    >
                      Upload Another Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'practice' && <PracticeTab />}
          {activeTab === 'memory' && <MemoryTab />}
          {activeTab === 'field' && (
            <div style={{ padding: '20px' }}>
              <h2>Field Mode</h2>
              <p><strong>Phase 1 Stub</strong> - Will include:</p>
              <ul>
                <li>Live camera capture (ported from gemma4)</li>
                <li>Voice coaching (ported from gemma4)</li>
                <li>Real-time feedback during shoots</li>
              </ul>
              <p>Components will be ported from source repos in Phase 1.3</p>
            </div>
          )}
        </main>

        <footer style={{ marginTop: '50px', textAlign: 'center', color: '#999', fontSize: '0.8em' }}>
          <p>
            Built with Google Cloud (Gemini 3 Pro, Agent Engine, Vertex AI) + MongoDB Atlas
          </p>
          <p>
            Google Cloud Rapid Agent Hackathon - MongoDB Track
          </p>
        </footer>
      </div>
    </>
  )
}

export default App
