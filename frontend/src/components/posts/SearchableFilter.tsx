import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

type SearchableFilterOption = {
	id: string;
	name: string;
};

type SearchableFilterProps = {
	label: string;
	value: string;
	options: SearchableFilterOption[];
	placeholder: string;
	onChange(value: string): void;
};

const SearchableFilter = ({ label, value, options, placeholder, onChange }: SearchableFilterProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const selectedOption = options.find((option) => option.id === value);
	const filteredOptions = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		if (!normalizedQuery) {
			return options;
		}

		return options.filter((option) => option.name.toLowerCase().includes(normalizedQuery));
	}, [options, query]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			if (!wrapperRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
				setQuery('');
			}
		};

		document.addEventListener('pointerdown', handlePointerDown);

		return () => document.removeEventListener('pointerdown', handlePointerDown);
	}, [isOpen]);

	return (
		<div ref={wrapperRef} className="relative min-w-52">
			<button
				type="button"
				className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-800 outline-none hover:bg-slate-50 focus:border-cyan-700"
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				onClick={() => setIsOpen((current) => !current)}
			>
				<span className={selectedOption ? 'truncate' : 'truncate text-slate-500'}>{selectedOption?.name ?? label}</span>
				<ChevronDown className="size-4 shrink-0 text-slate-500" />
			</button>

			{isOpen ? (
				<div className="absolute right-0 z-30 mt-2 w-full min-w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
					<div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-2">
						<Search className="size-4 shrink-0 text-slate-400" />
						<input
							className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
							value={query}
							placeholder={placeholder}
							onChange={(event) => setQuery(event.target.value)}
							autoFocus
						/>
					</div>
					<div className="mt-2 max-h-64 overflow-y-auto" role="listbox">
						<button
							type="button"
							className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
							onClick={() => {
								onChange('');
								setIsOpen(false);
								setQuery('');
							}}
						>
							<span>{label}</span>
							{!value ? <Check className="size-4 text-cyan-700" /> : null}
						</button>
						{filteredOptions.map((option) => (
							<button
								key={option.id}
								type="button"
								className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
								onClick={() => {
									onChange(option.id);
									setIsOpen(false);
									setQuery('');
								}}
							>
								<span className="truncate">{option.name}</span>
								{value === option.id ? <Check className="size-4 text-cyan-700" /> : null}
							</button>
						))}
						{filteredOptions.length === 0 ? <div className="px-2 py-3 text-sm text-slate-500">Nenhum resultado encontrado.</div> : null}
					</div>
				</div>
			) : null}
		</div>
	);
};

export { SearchableFilter };
