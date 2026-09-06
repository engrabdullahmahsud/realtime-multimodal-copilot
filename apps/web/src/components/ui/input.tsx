'use client';

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}

export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  size = 'md',
  className = '',
  error = false,
  disabled = false,
  required = false,
  minLength,
  autoComplete,
  ...props
}: InputProps) {
  const borderClasses = error ? 'border-danger' : 'border-strong';
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1' : size === 'lg' ? 'px-5 py-2' : 'px-3.5 py-1.5';
  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed' : '';

  const classes = `w-full rounded-md border ${borderClasses} ${sizeClasses} ${disabledClasses} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-foreground text-sm ${className}`;

  return (
    <div className="mb-3">
      {label && <label htmlFor="input" className="mb-1 text-sm font-medium text-foreground">{label}</label>}
      <input
        id="input"
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={classes}
        disabled={disabled}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        {...props}
      />
      {error && label && <p className="mt-1 text-xs text-danger">Please fix this field</p>}
    </div>
  );
}