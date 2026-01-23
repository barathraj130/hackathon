'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

export default function CandidateDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [testStatus, setTestStatus] = useState(null);
  const [socket, setSocket] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    problemStatement: '',
    solution: '',
    existingSystem: '',
    architectureText: '',
    useCase: '',
    technologies: { frontend: [], backend: [], database: [], ai_ml: [] },
    teamDetails: { teamName: '', members: [] }
  });
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchProfile();
    fetchTestStatus();
    loadSavedSubmission();

    // Setup WebSocket
    const newSocket = io(WS_URL);
    newSocket.emit('join', { token, role: 'CANDIDATE' });
    
    newSocket.on('timer_update', (data) => {
      setTimeRemaining(data.remainingSeconds);
    });

    newSocket.on('test_paused', () => {
      alert('Test has been paused by admin');
    });

    newSocket.on('test_resumed', () => {
      alert('Test has been resumed');
    });

    newSocket.on('test_ended', (data) => {
      if (data.forceSubmit) {
        handleSubmit(true);
      }
    });

    setSocket(newSocket);

    // Auto-save every 30 seconds
    const autoSaveInterval = setInterval(() => {
      if (testStatus?.is_active && !testStatus?.is_paused) {
        saveProgress(true);
      }
    }, 30000);

    return () => {
      newSocket.close();
      clearInterval(autoSaveInterval);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/candidate/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchTestStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/candidate/test-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestStatus(response.data);
      setTimeRemaining(response.data.remaining_seconds || 0);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch test status:', error);
      setLoading(false);
    }
  };

  const loadSavedSubmission = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/candidate/submission`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.exists && response.data.content) {
        setFormData(response.data.content);
        setLastSaved(response.data.updatedAt);
      }
    } catch (error) {
      console.error('Failed to load submission:', error);
    }
  };

  const saveProgress = async (isAutoSave = false) => {
    if (!isAutoSave) setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/candidate/submission`,
        { ...formData, isDraft: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setLastSaved(response.data.last_saved);
        if (!isAutoSave) alert('Progress saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
      if (!isAutoSave) alert('Failed to save progress');
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !confirm('Are you sure you want to submit? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // First save the final content
      const saveResponse = await axios.post(
        `${API_URL}/candidate/submission`,
        { ...formData, isDraft: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (saveResponse.data.success) {
        // Then submit
        const submitResponse = await axios.post(
          `${API_URL}/candidate/submission/${saveResponse.data.submission_id}/submit`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (submitResponse.data.success) {
          alert('Submission successful! Your PPT will be generated shortly.');
          router.push('/candidate/status');
        }
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert(error.response?.data?.error || 'Submission failed. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold gradient-text">Candidate Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {profile?.name}</p>
            </div>

            {/* Timer */}
            {testStatus?.is_active && (
              <div className="glass-card px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600">Time Remaining:</span>
                  <span className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                  {testStatus?.is_paused && (
                    <span className="badge badge-warning">PAUSED</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {lastSaved && (
                <div className="text-sm text-gray-600">
                  Last saved: {new Date(lastSaved).toLocaleTimeString()}
                </div>
              )}
              <button onClick={handleLogout} className="btn-danger">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container-custom py-8">
        {!testStatus?.is_active ? (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-3xl font-bold mb-4">Test Not Active</h2>
            <p className="text-gray-600 mb-6">
              The test hasn't started yet. Please wait for the admin to start the test.
            </p>
            <div className="text-sm text-gray-500">
              {testStatus?.start_time && (
                <p>Scheduled start: {new Date(testStatus.start_time).toLocaleString()}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card p-8">
            <h2 className="text-3xl font-bold gradient-text mb-2">Create Your Presentation</h2>
            <p className="text-gray-600 mb-8">Fill in the details below. Your progress is auto-saved every 30 seconds.</p>

            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              {/* 1. Title Slide Inputs */}
              <div className="border-b pb-6">
                <h3 className="text-xl font-semibold mb-4 text-blue-600">Slide 1: Title Info</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">PPT Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input-field"
                      placeholder="My Awesome Project"
                      required
                      disabled={testStatus?.is_paused}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Abstract / Summary *</label>
                    <input
                      type="text"
                      value={formData.abstract}
                      onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                      className="input-field"
                      placeholder="One line summary of your idea"
                      required
                      disabled={testStatus?.is_paused}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Problem Statement */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-blue-600">Slide 2: Problem Statement</h3>
                <label className="block text-sm text-gray-500 mb-2">Describe the core problem you are solving.</label>
                <textarea
                  value={formData.problemStatement}
                  onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                  className="input-field h-32"
                  placeholder="The current healthcare system lacks..."
                  required
                  disabled={testStatus?.is_paused}
                />
              </div>

              {/* 3. Existing System */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-blue-600">Slide 3: Existing System</h3>
                <label className="block text-sm text-gray-500 mb-2">What exists now and why is it insufficient?</label>
                <textarea
                  value={formData.existingSystem || ''} // Handle new field
                  onChange={(e) => setFormData({ ...formData, existingSystem: e.target.value })}
                  className="input-field h-32"
                  placeholder="Current solutions are manual and error-prone because..."
                  required
                  disabled={testStatus?.is_paused}
                />
              </div>

              {/* 4. Proposed Solution */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-blue-600">Slide 4: Proposed Solution</h3>
                <label className="block text-sm text-gray-500 mb-2">Describe your innovative solution.</label>
                <textarea
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  className="input-field h-40"
                  placeholder="We propose an AI-driven system that..."
                  required
                  disabled={testStatus?.is_paused}
                />
              </div>

              {/* 5. System Architecture */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-blue-600">Slide 5: System Architecture</h3>
                <label className="block text-sm text-gray-500 mb-2">Describe the flow (e.g., User to Frontend to API to DB).</label>
                <textarea
                  value={formData.architectureText || ''} // Handle new field
                  onChange={(e) => setFormData({ ...formData, architectureText: e.target.value })}
                  className="input-field h-32"
                  placeholder="User uploads image to Model processes it to Results displayed..."
                  required
                  disabled={testStatus?.is_paused}
                />
              </div>

              {/* 6. Technology Stack */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-blue-600">Slide 6: Technology Stack</h3>
                <label className="block text-sm text-gray-500 mb-4">List the technologies used.</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Frontend (React, etc.)"
                    value={formData.technologies.frontend.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      technologies: {
                        ...formData.technologies,
                        frontend: e.target.value.split(',').map(t => t.trim())
                      }
                    })}
                    className="input-field"
                    disabled={testStatus?.is_paused}
                  />
                  <input
                    type="text"
                    placeholder="Backend (Node, Python)"
                    value={formData.technologies.backend.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      technologies: {
                        ...formData.technologies,
                        backend: e.target.value.split(',').map(t => t.trim())
                      }
                    })}
                    className="input-field"
                    disabled={testStatus?.is_paused}
                  />
                  <input
                    type="text"
                    placeholder="Database (SQL, Mongo)"
                    value={formData.technologies.database.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      technologies: {
                        ...formData.technologies,
                        database: e.target.value.split(',').map(t => t.trim())
                      }
                    })}
                    className="input-field"
                    disabled={testStatus?.is_paused}
                  />
                  <input
                    type="text"
                    placeholder="AI/ML"
                    value={formData.technologies.ai_ml.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      technologies: {
                        ...formData.technologies,
                        ai_ml: e.target.value.split(',').map(t => t.trim())
                      }
                    })}
                    className="input-field"
                    disabled={testStatus?.is_paused}
                  />
                </div>
              </div>

              {/* 7. Conclusion/Use Case */}
              <div>
                <h3 className="text-xl font-semibold mb-2 text-blue-600">Slide 7: Conclusion & Impact</h3>
                <label className="block text-sm text-gray-500 mb-2">Future scope and societal impact.</label>
                <textarea
                  value={formData.useCase || ''} // Handle new field
                  onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                  className="input-field h-32"
                  placeholder="This solution will help reduce..."
                  required
                  disabled={testStatus?.is_paused}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t font-medium">
                <button
                  type="button"
                  onClick={() => saveProgress(false)}
                  disabled={saving || testStatus?.is_paused}
                  className="btn-secondary flex-1"
                >
                  {saving ? 'Saving...' : '💾 Save Progress'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={testStatus?.is_paused}
                  className="btn-success flex-1"
                >
                  ✅ Submit Final PPT
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
