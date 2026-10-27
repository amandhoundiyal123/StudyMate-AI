import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  BookOpen,
  Sparkles,
  AlertCircle,
  FileCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { uploadNotes } from '../services/api';
import { UploadNotesResponse } from '../types';

interface UploadScreenProps {
  onSessionStarted: (sessionData: UploadNotesResponse) => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onSessionStarted }) => {
  const [topic, setTopic] = useState('');
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Please choose a valid PDF (.pdf) file.');
        return;
      }
      setSelectedFile(file);
      if (!topic) {
        const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
        setTopic(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeTab === 'upload' && !selectedFile) {
      setErrorMessage('Please select a PDF document to upload.');
      return;
    }

    if (activeTab === 'paste' && (!pastedText.trim() || wordCount < 15)) {
      setErrorMessage('Please paste at least 15 words of study material.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await uploadNotes(
        activeTab === 'upload' ? selectedFile : null,
        activeTab === 'paste' ? pastedText : '',
        topic || 'Study Session'
      );
      onSessionStarted(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process notes. Please check the document format.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-semibold text-indigo-700 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>CTRL + KNOWLEDGE &bull; Gemma 4 Syllabus Assistant</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          StudyMate AI
        </h1>
        <p className="mt-2 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Upload your lecture notes or PDF textbooks. Ask questions strictly grounded in your
          syllabus with verified page citations, or test yourself with customizable quizzes.
        </p>

        {/* Core Principles */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Real Page Numbers & Sources
          </span>
          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Strict Anti-Hallucination & Out-of-Syllabus Guard
          </span>
          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Fast Search & Retrieval
          </span>
        </div>
      </div>

      {/* Main Upload Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'paste'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste Study Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload PDF Document
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Topic Input */}
          <div>
            <label htmlFor="topic-input" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Subject or Topic Name
            </label>
            <input
              id="topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Molecular Biology, Calculus II, World History"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
              required
            />
          </div>

          {/* Tab 1: Paste Notes */}
          {activeTab === 'paste' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="notes-textarea" className="block text-sm font-semibold text-slate-800">
                  Study Material & Notes Content
                </label>
                <span className="text-xs text-slate-500 font-medium">
                  {wordCount} words {wordCount < 15 && <span className="text-amber-600">(min 15 required)</span>}
                </span>
              </div>
              <textarea
                id="notes-textarea"
                rows={11}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your study notes, lecture summaries, or textbook excerpts here..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono leading-relaxed"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Text is segmented into searchable passages tagged with simulated page numbers for honest citations.
              </p>
            </div>
          )}

          {/* Tab 2: Upload PDF */}
          {activeTab === 'upload' && (
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Upload PDF Document (PyMuPDF Page Extraction)
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? 'border-indigo-400 bg-indigo-50/30'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <FileCheck className="w-10 h-10 text-indigo-600 mb-2" />
                    <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to choose another file
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">
                      Click to choose a PDF or drag and drop here
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Text-based PDF documents are supported with exact page preservation
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-red-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-base shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Notes & Extracting Pages...</span>
                </>
              ) : (
                <>
                  <span>Start Study Session</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
