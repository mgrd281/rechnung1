import React from 'react';
import { Star } from 'lucide-react';

export type StarRatingTemplate =
    | 'default'           // Classic filled stars
    | 'minimal'           // Small, compact design
    | 'badge'             // Stars with badge background
    | 'outlined'          // Outlined stars only
    | 'gradient'          // Gradient colored stars
    | 'large-primary'     // Large prominent rating
    | 'card'              // Card style with background
    | 'inline-compact'    // Ultra compact inline
    | 'percentage-bar';   // Stars with percentage bar

export interface StarRatingProps {
    rating: number;
    reviewCount: number;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
    template?: StarRatingTemplate;
    className?: string;
    primaryColor?: string; // For customization
}

/**
 * Multi-Template Star Rating Component
 * 
 * Features:
 * - 9 different templates/styles
 * - Customizable colors
 * - Responsive sizing
 * - Elegant 0 reviews handling
 */
export function StarRatingMulti({
    rating,
    reviewCount,
    size = 'md',
    showCount = true,
    template = 'default',
    className = '',
    primaryColor = 'yellow',
}: StarRatingProps) {
    const sizeClasses = {
        sm: { star: 'h-3.5 w-3.5', text: 'text-xs', rating: 'text-sm' },
        md: { star: 'h-4 w-4', text: 'text-sm', rating: 'text-base' },
        lg: { star: 'h-5 w-5', text: 'text-base', rating: 'text-xl' },
    };

    const colorClasses = {
        yellow: { fill: 'text-yellow-400 fill-yellow-400', border: 'border-yellow-200', bg: 'bg-yellow-50' },
        blue: { fill: 'text-blue-500 fill-blue-500', border: 'border-blue-200', bg: 'bg-blue-50' },
        purple: { fill: 'text-purple-500 fill-purple-500', border: 'border-purple-200', bg: 'bg-purple-50' },
        green: { fill: 'text-green-500 fill-green-500', border: 'border-green-200', bg: 'bg-green-50' },
        orange: { fill: 'text-orange-500 fill-orange-500', border: 'border-orange-200', bg: 'bg-orange-50' },
    };

    const sizes = sizeClasses[size];
    const colors = colorClasses[primaryColor as keyof typeof colorClasses] || colorClasses.yellow;

    // Render stars helper
    const renderStars = (customClasses?: string) => (
        [...Array(5)].map((_, i) => (
            <Star
                key={i}
                className={`${sizes.star} ${i < Math.floor(rating)
                        ? colors.fill
                        : 'text-gray-300'
                    } ${customClasses || ''}`}
            />
        ))
    );

    // ====================================
    // Template 1: Default (Classic)
    // ====================================
    if (template === 'default') {
        if (reviewCount === 0) {
            return (
                <div className={`flex flex-col gap-1 ${className}`}>
                    <p className={`text-gray-500 ${sizes.text} font-medium`}>
                        Noch keine Bewertungen
                    </p>
                    <p className="text-xs text-gray-400">Sei der Erste!</p>
                </div>
            );
        }
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="flex items-center gap-0.5">{renderStars()}</div>
                {showCount && (
                    <div className={`flex items-center gap-1 ${sizes.text}`}>
                        <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
                        <span className="text-gray-500">({reviewCount})</span>
                    </div>
                )}
            </div>
        );
    }

    // ====================================
    // Template 2: Minimal
    // ====================================
    if (template === 'minimal') {
        if (reviewCount === 0) {
            return <span className={`text-xs text-gray-400 ${className}`}>Keine Bewertungen</span>;
        }
        return (
            <div className={`flex items-center gap-1.5 ${className}`}>
                <div className="flex items-center gap-0.5">{renderStars()}</div>
                {showCount && (
                    <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
                )}
            </div>
        );
    }

    // ====================================
    // Template 3: Badge Style
    // ====================================
    if (template === 'badge') {
        if (reviewCount === 0) {
            return (
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 ${className}`}>
                    <span className="text-xs text-gray-500">Noch nicht bewertet</span>
                </div>
            );
        }
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} border ${colors.border} ${className}`}>
                <div className="flex items-center gap-0.5">{renderStars()}</div>
                {showCount && (
                    <span className={`${sizes.text} font-medium text-gray-700`}>
                        {rating.toFixed(1)} ({reviewCount})
                    </span>
                )}
            </div>
        );
    }

    // ====================================
    // Template 4: Outlined Stars
    // ====================================
    if (template === 'outlined') {
        if (reviewCount === 0) {
            return (
                <div className={`flex items-center gap-2 ${className}`}>
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`${sizes.star} text-gray-300 stroke-[1.5]`} strokeWidth={1.5} />
                        ))}
                    </div>
                    {showCount && <span className={`${sizes.text} text-gray-400`}>(0)</span>}
                </div>
            );
        }
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`${sizes.star} ${i < Math.floor(rating)
                                    ? colors.fill
                                    : 'text-gray-300 stroke-current'
                                }`}
                            strokeWidth={i < Math.floor(rating) ? 0 : 1.5}
                        />
                    ))}
                </div>
                {showCount && (
                    <span className={`${sizes.text} font-semibold text-gray-700`}>
                        {rating.toFixed(1)} ({reviewCount})
                    </span>
                )}
            </div>
        );
    }

    // ====================================
    // Template 5: Gradient
    // ====================================
    if (template === 'gradient') {
        if (reviewCount === 0) {
            return (
                <div className={`text-center ${className}`}>
                    <p className="text-sm text-gray-400">Noch keine Bewertungen</p>
                </div>
            );
        }
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`${sizes.star} ${i < Math.floor(rating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                            style={
                                i < Math.floor(rating)
                                    ? {
                                        filter: 'drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3))',
                                    }
                                    : {}
                            }
                        />
                    ))}
                </div>
                {showCount && (
                    <span className={`${sizes.text} font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent`}>
                        {rating.toFixed(1)} ★
                    </span>
                )}
            </div>
        );
    }

    // ====================================
    // Template 6: Large Primary
    // ====================================
    if (template === 'large-primary') {
        if (reviewCount === 0) {
            return (
                <div className={`text-center ${className}`}>
                    <p className="text-4xl font-bold text-gray-300">—</p>
                    <p className="text-xs text-gray-400 mt-1">Keine Bewertungen</p>
                </div>
            );
        }
        return (
            <div className={`flex flex-col items-center gap-2 ${className}`}>
                <div className="flex items-center gap-1 text-5xl font-bold text-gray-900">
                    {rating.toFixed(1)}
                    <Star className="h-6 w-6 text-yellow-400 fill-yellow-400 ml-1" />
                </div>
                <div className="flex items-center gap-1">{renderStars()}</div>
                {showCount && (
                    <p className="text-sm text-gray-500">
                        Basierend auf {reviewCount} {reviewCount === 1 ? 'Bewertung' : 'Bewertungen'}
                    </p>
                )}
            </div>
        );
    }

    // ====================================
    // Template 7: Card Style
    // ====================================
    if (template === 'card') {
        if (reviewCount === 0) {
            return (
                <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
                    <p className="text-sm text-gray-500 text-center">Noch keine Bewertungen</p>
                </div>
            );
        }
        return (
            <div className={`p-4 ${colors.bg} rounded-lg border ${colors.border} ${className}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`${sizes.rating} font-bold text-gray-900`}>{rating.toFixed(1)}</span>
                        <div className="flex items-center gap-0.5">{renderStars()}</div>
                    </div>
                    {showCount && (
                        <span className={`${sizes.text} text-gray-600`}>{reviewCount} Bewertungen</span>
                    )}
                </div>
            </div>
        );
    }

    // ====================================
    // Template 8: Inline Compact
    // ====================================
    if (template === 'inline-compact') {
        if (reviewCount === 0) {
            return <span className={`text-xs text-gray-400 ${className}`}>—</span>;
        }
        return (
            <div className={`inline-flex items-center gap-1 ${className}`}>
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>
                {showCount && (
                    <span className="text-xs text-gray-400">({reviewCount})</span>
                )}
            </div>
        );
    }

    // ====================================
    // Template 9: Percentage Bar
    // ====================================
    if (template === 'percentage-bar') {
        if (reviewCount === 0) {
            return (
                <div className={`flex flex-col gap-2 ${className}`}>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`${sizes.star} text-gray-300`} />
                            ))}
                        </div>
                        <span className={`${sizes.text} text-gray-400`}>Keine Bewertungen</span>
                    </div>
                </div>
            );
        }

        const percentage = (rating / 5) * 100;
        return (
            <div className={`flex flex-col gap-2 ${className}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">{renderStars()}</div>
                        <span className={`${sizes.text} font-semibold text-gray-900`}>{rating.toFixed(1)}</span>
                    </div>
                    {showCount && (
                        <span className={`${sizes.text} text-gray-500`}>{reviewCount} Bewertungen</span>
                    )}
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        );
    }

    // Fallback
    return <div className={className}>Template not found</div>;
}

// Re-export old components for backwards compatibility
export { StarRating } from './star-rating';
export { StarRatingCompact } from './star-rating';
