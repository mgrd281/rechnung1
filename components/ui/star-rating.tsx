import React from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
    rating: number; // Average rating (0-5)
    reviewCount: number; // Total number of reviews
    size?: 'sm' | 'md' | 'lg'; // Star size
    showCount?: boolean; // Show review count text
    variant?: 'modern' | 'text-only'; // Display variant for 0 reviews
    className?: string;
}

/**
 * Modern Star Rating Component
 * 
 * Features:
 * - Modern, premium design for 0 reviews (two variants)
 * - Variant "modern": Shows outline stars when no reviews
 * - Variant "text-only": Hides stars and shows elegant text when no reviews
 * - Full stars display when reviews exist (>0)
 * - Responsive sizing
 */
export function StarRating({
    rating,
    reviewCount,
    size = 'md',
    showCount = true,
    variant = 'text-only', // Recommended default
    className = '',
}: StarRatingProps) {
    // Size configurations
    const sizeClasses = {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    const starSize = sizeClasses[size];
    const textSize = textSizeClasses[size];

    // ========================================
    // CASE 1: No reviews (0 Bewertungen)
    // ========================================
    if (reviewCount === 0) {
        if (variant === 'text-only') {
            // Option A: Hide stars, show elegant text
            return (
                <div className={`flex flex-col gap-1 ${className}`}>
                    <p className={`text-gray-500 ${textSize} font-medium`}>
                        Noch keine Bewertungen
                    </p>
                    <p className={`text-gray-400 text-xs`}>
                        Sei der Erste, der bewertet
                    </p>
                </div>
            );
        } else if (variant === 'modern') {
            // Option B: Modern outline stars
            return (
                <div className={`flex items-center gap-2 ${className}`}>
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`${starSize} text-gray-300 stroke-[1.5]`}
                                strokeWidth={1.5}
                            />
                        ))}
                    </div>
                    {showCount && (
                        <span className={`text-gray-400 ${textSize}`}>
                            (0 Bewertungen)
                        </span>
                    )}
                </div>
            );
        }
    }

    // ========================================
    // CASE 2: Reviews exist (>0)
    // ========================================
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Star Display */}
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => {
                    const isFilled = i < Math.floor(rating);
                    const isHalf = i < rating && i >= Math.floor(rating);

                    return (
                        <Star
                            key={i}
                            className={`${starSize} ${isFilled
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : isHalf
                                        ? 'text-yellow-400 fill-yellow-400/50'
                                        : 'text-gray-300'
                                }`}
                        />
                    );
                })}
            </div>

            {/* Rating & Count */}
            {showCount && (
                <div className={`flex items-center gap-1 ${textSize}`}>
                    <span className="font-semibold text-gray-900">
                        {rating.toFixed(1)}
                    </span>
                    <span className="text-gray-500">
                        ({reviewCount} {reviewCount === 1 ? 'Bewertung' : 'Bewertungen'})
                    </span>
                </div>
            )}
        </div>
    );
}

// ========================================
// Compact Inline Variant (for tight spaces)
// ========================================
export function StarRatingCompact({
    rating,
    reviewCount,
    className = '',
}: Omit<StarRatingProps, 'size' | 'showCount' | 'variant'>) {
    if (reviewCount === 0) {
        return (
            <span className={`text-xs text-gray-400 ${className}`}>
                Keine Bewertungen
            </span>
        );
    }

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-3 w-3 ${i < Math.floor(rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                    />
                ))}
            </div>
            <span className="text-xs text-gray-600">
                {rating.toFixed(1)} ({reviewCount})
            </span>
        </div>
    );
}
