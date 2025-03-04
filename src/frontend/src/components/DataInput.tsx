import React, { useState } from 'react';

interface FormData {
  interests: string[];
  primaryGoal: string;
  location: string;
  profession: string;
  communicationStyle: string;
  dailyAvailability: string[];
  fitnessLevel: string;
  learningStyle: string[];
  age: string;
}

interface FormErrors {
  interests?: string;
  primaryGoal?: string;
  location?: string;
  profession?: string;
  communicationStyle?: string;
  dailyAvailability?: string;
  fitnessLevel?: string;
  learningStyle?: string;
  age?: string;
}

const DataInput: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    interests: [],
    primaryGoal: '',
    location: '',
    profession: '',
    communicationStyle: '',
    dailyAvailability: [],
    fitnessLevel: '',
    learningStyle: [],
    age: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate interests
    if (formData.interests.length === 0) {
      newErrors.interests = 'Please select at least one interest';
      isValid = false;
    }

    // Validate primary goal
    if (!formData.primaryGoal) {
      newErrors.primaryGoal = 'Please select a primary goal';
      isValid = false;
    }

    // Validate location
    if (!formData.location.trim()) {
      newErrors.location = 'Please enter your location';
      isValid = false;
    }

    // Validate profession
    if (!formData.profession) {
      newErrors.profession = 'Please select your profession';
      isValid = false;
    }

    // Validate communication style
    if (!formData.communicationStyle) {
      newErrors.communicationStyle = 'Please select your communication style';
      isValid = false;
    }

    // Validate daily availability
    if (formData.dailyAvailability.length === 0) {
      newErrors.dailyAvailability = 'Please select at least one time slot';
      isValid = false;
    }

    // Validate fitness level
    if (!formData.fitnessLevel) {
      newErrors.fitnessLevel = 'Please select your fitness level';
      isValid = false;
    }

    // Validate learning style
    if (formData.learningStyle.length === 0) {
      newErrors.learningStyle = 'Please select at least one learning style';
      isValid = false;
    }

    // Validate age
    const ageNum = parseInt(formData.age);
    if (!formData.age) {
      newErrors.age = 'Please enter your age';
      isValid = false;
    } else if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
      newErrors.age = 'Please enter a valid age between 13 and 100';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({});

    try {
      const response = await fetch('/volunteered-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'onboarding',
          value: JSON.stringify(formData)
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();
      setSubmitStatus({
        success: true,
        message: 'Form submitted successfully!'
      });
      
      // Reset form
      setFormData({
        interests: [],
        primaryGoal: '',
        location: '',
        profession: '',
        communicationStyle: '',
        dailyAvailability: [],
        fitnessLevel: '',
        learningStyle: [],
        age: ''
      });
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: 'Failed to submit form. Please try again.'
      });
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field] as string[]), value]
        : (prev[field] as string[]).filter(item => item !== value)
    }));
    // Clear error when user makes a selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user makes a selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="data-input-container">
      <h2>Onboarding Data Input</h2>
      {submitStatus.message && (
        <div className={`submit-status ${submitStatus.success ? 'success' : 'error'}`}>
          {submitStatus.message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Interests - Checkboxes */}
        <div className="form-group">
          <label>Interests</label>
          <div className="checkbox-group">
            {['Sports', 'Music', 'Art', 'Technology', 'Science', 'Literature'].map(interest => (
              <label key={interest}>
                <input
                  type="checkbox"
                  checked={formData.interests.includes(interest)}
                  onChange={(e) => handleCheckboxChange('interests', interest, e.target.checked)}
                />
                {interest}
              </label>
            ))}
          </div>
          {errors.interests && <div className="error-message">{errors.interests}</div>}
        </div>

        {/* Primary Goal - Dropdown */}
        <div className="form-group">
          <label>Primary Goal</label>
          <select
            value={formData.primaryGoal}
            onChange={(e) => handleInputChange('primaryGoal', e.target.value)}
            aria-label="Primary Goal"
          >
            <option value="">Select a goal</option>
            <option value="fitness">Fitness</option>
            <option value="career">Career Growth</option>
            <option value="education">Education</option>
            <option value="personal">Personal Development</option>
          </select>
          {errors.primaryGoal && <div className="error-message">{errors.primaryGoal}</div>}
        </div>

        {/* Location - Text Input */}
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Enter your location"
          />
          {errors.location && <div className="error-message">{errors.location}</div>}
        </div>

        {/* Profession - Dropdown */}
        <div className="form-group">
          <label>Profession</label>
          <select
            value={formData.profession}
            onChange={(e) => handleInputChange('profession', e.target.value)}
            aria-label="Profession"
          >
            <option value="">Select your profession</option>
            <option value="tech">Technology</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="business">Business</option>
          </select>
          {errors.profession && <div className="error-message">{errors.profession}</div>}
        </div>

        {/* Communication Style - Radio Buttons */}
        <div className="form-group">
          <label>Communication Style</label>
          <div className="radio-group">
            {['Direct', 'Diplomatic', 'Casual', 'Formal'].map(style => (
              <label key={style}>
                <input
                  type="radio"
                  name="communicationStyle"
                  value={style}
                  checked={formData.communicationStyle === style}
                  onChange={(e) => handleInputChange('communicationStyle', e.target.value)}
                />
                {style}
              </label>
            ))}
          </div>
          {errors.communicationStyle && <div className="error-message">{errors.communicationStyle}</div>}
        </div>

        {/* Daily Availability - Checkboxes */}
        <div className="form-group">
          <label>Daily Availability</label>
          <div className="checkbox-group">
            {['Morning', 'Afternoon', 'Evening', 'Night'].map(time => (
              <label key={time}>
                <input
                  type="checkbox"
                  checked={formData.dailyAvailability.includes(time)}
                  onChange={(e) => handleCheckboxChange('dailyAvailability', time, e.target.checked)}
                />
                {time}
              </label>
            ))}
          </div>
          {errors.dailyAvailability && <div className="error-message">{errors.dailyAvailability}</div>}
        </div>

        {/* Fitness Level - Dropdown */}
        <div className="form-group">
          <label>Fitness Level</label>
          <select
            value={formData.fitnessLevel}
            onChange={(e) => handleInputChange('fitnessLevel', e.target.value)}
            aria-label="Fitness Level"
          >
            <option value="">Select fitness level</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          {errors.fitnessLevel && <div className="error-message">{errors.fitnessLevel}</div>}
        </div>

        {/* Learning Style - Checkboxes */}
        <div className="form-group">
          <label>Learning Style</label>
          <div className="checkbox-group">
            {['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'].map(style => (
              <label key={style}>
                <input
                  type="checkbox"
                  checked={formData.learningStyle.includes(style)}
                  onChange={(e) => handleCheckboxChange('learningStyle', style, e.target.checked)}
                />
                {style}
              </label>
            ))}
          </div>
          {errors.learningStyle && <div className="error-message">{errors.learningStyle}</div>}
        </div>

        {/* Age - Text Input */}
        <div className="form-group">
          <label>Age</label>
          <input
            type="number"
            min="13"
            max="100"
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            placeholder="Enter your age"
          />
          {errors.age && <div className="error-message">{errors.age}</div>}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default DataInput; 