
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#10213F] outline-none transition focus:border-[#078052] focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100";

export function TeamInput({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  maxLength,
  placeholder,
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

export function TeamSelect({
  label,
  value,
  onChange,
  options,
  valueKey,
  labelKey,
  required = false,
  disabled = false,
  placeholder,
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>

      <select
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        <option value="">
          {placeholder || `Select ${label.toLowerCase()}`}
        </option>

        {options.map((item) => (
          <option
            key={item[valueKey]}
            value={item[valueKey]}
          >
            {item[labelKey]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TeamTextarea({
  label,
  value,
  onChange,
  maxLength = 1000,
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">
        {label}
      </span>

      <textarea
        value={value}
        maxLength={maxLength}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} resize-y`}
      />

      <span className="mt-1 block text-right text-[11px] text-slate-400">
        {value.length}/{maxLength}
      </span>
    </label>
  );
}
