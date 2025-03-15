import { useState, useCallback, ChangeEvent } from "react";

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

export interface FormState<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  submitCount: number;
  submitStatus: {
    success?: boolean;
    message?: string;
  };
}

export interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => ValidationErrors<T>;
  onSubmit?: (values: T, formHelpers: FormHelpers<T>) => Promise<void> | void;
}

export interface FormHelpers<T> {
  setSubmitting: (isSubmitting: boolean) => void;
  setErrors: (errors: ValidationErrors<T>) => void;
  setValues: (values: T) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, isTouched: boolean) => void;
  setSubmitStatus: (status: { success?: boolean; message?: string }) => void;
  resetForm: () => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    submitCount: 0,
    submitStatus: {},
  });

  // Validate the form
  const validateForm = useCallback(() => {
    if (!validate) return true;

    const errors = validate(formState.values);
    const isValid = Object.keys(errors).length === 0;

    setFormState((prev) => ({
      ...prev,
      errors,
      isValid,
    }));

    return isValid;
  }, [formState.values, validate]);

  // Set a single field value
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setFormState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [field]: value,
      },
      touched: {
        ...prev.touched,
        [field]: true,
      },
    }));
  }, []);

  // Set a single field error
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setFormState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error,
      },
    }));
  }, []);

  // Set a field as touched
  const setFieldTouched = useCallback(
    (field: keyof T, isTouched: boolean = true) => {
      setFormState((prev) => ({
        ...prev,
        touched: {
          ...prev.touched,
          [field]: isTouched,
        },
      }));
    },
    []
  );

  // Set all form values
  const setValues = useCallback((values: T) => {
    setFormState((prev) => ({
      ...prev,
      values,
    }));
  }, []);

  // Set all form errors
  const setErrors = useCallback((errors: ValidationErrors<T>) => {
    setFormState((prev) => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0,
    }));
  }, []);

  // Set submitting state
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setFormState((prev) => ({
      ...prev,
      isSubmitting,
    }));
  }, []);

  // Set submit status
  const setSubmitStatus = useCallback(
    (status: { success?: boolean; message?: string }) => {
      setFormState((prev) => ({
        ...prev,
        submitStatus: status,
      }));
    },
    []
  );

  // Reset the form to initial values
  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
      submitCount: 0,
      submitStatus: {},
    });
  }, [initialValues]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Validate the form
      const isValid = validateForm();

      // Update submit count
      setFormState((prev) => ({
        ...prev,
        submitCount: prev.submitCount + 1,
      }));

      if (!isValid) {
        return;
      }

      // Set submitting state
      setFormState((prev) => ({
        ...prev,
        isSubmitting: true,
        submitStatus: {},
      }));

      // Call onSubmit if provided
      if (onSubmit) {
        try {
          await onSubmit(formState.values, {
            setSubmitting,
            setErrors,
            setValues,
            setFieldValue,
            setFieldError,
            setFieldTouched,
            setSubmitStatus,
            resetForm,
          });
        } catch (error) {
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            submitStatus: {
              success: false,
              message:
                error instanceof Error ? error.message : "An error occurred",
            },
          }));
        }
      }
    },
    [
      formState.values,
      onSubmit,
      validateForm,
      resetForm,
      setErrors,
      setFieldError,
      setFieldTouched,
      setFieldValue,
      setSubmitStatus,
      setSubmitting,
      setValues,
    ]
  );

  // Handle input change
  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const { name, value, type } = e.target;

      // Handle different input types
      if (type === "checkbox") {
        const checkbox = e.target as HTMLInputElement;
        setFieldValue(name as keyof T, checkbox.checked);
      } else {
        setFieldValue(name as keyof T, value);
      }
    },
    [setFieldValue]
  );

  // Handle checkbox change for array values
  const handleCheckboxChange = useCallback(
    (field: keyof T, value: string, checked: boolean) => {
      const currentValues = (formState.values[field] as string[]) || [];

      let newValues;
      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter((v) => v !== value);
      }

      setFieldValue(field, newValues);
    },
    [formState.values, setFieldValue]
  );

  // Handle blur event
  const handleBlur = useCallback(
    (
      e: React.FocusEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name } = e.target;
      setFieldTouched(name as keyof T, true);
    },
    [setFieldTouched]
  );

  return {
    ...formState,
    handleSubmit,
    handleChange,
    handleBlur,
    handleCheckboxChange,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    setSubmitting,
    setSubmitStatus,
    resetForm,
    validateForm,
  };
}
