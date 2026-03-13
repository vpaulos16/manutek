import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { ShoppingCart, Search, Plus, Minus, Trash2 } from 'lucide-react';
import type { Part, SaleItem, Sale } from '../types';

const POS: React.FC = () => {
    const { parts, customers, addSale, updatePartStock } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState('pix');

    const filteredParts = parts.filter(p =>
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToCart = (part: Part) => {
        const existingItem = cart.find(item => item.partId === part.id);
        if (existingItem) {
            if (existingItem.quantity >= part.stock) return; // Prevent exceeding stock
            setCart(cart.map(item =>
                item.partId === part.id
                    ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
                    : item
            ));
        } else {
            if (part.stock < 1) return;
            setCart([...cart, {
                partId: part.id,
                name: part.description,
                quantity: 1,
                unitPrice: part.sellingPrice,
                total: part.sellingPrice
            }]);
        }
    };

    const removeFromCart = (partId: string) => {
        setCart(cart.filter(item => item.partId !== partId));
    };

    const updateQuantity = (partId: string, delta: number) => {
        const item = cart.find(i => i.partId === partId);
        if (!item) return;

        const part = parts.find(p => p.id === partId);
        if (!part) return;

        const newQuantity = item.quantity + delta;
        if (newQuantity < 1) {
            removeFromCart(partId);
            return;
        }
        if (newQuantity > part.stock) return;

        setCart(cart.map(i =>
            i.partId === partId
                ? { ...i, quantity: newQuantity, total: newQuantity * i.unitPrice }
                : i
        ));
    };

    const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleCheckout = () => {
        if (cart.length === 0) return;

        const newSale: Sale = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            customerId: selectedCustomerId || undefined,
            items: cart,
            total: cartTotal,
            paymentMethod
        };

        addSale(newSale);

        // Update stock
        cart.forEach(item => {
            updatePartStock(item.partId, -item.quantity);
        });

        setCart([]);
        setSelectedCustomerId('');
        alert('Venda finalizada com sucesso!');
    };

    return (
        <div className="animate-fade-in flex-col h-full" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-h1">Ponto de Venda</h1>
                    <p className="text-subtitle">Venda rápida de peças no balcão</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6" style={{ flex: 1, minHeight: 0 }}>
                {/* Lista de Produtos Column */}
                <div className="col-span-2 card flex-col" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="card-header">
                        <div className="search-bar w-full">
                            <Search size={18} color="var(--color-text-muted)" />
                            <input
                                type="text"
                                placeholder="Buscar peça por código ou nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card-body scroll-area p-0 grid grid-cols-2 lg:grid-cols-3 gap-4" style={{ padding: '1.5rem', overflowY: 'auto' }}>
                        {filteredParts.map(part => (
                            <div
                                key={part.id}
                                className="border p-4 rounded-lg cursor-pointer transition-colors"
                                style={{
                                    borderColor: part.stock > 0 ? 'var(--color-border)' : '#ffecf1',
                                    backgroundColor: part.stock > 0 ? 'var(--color-surface)' : '#fffbfa',
                                    opacity: part.stock > 0 ? 1 : 0.6
                                }}
                                onClick={() => addToCart(part)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-small text-muted">{part.code}</span>
                                    <span className={`badge ${part.stock > part.minStockAlert ? 'badge-success' : part.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                                        {part.stock} em estoque
                                    </span>
                                </div>
                                <h3 className="font-semibold text-main mb-2" style={{ fontSize: '0.9rem' }}>{part.description}</h3>
                                <p className="text-primary font-bold">{formatCurrency(part.sellingPrice)}</p>
                            </div>
                        ))}
                        {filteredParts.length === 0 && (
                            <div className="col-span-full text-center p-6 text-muted">Nenhuma peça encontrada no estoque.</div>
                        )}
                    </div>
                </div>

                {/* Carrinho Column */}
                <div className="card flex-col" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="card-header border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <h2 className="text-h3 flex items-center gap-2">
                            <ShoppingCart size={20} /> Carrinho Atual
                        </h2>
                    </div>

                    <div className="card-body scroll-area flex-1 p-0" style={{ padding: '1.5rem', overflowY: 'auto' }}>
                        {cart.length === 0 ? (
                            <div className="flex-col items-center justify-center h-full text-muted text-center" style={{ minHeight: '200px' }}>
                                <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>Carrinho vazio</p>
                                <p className="text-small">Adicione peças para iniciar a venda.</p>
                            </div>
                        ) : (
                            <div className="flex-col gap-4">
                                {cart.map(item => (
                                    <div key={item.partId} className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
                                        <div style={{ flex: 1 }}>
                                            <p className="font-medium text-main text-sm mb-1 line-clamp-1">{item.name}</p>
                                            <p className="text-primary font-semibold text-sm">{formatCurrency(item.unitPrice)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center border rounded-md" style={{ borderColor: 'var(--color-border)' }}>
                                                <button className="p-1 hover:bg-gray-100 transition-colors" onClick={() => updateQuantity(item.partId, -1)}>
                                                    {item.quantity === 1 ? <Trash2 size={16} className="text-danger" /> : <Minus size={16} />}
                                                </button>
                                                <span className="px-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
                                                <button className="p-1 hover:bg-gray-100 transition-colors block" onClick={() => updateQuantity(item.partId, 1)}>
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card-footer border-t p-6 bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="mb-4">
                            <label className="input-label mb-1 block">Cliente (Opcional)</label>
                            <select
                                className="input-field w-full"
                                value={selectedCustomerId}
                                onChange={e => setSelectedCustomerId(e.target.value)}
                            >
                                <option value="">Consumidor Final (Sem cadastro)</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="input-label mb-1 block">Forma de Pagamento</label>
                            <select
                                className="input-field w-full"
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                            >
                                <option value="pix">PIX</option>
                                <option value="credit">Cartão de Crédito</option>
                                <option value="debit">Cartão de Débito</option>
                                <option value="cash">Dinheiro</option>
                            </select>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <span className="text-h3 text-muted">Total:</span>
                            <span className="text-h1 text-success">{formatCurrency(cartTotal)}</span>
                        </div>

                        <button
                            className="btn btn-primary w-full justify-center bg-green-600 hover:bg-green-700"
                            style={{ padding: '1rem', fontSize: '1rem' }}
                            disabled={cart.length === 0}
                            onClick={handleCheckout}
                        >
                            Finalizar Venda
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POS;
