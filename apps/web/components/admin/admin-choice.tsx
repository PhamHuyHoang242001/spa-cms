interface Opt {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string;
  options: Opt[];
  onChange: (value: string) => void;
}

export function AdminChoice({ label, value, options, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-[#6b4c41]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium ${on ? 'bg-[#1C1917] text-white' : 'border border-[#ddd0ca] text-[#3d2b25]'}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdminBoolChoice({
  label,
  value,
  onChange,
  yes = 'Có',
  no = 'Không',
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  yes?: string;
  no?: string;
}) {
  return (
    <AdminChoice
      label={label}
      value={value ? '1' : '0'}
      onChange={(v) => onChange(v === '1')}
      options={[{ value: '1', label: yes }, { value: '0', label: no }]}
    />
  );
}
