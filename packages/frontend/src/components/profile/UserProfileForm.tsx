import React, { useState } from 'react';
import { z } from 'zod';
import type { UserProfile, ExperienceLevel } from '../../types';

interface UserProfileFormProps {
  onSubmit: (profile: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>) => void;
  initialProfile?: UserProfile;
  isLoading?: boolean;
}

// Common programming languages and frameworks
const POPULAR_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust',
  'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala',
  'Dart', 'Elixir', 'Haskell', 'Perl', 'R', 'Shell', 'SQL'
];

const POPULAR_FRAMEWORKS = [
  'React', 'Vue', 'Angular', 'Next.js', 'Express', 'Django',
  'Flask', 'Spring', 'Rails', 'Laravel', 'ASP.NET', 'FastAPI',
  'Svelte', 'Nuxt', 'Nest.js', 'Gin', 'Fiber', 'Phoenix'
];

const profileSchema = z.object({
  languages: z.array(z.string()).min(1, 'Select at least one language'),
  frameworks: z.array(z.string()),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  interests: z.array(z.string()).min(1, 'Add at least one interest'),
});

const UserProfileForm: React.FC<UserProfileFormProps> = ({
  onSubmit,
  initialProfile,
  isLoading = false,
}) => {
  const [step, setStep] = useState(1);
  const [languages, setLanguages] = useState<string[]>(initialProfile?.languages || []);
  const [frameworks, setFrameworks] = useState<string[]>(initialProfile?.frameworks || []);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    initialProfile?.experienceLevel || 'beginner'
  );
  const [interests, setInterests] = useState<string[]>(initialProfile?.interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Autocomplete states
  const [languageSearch, setLanguageSearch] = useState('');
  const [frameworkSearch, setFrameworkSearch] = useState('');
  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);
  const [showFrameworkSuggestions, setShowFrameworkSuggestions] = useState(false);

  const totalSteps = 4;

  const toggleItem = (item: string, list: string[], setter: (list: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const addCustomLanguage = () => {
    const trimmed = languageSearch.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed]);
      setLanguageSearch('');
      setShowLanguageSuggestions(false);
    }
  };

  const addCustomFramework = () => {
    const trimmed = frameworkSearch.trim();
    if (trimmed && !frameworks.includes(trimmed)) {
      setFrameworks([...frameworks, trimmed]);
      setFrameworkSearch('');
      setShowFrameworkSuggestions(false);
    }
  };

  const filteredLanguages = POPULAR_LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(languageSearch.toLowerCase()) &&
    !languages.includes(lang)
  );

  const filteredFrameworks = POPULAR_FRAMEWORKS.filter(fw =>
    fw.toLowerCase().includes(frameworkSearch.toLowerCase()) &&
    !frameworks.includes(fw)
  );

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowLanguageSuggestions(false);
      setShowFrameworkSuggestions(false);
    };
    
    if (showLanguageSuggestions || showFrameworkSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showLanguageSuggestions, showFrameworkSuggestions]);

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1 && languages.length === 0) {
      newErrors.languages = 'Select at least one language';
    }
    if (currentStep === 4 && interests.length === 0) {
      newErrors.interests = 'Add at least one interest';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (languages.length === 0) {
      setErrors({ languages: 'Select at least one language' });
      setStep(1);
      return;
    }

    if (interests.length === 0) {
      setErrors({ interests: 'Add at least one interest' });
      return;
    }

    try {
      profileSchema.parse({
        languages,
        frameworks,
        experienceLevel,
        interests,
      });

      setErrors({});
      onSubmit({
        languages,
        frameworks,
        experienceLevel,
        interests,
      } as any);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          newErrors[error.path[0]] = error.message;
        });
        setErrors(newErrors);
        console.error('Validation errors:', newErrors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 mx-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 text-center">
          Step {step} of {totalSteps}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 min-h-[400px]">
        {/* Step 1: Languages */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Programming Languages
            </h2>
            <p className="text-gray-600 mb-4">
              Select or type to add languages you're comfortable with
            </p>

            {/* Search/Add Input */}
            <div className="mb-4 relative">
              <input
                type="text"
                value={languageSearch}
                onChange={(e) => {
                  setLanguageSearch(e.target.value);
                  setShowLanguageSuggestions(true);
                }}
                onFocus={() => setShowLanguageSuggestions(true)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomLanguage();
                  }
                }}
                placeholder="Search or type a language..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Suggestions Dropdown */}
              {showLanguageSuggestions && languageSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredLanguages.length > 0 ? (
                    filteredLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          toggleItem(lang, languages, setLanguages);
                          setLanguageSearch('');
                          setShowLanguageSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                      >
                        {lang}
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={addCustomLanguage}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600"
                    >
                      + Add "{languageSearch}"
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Selected Languages */}
            {languages.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2 text-sm"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => toggleItem(lang, languages, setLanguages)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Popular Languages Grid */}
            <p className="text-sm text-gray-600 mb-2">Popular languages:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {POPULAR_LANGUAGES.slice(0, 12).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleItem(lang, languages, setLanguages)}
                  disabled={languages.includes(lang)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                    languages.includes(lang)
                      ? 'border-blue-600 bg-blue-50 text-blue-700 opacity-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {errors.languages && (
              <p className="mt-4 text-sm text-red-600 animate-slide-down">
                {errors.languages}
              </p>
            )}
          </div>
        )}

        {/* Step 2: Frameworks */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Frameworks & Libraries
            </h2>
            <p className="text-gray-600 mb-4">
              Select or type to add frameworks (optional)
            </p>

            {/* Search/Add Input */}
            <div className="mb-4 relative">
              <input
                type="text"
                value={frameworkSearch}
                onChange={(e) => {
                  setFrameworkSearch(e.target.value);
                  setShowFrameworkSuggestions(true);
                }}
                onFocus={() => setShowFrameworkSuggestions(true)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomFramework();
                  }
                }}
                placeholder="Search or type a framework..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Suggestions Dropdown */}
              {showFrameworkSuggestions && frameworkSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredFrameworks.length > 0 ? (
                    filteredFrameworks.map((fw) => (
                      <button
                        key={fw}
                        type="button"
                        onClick={() => {
                          toggleItem(fw, frameworks, setFrameworks);
                          setFrameworkSearch('');
                          setShowFrameworkSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                      >
                        {fw}
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={addCustomFramework}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600"
                    >
                      + Add "{frameworkSearch}"
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Selected Frameworks */}
            {frameworks.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {frameworks.map((fw) => (
                  <span
                    key={fw}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2 text-sm"
                  >
                    {fw}
                    <button
                      type="button"
                      onClick={() => toggleItem(fw, frameworks, setFrameworks)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Popular Frameworks Grid */}
            <p className="text-sm text-gray-600 mb-2">Popular frameworks:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {POPULAR_FRAMEWORKS.slice(0, 12).map((fw) => (
                <button
                  key={fw}
                  type="button"
                  onClick={() => toggleItem(fw, frameworks, setFrameworks)}
                  disabled={frameworks.includes(fw)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                    frameworks.includes(fw)
                      ? 'border-blue-600 bg-blue-50 text-blue-700 opacity-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  {fw}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Experience Level */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Experience Level
            </h2>
            <p className="text-gray-600 mb-6">
              How would you describe your coding experience?
            </p>

            <div className="space-y-4">
              {[
                {
                  level: 'beginner' as ExperienceLevel,
                  title: 'Beginner',
                  description: 'Learning the basics, new to open source',
                  icon: '🌱',
                },
                {
                  level: 'intermediate' as ExperienceLevel,
                  title: 'Intermediate',
                  description: 'Comfortable with coding, some project experience',
                  icon: '🚀',
                },
                {
                  level: 'advanced' as ExperienceLevel,
                  title: 'Advanced',
                  description: 'Experienced developer, ready for complex challenges',
                  icon: '⚡',
                },
              ].map((option) => (
                <button
                  key={option.level}
                  type="button"
                  onClick={() => setExperienceLevel(option.level)}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    experienceLevel === option.level
                      ? 'border-blue-600 bg-blue-50 scale-105'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{option.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Interests */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Interests
            </h2>
            <p className="text-gray-600 mb-6">
              What topics or domains interest you?
            </p>

            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  placeholder="e.g., web development, machine learning"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[100px]">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2 animate-scale-in"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {errors.interests && (
              <p className="mt-4 text-sm text-red-600 animate-slide-down">
                {errors.interests}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1 || isLoading}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            step === 1 || isLoading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Back
        </button>

        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-lg'
            } text-white flex items-center gap-2`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        )}
      </div>
    </form>
  );
};

export default UserProfileForm;
