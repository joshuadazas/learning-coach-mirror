import React from 'react';
import type { FormData } from '../types';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-[#FFBDC6] mb-1">
      {label}
    </label>
    <input
      id={id}
      {...props}
      className="w-full bg-[#23174B] border border-[#6D2F5A] rounded-md shadow-sm py-2 px-3 text-[#FFDEE2] focus:outline-none focus:ring-2 focus:ring-[#FF5A70] focus:border-[#FF5A70] transition"
    />
  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const TextArea: React.FC<TextAreaProps> = ({ label, id, ...props }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#FFBDC6] mb-1">
        {label}
      </label>
      <textarea
        id={id}
        {...props}
        rows={3}
        className="w-full bg-[#23174B] border border-[#6D2F5A] rounded-md shadow-sm py-2 px-3 text-[#FFDEE2] focus:outline-none focus:ring-2 focus:ring-[#FF5A70] focus:border-[#FF5A70] transition"
      />
    </div>
);

interface LearningDropFormProps {
  formData: FormData;
  learningPreferences: string[];
  pricePreferences: { id: FormData['price_preference'], label: string }[];
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const LearningDropForm: React.FC<LearningDropFormProps> = ({
  formData,
  learningPreferences,
  pricePreferences,
  onFormChange,
  onCheckboxChange,
  onSubmit,
  isLoading,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-8 bg-[#6D2F5A]/50 p-6 sm:p-8 rounded-xl border border-[#6D2F5A]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Name" id="name" name="name" value={formData.name} onChange={onFormChange} required />
        <Input label="Email" id="email" name="email" type="email" value={formData.email} onChange={onFormChange} required />
        <Input label="Area (e.g., Marketing, Engineering)" id="area" name="area" value={formData.area} onChange={onFormChange} />
        <Input label="Country" id="country" name="country" value={formData.country} onChange={onFormChange} required placeholder="e.g., Colombia" />
        <Input label="Current Position" id="current_position" name="current_position" value={formData.current_position} onChange={onFormChange} />
        <Input label="Time in Current Role" id="time_in_current_role" name="time_in_current_role" value={formData.time_in_current_role} onChange={onFormChange} placeholder="e.g., 1 year 3 months" />
        <Input label="Time Available Per Week" id="time_available_per_week" name="time_available_per_week" value={formData.time_available_per_week} onChange={onFormChange} placeholder="e.g., 3-5 hours" />
      </div>

      <div className="space-y-6">
        <TextArea label="Short-Term Goals (6-12 months)" id="short_term_goals" name="short_term_goals" value={formData.short_term_goals} onChange={onFormChange} />
        <TextArea label="Long-Term Goals (1-2 years)" id="long_term_goals" name="long_term_goals" value={formData.long_term_goals} onChange={onFormChange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Hard Skills to Develop (up to 3)" id="hard_skills" name="hard_skills" value={formData.hard_skills} onChange={onFormChange} placeholder="e.g., SQL, Figma, React" />
        <Input label="Soft Skills to Develop (up to 3)" id="soft_skills" name="soft_skills" value={formData.soft_skills} onChange={onFormChange} placeholder="e.g., Public Speaking, Leadership" />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#FFBDC6] mb-2">Learning Preferences</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {learningPreferences.map(pref => (
            <div key={pref} className="flex items-center">
              <input
                id={pref}
                name="learning_preferences"
                type="checkbox"
                value={pref}
                checked={formData.learning_preferences.includes(pref)}
                onChange={onCheckboxChange}
                className="h-4 w-4 rounded border-[#6D2F5A] bg-[#23174B] text-[#FF5A70] focus:ring-[#FF5A70]"
              />
              <label htmlFor={pref} className="ml-2 text-sm text-[#FFDEE2]">{pref}</label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#FFBDC6] mb-2">Price Preference</label>
        <div className="flex items-center space-x-6">
          {pricePreferences.map(pref => (
            <div key={pref.id} className="flex items-center">
              <input
                id={`price_${pref.id}`}
                name="price_preference"
                type="radio"
                value={pref.id}
                checked={formData.price_preference === pref.id}
                onChange={onFormChange}
                className="h-4 w-4 border-[#6D2F5A] bg-[#23174B] text-[#FF5A70] focus:ring-[#FF5A70]"
              />
              <label htmlFor={`price_${pref.id}`} className="ml-2 text-sm text-[#FFDEE2]">{pref.label}</label>
            </div>
          ))}
        </div>
      </div>
      
       <TextArea label="Additional Comments" id="additional_comments" name="additional_comments" value={formData.additional_comments} onChange={onFormChange} />

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-gradient-to-r from-[#DE485D] to-[#FF5A70] hover:from-[#FF5A70] hover:to-[#DE485D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A70] focus:ring-offset-[#23174B] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isLoading ? 'Generating...' : 'Generate My Learning Drop'}
        </button>
      </div>
    </form>
  );
};

export default LearningDropForm;