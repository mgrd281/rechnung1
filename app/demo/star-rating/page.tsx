'use client';

import { StarRating, StarRatingCompact } from '@/components/ui/star-rating';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StarRatingDemoPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Modern Star Rating Component
                    </h1>
                    <p className="text-gray-600">
                        Premium star ratings with elegant handling of 0 reviews
                    </p>
                </div>

                {/* Variant Comparison: 0 Reviews */}
                <Card>
                    <CardHeader>
                        <CardTitle>0 Bewertungen - Vergleich</CardTitle>
                        <CardDescription>
                            Sehen Sie, wie beide Varianten aussehen, wenn keine Bewertungen vorhanden sind
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Variant A: Text-Only */}
                        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Variant A: "text-only"
                                </h3>
                                <Badge className="bg-green-100 text-green-800">Empfohlen</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Sterne werden ausgeblendet, stattdessen erscheint ein einladender Text.
                            </p>
                            <div className="bg-white p-6 rounded-lg">
                                <StarRating
                                    rating={0}
                                    reviewCount={0}
                                    variant="text-only"
                                    size="md"
                                />
                            </div>
                        </div>

                        {/* Variant B: Modern */}
                        <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Variant B: "modern"
                                </h3>
                                <Badge variant="outline">Alternative</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Dünne, helle Outline-Sterne (nicht aufdringlich).
                            </p>
                            <div className="bg-white p-6 rounded-lg">
                                <StarRating
                                    rating={0}
                                    reviewCount={0}
                                    variant="modern"
                                    size="md"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Size Variants */}
                <Card>
                    <CardHeader>
                        <CardTitle>Größenoptionen</CardTitle>
                        <CardDescription>Verschiedene Größen für unterschiedliche Kontexte</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-8 p-4 bg-white rounded-lg border">
                            <span className="text-sm font-medium text-gray-500 w-20">Small:</span>
                            <StarRating rating={4.5} reviewCount={24} size="sm" />
                        </div>
                        <div className="flex items-center gap-8 p-4 bg-white rounded-lg border">
                            <span className="text-sm font-medium text-gray-500 w-20">Medium:</span>
                            <StarRating rating={4.5} reviewCount={24} size="md" />
                        </div>
                        <div className="flex items-center gap-8 p-4 bg-white rounded-lg border">
                            <span className="text-sm font-medium text-gray-500 w-20">Large:</span>
                            <StarRating rating={4.5} reviewCount={24} size="lg" />
                        </div>
                    </CardContent>
                </Card>

                {/* Rating Examples */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bewertungsbeispiele (mit Bewertungen)</CardTitle>
                        <CardDescription>So sehen die Sterne aus, wenn Bewertungen vorhanden sind</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { rating: 5.0, count: 128 },
                            { rating: 4.8, count: 64 },
                            { rating: 4.2, count: 42 },
                            { rating: 3.5, count: 15 },
                            { rating: 2.8, count: 8 },
                            { rating: 1.5, count: 3 },
                        ].map((example, idx) => (
                            <div key={idx} className="p-4 bg-white rounded-lg border">
                                <StarRating
                                    rating={example.rating}
                                    reviewCount={example.count}
                                    variant="text-only"
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Compact Variant */}
                <Card>
                    <CardHeader>
                        <CardTitle>Kompakt-Variante</CardTitle>
                        <CardDescription>Für enge Layouts (z.B. Produktlisten)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="p-3 bg-white rounded-lg border flex items-center justify-between">
                            <span className="text-sm text-gray-900">Produkt 1</span>
                            <StarRatingCompact rating={4.6} reviewCount={89} />
                        </div>
                        <div className="p-3 bg-white rounded-lg border flex items-center justify-between">
                            <span className="text-sm text-gray-900">Produkt 2</span>
                            <StarRatingCompact rating={3.9} reviewCount={12} />
                        </div>
                        <div className="p-3 bg-white rounded-lg border flex items-center justify-between">
                            <span className="text-sm text-gray-900">Produkt 3 (neu)</span>
                            <StarRatingCompact rating={0} reviewCount={0} />
                        </div>
                    </CardContent>
                </Card>

                {/* Product Card Example */}
                <Card>
                    <CardHeader>
                        <CardTitle>Produktkarten-Beispiel</CardTitle>
                        <CardDescription>Realistisches E-Commerce-Szenario</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Product with reviews */}
                            <div className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                    <span className="text-gray-400">Produktbild</span>
                                </div>
                                <div className="p-4 space-y-2">
                                    <h3 className="font-semibold text-gray-900">Premium Kopfhörer</h3>
                                    <StarRating rating={4.7} reviewCount={234} size="sm" variant="text-only" />
                                    <p className="text-xl font-bold text-gray-900">€89.99</p>
                                </div>
                            </div>

                            {/* Product with no reviews (text-only) */}
                            <div className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                    <span className="text-gray-400">Produktbild</span>
                                </div>
                                <div className="p-4 space-y-2">
                                    <h3 className="font-semibold text-gray-900">Neues Smartphone</h3>
                                    <StarRating rating={0} reviewCount={0} size="sm" variant="text-only" />
                                    <p className="text-xl font-bold text-gray-900">€699.99</p>
                                </div>
                            </div>

                            {/* Product with no reviews (modern) */}
                            <div className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                    <span className="text-gray-400">Produktbild</span>
                                </div>
                                <div className="p-4 space-y-2">
                                    <h3 className="font-semibold text-gray-900">Smartwatch Pro</h3>
                                    <StarRating rating={0} reviewCount={0} size="sm" variant="modern" />
                                    <p className="text-xl font-bold text-gray-900">€249.99</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Implementation Code */}
                <Card>
                    <CardHeader>
                        <CardTitle>Verwendung im Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                            {`import { StarRating } from '@/components/ui/star-rating';

// Empfohlene Variante (Text-Only)
<StarRating 
  rating={0} 
  reviewCount={0} 
  variant="text-only" 
/>

// Alternative (Modern Outline)
<StarRating 
  rating={0} 
  reviewCount={0} 
  variant="modern" 
/>

// Mit Bewertungen
<StarRating 
  rating={4.5} 
  reviewCount={89} 
  size="md" 
/>`}
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
