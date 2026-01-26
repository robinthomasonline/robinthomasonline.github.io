// POS System Application
class POSSystem {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.categories = [];
        this.products = [];
        this.customers = [];
        this.transactions = [];
        this.expenses = [];
        this.shopSettings = {};
        this.cart = [];
        this.editingProductId = null;
        this.editingCustomerId = null;
        this.editingUserId = null;
        this.editingCategoryId = null;
        this.editingExpenseId = null;
        this.barcodeScanner = null;
        this.qrScanner = null;
        
        // Load data
        try {
            this.users = this.loadUsers();
            this.categories = this.loadCategories();
            this.products = this.loadProducts();
            this.customers = this.loadCustomers();
            this.transactions = this.loadTransactions();
            this.expenses = this.loadExpenses();
            this.shopSettings = this.loadShopSettings();
        } catch (error) {
            console.error('Error loading data:', error);
            // Initialize with defaults if loading fails
            this.users = this.loadUsers();
            this.categories = this.loadCategories();
        }
        
        this.init();
    }

    init() {
        // Initialize default users if not exist
        if (this.users.length === 0) {
            this.users = this.loadUsers();
            this.saveUsers();
        }
        
        // Initialize default categories if not exist
        if (this.categories.length === 0) {
            this.categories = this.loadCategories();
            this.saveCategories();
        }
        
        this.checkAuth();
        this.setupEventListeners();
        
        // Only load UI if user is logged in
        if (this.currentUser) {
            this.loadShopSettingsToUI();
            this.renderProducts();
            this.renderCustomers();
            this.renderTransactions();
            this.loadQuickProducts();
        }
    }

    // Authentication
    checkAuth() {
        try {
            const currentUser = localStorage.getItem('posCurrentUser');
            if (currentUser) {
                this.currentUser = JSON.parse(currentUser);
                // Verify user still exists
                const userExists = this.users.find(u => u.id === this.currentUser.id && u.username === this.currentUser.username);
                if (userExists) {
                    this.showMainApp();
                } else {
                    localStorage.removeItem('posCurrentUser');
                    this.currentUser = null;
                    this.showLoginScreen();
                }
            } else {
                this.showLoginScreen();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('posCurrentUser');
            this.currentUser = null;
            this.showLoginScreen();
        }
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        
        // Clear login fields
        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }

    showMainApp() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        const currentUserDisplay = document.getElementById('currentUserDisplay');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'flex';
        if (currentUserDisplay && this.currentUser) {
            currentUserDisplay.textContent = this.currentUser.username;
        }
        
        this.updateUIForRole();
        
        // Load UI components after showing main app
        this.loadShopSettingsToUI();
        this.renderProducts();
        this.renderCustomers();
        this.renderTransactions();
        this.loadQuickProducts();
        this.loadCustomerSelect();
        if (this.currentUser) {
            this.renderUsers();
            this.renderCategories();
        }
    }

    login() {
        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');
        
        if (!usernameInput || !passwordInput) {
            console.error('Login inputs not found');
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            this.showToast('Please enter username and password', 'error');
            return;
        }

        // Ensure users are loaded
        if (!this.users || this.users.length === 0) {
            this.users = this.loadUsers();
            this.saveUsers();
        }

        const user = this.users.find(u => u.username === username && u.password === password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('posCurrentUser', JSON.stringify(user));
            this.showMainApp();
            this.showToast('Login successful!');
        } else {
            this.showToast('Invalid username or password', 'error');
        }
    }

    logout() {
        // Prompt for backup before logout
        if (confirm('Would you like to create a backup before logging out?')) {
            this.exportAllData();
        }
        
        this.currentUser = null;
        localStorage.removeItem('posCurrentUser');
        this.showLoginScreen();
        this.showToast('Logged out successfully');
    }

    updateUIForRole() {
        const role = this.currentUser.role;
        const settingsNav = document.getElementById('settingsNavBtn');
        
        // Only admin and manager can access settings
        if (role === 'admin' || role === 'manager') {
            settingsNav.style.display = 'flex';
        } else {
            settingsNav.style.display = 'none';
        }
    }

    // Local Storage
    loadUsers() {
        const stored = localStorage.getItem('posUsers');
        if (stored) {
            return JSON.parse(stored);
        }
        // Default users
        return [
            { id: 1, username: 'admin', password: 'admin', role: 'admin' },
            { id: 2, username: 'manager', password: 'manager', role: 'manager' },
            { id: 3, username: 'sales', password: 'sales', role: 'sales' }
        ];
    }

    saveUsers() {
        localStorage.setItem('posUsers', JSON.stringify(this.users));
    }

    loadCategories() {
        try {
            const stored = localStorage.getItem('posCategories');
            if (stored) {
                const categories = JSON.parse(stored);
                if (Array.isArray(categories)) {
                    return categories;
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
        
        // Default categories
        return [
            { id: 1, name: 'Electronics', description: 'Electronic items' },
            { id: 2, name: 'Clothing', description: 'Clothing and apparel' },
            { id: 3, name: 'Food & Beverages', description: 'Food and drink items' },
            { id: 4, name: 'General', description: 'General products' }
        ];
    }

    saveCategories() {
        localStorage.setItem('posCategories', JSON.stringify(this.categories));
    }

    loadProducts() {
        const stored = localStorage.getItem('posProducts');
        return stored ? JSON.parse(stored) : [];
    }

    saveProducts() {
        localStorage.setItem('posProducts', JSON.stringify(this.products));
    }

    loadCustomers() {
        const stored = localStorage.getItem('posCustomers');
        return stored ? JSON.parse(stored) : [];
    }

    saveCustomers() {
        localStorage.setItem('posCustomers', JSON.stringify(this.customers));
    }

    loadTransactions() {
        const stored = localStorage.getItem('posTransactions');
        return stored ? JSON.parse(stored) : [];
    }

    saveTransactions() {
        localStorage.setItem('posTransactions', JSON.stringify(this.transactions));
    }

    loadShopSettings() {
        const stored = localStorage.getItem('posShopSettings');
        return stored ? JSON.parse(stored) : {
            shopName: 'My Shop',
            address: '',
            phone: '',
            email: '',
            logo: ''
        };
    }

    saveShopSettings() {
        localStorage.setItem('posShopSettings', JSON.stringify(this.shopSettings));
    }

    // Event Listeners
    setupEventListeners() {
        // Login
        const loginBtn = document.getElementById('loginBtn');
        const loginPassword = document.getElementById('loginPassword');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.login());
        }
        
        if (loginPassword) {
            loginPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.login();
            });
        }

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.switchPage(page);
            });
        });

        // POS
        document.getElementById('scanBarcodeBtn').addEventListener('click', () => this.openBarcodeScanner());
        document.getElementById('scanQRBtn').addEventListener('click', () => this.openQRScanner());
        document.getElementById('addProductByCodeBtn').addEventListener('click', () => this.addProductByCode());
        document.getElementById('productSearchInput').addEventListener('input', (e) => this.searchProducts(e.target.value));
        document.getElementById('clearCartBtn').addEventListener('click', () => this.clearCart());
        document.getElementById('checkoutBtn').addEventListener('click', () => this.openCheckoutModal());
        document.getElementById('addCustomerQuickBtn').addEventListener('click', () => this.openCustomerModal());
        document.getElementById('closeCheckoutModal').addEventListener('click', () => this.closeCheckoutModal());
        document.getElementById('cancelCheckoutBtn').addEventListener('click', () => this.closeCheckoutModal());
        document.getElementById('confirmCheckoutBtn').addEventListener('click', () => this.completeCheckout());
        document.getElementById('paymentMethod').addEventListener('change', (e) => this.handlePaymentMethodChange(e.target.value));
        document.getElementById('cashAmount').addEventListener('input', () => this.calculateReturnAmount());
        document.getElementById('customerSearchInput').addEventListener('input', (e) => this.searchCustomersInPOS(e.target.value));
        document.getElementById('customerSearchInput').addEventListener('focus', (e) => {
            if (e.target.value.trim()) {
                this.searchCustomersInPOS(e.target.value);
            }
        });
        document.getElementById('clearCustomerBtn').addEventListener('click', () => this.clearSelectedCustomer());

        // Products
        document.getElementById('addProductBtn').addEventListener('click', () => this.openProductModal());
        document.getElementById('productsSearchInput').addEventListener('input', (e) => this.filterProducts(e.target.value));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.filterByCategory(e.target.value));

        // Customers
        document.getElementById('addCustomerBtn').addEventListener('click', () => this.openCustomerModal());
        document.getElementById('customersSearchInput').addEventListener('input', (e) => this.filterCustomers(e.target.value));

        // Daybook
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.openExpenseModal());
        document.getElementById('transactionsDateFilter').addEventListener('change', (e) => this.filterTransactions());
        document.getElementById('transactionsTypeFilter').addEventListener('change', (e) => this.filterTransactions());
        document.getElementById('exportTransactionsBtn').addEventListener('click', () => this.exportTransactions());
        document.getElementById('closeExpenseModal').addEventListener('click', () => this.closeExpenseModal());
        document.getElementById('cancelExpenseBtn').addEventListener('click', () => this.closeExpenseModal());
        document.getElementById('saveExpenseBtn').addEventListener('click', () => this.saveExpense());
        document.getElementById('expensePaymentMethod').addEventListener('change', (e) => this.handleExpensePaymentMethodChange(e.target.value));

        // Settings
        document.getElementById('saveShopSettingsBtn').addEventListener('click', () => this.saveShopSettingsToStorage());
        document.getElementById('settingsShopLogo').addEventListener('change', (e) => this.handleLogoUpload(e));
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.openCategoryModal());
        document.getElementById('addUserBtn').addEventListener('click', () => this.openUserModal());
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportAllData());
        document.getElementById('importDataBtn').addEventListener('click', () => document.getElementById('importDataInput').click());
        document.getElementById('importDataInput').addEventListener('change', (e) => this.importAllData(e));
        document.getElementById('clearAllDataBtn').addEventListener('click', () => this.clearAllData());

        // Product Modal
        document.getElementById('closeProductModal').addEventListener('click', () => this.closeProductModal());
        document.getElementById('cancelProductBtn').addEventListener('click', () => this.closeProductModal());
        document.getElementById('saveProductBtn').addEventListener('click', () => this.saveProduct());
        document.getElementById('productImage').addEventListener('change', (e) => this.handleProductImageUpload(e));
        document.getElementById('generateBarcodeBtn').addEventListener('click', () => this.generateBarcode());
        document.getElementById('productMRP').addEventListener('input', () => this.calculateDiscount());
        document.getElementById('productPrice').addEventListener('input', () => this.calculateDiscount());

        // Customer Modal
        document.getElementById('closeCustomerModal').addEventListener('click', () => this.closeCustomerModal());
        document.getElementById('cancelCustomerBtn').addEventListener('click', () => this.closeCustomerModal());
        document.getElementById('saveCustomerBtn').addEventListener('click', () => this.saveCustomer());

        // Category Modal
        document.getElementById('closeCategoryModal').addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('cancelCategoryBtn').addEventListener('click', () => this.closeCategoryModal());
        document.getElementById('saveCategoryBtn').addEventListener('click', () => this.saveCategory());

        // User Modal
        document.getElementById('closeUserModal').addEventListener('click', () => this.closeUserModal());
        document.getElementById('cancelUserBtn').addEventListener('click', () => this.closeUserModal());
        document.getElementById('saveUserBtn').addEventListener('click', () => this.saveUser());

        // Scanner Modals
        document.getElementById('closeBarcodeScannerModal').addEventListener('click', () => this.closeBarcodeScanner());
        document.getElementById('closeQRScannerModal').addEventListener('click', () => this.closeQRScanner());
        document.getElementById('searchByBarcodeBtn').addEventListener('click', () => this.searchByBarcode());
        document.getElementById('searchByQRBtn').addEventListener('click', () => this.searchByQR());
        document.getElementById('manualBarcodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchByBarcode();
        });
        document.getElementById('manualQRInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchByQR();
        });

        // Invoice
        document.getElementById('closeInvoiceModal').addEventListener('click', () => this.closeInvoiceModal());
        document.getElementById('printInvoiceBtn').addEventListener('click', () => window.print());

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Close customer search results when clicking outside
        document.addEventListener('click', (e) => {
            const searchInput = document.getElementById('customerSearchInput');
            const searchResults = document.getElementById('customerSearchResults');
            if (searchInput && searchResults && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove('show');
            }
        });


        // Customer select in POS
        document.getElementById('customerSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                const customer = this.customers.find(c => c.id === parseInt(e.target.value));
                if (customer) {
                    this.selectCustomerInPOS(customer);
                }
            } else {
                this.clearSelectedCustomer();
            }
        });
    }

    // Navigation
    switchPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(`${page}Page`).classList.add('active');
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
    }

    // POS Functions
    searchProducts(query) {
        const resultsContainer = document.getElementById('productSearchResults');
        if (!query.trim()) {
            resultsContainer.classList.remove('show');
            return;
        }

        const filtered = this.products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            (p.code && p.code.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 5);

        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item">No products found</div>';
        } else {
            resultsContainer.innerHTML = filtered.map(product => `
                <div class="search-result-item" onclick="pos.addToCart(${product.id})">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<div style="width:40px;height:40px;background:#e5e7eb;border-radius:6px;"></div>'}
                    <div class="search-result-info">
                        <h4>${product.name}</h4>
                        <p>₹${product.price.toFixed(2)} | Stock: ${product.quantity}</p>
                    </div>
                </div>
            `).join('');
        }
        resultsContainer.classList.add('show');
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        if (product.quantity <= 0) {
            this.showToast('Product out of stock', 'error');
            return;
        }

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            if (existingItem.quantity >= product.quantity) {
                this.showToast('Insufficient stock', 'error');
                return;
            }
            existingItem.quantity++;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image
            });
        }

        document.getElementById('productSearchInput').value = '';
        document.getElementById('productSearchResults').classList.remove('show');
        this.updateCart();
        this.showToast('Product added to cart');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.updateCart();
    }

    updateCartQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            const product = this.products.find(p => p.id === productId);
            if (quantity > product.quantity) {
                this.showToast('Insufficient stock', 'error');
                quantity = product.quantity;
            }
            if (quantity <= 0) {
                this.removeFromCart(productId);
                return;
            }
            item.quantity = quantity;
            this.updateCart();
        }
    }

    updateCart() {
        const cartItems = document.getElementById('cartItems');
        const cartCount = document.getElementById('cartCount');
        const cartSubtotal = document.getElementById('cartSubtotal');
        const cartTax = document.getElementById('cartTax');
        const cartTotal = document.getElementById('cartTotal');

        cartCount.textContent = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Cart is empty. Add products to get started.</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = this.cart.map(item => {
                const total = item.price * item.quantity;
                return `
                    <div class="cart-item">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" class="cart-item-image">` : '<div class="cart-item-image" style="background:#e5e7eb;display:flex;align-items:center;justify-content:center;"><i class="fas fa-box"></i></div>'}
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-details">₹${item.price.toFixed(2)} × ${item.quantity}</div>
                        </div>
                        <div class="cart-item-price">₹${total.toFixed(2)}</div>
                        <div class="cart-item-actions">
                            <div class="quantity-control">
                                <button onclick="pos.updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                <input type="number" value="${item.quantity}" min="1" onchange="pos.updateCartQuantity(${item.id}, parseInt(this.value))">
                                <button onclick="pos.updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                            <button class="cart-item-remove" onclick="pos.removeFromCart(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = 0; // Can be configured later
        const total = subtotal + tax;

        cartSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
        cartTax.textContent = `₹${tax.toFixed(2)}`;
        cartTotal.textContent = `₹${total.toFixed(2)}`;
    }

    clearCart() {
        if (this.cart.length === 0) return;
        if (confirm('Clear cart?')) {
            this.cart = [];
            this.updateCart();
        }
    }

    openCheckoutModal() {
        if (this.cart.length === 0) {
            this.showToast('Cart is empty', 'error');
            return;
        }

        // Check stock availability
        for (const item of this.cart) {
            const product = this.products.find(p => p.id === item.id);
            if (product.quantity < item.quantity) {
                this.showToast(`Insufficient stock for ${product.name}`, 'error');
                return;
            }
        }

        // Calculate totals
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = 0;
        const total = subtotal + tax;

        // Update checkout modal totals
        document.getElementById('checkoutSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('checkoutTax').textContent = `₹${tax.toFixed(2)}`;
        document.getElementById('checkoutTotal').textContent = `₹${total.toFixed(2)}`;

        // Reset payment fields
        document.getElementById('paymentMethod').value = '';
        document.getElementById('cashAmount').value = '';
        document.getElementById('paymentReference').value = '';
        document.getElementById('cashAmountGroup').style.display = 'none';
        document.getElementById('paymentReferenceGroup').style.display = 'none';
        document.getElementById('returnAmountDisplay').style.display = 'none';

        // Show modal
        document.getElementById('checkoutModal').classList.add('active');
    }

    closeCheckoutModal() {
        document.getElementById('checkoutModal').classList.remove('active');
    }

    handlePaymentMethodChange(method) {
        const cashAmountGroup = document.getElementById('cashAmountGroup');
        const paymentReferenceGroup = document.getElementById('paymentReferenceGroup');
        const cashAmountInput = document.getElementById('cashAmount');
        const returnAmountDisplay = document.getElementById('returnAmountDisplay');

        if (method === 'cash') {
            cashAmountGroup.style.display = 'block';
            paymentReferenceGroup.style.display = 'none';
            cashAmountInput.required = true;
            cashAmountInput.value = '';
            returnAmountDisplay.style.display = 'none';
        } else if (method === 'card' || method === 'upi') {
            cashAmountGroup.style.display = 'none';
            paymentReferenceGroup.style.display = 'block';
            cashAmountInput.required = false;
            returnAmountDisplay.style.display = 'none';
        } else if (method === 'credit') {
            cashAmountGroup.style.display = 'none';
            paymentReferenceGroup.style.display = 'none';
            cashAmountInput.required = false;
            returnAmountDisplay.style.display = 'none';
        } else {
            cashAmountGroup.style.display = 'none';
            paymentReferenceGroup.style.display = 'none';
            cashAmountInput.required = false;
            returnAmountDisplay.style.display = 'none';
        }
    }

    calculateReturnAmount() {
        const totalText = document.getElementById('checkoutTotal').textContent;
        const total = parseFloat(totalText.replace('₹', '').replace(',', '')) || 0;
        const cashReceived = parseFloat(document.getElementById('cashAmount').value) || 0;
        const returnAmount = cashReceived - total;

        const returnAmountDisplay = document.getElementById('returnAmountDisplay');
        const returnAmountText = document.getElementById('returnAmount');

        if (cashReceived > 0 && returnAmount > 0) {
            returnAmountText.textContent = `₹${returnAmount.toFixed(2)}`;
            returnAmountDisplay.style.display = 'flex';
        } else {
            returnAmountDisplay.style.display = 'none';
        }
    }

    completeCheckout() {
        const paymentMethod = document.getElementById('paymentMethod').value;
        if (!paymentMethod) {
            this.showToast('Please select a payment method', 'error');
            return;
        }

        const totalText = document.getElementById('checkoutTotal').textContent;
        const total = parseFloat(totalText.replace('₹', '').replace(',', '')) || 0;
        const customerId = document.getElementById('customerSelect').value;
        const customer = customerId ? this.customers.find(c => c.id === parseInt(customerId)) : null;

        let paymentData = {
            method: paymentMethod,
            amount: total,
            cashReceived: null,
            returnAmount: null,
            reference: null
        };

        if (paymentMethod === 'cash') {
            const cashReceived = parseFloat(document.getElementById('cashAmount').value);
            if (!cashReceived || cashReceived < total) {
                this.showToast('Cash received must be equal to or greater than total amount', 'error');
                return;
            }
            paymentData.cashReceived = cashReceived;
            paymentData.returnAmount = cashReceived - total;
        } else if (paymentMethod === 'card' || paymentMethod === 'upi') {
            paymentData.reference = document.getElementById('paymentReference').value.trim();
        }

        // Create transaction
        const transaction = {
            id: Date.now(),
            invoiceNumber: this.generateInvoiceNumber(),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
            customerId: customerId ? parseInt(customerId) : null,
            customerName: customer ? customer.name : 'Walk-in Customer',
            items: this.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            subtotal: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            tax: 0,
            total: total,
            payment: paymentData,
            userId: this.currentUser.id,
            userName: this.currentUser.username
        };

        // Update product quantities
        for (const item of this.cart) {
            const product = this.products.find(p => p.id === item.id);
            product.quantity -= item.quantity;
        }

        this.transactions.push(transaction);
        this.saveTransactions();
        this.saveProducts();

        // Close checkout modal
        this.closeCheckoutModal();

        // Generate invoice
        this.generateInvoice(transaction);

        // Clear cart
        this.cart = [];
        this.updateCart();
        this.clearSelectedCustomer();

        this.renderTransactions();
        this.renderProducts();
        this.showToast('Transaction completed successfully!');
    }

    generateInvoiceNumber() {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `INV-${dateStr}-${random}`;
    }

    generateInvoice(transaction) {
        const invoiceBody = document.getElementById('invoiceBody');
        const shopName = this.shopSettings.shopName || 'My Shop';
        const address = this.shopSettings.address || '';
        const email = this.shopSettings.email || '';
        const phone = this.shopSettings.phone || '';

        const payment = transaction.payment || { method: 'cash', amount: transaction.total };
        const paymentMethodLabels = {
            cash: 'Cash',
            card: 'Card',
            upi: 'UPI',
            credit: 'Credit (Not Paid)'
        };

        invoiceBody.innerHTML = `
            <div class="invoice-header">
                <h1>INVOICE</h1>
                <p>Invoice #${transaction.invoiceNumber}</p>
            </div>
            
            <div class="invoice-details">
                <div class="invoice-shop-info">
                    <h3>${shopName}</h3>
                    ${address ? `<p>${address.replace(/\n/g, '<br>')}</p>` : ''}
                    ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
                    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                </div>
                <div>
                    <p><strong>Invoice Date:</strong> ${this.formatDate(transaction.date)}</p>
                    <p><strong>Time:</strong> ${transaction.time}</p>
                    <p><strong>Customer:</strong> ${transaction.customerName}</p>
                    <p><strong>Cashier:</strong> ${transaction.userName}</p>
                </div>
            </div>
            
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${transaction.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.price.toFixed(2)}</td>
                            <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                        <td><strong>₹${transaction.subtotal.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Tax:</strong></td>
                        <td><strong>₹${transaction.tax.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                        <td><strong style="color: var(--primary-color); font-size: 1.25rem;">₹${transaction.total.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="invoice-payment-details">
                <h3>Payment Details</h3>
                <div class="payment-info-row">
                    <span><strong>Payment Method:</strong></span>
                    <span>${paymentMethodLabels[payment.method] || payment.method}</span>
                </div>
                ${payment.cashReceived ? `
                    <div class="payment-info-row">
                        <span><strong>Cash Received:</strong></span>
                        <span>₹${payment.cashReceived.toFixed(2)}</span>
                    </div>
                ` : ''}
                ${payment.returnAmount && payment.returnAmount > 0 ? `
                    <div class="payment-info-row return-amount-row">
                        <span><strong>Return Amount:</strong></span>
                        <span style="color: var(--success-color); font-weight: 700;">₹${payment.returnAmount.toFixed(2)}</span>
                    </div>
                ` : ''}
                ${payment.reference ? `
                    <div class="payment-info-row">
                        <span><strong>Reference/Transaction ID:</strong></span>
                        <span>${payment.reference}</span>
                    </div>
                ` : ''}
                ${payment.method === 'credit' ? `
                    <div class="payment-info-row credit-note">
                        <span style="color: var(--warning-color);"><strong>⚠️ Credit Transaction - Payment Pending</strong></span>
                    </div>
                ` : ''}
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 0.875rem;">
                <p>Thank you for your business!</p>
            </div>
        `;

        document.getElementById('invoiceModal').classList.add('active');
    }

    closeInvoiceModal() {
        document.getElementById('invoiceModal').classList.remove('active');
    }

    // Barcode/QR Scanner
    openBarcodeScanner() {
        document.getElementById('barcodeScannerModal').classList.add('active');
        // Initialize scanner if needed
    }

    closeBarcodeScanner() {
        document.getElementById('barcodeScannerModal').classList.remove('active');
        if (this.barcodeScanner) {
            this.barcodeScanner.stop();
            this.barcodeScanner = null;
        }
    }

    openQRScanner() {
        document.getElementById('qrScannerModal').classList.add('active');
        this.initQRScanner();
    }

    initQRScanner() {
        const container = document.getElementById('qrScannerContainer');
        if (this.qrScanner) {
            this.qrScanner.stop().catch(() => {});
        }

        try {
            this.qrScanner = new Html5Qrcode('qrScannerContainer');
            this.qrScanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    this.handleScannedCode(decodedText);
                    this.closeQRScanner();
                },
                (errorMessage) => {
                    // Ignore errors
                }
            ).catch(err => {
                console.error('QR Scanner error:', err);
                this.showToast('Camera access denied or not available. Use manual entry instead.', 'error');
            });
        } catch (err) {
            console.error('QR Scanner initialization error:', err);
            this.showToast('QR Scanner not available. Use manual entry instead.', 'error');
        }
    }

    closeQRScanner() {
        document.getElementById('qrScannerModal').classList.remove('active');
        if (this.qrScanner) {
            this.qrScanner.stop().then(() => {
                this.qrScanner.clear();
                this.qrScanner = null;
            }).catch(err => {
                console.error('Error stopping scanner:', err);
                this.qrScanner = null;
            });
        }
    }

    searchByBarcode() {
        const code = document.getElementById('manualBarcodeInput').value.trim();
        if (code) {
            this.handleScannedCode(code);
            document.getElementById('manualBarcodeInput').value = '';
        }
    }

    searchByQR() {
        const code = document.getElementById('manualQRInput').value.trim();
        if (code) {
            this.handleScannedCode(code);
            document.getElementById('manualQRInput').value = '';
        }
    }

    handleScannedCode(code) {
        const product = this.products.find(p => p.code === code);
        if (product) {
            this.addToCart(product.id);
        } else {
            this.showToast('Product not found', 'error');
        }
    }

    addProductByCode() {
        const code = prompt('Enter product code:');
        if (code) {
            this.handleScannedCode(code);
        }
    }

    generateBarcode() {
        const code = 'PRD' + Date.now().toString().slice(-10);
        document.getElementById('productCode').value = code;
    }

    // Product Management
    openProductModal(productId = null) {
        this.editingProductId = productId;
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        
        if (productId) {
            const product = this.products.find(p => p.id === productId);
            if (product) {
                title.innerHTML = '<i class="fas fa-edit"></i> Edit Product';
                document.getElementById('productName').value = product.name;
                document.getElementById('productCode').value = product.code || '';
                document.getElementById('productCategory').value = product.category || '';
                document.getElementById('productType').value = product.type || 'product';
                document.getElementById('productMRP').value = product.mrp || product.price || '';
                document.getElementById('productPrice').value = product.price || '';
                document.getElementById('productQuantity').value = product.quantity;
                document.getElementById('productDescription').value = product.description || '';
                if (product.image) {
                    document.getElementById('productImagePreview').innerHTML = `<img src="${product.image}" alt="Preview">`;
                }
                this.calculateDiscount();
            }
        } else {
            title.innerHTML = '<i class="fas fa-box"></i> Add Product';
            document.getElementById('productName').value = '';
            document.getElementById('productCode').value = '';
            document.getElementById('productCategory').value = '';
            document.getElementById('productType').value = 'product';
            document.getElementById('productMRP').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productQuantity').value = '';
            document.getElementById('productDescription').value = '';
            document.getElementById('productImagePreview').innerHTML = '';
            document.getElementById('productDiscount').value = '';
        }

        this.populateCategorySelect();
        modal.classList.add('active');
    }

    calculateDiscount() {
        const mrp = parseFloat(document.getElementById('productMRP').value) || 0;
        const salePrice = parseFloat(document.getElementById('productPrice').value) || 0;
        const discountInput = document.getElementById('productDiscount');
        
        if (mrp > 0 && salePrice > 0) {
            const discount = ((mrp - salePrice) / mrp) * 100;
            discountInput.value = discount.toFixed(2);
        } else {
            discountInput.value = '';
        }
    }

    closeProductModal() {
        document.getElementById('productModal').classList.remove('active');
        this.editingProductId = null;
    }

    populateCategorySelect() {
        const select = document.getElementById('productCategory');
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Category</option>';
        
        if (this.categories && Array.isArray(this.categories)) {
            this.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
        
        if (currentValue) {
            select.value = currentValue;
        }
    }

    handleProductImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('productImagePreview').innerHTML = `<img src="${event.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    }

    saveProduct() {
        const name = document.getElementById('productName').value.trim();
        const code = document.getElementById('productCode').value.trim();
        const category = document.getElementById('productCategory').value.trim();
        const type = document.getElementById('productType').value;
        const mrp = parseFloat(document.getElementById('productMRP').value);
        const price = parseFloat(document.getElementById('productPrice').value);
        const quantity = parseInt(document.getElementById('productQuantity').value);
        const description = document.getElementById('productDescription').value.trim();
        const imageFile = document.getElementById('productImage').files[0];

        if (!name || !mrp || !price || isNaN(quantity)) {
            this.showToast('Please fill all required fields', 'error');
            return;
        }

        if (price > mrp) {
            this.showToast('Sale price cannot be greater than MRP', 'error');
            return;
        }

        const getImageData = (callback) => {
            if (imageFile) {
                const reader = new FileReader();
                reader.onload = (e) => callback(e.target.result);
                reader.readAsDataURL(imageFile);
            } else if (this.editingProductId) {
                const existing = this.products.find(p => p.id === this.editingProductId);
                callback(existing ? existing.image : '');
            } else {
                callback('');
            }
        };

        getImageData((image) => {
            const discount = mrp > 0 ? ((mrp - price) / mrp) * 100 : 0;
            const productData = {
                name,
                code: code || `PRD${Date.now()}`,
                category,
                type,
                mrp,
                price,
                discount: discount.toFixed(2),
                quantity,
                description,
                image
            };

            if (this.editingProductId) {
                const index = this.products.findIndex(p => p.id === this.editingProductId);
                if (index !== -1) {
                    this.products[index] = { ...this.products[index], ...productData };
                }
                this.showToast('Product updated successfully!');
            } else {
                productData.id = Date.now();
                this.products.push(productData);
                this.showToast('Product added successfully!');
            }

            this.saveProducts();
            this.renderProducts();
            this.loadQuickProducts();
            this.updateCategoryFilter();
            this.closeProductModal();
        });
    }

    deleteProduct(productId) {
        if (confirm('Delete this product?')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            this.renderProducts();
            this.loadQuickProducts();
            this.updateCategoryFilter();
            this.showToast('Product deleted');
        }
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        this.updateCategoryFilter();
        
        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-box"></i><p>No products. Add your first product!</p></div>';
            return;
        }

        grid.innerHTML = this.products.map(product => {
            const mrp = product.mrp || product.price;
            const salePrice = product.price;
            const hasDiscount = mrp > salePrice;
            return `
            <div class="product-card" onclick="pos.addToCart(${product.id})">
                ${product.image ? `<img src="${product.image}" alt="${product.name}" class="product-card-image">` : `<div class="product-card-image" style="background:#e5e7eb;display:flex;align-items:center;justify-content:center;"><i class="fas fa-box" style="font-size:3rem;color:#9ca3af;"></i></div>`}
                <div class="product-card-info">
                    <h3>${product.name}</h3>
                    <p>${product.category || 'Uncategorized'}</p>
                    <div class="product-card-footer">
                        <div>
                            <div class="product-price-container">
                                ${hasDiscount ? `<span class="product-mrp">₹${mrp.toFixed(2)}</span>` : ''}
                                <span class="product-price">₹${salePrice.toFixed(2)}</span>
                                ${hasDiscount ? `<span class="product-discount-badge">${product.discount || ((mrp - salePrice) / mrp * 100).toFixed(0)}% OFF</span>` : ''}
                            </div>
                            <div class="product-quantity">Stock: ${product.quantity}</div>
                        </div>
                        <div class="product-actions">
                            <button class="action-btn edit" onclick="event.stopPropagation(); pos.openProductModal(${product.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="event.stopPropagation(); pos.deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    filterProducts(query) {
        // This will be handled by search
    }

    updateCategoryFilter() {
        const select = document.getElementById('categoryFilter');
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Categories</option>';
        
        if (this.categories && Array.isArray(this.categories)) {
            this.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
        
        if (currentValue && this.categories && this.categories.some(c => c.name === currentValue)) {
            select.value = currentValue;
        }
    }

    filterByCategory(category) {
        const grid = document.getElementById('productsGrid');
        const filtered = category ? this.products.filter(p => p.category === category) : this.products;
        
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-box"></i><p>No products in this category</p></div>';
            return;
        }

        grid.innerHTML = filtered.map(product => {
            const mrp = product.mrp || product.price;
            const salePrice = product.price;
            const hasDiscount = mrp > salePrice;
            return `
            <div class="product-card" onclick="pos.addToCart(${product.id})">
                ${product.image ? `<img src="${product.image}" alt="${product.name}" class="product-card-image">` : `<div class="product-card-image" style="background:#e5e7eb;display:flex;align-items:center;justify-content:center;"><i class="fas fa-box" style="font-size:3rem;color:#9ca3af;"></i></div>`}
                <div class="product-card-info">
                    <h3>${product.name}</h3>
                    <p>${product.category || 'Uncategorized'}</p>
                    <div class="product-card-footer">
                        <div>
                            <div class="product-price-container">
                                ${hasDiscount ? `<span class="product-mrp">₹${mrp.toFixed(2)}</span>` : ''}
                                <span class="product-price">₹${salePrice.toFixed(2)}</span>
                                ${hasDiscount ? `<span class="product-discount-badge">${product.discount || ((mrp - salePrice) / mrp * 100).toFixed(0)}% OFF</span>` : ''}
                            </div>
                            <div class="product-quantity">Stock: ${product.quantity}</div>
                        </div>
                        <div class="product-actions">
                            <button class="action-btn edit" onclick="event.stopPropagation(); pos.openProductModal(${product.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="event.stopPropagation(); pos.deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    loadQuickProducts() {
        const grid = document.getElementById('quickProductsGrid');
        const quickProducts = this.products.slice(0, 8);
        
        if (quickProducts.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-secondary);">No products available</p>';
            return;
        }

        grid.innerHTML = quickProducts.map(product => {
            const mrp = product.mrp || product.price;
            const salePrice = product.price;
            const hasDiscount = mrp > salePrice;
            return `
            <div class="quick-product-item" onclick="pos.addToCart(${product.id})">
                ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<div style="width:100%;height:80px;background:#e5e7eb;border-radius:6px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-box"></i></div>'}
                <p>${product.name}</p>
                <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
                    ${hasDiscount ? `<span style="text-decoration:line-through;color:var(--text-secondary);font-size:0.7rem;">₹${mrp.toFixed(2)}</span>` : ''}
                    <span style="font-weight:600;color:var(--primary-color);">₹${salePrice.toFixed(2)}</span>
                </div>
            </div>
        `;
        }).join('');
    }

    // Customer Management
    openCustomerModal(customerId = null) {
        this.editingCustomerId = customerId;
        const modal = document.getElementById('customerModal');
        const title = document.getElementById('customerModalTitle');
        
        if (customerId) {
            const customer = this.customers.find(c => c.id === customerId);
            if (customer) {
                title.innerHTML = '<i class="fas fa-user-edit"></i> Edit Customer';
                document.getElementById('customerName').value = customer.name;
                document.getElementById('customerPhone').value = customer.phone || '';
                document.getElementById('customerEmail').value = customer.email || '';
                document.getElementById('customerAddress').value = customer.address || '';
            }
        } else {
            title.innerHTML = '<i class="fas fa-user-plus"></i> Add Customer';
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            document.getElementById('customerEmail').value = '';
            document.getElementById('customerAddress').value = '';
        }

        modal.classList.add('active');
    }

    closeCustomerModal() {
        document.getElementById('customerModal').classList.remove('active');
        this.editingCustomerId = null;
    }

    saveCustomer() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const email = document.getElementById('customerEmail').value.trim();
        const address = document.getElementById('customerAddress').value.trim();

        if (!name) {
            this.showToast('Please enter customer name', 'error');
            return;
        }

        const customerData = { name, phone, email, address };

        if (this.editingCustomerId) {
            const index = this.customers.findIndex(c => c.id === this.editingCustomerId);
            if (index !== -1) {
                this.customers[index] = { ...this.customers[index], ...customerData };
            }
            this.showToast('Customer updated successfully!');
        } else {
            customerData.id = Date.now();
            this.customers.push(customerData);
            this.showToast('Customer added successfully!');
        }

        this.saveCustomers();
        this.renderCustomers();
        this.loadCustomerSelect();
        this.closeCustomerModal();
    }

    deleteCustomer(customerId) {
        if (confirm('Delete this customer?')) {
            this.customers = this.customers.filter(c => c.id !== customerId);
            this.saveCustomers();
            this.renderCustomers();
            this.loadCustomerSelect();
            this.showToast('Customer deleted');
        }
    }

    renderCustomers() {
        const tbody = document.getElementById('customersTableBody');
        if (this.customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-secondary);">No customers. Add your first customer!</td></tr>';
            return;
        }

        tbody.innerHTML = this.customers.map(customer => `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.phone || '-'}</td>
                <td>${customer.email || '-'}</td>
                <td>${customer.address || '-'}</td>
                <td>
                    <div class="product-actions">
                        <button class="action-btn edit" onclick="pos.openCustomerModal(${customer.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete" onclick="pos.deleteCustomer(${customer.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterCustomers(query) {
        const tbody = document.getElementById('customersTableBody');
        const filtered = query.trim() ? 
            this.customers.filter(c => 
                c.name.toLowerCase().includes(query.toLowerCase()) ||
                (c.phone && c.phone.includes(query)) ||
                (c.email && c.email.toLowerCase().includes(query.toLowerCase()))
            ) : this.customers;

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-secondary);">No customers found</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(customer => `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.phone || '-'}</td>
                <td>${customer.email || '-'}</td>
                <td>${customer.address || '-'}</td>
                <td>
                    <div class="product-actions">
                        <button class="action-btn edit" onclick="pos.openCustomerModal(${customer.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete" onclick="pos.deleteCustomer(${customer.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    loadCustomerSelect() {
        const select = document.getElementById('customerSelect');
        select.innerHTML = '<option value="">Walk-in Customer</option>';
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
    }

    searchCustomersInPOS(query) {
        const resultsContainer = document.getElementById('customerSearchResults');
        if (!query.trim()) {
            resultsContainer.classList.remove('show');
            return;
        }

        const filtered = this.customers.filter(c => 
            (c.phone && c.phone.includes(query)) ||
            c.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<div class="customer-search-result-item">No customers found</div>';
        } else {
            resultsContainer.innerHTML = filtered.map(customer => `
                <div class="customer-search-result-item" onclick="pos.selectCustomerInPOSById(${customer.id})">
                    <h4>${customer.name}</h4>
                    <p>${customer.phone || 'No phone'}${customer.email ? ' • ' + customer.email : ''}</p>
                </div>
            `).join('');
        }
        resultsContainer.classList.add('show');
    }

    selectCustomerInPOS(customer) {
        // Hide search results
        document.getElementById('customerSearchResults').classList.remove('show');
        document.getElementById('customerSearchInput').value = '';

        // Set customer in select dropdown
        document.getElementById('customerSelect').value = customer.id;

        // Show selected customer info
        document.getElementById('selectedCustomerName').textContent = customer.name;
        document.getElementById('selectedCustomerPhone').textContent = customer.phone ? `📞 ${customer.phone}` : '';
        document.getElementById('selectedCustomerEmail').textContent = customer.email ? `✉️ ${customer.email}` : '';
        
        const selectedInfo = document.getElementById('selectedCustomerInfo');
        selectedInfo.style.display = 'block';

        // Hide select dropdown when customer is selected
        document.querySelector('.customer-select').style.display = 'none';
    }

    selectCustomerInPOSById(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            this.selectCustomerInPOS(customer);
        }
    }

    clearSelectedCustomer() {
        document.getElementById('customerSelect').value = '';
        document.getElementById('selectedCustomerInfo').style.display = 'none';
        document.getElementById('customerSearchInput').value = '';
        document.getElementById('customerSearchResults').classList.remove('show');
        document.querySelector('.customer-select').style.display = 'flex';
    }

    // Transactions (Sales + Expenses)
    getDateRange(filter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch(filter) {
            case 'today':
                return {
                    start: today,
                    end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'yesterday':
                const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                return {
                    start: yesterday,
                    end: today
                };
            case 'thisWeek':
                const dayOfWeek = now.getDay();
                const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
                return {
                    start: startOfWeek,
                    end: new Date(now.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'lastWeek':
                const lastWeekStart = new Date(today.getTime() - (dayOfWeek + 7) * 24 * 60 * 60 * 1000);
                const lastWeekEnd = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
                return {
                    start: lastWeekStart,
                    end: lastWeekEnd
                };
            case 'thisMonth':
                return {
                    start: new Date(now.getFullYear(), now.getMonth(), 1),
                    end: new Date(now.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'lastMonth':
                return {
                    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                    end: new Date(now.getFullYear(), now.getMonth(), 1)
                };
            case 'last3Months':
                return {
                    start: new Date(now.getFullYear(), now.getMonth() - 3, 1),
                    end: new Date(now.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'last6Months':
                return {
                    start: new Date(now.getFullYear(), now.getMonth() - 6, 1),
                    end: new Date(now.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'last12Months':
                return {
                    start: new Date(now.getFullYear(), now.getMonth() - 12, 1),
                    end: new Date(now.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'lastYear':
                return {
                    start: new Date(now.getFullYear() - 1, 0, 1),
                    end: new Date(now.getFullYear(), 0, 1)
                };
            default:
                return null;
        }
    }

    filterTransactions() {
        this.renderTransactions();
    }

    renderTransactions() {
        this.loadCustomerSelect();
        const tbody = document.getElementById('transactionsTableBody');
        const dateFilter = document.getElementById('transactionsDateFilter').value;
        const typeFilter = document.getElementById('transactionsTypeFilter').value;
        
        // Combine transactions and expenses
        let allEntries = [];
        
        // Add sales transactions
        if (typeFilter === 'all' || typeFilter === 'sales') {
            this.transactions.forEach(t => {
                allEntries.push({
                    type: 'sale',
                    id: t.id,
                    date: t.date,
                    time: t.time,
                    reference: t.invoiceNumber,
                    customer: t.customerName,
                    description: `${t.items.length} item(s)`,
                    amount: t.total,
                    payment: t.payment || { method: 'cash' },
                    data: t
                });
            });
        }
        
        // Add expenses
        if (typeFilter === 'all' || typeFilter === 'expenses') {
            this.expenses.forEach(e => {
                allEntries.push({
                    type: 'expense',
                    id: e.id,
                    date: e.date,
                    time: e.time,
                    reference: e.reference || '-',
                    customer: e.vendor || '-',
                    description: e.description,
                    amount: e.amount,
                    payment: { method: e.paymentMethod || 'cash', reference: e.reference },
                    category: e.category,
                    data: e
                });
            });
        }

        // Apply date filter
        if (dateFilter !== 'all') {
            const dateRange = this.getDateRange(dateFilter);
            if (dateRange) {
                allEntries = allEntries.filter(entry => {
                    const entryDate = new Date(entry.date + 'T' + entry.time);
                    return entryDate >= dateRange.start && entryDate < dateRange.end;
                });
            }
        }

        // Sort by date descending
        allEntries.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateB - dateA;
        });

        // Calculate summary
        const sales = allEntries.filter(e => e.type === 'sale');
        const expenses = allEntries.filter(e => e.type === 'expense');
        const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netBalance = totalSales - totalExpenses;
        
        document.getElementById('totalSales').textContent = `₹${totalSales.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toFixed(2)}`;
        document.getElementById('netBalance').textContent = `₹${netBalance.toFixed(2)}`;
        document.getElementById('totalTransactions').textContent = allEntries.length;

        // Update net balance color
        const netBalanceEl = document.getElementById('netBalance');
        netBalanceEl.style.color = netBalance >= 0 ? 'var(--success-color)' : 'var(--danger-color)';

        if (allEntries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-secondary);">No transactions found</td></tr>';
            return;
        }

        const paymentMethodLabels = {
            cash: 'Cash',
            card: 'Card',
            upi: 'UPI',
            bank: 'Bank',
            credit: 'Credit'
        };

        tbody.innerHTML = allEntries.map(entry => {
            const payment = entry.payment || { method: 'cash' };
            const paymentLabel = paymentMethodLabels[payment.method] || payment.method;
            const paymentBadge = entry.type === 'expense' ? 'expense-badge' : 
                                payment.method === 'credit' ? 'credit-badge' : 
                                payment.method === 'cash' ? 'cash-badge' : 'other-badge';
            
            return `
            <tr>
                <td>
                    <span class="entry-type ${entry.type === 'sale' ? 'sale' : 'expense'}">
                        ${entry.type === 'sale' ? 'Sale' : 'Expense'}
                    </span>
                </td>
                <td>${this.formatDate(entry.date)} ${entry.time}</td>
                <td>${entry.reference}</td>
                <td>${entry.customer}</td>
                <td>${entry.description}</td>
                <td>
                    <strong style="color: ${entry.type === 'sale' ? 'var(--success-color)' : 'var(--danger-color)'};">
                        ${entry.type === 'sale' ? '+' : '-'}₹${entry.amount.toFixed(2)}
                    </strong>
                </td>
                <td>
                    <span class="payment-badge ${paymentBadge}">${paymentLabel}</span>
                </td>
                <td>
                    ${entry.type === 'sale' ? `
                        <button class="action-btn view" onclick="pos.viewInvoice(${entry.id})">
                            <i class="fas fa-file-invoice"></i> View
                        </button>
                    ` : `
                        <button class="action-btn edit" onclick="pos.openExpenseModal(${entry.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete" onclick="pos.deleteExpense(${entry.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    `}
                </td>
            </tr>
        `;
        }).join('');
    }

    viewInvoice(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction) {
            this.generateInvoice(transaction);
        }
    }

    openExpenseModal(expenseId = null) {
        this.editingExpenseId = expenseId;
        const modal = document.getElementById('expenseModal');
        const title = document.getElementById('expenseModalTitle');
        
        // Set default date and time
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().slice(0, 5);
        
        if (expenseId) {
            const expense = this.expenses.find(e => e.id === expenseId);
            if (expense) {
                title.innerHTML = '<i class="fas fa-edit"></i> Edit Expense';
                document.getElementById('expenseDate').value = expense.date;
                document.getElementById('expenseTime').value = expense.time;
                document.getElementById('expenseVendor').value = expense.vendor || '';
                document.getElementById('expenseDescription').value = expense.description;
                document.getElementById('expenseCategory').value = expense.category || '';
                document.getElementById('expenseAmount').value = expense.amount;
                document.getElementById('expensePaymentMethod').value = expense.paymentMethod || 'cash';
                document.getElementById('expenseReference').value = expense.reference || '';
                this.handleExpensePaymentMethodChange(expense.paymentMethod || 'cash');
            }
        } else {
            title.innerHTML = '<i class="fas fa-minus-circle"></i> Add Expense';
            document.getElementById('expenseDate').value = dateStr;
            document.getElementById('expenseTime').value = timeStr;
            document.getElementById('expenseVendor').value = '';
            document.getElementById('expenseDescription').value = '';
            document.getElementById('expenseCategory').value = '';
            document.getElementById('expenseAmount').value = '';
            document.getElementById('expensePaymentMethod').value = 'cash';
            document.getElementById('expenseReference').value = '';
            this.handleExpensePaymentMethodChange('cash');
        }

        modal.classList.add('active');
    }

    closeExpenseModal() {
        document.getElementById('expenseModal').classList.remove('active');
        this.editingExpenseId = null;
    }

    handleExpensePaymentMethodChange(method) {
        const referenceGroup = document.getElementById('expenseReferenceGroup');
        if (method === 'card' || method === 'upi' || method === 'bank') {
            referenceGroup.style.display = 'block';
        } else {
            referenceGroup.style.display = 'none';
        }
    }

    saveExpense() {
        const date = document.getElementById('expenseDate').value;
        const time = document.getElementById('expenseTime').value;
        const vendor = document.getElementById('expenseVendor').value.trim();
        const description = document.getElementById('expenseDescription').value.trim();
        const category = document.getElementById('expenseCategory').value.trim();
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const paymentMethod = document.getElementById('expensePaymentMethod').value;
        const reference = document.getElementById('expenseReference').value.trim();

        if (!description || !amount || amount <= 0) {
            this.showToast('Please fill all required fields', 'error');
            return;
        }

        const expenseData = {
            date,
            time,
            vendor,
            description,
            category,
            amount,
            paymentMethod,
            reference
        };

        if (this.editingExpenseId) {
            const index = this.expenses.findIndex(e => e.id === this.editingExpenseId);
            if (index !== -1) {
                this.expenses[index] = { ...this.expenses[index], ...expenseData };
            }
            this.showToast('Expense updated successfully!');
        } else {
            expenseData.id = Date.now();
            expenseData.reference = expenseData.reference || `EXP-${Date.now()}`;
            this.expenses.push(expenseData);
            this.showToast('Expense added successfully!');
        }

        this.saveExpenses();
        this.renderTransactions();
        this.closeExpenseModal();
    }

    deleteExpense(expenseId) {
        if (confirm('Delete this expense?')) {
            this.expenses = this.expenses.filter(e => e.id !== expenseId);
            this.saveExpenses();
            this.renderTransactions();
            this.showToast('Expense deleted');
        }
    }

    exportTransactions() {
        const dateFilter = document.getElementById('transactionsDateFilter').value;
        const typeFilter = document.getElementById('transactionsTypeFilter').value;
        
        // Get filtered data
        let allEntries = [];
        
        if (typeFilter === 'all' || typeFilter === 'sales') {
            this.transactions.forEach(t => {
                allEntries.push({
                    type: 'Sale',
                    date: t.date,
                    time: t.time,
                    reference: t.invoiceNumber,
                    customer: t.customerName,
                    description: `${t.items.length} item(s)`,
                    amount: t.total,
                    payment: t.payment || { method: 'cash' }
                });
            });
        }
        
        if (typeFilter === 'all' || typeFilter === 'expenses') {
            this.expenses.forEach(e => {
                allEntries.push({
                    type: 'Expense',
                    date: e.date,
                    time: e.time,
                    reference: e.reference || '-',
                    customer: e.vendor || '-',
                    description: e.description,
                    amount: e.amount,
                    payment: { method: e.paymentMethod || 'cash', reference: e.reference },
                    category: e.category
                });
            });
        }

        // Apply date filter
        if (dateFilter !== 'all') {
            const dateRange = this.getDateRange(dateFilter);
            if (dateRange) {
                allEntries = allEntries.filter(entry => {
                    const entryDate = new Date(entry.date + 'T' + entry.time);
                    return entryDate >= dateRange.start && entryDate < dateRange.end;
                });
            }
        }

        // Sort by date
        allEntries.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateB - dateA;
        });

        try {
            const wb = XLSX.utils.book_new();

            // Summary sheet
            const sales = allEntries.filter(e => e.type === 'Sale');
            const expenses = allEntries.filter(e => e.type === 'Expense');
            const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
            const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
            const netBalance = totalSales - totalExpenses;
            
            const summaryData = [{
                'Date Filter': dateFilter,
                'Type Filter': typeFilter,
                'Total Sales': totalSales,
                'Total Expenses': totalExpenses,
                'Net Balance': netBalance,
                'Total Transactions': allEntries.length,
                'Export Date': new Date().toISOString()
            }];
            const summaryWS = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

            // Transactions sheet
            const transactionsData = allEntries.map(t => ({
                'Type': t.type,
                'Date': t.date,
                'Time': t.time,
                'Reference': t.reference,
                'Customer/Vendor': t.customer,
                'Description': t.description,
                'Category': t.category || '',
                'Amount': t.amount,
                'Payment Method': t.payment.method,
                'Reference': t.payment.reference || ''
            }));
            const transactionsWS = XLSX.utils.json_to_sheet(transactionsData);
            XLSX.utils.book_append_sheet(wb, transactionsWS, 'Transactions');

            const fileName = `transactions_${dateFilter || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            this.showToast('Transactions exported to Excel successfully!');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Error exporting data. Please try again.', 'error');
        }
    }

    // Settings
    loadShopSettingsToUI() {
        document.getElementById('settingsShopName').value = this.shopSettings.shopName || '';
        document.getElementById('settingsShopAddress').value = this.shopSettings.address || '';
        document.getElementById('settingsShopPhone').value = this.shopSettings.phone || '';
        document.getElementById('settingsShopEmail').value = this.shopSettings.email || '';
        
        if (this.shopSettings.logo) {
            document.getElementById('shopLogo').src = this.shopSettings.logo;
            document.getElementById('shopLogo').style.display = 'block';
        }
        
        document.getElementById('shopNameDisplay').textContent = this.shopSettings.shopName || 'POS System';
    }

    handleLogoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const logoUrl = event.target.result;
                document.getElementById('logoPreview').innerHTML = `<img src="${logoUrl}" alt="Logo Preview">`;
                this.shopSettings.logo = logoUrl;
                document.getElementById('shopLogo').src = logoUrl;
                document.getElementById('shopLogo').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    saveShopSettingsToStorage() {
        this.shopSettings = {
            shopName: document.getElementById('settingsShopName').value.trim(),
            address: document.getElementById('settingsShopAddress').value.trim(),
            phone: document.getElementById('settingsShopPhone').value.trim(),
            email: document.getElementById('settingsShopEmail').value.trim(),
            logo: this.shopSettings.logo || ''
        };

        this.saveShopSettings();
        this.loadShopSettingsToUI();
        this.showToast('Shop settings saved successfully!');
    }

    renderCategories() {
        const container = document.getElementById('categoriesList');
        if (!container) return;
        
        if (this.categories.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary);padding:20px;">No categories found. Add your first category!</p>';
            return;
        }
        
        container.innerHTML = this.categories.map(category => `
            <div class="user-item">
                <div class="user-item-info">
                    <h4>${category.name}</h4>
                    <p>${category.description || 'No description'}</p>
                </div>
                <div class="user-item-actions">
                    ${this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'manager') ? `
                        <button class="action-btn edit" onclick="pos.openCategoryModal(${category.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="pos.deleteCategory(${category.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    openCategoryModal(categoryId = null) {
        if (this.currentUser && this.currentUser.role !== 'admin' && this.currentUser.role !== 'manager') {
            this.showToast('Only admin and manager can manage categories', 'error');
            return;
        }

        this.editingCategoryId = categoryId;
        const modal = document.getElementById('categoryModal');
        const title = document.getElementById('categoryModalTitle');
        
        if (categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            if (category) {
                title.innerHTML = '<i class="fas fa-edit"></i> Edit Category';
                document.getElementById('categoryName').value = category.name;
                document.getElementById('categoryDescription').value = category.description || '';
            }
        } else {
            title.innerHTML = '<i class="fas fa-tag"></i> Add Category';
            document.getElementById('categoryName').value = '';
            document.getElementById('categoryDescription').value = '';
        }

        modal.classList.add('active');
    }

    closeCategoryModal() {
        document.getElementById('categoryModal').classList.remove('active');
        this.editingCategoryId = null;
    }

    saveCategory() {
        const name = document.getElementById('categoryName').value.trim();
        const description = document.getElementById('categoryDescription').value.trim();

        if (!name) {
            this.showToast('Please enter category name', 'error');
            return;
        }

        if (this.editingCategoryId) {
            const index = this.categories.findIndex(c => c.id === this.editingCategoryId);
            if (index !== -1) {
                // Check if name already exists (excluding current category)
                const nameExists = this.categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== this.editingCategoryId);
                if (nameExists) {
                    this.showToast('Category name already exists', 'error');
                    return;
                }
                this.categories[index] = {
                    ...this.categories[index],
                    name,
                    description
                };
            }
            this.showToast('Category updated successfully!');
        } else {
            // Check if name already exists
            if (this.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                this.showToast('Category name already exists', 'error');
                return;
            }
            this.categories.push({
                id: Date.now(),
                name,
                description
            });
            this.showToast('Category added successfully!');
        }

        this.saveCategories();
        this.renderCategories();
        this.populateCategorySelect();
        this.updateCategoryFilter();
        this.closeCategoryModal();
    }

    deleteCategory(categoryId) {
        if (this.currentUser && this.currentUser.role !== 'admin' && this.currentUser.role !== 'manager') {
            this.showToast('Only admin and manager can delete categories', 'error');
            return;
        }

        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        // Check if any products use this category
        const productsUsingCategory = this.products.filter(p => p.category === category.name);
        if (productsUsingCategory.length > 0) {
            if (!confirm(`This category is used by ${productsUsingCategory.length} product(s). Delete anyway? Products will be moved to "Uncategorized".`)) {
                return;
            }
            // Remove category from products
            productsUsingCategory.forEach(product => {
                product.category = '';
            });
            this.saveProducts();
        }

        if (confirm(`Delete category "${category.name}"?`)) {
            this.categories = this.categories.filter(c => c.id !== categoryId);
            this.saveCategories();
            this.renderCategories();
            this.populateCategorySelect();
            this.updateCategoryFilter();
            this.renderProducts();
            this.showToast('Category deleted');
        }
    }

    renderUsers() {
        const container = document.getElementById('usersList');
        if (!container) return;
        
        if (this.users.length === 0) {
            container.innerHTML = '<p style="color:var(--text-secondary);padding:20px;">No users found</p>';
            return;
        }
        
        container.innerHTML = this.users.map(user => `
            <div class="user-item">
                <div class="user-item-info">
                    <h4>${user.username}</h4>
                    <p>Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                </div>
                <div class="user-item-actions">
                    ${this.currentUser && this.currentUser.role === 'admin' ? `
                        <button class="action-btn edit" onclick="pos.openUserModal(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.id !== this.currentUser.id ? `
                            <button class="action-btn delete" onclick="pos.deleteUser(${user.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    openUserModal(userId = null) {
        if (this.currentUser.role !== 'admin') {
            this.showToast('Only admin can manage users', 'error');
            return;
        }

        this.editingUserId = userId;
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        
        if (userId) {
            const user = this.users.find(u => u.id === userId);
            if (user) {
                title.innerHTML = '<i class="fas fa-user-edit"></i> Edit User';
                document.getElementById('userUsername').value = user.username;
                document.getElementById('userPassword').value = '';
                document.getElementById('userRole').value = user.role;
            }
        } else {
            title.innerHTML = '<i class="fas fa-user-plus"></i> Add User';
            document.getElementById('userUsername').value = '';
            document.getElementById('userPassword').value = '';
            document.getElementById('userRole').value = 'sales';
        }

        modal.classList.add('active');
    }

    closeUserModal() {
        document.getElementById('userModal').classList.remove('active');
        this.editingUserId = null;
    }

    saveUser() {
        if (this.currentUser.role !== 'admin') {
            this.showToast('Only admin can manage users', 'error');
            return;
        }

        const username = document.getElementById('userUsername').value.trim();
        const password = document.getElementById('userPassword').value.trim();
        const role = document.getElementById('userRole').value;

        if (!username || (!password && !this.editingUserId)) {
            this.showToast('Please fill all required fields', 'error');
            return;
        }

        if (this.editingUserId) {
            const index = this.users.findIndex(u => u.id === this.editingUserId);
            if (index !== -1) {
                this.users[index].username = username;
                if (password) {
                    this.users[index].password = password;
                }
                this.users[index].role = role;
            }
            this.showToast('User updated successfully!');
        } else {
            if (this.users.find(u => u.username === username)) {
                this.showToast('Username already exists', 'error');
                return;
            }
            this.users.push({
                id: Date.now(),
                username,
                password,
                role
            });
            this.showToast('User added successfully!');
        }

        this.saveUsers();
        this.renderUsers();
        this.closeUserModal();
    }

    deleteUser(userId) {
        if (this.currentUser.role !== 'admin') {
            this.showToast('Only admin can delete users', 'error');
            return;
        }

        if (userId === this.currentUser.id) {
            this.showToast('Cannot delete your own account', 'error');
            return;
        }

        if (confirm('Delete this user?')) {
            this.users = this.users.filter(u => u.id !== userId);
            this.saveUsers();
            this.renderUsers();
            this.showToast('User deleted');
        }
    }

    exportAllData() {
        try {
            // Create a new workbook
            const wb = XLSX.utils.book_new();

            // Users sheet
            const usersData = this.users.map(u => ({
                'ID': u.id,
                'Username': u.username,
                'Password': u.password,
                'Role': u.role
            }));
            const usersWS = XLSX.utils.json_to_sheet(usersData);
            XLSX.utils.book_append_sheet(wb, usersWS, 'Users');

            // Categories sheet
            const categoriesData = this.categories.map(c => ({
                'ID': c.id,
                'Name': c.name,
                'Description': c.description || ''
            }));
            const categoriesWS = XLSX.utils.json_to_sheet(categoriesData);
            XLSX.utils.book_append_sheet(wb, categoriesWS, 'Categories');

            // Products sheet
            const productsData = this.products.map(p => ({
                'ID': p.id,
                'Name': p.name,
                'Code': p.code || '',
                'Category': p.category || '',
                'Type': p.type || 'product',
                'MRP': p.mrp || p.price,
                'Sale Price': p.price,
                'Discount %': p.discount || '',
                'Quantity': p.quantity,
                'Description': p.description || '',
                'Image': p.image || ''
            }));
            const productsWS = XLSX.utils.json_to_sheet(productsData);
            XLSX.utils.book_append_sheet(wb, productsWS, 'Products');

            // Customers sheet
            const customersData = this.customers.map(c => ({
                'ID': c.id,
                'Name': c.name,
                'Phone': c.phone || '',
                'Email': c.email || '',
                'Address': c.address || ''
            }));
            const customersWS = XLSX.utils.json_to_sheet(customersData);
            XLSX.utils.book_append_sheet(wb, customersWS, 'Customers');

            // Transactions (Sales) sheet
            const transactionsData = this.transactions.map(t => {
                const payment = t.payment || { method: 'cash', amount: t.total };
                return {
                    'ID': t.id,
                    'Invoice Number': t.invoiceNumber,
                    'Date': t.date,
                    'Time': t.time,
                    'Customer ID': t.customerId || '',
                    'Customer Name': t.customerName,
                    'Items': JSON.stringify(t.items),
                    'Subtotal': t.subtotal,
                    'Tax': t.tax,
                    'Total': t.total,
                    'Payment Method': payment.method,
                    'Cash Received': payment.cashReceived || '',
                    'Return Amount': payment.returnAmount || '',
                    'Reference': payment.reference || '',
                    'User ID': t.userId,
                    'User Name': t.userName
                };
            });
            const transactionsWS = XLSX.utils.json_to_sheet(transactionsData);
            XLSX.utils.book_append_sheet(wb, transactionsWS, 'Sales Transactions');

            // Expenses sheet
            const expensesData = this.expenses.map(e => ({
                'ID': e.id,
                'Date': e.date,
                'Time': e.time,
                'Vendor': e.vendor || '',
                'Description': e.description,
                'Category': e.category || '',
                'Amount': e.amount,
                'Payment Method': e.paymentMethod || 'cash',
                'Reference': e.reference || ''
            }));
            if (expensesData.length > 0) {
                const expensesWS = XLSX.utils.json_to_sheet(expensesData);
                XLSX.utils.book_append_sheet(wb, expensesWS, 'Expenses');
            }

            // Shop Settings sheet
            const settingsData = [{
                'Shop Name': this.shopSettings.shopName || '',
                'Address': this.shopSettings.address || '',
                'Phone': this.shopSettings.phone || '',
                'Email': this.shopSettings.email || '',
                'Logo': this.shopSettings.logo || ''
            }];
            const settingsWS = XLSX.utils.json_to_sheet(settingsData);
            XLSX.utils.book_append_sheet(wb, settingsWS, 'Shop Settings');

            // Export date sheet
            const exportData = [{
                'Export Date': new Date().toISOString(),
                'Version': '1.0'
            }];
            const exportWS = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, exportWS, 'Export Info');

            // Write file
            const fileName = `pos_backup_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            this.showToast('Data exported to Excel successfully!');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Error exporting data. Please try again.', 'error');
        }
    }

    importAllData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                if (!confirm('This will replace all current data. Continue?')) {
                    e.target.value = '';
                    return;
                }

                // Read Users sheet
                if (workbook.SheetNames.includes('Users')) {
                    const usersSheet = workbook.Sheets['Users'];
                    const usersData = XLSX.utils.sheet_to_json(usersSheet);
                    this.users = usersData.map(u => ({
                        id: u.ID,
                        username: u.Username,
                        password: u.Password,
                        role: u.Role
                    }));
                }

                // Read Categories sheet
                if (workbook.SheetNames.includes('Categories')) {
                    const categoriesSheet = workbook.Sheets['Categories'];
                    const categoriesData = XLSX.utils.sheet_to_json(categoriesSheet);
                    this.categories = categoriesData.map(c => ({
                        id: c.ID,
                        name: c.Name,
                        description: c.Description || ''
                    }));
                }

                // Read Products sheet
                if (workbook.SheetNames.includes('Products')) {
                    const productsSheet = workbook.Sheets['Products'];
                    const productsData = XLSX.utils.sheet_to_json(productsSheet);
                    this.products = productsData.map(p => {
                        const mrp = p.MRP || p['Sale Price'] || p.Price || 0;
                        const salePrice = p['Sale Price'] || p.Price || 0;
                        const discount = p['Discount %'] || (mrp > 0 ? ((mrp - salePrice) / mrp * 100).toFixed(2) : '0');
                        return {
                            id: p.ID,
                            name: p.Name,
                            code: p.Code || '',
                            category: p.Category || '',
                            type: p.Type || 'product',
                            mrp: mrp,
                            price: salePrice,
                            discount: discount,
                            quantity: p.Quantity,
                            description: p.Description || '',
                            image: p.Image || ''
                        };
                    });
                }

                // Read Customers sheet
                if (workbook.SheetNames.includes('Customers')) {
                    const customersSheet = workbook.Sheets['Customers'];
                    const customersData = XLSX.utils.sheet_to_json(customersSheet);
                    this.customers = customersData.map(c => ({
                        id: c.ID,
                        name: c.Name,
                        phone: c.Phone || '',
                        email: c.Email || '',
                        address: c.Address || ''
                    }));
                }

                // Read Sales Transactions sheet
                if (workbook.SheetNames.includes('Sales Transactions') || workbook.SheetNames.includes('Transactions')) {
                    const sheetName = workbook.SheetNames.includes('Sales Transactions') ? 'Sales Transactions' : 'Transactions';
                    const transactionsSheet = workbook.Sheets[sheetName];
                    const transactionsData = XLSX.utils.sheet_to_json(transactionsSheet);
                    this.transactions = transactionsData.map(t => {
                        const payment = {
                            method: t['Payment Method'] || 'cash',
                            amount: t.Total,
                            cashReceived: t['Cash Received'] || null,
                            returnAmount: t['Return Amount'] || null,
                            reference: t['Reference'] || null
                        };
                        return {
                            id: t.ID,
                            invoiceNumber: t['Invoice Number'],
                            date: t.Date,
                            time: t.Time,
                            customerId: t['Customer ID'] || null,
                            customerName: t['Customer Name'],
                            items: typeof t.Items === 'string' ? JSON.parse(t.Items) : t.Items,
                            subtotal: t.Subtotal,
                            tax: t.Tax,
                            total: t.Total,
                            payment: payment,
                            userId: t['User ID'],
                            userName: t['User Name']
                        };
                    });
                }

                // Read Expenses sheet
                if (workbook.SheetNames.includes('Expenses')) {
                    const expensesSheet = workbook.Sheets['Expenses'];
                    const expensesData = XLSX.utils.sheet_to_json(expensesSheet);
                    this.expenses = expensesData.map(e => ({
                        id: e.ID,
                        date: e.Date,
                        time: e.Time,
                        vendor: e.Vendor || '',
                        description: e.Description,
                        category: e.Category || '',
                        amount: e.Amount,
                        paymentMethod: e['Payment Method'] || 'cash',
                        reference: e.Reference || ''
                    }));
                }

                // Read Shop Settings sheet
                if (workbook.SheetNames.includes('Shop Settings')) {
                    const settingsSheet = workbook.Sheets['Shop Settings'];
                    const settingsData = XLSX.utils.sheet_to_json(settingsSheet);
                    if (settingsData.length > 0) {
                        const s = settingsData[0];
                        this.shopSettings = {
                            shopName: s['Shop Name'] || '',
                            address: s['Address'] || '',
                            phone: s['Phone'] || '',
                            email: s['Email'] || '',
                            logo: s['Logo'] || ''
                        };
                    }
                }

                // Save all data
                this.saveUsers();
                this.saveCategories();
                this.saveProducts();
                this.saveCustomers();
                this.saveTransactions();
                this.saveExpenses();
                this.saveShopSettings();

                // Refresh UI
                this.renderProducts();
                this.renderCustomers();
                this.renderTransactions();
                this.loadShopSettingsToUI();
                this.loadQuickProducts();
                this.loadCustomerSelect();
                this.renderUsers();
                this.updateCategoryFilter();

                this.showToast('Data imported successfully!');
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Invalid file format or error reading file', 'error');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    }

    clearAllData() {
        if (confirm('This will delete ALL data. Are you absolutely sure?')) {
            if (confirm('This action cannot be undone. Type "DELETE" to confirm.')) {
                localStorage.removeItem('posUsers');
                localStorage.removeItem('posCategories');
                localStorage.removeItem('posProducts');
                localStorage.removeItem('posCustomers');
                localStorage.removeItem('posTransactions');
                localStorage.removeItem('posShopSettings');
                
                this.users = this.loadUsers();
                this.categories = this.loadCategories();
                this.products = [];
                this.customers = [];
                this.transactions = [];
                this.expenses = [];
                this.shopSettings = this.loadShopSettings();

                this.saveUsers();
                this.saveCategories();
                this.saveProducts();
                this.saveCustomers();
                this.saveTransactions();
                this.saveExpenses();
                this.saveShopSettings();

                this.renderProducts();
                this.renderCustomers();
                this.renderTransactions();
                this.loadShopSettingsToUI();
                this.loadQuickProducts();
                this.loadCustomerSelect();
                this.renderCategories();
                this.updateCategoryFilter();
                this.showToast('All data cleared');
            }
        }
    }

    // Utility Functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the application
let pos;
document.addEventListener('DOMContentLoaded', () => {
    try {
        pos = new POSSystem();
    } catch (error) {
        console.error('Error initializing POS System:', error);
        alert('Error initializing application. Please refresh the page.');
    }
});
