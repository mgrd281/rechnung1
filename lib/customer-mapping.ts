
export interface ShopifyOrder {
    email?: string;
    contact_email?: string;
    customer?: {
        email?: string;
        first_name?: string;
        last_name?: string;
        name?: string;
        id?: number | string;
        phone?: string | null;
    } | null;
    billing_address?: {
        first_name?: string;
        last_name?: string;
        name?: string;
        email?: string;
        phone?: string | null;
        address1?: string;
        city?: string;
        zip?: string;
        country_code?: string;
    } | null;
    shipping_address?: {
        first_name?: string;
        last_name?: string;
        name?: string;
        email?: string;
        phone?: string | null;
        address1?: string;
        city?: string;
        zip?: string;
        country_code?: string;
    } | null;
}

/**
 * Robustly derive customer email from any possible field in the Shopify order
 */
export function deriveCustomerEmail(order: any): string | null {
    if (!order) return null;

    // Check all common locations for email
    const candidates = [
        order.email,
        order.contact_email,
        order.customer?.email,
        order.billing_address?.email,
        order.shipping_address?.email,
        order.customer?.email_address,
        order.customer?.default_address?.email
    ];

    for (const email of candidates) {
        if (email && typeof email === 'string' && email.includes('@')) {
            return email.trim().toLowerCase();
        }
    }

    return null;
}

/**
 * Robustly derive customer name from any possible field in the Shopify order
 * Returns an object with the name and a trace string for debugging
 */
export function deriveCustomerName(order: any): { name: string, trace: string } {
    if (!order) {
        return { name: 'Gast', trace: 'Order object is null' };
    }

    const isValidName = (n: any) => n && typeof n === 'string' && n.trim().length >= 1 && n.toLowerCase() !== 'gast' && n.toLowerCase() !== 'unbekannt';

    // Priority 1: Billing Address
    if (order.billing_address) {
        const first = (order.billing_address.first_name || '').trim();
        const last = (order.billing_address.last_name || '').trim();
        const full = (order.billing_address.name || '').trim();

        if (isValidName(first) || isValidName(last)) {
            return { name: `${first} ${last}`.trim(), trace: 'Billing Address (First/Last)' };
        }
        if (isValidName(full)) {
            return { name: full, trace: 'Billing Address (Full Name)' };
        }
    }

    // Priority 2: Shipping Address 
    if (order.shipping_address) {
        const first = (order.shipping_address.first_name || '').trim();
        const last = (order.shipping_address.last_name || '').trim();
        const full = (order.shipping_address.name || '').trim();

        if (isValidName(first) || isValidName(last)) {
            return { name: `${first} ${last}`.trim(), trace: 'Shipping Address (First/Last)' };
        }
        if (isValidName(full)) {
            return { name: full, trace: 'Shipping Address (Full Name)' };
        }
    }

    // Priority 3: Customer object
    if (order.customer) {
        const first = (order.customer.first_name || '').trim();
        const last = (order.customer.last_name || '').trim();
        const full = (order.customer.name || '').trim();

        if (isValidName(first) || isValidName(last)) {
            return { name: `${first} ${last}`.trim(), trace: 'Customer Object (First/Last)' };
        }
        if (isValidName(full)) {
            return { name: full, trace: 'Customer Object (Full Name)' };
        }
    }

    // Priority 4: Fallback to email prefix
    const email = deriveCustomerEmail(order);
    if (email) {
        let prefix = email.split('@')[0];
        // Clean prefix: remove numbers and special chars
        prefix = prefix.replace(/[0-9.+_-]+/g, ' ').trim();
        if (prefix.length >= 1) {
            const derived = prefix.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            return { name: derived, trace: `Email Prefix (${email})` };
        }
        return { name: 'Gast', trace: `Email too short (${email})` };
    }

    return { name: 'Gast', trace: 'No valid fields found' };
}

/**
 * Derive customer phone
 */
export function deriveCustomerPhone(order: any): string | null {
    if (!order) return null;

    const candidates = [
        order.customer?.phone,
        order.billing_address?.phone,
        order.shipping_address?.phone,
        order.phone
    ];

    for (const phone of candidates) {
        if (phone && typeof phone === 'string' && phone.trim().length > 3) {
            return phone.trim();
        }
    }

    return null;
}

/**
 * Determine if guest checkout
 */
export function isGuestCheckout(order: any): boolean {
    if (!order) return true;
    return !order.customer || !order.customer.id;
}
