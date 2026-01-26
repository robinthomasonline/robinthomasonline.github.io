# POS & Billing System

A comprehensive Point of Sale (POS) and Billing System for small shops and retail businesses. Features barcode/QR code scanning, product management, customer management, invoicing, and day book functionality.

## Features

### Core Features
- **Barcode & QR Code Scanning** - Scan barcodes and QR codes to quickly add products to cart
- **Product Management** - Add, edit, delete products with images, categories, and inventory tracking
- **Customer Management** - Manage customer database with contact information
- **POS Interface** - Intuitive point of sale interface with cart management
- **Invoice Generation** - Generate and print professional invoices
- **Day Book** - Track all transactions with filtering and export capabilities
- **Shop Customization** - Customize shop name, logo, and contact information

### User Management
- **Role-Based Access Control** - Three user roles:
  - **Admin** - Full access to all features including user management
  - **Shop Manager** - Access to POS, products, customers, day book, and settings
  - **Sale Person** - Access to POS, products, customers, and day book (no settings)

### Product Features
- Product name, code/barcode, category, type (product/service)
- Price and quantity tracking
- Product images
- Search by name or code
- Quick product access in POS

### Customer Features
- Customer name, phone, email, address
- Quick customer selection during checkout
- Customer history in transactions

### Invoice Features
- Professional invoice layout
- Shop information and logo
- Customer details
- Itemized billing
- Print functionality

### Day Book Features
- View all transactions
- Filter by date
- Summary statistics (total sales, transactions, items sold)
- Export to CSV
- View invoice from day book

### Data Management
- Export all data (JSON format)
- Import data backup
- Clear all data option
- Local storage persistence

## Default Users

The system comes with three default users:

1. **Admin**
   - Username: `admin`
   - Password: `admin`
   - Role: Admin

2. **Shop Manager**
   - Username: `manager`
   - Password: `manager`
   - Role: Shop Manager

3. **Sale Person**
   - Username: `sales`
   - Password: `sales`
   - Role: Sale Person

**Important:** Change default passwords after first login for security.

## Usage

### Getting Started

1. Open `index.html` in a web browser
2. Login with one of the default users
3. Configure shop settings (name, logo, contact info)
4. Add products to your inventory
5. Start processing sales!

### Adding Products

1. Navigate to **Products** page
2. Click **Add Product**
3. Fill in product details:
   - Name (required)
   - Code/Barcode (auto-generated if empty)
   - Category
   - Type (Product/Service)
   - Price (required)
   - Quantity (required)
   - Description
   - Image (optional)
4. Click **Save Product**

### Processing a Sale

1. Navigate to **POS** page
2. Add products to cart by:
   - Searching by name
   - Scanning barcode/QR code
   - Clicking quick products
   - Using "Add by Code" button
3. Select customer (optional)
4. Review cart and totals
5. Click **Checkout**
6. Invoice will be generated automatically

### Managing Customers

1. Navigate to **Customers** page
2. Click **Add Customer**
3. Fill in customer details
4. Save customer
5. Customers can be selected during checkout

### Viewing Day Book

1. Navigate to **Day Book** page
2. View summary statistics
3. Filter transactions by date
4. Click **View** to see invoice
5. Export data using **Export** button

### Customizing Shop

1. Navigate to **Settings** page (Admin/Manager only)
2. Update shop information:
   - Shop name
   - Address
   - Phone
   - Email
   - Logo (upload image)
3. Click **Save Shop Settings**

### Managing Users

1. Navigate to **Settings** page (Admin only)
2. View all users
3. Click **Add User** to create new user
4. Edit or delete existing users

## Barcode/QR Code Scanning

### Barcode Scanner
- Click **Scan Barcode** button in POS
- Grant camera permission
- Point camera at barcode
- Product will be automatically added to cart
- Or enter barcode manually

### QR Code Scanner
- Click **Scan QR** button in POS
- Grant camera permission
- Point camera at QR code
- Product will be automatically added to cart
- Or enter QR code manually

**Note:** Camera access is required for scanning. If camera is not available, you can manually enter codes.

## Data Export/Import

### Export Data
1. Go to **Settings** page
2. Click **Export All Data (Excel)**
3. Excel file (.xlsx) will be downloaded with multiple sheets:
   - **Users** - All user accounts
   - **Products** - Product inventory
   - **Customers** - Customer database
   - **Transactions** - Sales transactions
   - **Shop Settings** - Shop configuration
   - **Export Info** - Export metadata
4. Keep this file as backup

### Import Data
1. Go to **Settings** page
2. Click **Import Data (Excel)**
3. Select previously exported Excel file (.xlsx)
4. Confirm import
5. All data will be restored from the Excel file

### Automatic Backup on Logout
- When logging out, the system will prompt you to create a backup
- Click **OK** to export all data to Excel before logging out
- This ensures you always have a recent backup

## Responsive Design

The system is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile phones
- Different screen sizes

## Browser Compatibility

Works on all modern browsers:
- Chrome
- Firefox
- Safari
- Edge
- Opera

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Local Storage API
- JsBarcode (for barcode generation)
- QRCode.js (for QR code generation)
- Html5Qrcode (for QR code scanning)

## Files

- `index.html` - Main application file
- `pos.css` - Stylesheet
- `pos.js` - Application logic
- `README.md` - This file

## Local Storage

All data is stored locally in your browser using Local Storage API:
- `posUsers` - User accounts
- `posProducts` - Product inventory
- `posCustomers` - Customer database
- `posTransactions` - Sales transactions
- `posShopSettings` - Shop configuration
- `posCurrentUser` - Current logged-in user

**Important:** Clearing browser data will delete all stored information. Always export backups regularly.

## Security Notes

- This is a client-side application with no backend
- All data is stored locally in the browser
- Default passwords should be changed immediately
- For production use, consider implementing proper authentication
- Regular data backups are recommended

## Future Enhancements

Potential features for future versions:
- Tax configuration
- Discounts and promotions
- Payment methods tracking
- Receipt templates
- Multi-shop support
- Cloud sync
- Reports and analytics
- Inventory alerts

## Support

For feature requests or bug reports, contact:
- Email: robinthomasonline@gmail.com
- Website: https://robinthomasonline.github.io/

## License

Free to use for personal and commercial purposes.

## Credits

Developed by [Robin Thomas](https://robinthomasonline.github.io/)
