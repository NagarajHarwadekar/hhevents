import React from 'react';

interface BaseFieldProps {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> & BaseFieldProps;

export const FormInput: React.FC<InputProps> = ({
  label,
  id,
  error,
  helperText,
  required,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={id}
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-150 focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-slate-800 focus:ring-slate-200'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> &
  BaseFieldProps & {
    options: { value: string; label: string }[];
  };

export const FormSelect: React.FC<SelectProps> = ({
  label,
  id,
  error,
  helperText,
  required,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        id={id}
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 bg-white transition-all duration-150 focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-slate-800 focus:ring-slate-200'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & BaseFieldProps;

export const FormTextarea: React.FC<TextareaProps> = ({
  label,
  id,
  error,
  helperText,
  required,
  className = '',
  rows = 4,
  ...props
}) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <textarea
        id={id}
        rows={rows}
        required={required}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-150 focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-slate-800 focus:ring-slate-200'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  id: string;
}

export const FormCheckbox: React.FC<CheckboxProps> = ({
  label,
  description,
  id,
  className = '',
  ...props
}) => {
  return (
    <label htmlFor={id} className={`flex items-start gap-3 cursor-pointer group ${className}`}>
      <input
        type="checkbox"
        id={id}
        className="mt-1 w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer"
        {...props}
      />
      <div className="text-sm select-none">
        <span className="font-medium text-slate-900 group-hover:text-slate-800">{label}</span>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
};
