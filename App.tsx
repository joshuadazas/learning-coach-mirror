import React, { useState, useCallback } from 'react';
import type { FormData, SearchSource } from './types';
import { generateLearningDrop } from './services/geminiService';
import { MOCK_WORKFLOW_DATA, LEARNING_PREFERENCES } from './constants';
import Header from './components/Header';
import LearningDropForm from './components/LearningDropForm';
import LearningDropOutput from './components/LearningDropOutput';
import Loader from './components/Loader';

interface LearningDrop {
  message: string;
  sources: SearchSource[];
}

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(MOCK_WORKFLOW_DATA);
  const [learningDrop, setLearningDrop] = useState<LearningDrop | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setLearningDrop(null);
    try {
      const result = await generateLearningDrop(formData);
      setLearningDrop(result);
    } catch (err) {
      setGenerationError('Failed to generate learning drop. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [formData]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const currentPreferences = prev.learning_preferences;
      if (checked) {
        return { ...prev, learning_preferences: [...currentPreferences, value] };
      } else {
        return { ...prev, learning_preferences: currentPreferences.filter(pref => pref !== value) };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerate();
  };

  return (
    <div className="min-h-screen bg-[#23174B] text-[#FFDEE2] font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />

        <main>
           <LearningDropForm
            formData={formData}
            learningPreferences={LEARNING_PREFERENCES}
            onFormChange={handleFormChange}
            onCheckboxChange={handleCheckboxChange}
            onSubmit={handleSubmit}
            isLoading={isGenerating}
          />

          {isGenerating && <Loader />}
          
          {generationError && (
            <div className="mt-8 p-6 bg-[#DE485D]/50 border border-[#DE485D] rounded-lg text-[#FFBDC6]">
              <p className="font-bold">An error occurred:</p>
              <p>{generationError}</p>
            </div>
          )}

          {learningDrop && !isGenerating && (
            <LearningDropOutput 
              message={learningDrop.message} 
              sources={learningDrop.sources}
              onRegenerate={handleGenerate} 
              isGenerating={isGenerating} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
