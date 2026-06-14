import { useEffect, useMemo, useState } from 'react';
import { fetchProfileAvatar } from '../services/profileService';

const getInitials = (name: string) => {
	const parts = name.trim().split(/\s+/).filter(Boolean);

	return (
		parts
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('') || 'U'
	);
};

const getDominantColor = async (imageUrl: string) => {
	const image = new Image();
	image.src = imageUrl;
	await image.decode();

	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d', { willReadFrequently: true });

	if (!context) {
		return null;
	}

	const size = 24;
	canvas.width = size;
	canvas.height = size;
	context.drawImage(image, 0, 0, size, size);

	const pixels = context.getImageData(0, 0, size, size).data;
	const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

	for (let index = 0; index < pixels.length; index += 4) {
		const alpha = pixels[index + 3];

		if (alpha < 120) {
			continue;
		}

		const r = pixels[index];
		const g = pixels[index + 1];
		const b = pixels[index + 2];
		const saturation = Math.max(r, g, b) - Math.min(r, g, b);

		if (r > 235 && g > 235 && b > 235) {
			continue;
		}

		const key = `${Math.round(r / 32)}-${Math.round(g / 32)}-${Math.round(b / 32)}`;
		const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
		const weight = saturation > 20 ? 2 : 1;
		bucket.count += weight;
		bucket.r += r * weight;
		bucket.g += g * weight;
		bucket.b += b * weight;
		buckets.set(key, bucket);
	}

	const dominant = [...buckets.values()].sort((a, b) => b.count - a.count)[0];

	if (!dominant) {
		return null;
	}

	return {
		r: Math.round(dominant.r / dominant.count),
		g: Math.round(dominant.g / dominant.count),
		b: Math.round(dominant.b / dominant.count),
	};
};

type UserAvatarProps = {
	name: string;
	avatarUrl?: string | null;
	token?: string | null;
	className?: string;
	imageClassName?: string;
	onDominantColor?: (color: { r: number; g: number; b: number } | null) => void;
};

const UserAvatar = ({ name, avatarUrl, token, className = '', imageClassName = '', onDominantColor }: UserAvatarProps) => {
	const [objectUrl, setObjectUrl] = useState<string | null>(null);
	const initials = useMemo(() => getInitials(name), [name]);

	useEffect(() => {
		let url: string | null = null;
		let isMounted = true;

		const load = async () => {
			if (!avatarUrl || !token) {
				setObjectUrl(null);
				onDominantColor?.(null);
				return;
			}

			const blob = await fetchProfileAvatar(token, avatarUrl);
			url = URL.createObjectURL(blob);

			if (!isMounted) {
				URL.revokeObjectURL(url);
				return;
			}

			setObjectUrl(url);
			const dominantColor = await getDominantColor(url).catch(() => null);

			if (isMounted) {
				onDominantColor?.(dominantColor);
			}
		};

		void load();

		return () => {
			isMounted = false;
			if (url) {
				URL.revokeObjectURL(url);
			}
		};
	}, [avatarUrl, token, onDominantColor]);

	if (objectUrl) {
		return <img className={`rounded-full object-cover ${className} ${imageClassName}`} src={objectUrl} alt={`Avatar de ${name}`} />;
	}

	return (
		<div className={`flex items-center justify-center overflow-hidden rounded-full bg-red-50 font-semibold text-red-700 ${className}`}>
			{initials}
		</div>
	);
};

export { UserAvatar };
