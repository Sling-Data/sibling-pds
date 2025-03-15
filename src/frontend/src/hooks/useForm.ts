import { useState, useCallback, ChangeEvent } from "react";

type ValidationFunction<T> = (values: T) => Partial<Record<keyof T, string>>;

interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleBlur: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (
    onSubmit: (values: T) => Promise<void> | void
  ) => (e: React.FormEvent) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearErrors: () => void;
  resetForm: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validate?: ValidationFunction<T>
): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setSubmitting] = useState<boolean>(false);

  const validateForm = useCallback(() => {
    if (!validate) return {};
    return validate(values);
  }, [validate, values]);

  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const { name, value, type } = e.target;

      // Handle different input types
      const newValue =
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({
        ...prev,
        [name]: newValue,
      }));

      // Clear error when field is changed
      if (errors[name as keyof T]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const { name } = e.target;

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      if (validate) {
        const validationErrors = validate(values);
        setErrors((prev) => ({
          ...prev,
          ...validationErrors,
        }));
      }
    },
    [validate, values]
  );

  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error when field is changed
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    },
    [errors]
  );

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => Promise<void> | void) =>
      async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validateForm();
        setErrors(validationErrors);

        // Check if there are any errors
        if (Object.keys(validationErrors).length === 0) {
          setSubmitting(true);

          try {
            await onSubmit(values);
          } catch (error) {
            console.error("Form submission error:", error);
          } finally {
            setSubmitting(false);
          }
        }
      },
    [validateForm, values]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    clearErrors,
    resetForm,
    setSubmitting,
  };
}
