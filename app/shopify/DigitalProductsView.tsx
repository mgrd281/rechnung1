'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Package, Trash2, BarChart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DigitalProductDetailView from './DigitalProductDetailView';

interface DigitalProduct {
    id: string;
    title: string;
    shopifyProductId: string;
    _count: {
        keys: number;
    };
}

interface DigitalProductsViewProps {
    shop: string;
}

export default function DigitalProductsView({ shop }: DigitalProductsViewProps) {
    const [products, setProducts] = useState<DigitalProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({ title: '', shopifyProductId: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);

    useEffect(() => {
        if (shop) {
            fetchProducts();
        }
    }, [shop]);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`/api/shopify/digital-products?shop=${shop}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error('Failed to load products', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/shopify/digital-products?shop=${shop}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setNewProduct({ title: '', shopifyProductId: '' });
                setIsAddDialogOpen(false);
                fetchProducts();
            } else {
                alert(data.error || 'Fehler beim Erstellen des Produkts');
            }
        } catch (error) {
            console.error('Failed to create product', error);
            alert('Ein Fehler ist aufgetreten');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (e: React.MouseEvent, productId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Möchten Sie dieses Produkt und alle zugehörigen Keys wirklich löschen?')) return;

        try {
            const res = await fetch(`/api/digital-products/${productId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchProducts();
            } else {
                alert('Fehler beim Löschen des Produkts');
            }
        } catch (error) {
            console.error('Failed to delete product', error);
        }
    };

    // Calculate stats
    const totalProducts = products.length;
    const totalKeys = products.reduce((acc, p) => acc + (p._count?.keys || 0), 0);
    // @ts-ignore - keys is included in the API response now
    const totalAvailableKeys = products.reduce((acc, p) => acc + (p.keys?.length || 0), 0);
    const totalUsedKeys = totalKeys - totalAvailableKeys;

    if (selectedProduct) {
        return (
            <DigitalProductDetailView
                product={selectedProduct}
                onBack={() => {
                    setSelectedProduct(null);
                    fetchProducts();
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Digitale Produkte</h2>
                        <p className="text-sm text-gray-500">Verwalten Sie Ihre Lizenzschlüssel und Downloads</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isReportsOpen} onOpenChange={setIsReportsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <BarChart className="w-4 h-4 mr-2" />
                                Berichte
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Berichte & Statistiken</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-gray-500">Gesamt Produkte</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-gray-500">Verkaufte Keys</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-600">{totalUsedKeys}</div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {totalKeys > 0 ? Math.round((totalUsedKeys / totalKeys) * 100) : 0}% aller Keys
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-gray-500">Verfügbare Keys</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">{totalAvailableKeys}</div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Bereit zum Verkauf
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4">Bestandsübersicht</h3>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 font-medium text-gray-500">Produkt</th>
                                                <th className="px-4 py-3 font-medium text-gray-500 text-right">Verfügbar</th>
                                                <th className="px-4 py-3 font-medium text-gray-500 text-right">Verkauft</th>
                                                <th className="px-4 py-3 font-medium text-gray-500 text-right">Gesamt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {products.map(p => {
                                                // @ts-ignore
                                                const available = p.keys?.length || 0;
                                                const total = p._count?.keys || 0;
                                                const used = total - available;
                                                return (
                                                    <tr key={p.id}>
                                                        <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                                                        <td className="px-4 py-3 text-right text-green-600 font-medium">{available}</td>
                                                        <td className="px-4 py-3 text-right text-blue-600">{used}</td>
                                                        <td className="px-4 py-3 text-right text-gray-500">{total}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Neues Produkt
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Neues digitales Produkt</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddProduct} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Produkt Titel</Label>
                                    <Input
                                        id="title"
                                        value={newProduct.title}
                                        onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                                        placeholder="z.B. Windows 11 Pro"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shopifyId">Shopify Produkt ID</Label>
                                    <Input
                                        id="shopifyId"
                                        value={newProduct.shopifyProductId}
                                        onChange={(e) => setNewProduct({ ...newProduct, shopifyProductId: e.target.value })}
                                        placeholder="z.B. 832910..."
                                        required
                                    />
                                    <p className="text-xs text-gray-500">Die ID finden Sie in der URL der Produktseite im Shopify Admin.</p>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Abbrechen</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Wird erstellt...' : 'Erstellen'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Laden...</div>
            ) : products.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow border border-dashed border-gray-300">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">Keine digitalen Produkte</h3>
                    <p className="mt-1 text-sm text-gray-500">Starten Sie mit dem Hinzufügen Ihres ersten Microsoft-Produkts.</p>
                    <div className="mt-6">
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Produkt hinzufügen
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => {
                        // @ts-ignore
                        const availableCount = product.keys?.length || 0;
                        return (
                            <Card
                                key={product.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer h-full relative group"
                                onClick={() => setSelectedProduct(product)}
                            >
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-start">
                                        <span className="truncate pr-8">{product.title}</span>
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button
                                                onClick={(e) => handleDeleteProduct(e, product.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                                                title="Produkt löschen"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </CardTitle>
                                    <CardDescription>ID: {product.shopifyProductId}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${availableCount === 0 ? 'bg-red-500' :
                                                availableCount < 10 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`} />
                                            <span className={`text-sm font-medium ${availableCount < 10 ? 'text-yellow-700' : 'text-gray-700'
                                                }`}>
                                                {availableCount} Keys verfügbar
                                                {availableCount < 10 && (
                                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                                        Niedriger Bestand
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <Button variant="ghost" size="sm">Verwalten &rarr;</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
