# Barcode Generator

A free, lightweight, client-side barcode generator application. Create custom barcodes instantly in your browser and download them as PNG or SVG files.

## Features

-   **Multiple Formats**: Supports a wide range of barcode standards:
    -   Code 128 (Default)
    -   Code 39
    -   EAN-13
    -   UPC
    -   EAN-8
    -   ITF-14
    -   MSI
    -   Pharmacode
-   **Customizable Design**:
    -   Adjust bar color and background color.
    -   Toggle human-readable text visibility.
-   **Export Options**: Download generated barcodes as high-quality **PNG** images or scalable **SVG** vectors.
-   **API-like Functionality**: Generate barcodes dynamically via URL parameters for easy sharing or embedding.

## How to Use

1.  **Enter Value**: Type the text or numbers you want to encode.
2.  **Select Format**: Choose the appropriate barcode standard (e.g., EAN-13 for retail products).
3.  **Customize**: Pick colors for the bars and background. Uncheck "Show Text" if you only want the bars.
4.  **Download**: Click "PNG" or "SVG" to save the barcode to your device.

## API / URL Parameters

You can generate specific barcodes by constructing a URL with the following parameters. This is useful for linking to pre-configured barcodes.

**Base URL:**
`https://robinthomasonline.github.io/apps/barcode/`

### Parameters

| Parameter | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `value` | The data to encode. | `123456789` | `?value=Product-001` |
| `format` | The barcode standard to use. | `CODE128` | `?format=EAN13` |
| `text` | Visibility of the text label (`true`/`false`). | `true` | `?text=false` |
| `type` | Alias for `format`. | - | `?type=UPC` |

### Examples

-   **Standard Code 128:**
    [`?value=Hello_World&format=CODE128`](https://robinthomasonline.github.io/apps/barcode/?value=Hello_World&format=CODE128)

-   **EAN-13 Product Code:**
    [`?value=1234567890128&format=EAN13`](https://robinthomasonline.github.io/apps/barcode/?value=1234567890128&format=EAN13)

-   **Hidden Text (Bars Only):**
    [`?value=987654321&text=false`](https://robinthomasonline.github.io/apps/barcode/?value=987654321&text=false)

## Development

This application is built with vanilla HTML, CSS, and JavaScript. It utilizes the [JsBarcode](https://github.com/lindell/JsBarcode) library for rendering.

-   **index.html**: Main structure.
-   **barcode.css**: Styling (Dark mode, glassmorphism).
-   **barcode.js**: Application logic and parameter handling.
