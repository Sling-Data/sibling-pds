import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useApi } from '../../hooks/useApi';
import { CheckboxOption, RadioOption, SelectOption } from '../../types';
import { StatusMessage } from '../atoms/StatusMessage';
import { Alert } from '../atoms/Alert';
import { Form } from '../molecules/Form';
import '../../styles/pages/DataInput.css';

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
  const navigate = useNavigate();
  const { userId } = useUser();
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

  const { loading: submitLoading, error: submitError, request: submitForm } = useApi<{ message: string }>();

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  // Define options for select and checkbox components
  const interestOptions: CheckboxOption[] = [
    { value: 'Sports', label: 'Sports' },
    { value: 'Music', label: 'Music' },
    { value: 'Art', label: 'Art' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Science', label: 'Science' },
    { value: 'Literature', label: 'Literature' }
  ];

  const primaryGoalOptions: SelectOption[] = [
    { value: '', label: 'Select an option' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'career', label: 'Career Growth' },
    { value: 'education', label: 'Education' },
    { value: 'personal', label: 'Personal Development' }
  ];

  const professionOptions: SelectOption[] = [
    { value: '', label: 'Select an option' },
    { value: 'tech', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'business', label: 'Business' }
  ];

  const communicationStyleOptions: RadioOption[] = [
    { value: 'Direct', label: 'Direct' },
    { value: 'Diplomatic', label: 'Diplomatic' },
    { value: 'Casual', label: 'Casual' },
    { value: 'Formal', label: 'Formal' }
  ];

  const dailyAvailabilityOptions: CheckboxOption[] = [
    { value: 'Morning', label: 'Morning' },
    { value: 'Afternoon', label: 'Afternoon' },
    { value: 'Evening', label: 'Evening' },
    { value: 'Night', label: 'Night' }
  ];

  const fitnessLevelOptions: SelectOption[] = [
    { value: '', label: 'Select an option' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  const learningStyleOptions: CheckboxOption[] = [
    { value: 'Visual', label: 'Visual' },
    { value: 'Auditory', label: 'Auditory' },
    { value: 'Reading/Writing', label: 'Reading/Writing' },
    { value: 'Kinesthetic', label: 'Kinesthetic' }
  ];

  const validateAge = (age: string) => {
    const ageNum = parseInt(age);
    if (!age) {
      return 'Please enter your age';
    } else if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
      return 'Please enter a valid age between 13 and 100';
    }
    return '';
  };

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
    const ageError = validateAge(formData.age);
    if (ageError) {
      newErrors.age = ageError;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission which would append URL parameters
    e.preventDefault();
    
    // Run validation and only proceed if valid
    const isValid = validateForm();
    if (!isValid) {
      return; // Stop here if validation fails, keeping error messages visible
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await submitForm(
        '/volunteered-data',
        {
          method: 'POST',
          body: {
            userId,
            type: 'onboarding',
            value: formData
          }
        }
      );

      if (response.data) {
        setSubmitStatus({ success: true, message: 'Form submitted successfully!' });
        navigate('/profile');
      } else if (response.error) {
        setSubmitStatus({ success: false, message: typeof response.error === 'string' ? response.error : 'Failed to submit form. Please try again.' });
      }
    } catch (error) {
      setSubmitStatus({ 
        success: false, 
        message: 'Failed to submit form. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user makes a selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCheckboxGroupChange = (field: keyof FormData, values: string[]) => {
    setFormData(prev => ({ ...prev, [field]: values }));
    
    // Clear error when user makes a selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Display status message if there's a submission status or error
  const statusMessage = submitStatus.message || (submitError ? (typeof submitError === 'string' ? submitError : 'An error occurred') : '');
  const statusType = submitStatus.success ? 'success' : 'error';

  return (
    <div className="data-input-container">
      <Form
        onSubmit={handleSubmit}
        title="Tell Us About Yourself"
        submitText="Submit"
        isSubmitting={isSubmitting || submitLoading}
        error={null}
      >
        {/* Interests - Checkboxes */}
        <div className="form-group">
          <div className="field-label">Interests{formData.interests.length === 0 && <span className="text-red-500">*</span>}</div>
          <div className="checkbox-grid">
            {interestOptions.map(option => (
              <div key={option.value} className="checkbox-item">
                <input
                  id={`interests-${option.value}`}
                  type="checkbox"
                  name="interests"
                  value={option.value}
                  checked={formData.interests.includes(option.value)}
                  onChange={(e) => {
                    const value = e.target.value;
                    const isChecked = e.target.checked;
                    const newValues = isChecked
                      ? [...formData.interests, value]
                      : formData.interests.filter(v => v !== value);
                    handleCheckboxGroupChange('interests', newValues);
                  }}
                />
                <label htmlFor={`interests-${option.value}`}>{option.label}</label>
              </div>
            ))}
          </div>
          {errors.interests && <Alert type="error" message={errors.interests} variant="inline" />}
        </div>

        {/* Primary Goal - Dropdown */}
        <div className="form-group">
          <label htmlFor="primaryGoal">Primary Goal</label>
          <select
            id="primaryGoal"
            name="primaryGoal"
            value={formData.primaryGoal}
            onChange={(e) => handleInputChange('primaryGoal', e.target.value)}
            className={errors.primaryGoal ? 'error' : ''}
          >
            {primaryGoalOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.primaryGoal && <Alert type="error" message={errors.primaryGoal} variant="inline" />}
        </div>

        {/* Location - Text Input */}
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Enter your location"
            className={errors.location ? 'error' : ''}
          />
          {errors.location && <Alert type="error" message={errors.location} variant="inline" />}
        </div>

        {/* Profession - Dropdown */}
        <div className="form-group">
          <label htmlFor="profession">Profession</label>
          <select
            id="profession"
            name="profession"
            value={formData.profession}
            onChange={(e) => handleInputChange('profession', e.target.value)}
            className={errors.profession ? 'error' : ''}
          >
            {professionOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.profession && <Alert type="error" message={errors.profession} variant="inline" />}
        </div>

        {/* Communication Style - Radio */}
        <div className="form-group">
          <div className="field-label">Communication Style{!formData.communicationStyle && <span className="text-red-500">*</span>}</div>
          <div className="radio-grid">
            {communicationStyleOptions.map(option => (
              <div key={option.value} className="radio-item">
                <input
                  id={`communicationStyle-${option.value}`}
                  type="radio"
                  name="communicationStyle"
                  value={option.value}
                  checked={formData.communicationStyle === option.value}
                  onChange={(e) => handleInputChange('communicationStyle', e.target.value)}
                />
                <label htmlFor={`communicationStyle-${option.value}`}>{option.label}</label>
              </div>
            ))}
          </div>
          {errors.communicationStyle && <Alert type="error" message={errors.communicationStyle} variant="inline" />}
        </div>

        {/* Daily Availability - Checkboxes */}
        <div className="form-group">
          <div className="field-label">Daily Availability{formData.dailyAvailability.length === 0 && <span className="text-red-500">*</span>}</div>
          <div className="checkbox-grid">
            {dailyAvailabilityOptions.map(option => (
              <div key={option.value} className="checkbox-item">
                <input
                  id={`dailyAvailability-${option.value}`}
                  type="checkbox"
                  name="dailyAvailability"
                  value={option.value}
                  checked={formData.dailyAvailability.includes(option.value)}
                  onChange={(e) => {
                    const value = e.target.value;
                    const isChecked = e.target.checked;
                    const newValues = isChecked
                      ? [...formData.dailyAvailability, value]
                      : formData.dailyAvailability.filter(v => v !== value);
                    handleCheckboxGroupChange('dailyAvailability', newValues);
                  }}
                />
                <label htmlFor={`dailyAvailability-${option.value}`}>{option.label}</label>
              </div>
            ))}
          </div>
          {errors.dailyAvailability && <Alert type="error" message={errors.dailyAvailability} variant="inline" />}
        </div>

        {/* Fitness Level - Dropdown */}
        <div className="form-group">
          <label htmlFor="fitnessLevel">Fitness Level</label>
          <select
            id="fitnessLevel"
            name="fitnessLevel"
            value={formData.fitnessLevel}
            onChange={(e) => handleInputChange('fitnessLevel', e.target.value)}
            className={errors.fitnessLevel ? 'error' : ''}
          >
            {fitnessLevelOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.fitnessLevel && <Alert type="error" message={errors.fitnessLevel} variant="inline" />}
        </div>

        {/* Learning Style - Checkboxes */}
        <div className="form-group">
          <div className="field-label">Learning Style{formData.learningStyle.length === 0 && <span className="text-red-500">*</span>}</div>
          <div className="checkbox-grid">
            {learningStyleOptions.map(option => (
              <div key={option.value} className="checkbox-item">
                <input
                  id={`learningStyle-${option.value}`}
                  type="checkbox"
                  name="learningStyle"
                  value={option.value}
                  checked={formData.learningStyle.includes(option.value)}
                  onChange={(e) => {
                    const value = e.target.value;
                    const isChecked = e.target.checked;
                    const newValues = isChecked
                      ? [...formData.learningStyle, value]
                      : formData.learningStyle.filter(v => v !== value);
                    handleCheckboxGroupChange('learningStyle', newValues);
                  }}
                />
                <label htmlFor={`learningStyle-${option.value}`}>{option.label}</label>
              </div>
            ))}
          </div>
          {errors.learningStyle && <Alert type="error" message={errors.learningStyle} variant="inline" />}
        </div>

        {/* Age - Text Input */}
        <div className="form-group">
          <label htmlFor="age">Age</label>
          <input
            id="age"
            name="age"
            type="text"
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            placeholder="Enter your age"
            className={errors.age ? 'error' : ''}
          />
          {errors.age && <Alert type="error" message={errors.age} variant="inline" />}
        </div>

        {statusMessage && (
          <StatusMessage
            message={statusMessage}
            type={statusType}
          />
        )}
      </Form>
    </div>
  );
};

export default DataInput;